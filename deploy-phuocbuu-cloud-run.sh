#!/bin/bash
#
# PhuocBuu - Cloud Run Deployment Script (Cloud Build -> Cloud Run)
# Project: tên = thptphuocbuu, ID = gen-lang-client-0753799782 (dùng ID trong gcloud/API)
# Region : asia-southeast1 (Singapore) — hỗ trợ direct domain mapping
# Image  : Artifact Registry (repo tạo sẵn → không cần quyền createOnPush)
#
# Usage:
#   chmod +x ./deploy-phuocbuu-cloud-run.sh
#   DATABASE_URL="..." ./deploy-phuocbuu-cloud-run.sh
#   # Bật đăng nhập Google OAuth (truyền thêm):
#   GOOGLE_CLIENT_ID="...@.apps.googleusercontent.com" GOOGLE_CLIENT_SECRET="..." DATABASE_URL="..." ./deploy-phuocbuu-cloud-run.sh
#
# Optional env vars:
#   PROJECT_ID=gen-lang-client-0753799782
#   REGION=asia-southeast1   # Singapore (direct domain mapping); other: asia-southeast2 Jakarta, asia-northeast1 Tokyo
#   SERVICE_NAME=thptphuocbuu
#   IMAGE_TAG=latest
#   GCS_BUCKET_NAME=gen-lang-client-0753799782_cloudbuild   # Cloud Build staging bucket
#   NEXTAUTH_SECRET=...            # if omitted, script will generate one (recommended to set it once and keep)
#   GOOGLE_CLIENT_ID=...           # bắt buộc cho đăng nhập Google OAuth
#   GOOGLE_CLIENT_SECRET=...       # bắt buộc cho đăng nhập Google OAuth
#   MEMORY=2Gi
#   CPU=2
#   MIN_INSTANCES=0                # set 1 to reduce cold starts (costs more)
#   MAX_INSTANCES=10
#   TIMEOUT=300
#   SERVICE_ACCOUNT_EMAIL=...      # if set, Cloud Run will use this service account (recommended for GCS access)
#

set -euo pipefail

# Configuration (override via env vars)
PROJECT_ID="${PROJECT_ID:-gen-lang-client-0753799782}"
REGION="${REGION:-asia-southeast1}"
SERVICE_NAME="${SERVICE_NAME:-thptphuocbuu}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
GCS_BUCKET_NAME="${GCS_BUCKET_NAME:-gen-lang-client-0753799782_cloudbuild}"
MEMORY="${MEMORY:-2Gi}"
CPU="${CPU:-2}"
MIN_INSTANCES="${MIN_INSTANCES:-0}"
MAX_INSTANCES="${MAX_INSTANCES:-10}"
TIMEOUT="${TIMEOUT:-300}"

# Artifact Registry (tránh lỗi gcr.io "createOnPush"); format: REGION-docker.pkg.dev/PROJECT/REPO/IMAGE
ARTIFACT_REGISTRY_REPO="${SERVICE_NAME}"
IMAGE_NAME="${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REGISTRY_REPO}/${SERVICE_NAME}:${IMAGE_TAG}"

# Load .env.local if DATABASE_URL (or other needed vars) not set
if [[ -z "${DATABASE_URL:-}" ]] || [[ -z "${NEXTAUTH_SECRET:-}" ]] || { [[ -z "${GOOGLE_CLIENT_ID:-}" ]] && [[ -f .env.local ]]; }; then
  SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
  ENV_FILE="${SCRIPT_DIR}/.env.local"
  if [[ -f "$ENV_FILE" ]]; then
    echo "ℹ️  Loading env from .env.local (DATABASE_URL, NEXTAUTH_SECRET, GOOGLE_* if not set)"
    set -a
    # shellcheck source=/dev/null
    source "$ENV_FILE" 2>/dev/null || true
    set +a
  fi
fi

echo "🚀 PhuocBuu - Cloud Run Deployment"
echo "=========================================="
echo "Project ID : ${PROJECT_ID}"
echo "Region     : ${REGION}"
echo "Service    : ${SERVICE_NAME}"
echo "Image      : ${IMAGE_NAME}"
echo "GCS Bucket : ${GCS_BUCKET_NAME}"
echo "Resources  : CPU=${CPU}, Memory=${MEMORY}, Min=${MIN_INSTANCES}, Max=${MAX_INSTANCES}, Timeout=${TIMEOUT}s"
echo ""

