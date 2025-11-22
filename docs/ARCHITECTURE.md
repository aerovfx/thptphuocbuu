# Kiến trúc hệ thống Admin Panel — THPT Phước Bửu

## 1. Tổng quan

Hệ thống quản trị trường học tích hợp với các module: Admin Panel, DMS (Document Management System), Fanpage, Events, Media, và AI hỗ trợ.

### Mục tiêu
- Đáng tin cậy, có khả năng mở rộng
- Dễ quản trị cho nhiều vai trò (BGH, giáo viên, học sinh, ban truyền thông, tổ hành chính)
- Hỗ trợ quản lý nội dung, duyệt văn bản hành chính, fanpage, sự kiện, media repository
- AI hỗ trợ nội dung và soạn thảo văn bản realtime

## 2. Kiến trúc tổng quan

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ Admin Panel  │  │  Web App     │  │  Mobile PWA  │    │
│  │  (Next.js)   │  │  (Next.js)   │  │              │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      CDN / Edge Layer                       │
│              (CloudFront / Cloud CDN)                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway / BFF                       │
│              (Next.js API Routes / Express)                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Authentication & Authorization          │  │
│  │  (NextAuth.js / OAuth2 / OIDC + RBAC)                │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ User Service │   │ Content      │   │ DMS Service  │
│              │   │ Service      │   │              │
└──────────────┘   └──────────────┘   └──────────────┘
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ Event        │   │ Media        │   │ AI/ML        │
│ Service      │   │ Service      │   │ Service      │
└──────────────┘   └──────────────┘   └──────────────┘
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ Notification │   │ Realtime     │   │ Moderation   │
│ Service      │   │ Collab       │   │ Service      │
└──────────────┘   └──────────────┘   └──────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│  PostgreSQL  │   │ Elasticsearch│   │    Redis     │
│   (Prisma)   │   │   (Search)   │   │   (Cache)    │
└──────────────┘   └──────────────┘   └──────────────┘
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│  S3 Storage  │   │ Message Queue│   │   CDN        │
│  (Media)     │   │ (RabbitMQ)   │   │   (Assets)   │
└──────────────┘   └──────────────┘   └──────────────┘
```

## 3. Database Schema (ERD)

Xem file `docs/ERD.md` để xem ERD chi tiết với Mermaid diagrams.

## 4. Sequence Diagrams

Xem file `docs/SEQUENCE_DIAGRAMS.md` để xem các sequence diagrams cho các use cases chính.

## 5. Tech Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **UI**: React, Tailwind CSS
- **Editor**: TipTap (Google Docs-like)
- **State Management**: React Hooks, Zustand (nếu cần)
- **Realtime**: WebSocket (Socket.IO hoặc uWebSockets)

### Backend
- **API**: Next.js API Routes (hiện tại) / NestJS (mở rộng)
- **ORM**: Prisma
- **Database**: SQLite (dev) → PostgreSQL (production)
- **Cache**: Redis
- **Queue**: BullMQ / RabbitMQ
- **Search**: Elasticsearch / OpenSearch

### Storage
- **Object Storage**: AWS S3 / GCS / MinIO
- **CDN**: CloudFront / Cloud CDN

### Authentication & Authorization
- **Auth**: NextAuth.js (hiện tại) / Keycloak (mở rộng)
- **RBAC**: Custom implementation với Prisma

### AI/ML
- **OCR**: Tesseract / Google Cloud Vision
- **NLP**: OpenAI API / Local models
- **Content Generation**: OpenAI / Anthropic

### Observability
- **Logs**: Winston / Pino → ELK
- **Metrics**: Prometheus + Grafana
- **Errors**: Sentry
- **Tracing**: OpenTelemetry

## 6. Security

- HTTPS everywhere, HSTS
- OAuth2 / OIDC + RBAC
- Signed URLs cho uploads
- Encryption at rest (DB TDE, S3 SSE)
- WAF & rate limiting
- Audit logs cho tất cả hành động admin
- Backup policy: Daily incremental, weekly full

## 7. Scaling & Availability

- Services containerized (Docker → Kubernetes)
- Postgres: primary + replicas
- Redis cluster
- Media offloaded to S3 + CDN
- Queue đảm bảo at-least-once delivery
- Idempotent handlers

## 8. CI/CD

- Git → PR → GitHub Actions
- Lint, tests, build images
- Canary deploys
- Blue/Green support
- IaC: Terraform for infra, Helm charts for k8s

## 9. Next Steps

1. ✅ ERD chi tiết (xem `docs/ERD.md`)
2. ✅ Sequence diagrams (xem `docs/SEQUENCE_DIAGRAMS.md`)
3. ⏳ Infrastructure as Code (Terraform)
4. ⏳ Kubernetes manifests
5. ⏳ Monitoring & Alerting setup
6. ⏳ Migration scripts (SQLite → PostgreSQL)

