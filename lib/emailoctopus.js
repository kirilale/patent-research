const EMAILOCTOPUS_API_KEY = process.env.EMAILOCTOPUS_API_KEY;
const EMAILOCTOPUS_LIST_ID = process.env.EMAILOCTOPUS_FOG_LIST;
const BASE_URL = 'https://emailoctopus.com/api/1.6';

/**
 * Subscribe a contact to the EmailOctopus list
 * @param {string} email - Email address
 * @param {string} firstName - First name
 * @param {string} lastName - Last name
 * @param {string} source - Subscription source (e.g., 'auth_login_auto_subscribe', 'subscribe_form')
 */
async function subscribeContact(email, firstName = '', lastName = '', source = 'subscribe_form') {
  const response = await fetch(
    `${BASE_URL}/lists/${EMAILOCTOPUS_LIST_ID}/contacts`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: EMAILOCTOPUS_API_KEY,
        email_address: email,
        fields: {
          FirstName: firstName,
          LastName: lastName,
        },
        tags: [source],
        status: 'SUBSCRIBED',
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`EmailOctopus API error: ${error.error?.message || 'Unknown error'}`);
  }

  return response.json();
}

/**
 * Check if a contact exists and their status
 */
async function getContactStatus(email) {
  // EmailOctopus uses MD5 hash of lowercase email as contact ID
  const crypto = require('crypto');
  const emailHash = crypto.createHash('md5').update(email.toLowerCase()).digest('hex');
  
  // Note: EmailOctopus API requires api_key in query params (not headers)
  // This is their API design, not a security issue on our end
  const response = await fetch(
    `${BASE_URL}/lists/${EMAILOCTOPUS_LIST_ID}/contacts/${emailHash}?api_key=${EMAILOCTOPUS_API_KEY}`
  );

  if (response.status === 404) {
    return null; // Contact doesn't exist
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`EmailOctopus API error: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.status; // 'SUBSCRIBED', 'UNSUBSCRIBED', 'PENDING'
}

module.exports = {
  subscribeContact,
  getContactStatus,
};
