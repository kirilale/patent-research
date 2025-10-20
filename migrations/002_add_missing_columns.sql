-- Migration: Add missing columns to auth tables
-- Date: 2025-10-19

-- Add missing columns to session table
ALTER TABLE session ADD COLUMN IF NOT EXISTS token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text;

-- Add missing columns to account table  
ALTER TABLE account ADD COLUMN IF NOT EXISTS "accessTokenExpiresAt" TIMESTAMP;
ALTER TABLE account ADD COLUMN IF NOT EXISTS "refreshTokenExpiresAt" TIMESTAMP;
ALTER TABLE account ADD COLUMN IF NOT EXISTS scope TEXT;

-- Create index on session token for faster lookups
CREATE INDEX IF NOT EXISTS idx_session_token ON session(token);
