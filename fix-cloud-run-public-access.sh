#!/bin/bash
# Một lần: Cho phép truy cập public (bỏ 403 Forbidden) cho Cloud Run service hiện tại.
# Chạy: chmod +x fix-cloud-run-public-access.sh && ./fix-cloud-run-public-access.sh

set -euo pipefail

PROJECT_ID="${PROJECT_ID:-gen-lang-client-0753799782}"
SERVICE_NAME="${SERVICE_NAME:-thptphuocbuu}"

# Region: asia-southeast1 (Singapore). Override: REGION=asia-southeast2 ./fix-cloud-run-public-access.sh
REGION="${REGION:-asia-southeast1}"

echo "Granting public access to Cloud Run service: ${SERVICE_NAME} (${REGION})"
gcloud run services add-iam-policy-binding "${SERVICE_NAME}" \
  --region "${REGION}" \
  --project "${PROJECT_ID}" \
  --member="allUsers" \
  --role="roles/run.invoker"

echo ""
echo "Done. Thử lại: https://thptphuocbuu-880621524780.${REGION}.run.app"
echo "(Nếu service cũ ở asia-southeast2, chạy: REGION=asia-southeast2 ./fix-cloud-run-public-access.sh)"
