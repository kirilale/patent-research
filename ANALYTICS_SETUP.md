# Umami Analytics Setup Guide

## Step 1: Deploy Umami on Coolify

### Option A: Using Coolify's Service Template (if available)
1. In Coolify dashboard, click "New Resource" → "Service"
2. Search for "Umami" in the templates
3. Configure and deploy

### Option B: Using Docker Compose
1. In Coolify, create a new "Docker Compose" service
2. Use this configuration:

```yaml
version: '3'
services:
  umami:
    image: ghcr.io/umami-software/umami:postgresql-latest
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://umami:umami_password@db:5432/umami
      DATABASE_TYPE: postgresql
      HASH_SALT: replace-with-random-string-min-32-chars
    depends_on:
      - db
    restart: always
  
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: umami
      POSTGRES_USER: umami
      POSTGRES_PASSWORD: umami_password
    volumes:
      - umami-db-data:/var/lib/postgresql/data
    restart: always

volumes:
  umami-db-data:
```

3. Generate a secure `HASH_SALT`:
```bash
openssl rand -base64 32
```

4. Set up a domain in Coolify (e.g., `analytics.futureofgaming.com`)
5. Deploy the service

## Step 2: Configure Umami

1. Access your Umami instance at `https://analytics.futureofgaming.com`
2. Login with default credentials:
   - Username: `admin`
   - Password: `umami`
3. **Change the password immediately!**
4. Go to Settings → Websites → Add Website
5. Enter:
   - Name: `Future of Gaming`
   - Domain: `futureofgaming.com`
6. Click "Save"
7. Copy the **Website ID** (looks like: `abc123-def456-ghi789`)
8. Click on "Tracking Code" to see your script

## Step 3: Add Environment Variables to Your App

In Coolify, add these environment variables to your main app:

```bash
UMAMI_WEBSITE_ID=abc123-def456-ghi789
UMAMI_URL=https://analytics.futureofgaming.com
```

## Step 4: Deploy

The analytics tracking is already integrated into all pages. Just:
1. Add the environment variables in Coolify
2. Redeploy your app
3. Visit your site and check Umami dashboard for tracking

## Features

- **Privacy-focused**: No cookies, GDPR compliant
- **Lightweight**: ~2KB script
- **Real-time**: See visitors in real-time
- **Custom events**: Track button clicks, form submissions, etc.

## Custom Event Tracking (Optional)

To track custom events (e.g., newsletter signups, patent views):

```javascript
// Track newsletter subscription
umami.track('newsletter-subscribe', { source: 'footer' });

// Track patent view
umami.track('patent-view', { patent: patentNumber });
```

## Troubleshooting

- **Not seeing data?** Check browser console for errors
- **CSP errors?** The script is already allowed in your CSP
- **Wrong domain?** Make sure `UMAMI_URL` matches your Umami deployment URL
