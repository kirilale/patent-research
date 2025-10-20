const siteConfig = {
  name: 'Future of Gaming',
  url: process.env.NODE_ENV === 'production' ? 'https://futureofgaming.com' : (process.env.BETTER_AUTH_URL || 'http://localhost:3000'),
  description: 'Strategic intelligence on gaming\'s next moves',
};

const linksConfig = {
  author: 'https://alexejkirillov.com',
  twitter: 'https://x.com/alexejkirillov',
  linkedin: 'https://www.linkedin.com/in/alexejkirillov/',
  // facebook: 'https://www.facebook.com/61574841915293/',
  // bluesky: 'https://bsky.app/profile/futureofgaming.com',
  // instagram: 'https://www.instagram.com/contentcreators_com/',
  feed: `${siteConfig.url}/rss.xml`,
};

module.exports = {
  siteConfig,
  linksConfig,
};
