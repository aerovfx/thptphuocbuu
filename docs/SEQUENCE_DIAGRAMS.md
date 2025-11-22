# Sequence Diagrams - Use Cases

## 1. Đăng bài / Tạo văn bản (DMS)

```mermaid
sequenceDiagram
    participant U as User (Admin/Teacher)
    participant FE as Frontend (Next.js)
    participant GW as API Gateway
    participant DMS as DMS Service
    participant PG as PostgreSQL
    participant S3 as S3 Storage
    participant MQ as Message Queue
    participant AI as AI Worker
    participant ES as Elasticsearch

    U->>FE: Tạo văn bản mới
    FE->>FE: Validate form
    FE->>S3: Upload file (signed URL)
    S3-->>FE: Upload success
    FE->>GW: POST /api/dms/outgoing
    GW->>GW: Authenticate & Authorize (RBAC)
    GW->>DMS: Create document
    DMS->>PG: Save metadata (status: DRAFT)
    PG-->>DMS: Document created
    DMS->>S3: Save content/file
    S3-->>DMS: Saved
    DMS->>MQ: Publish "document.created"
    DMS-->>GW: Document created (id)
    GW-->>FE: Success response
    FE-->>U: Show success message
    
    Note over MQ,AI: Async processing
    MQ->>AI: Deliver event
    AI->>S3: Download file
    AI->>AI: OCR/Extract metadata
    AI->>PG: Update document metadata
    AI->>ES: Index document for search
    ES-->>AI: Indexed
```

## 2. Duyệt văn bản (Approval Workflow)

```mermaid
sequenceDiagram
    participant U as User (Creator)
    participant FE as Frontend
    participant GW as API Gateway
    participant DMS as DMS Service
    participant PG as PostgreSQL
    participant N as Notification Service
    participant MQ as Message Queue
    participant A as Approver (BGH)

    U->>FE: Submit document for approval
    FE->>GW: PUT /api/dms/outgoing/{id}/submit
    GW->>DMS: Submit document
    DMS->>PG: Update status: PENDING
    DMS->>PG: Create approval record
    DMS->>PG: Assign to approver (BGH)
    DMS->>MQ: Publish "document.pending_approval"
    MQ->>N: Notify approver
    N->>A: Push notification / Email
    DMS-->>GW: Success
    GW-->>FE: Success
    FE-->>U: Document submitted
    
    Note over A: Approver reviews
    A->>FE: Open document
    FE->>GW: GET /api/dms/outgoing/{id}
    GW->>DMS: Get document
    DMS->>PG: Fetch document
    PG-->>DMS: Document data
    DMS-->>GW: Document
    GW-->>FE: Document
    FE-->>A: Display document
    
    A->>FE: Approve document
    FE->>GW: POST /api/dms/outgoing/{id}/approve
    GW->>DMS: Approve document
    DMS->>PG: Update status: APPROVED
    DMS->>PG: Update approval record
    DMS->>MQ: Publish "document.approved"
    MQ->>N: Notify creator
    N->>U: Push notification / Email
    DMS->>ES: Index approved document
    DMS-->>GW: Success
    GW-->>FE: Success
    FE-->>A: Approval confirmed
```

## 3. Media Upload & Processing

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant GW as API Gateway
    participant MS as Media Service
    participant S3 as S3 Storage
    participant MQ as Message Queue
    participant MW as Media Worker
    participant PG as PostgreSQL
    participant CDN as CDN

    U->>FE: Upload image/video
    FE->>GW: GET /api/media/upload-url
    GW->>MS: Generate signed URL
    MS->>S3: Generate presigned POST URL
    S3-->>MS: Signed URL
    MS-->>GW: Signed URL
    GW-->>FE: Signed URL
    
    FE->>S3: Direct upload (signed URL)
    S3-->>FE: Upload success
    
    FE->>GW: POST /api/media (metadata)
    GW->>MS: Create media record
    MS->>PG: Save metadata (status: PROCESSING)
    MS->>MQ: Publish "media.uploaded"
    MS-->>GW: Media created
    GW-->>FE: Success
    
    Note over MQ,MW: Async processing
    MQ->>MW: Deliver event
    MW->>S3: Download original
    MW->>MW: Generate thumbnails
    MW->>MW: Transcode video (if needed)
    MW->>S3: Upload thumbnails
    MW->>S3: Upload transcoded files
    MW->>PG: Update metadata (status: READY, thumbnails)
    MW->>CDN: Invalidate cache
    MW->>MQ: Publish "media.processed"
    
    Note over FE: User can use media
    FE->>CDN: GET /media/{id}/thumbnail
    CDN->>S3: Fetch from S3
    S3-->>CDN: Thumbnail
    CDN-->>FE: Thumbnail
```

## 4. Realtime Collaborative Editor

```mermaid
sequenceDiagram
    participant U1 as User 1
    participant U2 as User 2
    participant FE1 as Frontend 1
    participant FE2 as Frontend 2
    participant WS as WebSocket Server
    participant YJS as Yjs CRDT
    participant DMS as DMS Service
    participant PG as PostgreSQL
    participant S3 as S3 Storage

    U1->>FE1: Open document for editing
    FE1->>DMS: GET /api/dms/outgoing/{id}
    DMS->>PG: Fetch document
    PG-->>DMS: Document
    DMS-->>FE1: Document content
    FE1->>WS: Connect WebSocket
    WS->>YJS: Create/Join document room
    YJS-->>WS: Room created
    WS-->>FE1: Connected
    
    U1->>FE1: Type text
    FE1->>YJS: Apply local change
    YJS->>WS: Broadcast change
    WS->>FE2: Send update (if U2 connected)
    FE2->>YJS: Apply remote change
    YJS->>FE2: Update editor
    FE2-->>U2: See U1's changes
    
    U2->>FE2: Type text
    FE2->>YJS: Apply local change
    YJS->>WS: Broadcast change
    WS->>FE1: Send update
    FE1->>YJS: Apply remote change
    YJS->>FE1: Update editor
    FE1-->>U1: See U2's changes
    
    Note over U1: User saves document
    U1->>FE1: Click Save
    FE1->>YJS: Get final content
    YJS-->>FE1: Merged content
    FE1->>DMS: PUT /api/dms/outgoing/{id}
    DMS->>PG: Update document
    DMS->>S3: Save snapshot
    DMS->>PG: Create document version
    DMS-->>FE1: Saved
    FE1-->>U1: Save confirmed
