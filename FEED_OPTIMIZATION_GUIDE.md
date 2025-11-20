# Feed Optimization Guide

Hướng dẫn sử dụng các tính năng tối ưu News Feed đã được triển khai.

## 📋 Mục lục

1. [Caching Strategy](#caching-strategy)
2. [Machine Learning Models](#machine-learning-models)
3. [Real-time Updates](#real-time-updates)
4. [A/B Testing Framework](#ab-testing-framework)

---

## 🚀 Caching Strategy

### Tổng quan

Hệ thống sử dụng multi-level cache:
- **L1 Cache**: In-memory (Node.js Map) - TTL: 5 phút
- **L2 Cache**: Redis (nếu available) - TTL: 15 phút
- **L3 Cache**: Database query cache - TTL: 1 giờ

### Cấu hình

1. **Thiết lập Redis** (optional):
```bash
# Thêm vào .env
REDIS_URL=redis://localhost:6379
```

2. **Sử dụng cache trong code**:

```typescript
import { feedCache } from '@/lib/cache'

// Get cached feed
const cachedFeed = await feedCache.getFeed(userId, 'top', query)

// Set cached feed
await feedCache.setFeed(userId, 'top', query, posts)

// Invalidate user's feed cache
await feedCache.invalidateUserFeed(userId)

// Invalidate all feeds (khi có post mới)
await feedCache.invalidateAllFeeds()
```

### Cache Decorator

Sử dụng decorator để tự động cache function results:

```typescript
import { cached } from '@/lib/cache'

class FeedService {
  @cached((userId: string) => `user-feed-${userId}`, { ttl: 300 })
  async getUserFeed(userId: string) {
    // Your logic here
  }
}
```

---

## 🤖 Machine Learning Models

### Collaborative Filtering

Hệ thống hỗ trợ:
- **User-based CF**: Tìm users tương tự dựa trên engagement patterns
- **Item-based CF**: Tìm posts tương tự dựa trên co-engagement
- **Matrix Factorization**: Simplified SVD cho embeddings
- **Hybrid Recommendations**: Kết hợp CF và content-based

### Sử dụng

```typescript
import {
  findSimilarUsers,
  findSimilarPosts,
  getMLRecommendations,
  getHybridRecommendations,
} from '@/lib/ml-service'

// Tìm users tương tự
const similarUsers = await findSimilarUsers(userId, 10)

// Tìm posts tương tự
const similarPosts = await findSimilarPosts(postId, 10)

// Get ML recommendations
const recommendations = await getMLRecommendations(userId, 20)

// Hybrid recommendations (CF + content-based)
const hybridRecs = await getHybridRecommendations(userId, 20)
```

### Tích hợp vào Feed

ML recommendations đã được tích hợp tự động vào feed ranking:
- 20% candidates từ ML recommendations
- Fallback về author-based nếu ML không available

---

## 🔴 Real-time Updates

### Tổng quan

Hệ thống hỗ trợ 2 phương thức:
1. **Server-Sent Events (SSE)**: Real-time streaming
2. **Polling**: Fallback khi SSE không available

### Client-side Usage

```typescript
import { useRealtimeFeed } from '@/components/Feed/RealtimeFeed'

function MyFeedComponent() {
  const handleUpdate = (update: FeedUpdate) => {
    console.log('New update:', update)
    // Refresh feed hoặc update UI
  }

  const { isConnected } = useRealtimeFeed(handleUpdate)

  return (
    <div>
      {isConnected && <span>🟢 Live</span>}
      {/* Your feed UI */}
    </div>
  )
}
```

### API Endpoints

- `GET /api/feed/events`: SSE endpoint (cần custom server)
- `GET /api/feed/updates`: Polling endpoint
- `POST /api/feed/realtime`: Invalidate cache và broadcast updates

### Broadcast Updates

Khi có post mới hoặc engagement:

```typescript
import { broadcastFeedUpdate } from '@/app/api/feed/websocket/route'

// Broadcast new post
await broadcastFeedUpdate(userId, 'new_post', {
  post: { id, content, author }
})

// Broadcast new like
await broadcastFeedUpdate(userId, 'new_like', {
  postId, userId
})
```

### WebSocket Setup (Production)

Next.js App Router không hỗ trợ WebSocket trực tiếp. Options:

1. **Custom Server**:
```javascript
// server.js
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res)
  })

  const io = new Server(server)
  
  io.on('connection', (socket) => {
    socket.on('subscribe-feed', (userId) => {
      socket.join(`feed:${userId}`)
    })
  })

  server.listen(3000)
})
```

2. **External Services**:
- Socket.io
- Pusher
- Ably
- AWS API Gateway WebSocket

---

## 🧪 A/B Testing Framework

### Tổng quan

Framework hỗ trợ:
- Experiment management
- Consistent user assignment (hashing)
- Metrics tracking
- Statistical significance testing (t-test)

### Tạo Experiment

```typescript
import { createExperiment, FEED_EXPERIMENTS } from '@/lib/ab-testing'

// Create new experiment
createExperiment(
  'my_experiment',
  'My Experiment Name',
  [
    { id: 'control', name: 'Control', weight: 50, config: { param: 'value' } },
    { id: 'treatment', name: 'Treatment', weight: 50, config: { param: 'new_value' } },
  ],
  10 // 10% of users
)
```

### Assign User to Variant

```typescript
import { assignToExperiment, getUserVariant } from '@/lib/ab-testing'

// Assign user (consistent hashing)
const variantId = assignToExperiment(userId, 'my_experiment')

// Get user's variant
const variant = getUserVariant(userId, 'my_experiment')
```

### Track Metrics

```typescript
import { trackMetric } from '@/lib/ab-testing'

// Track engagement
trackMetric(userId, 'my_experiment', 'like_count', 1)
trackMetric(userId, 'my_experiment', 'dwell_time', 30) // seconds
trackMetric(userId, 'my_experiment', 'click_through', 1)
```

### Get Results

```typescript
import { getExperimentResults, calculateSignificance } from '@/lib/ab-testing'

// Get experiment results
const results = getExperimentResults('my_experiment')
console.log(results.variants.control.metrics.like_count.avg)
console.log(results.variants.treatment.metrics.like_count.avg)

// Calculate statistical significance
const significance = calculateSignificance(
  'my_experiment',
  'like_count',
  'control',
  'treatment'
)

if (significance.significant) {
  console.log(`Significant! p-value: ${significance.pValue}`)
}
```

### Predefined Experiments

Các experiments mặc định đã được setup:

```typescript
import { FEED_EXPERIMENTS } from '@/lib/ab-testing'

// Freshness weight variation
FEED_EXPERIMENTS.FRESHNESS_WEIGHT

// Diversity lambda tuning
FEED_EXPERIMENTS.DIVERSITY_LAMBDA

// Candidate pool size
FEED_EXPERIMENTS.CANDIDATE_POOL_SIZE

// Ranking model comparison
FEED_EXPERIMENTS.RANKING_MODEL
```

### Tích hợp vào Feed Ranking

A/B testing đã được tích hợp tự động:
- User được assign vào variants khi fetch feed
- Metrics được track khi user tương tác
- Results có thể được query để analyze

---

## 📊 Metrics Tracking

### Engagement Metrics

Các metrics được track tự động:
- `like_count`: Số lượt like
- `comment_count`: Số lượt comment
- `repost_count`: Số lượt repost
- `bookmark_count`: Số lượt bookmark
- `dwell_time`: Thời gian xem (seconds)
- `click_through`: Click-through rate
- `engagement_rate`: Tỷ lệ engagement tổng thể

### Custom Metrics

Bạn có thể track custom metrics:

```typescript
trackMetric(userId, experimentId, 'custom_metric', value)
```

---

## 🔧 Configuration

### Environment Variables

```bash
# Redis (optional)
REDIS_URL=redis://localhost:6379

# A/B Testing
AB_TESTING_ENABLED=true
AB_TESTING_TRAFFIC_SPLIT=10

# Real-time Updates
REALTIME_ENABLED=true
REALTIME_POLLING_INTERVAL=10000
```

---

## 🚀 Performance Tips

1. **Caching**: Luôn enable caching cho production
2. **ML Recommendations**: Cache ML results để giảm computation
3. **Real-time**: Sử dụng SSE/WebSocket thay vì polling khi possible
4. **A/B Testing**: Giới hạn số experiments active cùng lúc
5. **Database**: Index các fields thường query (userId, postId, createdAt)

---

## 📝 Best Practices

1. **Cache Invalidation**: Luôn invalidate cache khi có data changes
2. **Error Handling**: Fallback về simple ranking nếu ML fails
3. **Monitoring**: Track cache hit rates, ML accuracy, A/B test results
4. **Gradual Rollout**: Start với 10% traffic cho A/B tests
5. **Statistical Significance**: Đợi đủ sample size trước khi conclude

---

## 🐛 Troubleshooting

### Cache không hoạt động
- Check Redis connection (nếu dùng Redis)
- Verify cache keys không conflict
- Check TTL settings

### ML Recommendations chậm
- Cache ML results
- Giảm candidate pool size
- Sử dụng background jobs để pre-compute

### Real-time updates không đến
- Check WebSocket/SSE connection
- Verify polling interval
- Check network connectivity

### A/B Test results không chính xác
- Verify user assignment consistency
- Check metrics tracking
- Ensure sufficient sample size

---

## 📚 References

- [Feed Ranking Algorithm](./lib/feed-ranking.ts)
- [Feed Service](./lib/feed-service.ts)
- [Cache Manager](./lib/cache.ts)
- [ML Service](./lib/ml-service.ts)
- [A/B Testing](./lib/ab-testing.ts)

