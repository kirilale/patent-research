const express = require('express');
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');
const { auth } = require('./auth');
const { toNodeHandler } = require('better-auth/node');
const { inngestHandler } = require('./inngest');
const { inngest } = require('./inngest/client');
const newsletterRouter = require('./routes/newsletter');
const patentCardRouter = require('./routes/patentCard');
const { getContactStatus } = require('./lib/emailoctopus');
const { siteConfig, linksConfig } = require('./config/links');
const { pool } = require('./lib/db');
const { checkAuthRateLimit } = require('./lib/rate-limit');
const { toTitleCase } = require('./lib/textUtils');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://esm.sh", "https://analytics.futureofgaming.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'", "data:"],
    },
  },
}));

// Request logging
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// Set up EJS as template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Make site config, links, and utility functions available to all views
app.use((req, res, next) => {
  res.locals.siteConfig = siteConfig;
  res.locals.linksConfig = linksConfig;
  res.locals.toTitleCase = toTitleCase;
  next();
});

// JSON middleware with size limits (needed by Inngest and newsletter routes)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Rate limiting middleware for auth endpoints
app.use('/api/auth/*', async (req, res, next) => {
  // Skip rate limiting for session checks (GET requests)
  if (req.method === 'GET') {
    return next();
  }
  
  const rateLimit = await checkAuthRateLimit(req);
  if (rateLimit.limited) {
    return res.status(429).json({ 
      error: rateLimit.message,
      retryAfter: 900 // 15 minutes in seconds
    });
  }
  
  next();
});

// Better-auth middleware
app.use('/api/auth', toNodeHandler(auth));

// Inngest endpoint (needs express.json() before it)
app.use('/api/inngest', inngestHandler);

// Newsletter routes
app.use('/api/newsletter', newsletterRouter);

// Patent card image generation routes
app.use('/api/patent-card', patentCardRouter);

// Helper function to get current user session
async function getSession(req) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    return session;
  } catch (error) {
    return null;
  }
}

// Track sessions that have already emitted login events
const emittedLoginEvents = new Set();

// Helper function to emit login event for newsletter subscription (only once per session)
async function emitLoginEvent(req) {
  try {
    const session = await getSession(req);
    if (session?.user) {
      const sessionKey = `${session.user.id}-${session.session.id}`;
      
      // Only emit if we haven't already for this session
      if (!emittedLoginEvents.has(sessionKey)) {
        await inngest.send({
          name: 'user.logged_in',
          data: {
            userId: session.user.id,
            email: session.user.email,
            name: session.user.name || '',
          },
        });
        emittedLoginEvents.add(sessionKey);
        console.log(`[Inngest] Login event emitted for ${session.user.email}`);
      }
    }
  } catch (error) {
    console.error('[Inngest] Error emitting login event:', error);
    // Don't fail the request if Inngest event fails
  }
}

// Routes
app.get('/login', (req, res) => {
  const baseURL = process.env.NODE_ENV === 'production' 
    ? process.env.BETTER_AUTH_URL 
    : 'http://localhost:3000';
  
  res.render('login', {
    baseURL: baseURL
  });
});

app.get('/loading', async (req, res) => {
  await emitLoginEvent(req);
  res.render('loading');
});

app.get('/about', async (req, res) => {
  const session = await getSession(req);
  res.render('about', { user: session?.user || null });
});

app.get('/settings', async (req, res) => {
  const session = await getSession(req);
  
  if (!session?.user) {
    return res.redirect('/login');
  }
  
  try {
    // Get newsletter status from EmailOctopus (source of truth)
    let newsletterStatus = null;
    try {
      const eoStatus = await getContactStatus(session.user.email);
      // Map EmailOctopus status to our UI status
      if (eoStatus === 'SUBSCRIBED') newsletterStatus = 'subscribed';
      else if (eoStatus === 'UNSUBSCRIBED') newsletterStatus = 'unsubscribed';
      // null means not in EmailOctopus at all
    } catch (err) {
      console.error('Error checking EmailOctopus status:', err);
      // If EmailOctopus check fails, default to null
    }
    
    res.render('settings', { 
      user: session.user, 
      newsletterStatus 
    });
  } catch (err) {
    console.error('Error fetching settings:', err);
    res.status(500).send('Server error');
  }
});

