#!/bin/bash
#
# PhuocBuu - Cloud Run Deployment Script (Cloud Build -> Cloud Run)
# Project: in360project
# Region : asia-southeast1
#
# Usage:
#   chmod +x ./deploy-phuocbuu-cloud-run.sh
#   DATABASE_URL="prisma+postgres://..." ./deploy-phuocbuu-cloud-run.sh
#
# Optional env vars:
#   PROJECT_ID=in360project
#   REGION=asia-southeast1
#   SERVICE_NAME=thptphuocbuu360   # or phuocbuu
#   IMAGE_TAG=latest
#   GCS_BUCKET_NAME=thptphuocbuu360
#   NEXTAUTH_SECRET=...            # if omitted, script will generate one (recommended to set it once and keep)
#   GOOGLE_CLIENT_ID=...           # optional (required to enable Google login)
#   GOOGLE_CLIENT_SECRET=...       # optional (required to enable Google login)
#   MEMORY=2Gi
#   CPU=2
#   MIN_INSTANCES=0                # set 1 to reduce cold starts (costs more)
#   MAX_INSTANCES=10
#   TIMEOUT=300
#   SERVICE_ACCOUNT_EMAIL=...      # if set, Cloud Run will use this service account (recommended for GCS access)
#

set -euo pipefail

# Configuration (override via env vars)
PROJECT_ID="${PROJECT_ID:-in360project}"
REGION="${REGION:-asia-southeast1}"
SERVICE_NAME="${SERVICE_NAME:-thptphuocbuu360}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
GCS_BUCKET_NAME="${GCS_BUCKET_NAME:-thptphuocbuu360}"
MEMORY="${MEMORY:-2Gi}"
CPU="${CPU:-2}"
MIN_INSTANCES="${MIN_INSTANCES:-0}"
MAX_INSTANCES="${MAX_INSTANCES:-10}"
TIMEOUT="${TIMEOUT:-300}"

IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}:${IMAGE_TAG}"

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
  echo "Install from: https://cloud.google.com/sdk/docs/install"
  exit 1
fi

# Note: Docker is NOT required because we use Cloud Build, but keep this check optional for local debugging.
if ! command -v docker &>/dev/null; then
  echo "ℹ️  Docker not found (OK). This script uses Cloud Build, not local docker."
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "❌ Missing required env var: DATABASE_URL"
  echo "Example:"
  echo "  DATABASE_URL=\"prisma+postgres://...\" ./deploy-phuocbuu-cloud-run.sh"
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
  --project="${PROJECT_ID}" \
  --quiet

echo ""
echo "📋 Step 3: Building & pushing Docker image using Cloud Build..."
echo "This will run your Dockerfile remotely and push to Container Registry (gcr.io)."
gcloud builds submit \
  --tag "${IMAGE_NAME}" \
  --project "${PROJECT_ID}"

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
echo "📋 Step 5: Getting service URL..."
SERVICE_URL="$(gcloud run services describe "${SERVICE_NAME}" \
  --region "${REGION}" \
  --project "${PROJECT_ID}" \
  --format 'value(status.url)')"
echo "Service URL: ${SERVICE_URL}"

echo ""
echo "📋 Step 6: Setting runtime environment variables..."
ENV_UPDATE_ARGS=(
  run services update "${SERVICE_NAME}"
  --region "${REGION}"
  --project "${PROJECT_ID}"
  --update-env-vars "DATABASE_URL=${DATABASE_URL}"
  --update-env-vars "NEXTAUTH_URL=${SERVICE_URL}"
  --update-env-vars "NEXTAUTH_SECRET=${NEXTAUTH_SECRET}"
  --update-env-vars "GCS_BUCKET_NAME=${GCS_BUCKET_NAME}"
  --update-env-vars "GOOGLE_CLOUD_PROJECT_ID=${PROJECT_ID}"
  --update-env-vars "NODE_ENV=production"
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

