-- Script để xóa các bảng không được sử dụng khỏi database
-- Các bảng sẽ bị xóa:
-- 1. lesson_completions
-- 2. ocr_extracts
-- 3. document_embeddings
-- 4. news_tags

-- Xóa các bảng (SQLite)
DROP TABLE IF EXISTS lesson_completions;
DROP TABLE IF EXISTS ocr_extracts;
DROP TABLE IF EXISTS document_embeddings;
DROP TABLE IF EXISTS news_tags;

-- Xác nhận đã xóa
SELECT 'Đã xóa các bảng không được sử dụng' AS status;

