-- Migration: Simplify UserStatus enum to only ACTIVE and SUSPENDED
-- Run this SQL script BEFORE deploying the new code

-- Step 1: Update all DELETED users to SUSPENDED
UPDATE users 
SET status = 'SUSPENDED' 
WHERE status = 'DELETED';

-- Step 2: Update all PENDING users to SUSPENDED
UPDATE users 
SET status = 'SUSPENDED' 
WHERE status = 'PENDING';

-- Step 3: Convert column to text temporarily
ALTER TABLE users ALTER COLUMN status TYPE text;

-- Step 4: Drop the old enum
DROP TYPE IF EXISTS "UserStatus";

-- Step 5: Create new enum with only ACTIVE and SUSPENDED
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- Step 6: Convert the column back to the new enum
ALTER TABLE users 
  ALTER COLUMN status TYPE "UserStatus" 
  USING status::"UserStatus";

-- Step 7: Set default value
ALTER TABLE users 
  ALTER COLUMN status SET DEFAULT 'ACTIVE';

-- Step 8: Ensure any NULL values become ACTIVE (safety check)
UPDATE users 
SET status = 'ACTIVE' 
WHERE status IS NULL;

-- Verify migration
SELECT status, COUNT(*) as count 
FROM users 
GROUP BY status 
ORDER BY status;