app.get('/', async (req, res) => {
  const session = await getSession(req);
  try {
    // Get featured patent (most recently published)
    const featuredQuery = `
      SELECT 
        p.patent_id,
        p.patent_number,
        p.title,
        p.abstract,
        p.filing_date,
        p.grant_date,
        p.published_date,
        ad.executive_summary,
        ad.scores,
        array_agg(DISTINCT a.assignee_name) as assignees
      FROM patents p
      INNER JOIN ai_analysis_deep ad ON p.patent_id = ad.patent_id
      LEFT JOIN patent_assignees pa ON p.patent_id = pa.patent_id
      LEFT JOIN assignees a ON pa.assignee_id = a.assignee_id
      WHERE ad.executive_summary IS NOT NULL
        AND p.published_date IS NOT NULL
      GROUP BY p.patent_id, p.patent_number, p.title, p.abstract, 
               p.filing_date, p.grant_date, p.published_date, ad.executive_summary, ad.scores
      ORDER BY p.published_date DESC
      LIMIT 1
    `;
    
    const featuredResult = await pool.query(featuredQuery);
    const featured = featuredResult.rows[0] || null;

    // Get recent patents with deep analysis (excluding featured)
    const recentQuery = `
      SELECT 
        p.patent_id,
        p.patent_number,
        p.title,
        p.abstract,
        p.filing_date,
        p.grant_date,
        p.published_date,
        ad.scores,
        array_agg(DISTINCT a.assignee_name) as assignees
      FROM patents p
      INNER JOIN ai_analysis_deep ad ON p.patent_id = ad.patent_id
      LEFT JOIN patent_assignees pa ON p.patent_id = pa.patent_id
      LEFT JOIN assignees a ON pa.assignee_id = a.assignee_id
      WHERE ad.executive_summary IS NOT NULL
        AND p.published_date IS NOT NULL
        AND ($1::uuid IS NULL OR p.patent_id != $1)
      GROUP BY p.patent_id, p.patent_number, p.title, p.abstract, 
               p.filing_date, p.grant_date, p.published_date, ad.scores
      ORDER BY p.published_date DESC, p.created_at DESC
      LIMIT 3
    `;
    
    const recentResult = await pool.query(recentQuery, [featured?.patent_id || null]);
    const recentPatents = recentResult.rows;

    // Get newsletter status if user is logged in (check EmailOctopus)
    let newsletterStatus = null;
    if (session?.user) {
      try {
        const eoStatus = await getContactStatus(session.user.email);
        if (eoStatus === 'SUBSCRIBED') newsletterStatus = 'subscribed';
        else if (eoStatus === 'UNSUBSCRIBED') newsletterStatus = 'unsubscribed';
      } catch (err) {
        console.error('Error checking EmailOctopus status:', err);
      }
    }

    res.render('index', { 
      featured, 
      recentPatents, 
      user: session?.user || null,
      newsletterStatus 
    });
  } catch (err) {
    console.error('Error fetching patents:', err);
    res.status(500).send('Server error');
  }
});

