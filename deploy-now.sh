#!/bin/bash

# Complete Deployment Script for Cloud Shell
# Project: in360project

set -e

PROJECT_ID="in360project"
SERVICE_NAME="phuocbuu"
REGION="asia-southeast1"

echo "🚀 Starting complete deployment process..."

# Step 1: Enable APIs
echo "📋 Step 1: Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com --quiet
gcloud services enable run.googleapis.com --quiet
gcloud services enable containerregistry.googleapis.com --quiet
gcloud services enable storage-component.googleapis.com --quiet
gcloud services enable storage-api.googleapis.com --quiet
echo "✅ APIs enabled"

# Step 2: Deploy using Cloud Build
echo ""
echo "🏗️  Step 2: Building and deploying application..."
gcloud builds submit --config cloudbuild.yaml

# Step 3: Get service URL
echo ""
echo "🔗 Step 3: Getting service URL..."
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region=${REGION} --format='value(status.url)')
echo "Service URL: ${SERVICE_URL}"

# Step 4: Generate NEXTAUTH_SECRET
echo ""
echo "🔐 Step 4: Generating NEXTAUTH_SECRET..."
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Step 5: Set environment variables
echo ""
echo "⚙️  Step 5: Setting environment variables..."
gcloud run services update ${SERVICE_NAME} \
  --region=${REGION} \
  --update-env-vars \
    DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19lWWt0anpQSVBHWWxuQkZtZ2c4M20iLCJhcGlfa2V5IjoiMDFLQ1AxUDhFUU04WEYwUlMyQzZaTjlQREciLCJ0ZW5hbnRfaWQiOiIzYzE1ZTgwZjcwMTU1Njg1NjQwZWVmY2Q1YjFjMTQ4NWVjNzcwYzYyYThjNWRlZjU5YjkzNTIyN2FiNDI5ZWY4IiwiaW50ZXJuYWxfc2VjcmV0IjoiNTM4MTFiMDMtYmY2My00MjgyLTg0OTYtMjlmNDEzNTcyOTQ2In0.ZUNycMMaqGyeTjPDuzZrjbiNbZJ3qtPFBwIWa6J99jA",\
    NEXTAUTH_URL="${SERVICE_URL}",\
    NEXTAUTH_SECRET="${NEXTAUTH_SECRET}",\
    GCS_BUCKET_NAME="thptphuocbuu360",\
    GOOGLE_CLOUD_PROJECT_ID="in360project",\
    NODE_ENV="production"

# Step 6: Setup GCS Bucket
echo ""
echo "🗄️  Step 6: Setting up Google Cloud Storage bucket..."
if ! gsutil ls -b gs://thptphuocbuu360 &>/dev/null; then
    echo "Creating bucket..."
    gsutil mb -p ${PROJECT_ID} -c STANDARD -l ${REGION} gs://thptphuocbuu360
    echo "✅ Bucket created"
else
    echo "✅ Bucket already exists"
fi

# Set bucket permissions
gsutil iam ch allUsers:objectViewer gs://thptphuocbuu360 2>/dev/null || true

# Set CORS
cat > /tmp/cors.json << EOF
[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "responseHeader": ["Content-Type", "Access-Control-Allow-Origin"],
    "maxAgeSeconds": 3600
  }
]
EOF
gsutil cors set /tmp/cors.json gs://thptphuocbuu360
rm /tmp/cors.json

# Grant Cloud Run service account access
PROJECT_NUMBER=$(gcloud projects describe ${PROJECT_ID} --format='value(projectNumber)')
SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
gsutil iam ch serviceAccount:${SERVICE_ACCOUNT}:roles/storage.objectAdmin gs://thptphuocbuu360 2>/dev/null || true

echo "✅ GCS bucket configured"

# Step 7: Final status
echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "📋 Summary:"
echo "  - Service Name: ${SERVICE_NAME}"
echo "  - Region: ${REGION}"
echo "  - Service URL: ${SERVICE_URL}"
echo "  - GCS Bucket: thptphuocbuu360"
echo ""
echo "🔗 Access your application at: ${SERVICE_URL}"
echo ""
echo "📝 Useful commands:"
echo "  - View logs: gcloud run services logs tail ${SERVICE_NAME} --region=${REGION}"
echo "  - View service: gcloud run services describe ${SERVICE_NAME} --region=${REGION}"
echo "  - Update env vars: gcloud run services update ${SERVICE_NAME} --region=${REGION} --update-env-vars KEY=VALUE"

