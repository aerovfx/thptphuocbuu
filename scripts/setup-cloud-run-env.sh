#!/bin/bash

# Script để setup environment variables cho Cloud Run
# Project ID: in360project

set -e

PROJECT_ID="in360project"
SERVICE_NAME="phuocbuu"
REGION="asia-southeast1"

echo "🔧 Setting up environment variables for Cloud Run..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI is not installed. Please install it first."
    exit 1
fi

# Set project
gcloud config set project ${PROJECT_ID}

# Prompt for environment variables
echo ""
echo "📝 Please provide the following environment variables:"
echo ""

read -p "DATABASE_URL: " DATABASE_URL
read -p "NEXTAUTH_SECRET (or press Enter to generate): " NEXTAUTH_SECRET
read -p "NEXTAUTH_URL: " NEXTAUTH_URL
read -p "GOOGLE_CLIENT_ID (optional): " GOOGLE_CLIENT_ID
read -p "GOOGLE_CLIENT_SECRET (optional): " GOOGLE_CLIENT_SECRET
read -p "OPENAI_API_KEY (optional): " OPENAI_API_KEY

# Generate NEXTAUTH_SECRET if not provided
if [ -z "$NEXTAUTH_SECRET" ]; then
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    echo "✅ Generated NEXTAUTH_SECRET: $NEXTAUTH_SECRET"
fi

# Build env vars string
ENV_VARS="NODE_ENV=production"
ENV_VARS="${ENV_VARS},DATABASE_URL=${DATABASE_URL}"
ENV_VARS="${ENV_VARS},NEXTAUTH_SECRET=${NEXTAUTH_SECRET}"
ENV_VARS="${ENV_VARS},NEXTAUTH_URL=${NEXTAUTH_URL}"

if [ ! -z "$GOOGLE_CLIENT_ID" ]; then
    ENV_VARS="${ENV_VARS},GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}"
fi

if [ ! -z "$GOOGLE_CLIENT_SECRET" ]; then
    ENV_VARS="${ENV_VARS},GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}"
fi

if [ ! -z "$OPENAI_API_KEY" ]; then
    ENV_VARS="${ENV_VARS},OPENAI_API_KEY=${OPENAI_API_KEY}"
fi

# Update Cloud Run service
echo ""
echo "🚀 Updating Cloud Run service with environment variables..."
gcloud run services update ${SERVICE_NAME} \
  --region=${REGION} \
  --update-env-vars ${ENV_VARS}

echo ""
echo "✅ Environment variables updated successfully!"
echo ""
echo "📋 Summary:"
echo "  - DATABASE_URL: ${DATABASE_URL:0:20}..."
echo "  - NEXTAUTH_SECRET: ${NEXTAUTH_SECRET:0:10}..."
echo "  - NEXTAUTH_URL: ${NEXTAUTH_URL}"
echo ""
echo "💡 To view all environment variables:"
echo "   gcloud run services describe ${SERVICE_NAME} --region=${REGION} --format='value(spec.template.spec.containers[0].env)'"

