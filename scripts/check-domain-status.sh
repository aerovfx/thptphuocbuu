#!/bin/bash
# check-domain-status.sh
# Script to check DNS records and domain mapping status

set -e

DOMAIN="thptphuocbuu.edu.vn"
SERVICE="thptphuocbuu360"
REGION="asia-southeast1"
PROJECT="in360project"

echo "================================================"
echo "🔍 Domain Status Check for $DOMAIN"
echo "================================================"
echo ""

# Set project
gcloud config set project $PROJECT --quiet

echo "📊 Step 1: Checking DNS Records..."
echo "-------------------------------------------"
echo "A Record:    $(dig +short A $DOMAIN || echo 'Not found')"
echo "AAAA Record: $(dig +short AAAA $DOMAIN || echo 'Not found')"
echo "TXT Record:  $(dig +short TXT $DOMAIN || echo 'Not found')"
echo ""

echo "📊 Step 2: Checking Cloud Run Service..."
echo "-------------------------------------------"
SERVICE_URL=$(gcloud run services describe $SERVICE \
  --region=$REGION \
  --format='value(status.url)' 2>/dev/null || echo "Service not found")
echo "Service URL: $SERVICE_URL"
echo ""

echo "📊 Step 3: Checking Domain Mapping Status..."
echo "-------------------------------------------"
MAPPING_STATUS=$(gcloud beta run domain-mappings describe \
  --domain $DOMAIN \
  --region $REGION \
  --format='value(status.conditions)' 2>/dev/null || echo "Domain mapping not found")
echo "$MAPPING_STATUS"
echo ""

if [[ "$MAPPING_STATUS" == "Domain mapping not found" ]]; then
  echo "❌ Domain mapping chưa được tạo!"
  echo ""
  echo "📝 Để tạo domain mapping, chạy lệnh:"
  echo "gcloud beta run domain-mappings create \\"
  echo "  --service $SERVICE \\"
  echo "  --domain $DOMAIN \\"
  echo "  --region $REGION"
  echo ""
else
  echo "📊 Step 4: Checking SSL Certificate..."
  echo "-------------------------------------------"
  HTTP_STATUS=$(curl -sI https://$DOMAIN 2>&1 | head -1 || echo "Connection failed")
  echo "$HTTP_STATUS"
  echo ""
  
  if [[ "$HTTP_STATUS" == *"200"* ]]; then
    echo "✅ SSL Certificate is active and working!"
  elif [[ "$HTTP_STATUS" == *"404"* ]]; then
    echo "⚠️  Domain is accessible but returns 404 (check routing)"
  else
    echo "⚠️  SSL Certificate may still be provisioning..."
  fi
fi

echo ""
echo "================================================"
echo "✅ Status Check Complete!"
echo "================================================"
