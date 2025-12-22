#!/bin/bash

# Google Cloud Run Deployment Script for Cloud Shell
# Project ID: in360project

set -e

PROJECT_ID="in360project"
SERVICE_NAME="phuocbuu"
REGION="asia-southeast1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo "🚀 Starting deployment to Google Cloud Run from Cloud Shell..."

# Set the project (should already be set)
echo "📋 Setting project to ${PROJECT_ID}..."
gcloud config set project ${PROJECT_ID}

# Enable required APIs
echo "🔧 Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com --quiet
gcloud services enable run.googleapis.com --quiet
gcloud services enable containerregistry.googleapis.com --quiet
gcloud services enable storage-component.googleapis.com --quiet
gcloud services enable storage-api.googleapis.com --quiet

# Check if we're in a git repo or need to upload
if [ -d ".git" ]; then
    echo "📦 Using Cloud Build with git..."
    # Use Cloud Build
    gcloud builds submit --config cloudbuild.yaml
else
    echo "🏗️  Building Docker image locally..."
    docker build -t ${IMAGE_NAME}:latest .
    
    echo "📤 Pushing image to Container Registry..."
    docker push ${IMAGE_NAME}:latest
    
    # Deploy to Cloud Run
    echo "🚀 Deploying to Cloud Run..."
    gcloud run deploy ${SERVICE_NAME} \
      --image ${IMAGE_NAME}:latest \
      --platform managed \
      --region ${REGION} \
      --allow-unauthenticated \
      --port 3000 \
      --memory 2Gi \
      --cpu 2 \
      --min-instances 0 \
      --max-instances 10 \
      --timeout 300 \
      --set-env-vars NODE_ENV=production
fi

echo ""
echo "✅ Deployment completed!"
echo ""
echo "🌐 Service URL:"
gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format 'value(status.url)'
echo ""
echo "📝 Next steps:"
echo "1. Set environment variables:"
echo "   gcloud run services update ${SERVICE_NAME} --region=${REGION} --update-env-vars DATABASE_URL=\"prisma+postgres://accelerate.prisma-data.net/?api_key=YOUR_API_KEY\""
echo ""
echo "2. View logs:"
echo "   gcloud run services logs tail ${SERVICE_NAME} --region=${REGION}"

