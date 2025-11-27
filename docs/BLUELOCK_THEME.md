# 🎨 BLUELOCK Inspired Theme

## Màu sắc chủ đạo

### Dark Blue (Background)
- `bluelock-dark`: `#0a1628` - Màu nền chính
- `bluelock-dark-2`: `#0f1f3a` - Màu nền phụ
- `bluelock-dark-3`: `#15284d` - Màu nền sáng hơn

### Medium Blue
- `bluelock-blue`: `#1e3a5f` - Màu border và hover
- `bluelock-blue-light`: `#2d4f7a` - Màu hover sáng hơn

### Bright Green (Accent)
- `bluelock-green`: `#00ff88` - Màu accent chính (như "2nd SEASON" trong poster)
- `bluelock-green-bright`: `#00ffaa` - Màu accent sáng hơn
- `bluelock-green-dark`: `#00cc6a` - Màu accent tối hơn

### Gradient Colors
- `bluelock-purple`: `#6b46c1` - Màu gradient
- `bluelock-pink`: `#ec4899` - Màu gradient

## Cách sử dụng

### Background Colors
```tsx
<div className="bg-bluelock-dark">...</div>
<div className="bg-bluelock-blue">...</div>
<div className="bg-bluelock-gradient">...</div>
```

### Text Colors
```tsx
<span className="text-bluelock-green">Accent text</span>
<span className="text-bluelock-text-primary">Primary text</span>
<span className="text-bluelock-text-secondary">Secondary text</span>
```

### Buttons
```tsx
<button className="bg-bluelock-green hover:bg-bluelock-green-bright text-black shadow-bluelock-glow">
  Button
</button>
```

### Borders
```tsx
<div className="border border-bluelock-blue">...</div>
<div className="border-bluelock-glow">...</div>
```

### Effects
```tsx
<span className="text-bluelock-glow">Glowing text</span>
<span className="text-distressed">Distressed text effect</span>
<div className="geometric-overlay">...</div>
```

## Background Gradients

### Main Gradient
```css
bg-bluelock-gradient
/* linear-gradient(135deg, #0a1628 0%, #15284d 25%, #1e3a5f 50%, #6b46c1 75%, #ec4899 100%) */
```

### Vertical Gradient
```css
bg-bluelock-gradient-vertical
/* linear-gradient(180deg, #0a1628 0%, #0f1f3a 50%, #15284d 100%) */
```

### Accent Gradient
```css
bg-bluelock-accent
/* linear-gradient(135deg, #00ff88 0%, #00ffaa 100%) */
```

## Shadow Effects

### Glow Shadow
```tsx
<div className="shadow-bluelock-glow">...</div>
<div className="shadow-bluelock-glow-lg">...</div>
```

## Custom CSS Classes

### Distressed Text
Tạo hiệu ứng text như trong poster BLUELOCK:
```tsx
<span className="text-distressed">THPT Phước Bửu</span>
```

### Geometric Overlay
Pattern overlay giống poster:
```tsx
<div className="geometric-overlay">...</div>
```

## Scrollbar Styling

Scrollbar đã được customize với màu BLUELOCK:
- Track: `#0a1628` (dark blue)
- Thumb: Gradient từ `#1e3a5f` đến `#00ff88`
- Hover: Gradient từ `#2d4f7a` đến `#00ffaa`

## Component: BluelockAccent

Component helper để tạo accent text:
```tsx
import BluelockAccent from '@/components/Common/BluelockAccent'

<BluelockAccent variant="glow">Highlighted Text</BluelockAccent>
```

Variants:
- `default`: Màu xanh lá cơ bản
- `glow`: Màu xanh lá với glow effect
- `gradient`: Gradient từ xanh lá sáng đến xanh lá tối

