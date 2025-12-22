# 🚀 Hướng dẫn Deploy lên Google Cloud Run

## Project Information
- **Project ID**: `in360project`
- **Service Name**: `phuocbuu`
- **Region**: `asia-southeast1`
- **Image**: `gcr.io/in360project/phuocbuu:latest`

## 📋 Prerequisites (Yêu cầu)

Trước khi deploy, đảm bảo bạn đã có:

- [ ] Google Cloud SDK (gcloud) đã được cài đặt
- [ ] Docker đã được cài đặt và đang chạy
- [ ] Google Cloud account với billing enabled
- [ ] Project `in360project` đã được tạo và active
- [ ] Quyền truy cập vào project (Owner hoặc Editor)

## 🔧 Bước 1: Cài đặt và Cấu hình

### 1.1. Cài đặt Google Cloud SDK

```bash
# macOS
brew install google-cloud-sdk

# Hoặc tải từ: https://cloud.google.com/sdk/docs/install
```

### 1.2. Authenticate với Google Cloud

```bash
# Login vào Google Cloud
gcloud auth login

# Set project
gcloud config set project in360project

# Cấu hình Docker để push images
gcloud auth configure-docker
```

### 1.3. Enable Required APIs

```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable sqladmin.googleapis.com  # Nếu dùng Cloud SQL
```

## 🗄️ Bước 2: Setup Database

### 2.1. Tạo Cloud SQL Instance (PostgreSQL)

```bash
# Tạo Cloud SQL instance
gcloud sql instances create phuocbuu-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=asia-southeast1 \
  --root-password=YOUR_SECURE_PASSWORD

# Tạo database
gcloud sql databases create phuocbuu --instance=phuocbuu-db

# Tạo user
gcloud sql users create phuocbuu_user \
  --instance=phuocbuu-db \
  --password=YOUR_SECURE_PASSWORD
```

### 2.2. Lấy Connection String

```bash
# Lấy connection name
gcloud sql instances describe phuocbuu-db --format='value(connectionName)'

# Connection string sẽ có dạng:
# in360project:asia-southeast1:phuocbuu-db
```

### 2.3. Chạy Migrations

```bash
# Set DATABASE_URL tạm thời
export DATABASE_URL="postgresql://phuocbuu_user:YOUR_PASSWORD@/phuocbuu?host=/cloudsql/in360project:asia-southeast1:phuocbuu-db"

# Generate Prisma Client
npx prisma generate

# Push schema
npx prisma db push

# Hoặc chạy migrations
npx prisma migrate deploy
```

## 🗄️ Bước 2.5: Setup Google Cloud Storage

### 2.5.1. Tạo và Cấu hình Bucket

```bash
# Chạy script setup
./scripts/setup-gcs-bucket.sh

# Hoặc manual
gsutil mb -p in360project -c STANDARD -l asia-southeast1 gs://thptphuocbuu360
gsutil iam ch allUsers:objectViewer gs://thptphuocbuu360
```

Xem chi tiết trong [GCS_SETUP.md](./GCS_SETUP.md)

## 🔐 Bước 3: Setup Environment Variables

### 3.1. Tạo Secret Manager Secrets (Khuyến nghị)

```bash
# Tạo secrets
echo -n "your-database-url" | gcloud secrets create DATABASE_URL --data-file=-
echo -n "your-nextauth-secret" | gcloud secrets create NEXTAUTH_SECRET --data-file=-
echo -n "your-nextauth-url" | gcloud secrets create NEXTAUTH_URL --data-file=-

# Grant Cloud Run access
gcloud secrets add-iam-policy-binding DATABASE_URL \
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 3.2. Hoặc Set Environment Variables trực tiếp

Sau khi deploy lần đầu, cập nhật env vars:

```bash
gcloud run services update phuocbuu \
  --region=asia-southeast1 \
  --update-env-vars \
    DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=YOUR_API_KEY",\
    NEXTAUTH_URL="https://phuocbuu-xxxxx-xx.a.run.app",\
    NEXTAUTH_SECRET="your-secret-key",\
    NODE_ENV="production",\
    GOOGLE_CLIENT_ID="your-google-client-id",\
    GOOGLE_CLIENT_SECRET="your-google-client-secret",\
    GCS_BUCKET_NAME="thptphuocbuu360",\
    GOOGLE_CLOUD_PROJECT_ID="in360project"
