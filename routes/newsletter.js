const express = require('express');
const router = express.Router();
const validator = require('validator');
const { subscribeContact } = require('../lib/emailoctopus');
const { auth } = require('../auth');
const { pool } = require('../lib/db');
const { checkNewsletterRateLimit } = require('../lib/rate-limit');

router.post('/subscribe', async (req, res) => {
  const { email } = req.body;

  // Proper email validation
  if (!email || !validator.isEmail(email)) {
    return res.status(400).json({ error: 'Valid email required' });
  }
  
  // Sanitize email
  const sanitizedEmail = validator.normalizeEmail(email);

  // Check rate limit
  const rateLimit = await checkNewsletterRateLimit(req, email);
  if (rateLimit.limited) {
    return res.status(429).json({ 
      error: rateLimit.message,
      retryAfter: 86400 // 24 hours in seconds
    });
  }

  try {
    // Subscribe to EmailOctopus with source tracking (use sanitized email)
    await subscribeContact(sanitizedEmail, '', '', 'subscribe_form');

    // If user is logged in, update their status
    try {
      const session = await auth.api.getSession({ headers: req.headers });
      if (session?.user && session.user.email === sanitizedEmail) {
        await pool.query(
          'UPDATE "user" SET newsletter_status = $1 WHERE id = $2',
          ['subscribed', session.user.id]
        );
      }
    } catch (err) {
      // Session check failed, but subscription succeeded
      console.log('[Newsletter] Subscription succeeded, but session check failed');
    }

    res.json({ success: true, message: 'Subscribed successfully!' });
  } catch (error) {
    console.error('[Newsletter] Subscription error:', process.env.NODE_ENV === 'production' ? error.message : error);
    
    // Check if already subscribed
    if (error.message.includes('already subscribed') || error.message.includes('MEMBER_EXISTS_WITH_EMAIL_ADDRESS')) {
      return res.json({ success: true, message: 'Already subscribed!' });
    }
    
    const errorMessage = process.env.NODE_ENV === 'production' 
      ? 'Subscription failed. Please try again.' 
      : error.message;
    
    res.status(500).json({ error: errorMessage });
  }
});

module.exports = router;
