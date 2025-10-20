-- Migration: Add newsletter_status column to user table
-- Date: 2025-10-19

-- Add newsletter_status column
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS newsletter_status TEXT DEFAULT NULL;

-- Possible values: NULL (never asked), 'subscribed', 'unsubscribed'
-- NULL means we haven't tried to subscribe them yet
-- 'subscribed' means they are subscribed (either auto or manual)
-- 'unsubscribed' means they explicitly unsubscribed and should never be auto-subscribed again

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_newsletter_status ON "user"(newsletter_status);

-- Add comment
COMMENT ON COLUMN "user".newsletter_status IS 'Newsletter subscription status: NULL (never asked), subscribed, unsubscribed';
