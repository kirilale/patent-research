const { serve } = require('inngest/express');
const { inngest } = require('./client');
const { newsletterSubscription } = require('./functions/newsletter-subscription');
const { publishScheduledPatents } = require('./functions/publish-scheduled-patents');

const inngestHandler = serve({
  client: inngest,
  functions: [
    newsletterSubscription,
    publishScheduledPatents
  ],
  signingKey: process.env.INNGEST_SIGNING_KEY,
});

module.exports = { inngestHandler };
