#!/bin/bash

# OptiCare Frontend - Cloud Run Deployment Script
# Project: api-project-906431934424
# Region: asia-southeast1

set -e  # Exit on error

# Configuration
PROJECT_ID="api-project-906431934424"
REGION="asia-southeast1"
SERVICE_NAME="opticare-webapp"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

# Environment variables (adjust these)
VITE_API_BASE_URL="${VITE_API_BASE_URL:-https://opticare-backend-906431934424.asia-southeast1.run.app}"
VITE_WS_URL="${VITE_WS_URL:-wss://opticare-backend-906431934424.asia-southeast1.run.app/ws}"
VITE_GOOGLE_CLIENT_ID="${VITE_GOOGLE_CLIENT_ID:-906431934424-k8vl166pkqc01sninu6laig29dgkchj9.apps.googleusercontent.com}"
VITE_GOOGLE_OAUTH_REDIRECT_URI="${VITE_GOOGLE_OAUTH_REDIRECT_URI:-https://opticare-webapp-906431934424.asia-southeast1.run.app/google/callback}"

echo "🚀 OptiCare Frontend - Cloud Run Deployment"
echo "=========================================="
echo "Project ID: ${PROJECT_ID}"
echo "Region: ${REGION}"
echo "Service: ${SERVICE_NAME}"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: gcloud CLI is not installed"
    echo "Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker is not installed"
    echo "Install from: https://docs.docker.com/get-docker/"
    exit 1
fi

# Authenticate with gcloud
echo "📋 Step 1: Authenticating with Google Cloud..."
gcloud auth login --no-launch-browser 2>/dev/null || echo "Already authenticated"
gcloud config set project ${PROJECT_ID}

# Enable required APIs
echo ""
echo "📋 Step 2: Enabling required APIs..."
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  containerregistry.googleapis.com \
  --project=${PROJECT_ID} \
  --quiet

# Build and push Docker image using Cloud Build
echo ""
echo "📋 Step 3: Building Docker image using Cloud Build..."
echo "Building with environment variables:"
echo "  VITE_API_BASE_URL=${VITE_API_BASE_URL}"
echo "  VITE_WS_URL=${VITE_WS_URL}"
echo "  VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}"
echo "  VITE_GOOGLE_OAUTH_REDIRECT_URI=${VITE_GOOGLE_OAUTH_REDIRECT_URI}"
echo ""

cd "$(dirname "$0")"

# Build with build arguments using cloudbuild config
gcloud builds submit \
  --config=cloudbuild-frontend.yaml \
  --substitutions=_VITE_API_BASE_URL="${VITE_API_BASE_URL}",_VITE_WS_URL="${VITE_WS_URL}",_VITE_GOOGLE_CLIENT_ID="${VITE_GOOGLE_CLIENT_ID}",_VITE_GOOGLE_OAUTH_REDIRECT_URI="${VITE_GOOGLE_OAUTH_REDIRECT_URI}" \
  --project=${PROJECT_ID}

if [ $? -ne 0 ]; then
  echo "❌ Cloud Build failed."
  exit 1
fi
echo "✅ Docker image built and pushed successfully."

# Deploy to Cloud Run
echo ""
echo "📋 Step 4: Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
  --image ${IMAGE_NAME}:latest \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated \
  --port 80 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --timeout 300 \
  --set-env-vars "NODE_ENV=production" \
  --project ${PROJECT_ID}

# Get service URL
echo ""
echo "📋 Step 5: Getting service URL..."
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} \
  --region ${REGION} \
  --format 'value(status.url)' \
  --project ${PROJECT_ID})

echo ""
echo "✅ Deployment completed successfully!"
echo "=========================================="
echo "Service URL: ${SERVICE_URL}"
echo ""
echo "🧪 Test health endpoint:"
echo "  curl ${SERVICE_URL}/health"
echo ""
echo "📊 View logs:"
echo "  gcloud run services logs read ${SERVICE_NAME} --region ${REGION} --project ${PROJECT_ID}"
echo ""
echo "⚠️  Important: Update your backend CORS settings to allow:"
echo "  ${SERVICE_URL}"
echo ""
