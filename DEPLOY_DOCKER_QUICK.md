# 🚀 Hướng dẫn Deploy Docker lên Cloud Run

## ⚡ Deploy Nhanh (3 Bước)

### Bước 1: Chuẩn bị
```bash
# Login vào Google Cloud
gcloud auth login

# Set project
gcloud config set project in360project

# Configure Docker
gcloud auth configure-docker
```

### Bước 2: Chạy Script Deploy
```bash
./deploy-docker.sh
```

Script sẽ tự động:
- ✅ Build Docker image
- ✅ Push lên Google Container Registry
- ✅ Deploy lên Cloud Run
- ✅ Hiển thị Service URL

### Bước 3: Cấu hình Environment Variables

Sau khi deploy lần đầu, cập nhật env vars:

```bash
gcloud run services update thptphuocbuu360 \
  --region=asia-southeast1 \
  --update-env-vars \
    DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=YOUR_KEY",\
    NEXTAUTH_URL="https://thptphuocbuu360-xxxxx-xx.a.run.app",\
    NEXTAUTH_SECRET="$(openssl rand -base64 32)",\
    NODE_ENV="production",\
    GOOGLE_CLIENT_ID="your-google-client-id",\
    GOOGLE_CLIENT_SECRET="your-google-client-secret",\
    GCS_BUCKET_NAME="thptphuocbuu360",\
    GOOGLE_CLOUD_PROJECT_ID="in360project"
```

---

## 📋 Chi tiết

### Service Configuration
- **Project ID**: `in360project`
- **Service Name**: `thptphuocbuu360`
- **Region**: `asia-southeast1`
- **Image**: `gcr.io/in360project/thptphuocbuu360:latest`

### Resources
- **Memory**: 2Gi
- **CPU**: 2
- **Instances**: 0-10 (auto-scaling)
- **Timeout**: 300s

---

## 🔧 Commands Hữu Ích

### Xem Logs
```bash
# Real-time logs
gcloud run services logs tail thptphuocbuu360 --region=asia-southeast1

# Recent logs
gcloud run services logs read thptphuocbuu360 --region=asia-southeast1 --limit=100
```

### Lấy Service URL
```bash
gcloud run services describe thptphuocbuu360 \
  --region=asia-southeast1 \
  --format='value(status.url)'
```

### Update Environment Variables
```bash
gcloud run services update thptphuocbuu360 \
  --region=asia-southeast1 \
  --update-env-vars KEY=VALUE
```

### Rollback Version
```bash
# List revisions
gcloud run revisions list --service=thptphuocbuu360 --region=asia-southeast1

# Rollback to specific revision
gcloud run services update-traffic thptphuocbuu360 \
  --region=asia-southeast1 \
  --to-revisions=REVISION_NAME=100
```

---

## 🐛 Troubleshooting

### Docker Build Failed
```bash
# Check Docker is running
docker ps

# Clean Docker cache
docker system prune -a
```

### Push Failed
```bash
# Re-configure Docker auth
gcloud auth configure-docker

# Check permissions
gcloud projects get-iam-policy in360project
```

### Deployment Failed
```bash
# Check Cloud Run logs
gcloud run services logs read thptphuocbuu360 --region=asia-southeast1 --limit=50

# Check service status
gcloud run services describe thptphuocbuu360 --region=asia-southeast1
```

---

## 📊 Post-Deployment Checklist

- [ ] Service URL accessible
- [ ] Environment variables set correctly
- [ ] Database connection working
- [ ] OAuth login working
- [ ] File uploads working (GCS)
- [ ] Logs show no errors

---

## 🔄 Quick Redeploy

Sau khi update code:

```bash
# Pull latest code
git pull

# Run deploy script
./deploy-docker.sh
```

---

## 🆘 Need Help?

Check:
1. [Google Cloud Console - Cloud Run](https://console.cloud.google.com/run?project=in360project)
2. [Container Registry](https://console.cloud.google.com/gcr/images/in360project?project=in360project)
3. Service logs in Cloud Run dashboard

---

## ⚙️ Advanced: Manual Deploy

Nếu cần deploy thủ công từng bước:

```bash
# 1. Build
docker build -t gcr.io/in360project/thptphuocbuu360:latest .

# 2. Push
docker push gcr.io/in360project/thptphuocbuu360:latest

# 3. Deploy
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
  --set-env-vars NODE_ENV=production
```

---

## 🔐 Security Note

**QUAN TRỌNG**: Không commit các file sau:
- `.env`
- `.env.local`
- Any files với credentials

Các file này đã được thêm vào `.gitignore`.
