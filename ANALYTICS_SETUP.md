# 📊 Analytics & Monitoring Setup

Hệ thống đã được tích hợp với **Vercel Analytics** và **Speed Insights** để theo dõi hiệu suất và phân tích người dùng.

## 🎯 Các công cụ đã cài đặt

### 1. **@vercel/analytics** 
- Theo dõi page views, user events
- Real-time analytics dashboard
- Tự động tích hợp với Vercel deployment

### 2. **@vercel/speed-insights**
- Đo lường Core Web Vitals
- Phân tích hiệu suất trang
- Tối ưu hóa performance

## 📦 Packages đã cài đặt

```bash
npm install @vercel/analytics @vercel/speed-insights
```

## ✅ Đã tích hợp

### Root Layout (`app/layout.tsx`)

```tsx
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
```

## 📈 Cách sử dụng

### 1. Xem Analytics Dashboard

- Truy cập: https://vercel.com/dashboard
- Chọn project của bạn
- Vào tab **Analytics** để xem:
  - Page views
  - Unique visitors
  - Top pages
  - Referrers
  - Countries

### 2. Xem Speed Insights

- Vào tab **Speed Insights** trong Vercel dashboard
- Xem Core Web Vitals:
  - LCP (Largest Contentful Paint)
  - FID (First Input Delay)
  - CLS (Cumulative Layout Shift)
  - FCP (First Contentful Paint)

### 3. Track Custom Events (Optional)

```tsx
import { track } from '@vercel/analytics'

// Track custom event
track('document_uploaded', {
  documentType: 'CV',
  userId: user.id,
})
```

## 🔧 Configuration

### Environment Variables

Không cần cấu hình thêm! Vercel Analytics tự động hoạt động khi deploy lên Vercel.

### Development Mode

- Analytics chỉ hoạt động trong production
- Không track events trong development mode
- Để test, cần deploy lên Vercel

## 📊 Metrics được theo dõi

### Analytics
- ✅ Page views
- ✅ Unique visitors
- ✅ Session duration
- ✅ Bounce rate
- ✅ Top pages
- ✅ Referrers
- ✅ Countries
- ✅ Devices
- ✅ Browsers

### Speed Insights
- ✅ LCP (Largest Contentful Paint)
- ✅ FID (First Input Delay)
- ✅ CLS (Cumulative Layout Shift)
- ✅ FCP (First Contentful Paint)
- ✅ TTFB (Time to First Byte)
- ✅ INP (Interaction to Next Paint)

## 🚀 Deployment

Khi deploy lên Vercel:
1. Analytics tự động bật
2. Speed Insights tự động bật
3. Data bắt đầu được collect ngay lập tức
4. Dashboard có sẵn trong Vercel project

## 🔒 Privacy

- Tuân thủ GDPR
- Không collect PII (Personally Identifiable Information)
- Có thể disable trong production nếu cần

## 📝 Notes

- Analytics chỉ hoạt động trên Vercel production
- Development mode không track
- Free tier có giới hạn 100k events/month
- Upgrade plan để có nhiều features hơn

## 🔗 Links

- [Vercel Analytics Docs](https://vercel.com/docs/analytics)
- [Speed Insights Docs](https://vercel.com/docs/speed-insights)
- [Dashboard](https://vercel.com/dashboard)