# Check requirements
if ! command -v gcloud &>/dev/null; then
  echo "❌ Error: gcloud CLI is not installed"
  echo ""
  echo "Install: https://cloud.google.com/sdk/docs/install"
  echo "  - macOS (Homebrew): brew install --cask google-cloud-sdk"
  echo "  - Sau khi cài, chạy: gcloud init"
  exit 1
fi

# Note: Docker is NOT required because we use Cloud Build, but keep this check optional for local debugging.
if ! command -v docker &>/dev/null; then
  echo "ℹ️  Docker not found (OK). This script uses Cloud Build, not local docker."
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "❌ Missing required env var: DATABASE_URL"
  echo "  - Đặt trong .env.local hoặc chạy: DATABASE_URL=\"...\" ./deploy-phuocbuu-cloud-run.sh"
  exit 1
fi

NEXTAUTH_SECRET="${NEXTAUTH_SECRET:-}"
if [[ -z "${NEXTAUTH_SECRET}" ]]; then
  # If you redeploy with a new secret, existing sessions may be invalidated.
  NEXTAUTH_SECRET="$(openssl rand -base64 32)"
  echo "⚠️  NEXTAUTH_SECRET not provided. Generated a new one for this deploy."
  echo "   Save it and reuse it for future deploys:"
  echo "   NEXTAUTH_SECRET=${NEXTAUTH_SECRET}"
  echo ""
fi

cd "$(dirname "$0")"

echo "📋 Step 1: Setting GCP project..."
gcloud config set project "${PROJECT_ID}" >/dev/null

echo ""
echo "📋 Step 2: Enabling required APIs..."
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  containerregistry.googleapis.com \
  artifactregistry.googleapis.com \
  --project="${PROJECT_ID}" \
  --quiet

echo ""
echo "📋 Step 2b: Ensuring Artifact Registry Docker repo exists (tránh lỗi createOnPush)..."
if ! gcloud artifacts repositories describe "${ARTIFACT_REGISTRY_REPO}" \
  --location="${REGION}" \
  --project="${PROJECT_ID}" &>/dev/null; then
  echo "Creating Artifact Registry repository: ${ARTIFACT_REGISTRY_REPO} in ${REGION}"
  gcloud artifacts repositories create "${ARTIFACT_REGISTRY_REPO}" \
    --repository-format=docker \
    --location="${REGION}" \
    --project="${PROJECT_ID}" \
    --description="Docker images for ${SERVICE_NAME}"
else
  echo "Artifact Registry repo ${ARTIFACT_REGISTRY_REPO} already exists."
fi

echo ""
echo "📋 Step 3: Building & pushing Docker image using Cloud Build..."
echo "Image will be pushed to Artifact Registry: ${IMAGE_NAME}"
echo "Using GCS bucket for source staging: gs://${GCS_BUCKET_NAME}/"
BUILD_OUTPUT=""
if ! BUILD_OUTPUT=$(gcloud builds submit \
  --tag "${IMAGE_NAME}" \
  --project "${PROJECT_ID}" \
  --gcs-source-staging-dir="gs://${GCS_BUCKET_NAME}/source" \
  2>&1); then
  echo "$BUILD_OUTPUT"
  echo ""
  if echo "$BUILD_OUTPUT" | grep -q "PERMISSION_DENIED\|createOnPush\|denied"; then
    echo "❌ Lỗi quyền: Cấp IAM trên project ID ${PROJECT_ID} (tên project: thptphuocbuu)."
    echo "   Console IAM: https://console.cloud.google.com/iam-admin/iam?project=${PROJECT_ID}"
    echo "   Principal cần quyền: 880621524780-compute@developer.gserviceaccount.com (và 880621524780@cloudbuild.gserviceaccount.com)"
    echo "   Các role: Artifact Registry Writer, Storage Admin, Logs Writer."
    echo "   Owner chạy (project ${PROJECT_ID}):"
    echo "     gcloud projects add-iam-policy-binding ${PROJECT_ID} --member=\"serviceAccount:880621524780-compute@developer.gserviceaccount.com\" --role=\"roles/artifactregistry.writer\""
    echo "     gcloud projects add-iam-policy-binding ${PROJECT_ID} --member=\"serviceAccount:880621524780@cloudbuild.gserviceaccount.com\" --role=\"roles/artifactregistry.writer\""
    echo "     gcloud projects add-iam-policy-binding ${PROJECT_ID} --member=\"serviceAccount:880621524780-compute@developer.gserviceaccount.com\" --role=\"roles/storage.admin\""
  fi
  exit 1
