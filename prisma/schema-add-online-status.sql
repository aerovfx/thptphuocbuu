-- Add online status and interaction scoring fields to User model
ALTER TABLE users ADD COLUMN IF NOT EXISTS "lastActivityAt" TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "isOnline" BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "interactionScore" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "scoreUpdatedAt" TIMESTAMP;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_users_lastActivityAt" ON users("lastActivityAt");
CREATE INDEX IF NOT EXISTS "idx_users_interactionScore" ON users("interactionScore");
