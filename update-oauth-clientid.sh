#!/bin/bash

# Update OAuth Client ID to correct value on Cloud Run
# Project: in360project
# Service: thptphuocbuu360

set -e

PROJECT_ID="in360project"
SERVICE_NAME="thptphuocbuu360"
REGION="asia-southeast1"

# Correct OAuth Client ID from Google Cloud Console
CORRECT_CLIENT_ID="1069154179448-cghmkq9hs65g3775ogercfcj6c7sobt1.apps.googleusercontent.com"
# Keep the existing client secret (unchanged)
EXISTING_CLIENT_SECRET="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"

echo "🔧 Updating OAuth Client ID on Cloud Run"
echo "=========================================="
echo "Project: ${PROJECT_ID}"
echo "Service: ${SERVICE_NAME}"
echo "Region: ${REGION}"
echo ""
echo "📝 Current Client ID (WRONG):"
echo "   442514522574-46kbkh43f32gahs1bafmt8c62lqvrnu1.apps.googleusercontent.com"
echo ""
echo "✅ New Client ID (CORRECT):"
echo "   ${CORRECT_CLIENT_ID}"
echo ""

# Confirm before proceeding
read -p "⚠️  This will update the OAuth Client ID. Continue? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cancelled"
    exit 1
fi

# Update environment variables
echo ""
echo "🚀 Updating environment variables..."
gcloud run services update ${SERVICE_NAME} \
  --region=${REGION} \
  --project=${PROJECT_ID} \
  --update-env-vars "GOOGLE_CLIENT_ID=${CORRECT_CLIENT_ID},GOOGLE_CLIENT_SECRET=${EXISTING_CLIENT_SECRET}"

if [ $? -ne 0 ]; then
    echo "❌ Update failed!"
    exit 1
fi

echo ""
echo "✅ OAuth Client ID updated successfully!"
echo ""
echo "==========================================="
echo "📋 Verification"
echo "==========================================="

# Verify the update
echo ""
echo "🔍 Checking current environment variables..."
CURRENT_CLIENT_ID=$(gcloud run services describe ${SERVICE_NAME} \
  --region=${REGION} \
  --project=${PROJECT_ID} \
  --format="value(spec.template.spec.containers[0].env)" | \
  grep -o "GOOGLE_CLIENT_ID[^;]*" | cut -d"'" -f4)

echo ""
echo "Current GOOGLE_CLIENT_ID: ${CURRENT_CLIENT_ID}"
echo ""

if [[ "${CURRENT_CLIENT_ID}" == "${CORRECT_CLIENT_ID}" ]]; then
    echo "✅ Verification PASSED - Client ID is correct!"
else
    echo "❌ Verification FAILED - Client ID still incorrect!"
    exit 1
fi

echo ""
echo "==========================================="
echo "🎯 Next Steps"
echo "==========================================="
echo ""
echo "1. ✅ OAuth Client ID đã được cập nhật"
echo "2. ⏳ Đợi ~1-2 phút để Cloud Run reload"
echo "3. 🧪 Test login tại:"
echo "   https://thptphuocbuu360-1069154179448.asia-southeast1.run.app/login"
echo ""
echo "4. 🔍 Monitor logs nếu cần:"
echo "   gcloud beta run services logs tail ${SERVICE_NAME} --region=${REGION} --project=${PROJECT_ID}"
echo ""
echo "==========================================="
echo "✨ Update completed!"
echo "==========================================="
