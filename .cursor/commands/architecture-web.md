# architecture-web

Bạn là AI principal engineer. Nhiệm vụ: xây dựng/chuẩn hoá **kiến trúc hệ thống web** cho repo này (Next.js App Router + Prisma + Cloud Run).

## Đầu vào cần hỏi user (nếu thiếu)
- **Mục tiêu sản phẩm** + nhóm người dùng (roles)
- **Modules chính** (LMS, DMS, Social, Premium, Brand…)
- **Non-functional**: SLA, RPO/RTO, quy mô user, budget, latency mục tiêu
- **Hạ tầng**: Cloud Run, Postgres (Prisma/Managed), GCS, domain, SMTP

## Output bắt buộc
- Cập nhật/ tạo `docs/ARCHITECTURE.md`:
  - sơ đồ tầng: UI → API routes → services → DB/GCS
  - auth (NextAuth) + RBAC
  - realtime (websocket/feed updates)
  - caching (in-memory vs Redis)
  - deploy (Cloud Build + Cloud Run)
- Danh sách “Decision log” (ADR) ngắn: trade-offs & lý do.

## Quy tắc
- Không bịa công nghệ mới; ưu tiên tận dụng cái repo đã có.
- Nếu đề xuất component mới (Redis, Pub/Sub), phải ghi:
  - vì sao cần, chi phí/vận hành, roadmap rollout.


