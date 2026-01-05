# Hướng dẫn Upload Video Lớn (> 32MB) lên Google Cloud Storage

## Vấn đề

Cloud Run có giới hạn **32MB** cho HTTP request body. Video lớn hơn 32MB sẽ gặp lỗi **413 Payload Too Large**.

## Giải pháp: Direct Upload với Signed URLs

Thay vì upload qua Cloud Run, frontend sẽ:
1. Gọi API để lấy **signed URL**
2. Upload file **trực tiếp lên GCS** qua signed URL
3. Sử dụng public URL của file đã upload

## API Endpoint

### POST /api/upload/signed-url

**Request Body:**
```json
{
  "fileName": "my-video.mp4",
  "fileType": "video/mp4",
  "fileSize": 35651584
}
```

**Response:**
```json
{
  "signedUrl": "https://storage.googleapis.com/thptphuocbuu360/posts/1234567890-abc123.mp4?X-Goog-Algorithm=...",
  "publicUrl": "https://storage.googleapis.com/thptphuocbuu360/posts/1234567890-abc123.mp4",
  "filePath": "posts/1234567890-abc123.mp4",
  "expiresIn": 900
}
```

## Frontend Implementation (React/Next.js)

### Option 1: Fetch API

```typescript
async function uploadVideoDirectly(file: File) {
  try {
    // Step 1: Get signed URL
    const response = await fetch('/api/upload/signed-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to get upload URL')
    }

    const { signedUrl, publicUrl } = await response.json()

    // Step 2: Upload directly to GCS
    const uploadResponse = await fetch(signedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
    })

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload file')
    }

    // Step 3: Use publicUrl in your post
    console.log('File uploaded successfully:', publicUrl)
    return publicUrl

  } catch (error) {
    console.error('Upload error:', error)
    throw error
  }
}
```

### Option 2: Axios

```typescript
import axios from 'axios'

async function uploadVideoDirectly(file: File) {
  try {
    // Step 1: Get signed URL
    const { data } = await axios.post('/api/upload/signed-url', {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    })

    // Step 2: Upload to GCS
    await axios.put(data.signedUrl, file, {
      headers: {
        'Content-Type': file.type,
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total!
        )
        console.log(`Upload progress: ${percentCompleted}%`)
      },
    })

    return data.publicUrl

  } catch (error) {
    console.error('Upload error:', error)
    throw error
  }
}
```

### Option 3: With Upload Progress

```typescript
async function uploadWithProgress(
  file: File,
  onProgress: (progress: number) => void
) {
  // Step 1: Get signed URL
  const response = await fetch('/api/upload/signed-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    }),
  })

  const { signedUrl, publicUrl } = await response.json()

  // Step 2: Upload with XMLHttpRequest for progress tracking
  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const progress = Math.round((e.loaded / e.total) * 100)
        onProgress(progress)
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        resolve(publicUrl)
      } else {
        reject(new Error('Upload failed'))
      }
    })

    xhr.addEventListener('error', () => reject(new Error('Upload failed')))

    xhr.open('PUT', signedUrl)
    xhr.setRequestHeader('Content-Type', file.type)
    xhr.send(file)
  })
}
```

## React Component Example

```tsx
'use client'

import { useState } from 'react'

export function VideoUploadForm() {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
    if (!allowedTypes.includes(file.type)) {
      alert('Chỉ chấp nhận video MP4, WebM, OGG, MOV')
      return
    }

    // Validate file size (50MB for normal users)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      alert(`Video quá lớn. Dung lượng tối đa là ${maxSize / (1024 * 1024)}MB`)
      return
    }

    try {
      setUploading(true)
      setProgress(0)

      // Upload video
      const url = await uploadWithProgress(file, setProgress)
      setVideoUrl(url)

      alert('Upload thành công!')

    } catch (error) {
      console.error(error)
      alert('Upload thất bại. Vui lòng thử lại.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <input
        type="file"
        accept="video/*"
        onChange={handleFileChange}
        disabled={uploading}
      />

      {uploading && (
        <div>
          <p>Đang upload... {progress}%</p>
          <progress value={progress} max={100} />
        </div>
      )}

      {videoUrl && (
        <div>
          <p>URL video: {videoUrl}</p>
          <video src={videoUrl} controls width="400" />
        </div>
      )}
    </div>
  )
}
```

## Update Existing Upload Logic

### Before (Old Method - Limited to 32MB):

```typescript
// ❌ OLD - Bị giới hạn 32MB
const formData = new FormData()
formData.append('file', videoFile)

const response = await fetch('/api/posts/upload', {
  method: 'POST',
  body: formData,
})
```

### After (New Method - Up to 100MB):

```typescript
// ✅ NEW - Lên đến 100MB
const publicUrl = await uploadVideoDirectly(videoFile)

// Use publicUrl when creating post
await fetch('/api/posts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: postContent,
    videoUrl: publicUrl,
    type: 'VIDEO',
  }),
})
```

## File Size Limits

- **Images:** 5MB (qua `/api/posts/upload` - không cần signed URL)
- **Videos (Normal Users):** 50MB (qua `/api/upload/signed-url`)
- **Videos (Premium Users):** 100MB (qua `/api/upload/signed-url`)

## Security Notes

- Signed URLs expire sau 15 phút
- Chỉ authenticated users mới lấy được signed URL
- File type và size được validate trên server
- CORS đã được cấu hình trên GCS bucket

## Error Handling

```typescript
try {
  const url = await uploadVideoDirectly(file)
} catch (error) {
  if (error.message.includes('quá lớn')) {
    // File too large
  } else if (error.message.includes('không được hỗ trợ')) {
    // Unsupported file type
  } else {
    // Generic error
  }
}
```

## Testing

1. **Test với video nhỏ (< 32MB):**
   - Cả 2 methods đều hoạt động
   - Recommend sử dụng signed URL để consistency

2. **Test với video lớn (> 32MB):**
   - PHẢI dùng signed URL method
   - Old method sẽ trả về 413 error

## Migration Checklist

- [ ] Update frontend upload component
- [ ] Replace FormData upload with signed URL method
- [ ] Add progress indicator
- [ ] Test với video < 32MB
- [ ] Test với video > 32MB (33-50MB)
- [ ] Test error cases (file too large, wrong type)
- [ ] Update user documentation
