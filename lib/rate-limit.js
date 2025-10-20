const { Redis } = require('@upstash/redis');
const { Ratelimit } = require('@upstash/ratelimit');

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Create rate limiter instances
const newsletterLimiter = new Ratelimit({
  redis,
  analytics: true,
  limiter: Ratelimit.slidingWindow(3, '24 h'), // 3 attempts per 24 hours
  prefix: 'newsletter',
});

const authLimiter = new Ratelimit({
  redis,
  analytics: true,
  limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 attempts per 15 minutes
  prefix: 'auth',
});

// Rate limit configurations
const RATE_LIMITS = {
  newsletter: {
    maxAttempts: 3,
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    message: 'Too many subscription attempts. Please try again in 24 hours.'
  },
  auth: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many login attempts. Please try again in 15 minutes.'
  }
};

/**
 * Get client IP address from request
 * @param {Request} req - Express request object
 * @returns {string} IP address
 */
function getClientIP(req) {
  const forwardedFor = req.headers['x-forwarded-for'];
  
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  return req.headers['x-real-ip'] || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress || 
         '0.0.0.0';
}

/**
 * Check if newsletter subscription is rate limited
 * @param {Request} req - Express request object
 * @param {string} email - Email address
 * @returns {Promise<Object>} { limited: boolean, remaining: number, message?: string }
 */
async function checkNewsletterRateLimit(req, email) {
  const ip = getClientIP(req);
  const config = RATE_LIMITS.newsletter;
  
  try {
    // Check both IP and email to prevent abuse
    const ipIdentifier = `ip:${ip}`;
    const emailIdentifier = `email:${email}`;
    
    // Check IP rate limit
    const ipResult = await newsletterLimiter.limit(ipIdentifier);
    
    // Check email rate limit
    const emailResult = await newsletterLimiter.limit(emailIdentifier);
    
    // If either is rate limited, return error
    if (!ipResult.success || !emailResult.success) {
      return {
        limited: true,
        remaining: 0,
        message: config.message
      };
    }
    
    return {
      limited: false,
      remaining: ipResult.remaining
    };
  } catch (error) {
    console.error('[Rate Limit] Error checking rate limit:', error);
    // Fail open - allow the request if rate limiter fails
    return {
      limited: false,
      remaining: 3
    };
  }
}

/**
 * Check if auth request is rate limited
 * @param {Request} req - Express request object
 * @returns {Promise<Object>} { limited: boolean, remaining: number, message?: string }
 */
async function checkAuthRateLimit(req) {
  const ip = getClientIP(req);
  const config = RATE_LIMITS.auth;
  
  try {
    // Rate limit by IP for auth endpoints
    const identifier = `ip:${ip}`;
    const result = await authLimiter.limit(identifier);
    
    if (!result.success) {
      return {
        limited: true,
        remaining: 0,
        message: config.message,
        resetTime: result.reset
      };
    }
    
    return {
      limited: false,
      remaining: result.remaining
    };
  } catch (error) {
    console.error('[Rate Limit] Error checking auth rate limit:', error);
    // Fail open - allow the request if rate limiter fails
    return {
      limited: false,
      remaining: 5
    };
  }
}

module.exports = {
  newsletterLimiter,
  authLimiter,
  getClientIP,
  checkNewsletterRateLimit,
  checkAuthRateLimit,
  RATE_LIMITS
};
