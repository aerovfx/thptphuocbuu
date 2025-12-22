#!/bin/bash

# Script để tạo Cloud SQL instance cho project
# Project ID: in360project

set -e

PROJECT_ID="in360project"
INSTANCE_NAME="phuocbuu-db"
DATABASE_NAME="phuocbuu"
DB_USER="phuocbuu_user"
REGION="asia-southeast1"

echo "🗄️  Creating Cloud SQL instance..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI is not installed. Please install it first."
    exit 1
fi

# Set project
gcloud config set project ${PROJECT_ID}

# Enable SQL Admin API
echo "🔧 Enabling SQL Admin API..."
gcloud services enable sqladmin.googleapis.com

# Prompt for root password
echo ""
read -sp "Enter root password for Cloud SQL: " ROOT_PASSWORD
echo ""
read -sp "Enter password for database user: " DB_PASSWORD
echo ""

# Create Cloud SQL instance
echo "🏗️  Creating Cloud SQL instance..."
gcloud sql instances create ${INSTANCE_NAME} \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=${REGION} \
  --root-password=${ROOT_PASSWORD} \
  --storage-type=SSD \
  --storage-size=10GB \
  --backup-start-time=03:00 \
  --enable-bin-log

# Create database
echo "📦 Creating database..."
gcloud sql databases create ${DATABASE_NAME} --instance=${INSTANCE_NAME}

# Create user
echo "👤 Creating database user..."
gcloud sql users create ${DB_USER} \
  --instance=${INSTANCE_NAME} \
  --password=${DB_PASSWORD}

# Get connection name
CONNECTION_NAME=$(gcloud sql instances describe ${INSTANCE_NAME} --format='value(connectionName)')

echo ""
echo "✅ Cloud SQL instance created successfully!"
echo ""
echo "📋 Connection Details:"
echo "  - Instance Name: ${INSTANCE_NAME}"
echo "  - Connection Name: ${CONNECTION_NAME}"
echo "  - Database: ${DATABASE_NAME}"
echo "  - User: ${DB_USER}"
echo ""
echo "🔗 Connection String:"
echo "  postgresql://${DB_USER}:${DB_PASSWORD}@/${DATABASE_NAME}?host=/cloudsql/${CONNECTION_NAME}"
echo ""
echo "💡 Next steps:"
echo "  1. Add Cloud SQL connection to Cloud Run service:"
echo "     gcloud run services update phuocbuu --region=${REGION} --add-cloudsql-instances=${CONNECTION_NAME}"
echo ""
echo "  2. Set DATABASE_URL environment variable:"
echo "     gcloud run services update phuocbuu --region=${REGION} --update-env-vars DATABASE_URL=\"postgresql://${DB_USER}:${DB_PASSWORD}@/${DATABASE_NAME}?host=/cloudsql/${CONNECTION_NAME}\""

