# Tính năng đăng nhiều ảnh cùng lúc

## Tổng quan
Hệ thống đã được cập nhật để hỗ trợ:
- **Người dùng thường**: Upload video dưới 50MB, không giới hạn thời lượng
- **Người dùng Premium**: Upload video dưới 100MB, không giới hạn thời lượng
- **Tất cả người dùng**: Đăng tối đa 10 ảnh cùng lúc trong một bài viết
- **Xem ảnh phóng to**: Click vào ảnh để xem trong chế độ lightbox với điều hướng

## Các file đã thay đổi

### 1. Database Schema
**File**: `prisma/schema.prisma`
- ✅ Thêm field `images: String[]` vào model Post
- ✅ Giữ lại `imageUrl: String?` để tương thích ngược

### 2. Validation
**File**: `lib/file-validation.ts`
- ✅ Thêm `MAX_IMAGES_COUNT = 10`
- ✅ Thêm `MAX_VIDEO_SIZE_NORMAL = 50MB`
- ✅ Thêm `MAX_VIDEO_SIZE_PREMIUM = 100MB`
- ✅ Cập nhật `validateVideo()` để kiểm tra premium status
- ✅ Bỏ giới hạn thời lượng video

### 3. Components

#### ImageLightbox Component (MỚI)
**File**: `components/Common/ImageLightbox.tsx`
- ✅ Component mới để hiển thị ảnh phóng to
- ✅ Hỗ trợ điều hướng bằng phím mũi tên
- ✅ Hiển thị thumbnails ở dưới
- ✅ Đếm số ảnh (x/y)
- ✅ Đóng bằng phím ESC hoặc click backdrop

#### CreatePost Component
**File**: `components/Social/CreatePost.tsx`
- ✅ Hỗ trợ chọn nhiều ảnh (multiple file input)
- ✅ Hiển thị preview grid cho nhiều ảnh
- ✅ Nút xóa từng ảnh riêng lẻ
- ✅ Click vào ảnh preview để xem lightbox
- ✅ Hiển thị số lượng ảnh đã chọn / tối đa
- ✅ Upload từng ảnh lên server
- ✅ Kiểm tra giới hạn 10 ảnh

#### SocialFeed Component
**File**: `components/Social/SocialFeed.tsx`
- ✅ Hiển thị grid layout cho nhiều ảnh
- ✅ Layout responsive:
  - 1 ảnh: Full width
  - 2 ảnh: 2 cột
  - 3 ảnh: 3 cột
  - 4 ảnh: 2x2 grid
  - 5+ ảnh: 3 cột grid
- ✅ Hiển thị "+N" nếu có hơn 9 ảnh
- ✅ Click vào ảnh để mở lightbox
- ✅ Tương thích ngược với `imageUrl` cũ

### 4. API Routes

#### Upload Route
**File**: `app/api/posts/upload/route.ts`
- ✅ Kiểm tra premium status của user
- ✅ Áp dụng giới hạn dung lượng phù hợp
- ✅ Bỏ logic trim video
- ✅ Upload trực tiếp mà không giới hạn thời lượng

#### Posts Route
**File**: `app/api/posts/route.ts`
- ✅ Thêm `images` vào schema validation
- ✅ Hỗ trợ lưu mảng images vào database
- ✅ Tự động detect post type dựa trên media
- ✅ Tương thích ngược với `imageUrl`

### 5. TypeScript Types
**File**: `components/Social/social-types.ts`
- ✅ Thêm `images?: string[]` vào interface SocialPost

## Grid Layout

### Cách hiển thị dựa trên số lượng ảnh:
```
1 ảnh:    [==========]
2 ảnh:    [====][====]
3 ảnh:    [===][===][===]
4 ảnh:    [====][====]
          [====][====]
5-9 ảnh:  [===][===][===]
          [===][===][===]
          [===][===][===]
10 ảnh:   Chỉ hiển thị 9 ảnh đầu + badge "+1"
```

## Tính năng Lightbox

### Điều khiển:
- **Click ảnh**: Mở lightbox
- **ESC**: Đóng lightbox
- **←→**: Chuyển ảnh trước/sau
- **Click backdrop**: Đóng lightbox
- **Thumbnails**: Click để chuyển đến ảnh cụ thể

### Hiển thị:
- Ảnh fullscreen với background đen
- Nút đóng ở góc trên phải
- Số thứ tự ảnh (x/y) ở trên
- Thumbnails preview ở dưới
- Nút điều hướng hai bên

## Migration Database

Đã chạy lệnh:
```bash
npx prisma db push
```

Database đã được cập nhật với field `images` mới.

## Giới hạn hiện tại

### Video:
- **Người dùng thường**: 50MB, không giới hạn thời lượng
- **Premium/Admin**: 100MB, không giới hạn thời lượng

### Ảnh:
- **Tất cả người dùng**: 10 ảnh/bài, mỗi ảnh tối đa 5MB

## Tương thích ngược

- ✅ Các bài viết cũ với `imageUrl` vẫn hiển thị bình thường
- ✅ Bài viết mới ưu tiên sử dụng `images[]`
- ✅ Nếu có cả `images` và `imageUrl`, ưu tiên `images`

## Testing

### Để test tính năng:
1. Đăng nhập vào hệ thống
2. Thử đăng bài với 1 ảnh - kiểm tra hiển thị full width
3. Thử đăng bài với 2-3 ảnh - kiểm tra grid layout
4. Thử đăng bài với 10 ảnh - kiểm tra giới hạn
5. Click vào ảnh để xem lightbox
6. Sử dụng phím mũi tên để điều hướng
7. Thử upload video với user thường (50MB)
8. Thử upload video với premium (100MB)

## Notes

- Component EditPostModal cần được cập nhật tương tự (hiện chưa làm)
- PostDetailModal cần được cập nhật để hiển thị grid images (hiện chưa làm)
- Có thể thêm lazy loading cho ảnh trong tương lai
- Có thể thêm image compression trước khi upload