```

## 5. AI Content Processing (OCR, Summarization)

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant GW as API Gateway
    participant DMS as DMS Service
    participant PG as PostgreSQL
    participant MQ as Message Queue
    participant AI as AI Worker
    participant S3 as S3 Storage
    participant ES as Elasticsearch

    U->>FE: Upload document (PDF/DOCX)
    FE->>S3: Upload file
    S3-->>FE: Upload success
    FE->>GW: POST /api/dms/outgoing (with file reference)
    GW->>DMS: Create document
    DMS->>PG: Save metadata (status: PROCESSING)
    DMS->>MQ: Publish "document.uploaded" (with S3 path)
    DMS-->>GW: Document created
    GW-->>FE: Success
    
    Note over MQ,AI: Async AI processing
    MQ->>AI: Deliver event
    AI->>S3: Download file
    AI->>AI: Extract text (OCR if image/PDF)
    AI->>AI: Generate summary
    AI->>AI: Extract entities (tags, keywords)
    AI->>PG: Update document metadata
    Note right of AI: - extractedText<br/>- summary<br/>- tags<br/>- keywords
    AI->>ES: Index document with extracted data
    ES-->>AI: Indexed
    AI->>MQ: Publish "document.processed"
    
    Note over FE: User views processed document
    U->>FE: Open document
    FE->>GW: GET /api/dms/outgoing/{id}
    GW->>DMS: Get document
    DMS->>PG: Fetch document (with AI metadata)
    PG-->>DMS: Document + metadata
    DMS-->>GW: Document
    GW-->>FE: Document
    FE-->>U: Display document with summary/tags
```

## 6. User Management & RBAC

```mermaid
sequenceDiagram
    participant A as Admin
    participant FE as Frontend
    participant GW as API Gateway
    participant US as User Service
    participant RBAC as RBAC Service
    participant PG as PostgreSQL
    participant AL as Audit Log

    A->>FE: Create new user
    FE->>GW: POST /api/admin/users
    GW->>GW: Check permission (module:user:write)
    GW->>RBAC: Verify permission
    RBAC->>PG: Check user roles & permissions
    PG-->>RBAC: Permissions
    RBAC-->>GW: Authorized
    GW->>US: Create user
    US->>PG: Save user (status: ACTIVE)
    PG-->>US: User created
    US->>AL: Log action (user.create)
    AL->>PG: Save audit log
    US-->>GW: User created
    GW-->>FE: Success
    FE-->>A: User created
    
    A->>FE: Assign role to user
    FE->>GW: PUT /api/admin/users/{id}/roles
    GW->>RBAC: Verify permission (module:role:write)
    RBAC-->>GW: Authorized
    GW->>US: Assign roles
    US->>PG: Create UserRoleAssignment
    PG-->>US: Assigned
    US->>AL: Log action (role.assign)
    AL->>PG: Save audit log
    US-->>GW: Success
    GW-->>FE: Success
    FE-->>A: Role assigned
```

## 7. Search Documents (Full-text Search)

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant GW as API Gateway
    participant SS as Search Service
    participant ES as Elasticsearch
    participant PG as PostgreSQL

    U->>FE: Search documents
    FE->>GW: GET /api/dms/documents/search?q=keyword&type=hybrid
    GW->>SS: Search documents
    SS->>ES: Query Elasticsearch (full-text)
    ES-->>SS: Search results (ids, scores)
    SS->>PG: Fetch full document data (by ids)
    PG-->>SS: Documents
    SS->>SS: Merge & rank results
    SS-->>GW: Search results
    GW-->>FE: Results
    FE-->>U: Display results
    
    Note over SS: If semantic search enabled
    SS->>SS: Generate embeddings for query
    SS->>ES: Vector search (semantic)
    ES-->>SS: Semantic results
    SS->>SS: Combine text + semantic results
    SS-->>GW: Hybrid results
```

## 8. Notification Flow

```mermaid
sequenceDiagram
    participant S as Service (DMS/Content)
    participant MQ as Message Queue
    participant NS as Notification Service
    participant PG as PostgreSQL
    participant WS as WebSocket
    participant E as Email Service
    participant P as Push Service
    participant U as User

    S->>MQ: Publish event (document.approved)
    MQ->>NS: Deliver event
    NS->>PG: Get user notification preferences
    PG-->>NS: Preferences (email, push, in-app)
    
    par In-app notification
        NS->>PG: Create notification record
        NS->>WS: Send to user (if online)
        WS-->>U: Real-time notification
    and Email notification
        NS->>E: Send email
        E-->>U: Email notification
    and Push notification
        NS->>P: Send push
        P-->>U: Push notification
    end
    
    Note over U: User views notifications
    U->>FE: Open notifications
    FE->>GW: GET /api/notifications
    GW->>NS: Get notifications
    NS->>PG: Fetch notifications
    PG-->>NS: Notifications
    NS-->>GW: Notifications
    GW-->>FE: Notifications
    FE-->>U: Display notifications
```