app.get('/patent/:patentNumber', async (req, res) => {
  try {
    const { patentNumber } = req.params;
    
    const query = `
      SELECT 
        p.*,
        ad.executive_summary,
        ad.technology_deep_dive,
        ad.bottom_line,
        ad.practical_applications,
        ad.what_this_looks_like,
        ad.scenarios,
        ad.audience_takeaways,
        ad.competitive_landscape,
        ad.reality_check,
        ad.implementation_analysis,
        ad.market_context,
        ad.risk_assessment,
        ad.what_to_watch,
        ad.final_take,
        ad.scores,
        ad.competitive_impact,
        array_agg(DISTINCT a.assignee_name) as assignees,
        array_agg(DISTINCT i.full_name) as inventors
      FROM patents p
      INNER JOIN ai_analysis_deep ad ON p.patent_id = ad.patent_id
      LEFT JOIN patent_assignees pa ON p.patent_id = pa.patent_id
      LEFT JOIN assignees a ON pa.assignee_id = a.assignee_id
      LEFT JOIN patent_inventors pi ON p.patent_id = pi.patent_id
      LEFT JOIN inventors i ON pi.inventor_id = i.inventor_id
      WHERE p.patent_number = $1
        AND p.published_date IS NOT NULL
      GROUP BY p.patent_id, ad.deep_analysis_id
    `;
    
    const session = await getSession(req);
    const result = await pool.query(query, [patentNumber]);
    
    if (result.rows.length === 0) {
      return res.status(404).send('Patent not found or no deep analysis available');
    }
    
    // Get newsletter status if user is logged in
    let newsletterStatus = null;
    if (session?.user) {
      try {
        const eoStatus = await getContactStatus(session.user.email);
        if (eoStatus === 'SUBSCRIBED') newsletterStatus = 'subscribed';
        else if (eoStatus === 'UNSUBSCRIBED') newsletterStatus = 'unsubscribed';
      } catch (err) {
        console.error('Error checking EmailOctopus status:', err);
      }
    }
    
    const patent = result.rows[0];
    
    // Get previous and next patents for navigation (optimized with window functions)
    const navQuery = `
      WITH numbered AS (
        SELECT 
          p.patent_number,
          LAG(p.patent_number) OVER (ORDER BY p.published_date DESC, p.created_at DESC) as prev_patent,
          LEAD(p.patent_number) OVER (ORDER BY p.published_date DESC, p.created_at DESC) as next_patent
        FROM patents p
        INNER JOIN ai_analysis_deep ad ON p.patent_id = ad.patent_id
        WHERE ad.executive_summary IS NOT NULL
          AND p.published_date IS NOT NULL
      )
      SELECT prev_patent, next_patent 
      FROM numbered 
      WHERE patent_number = $1
    `;
    const navResult = await pool.query(navQuery, [patentNumber]);
    const navData = navResult.rows[0];
    
    const previousPatent = navData?.prev_patent ? { patent_number: navData.prev_patent } : null;
    const nextPatent = navData?.next_patent ? { patent_number: navData.next_patent } : null;
    
    res.render('patent', { 
      patent, 
      user: session?.user || null, 
      newsletterStatus,
      previousPatent,
      nextPatent
    });
  } catch (err) {
    console.error('Error fetching patent:', err);
    res.status(500).send('Server error');
  }
});

app.get('/archive', async (req, res) => {
  try {
    const query = `
      SELECT 
        p.patent_id,
        p.patent_number,
        p.title,
        p.abstract,
        p.filing_date,
        p.grant_date,
        p.published_date,
        ad.executive_summary,
        ad.scores,
        array_agg(DISTINCT a.assignee_name) as assignees
      FROM patents p
      INNER JOIN ai_analysis_deep ad ON p.patent_id = ad.patent_id
      LEFT JOIN patent_assignees pa ON p.patent_id = pa.patent_id
      LEFT JOIN assignees a ON pa.assignee_id = a.assignee_id
      WHERE ad.executive_summary IS NOT NULL
        AND p.published_date IS NOT NULL
      GROUP BY p.patent_id, p.patent_number, p.title, p.abstract, 
               p.filing_date, p.grant_date, p.published_date, ad.executive_summary, ad.scores
      ORDER BY p.published_date DESC, p.created_at DESC
    `;
    
    const session = await getSession(req);
    const result = await pool.query(query);
    const patents = result.rows;
    
    // Get newsletter status if user is logged in
    let newsletterStatus = null;
    if (session?.user) {
      try {
        const eoStatus = await getContactStatus(session.user.email);
        if (eoStatus === 'SUBSCRIBED') newsletterStatus = 'subscribed';
        else if (eoStatus === 'UNSUBSCRIBED') newsletterStatus = 'unsubscribed';
      } catch (err) {
        console.error('Error checking EmailOctopus status:', err);
      }
    }
    
    res.render('archive', { patents, user: session?.user || null, newsletterStatus });
  } catch (err) {
    console.error('Error fetching archive:', err);
    res.status(500).send('Server error');
  }
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (err) {
    res.status(503).json({ 
      status: 'unhealthy', 
      error: process.env.NODE_ENV === 'production' ? 'Service unavailable' : err.message 
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', { user: null });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({ error: 'Internal server error' });
  } else {
    res.status(500).json({ 
      error: err.message,
      stack: err.stack 
    });
  }
});

// Bind to 0.0.0.0 in production (for Docker), localhost in development
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

const server = app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server gracefully...');
  server.close(() => {
    console.log('Server closed');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, closing server gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
