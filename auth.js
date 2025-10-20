require('dotenv').config();

const { betterAuth } = require("better-auth");
const { createAuthMiddleware } = require("better-auth/api");
const { magicLink } = require("better-auth/plugins");
const { Resend } = require("resend");
const { pool } = require("./lib/db");

const resend = new Resend(process.env.RESEND_API_KEY);

const auth = betterAuth({
  database: pool,
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  trustedOrigins: [process.env.BETTER_AUTH_URL || "http://localhost:3000"],
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 8 * 60 * 60, // 8 hours (extended from 30 minutes for better UX)
    },
    updateAge: 60 * 60, // Only update session in DB every hour (reduces DB load)
  },
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      const newSession = ctx.context?.newSession;
      const user = newSession?.user;

      // Check if this is a successful sign-in that should redirect to loading page
      if (user?.email && (
        ctx.path.startsWith("/sign-in") || 
        ctx.path.startsWith("/callback") ||
        ctx.path.includes("/magic-link/verify")
      )) {
        console.log(`[Auth] Redirecting ${user.email} to loading page from path: ${ctx.path}`);
        
        // Redirect to loading page (Inngest event will be emitted by emitLoginEvent on next page)
        throw ctx.redirect("/loading");
      }
    }),
  },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url, token }) => {
        try {
          await resend.emails.send({
            from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
            to: email,
            subject: '🎮 Your secure login link is ready',
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
                  <tr>
                    <td align="center">
                      <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); overflow: hidden;">
                        
                        <!-- Header with gradient -->
                        <tr>
                          <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                              🎮 Future of Gaming
                            </h1>
                            <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
                              Strategic intelligence on gaming's next moves
                            </p>
                          </td>
                        </tr>
                        
                        <!-- Main content -->
                        <tr>
                          <td style="padding: 40px;">
                            <h2 style="margin: 0 0 16px; color: #1a1a1a; font-size: 24px; font-weight: 600;">
                              Welcome back! 👋
                            </h2>
                            
                            <p style="margin: 0 0 24px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                              Click the button below to securely log in to your account. No password needed!
                            </p>
                            
                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td align="center" style="padding: 20px 0;">
                                  <a href="${url}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                                    Log in to Future of Gaming →
                                  </a>
                                </td>
                              </tr>
                            </table>
                            
                            <!-- Alternative link -->
                            <p style="margin: 24px 0 0; color: #718096; font-size: 14px; line-height: 1.6;">
                              Or copy and paste this link into your browser:
                            </p>
                            <p style="margin: 8px 0 0; padding: 12px; background-color: #f7fafc; border-radius: 6px; word-break: break-all; font-size: 13px; color: #4a5568; border: 1px solid #e2e8f0;">
                              ${url}
                            </p>
                            
                            <!-- Expiry notice -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 32px; padding: 16px; background-color: #fff5f5; border-left: 4px solid #f56565; border-radius: 6px;">
                              <tr>
                                <td>
                                  <p style="margin: 0; color: #c53030; font-size: 14px; font-weight: 500;">
                                    ⏰ This link expires in 5 minutes
                                  </p>
                                  <p style="margin: 8px 0 0; color: #742a2a; font-size: 13px; line-height: 1.5;">
                                    For your security, this login link will stop working after 5 minutes. Request a new one if it expires.
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                          <td style="padding: 32px 40px; background-color: #f7fafc; border-top: 1px solid #e2e8f0;">
                            <p style="margin: 0 0 12px; color: #718096; font-size: 14px; line-height: 1.6;">
                              <strong>Didn't request this?</strong><br>
                              No worries! You can safely ignore this email. Your account remains secure.
                            </p>
                            
                            <p style="margin: 16px 0 0; color: #a0aec0; font-size: 13px; line-height: 1.5;">
                              This email was sent to <strong>${email}</strong> because you requested a login link for Future of Gaming.
                            </p>
                            
                            <p style="margin: 16px 0 0; color: #a0aec0; font-size: 12px;">
                              © ${new Date().getFullYear()} Future of Gaming. All rights reserved.
                            </p>
                          </td>
                        </tr>
                        
                      </table>
                    </td>
                  </tr>
                </table>
              </body>
              </html>
            `
          });
          console.log(`Magic link sent to ${email}`);
        } catch (error) {
          console.error('Error sending magic link:', error);
          throw error;
        }
      },
      expiresIn: 300, // 5 minutes
      disableSignUp: false // Allow new users to sign up via magic link
    })
  ]
});

module.exports = { auth };
