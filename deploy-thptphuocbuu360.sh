#!/bin/bash

# Deploy to Cloud Run: thptphuocbuu360
# Project: in360project

set -e

PROJECT_ID="in360project"
SERVICE_NAME="thptphuocbuu360"
REGION="asia-southeast1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest"

echo "🚀 Deploying to Cloud Run: ${SERVICE_NAME}"
echo "=========================================="
echo "Project: ${PROJECT_ID}"
echo "Service: ${SERVICE_NAME}"
echo "Region: ${REGION}"
echo ""

# Step 1: Set project
echo "📋 Step 1: Setting GCP project..."
gcloud config set project ${PROJECT_ID}

# Step 2: Configure Docker
echo ""
echo "📋 Step 2: Configuring Docker for GCR..."
gcloud auth configure-docker --quiet

# Step 3: Build and push image using Cloud Build
echo ""
echo "🏗️  Step 3: Building and pushing Docker image using Cloud Build..."
echo "This may take 5-10 minutes..."
echo "Cloud Build will automatically build for linux/amd64 platform..."
gcloud builds submit --tag ${IMAGE_NAME} --project ${PROJECT_ID}

if [ $? -ne 0 ]; then
    echo "❌ Cloud Build failed!"
    exit 1
fi

echo "✅ Build and push completed successfully!"

# Step 5: Deploy to Cloud Run
echo ""
echo "🚀 Step 5: Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
  --image ${IMAGE_NAME} \
  --platform managed \
  --region ${REGION} \
  --project ${PROJECT_ID} \
  --allow-unauthenticated \
  --port 3000 \
  --memory 2Gi \
  --cpu 2 \
  --min-instances 0 \
  --max-instances 10 \
  --timeout 300 \
  --set-env-vars NODE_ENV=production

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed!"
    exit 1
fi

# Step 6: Get service URL
echo ""
echo "🔗 Step 6: Getting service URL..."
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region=${REGION} --project=${PROJECT_ID} --format='value(status.url)')
echo "Service URL: ${SERVICE_URL}"

# Step 7: Set environment variables
echo ""
echo "⚙️  Step 7: Setting environment variables..."
NEXTAUTH_SECRET=$(openssl rand -base64 32)

gcloud run services update ${SERVICE_NAME} \
  --region=${REGION} \
  --project=${PROJECT_ID} \
  --update-env-vars "DATABASE_URL=prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19lWWt0anpQSVBHWWxuQkZtZ2c4M20iLCJhcGlfa2V5IjoiMDFLQ1AxUDhFUU04WEYwUlMyQzZaTjlQREciLCJ0ZW5hbnRfaWQiOiIzYzE1ZTgwZjcwMTU1Njg1NjQwZWVmY2Q1YjFjMTQ4NWVjNzcwYzYyYThjNWRlZjU5YjkzNTIyN2FiNDI5ZWY4IiwiaW50ZXJuYWxfc2VjcmV0IjoiNTM4MTFiMDMtYmY2My00MjgyLTg0OTYtMjlmNDEzNTcyOTQ2In0.ZUNycMMaqGyeTjPDuzZrjbiNbZJ3qtPFBwIWa6J99jA,NEXTAUTH_URL=${SERVICE_URL},NEXTAUTH_SECRET=${NEXTAUTH_SECRET},GCS_BUCKET_NAME=thptphuocbuu360,GOOGLE_CLOUD_PROJECT_ID=in360project,NODE_ENV=production"

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "=========================================="
echo "📋 Deployment Summary"
echo "=========================================="
echo "  Project: ${PROJECT_ID}"
echo "  Service Name: ${SERVICE_NAME}"
echo "  Region: ${REGION}"
echo "  Image: ${IMAGE_NAME}"
echo "  Service URL: ${SERVICE_URL}"
echo "  NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}"
echo ""
echo "🔗 Access your application:"
echo "   ${SERVICE_URL}"
echo ""
echo "📝 Useful commands:"
echo "   View logs: gcloud run services logs tail ${SERVICE_NAME} --region=${REGION} --project=${PROJECT_ID}"
echo "   View service: gcloud run services describe ${SERVICE_NAME} --region=${REGION} --project=${PROJECT_ID}"
echo "   Update env: gcloud run services update ${SERVICE_NAME} --region=${REGION} --project=${PROJECT_ID} --update-env-vars KEY=VALUE"

