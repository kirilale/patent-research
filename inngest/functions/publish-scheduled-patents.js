const { inngest } = require('../client');
const { pool } = require('../../lib/db');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Scheduled function to publish patents that have reached their publish date
 * Runs daily at 2pm UTC (3pm CET in winter, 4pm CEST in summer)
 */
const publishScheduledPatents = inngest.createFunction(
  {
    id: 'publish-scheduled-patents',
    name: 'Publish Scheduled Patents',
  },
  { cron: '0 14 * * *' }, // Daily at 2pm UTC
  async ({ step }) => {
    
    // Step 1: Query scheduled patents that are ready to publish
    const patents = await step.run('query-scheduled-patents', async () => {
      const result = await pool.query(`
        SELECT 
          p.patent_id, 
          p.patent_number, 
          p.title, 
          p.published_date,
          a.assignee_name,
          ai.gaming_relevance_score
        FROM patents p
        LEFT JOIN patent_assignees pa ON p.patent_id = pa.patent_id AND pa.sequence_order = 0
        LEFT JOIN assignees a ON pa.assignee_id = a.assignee_id
        LEFT JOIN ai_analysis ai ON p.patent_id = ai.patent_id
        WHERE p.publish_status = 'scheduled'
          AND p.published_date <= NOW()
        ORDER BY p.published_date ASC
      `);
      
      console.log(`Found ${result.rows.length} patents ready to publish`);
      return result.rows;
    });

    // If no patents to publish, exit early
    if (patents.length === 0) {
      console.log('No patents to publish');
      return { 
        success: true,
        message: 'No patents to publish', 
        count: 0 
      };
    }

    // Step 2: Publish each patent
    const published = await step.run('publish-patents', async () => {
      const results = [];
      
      for (const patent of patents) {
        try {
          await pool.query(`
            UPDATE patents 
            SET publish_status = 'published'
            WHERE patent_id = $1
          `, [patent.patent_id]);
          
          console.log(`Published patent ${patent.patent_number}: ${patent.title}`);
          
          results.push({
            patent_id: patent.patent_id,
            patent_number: patent.patent_number,
            title: patent.title,
            company: patent.assignee_name || 'Unknown',
            score: patent.gaming_relevance_score || 0,
            published_date: patent.published_date
          });
        } catch (error) {
          console.error(`Error publishing patent ${patent.patent_number}:`, error);
          // Continue with other patents even if one fails
        }
      }
      
      return results;
    });

    // Step 3: Send email notification
    if (published.length > 0) {
      await step.run('send-notification', async () => {
        try {
          const html = generateEmailHTML(published);
          const subject = `✅ ${published.length} Patent Analysis Published - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
          
          await resend.emails.send({
            from: process.env.EMAIL_FROM || 'noreply@auth.futureofgaming.com',
            to: process.env.ADMIN_EMAIL || 'contact@futureofgaming.com',
            subject: subject,
            html: html
          });
          
          console.log(`Email notification sent for ${published.length} patents`);
        } catch (error) {
          console.error('Error sending email notification:', error);
          // Don't fail the entire function if email fails
        }
      });
    }

    return { 
      success: true,
      message: 'Patents published successfully', 
      count: published.length,
      patents: published
    };
  }
);

/**
 * Generate HTML email content for published patents
 */
function generateEmailHTML(patents) {
  const patentsList = patents.map(patent => `
    <li style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #eee;">
      <strong style="font-size: 16px; color: #333;">
        <a href="https://futureofgaming.com/patent/${patent.patent_number}" 
           style="color: #2563eb; text-decoration: none;">
          ${patent.patent_number}
        </a>
      </strong>
      <div style="margin-top: 8px; color: #666; font-size: 14px;">
        ${patent.title}
      </div>
      <div style="margin-top: 8px; font-size: 13px; color: #888;">
        ${patent.company} | Relevance Score: ${patent.score}/100
      </div>
      <div style="margin-top: 8px;">
        <a href="https://futureofgaming.com/patent/${patent.patent_number}" 
           style="display: inline-block; padding: 8px 16px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 4px; font-size: 13px;">
          View Live →
        </a>
      </div>
    </li>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
        <h2 style="margin: 0 0 8px 0; color: #1e293b; font-size: 24px;">
          ✅ Published Patents
        </h2>
        <p style="margin: 0; color: #64748b; font-size: 14px;">
          ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>
      
      <p style="font-size: 16px; color: #475569; margin-bottom: 24px;">
        ${patents.length} patent analysis${patents.length > 1 ? 'es have' : ' has'} been automatically published:
      </p>
      
      <ul style="list-style: none; padding: 0; margin: 0 0 24px 0;">
        ${patentsList}
      </ul>
      
      <div style="margin-top: 32px; padding-top: 24px; border-top: 2px solid #e2e8f0; text-align: center;">
        <a href="http://localhost:5001/calendar" 
           style="display: inline-block; padding: 12px 24px; background-color: #1e293b; color: white; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">
          View Editorial Calendar
        </a>
      </div>
      
      <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 12px;">
        <p style="margin: 0;">
          This is an automated notification from your scheduled publishing system.
        </p>
      </div>
    </body>
    </html>
  `;
}

module.exports = { publishScheduledPatents };