fi
echo "$BUILD_OUTPUT"

echo ""
echo "📋 Step 4: Deploying to Cloud Run..."
DEPLOY_ARGS=(
  run deploy "${SERVICE_NAME}"
  --image "${IMAGE_NAME}"
  --platform managed
  --region "${REGION}"
  --project "${PROJECT_ID}"
  --allow-unauthenticated
  --port 3000
  --memory "${MEMORY}"
  --cpu "${CPU}"
  --min-instances "${MIN_INSTANCES}"
  --max-instances "${MAX_INSTANCES}"
  --timeout "${TIMEOUT}"
  --set-env-vars "NODE_ENV=production"
)

if [[ -n "${SERVICE_ACCOUNT_EMAIL:-}" ]]; then
  DEPLOY_ARGS+=(--service-account "${SERVICE_ACCOUNT_EMAIL}")
fi

gcloud "${DEPLOY_ARGS[@]}"

echo ""
echo "📋 Step 4b: Allowing public (unauthenticated) access..."
if ! gcloud run services add-iam-policy-binding "${SERVICE_NAME}" \
  --region "${REGION}" \
  --project "${PROJECT_ID}" \
  --member="allUsers" \
  --role="roles/run.invoker" \
  --quiet; then
  echo "⚠️  Không thể thêm allUsers (public). Thường do Organization Policy (domain restriction)."
  echo "   → Service vẫn deploy thành công nhưng URL có thể trả 403 cho người dùng chưa đăng nhập."
  echo "   Cách xử lý:"
  echo "   1. Nếu cần truy cập công khai: Admin tổ chức GCP cần nới policy (iam.allowedPolicyMemberDomains) hoặc miễn trừ project."
  echo "   2. Sau khi policy được nới, chạy thủ công:"
  echo "      gcloud run services add-iam-policy-binding ${SERVICE_NAME} --region=${REGION} --project=${PROJECT_ID} --member=allUsers --role=roles/run.invoker"
  echo ""
fi

echo ""
echo "📋 Step 5: Getting service URL..."
SERVICE_URL="$(gcloud run services describe "${SERVICE_NAME}" \
  --region "${REGION}" \
  --project "${PROJECT_ID}" \
  --format 'value(status.url)')"
echo "Service URL: ${SERVICE_URL}"

# Step 6: Setting runtime environment variables
echo "📋 Step 6: Setting runtime environment variables..."
ENV_UPDATE_ARGS=(
  run services update "${SERVICE_NAME}"
  --region "${REGION}"
  --project "${PROJECT_ID}"
  --update-env-vars "DATABASE_URL=${DATABASE_URL}"
  --update-env-vars "NEXTAUTH_URL=https://thptphuocbuu.edu.vn"
  --update-env-vars "NEXTAUTH_SECRET=${NEXTAUTH_SECRET}"
  --update-env-vars "GCS_BUCKET_NAME=${GCS_BUCKET_NAME}"
  --update-env-vars "GOOGLE_CLOUD_PROJECT_ID=${PROJECT_ID}"
  --update-env-vars "NODE_ENV=production"
  --update-env-vars "AUTH_TRUST_HOST=true"
)

if [[ -n "${GOOGLE_CLIENT_ID:-}" && -n "${GOOGLE_CLIENT_SECRET:-}" ]]; then
  ENV_UPDATE_ARGS+=(--update-env-vars "GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}")
  ENV_UPDATE_ARGS+=(--update-env-vars "GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}")
else
  echo "ℹ️  Google OAuth not configured (missing GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET). Google login will be disabled."
fi

gcloud "${ENV_UPDATE_ARGS[@]}"

echo ""
echo "✅ Deployment completed successfully!"
echo "=========================================="
echo "Service: ${SERVICE_NAME}"
echo "URL    : ${SERVICE_URL}"
echo "Image  : ${IMAGE_NAME}"
echo ""
echo "📊 View logs:"
echo "  gcloud run services logs tail ${SERVICE_NAME} --region ${REGION} --project ${PROJECT_ID}"
echo ""

