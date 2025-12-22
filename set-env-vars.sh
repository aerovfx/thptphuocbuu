#!/bin/bash

# Script to set environment variables after deployment
# Run this after the build completes

set -e

PROJECT_ID="in360project"
SERVICE_NAME="phuocbuu"
REGION="asia-southeast1"

echo "⚙️  Setting environment variables..."

# Get service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region=${REGION} --format='value(status.url)' 2>/dev/null || echo "")

if [ -z "$SERVICE_URL" ]; then
    echo "⚠️  Service not found yet. Waiting for deployment to complete..."
    echo "Please run this script again after deployment completes."
    exit 1
fi

echo "Service URL: ${SERVICE_URL}"

# Generate NEXTAUTH_SECRET if not provided
NEXTAUTH_SECRET=${NEXTAUTH_SECRET:-$(openssl rand -base64 32)}

# Set environment variables
gcloud run services update ${SERVICE_NAME} \
  --region=${REGION} \
  --update-env-vars \
    DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19lWWt0anpQSVBHWWxuQkZtZ2c4M20iLCJhcGlfa2V5IjoiMDFLQ1AxUDhFUU04WEYwUlMyQzZaTjlQREciLCJ0ZW5hbnRfaWQiOiIzYzE1ZTgwZjcwMTU1Njg1NjQwZWVmY2Q1YjFjMTQ4NWVjNzcwYzYyYThjNWRlZjU5YjkzNTIyN2FiNDI5ZWY4IiwiaW50ZXJuYWxfc2VjcmV0IjoiNTM4MTFiMDMtYmY2My00MjgyLTg0OTYtMjlmNDEzNTcyOTQ2In0.ZUNycMMaqGyeTjPDuzZrjbiNbZJ3qtPFBwIWa6J99jA",\
    NEXTAUTH_URL="${SERVICE_URL}",\
    NEXTAUTH_SECRET="${NEXTAUTH_SECRET}",\
    GCS_BUCKET_NAME="thptphuocbuu360",\
    GOOGLE_CLOUD_PROJECT_ID="in360project",\
    NODE_ENV="production"

echo ""
echo "✅ Environment variables set successfully!"
echo ""
echo "📋 Summary:"
echo "  - Service URL: ${SERVICE_URL}"
echo "  - NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}"
echo ""
echo "🔗 Access your application at: ${SERVICE_URL}"

