const { serve } = require('inngest/express');
const { inngest } = require('./client');
const { newsletterSubscription } = require('./functions/newsletter-subscription');

const inngestHandler = serve({
  client: inngest,
  functions: [newsletterSubscription],
  signingKey: process.env.INNGEST_SIGNING_KEY,
});

module.exports = { inngestHandler };
