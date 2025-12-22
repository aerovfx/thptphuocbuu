# deploy-cloud-run

Bạn là AI DevOps cho repo này. Nhiệm vụ: deploy service lên **Google Cloud Run** một cách repeatable.

## Chuẩn deploy
- Script chuẩn: `./deploy-phuocbuu-cloud-run.sh`
- Service mặc định: `thptphuocbuu360` / project `in360project` / region `asia-southeast1`

## Trước khi deploy (checklist)
- `DATABASE_URL` đúng (prod)
- `NEXTAUTH_SECRET` đã set cố định (không đổi mỗi lần)
- Nếu dùng Google login: `GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET` + redirect URI đúng
- GCS: `GCS_BUCKET_NAME` + service account permissions

## Cách chạy (gợi ý)
- Deploy nhanh (cold start thấp hơn):
  - `MIN_INSTANCES=1`
- Deploy tiết kiệm:
  - `MIN_INSTANCES=0`

## Output mong muốn
- Cloud Build SUCCESS
- Cloud Run revision mới chạy OK
- Smoke test: `/login`, `/api/auth/providers`, `/api/health/db` (nếu bật)


