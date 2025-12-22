#!/bin/bash

# 🚀 Quick Deploy Script for Cloud Run
# Project: in360project
# Service: thptphuocbuu360
# Region: asia-southeast1

set -e  # Exit on error

echo "🚀 Deploying to Cloud Run..."
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="in360project"
SERVICE_NAME="thptphuocbuu360"
REGION="asia-southeast1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo -e "${YELLOW}📦 Step 1: Building Docker Image...${NC}"
docker build -t ${IMAGE_NAME}:latest .

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Docker build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker build successful!${NC}"
echo ""

echo -e "${YELLOW}📤 Step 2: Pushing Image to GCR...${NC}"
docker push ${IMAGE_NAME}:latest

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Docker push failed!${NC}"
    echo "Make sure you're logged in: gcloud auth configure-docker"
    exit 1
fi

echo -e "${GREEN}✅ Image pushed successfully!${NC}"
echo ""

echo -e "${YELLOW}🚀 Step 3: Deploying to Cloud Run...${NC}"
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
  --set-env-vars NODE_ENV=production \
  --project ${PROJECT_ID}

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Cloud Run deployment failed!${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""

# Get service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} \
  --region ${REGION} \
  --format='value(status.url)' \
  --project ${PROJECT_ID})

echo -e "${GREEN}🌐 Service URL: ${SERVICE_URL}${NC}"
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "1. Update environment variables if needed:"
echo "   gcloud run services update ${SERVICE_NAME} --region ${REGION} --update-env-vars KEY=VALUE"
echo ""
echo "2. View logs:"
echo "   gcloud run services logs tail ${SERVICE_NAME} --region ${REGION}"
echo ""
echo "3. Visit your app:"
echo "   ${SERVICE_URL}"
echo ""
