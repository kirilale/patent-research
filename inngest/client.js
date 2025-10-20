const { Inngest } = require('inngest');

const inngest = new Inngest({ 
  id: 'future-of-gaming',
  eventKey: process.env.INNGEST_EVENT_KEY,
  // Use local dev server when not in production
  ...(process.env.NODE_ENV !== 'production' && {
    eventKey: undefined, // Don't use event key in dev
    inngestBaseUrl: 'http://127.0.0.1:8288',
  })
});

module.exports = { inngest };