```

**Lưu ý về DATABASE_URL:**
- **Prisma Accelerate** (Khuyến nghị): Sử dụng connection string dạng `prisma+postgres://accelerate.prisma-data.net/?api_key=...`
- **Direct PostgreSQL**: Nếu không dùng Accelerate, sử dụng `postgresql://user:pass@host:5432/dbname`

## 🚀 Bước 4: Deploy

### 4.1. Option A: Sử dụng Script (Khuyến nghị)

```bash
# Chạy script deploy
chmod +x deploy.sh
./deploy.sh
```

### 4.2. Option B: Sử dụng Cloud Build

```bash
# Submit build
gcloud builds submit --config cloudbuild.yaml
```

### 4.3. Option C: Deploy thủ công

```bash
# Build image
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
  --add-cloudsql-instances in360project:asia-southeast1:phuocbuu-db \
  --set-env-vars NODE_ENV=production
```

## 🔗 Bước 5: Cấu hình Cloud SQL Connection

Nếu dùng Cloud SQL, cần thêm connection:

```bash
gcloud run services update phuocbuu \
  --region=asia-southeast1 \
  --add-cloudsql-instances=in360project:asia-southeast1:phuocbuu-db
```

Và cập nhật DATABASE_URL:

```
postgresql://user:pass@/dbname?host=/cloudsql/in360project:asia-southeast1:phuocbuu-db
```

## 📊 Bước 6: Kiểm tra Deployment

### 6.1. Lấy Service URL

```bash
gcloud run services describe phuocbuu \
  --region=asia-southeast1 \
  --format='value(status.url)'
```

### 6.2. Xem Logs

```bash
# Xem logs real-time
gcloud run services logs tail phuocbuu --region=asia-southeast1

# Xem logs với filter
gcloud run services logs read phuocbuu --region=asia-southeast1 --limit=50
```

### 6.3. Kiểm tra Health

```bash
# Test endpoint
curl https://phuocbuu-xxxxx-xx.a.run.app/api/health
```

## 🔄 Bước 7: Update và Redeploy

### 7.1. Update Code

```bash
# Pull latest code
git pull origin main

# Build và deploy lại
./deploy.sh
```

### 7.2. Update Environment Variables

```bash
gcloud run services update phuocbuu \
  --region=asia-southeast1 \
  --update-env-vars KEY=VALUE
```

### 7.3. Rollback nếu cần

```bash
# List revisions
gcloud run revisions list --service=phuocbuu --region=asia-southeast1

# Rollback về revision cũ
gcloud run services update-traffic phuocbuu \
  --region=asia-southeast1 \
  --to-revisions=REVISION_NAME=100
```

## 🛠️ Troubleshooting

### Lỗi: "Permission denied"
```bash
# Kiểm tra quyền
gcloud projects get-iam-policy in360project

# Grant quyền nếu cần
gcloud projects add-iam-policy-binding in360project \
  --member="user:YOUR_EMAIL" \
  --role="roles/run.admin"
```

### Lỗi: "Database connection failed"
- Kiểm tra Cloud SQL instance đang chạy
- Kiểm tra DATABASE_URL đúng format
- Kiểm tra Cloud SQL connection đã được add vào service
- Kiểm tra firewall rules

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

## 📝 Checklist trước khi Deploy

- [ ] Đã set đúng project ID: `in360project`
- [ ] Đã enable tất cả required APIs
- [ ] Database đã được setup và migrations đã chạy
- [ ] Environment variables đã được cấu hình
- [ ] Dockerfile đã được test build thành công
- [ ] `.env` file không được commit (đã có trong .gitignore)
- [ ] NEXTAUTH_URL đã được set đúng với service URL
- [ ] NEXTAUTH_SECRET đã được generate

## 🔒 Security Best Practices

1. **Sử dụng Secret Manager** cho sensitive data
2. **Enable IAM authentication** nếu không cần public access
3. **Set up VPC connector** nếu cần kết nối private resources
4. **Enable Cloud Armor** để bảo vệ khỏi DDoS
5. **Regular security updates** cho dependencies

## 📚 Tài liệu tham khảo

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud SQL Documentation](https://cloud.google.com/sql/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma with Cloud SQL](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-google-cloud-run)

## 🆘 Support

Nếu gặp vấn đề, kiểm tra:
1. Google Cloud Console → Cloud Run → Logs
2. Google Cloud Console → Cloud Build → Build history
3. Google Cloud Console → Cloud SQL → Connections

