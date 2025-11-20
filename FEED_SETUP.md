# Feed Optimization Setup Guide

Hướng dẫn setup các tính năng tối ưu News Feed.

## 📦 Installation

### 1. Base Dependencies (đã có sẵn)

Các dependencies cơ bản đã được cài đặt:
- `next`: Next.js framework
- `prisma`: Database ORM
- `next-auth`: Authentication

### 2. Optional Dependencies

#### Redis (cho caching)

```bash
npm install ioredis
npm install --save-dev @types/ioredis
```

#### Socket.io (cho WebSocket)

```bash
npm install socket.io socket.io-client
npm install --save-dev @types/socket.io @types/socket.io-client
```

## 🔧 Configuration

### Environment Variables

Thêm vào file `.env.local`:

```bash
# Redis (optional - cho caching)
REDIS_URL=redis://localhost:6379

# A/B Testing
AB_TESTING_ENABLED=true
AB_TESTING_TRAFFIC_SPLIT=10

# Real-time Updates
REALTIME_ENABLED=true
REALTIME_POLLING_INTERVAL=10000

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
```

### Redis Setup

#### Option 1: Local Redis

```bash
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis

# Docker
docker run -d -p 6379:6379 redis:alpine
```

#### Option 2: Cloud Redis

- **Upstash**: https://upstash.com/
- **Redis Cloud**: https://redis.com/cloud/
- **AWS ElastiCache**: https://aws.amazon.com/elasticache/

### WebSocket Setup

#### Option 1: Custom Next.js Server

Tạo file `server.js` ở root:

```javascript
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  })

  const io = new Server(server, {
    cors: {
      origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  })

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    socket.on('subscribe-feed', (userId) => {
      socket.join(`feed:${userId}`)
      console.log(`User ${userId} subscribed to feed`)
    })

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)
    })
  })

  const PORT = process.env.PORT || 3000
  server.listen(PORT, () => {
    console.log(`> Ready on http://localhost:${PORT}`)
  })
})
```

Update `package.json`:

```json
{
  "scripts": {
    "dev": "node server.js",
    "start": "NODE_ENV=production node server.js"
  }
}
```

#### Option 2: External WebSocket Service

**Pusher**:
```bash
npm install pusher pusher-js
```

```typescript
// lib/pusher.ts
import Pusher from 'pusher'

export const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
})
```

**Socket.io Client**:
```bash
npm install socket.io-client
```

## 🚀 Usage

### 1. Enable Caching

Caching đã được tích hợp tự động. Chỉ cần setup Redis:

```bash
# Start Redis
redis-server

# Verify connection
redis-cli ping
# Should return: PONG
```

### 2. Enable ML Recommendations

ML recommendations đã được tích hợp tự động vào feed ranking.

Để optimize performance:

```typescript
// lib/feed-service.ts
// ML recommendations được cache tự động
// Có thể pre-compute recommendations trong background jobs
```

### 3. Enable Real-time Updates

#### Client-side:

```typescript
import { useRealtimeFeed } from '@/components/Feed/RealtimeFeed'

function FeedPage() {
  const handleUpdate = (update) => {
    // Refresh feed hoặc update UI
    router.refresh()
  }

  useRealtimeFeed(handleUpdate)

  return <SocialFeed />
}
```

#### Server-side:

Broadcast updates khi có events:

```typescript
import { broadcastFeedUpdate } from '@/app/api/feed/websocket/route'

// Khi có post mới
await broadcastFeedUpdate(userId, 'new_post', { post })

// Khi có like
await broadcastFeedUpdate(userId, 'new_like', { postId, userId })
```

### 4. Setup A/B Testing

A/B testing đã được initialize với default experiments.

Để tạo custom experiment:

```typescript
import { createExperiment } from '@/lib/ab-testing'

createExperiment(
  'custom_experiment',
  'Custom Experiment',
  [
    { id: 'control', name: 'Control', weight: 50, config: {} },
    { id: 'treatment', name: 'Treatment', weight: 50, config: {} },
  ],
  10 // 10% traffic
)
```

## 📊 Monitoring

### Cache Metrics

```typescript
// Check cache hit rate
const cacheStats = await cacheManager.getStats()
console.log('Cache hit rate:', cacheStats.hitRate)
```

### ML Metrics

```typescript
// Track ML recommendation accuracy
const mlAccuracy = await calculateMLAccuracy()
console.log('ML accuracy:', mlAccuracy)
```

### A/B Test Results

```typescript
import { getExperimentResults, calculateSignificance } from '@/lib/ab-testing'

const results = getExperimentResults('my_experiment')
const significance = calculateSignificance(
  'my_experiment',
  'like_count',
  'control',
  'treatment'
)
```

## 🐛 Troubleshooting

### Redis Connection Failed

```bash
# Check Redis is running
redis-cli ping

# Check connection string
echo $REDIS_URL

# Test connection
redis-cli -u $REDIS_URL ping
```

### WebSocket Not Connecting

1. Check custom server is running
2. Verify CORS settings
3. Check network connectivity
4. Use polling fallback

### ML Recommendations Slow

1. Enable caching
2. Reduce candidate pool size
3. Use background jobs for pre-computation
4. Consider using external ML service

### A/B Test Not Working

1. Verify experiment is active
2. Check user assignment
3. Verify metrics tracking
4. Ensure sufficient traffic

## 📚 Next Steps

1. **Production Setup**:
   - Setup Redis cluster
   - Configure WebSocket server
   - Enable monitoring

2. **Optimization**:
   - Tune cache TTLs
   - Optimize ML models
   - Fine-tune A/B test parameters

3. **Scaling**:
   - Horizontal scaling với Redis cluster
   - Load balancing cho WebSocket
   - Distributed ML inference

## 🔗 Resources

- [Feed Optimization Guide](./FEED_OPTIMIZATION_GUIDE.md)
- [Redis Documentation](https://redis.io/docs/)
- [Socket.io Documentation](https://socket.io/docs/)
- [A/B Testing Best Practices](https://www.optimizely.com/optimization-glossary/ab-testing/)

