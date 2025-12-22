# 🚀 Hướng dẫn Deploy lên Cloud Run - Quick Start

## Bước 1: Chuẩn bị

### 1.1. Kiểm tra gcloud CLI

```bash
# Kiểm tra gcloud đã cài đặt
gcloud --version

# Nếu chưa có, cài đặt:
# macOS: brew install google-cloud-sdk
# Hoặc: https://cloud.google.com/sdk/docs/install
```

### 1.2. Authenticate và Set Project

```bash
# Login vào Google Cloud
gcloud auth login

# Set project
gcloud config set project in360project

# Cấu hình Docker
gcloud auth configure-docker
```

### 1.3. Enable APIs (nếu chưa enable)

```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

## Bước 2: Chuẩn bị Environment Variables

### 2.1. DATABASE_URL (Bắt buộc)

Bạn cần có DATABASE_URL. Có thể là:

**Option A: Prisma Accelerate (Khuyến nghị)**
```bash
export DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=YOUR_API_KEY"
```

**Option B: Direct PostgreSQL**
```bash
export DATABASE_URL="postgresql://user:password@host:5432/dbname"
```

**Option C: Cloud SQL**
```bash
export DATABASE_URL="postgresql://user:password@/dbname?host=/cloudsql/in360project:asia-southeast1:phuocbuu-db"
```

### 2.2. NEXTAUTH_SECRET (Tùy chọn - script sẽ tự generate nếu không có)

```bash
# Generate secret
export NEXTAUTH_SECRET=$(openssl rand -base64 32)
echo "NEXTAUTH_SECRET=${NEXTAUTH_SECRET}"
```

**Lưu ý**: Nếu bạn đã deploy trước đó, hãy dùng lại NEXTAUTH_SECRET cũ để không invalidate sessions.

### 2.3. Google OAuth (Tùy chọn)

```bash
export GOOGLE_CLIENT_ID="your-google-client-id"
export GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

## Bước 3: Deploy

### Option 1: Sử dụng Script (Khuyến nghị)

```bash
cd /Users/vietchung/phuocbuu

# Chạy script deploy
DATABASE_URL="your-database-url" ./deploy-phuocbuu-cloud-run.sh
```

Hoặc với đầy đủ env vars:

```bash
DATABASE_URL="your-database-url" \
NEXTAUTH_SECRET="your-secret" \
GOOGLE_CLIENT_ID="your-client-id" \
GOOGLE_CLIENT_SECRET="your-client-secret" \
./deploy-phuocbuu-cloud-run.sh
```

### Option 2: Sử dụng Cloud Build

```bash
# Submit build với cloudbuild.yaml
gcloud builds submit --config cloudbuild.yaml
```

### Option 3: Deploy thủ công từng bước

```bash
# 1. Build và push image
gcloud builds submit --tag gcr.io/in360project/thptphuocbuu360:latest

# 2. Deploy to Cloud Run
gcloud run deploy thptphuocbuu360 \
  --image gcr.io/in360project/thptphuocbuu360:latest \
  --platform managed \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --port 3000 \
  --memory 2Gi \
  --cpu 2 \
  --min-instances 0 \
  --max-instances 10 \
  --timeout 300 \
  --set-env-vars "NODE_ENV=production"

# 3. Lấy service URL
SERVICE_URL=$(gcloud run services describe thptphuocbuu360 \
  --region asia-southeast1 \
  --format 'value(status.url)')
echo "Service URL: ${SERVICE_URL}"

# 4. Set environment variables
gcloud run services update thptphuocbuu360 \
  --region asia-southeast1 \
  --update-env-vars \
    "DATABASE_URL=${DATABASE_URL}" \
    "NEXTAUTH_URL=${SERVICE_URL}" \
    "NEXTAUTH_SECRET=${NEXTAUTH_SECRET}" \
    "GCS_BUCKET_NAME=thptphuocbuu360" \
    "GOOGLE_CLOUD_PROJECT_ID=in360project" \
    "NODE_ENV=production"
```

## Bước 4: Kiểm tra Deployment

### 4.1. Lấy Service URL

```bash
gcloud run services describe thptphuocbuu360 \
  --region asia-southeast1 \
  --format 'value(status.url)'
```

### 4.2. Xem Logs

```bash
# Real-time logs
gcloud run services logs tail thptphuocbuu360 \
  --region asia-southeast1

# Xem logs gần đây
gcloud run services logs read thptphuocbuu360 \
  --region asia-southeast1 \
  --limit 50
```

### 4.3. Test Service

```bash
# Lấy URL
SERVICE_URL=$(gcloud run services describe thptphuocbuu360 \
  --region asia-southeast1 \
  --format 'value(status.url)')

# Test endpoint
curl ${SERVICE_URL}/api/health
```

## Bước 5: Update NEXTAUTH_URL (Quan trọng!)

Sau khi deploy, cần update NEXTAUTH_URL với service URL thực tế:

```bash
# Lấy service URL
SERVICE_URL=$(gcloud run services describe thptphuocbuu360 \
  --region asia-southeast1 \
  --format 'value(status.url)')

# Update NEXTAUTH_URL
gcloud run services update thptphuocbuu360 \
  --region asia-southeast1 \
  --update-env-vars "NEXTAUTH_URL=${SERVICE_URL}"
```

## Troubleshooting

### Lỗi: "Permission denied"
```bash
# Kiểm tra quyền
gcloud projects get-iam-policy in360project

# Grant quyền nếu cần
gcloud projects add-iam-policy-binding in360project \
  --member="user:YOUR_EMAIL" \
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
gcloud run services logs read thptphuocbuu360 \
  --region asia-southeast1 \
  --limit 100
```

### Lỗi: "Database connection failed"
- Kiểm tra DATABASE_URL đúng format
- Kiểm tra database đang chạy
- Kiểm tra Cloud SQL connection (nếu dùng Cloud SQL)

## Quick Deploy Command (Copy & Paste)

```bash
# Set variables
export DATABASE_URL="your-database-url-here"
export NEXTAUTH_SECRET="${NEXTAUTH_SECRET:-$(openssl rand -base64 32)}"

# Deploy
cd /Users/vietchung/phuocbuu
./deploy-phuocbuu-cloud-run.sh

# Sau khi deploy xong, update NEXTAUTH_URL
SERVICE_URL=$(gcloud run services describe thptphuocbuu360 \
  --region asia-southeast1 \
  --format 'value(status.url)')
gcloud run services update thptphuocbuu360 \
  --region asia-southeast1 \
  --update-env-vars "NEXTAUTH_URL=${SERVICE_URL}"
```

## Lưu ý

1. **DATABASE_URL** là bắt buộc - không có sẽ không deploy được
2. **NEXTAUTH_SECRET** - nếu không set, script sẽ tự generate (nhưng sẽ invalidate sessions cũ)
3. **NEXTAUTH_URL** - cần update sau khi deploy để có service URL thực tế
4. **Build time** - có thể mất 5-15 phút tùy vào kích thước project
5. **First deployment** - có thể mất thêm thời gian để setup

## Các thay đổi đã được commit

Các thay đổi sau đã được thực hiện và cần được deploy:

1. ✅ Sửa lỗi permission thay avatar (giáo viên/học sinh có thể thay avatar của chính mình)
2. ✅ Sửa lỗi cập nhật ngày sinh (dateOfBirth validation)
3. ✅ Cải thiện error handling và logging cho avatar upload
4. ✅ Thêm GET handler cho avatar endpoint

Sau khi deploy, các fix này sẽ có hiệu lực trên production.

