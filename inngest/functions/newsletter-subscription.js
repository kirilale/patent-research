const { inngest } = require('../client');
const { subscribeContact, getContactStatus } = require('../../lib/emailoctopus');

const newsletterSubscription = inngest.createFunction(
  {
    id: 'newsletter-auto-subscribe',
    name: 'Auto-subscribe user to newsletter on login',
    retries: 3,
  },
  { event: 'user.logged_in' },
  async ({ event, step }) => {
    const { email, userId, name } = event.data;

    console.log(`[Newsletter] Processing login for ${email}`);

    // Check feature flag
    const autoSubscribe = await step.run('check-feature-flag', async () => {
      return process.env.AUTO_SUBSCRIBE_ON_LOGIN !== 'false';
    });

    if (!autoSubscribe) {
      console.log('[Newsletter] Auto-subscribe disabled by feature flag');
      return { skipped: true, reason: 'Feature flag disabled' };
    }

    // Check EmailOctopus - the only source of truth
    const eoStatus = await step.run('check-emailoctopus-status', async () => {
      return await getContactStatus(email);
    });

    console.log(`[Newsletter] EmailOctopus status for ${email}: ${eoStatus}`);

    // If user unsubscribed in EmailOctopus, respect that
    if (eoStatus === 'UNSUBSCRIBED') {
      console.log('[Newsletter] User unsubscribed in EmailOctopus, skipping');
      return { skipped: true, reason: 'User unsubscribed in EmailOctopus' };
    }

    // If already subscribed in EmailOctopus, skip
    if (eoStatus === 'SUBSCRIBED') {
      console.log('[Newsletter] User already subscribed in EmailOctopus');
      return { skipped: true, reason: 'Already subscribed in EmailOctopus' };
    }

    // If not in EmailOctopus (null), subscribe them
    if (!eoStatus) {
      await step.run('subscribe-to-emailoctopus', async () => {
        const [firstName, ...lastNameParts] = (name || '').split(' ');
        await subscribeContact(email, firstName, lastNameParts.join(' '), 'auth_login_auto_subscribe');
      });

      console.log('[Newsletter] User auto-subscribed on login');
      return { subscribed: true };
    }

    return { skipped: true, reason: 'Unknown EmailOctopus status' };
  }
);

module.exports = { newsletterSubscription };
