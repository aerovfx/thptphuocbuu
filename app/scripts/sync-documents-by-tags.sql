-- Script SQL để đồng bộ tự động văn bản vào Spaces và Tổ chuyên môn dựa trên tag matching
-- Chạy: sqlite3 prisma/dev.db < app/scripts/sync-documents-by-tags.sql

-- Tạo bảng tạm để lưu kết quả matching
CREATE TEMP TABLE IF NOT EXISTS document_space_matches AS
SELECT 
    d.id as document_id,
    d.title,
    d.sender,
    d.recipient,
    d.document_type,
    s.id as space_id,
    s.name as space_name,
    s.code as space_code,
    CASE 
        WHEN LOWER(d.title || ' ' || COALESCE(d.sender, '') || ' ' || COALESCE(d.recipient, '')) LIKE '%' || LOWER(s.name) || '%' THEN 10
        WHEN LOWER(d.title || ' ' || COALESCE(d.sender, '') || ' ' || COALESCE(d.recipient, '')) LIKE '%' || LOWER(s.code) || '%' THEN 8
        ELSE 0
    END as relevance_score
FROM (
    SELECT id, title, sender, NULL as recipient, 'INCOMING' as document_type
    FROM incoming_documents
    UNION ALL
    SELECT id, title, NULL as sender, recipient, 'OUTGOING' as document_type
    FROM outgoing_documents
) d
CROSS JOIN spaces s
WHERE s.isActive = 1
    AND (
        LOWER(d.title || ' ' || COALESCE(d.sender, '') || ' ' || COALESCE(d.recipient, '')) LIKE '%' || LOWER(s.name) || '%'
        OR LOWER(d.title || ' ' || COALESCE(d.sender, '') || ' ' || COALESCE(d.recipient, '')) LIKE '%' || LOWER(s.code) || '%'
    );

-- Đồng bộ văn bản đến vào spaces phù hợp (top 3 spaces có điểm cao nhất)
INSERT INTO space_documents (id, spaceId, documentId, documentType, visibility, assignedAt)
SELECT 
    'sd_' || substr(hex(randomblob(4)), 1, 8) || '_' || substr(dsm.document_id, 1, 10) as id,
    dsm.space_id,
    dsm.document_id,
    dsm.document_type,
    'INTERNAL' as visibility,
    datetime('now') as assignedAt
FROM (
    SELECT 
        document_id,
        space_id,
        space_name,
        document_type,
        relevance_score,
        ROW_NUMBER() OVER (PARTITION BY document_id ORDER BY relevance_score DESC) as rn
    FROM document_space_matches
) dsm
WHERE dsm.rn <= 3
    AND dsm.document_type = 'INCOMING'
    AND NOT EXISTS (
        SELECT 1 FROM space_documents sd 
        WHERE sd.spaceId = dsm.space_id 
            AND sd.documentId = dsm.document_id 
            AND sd.documentType = dsm.document_type
    );

-- Đồng bộ văn bản đi vào spaces phù hợp (top 3 spaces có điểm cao nhất)
INSERT INTO space_documents (id, spaceId, documentId, documentType, visibility, assignedAt)
SELECT 
    'sd_' || substr(hex(randomblob(4)), 1, 8) || '_' || substr(dsm.document_id, 1, 10) as id,
    dsm.space_id,
    dsm.document_id,
    dsm.document_type,
    'INTERNAL' as visibility,
    datetime('now') as assignedAt
FROM (
    SELECT 
        document_id,
        space_id,
        space_name,
        document_type,
        relevance_score,
        ROW_NUMBER() OVER (PARTITION BY document_id ORDER BY relevance_score DESC) as rn
    FROM document_space_matches
) dsm
WHERE dsm.rn <= 3
    AND dsm.document_type = 'OUTGOING'
    AND NOT EXISTS (
        SELECT 1 FROM space_documents sd 
        WHERE sd.spaceId = dsm.space_id 
            AND sd.documentId = dsm.document_id 
            AND sd.documentType = dsm.document_type
    );

-- Luôn thêm tất cả văn bản vào Space "Văn bản"
INSERT INTO space_documents (id, spaceId, documentId, documentType, visibility, assignedAt)
SELECT 
    'sd_' || substr(hex(randomblob(4)), 1, 8) || '_' || substr(incoming_documents.id, 1, 10) as id,
    van_ban_space.id as space_id,
    incoming_documents.id as document_id,
    'INCOMING' as document_type,
    'INTERNAL' as visibility,
    datetime('now') as assignedAt
