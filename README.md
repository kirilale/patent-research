# Future of Gaming - Patent Intelligence Website

A dynamic Node.js/Express website that automatically generates pages for gaming patents with deep dive analysis.

## Features

- **Landing Page**: Showcases featured and recent patent analyses
- **Dynamic Patent Pages**: Automatically generated for each patent with deep dive analysis
- **Archive**: Browse all analyzed patents
- **White Theme**: Clean, modern design optimized for readability
- **Database-Driven**: Pulls data directly from PostgreSQL database

## Tech Stack

- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **Template Engine**: EJS
- **Styling**: Custom CSS (white theme)

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Edit `.env` with your database credentials:
```
DB_HOST=your_database_host
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_secure_password
PORT=3000

# Authentication
BETTER_AUTH_SECRET=your_secret_key
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Email Services
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=noreply@futureofgaming.com
EMAILOCTOPUS_API_KEY=your_emailoctopus_key
EMAILOCTOPUS_FOG_LIST=your_list_id

# Background Jobs
INNGEST_EVENT_KEY=your_inngest_event_key
INNGEST_SIGNING_KEY=your_inngest_signing_key

# Rate Limiting
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token
```

4. Run the development server:
```bash
npm run dev
```

5. Open http://localhost:3000

## Deployment on Coolify

### Prerequisites
- Coolify instance running
- PostgreSQL database accessible from your server

### Deploy Steps

1. **Create New Application in Coolify**
   - Go to your Coolify dashboard
   - Click "New Resource" → "Application"
   - Choose "Docker" as the build pack

2. **Configure Git Repository**
   - Connect your Git repository
   - Set the base directory to `/website` (if this folder is in a subdirectory)
   - Or push just the website folder to a separate repository

3. **Set Environment Variables**
   In Coolify, add these environment variables:
   ```
  See .env

4. **Configure Port**
   - Set the application port to `3000`
   - Coolify will automatically handle the reverse proxy

5. **Deploy**
   - Click "Deploy"
   - Coolify will build the Docker image and start the container

### Database Connection

The application connects to your PostgreSQL database using the credentials from your `.env` file.

Make sure:
- The database is accessible from your Coolify server
- Firewall rules allow connections from your server IP
- The database credentials are correct
- SSL/TLS is enabled for production databases

## How It Works

### Automatic Page Generation

The website automatically creates pages for patents that have:
- An entry in the `patents` table
- A corresponding entry in the `ai_analysis_deep` table with analysis data

When you add a new patent with deep dive analysis to the database, it will automatically appear on:
- The homepage (if it's the most recent)
- The archive page
- Its own dedicated page at `/patent/{patent_number}`

### Database Schema Used

**Tables:**
- `patents` - Patent information (title, abstract, dates, etc.)
- `ai_analysis_deep` - Deep dive analysis (executive summary, technology analysis, scores, etc.)
- `assignees` - Company/individual assignees
- `patent_assignees` - Links patents to assignees

## Project Structure

```
website/
├── server.js              # Express server and routes
├── package.json           # Dependencies
├── Dockerfile            # Docker configuration for deployment
├── .env.example          # Environment variables template
├── views/                # EJS templates
│   ├── index.ejs        # Homepage
│   ├── patent.ejs       # Patent detail page
│   ├── archive.ejs      # Archive listing
│   └── partials/        # Reusable components
│       ├── nav.ejs
│       └── footer.ejs
└── public/              # Static assets
    └── css/
        └── style.css    # White theme styles
```

## Adding New Patents

To add a new patent to the website:

1. Insert patent data into the `patents` table
2. Run AI analysis and insert into `ai_analysis_deep` table
3. The website will automatically display it

No code changes or redeployment needed!

## Customization

### Changing Colors
Edit `/public/css/style.css` to customize the design.

### Adding New Sections
Edit the EJS templates in `/views/` to add new sections or modify layout.

### Database Queries
Modify `/server.js` to change what data is displayed or add new routes.

## Support

For issues or questions, check the database connection and ensure all required fields are populated in the `ai_analysis_deep` table.
