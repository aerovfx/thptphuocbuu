#!/bin/bash

# Script để setup Google Cloud Storage bucket
# Project ID: in360project
# Bucket Name: thptphuocbuu360

set -e

PROJECT_ID="in360project"
BUCKET_NAME="thptphuocbuu360"
REGION="asia-southeast1"

echo "🗄️  Setting up Google Cloud Storage bucket..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI is not installed. Please install it first."
    exit 1
fi

# Set project
gcloud config set project ${PROJECT_ID}

# Enable Storage API
echo "🔧 Enabling Cloud Storage API..."
gcloud services enable storage-component.googleapis.com
gcloud services enable storage-api.googleapis.com

# Check if bucket exists
echo "🔍 Checking if bucket exists..."
if gsutil ls -b gs://${BUCKET_NAME} &>/dev/null; then
    echo "✅ Bucket ${BUCKET_NAME} already exists"
else
    echo "📦 Creating bucket ${BUCKET_NAME}..."
    gsutil mb -p ${PROJECT_ID} -c STANDARD -l ${REGION} gs://${BUCKET_NAME}
    echo "✅ Bucket created successfully"
fi

# Set bucket to public (for public assets)
echo "🔓 Setting bucket to public..."
gsutil iam ch allUsers:objectViewer gs://${BUCKET_NAME}

# Set CORS configuration for web access
echo "🌐 Setting CORS configuration..."
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

gsutil cors set /tmp/cors.json gs://${BUCKET_NAME}
rm /tmp/cors.json

# Set lifecycle policy (optional - delete files older than 1 year)
echo "📋 Setting lifecycle policy..."
cat > /tmp/lifecycle.json << EOF
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {"age": 365}
      }
    ]
  }
}
EOF

gsutil lifecycle set /tmp/lifecycle.json gs://${BUCKET_NAME}
rm /tmp/lifecycle.json

# Create folder structure
echo "📁 Creating folder structure..."
gsutil -m mkdir -p gs://${BUCKET_NAME}/posts
gsutil -m mkdir -p gs://${BUCKET_NAME}/avatars
gsutil -m mkdir -p gs://${BUCKET_NAME}/covers
gsutil -m mkdir -p gs://${BUCKET_NAME}/brands/logo
gsutil -m mkdir -p gs://${BUCKET_NAME}/brands/document
gsutil -m mkdir -p gs://${BUCKET_NAME}/documents
gsutil -m mkdir -p gs://${BUCKET_NAME}/dms/incoming
gsutil -m mkdir -p gs://${BUCKET_NAME}/spaces

# Set uniform bucket-level access
echo "🔐 Setting uniform bucket-level access..."
gsutil uniformbucketlevelaccess set on gs://${BUCKET_NAME}

# Grant Cloud Run service account access
echo "🔑 Granting Cloud Run service account access..."
PROJECT_NUMBER=$(gcloud projects describe ${PROJECT_ID} --format='value(projectNumber)')
SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

gsutil iam ch serviceAccount:${SERVICE_ACCOUNT}:roles/storage.objectAdmin gs://${BUCKET_NAME}

echo ""
echo "✅ Google Cloud Storage bucket setup completed!"
echo ""
echo "📋 Summary:"
echo "  - Bucket Name: ${BUCKET_NAME}"
echo "  - Region: ${REGION}"
echo "  - Project: ${PROJECT_ID}"
echo "  - Public Access: Enabled (read-only)"
echo ""
echo "🔗 Bucket URL: https://storage.googleapis.com/${BUCKET_NAME}/"
echo ""
echo "💡 Next steps:"
echo "  1. Set environment variable in Cloud Run:"
echo "     gcloud run services update phuocbuu --region=${REGION} --update-env-vars GCS_BUCKET_NAME=${BUCKET_NAME}"
echo ""
echo "  2. If using service account key, set:"
echo "     gcloud run services update phuocbuu --region=${REGION} --update-env-vars GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json"
echo ""
echo "  3. Or use default credentials (recommended for Cloud Run)"