FROM incoming_documents
CROSS JOIN (SELECT id FROM spaces WHERE code = 'VAN_BAN_SPACE' LIMIT 1) van_ban_space
WHERE van_ban_space.id IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM space_documents sd 
        WHERE sd.spaceId = van_ban_space.id
            AND sd.documentId = incoming_documents.id 
            AND sd.documentType = 'INCOMING'
    );

INSERT INTO space_documents (id, spaceId, documentId, documentType, visibility, assignedAt)
SELECT 
    'sd_' || substr(hex(randomblob(4)), 1, 8) || '_' || substr(outgoing_documents.id, 1, 10) as id,
    van_ban_space.id as space_id,
    outgoing_documents.id as document_id,
    'OUTGOING' as document_type,
    'INTERNAL' as visibility,
    datetime('now') as assignedAt
FROM outgoing_documents
CROSS JOIN (SELECT id FROM spaces WHERE code = 'VAN_BAN_SPACE' LIMIT 1) van_ban_space
WHERE van_ban_space.id IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM space_documents sd 
        WHERE sd.spaceId = van_ban_space.id
            AND sd.documentId = outgoing_documents.id 
            AND sd.documentType = 'OUTGOING'
    );

-- Đồng bộ với departments dựa trên tag matching
CREATE TEMP TABLE IF NOT EXISTS document_dept_matches AS
SELECT 
    d.id as document_id,
    d.title,
    d.sender,
    d.recipient,
    d.document_type,
    dept.id as department_id,
    dept.name as department_name,
    dept.code as department_code,
    dept.subject,
    CASE 
        WHEN LOWER(d.title || ' ' || COALESCE(d.sender, '') || ' ' || COALESCE(d.recipient, '')) LIKE '%' || LOWER(dept.name) || '%' THEN 10
        WHEN LOWER(d.title || ' ' || COALESCE(d.sender, '') || ' ' || COALESCE(d.recipient, '')) LIKE '%' || LOWER(dept.code) || '%' THEN 8
        WHEN dept.subject IS NOT NULL AND LOWER(d.title || ' ' || COALESCE(d.sender, '') || ' ' || COALESCE(d.recipient, '')) LIKE '%' || LOWER(dept.subject) || '%' THEN 6
        ELSE 0
    END as relevance_score
FROM (
    SELECT id, title, sender, NULL as recipient, 'INCOMING' as document_type
    FROM incoming_documents
    UNION ALL
    SELECT id, title, NULL as sender, recipient, 'OUTGOING' as document_type
    FROM outgoing_documents
) d
CROSS JOIN departments dept
WHERE dept.isActive = 1
    AND (
        LOWER(d.title || ' ' || COALESCE(d.sender, '') || ' ' || COALESCE(d.recipient, '')) LIKE '%' || LOWER(dept.name) || '%'
        OR LOWER(d.title || ' ' || COALESCE(d.sender, '') || ' ' || COALESCE(d.recipient, '')) LIKE '%' || LOWER(dept.code) || '%'
        OR (dept.subject IS NOT NULL AND LOWER(d.title || ' ' || COALESCE(d.sender, '') || ' ' || COALESCE(d.recipient, '')) LIKE '%' || LOWER(dept.subject) || '%')
    );

-- Đồng bộ văn bản vào departments phù hợp (top 5 departments có điểm cao nhất)
INSERT INTO department_documents (id, departmentId, documentId, documentType)
SELECT 
    'dd_' || substr(hex(randomblob(4)), 1, 8) || '_' || substr(ddm.document_id, 1, 10) as id,
    ddm.department_id,
    ddm.document_id,
    ddm.document_type
FROM (
    SELECT 
        document_id,
        department_id,
        department_name,
        document_type,
        relevance_score,
        ROW_NUMBER() OVER (PARTITION BY document_id ORDER BY relevance_score DESC) as rn
    FROM document_dept_matches
) ddm
WHERE ddm.rn <= 5
    AND NOT EXISTS (
        SELECT 1 FROM department_documents dd 
        WHERE dd.departmentId = ddm.department_id 
            AND dd.documentId = ddm.document_id 
            AND dd.documentType = ddm.document_type
    );

-- Thống kê
SELECT 'Tổng số space_documents sau đồng bộ:' as label, COUNT(*) as count FROM space_documents
UNION ALL
SELECT 'Tổng số department_documents sau đồng bộ:' as label, COUNT(*) as count FROM department_documents;

