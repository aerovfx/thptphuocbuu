# ✅ Deployment Checklist - Google Cloud Run

## Project: in360project

### 📋 Pre-Deployment Checklist

#### 1. Google Cloud Setup
- [ ] Google Cloud account đã được tạo
- [ ] Project `in360project` đã được tạo
- [ ] Billing đã được enable
- [ ] Google Cloud SDK (gcloud) đã được cài đặt
- [ ] Đã authenticate: `gcloud auth login`
- [ ] Đã set project: `gcloud config set project in360project`

#### 2. APIs Enable
- [ ] Cloud Build API: `gcloud services enable cloudbuild.googleapis.com`
- [ ] Cloud Run API: `gcloud services enable run.googleapis.com`
- [ ] Container Registry API: `gcloud services enable containerregistry.googleapis.com`
- [ ] Cloud SQL Admin API: `gcloud services enable sqladmin.googleapis.com` (nếu dùng Cloud SQL)

#### 3. Database Setup
- [ ] Cloud SQL instance đã được tạo (hoặc database khác)
- [ ] Database đã được tạo
- [ ] User đã được tạo với quyền phù hợp
- [ ] Prisma migrations đã được chạy
- [ ] Connection string đã được lấy

#### 4. Environment Variables
- [ ] `DATABASE_URL` đã được chuẩn bị
- [ ] `NEXTAUTH_SECRET` đã được generate
- [ ] `NEXTAUTH_URL` đã được set (sẽ update sau khi deploy)
- [ ] `GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_SECRET` (nếu dùng OAuth)
- [ ] `OPENAI_API_KEY` (nếu dùng AI features)

#### 5. Code Preparation
- [ ] Code đã được commit và push
- [ ] Dockerfile đã được test build thành công
- [ ] `.env` file không được commit
- [ ] Dependencies đã được cài đặt: `npm install`

### 🚀 Deployment Steps

#### Step 1: Initial Setup
```bash
# Authenticate
gcloud auth login
gcloud config set project in360project
gcloud auth configure-docker

# Enable APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

#### Step 2: Create Database (nếu chưa có)
```bash
# Chạy script tạo Cloud SQL
./scripts/create-cloud-sql.sh

# Hoặc manual
gcloud sql instances create phuocbuu-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=asia-southeast1
```

#### Step 3: Run Migrations
```bash
# Set DATABASE_URL
export DATABASE_URL="your-database-url"

# Generate và push schema
npx prisma generate
npx prisma db push
```

#### Step 4: Deploy
```bash
# Option 1: Sử dụng script
./deploy.sh

# Option 2: Sử dụng Cloud Build
gcloud builds submit --config cloudbuild.yaml

# Option 3: Manual
npm run docker:build
npm run docker:push
gcloud run deploy phuocbuu \
  --image gcr.io/in360project/phuocbuu:latest \
  --platform managed \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --port 3000 \
  --memory 2Gi \
  --cpu 2
```

#### Step 5: Setup Environment Variables
```bash
# Sử dụng script
./scripts/setup-cloud-run-env.sh

# Hoặc manual
gcloud run services update phuocbuu \
  --region=asia-southeast1 \
  --update-env-vars \
    DATABASE_URL="your-db-url",\
    NEXTAUTH_URL="https://phuocbuu-xxxxx-xx.a.run.app",\
    NEXTAUTH_SECRET="your-secret"
```

#### Step 6: Connect Cloud SQL (nếu dùng)
```bash
# Lấy connection name
CONNECTION_NAME=$(gcloud sql instances describe phuocbuu-db --format='value(connectionName)')

# Add connection
gcloud run services update phuocbuu \
  --region=asia-southeast1 \
  --add-cloudsql-instances=${CONNECTION_NAME}
```

### ✅ Post-Deployment Checklist

- [ ] Service đã được deploy thành công
- [ ] Service URL đã được lấy
- [ ] Environment variables đã được set
- [ ] Database connection đã được test
- [ ] Application đã chạy và accessible
- [ ] Logs không có errors
- [ ] Health check endpoint hoạt động

### 🔍 Verification Commands

```bash
# Lấy service URL
gcloud run services describe phuocbuu \
  --region=asia-southeast1 \
  --format='value(status.url)'

# Xem logs
gcloud run services logs tail phuocbuu --region=asia-southeast1

# Test health endpoint
curl https://phuocbuu-xxxxx-xx.a.run.app/api/health

# List revisions
gcloud run revisions list --service=phuocbuu --region=asia-southeast1
```

### 📝 Important Notes

1. **First Deployment**: Cần set environment variables sau lần deploy đầu tiên
2. **NEXTAUTH_URL**: Phải update sau khi có service URL
3. **Database**: Đảm bảo Cloud SQL instance đang chạy trước khi deploy
4. **Secrets**: Nên sử dụng Secret Manager cho production
5. **Monitoring**: Enable Cloud Monitoring và Logging

### 🆘 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails | Check Dockerfile, run `docker build .` locally |
| Service crashes | Check logs: `gcloud run services logs read phuocbuu` |
| Database connection fails | Verify DATABASE_URL và Cloud SQL connection |
| 403 Forbidden | Check IAM permissions |
| Timeout | Increase timeout: `--timeout 300` |

