-- Script SQL đơn giản để đồng bộ văn bản vào spaces và departments dựa trên tag matching
-- Chạy: sqlite3 prisma/dev.db < app/scripts/sync-by-tags-simple.sql

-- 1. Đồng bộ văn bản đến vào spaces dựa trên tag matching
-- Tìm spaces có tên/code xuất hiện trong title hoặc sender
INSERT INTO space_documents (id, spaceId, documentId, documentType, visibility, assignedAt)
SELECT DISTINCT
    'sd_' || substr(hex(randomblob(4)), 1, 8) || '_' || substr(id.id, 1, 10) as id,
    s.id as spaceId,
    id.id as documentId,
    'INCOMING' as documentType,
    'INTERNAL' as visibility,
    datetime('now') as assignedAt
FROM incoming_documents id
CROSS JOIN spaces s
WHERE s.isActive = 1
    AND (
        LOWER(id.title || ' ' || COALESCE(id.sender, '')) LIKE '%' || LOWER(s.name) || '%'
        OR LOWER(id.title || ' ' || COALESCE(id.sender, '')) LIKE '%' || LOWER(s.code) || '%'
    )
    AND NOT EXISTS (
        SELECT 1 FROM space_documents sd 
        WHERE sd.spaceId = s.id 
            AND sd.documentId = id.id 
            AND sd.documentType = 'INCOMING'
    )
LIMIT 50; -- Giới hạn để tránh quá nhiều matches

-- 2. Đồng bộ văn bản đi vào spaces dựa trên tag matching
INSERT INTO space_documents (id, spaceId, documentId, documentType, visibility, assignedAt)
SELECT DISTINCT
    'sd_' || substr(hex(randomblob(4)), 1, 8) || '_' || substr(od.id, 1, 10) as id,
    s.id as spaceId,
    od.id as documentId,
    'OUTGOING' as documentType,
    'INTERNAL' as visibility,
    datetime('now') as assignedAt
FROM outgoing_documents od
CROSS JOIN spaces s
WHERE s.isActive = 1
    AND (
        LOWER(od.title || ' ' || COALESCE(od.recipient, '')) LIKE '%' || LOWER(s.name) || '%'
        OR LOWER(od.title || ' ' || COALESCE(od.recipient, '')) LIKE '%' || LOWER(s.code) || '%'
    )
    AND NOT EXISTS (
        SELECT 1 FROM space_documents sd 
        WHERE sd.spaceId = s.id 
            AND sd.documentId = od.id 
            AND sd.documentType = 'OUTGOING'
    )
LIMIT 50;

-- 3. Đồng bộ văn bản đến vào departments dựa trên tag matching
INSERT INTO department_documents (id, departmentId, documentId, documentType)
SELECT DISTINCT
    'dd_' || substr(hex(randomblob(4)), 1, 8) || '_' || substr(id.id, 1, 10) as id,
    d.id as departmentId,
    id.id as documentId,
    'INCOMING' as documentType
FROM incoming_documents id
CROSS JOIN departments d
WHERE d.isActive = 1
    AND (
        LOWER(id.title || ' ' || COALESCE(id.sender, '')) LIKE '%' || LOWER(d.name) || '%'
        OR LOWER(id.title || ' ' || COALESCE(id.sender, '')) LIKE '%' || LOWER(d.code) || '%'
        OR (d.subject IS NOT NULL AND LOWER(id.title || ' ' || COALESCE(id.sender, '')) LIKE '%' || LOWER(d.subject) || '%')
    )
    AND NOT EXISTS (
        SELECT 1 FROM department_documents dd 
        WHERE dd.departmentId = d.id 
            AND dd.documentId = id.id 
            AND dd.documentType = 'INCOMING'
    )
LIMIT 50;

-- 4. Đồng bộ văn bản đi vào departments dựa trên tag matching
INSERT INTO department_documents (id, departmentId, documentId, documentType)
SELECT DISTINCT
    'dd_' || substr(hex(randomblob(4)), 1, 8) || '_' || substr(od.id, 1, 10) as id,
    d.id as departmentId,
    od.id as documentId,
    'OUTGOING' as documentType
FROM outgoing_documents od
CROSS JOIN departments d
WHERE d.isActive = 1
    AND (
        LOWER(od.title || ' ' || COALESCE(od.recipient, '')) LIKE '%' || LOWER(d.name) || '%'
        OR LOWER(od.title || ' ' || COALESCE(od.recipient, '')) LIKE '%' || LOWER(d.code) || '%'
        OR (d.subject IS NOT NULL AND LOWER(od.title || ' ' || COALESCE(od.recipient, '')) LIKE '%' || LOWER(d.subject) || '%')
    )
    AND NOT EXISTS (
        SELECT 1 FROM department_documents dd 
        WHERE dd.departmentId = d.id 
            AND dd.documentId = od.id 
            AND dd.documentType = 'OUTGOING'
    )
LIMIT 50;

-- 5. Luôn thêm tất cả văn bản vào Space "Văn bản"
INSERT INTO space_documents (id, spaceId, documentId, documentType, visibility, assignedAt)
SELECT 
    'sd_' || substr(hex(randomblob(4)), 1, 8) || '_' || substr(id, 1, 10) as id,
    (SELECT id FROM spaces WHERE code = 'VAN_BAN_SPACE' LIMIT 1) as spaceId,
    id as documentId,
    'INCOMING' as documentType,
    'INTERNAL' as visibility,
    datetime('now') as assignedAt
FROM incoming_documents
WHERE (SELECT id FROM spaces WHERE code = 'VAN_BAN_SPACE' LIMIT 1) IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM space_documents sd 
        WHERE sd.spaceId = (SELECT id FROM spaces WHERE code = 'VAN_BAN_SPACE' LIMIT 1)
            AND sd.documentId = incoming_documents.id 
            AND sd.documentType = 'INCOMING'
    );

INSERT INTO space_documents (id, spaceId, documentId, documentType, visibility, assignedAt)
SELECT 
    'sd_' || substr(hex(randomblob(4)), 1, 8) || '_' || substr(id, 1, 10) as id,
    (SELECT id FROM spaces WHERE code = 'VAN_BAN_SPACE' LIMIT 1) as spaceId,
    id as documentId,
    'OUTGOING' as documentType,
    'INTERNAL' as visibility,
    datetime('now') as assignedAt
FROM outgoing_documents
WHERE (SELECT id FROM spaces WHERE code = 'VAN_BAN_SPACE' LIMIT 1) IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM space_documents sd 
        WHERE sd.spaceId = (SELECT id FROM spaces WHERE code = 'VAN_BAN_SPACE' LIMIT 1)
            AND sd.documentId = outgoing_documents.id 
            AND sd.documentType = 'OUTGOING'
    );

-- Thống kê
SELECT 'Tổng số space_documents:' as label, COUNT(*) as count FROM space_documents
UNION ALL
SELECT 'Tổng số department_documents:' as label, COUNT(*) as count FROM department_documents
UNION ALL
SELECT 'Space "Văn bản" documents:' as label, COUNT(*) as count FROM space_documents sd JOIN spaces s ON sd.spaceId = s.id WHERE s.code = 'VAN_BAN_SPACE';

