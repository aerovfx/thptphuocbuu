-- Script SQL để xóa tất cả dữ liệu Space
-- Chạy: sqlite3 prisma/dev.db < scripts/delete-all-spaces-final.sql

-- Disable foreign key checks temporarily
PRAGMA foreign_keys = OFF;

-- Delete related data first (in correct order)
DELETE FROM space_task_comments WHERE taskId IN (SELECT id FROM space_tasks WHERE spaceId IN (SELECT id FROM spaces));
DELETE FROM space_tasks WHERE spaceId IN (SELECT id FROM spaces);
DELETE FROM space_progress_logs WHERE spaceId IN (SELECT id FROM spaces);
DELETE FROM space_documents WHERE spaceId IN (SELECT id FROM spaces);
DELETE FROM space_members WHERE spaceId IN (SELECT id FROM spaces);

-- Update departments to remove spaceId references
UPDATE departments SET spaceId = NULL WHERE spaceId IN (SELECT id FROM spaces);

-- Finally, delete all spaces
DELETE FROM spaces;

-- Re-enable foreign key checks
PRAGMA foreign_keys = ON;

-- Verify deletion
SELECT 'Spaces remaining: ' || COUNT(*) as result FROM spaces;

