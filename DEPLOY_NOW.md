# 🚀 Deploy Ngay - Copy và Chạy

## Trong Cloud Shell, chạy lệnh sau:

```bash
# Copy toàn bộ script này và chạy
cat > deploy-now.sh << 'EOF'
#!/bin/bash
set -e
PROJECT_ID="in360project"
SERVICE_NAME="phuocbuu"
REGION="asia-southeast1"

echo "🚀 Starting deployment..."

# Enable APIs
gcloud services enable cloudbuild.googleapis.com run.googleapis.com containerregistry.googleapis.com storage-component.googleapis.com storage-api.googleapis.com --quiet

# Deploy
gcloud builds submit --config cloudbuild.yaml

# Get URL and set env vars
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region=${REGION} --format='value(status.url)')
NEXTAUTH_SECRET=$(openssl rand -base64 32)

gcloud run services update ${SERVICE_NAME} --region=${REGION} --update-env-vars \
  DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19lWWt0anpQSVBHWWxuQkZtZ2c4M20iLCJhcGlfa2V5IjoiMDFLQ1AxUDhFUU04WEYwUlMyQzZaTjlQREciLCJ0ZW5hbnRfaWQiOiIzYzE1ZTgwZjcwMTU1Njg1NjQwZWVmY2Q1YjFjMTQ4NWVjNzcwYzYyYThjNWRlZjU5YjkzNTIyN2FiNDI5ZWY4IiwiaW50ZXJuYWxfc2VjcmV0IjoiNTM4MTFiMDMtYmY2My00MjgyLTg0OTYtMjlmNDEzNTcyOTQ2In0.ZUNycMMaqGyeTjPDuzZrjbiNbZJ3qtPFBwIWa6J99jA",\
  NEXTAUTH_URL="${SERVICE_URL}",\
  NEXTAUTH_SECRET="${NEXTAUTH_SECRET}",\
  GCS_BUCKET_NAME="thptphuocbuu360",\
  GOOGLE_CLOUD_PROJECT_ID="in360project",\
  NODE_ENV="production"

# Setup GCS
gsutil mb -p ${PROJECT_ID} -c STANDARD -l ${REGION} gs://thptphuocbuu360 2>/dev/null || true
gsutil iam ch allUsers:objectViewer gs://thptphuocbuu360
PROJECT_NUMBER=$(gcloud projects describe ${PROJECT_ID} --format='value(projectNumber)')
gsutil iam ch serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com:roles/storage.objectAdmin gs://thptphuocbuu360

echo "✅ Done! Service URL: ${SERVICE_URL}"
EOF

chmod +x deploy-now.sh
./deploy-now.sh
```

## Hoặc chạy từng bước:

### 1. Enable APIs
```bash
gcloud services enable cloudbuild.googleapis.com run.googleapis.com containerregistry.googleapis.com storage-component.googleapis.com storage-api.googleapis.com --quiet
```

### 2. Deploy
```bash
gcloud builds submit --config cloudbuild.yaml
```

### 3. Set Environment Variables
```bash
SERVICE_URL=$(gcloud run services describe phuocbuu --region=asia-southeast1 --format='value(status.url)')
NEXTAUTH_SECRET=$(openssl rand -base64 32)

gcloud run services update phuocbuu --region=asia-southeast1 --update-env-vars \
  DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19lWWt0anpQSVBHWWxuQkZtZ2c4M20iLCJhcGlfa2V5IjoiMDFLQ1AxUDhFUU04WEYwUlMyQzZaTjlQREciLCJ0ZW5hbnRfaWQiOiIzYzE1ZTgwZjcwMTU1Njg1NjQwZWVmY2Q1YjFjMTQ4NWVjNzcwYzYyYThjNWRlZjU5YjkzNTIyN2FiNDI5ZWY4IiwiaW50ZXJuYWxfc2VjcmV0IjoiNTM4MTFiMDMtYmY2My00MjgyLTg0OTYtMjlmNDEzNTcyOTQ2In0.ZUNycMMaqGyeTjPDuzZrjbiNbZJ3qtPFBwIWa6J99jA",\
  NEXTAUTH_URL="${SERVICE_URL}",\
  NEXTAUTH_SECRET="${NEXTAUTH_SECRET}",\
  GCS_BUCKET_NAME="thptphuocbuu360",\
  GOOGLE_CLOUD_PROJECT_ID="in360project",\
  NODE_ENV="production"
```

### 4. Setup GCS Bucket
```bash
gsutil mb -p in360project -c STANDARD -l asia-southeast1 gs://thptphuocbuu360 2>/dev/null || echo "Bucket exists"
gsutil iam ch allUsers:objectViewer gs://thptphuocbuu360
PROJECT_NUMBER=$(gcloud projects describe in360project --format='value(projectNumber)')
gsutil iam ch serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com:roles/storage.objectAdmin gs://thptphuocbuu360
```

### 5. Kiểm tra
```bash
gcloud run services describe phuocbuu --region=asia-southeast1 --format='value(status.url)'
```

