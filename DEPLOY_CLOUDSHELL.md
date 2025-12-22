# 🚀 Hướng dẫn Deploy từ Google Cloud Shell

## Bước 1: Clone Repository

Nếu chưa có code trong Cloud Shell:

```bash
# Clone repo (thay YOUR_REPO_URL bằng URL repo của bạn)
git clone YOUR_REPO_URL
cd phuocbuu

# Hoặc nếu đã có code, upload lên Cloud Shell
```

## Bước 2: Setup Environment

```bash
# Set project (đã được set sẵn)
gcloud config set project in360project

# Enable required APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable storage-component.googleapis.com
gcloud services enable storage-api.googleapis.com
```

## Bước 3: Deploy

### Option A: Sử dụng Cloud Build (Khuyến nghị)

```bash
# Deploy sử dụng cloudbuild.yaml
gcloud builds submit --config cloudbuild.yaml
```

### Option B: Build và Deploy thủ công

```bash
# Build Docker image
docker build -t gcr.io/in360project/phuocbuu:latest .

# Push image
docker push gcr.io/in360project/phuocbuu:latest

# Deploy to Cloud Run
gcloud run deploy phuocbuu \
  --image gcr.io/in360project/phuocbuu:latest \
  --platform managed \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --port 3000 \
  --memory 2Gi \
  --cpu 2 \
  --min-instances 0 \
  --max-instances 10 \
  --timeout 300 \
  --set-env-vars NODE_ENV=production
```

## Bước 4: Setup Environment Variables

Sau khi deploy thành công, set các environment variables:

```bash
gcloud run services update phuocbuu \
  --region=asia-southeast1 \
  --update-env-vars \
    DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19lWWt0anpQSVBHWWxuQkZtZ2c4M20iLCJhcGlfa2V5IjoiMDFLQ1AxUDhFUU04WEYwUlMyQzZaTjlQREciLCJ0ZW5hbnRfaWQiOiIzYzE1ZTgwZjcwMTU1Njg1NjQwZWVmY2Q1YjFjMTQ4NWVjNzcwYzYyYThjNWRlZjU5YjkzNTIyN2FiNDI5ZWY4IiwiaW50ZXJuYWxfc2VjcmV0IjoiNTM4MTFiMDMtYmY2My00MjgyLTg0OTYtMjlmNDEzNTcyOTQ2In0.ZUNycMMaqGyeTjPDuzZrjbiNbZJ3qtPFBwIWa6J99jA",\
    NEXTAUTH_URL="https://phuocbuu-xxxxx-xx.a.run.app",\
    NEXTAUTH_SECRET="your-secret-key",\
    GCS_BUCKET_NAME="thptphuocbuu360",\
    GOOGLE_CLOUD_PROJECT_ID="in360project"
```

**Lưu ý**: Thay `https://phuocbuu-xxxxx-xx.a.run.app` bằng URL thực tế từ lệnh deploy.

## Bước 5: Setup Google Cloud Storage Bucket

```bash
# Chạy script setup bucket
chmod +x scripts/setup-gcs-bucket.sh
./scripts/setup-gcs-bucket.sh
```

## Bước 6: Kiểm tra Deployment

```bash
# Lấy service URL
gcloud run services describe phuocbuu \
  --region=asia-southeast1 \
  --format='value(status.url)'

# Xem logs
gcloud run services logs tail phuocbuu --region=asia-southeast1

# Test health endpoint
curl $(gcloud run services describe phuocbuu --region=asia-southeast1 --format='value(status.url)')/api/health
```

## Quick Deploy Script

Nếu muốn deploy nhanh, sử dụng script:

```bash
chmod +x deploy-cloudshell.sh
./deploy-cloudshell.sh
```

## Troubleshooting

### Lỗi: "Permission denied"
```bash
# Kiểm tra quyền
gcloud projects get-iam-policy in360project

# Grant quyền nếu cần
gcloud projects add-iam-policy-binding in360project \
  --member="user:$(gcloud config get-value account)" \
  --role="roles/run.admin"
```

### Lỗi: "Build failed"
```bash
# Xem build logs
gcloud builds list --limit=5
gcloud builds log BUILD_ID
```

### Lỗi: "Container crashed"
```bash
# Xem logs chi tiết
gcloud run services logs read phuocbuu --region=asia-southeast1 --limit=100
```

## Next Steps

1. ✅ Deploy application
2. ✅ Set environment variables
3. ✅ Setup GCS bucket
4. ✅ Test application
5. ✅ Monitor logs

