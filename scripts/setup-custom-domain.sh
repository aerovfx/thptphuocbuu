#!/bin/bash
# setup-custom-domain.sh
# Automated script to set up custom domain with SSL on Cloud Run

set -e

DOMAIN="thptphuocbuu.edu.vn"
SERVICE="thptphuocbuu360"
REGION="asia-southeast1"
PROJECT="in360project"

echo "================================================"
echo "🚀 Setting up Custom Domain for Cloud Run"
echo "================================================"
echo ""
echo "Domain:  $DOMAIN"
echo "Service: $SERVICE"
echo "Region:  $REGION"
echo "Project: $PROJECT"
echo ""

# Set project
echo "📝 Setting GCP project..."
gcloud config set project $PROJECT

# Enable required APIs
echo ""
echo "📝 Enabling required APIs..."
gcloud services enable run.googleapis.com --quiet
gcloud services enable domains.googleapis.com --quiet

# Check if service exists
echo ""
echo "📝 Checking Cloud Run service..."
SERVICE_URL=$(gcloud run services describe $SERVICE \
  --region=$REGION \
  --format='value(status.url)' 2>/dev/null || echo "")

if [[ -z "$SERVICE_URL" ]]; then
  echo "❌ Error: Service '$SERVICE' not found in region '$REGION'"
  exit 1
fi
echo "✅ Service found: $SERVICE_URL"

# Create domain mapping
echo ""
echo "📝 Creating domain mapping..."
gcloud beta run domain-mappings create \
  --service $SERVICE \
  --domain $DOMAIN \
  --region $REGION || echo "⚠️  Domain mapping already exists or failed"

# Get DNS records
echo ""
echo "================================================"
echo "📋 DNS Configuration Required"
echo "================================================"
echo ""
echo "Please add the following DNS records to your domain provider:"
echo ""

gcloud beta run domain-mappings describe \
  --domain $DOMAIN \
  --region $REGION \
  --format='table(status.resourceRecords.name, status.resourceRecords.type, status.resourceRecords.rrdata)' || true

echo ""
echo "================================================"
echo "⏱️  Next Steps:"
echo "================================================"
echo ""
echo "1. Add the DNS records shown above to your domain provider"
echo "2. Wait 5-30 minutes for DNS propagation"
echo "3. Wait 15-30 minutes for SSL certificate provisioning"
echo "4. Run: ./scripts/check-domain-status.sh"
echo "5. Update NEXTAUTH_URL environment variable"
echo ""
echo "✅ Domain mapping created successfully!"
echo "================================================"
