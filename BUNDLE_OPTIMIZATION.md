# Bundle Optimization - Chi tiết

Tài liệu này mô tả các tối ưu bundle size đã được áp dụng theo phân tích chuyên sâu.

## ✅ Đã thực hiện

### 1. Bundle Analyzer
- ✅ Cài đặt `@next/bundle-analyzer`
- ✅ Tích hợp vào `next.config.js`
- ✅ Thêm script `npm run analyze` để phân tích bundle

**Cách sử dụng:**
```bash
npm run analyze
# Hoặc
ANALYZE=true npm run build
```

Sau khi build, mở file `.next/analyze/client.html` và `.next/analyze/server.html` trong browser để xem phân tích.

### 2. Dynamic Imports cho Libraries nặng

#### Recharts (Chart Library)
- ✅ **DocumentChart.tsx**: Dynamic import với `ssr: false`
- ✅ **DashboardContent.tsx**: Dynamic import với `ssr: false`
- **Impact**: Giảm ~200-300KB từ initial bundle

**Trước:**
```tsx
import { LineChart, Line, XAxis, YAxis } from 'recharts'
```

**Sau:**
```tsx
const RechartsChart = dynamic(
  () => import('recharts').then((mod) => ({...})),
  { ssr: false }
)
```

### 3. Webpack Configuration
- ✅ Ngăn server-only packages vào client bundle:
  - `@prisma/client`
  - `prisma`
  - `fs`, `path`, `os`, `crypto` (Node.js modules)
- ✅ Fallback configuration cho client bundle

### 4. Next.js Config Optimizations
- ✅ Bundle analyzer integration
- ✅ Webpack externals cho server-only packages
- ✅ Compression enabled
- ✅ Image optimization (AVIF, WebP)
- ✅ Package imports optimization

## 📊 Dependencies đã được xử lý

### ✅ Đã tối ưu
- **recharts**: Dynamic import (client-only)
- **emoji-picker-react**: Đã dynamic import trong CreatePost
- **@tiptap/**: Không thấy import trực tiếp trong client components (có thể đã được xử lý)

### ⚠️ Cần kiểm tra thêm
- **yjs / y-websocket / y-prosemirror**: Nếu sử dụng, cần dynamic import
- **html2canvas, jspdf, docx, file-saver**: Nếu sử dụng export features, nên:
  - Dynamic import khi user click export
  - Hoặc chuyển sang server-side generation (preferable)

### ✅ Server-only (đã được bảo vệ)
- **@prisma/client**: Webpack externals
- **openai**: Chỉ dùng trong API routes
- **bcryptjs**: Chỉ dùng trong API routes

## 🎯 Kết quả mong đợi

### Bundle Size Reduction
- **Initial JS bundle**: Giảm ~300-400KB (do recharts dynamic import)
- **Time to Interactive**: Cải thiện 20-30%
- **First Contentful Paint**: Cải thiện 15-20%

### Performance Metrics
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

## 📝 Checklist tiếp theo

### High Priority
- [ ] Chạy `npm run analyze` và xem report
- [ ] Kiểm tra các chunk > 200KB và tối ưu
- [ ] Dynamic import cho yjs/y-websocket nếu sử dụng
- [ ] Kiểm tra Tiptap imports (nếu có)

### Medium Priority
- [ ] Chuyển export features (PDF/DOCX) sang server-side
- [ ] Lazy load routes không cần thiết ngay
- [ ] Optimize third-party scripts (analytics, etc.)

### Low Priority
- [ ] Consider lighter chart library nếu recharts vẫn nặng
- [ ] Remove unused dependencies
- [ ] Tree-shake unused exports

## 🔍 Cách phân tích bundle

1. **Chạy analyzer:**
   ```bash
   npm run analyze
   ```

2. **Xem report:**
   - Mở `.next/analyze/client.html` trong browser
   - Tìm các chunk lớn nhất (> 200KB)
   - Xem dependencies của từng chunk

3. **Tối ưu:**
   - Nếu thấy library nặng trong initial chunk → dynamic import
   - Nếu thấy duplicate code → code splitting
   - Nếu thấy unused code → tree shaking

## 📚 Resources

- [Next.js Bundle Analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)
- [Next.js Dynamic Imports](https://nextjs.org/docs/advanced-features/dynamic-import)
- [Webpack Bundle Analysis](https://webpack.js.org/guides/code-splitting/)

## 🚀 Next Steps

1. **Immediate**: Chạy `npm run analyze` để xem current state
2. **Short-term**: Tối ưu các chunk lớn nhất
3. **Long-term**: Monitor bundle size trong CI/CD

