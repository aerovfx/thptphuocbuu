# 🗄️ Hướng dẫn Setup Google Cloud Storage

## Thông tin Bucket
- **Bucket Name**: `thptphuocbuu360`
- **Project ID**: `in360project`
- **Region**: `asia-southeast1`

## 📋 Prerequisites

- Google Cloud SDK đã được cài đặt
- Đã authenticate với Google Cloud
- Project `in360project` đã được set

## 🚀 Quick Setup

### Bước 1: Chạy Script Setup

```bash
./scripts/setup-gcs-bucket.sh
```

Script này sẽ:
- Enable Cloud Storage APIs
- Tạo bucket `thptphuocbuu360` (nếu chưa có)
- Set bucket thành public (read-only)
- Cấu hình CORS
- Tạo folder structure
- Grant permissions cho Cloud Run service account

### Bước 2: Cài đặt Dependencies

```bash
npm install @google-cloud/storage
```

### Bước 3: Cấu hình Environment Variables

#### Local Development

Thêm vào file `.env`:

```env
GCS_BUCKET_NAME=thptphuocbuu360
GOOGLE_CLOUD_PROJECT_ID=in360project
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

**Lưu ý**: Để lấy service account key:
1. Vào Google Cloud Console → IAM & Admin → Service Accounts
2. Tạo hoặc chọn service account
3. Tạo key (JSON) và download
4. Set path trong `GOOGLE_APPLICATION_CREDENTIALS`

#### Cloud Run Deployment

```bash
gcloud run services update phuocbuu \
  --region=asia-southeast1 \
  --update-env-vars \
    GCS_BUCKET_NAME=thptphuocbuu360,\
    GOOGLE_CLOUD_PROJECT_ID=in360project
```

**Lưu ý**: Cloud Run tự động sử dụng default service account, không cần set `GOOGLE_APPLICATION_CREDENTIALS`.

## 📁 Folder Structure

Bucket sẽ có cấu trúc như sau:

```
thptphuocbuu360/
├── posts/              # Images/videos cho posts
├── avatars/            # User avatars
├── covers/             # User cover photos
├── brands/
│   ├── logo/          # Brand logos
│   └── document/       # Brand documents
├── documents/          # General documents
├── dms/
│   └── incoming/       # Incoming documents
└── spaces/
    └── {spaceId}/
        └── tasks/
            └── {taskId}/
                ├── images/
                └── attachments/
```

## 🔧 Manual Setup (nếu không dùng script)

### 1. Enable APIs

```bash
gcloud services enable storage-component.googleapis.com
gcloud services enable storage-api.googleapis.com
```

### 2. Create Bucket

```bash
gsutil mb -p in360project -c STANDARD -l asia-southeast1 gs://thptphuocbuu360
```

### 3. Set Public Access

```bash
gsutil iam ch allUsers:objectViewer gs://thptphuocbuu360
```

### 4. Set CORS

Tạo file `cors.json`:

```json
[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "responseHeader": ["Content-Type", "Access-Control-Allow-Origin"],
    "maxAgeSeconds": 3600
  }
]
```

```bash
gsutil cors set cors.json gs://thptphuocbuu360
```

### 5. Grant Cloud Run Access

```bash
PROJECT_NUMBER=$(gcloud projects describe in360project --format='value(projectNumber)')
SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
gsutil iam ch serviceAccount:${SERVICE_ACCOUNT}:roles/storage.objectAdmin gs://thptphuocbuu360
```

## 📝 Usage trong Code

### Upload File

```typescript
import { uploadFileFromFormData } from '@/lib/storage'

const result = await uploadFileFromFormData(file, 'posts', {
  public: true,
  cacheControl: 'public, max-age=31536000',
})

// result.publicUrl - Full public URL
// result.url - Relative path (for backward compatibility)
// result.path - File path in bucket
```

### Delete File

```typescript
import { deleteFile } from '@/lib/storage'

await deleteFile('posts/1234567890-image.jpg')
```

### Get Public URL

```typescript
import { getPublicUrl } from '@/lib/storage'

const url = getPublicUrl('posts/1234567890-image.jpg')
// Returns: https://storage.googleapis.com/thptphuocbuu360/posts/1234567890-image.jpg
```

## 🔒 Security Best Practices

1. **Public vs Private**: 
   - Public assets (images, avatars): Set `public: true`
   - Private documents: Set `public: false` và sử dụng signed URLs

2. **IAM Permissions**:
   - Cloud Run service account: `storage.objectAdmin`
   - Public users: `objectViewer` (read-only)

3. **CORS Configuration**:
   - Chỉ allow origins cần thiết
   - Set `maxAgeSeconds` phù hợp

4. **Lifecycle Policies**:
   - Tự động xóa files cũ (đã cấu hình trong script)

## 🐛 Troubleshooting

### Lỗi: "Bucket does not exist"
```bash
# Kiểm tra bucket
gsutil ls -b gs://thptphuocbuu360

# Tạo nếu chưa có
gsutil mb -p in360project -c STANDARD -l asia-southeast1 gs://thptphuocbuu360
```

### Lỗi: "Permission denied"
```bash
# Kiểm tra IAM permissions
gsutil iam get gs://thptphuocbuu360

# Grant permission
gsutil iam ch serviceAccount:SERVICE_ACCOUNT:roles/storage.objectAdmin gs://thptphuocbuu360
```

### Lỗi: "Cannot find module '@google-cloud/storage'"
```bash
npm install @google-cloud/storage
```

### Files không public
```bash
# Make file public
gsutil acl ch -u AllUsers:R gs://thptphuocbuu360/path/to/file

# Hoặc set bucket-level
gsutil iam ch allUsers:objectViewer gs://thptphuocbuu360
```

## 📊 Monitoring

### View Bucket Usage

```bash
# List all files
gsutil ls -r gs://thptphuocbuu360

# Get bucket size
gsutil du -sh gs://thptphuocbuu360
```

### View in Console

1. Vào Google Cloud Console
2. Navigation Menu → Cloud Storage → Buckets
3. Chọn bucket `thptphuocbuu360`
4. Xem files, permissions, và metrics

## 🔄 Migration từ Local Storage

Nếu đã có files trong `public/uploads`, có thể migrate:

```bash
# Upload to GCS
gsutil -m cp -r public/uploads/* gs://thptphuocbuu360/
```

Sau đó cập nhật database URLs từ `/uploads/...` sang `https://storage.googleapis.com/thptphuocbuu360/...`

## 📚 Tài liệu tham khảo

- [Google Cloud Storage Documentation](https://cloud.google.com/storage/docs)
- [@google-cloud/storage Node.js Client](https://cloud.google.com/nodejs/docs/reference/storage/latest)
- [Cloud Storage Best Practices](https://cloud.google.com/storage/docs/best-practices)

