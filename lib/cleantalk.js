const CLEANTALK_API_KEY = process.env.CLEANTALK_API_KEY;
const CLEANTALK_API_URL = 'https://api.cleantalk.org/';

/**
 * Check if an email is spam using CleanTalk spam_check API
 * @param {string} email - Email address to check
 * @param {string} ip - IP address of the user (optional but recommended)
 * @returns {Promise<{isSpam: boolean, score: number, message: string}>}
 */
async function checkEmailSpam(email, ip = null) {
  if (!CLEANTALK_API_KEY) {
    console.warn('[CleanTalk] API key not configured, skipping spam check');
    return { isSpam: false, score: 0, message: 'Spam check disabled' };
  }

  try {
    // Build URL with query parameters as documented
    const params = new URLSearchParams({
      method_name: 'spam_check',
      auth_key: CLEANTALK_API_KEY,
      email: email
    });

    // Add IP if provided
    if (ip) {
      params.append('ip', ip);
    }

    const url = `${CLEANTALK_API_URL}?${params.toString()}`;
    
    const response = await fetch(url, {
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error(`CleanTalk API returned status ${response.status}`);
    }

    const result = await response.json();

    // Response format: {"data": {"email@example.com": {...}, "1.2.3.4": {...}}}
    if (!result.data) {
      throw new Error('Invalid API response format');
    }

    // Get email and IP data from response
    const emailData = result.data[email] || {};
    const ipData = ip ? result.data[ip] : {};

    // Determine if spam based on documented criteria
    const emailIsSpam = evaluateSpamScore(emailData);
    const ipIsSpam = ip ? evaluateSpamScore(ipData) : false;

    // Block if either email or IP is spam
    const isSpam = emailIsSpam || ipIsSpam;
    
    // Calculate combined score
    const emailScore = parseFloat(emailData.spam_rate || 0);
    const ipScore = parseFloat(ipData.spam_rate || 0);
    const score = Math.max(emailScore, ipScore);

    // Build message
    let message = 'Clean';
    if (emailIsSpam) {
      message = `Email flagged: appears=${emailData.appears}, spam_rate=${emailData.spam_rate}, frequency=${emailData.frequency}`;
    } else if (ipIsSpam) {
      message = `IP flagged: appears=${ipData.appears}, spam_rate=${ipData.spam_rate}, network_type=${ipData.network_type}`;
    }

    return {
      isSpam,
      score,
      message,
      details: {
        email: emailData,
        ip: ipData
      }
    };
  } catch (error) {
    console.error('[CleanTalk] Error checking email:', error.message);
    // Fail open - if CleanTalk is down, don't block legitimate users
    return { 
      isSpam: false, 
      score: 0, 
      message: 'Check failed, allowing by default',
      error: error.message 
    };
  }
}

/**
 * Evaluate if data indicates spam based on CleanTalk documentation
 * @param {Object} data - Email or IP data from CleanTalk
 * @returns {boolean} True if spam
 */
function evaluateSpamScore(data) {
  if (!data || Object.keys(data).length === 0) {
    return false; // No data means not in database, allow
  }

  const appears = parseInt(data.appears || 0);
  const spamRate = parseFloat(data.spam_rate || 0);
  const frequency = parseInt(data.frequency || 0);
  const disposableEmail = parseInt(data.disposable_email || 0);
  
  // Get days since last update
  const daysSinceUpdate = data.updated ? 
    Math.floor((Date.now() - new Date(data.updated).getTime()) / (1000 * 60 * 60 * 24)) : 
    999;

  // Apply documented filtering rules
  // 1. Currently blacklisted
  if (appears === 1) {
    return true;
  }

  // 2. Disposable email
  if (disposableEmail === 1) {
    return true;
  }

  // 3. High spam rate
  if (spamRate > 0.7) {
    return true;
  }

  // 4. Medium spam rate but old activity
  if (spamRate > 0.5 && daysSinceUpdate > 30) {
    return true;
  }

  // 5. 100% spam rate with multiple reports
  if (spamRate === 1 && frequency >= 5 && daysSinceUpdate < 30) {
    return true;
  }

  // 6. Very high frequency with recent activity
  if (frequency >= 200 && daysSinceUpdate < 90) {
    return true;
  }

  return false;
}

module.exports = {
  checkEmailSpam,
};
