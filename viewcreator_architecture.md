# KIẾN TRÚC HỆ THỐNG - VIEWCREATOR
## Social Media Content Management Platform

---

## 1. TỔNG QUAN HỆ THỐNG

### 1.1 Mô tả
ViewCreator là nền tảng quản lý và tạo nội dung đa kênh social media, tích hợp AI để tự động hóa quy trình sản xuất và phân phối nội dung trên các nền tảng YouTube, Instagram, Facebook, TikTok và X (Twitter).

### 1.2 Mục tiêu kinh doanh
- Tối ưu hóa quy trình tạo nội dung cho creators và brands
- Tự động hóa việc phân phối nội dung đa nền tảng
- Cung cấp insights và analytics để tối ưu chiến lược nội dung
- Hỗ trợ AI trong việc tạo captions, hashtags, và viral clips

---

## 2. KIẾN TRÚC TỔNG THỂ

### 2.1 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Web App    │  │  Mobile App  │  │ Desktop App  │          │
│  │  (React.js)  │  │(React Native)│  │   (Electron) │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ HTTPS/WSS
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                     API GATEWAY LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           API Gateway (Kong/AWS API Gateway)              │  │
│  │  - Rate Limiting    - Authentication    - Load Balance   │  │
│  │  - Request Routing  - API Versioning    - Monitoring     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│  Auth Service │  │  Core Service │  │  AI Service   │
└───────────────┘  └───────────────┘  └───────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                    BUSINESS LOGIC LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐              │
│  │   Content   │ │  Platform   │ │  Analytics  │              │
│  │   Service   │ │   Service   │ │   Service   │              │
│  └─────────────┘ └─────────────┘ └─────────────┘              │
│                                                                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐              │
│  │    Agent    │ │   Calendar  │ │   Profile   │              │
│  │   Service   │ │   Service   │ │   Service   │              │
│  └─────────────┘ └─────────────┘ └─────────────┘              │
│                                                                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐              │
│  │   Trends    │ │   Billing   │ │Notification │              │
│  │   Service   │ │   Service   │ │   Service   │              │
│  └─────────────┘ └─────────────┘ └─────────────┘              │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         AEROVIDO VIDEO GENERATION SERVICES               │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │  │
│  │  │Video Gen │ │  Render  │ │ Timeline │ │ Version  │   │  │
│  │  │ Service  │ │ Service  │ │ Service  │ │ Control  │   │  │
│  │  │(Port 3005)│ │(Port 3012)│ │(Port 3013)│ │(Port 3014)│   │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                    DATA ACCESS LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │               Repository Pattern / ORM Layer              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│   PostgreSQL  │  │     Redis     │  │   MongoDB     │
│   (Primary)   │  │    (Cache)    │  │  (Analytics)  │
└───────────────┘  └───────────────┘  └───────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES LAYER                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ YouTube  │ │Instagram │ │ Facebook │ │  TikTok  │          │
│  │   API    │ │   API    │ │   API    │ │   API    │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│                                                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ X (API)  │ │  OpenAI  │ │   AWS    │ │  Stripe  │          │
│  │          │ │   API    │ │    S3    │ │   API    │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   INFRASTRUCTURE LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           Message Queue (RabbitMQ / AWS SQS)              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │          CDN (CloudFlare / AWS CloudFront)                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │      Monitoring & Logging (Prometheus, Grafana, ELK)      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. CHI TIẾT CÁC THÀNH PHẦN

### 3.1 Client Layer

#### 3.1.1 Web Application
- **Technology**: React.js, TypeScript, Tailwind CSS
- **State Management**: Redux Toolkit / Zustand
- **Features**:
  - Responsive design
  - Real-time updates (WebSocket)
  - Progressive Web App (PWA)
  - Drag-and-drop interface

#### 3.1.2 Mobile Application
- **Technology**: React Native
- **Platform**: iOS, Android
- **Features**:
  - Native camera integration
  - Push notifications
  - Offline mode support

#### 3.1.3 Desktop Application
- **Technology**: Electron
- **Platform**: Windows, macOS
- **Features**:
  - File system access
  - Advanced video editing
  - Batch processing

### 3.2 API Gateway Layer

```yaml
API Gateway:
  Provider: Kong / AWS API Gateway
  Functions:
    - Authentication & Authorization (JWT)
    - Rate Limiting:
        - Starter: 25 credits/month
        - Pro/Ultra: Higher limits
    - Request/Response transformation
    - API versioning (v1, v2)
    - Load balancing
    - Circuit breaker pattern
    - Request logging
    - CORS handling
```

### 3.3 Microservices Architecture

#### 3.3.1 Authentication Service
```typescript
Service: Auth Service
Port: 3001
Technology: Node.js, Express, JWT, OAuth2

Responsibilities:
  - User registration/login
  - OAuth integration (Google, Facebook)
  - JWT token generation/validation
  - Session management
  - Password reset
  - 2FA (Two-Factor Authentication)

Endpoints:
  POST   /api/v1/auth/register
  POST   /api/v1/auth/login
  POST   /api/v1/auth/logout
  POST   /api/v1/auth/refresh
  POST   /api/v1/auth/forgot-password
  POST   /api/v1/auth/reset-password
  GET    /api/v1/auth/verify-email
```

#### 3.3.2 Content Service
```typescript
Service: Content Service
Port: 3002
Technology: Node.js, Express, Multer, FFmpeg

Responsibilities:
  - Content creation and management
  - Media upload (images, videos)
  - Content generation using AI
  - Caption and hashtag generation
  - Content scheduling
  - Draft management

Endpoints:
  POST   /api/v1/content/create
  GET    /api/v1/content/:id
  PUT    /api/v1/content/:id
  DELETE /api/v1/content/:id
  GET    /api/v1/content/list
  POST   /api/v1/content/generate-caption
  POST   /api/v1/content/generate-hashtags
  POST   /api/v1/content/upload-media

Database Tables:
  - contents
  - media_files
  - content_drafts
  - content_templates
```

#### 3.3.3 Platform Service
```typescript
Service: Platform Service
Port: 3003
Technology: Node.js, Express

Responsibilities:
  - Social media platform integration
  - OAuth connection management
  - Content publishing to platforms
  - Platform-specific formatting
  - Cross-posting automation

Platforms:
  - YouTube
  - Instagram
  - Facebook
  - TikTok
  - X (Twitter)

Endpoints:
  POST   /api/v1/platforms/connect
  DELETE /api/v1/platforms/disconnect
  GET    /api/v1/platforms/list
  POST   /api/v1/platforms/publish
  GET    /api/v1/platforms/:platform/pages

Database Tables:
  - connected_accounts
  - platform_credentials
  - publish_history
  - platform_settings
```

#### 3.3.4 Analytics Service
```typescript
Service: Analytics Service
Port: 3004
Technology: Node.js, Express, MongoDB

Responsibilities:
  - Track content performance
  - Generate insights
  - Cross-platform analytics
  - Engagement metrics
  - Trend analysis
  - Custom reports

Endpoints:
  GET    /api/v1/analytics/overview
  GET    /api/v1/analytics/content/:id
  GET    /api/v1/analytics/platform/:platform
  GET    /api/v1/analytics/trends
  GET    /api/v1/analytics/reports
  POST   /api/v1/analytics/custom-report

Metrics Tracked:
  - Views
  - Likes
  - Comments
  - Shares
  - Engagement rate
  - Reach
  - Impressions
  - Click-through rate
```

#### 3.3.5 AI Service
```typescript
Service: AI Service
Port: 3005
Technology: Python, FastAPI, OpenAI, TensorFlow

Responsibilities:
  - Content generation (captions, hooks)
  - Video clipping (AI Clipping Agent)
  - Trend prediction
  - Image generation
  - Sentiment analysis
  - Auto-moderation

Endpoints:
  POST   /api/v1/ai/generate-caption
  POST   /api/v1/ai/generate-hook
  POST   /api/v1/ai/clip-video
  POST   /api/v1/ai/generate-image
  POST   /api/v1/ai/analyze-sentiment
  POST   /api/v1/ai/suggest-hashtags
  GET    /api/v1/ai/trending-topics

AI Models:
  - GPT-4 (OpenAI)
  - DALL-E (Image generation)
  - Custom trained models
  - Video analysis models
```

#### 3.3.5.1 Aerovido Video Generation Service (Extended AI Service)

**Overview**: Aerovido is an advanced video generation pipeline integrated into the AI Service, enabling users to create short videos (<5 minutes) through a structured workflow: Character Design → Environment Sketch → Script (3-Act) → Storyboard (with human-in-the-loop) → Video Generation.

**Architecture Integration**:

```
┌───────────────────────────────────────────────────────────────┐
│                  AEROVIDO VIDEO GENERATION PIPELINE            │
├───────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │  Character   │→ │ Environment  │→ │  Script 3    │        │
│  │   Builder    │  │   Sketch     │  │   Act Editor │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │  Storyboard  │→ │   Preview    │→ │    Final     │        │
│  │ Editor(HITL) │  │  Generation  │  │  Generation  │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                 │
└───────────────────────────┬───────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────┐
│                    MULTI-LLM ROUTER LAYER                      │
├───────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Task-Based Model Selection with Fallback Strategy     │  │
│  │                                                          │  │
│  │  High Quality/Creative: Grok-3 → o1 → Gemini 2.0       │  │
│  │  Balanced/Fast: GPT-4o → Gemini 1.5 Flash → Grok-2     │  │
│  │  Cheap/Offline: Ollama (Llama3.1-70B, Qwen2.5-72B)     │  │
│  │  Image Specific: Flux.1 → SD3 → Gemini Imagen          │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                                 │
└───────────────────────────┬───────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│ Cloud AI APIs │  │  Local Models │  │ Video Gen APIs│
│ • Gemini      │  │  • Ollama     │  │ • Kling 2.0   │
│ • Grok/xAI    │  │  • ComfyUI    │  │ • Runway Gen-3│
│ • OpenAI      │  │  • XTTS-v2    │  │ • Luma Ray2   │
│ • Flux.1      │  │  • Wav2Lip    │  │ • Pika 2.1    │
└───────────────┘  └───────────────┘  └───────────────┘
```

**Service Specifications**:

```typescript
Service: Aerovido Video Generation Service
Port: 3005 (Extended AI Service)
Technology: Python, FastAPI, FFmpeg, ComfyUI, Ollama

Responsibilities:
  - Character design and consistency management
  - Environment/background generation
  - 3-act script generation
  - Storyboard creation with HITL (Human-in-the-Loop)
  - Keyframe image generation
  - Voice synthesis and lip-sync
  - Video generation and assembly
  - Multi-LLM routing and fallback management
  - Cost optimization through model selection

Endpoints:
  # Character Design
  POST   /api/v1/aerovido/character/create
  GET    /api/v1/aerovido/character/:id
  PUT    /api/v1/aerovido/character/:id
  
  # Environment
  POST   /api/v1/aerovido/environment/generate
  GET    /api/v1/aerovido/environment/:id
  
  # Script Generation
  POST   /api/v1/aerovido/script/generate
  GET    /api/v1/aerovido/script/:id
  PUT    /api/v1/aerovido/script/:id
  
  # Storyboard
  POST   /api/v1/aerovido/storyboard/create
  GET    /api/v1/aerovido/storyboard/:id
  PUT    /api/v1/aerovido/storyboard/:id/frame/:frameId
  POST   /api/v1/aerovido/storyboard/:id/regenerate-frame
  
  # Shot Management (Film Production Pipeline)
  POST   /api/v1/aerovido/sequence/create
  GET    /api/v1/aerovido/sequence/:id
  POST   /api/v1/aerovido/scene/create
  GET    /api/v1/aerovido/scene/:id
  POST   /api/v1/aerovido/shot/create
  GET    /api/v1/aerovido/shot/:id
  PUT    /api/v1/aerovido/shot/:id
  POST   /api/v1/aerovido/shot/:id/take
  GET    /api/v1/aerovido/shot/:id/takes
  PUT    /api/v1/aerovido/take/:id/select
  
  # Asset Library & Management
  POST   /api/v1/aerovido/asset-library/create
  GET    /api/v1/aerovido/asset-library/list
  GET    /api/v1/aerovido/asset-library/:id
  POST   /api/v1/aerovido/asset-library/:id/version
  GET    /api/v1/aerovido/asset-library/:id/versions
  POST   /api/v1/aerovido/asset-library/:id/duplicate
  
  # Animatic Generation (Pre-visualization)
  POST   /api/v1/aerovido/animatic/generate
  GET    /api/v1/aerovido/animatic/:id
  GET    /api/v1/aerovido/animatic/:id/preview
  
  # Timeline & Editing
  POST   /api/v1/aerovido/timeline/create
  GET    /api/v1/aerovido/timeline/:id
  PUT    /api/v1/aerovido/timeline/:id/insert-shot
  PUT    /api/v1/aerovido/timeline/:id/rearrange
  PUT    /api/v1/aerovido/timeline/:id/transition
  POST   /api/v1/aerovido/timeline/:id/render
  
  # Version Control
  POST   /api/v1/aerovido/versions/commit
  GET    /api/v1/aerovido/versions/history
  POST   /api/v1/aerovido/versions/rollback/:versionId
  POST   /api/v1/aerovido/versions/branch
  POST   /api/v1/aerovido/versions/merge
  GET    /api/v1/aerovido/versions/compare/:v1/:v2
  
  # Video Generation with Quality Control
  POST   /api/v1/aerovido/video/generate
  GET    /api/v1/aerovido/video/:id/status
  GET    /api/v1/aerovido/video/:id/preview
  POST   /api/v1/aerovido/video/:id/render-proxy
  POST   /api/v1/aerovido/video/:id/render-final
  
  # Render Queue Management
  GET    /api/v1/aerovido/render-queue
  GET    /api/v1/aerovido/render-queue/:jobId/status
  PUT    /api/v1/aerovido/render-queue/:jobId/priority
  DELETE /api/v1/aerovido/render-queue/:jobId
  
  # Continuity Management
  GET    /api/v1/aerovido/continuity/:sceneId
  POST   /api/v1/aerovido/continuity/:sceneId/update
  GET    /api/v1/aerovido/continuity/:sceneId/check
  
  # Multi-LLM Router
  POST   /api/v1/aerovido/llm/route
  GET    /api/v1/aerovido/llm/models/available
  GET    /api/v1/aerovido/llm/usage-stats

Database Tables:
  # Core Tables
  - aerovido_projects
  - aerovido_characters
  - aerovido_environments
  - aerovido_scripts
  - aerovido_storyboards
  - aerovido_storyboard_frames
  - aerovido_videos
  - aerovido_llm_usage
  - aerovido_character_references (Vector DB)
  
  # Film Production Pipeline Tables
  - aerovido_sequences (Act 1, Act 2, Act 3)
  - aerovido_scenes (Location-based grouping)
  - aerovido_shots (Individual camera setups)
  - aerovido_takes (Multiple attempts per shot)
  - aerovido_asset_library (Reusable assets)
  - aerovido_asset_versions (Version history)
  - aerovido_animatics (Pre-visualization videos)
  - aerovido_timelines (Non-linear editing)
  - aerovido_timeline_tracks (Video/audio tracks)
  - aerovido_project_versions (Version control)
  - aerovido_render_jobs (Render queue)
  - aerovido_continuity_states (Scene continuity tracking)
  - aerovido_cinematography_presets (Camera/lighting presets)
```

**Multi-LLM Router Configuration**:

```yaml
Model Selection Strategy:
  Character Design:
    Primary: Grok-2/Grok-3
    Fallback: GPT-4o → Gemini 1.5 Pro → Ollama (Qwen2.5-72B)
    Type: Cloud → Local
    
  Environment Sketch:
    Primary: Flux.1 [pro] / SD3-Medium
    Fallback: Gemini Image Gen → Flux local (ComfyUI)
    Type: Cloud → Local
    
  Script 3-Act:
    Primary: o1 / Grok-3
    Fallback: Gemini 2.0 Flash → GPT-4o-mini → Llama3.1-70B
    Type: Cloud → Local
    
  Storyboard Generation:
    Primary: Grok-3
    Fallback: o1-preview → Gemini 1.5 Pro → Qwen2.5-32B
    Type: Cloud → Local
    
  Camera & Motion Prompts:
    Primary: Grok-3 (excellent for visual motion description)
    Fallback: o1 → Gemini → Ollama
    Type: Cloud → Local
    
  Image/Keyframe Generation:
    Primary: Flux.1 [dev/pro]
    Fallback: SD3 → Gemini Imagen 3 → Flux/ComfyUI local
    Type: Cloud → Local
    
  Voice Cloning & TTS:
    Primary: ElevenLabs
    Fallback: XTTS-v2 local → Fish Speech → Gemini TTS
    Type: Cloud → Local
    
  Lip-sync:
    Primary: Wav2Lip / SadTalker / LivePortrait local
    Type: Local (priority)
    
  Video Generation:
    Primary: Kling 2.0
    Fallback: Runway Gen-3 → Luma Ray2 → Higgsfield → Pika 2.1
    Type: Cloud (most)
    
  Video Enhancement:
    Primary: Topaz Video AI / ComfyUI workflow
    Type: Local

Cost Control:
  Free/Low-tier Users:
    - Prioritize Ollama + Flux local
    - Limited cloud API calls
    - Queue-based processing
    
  Pro/Ultra Users:
    - Access to premium models (Grok-3, o1, Kling)
    - Priority processing
    - Higher quality settings
    
  Credit System:
    - Token-based for LLM calls
    - Image generation credits
    - Video generation seconds
    - Per-user quota tracking
```

**Character Consistency Engine**:

```yaml
Character Consistency:
  Storage:
    - FaceID embeddings in Vector DB (Pinecone/Qdrant)
    - IP-Adapter reference images
    - Voice timbre ID
    - Character description prompts
    
  Workflow:
    1. Initial character creation
       → Generate reference images
       → Extract FaceID embeddings
       → Store in Vector DB
    
    2. Subsequent generations
       → Retrieve character references
       → Inject into image/video prompts
       → Apply IP-Adapter for consistency
    
  Technologies:
    - Vector DB: Pinecone / Qdrant
    - Face Recognition: InsightFace
    - Image Adapter: IP-Adapter
    - Cache: Redis for quick retrieval
```

**Human-in-the-Loop (HITL) Storyboard System**:

```yaml
HITL Storyboard Features:
  State Management:
    - JSON-based storyboard state
    - Frame-level asset tracking
    - Version history
    
  User Interactions:
    - Edit frame descriptions
    - Regenerate specific frames
    - Reorder frames
    - Add/remove frames
    - Adjust camera movements
    
  Optimization:
    - Only regenerate modified frames
    - Cache unchanged assets
    - Incremental updates
    - Cost savings through selective regeneration
    
  Real-time Preview:
    - WebSocket for live updates
    - Progressive frame loading
    - Thumbnail generation
```

**Video Assembly Pipeline**:

```yaml
Video Assembly:
  Tools:
    - FFmpeg: Video encoding, audio mixing
    - MoviePy: Python video editing
    - ComfyUI: Advanced video workflows
    
  Process:
    1. Keyframe Generation
       → Generate images for each storyboard frame
       → Apply character consistency
    
    2. Motion Generation
       → Send keyframes + prompts to video gen APIs
       → Process in parallel where possible
    
    3. Voice Synthesis
       → Generate dialogue audio
       → Apply voice cloning
       → Sync with video timing
    
    4. Lip-sync
       → Apply Wav2Lip/SadTalker
       → Sync mouth movements to audio
    
    5. Assembly
       → Combine video segments
       → Mix audio tracks
       → Add transitions
       → Apply color grading
    
    6. Enhancement (Optional)
       → Upscale resolution
       → Frame interpolation
       → Color correction
```

**Fallback & Reliability Strategy**:

```yaml
Fallback Chain Examples:
  Text Generation:
    Gemini → timeout/fail → Grok → OpenAI → Ollama local
    
  Video Generation:
    Kling → fail → Runway → Luma → retry queue
    
  Image Generation:
    Flux.1 Pro → rate limit → SD3 → Gemini Imagen → ComfyUI local
    
Retry Logic:
  - Exponential backoff
  - Max 3 retries per provider
  - Circuit breaker pattern
  - Fallback to next provider
  
Error Handling:
  - Graceful degradation
  - User notification
  - Partial result saving
  - Resume capability
```

**Integration with Existing Services**:

```yaml
Content Service Integration:
  - Save generated videos as content
  - Auto-populate captions from script
  - Extract hashtags from script
  - Schedule video posts
  
Platform Service Integration:
  - Format videos for each platform
  - Optimize aspect ratios (vertical/landscape)
  - Platform-specific captions
  - Cross-post generated videos
  
Analytics Service Integration:
  - Track video performance
  - A/B test different scripts/styles
  - Analyze engagement patterns
  
Billing Service Integration:
  - Credit consumption tracking
  - Model usage costs
  - User quota management
  - Premium feature access
```

#### 3.3.5.2 Video Render Service (Distributed Rendering)

```typescript
Service: Video Render Service
Port: 3012
Technology: Python, FastAPI, FFmpeg, Celery, Redis

Responsibilities:
  - Render queue management
  - Distributed rendering across worker nodes
  - Progress tracking and monitoring
  - Result assembly and delivery
  - Render farm orchestration
  - GPU resource allocation
  - Proxy vs. final render management

Endpoints:
  POST   /api/v1/render/submit
  GET    /api/v1/render/queue
  GET    /api/v1/render/queue/:jobId/status
  PUT    /api/v1/render/queue/:jobId/priority
  DELETE /api/v1/render/queue/:jobId/cancel
  GET    /api/v1/render/workers/status
  POST   /api/v1/render/workers/scale
  GET    /api/v1/render/stats

Render Farm Architecture:
  Master Node:
    - Job scheduling and distribution
    - Worker health monitoring
    - Load balancing
    - Result aggregation
    
  Worker Nodes (Auto-scaling):
    - GPU instances for image/video generation
    - CPU instances for audio processing
    - Specialized nodes for lip-sync (GPU required)
    - Automatic scaling based on queue depth
    
  Storage:
    - Shared asset storage (S3)
    - Result cache
    - Intermediate file cleanup
    - Render output delivery

Quality Levels:
  Preview:
    - Resolution: 480p
    - FPS: 15
    - Codec: h264_fast
    - Cost: 1x (baseline)
    - Use: Iteration and editing
    
  Proxy:
    - Resolution: 720p
    - FPS: 24
    - Codec: h264
    - Cost: 2x
    - Use: Client review
    
  Final:
    - Resolution: 4K
    - FPS: 30
    - Codec: h265
    - Cost: 5x
    - Use: Final delivery

Database Tables:
  - aerovido_render_jobs
  - render_workers
  - render_statistics
```

#### 3.3.5.3 Timeline Service (Non-Linear Editing)

```typescript
Service: Timeline Service
Port: 3013
Technology: Node.js, Express, FFmpeg

Responsibilities:
  - Non-linear editing timeline management
  - Shot arrangement and sequencing
  - Transition management
  - Audio track mixing
  - Effect overlays
  - Multi-track editing
  - Timeline rendering

Endpoints:
  POST   /api/v1/timeline/create
  GET    /api/v1/timeline/:id
  PUT    /api/v1/timeline/:id
  DELETE /api/v1/timeline/:id
  
  # Track Management
  POST   /api/v1/timeline/:id/track
  GET    /api/v1/timeline/:id/tracks
  PUT    /api/v1/timeline/:id/track/:trackId
  DELETE /api/v1/timeline/:id/track/:trackId
  
  # Clip Operations
  POST   /api/v1/timeline/:id/insert-clip
  PUT    /api/v1/timeline/:id/clip/:clipId/move
  PUT    /api/v1/timeline/:id/clip/:clipId/trim
  DELETE /api/v1/timeline/:id/clip/:clipId
  
  # Transitions & Effects
  POST   /api/v1/timeline/:id/transition
  PUT    /api/v1/timeline/:id/transition/:transitionId
  POST   /api/v1/timeline/:id/effect
  
  # Rendering
  POST   /api/v1/timeline/:id/render
  GET    /api/v1/timeline/:id/render/status
  GET    /api/v1/timeline/:id/preview

Timeline Features:
  - Multi-track video/audio editing
  - Clip trimming and splitting
  - Transition effects (fade, dissolve, wipe)
  - Audio mixing and ducking
  - Color grading
  - Text overlays and titles
  - Real-time preview
  - Keyframe animation

Database Tables:
  - aerovido_timelines
  - aerovido_timeline_tracks
  - timeline_clips
  - timeline_transitions
  - timeline_effects
```

#### 3.3.5.4 Version Control Service

```typescript
Service: Version Control Service
Port: 3014
Technology: Node.js, Express, Git-like versioning

Responsibilities:
  - Project versioning (Git-like for video projects)
  - Rollback capabilities
  - Version comparison
  - Branch workflows (different cuts)
  - Merge operations
  - Conflict resolution
  - Snapshot management

Endpoints:
  # Version Management
  POST   /api/v1/versions/commit
  GET    /api/v1/versions/history
  GET    /api/v1/versions/:versionId
  POST   /api/v1/versions/rollback/:versionId
  
  # Branching
  POST   /api/v1/versions/branch
  GET    /api/v1/versions/branches
  DELETE /api/v1/versions/branch/:branchName
  
  # Merging
  POST   /api/v1/versions/merge
  GET    /api/v1/versions/conflicts
  POST   /api/v1/versions/resolve-conflict
  
  # Comparison
  GET    /api/v1/versions/compare/:v1/:v2
  GET    /api/v1/versions/diff/:v1/:v2

Version Control Features:
  - Commit with messages
  - Branch creation (e.g., "director-cut", "client-version")
  - Tag important versions
  - Compare versions side-by-side
  - Rollback to any previous state
  - Merge different versions
  - Track who made what changes
  - Delta storage (only store changes)

Use Cases:
  - Create multiple cuts of same video
  - A/B testing different versions
  - Client feedback iterations
  - Collaborative editing
  - Disaster recovery

Database Tables:
  - aerovido_project_versions
  - version_branches
  - version_tags
  - version_diffs
```

#### 3.3.6 Agent Service
```typescript
Service: Agent Service
Port: 3006
Technology: Node.js, Express, Bull Queue

Responsibilities:
  - AI agent creation and management
  - Automated workflows
  - Task scheduling
  - Agent monitoring
  - Custom automation rules

Endpoints:
  POST   /api/v1/agents/create
  GET    /api/v1/agents/list
  GET    /api/v1/agents/:id
  PUT    /api/v1/agents/:id
  DELETE /api/v1/agents/:id
  POST   /api/v1/agents/:id/execute
  GET    /api/v1/agents/:id/history

Agent Types:
  - AI Clipping Agent
  - Content Scheduler Agent
  - Auto-Responder Agent
  - Trend Monitor Agent
```

#### 3.3.7 Calendar Service
```typescript
Service: Calendar Service
Port: 3007
Technology: Node.js, Express

Responsibilities:
  - Content scheduling
  - Calendar management
  - Reminder notifications
  - Bulk scheduling
  - Timezone handling

Endpoints:
  POST   /api/v1/calendar/schedule
  GET    /api/v1/calendar/events
  PUT    /api/v1/calendar/events/:id
  DELETE /api/v1/calendar/events/:id
  GET    /api/v1/calendar/upcoming

Database Tables:
  - scheduled_posts
  - calendar_events
  - reminders
```

#### 3.3.8 Profile Service
```typescript
Service: Profile Service
Port: 3008
Technology: Node.js, Express

Responsibilities:
  - Brand profile management
  - Creator profile management
  - Profile assets (logo, colors, voice)
  - Multi-profile support

Endpoints:
  POST   /api/v1/profiles/create
  GET    /api/v1/profiles/list
  GET    /api/v1/profiles/:id
  PUT    /api/v1/profiles/:id
  DELETE /api/v1/profiles/:id

Database Tables:
  - profiles
  - profile_assets
  - brand_guidelines
```

#### 3.3.9 Trends Service
```typescript
Service: Trends Service
Port: 3009
Technology: Node.js, Express, Python (Data Analysis)

Responsibilities:
  - Topic research
  - Keyword analysis
  - Trending content discovery
  - Competition analysis
  - SEO suggestions

Endpoints:
  GET    /api/v1/trends/topics
  POST   /api/v1/trends/analyze
  GET    /api/v1/trends/compare
  GET    /api/v1/trends/hashtags
  GET    /api/v1/trends/competitors

External APIs:
  - DataForSEO API
  - YouTube Data API
  - Twitter Trends API
  - Google Trends
```

#### 3.3.10 Billing Service
```typescript
Service: Billing Service
Port: 3010
Technology: Node.js, Express, Stripe

Responsibilities:
  - Subscription management
  - Credit system
  - Payment processing
  - Invoice generation
  - Usage tracking

Plans:
  Starter:
    - 25 credits/month
    - Basic features
  Pro:
    - Higher credit limit
    - Advanced features
  Ultra:
    - Maximum credits
    - Enterprise features

Endpoints:
  POST   /api/v1/billing/subscribe
  POST   /api/v1/billing/cancel
  GET    /api/v1/billing/invoices
  GET    /api/v1/billing/usage
  POST   /api/v1/billing/purchase-credits

Database Tables:
  - subscriptions
  - transactions
  - credits
  - invoices
```

#### 3.3.11 Notification Service
```typescript
Service: Notification Service
Port: 3011
Technology: Node.js, Express, Firebase Cloud Messaging

Responsibilities:
  - Push notifications
  - Email notifications
  - In-app notifications
  - Notification preferences
  - Real-time updates

Endpoints:
  POST   /api/v1/notifications/send
  GET    /api/v1/notifications/list
  PUT    /api/v1/notifications/:id/read
  PUT    /api/v1/notifications/preferences
  DELETE /api/v1/notifications/:id

Notification Types:
  - Post published
  - Analytics updates
  - Agent completed tasks
  - Payment reminders
  - System alerts
```

---

## 4. DATABASE SCHEMA

### 4.1 PostgreSQL (Primary Database)

```sql
-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    full_name VARCHAR(255),
    avatar_url TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Profiles Table
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50), -- 'brand' or 'creator'
    logo_url TEXT,
    primary_color VARCHAR(7),
    secondary_color VARCHAR(7),
    voice_tone TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Connected Accounts Table
CREATE TABLE connected_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL, -- 'youtube', 'instagram', etc.
    platform_user_id VARCHAR(255),
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMP,
    account_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contents Table
CREATE TABLE contents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    title VARCHAR(500),
    caption TEXT,
    hashtags TEXT[],
    media_urls TEXT[],
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'scheduled', 'published'
    scheduled_at TIMESTAMP,
    published_at TIMESTAMP,
    platforms VARCHAR(50)[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Agents Table
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50), -- 'clipping', 'scheduler', 'responder'
    config JSONB,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Scheduled Posts Table
CREATE TABLE scheduled_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID REFERENCES contents(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    scheduled_time TIMESTAMP NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'published', 'failed'
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions Table
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plan VARCHAR(50) NOT NULL, -- 'starter', 'pro', 'ultra'
    status VARCHAR(50) DEFAULT 'active',
    credits_remaining INTEGER DEFAULT 25,
    billing_cycle_start DATE,
    billing_cycle_end DATE,
    stripe_subscription_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions Table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50), -- 'subscription', 'credit_purchase', 'credit_usage'
    amount DECIMAL(10, 2),
    credits INTEGER,
    description TEXT,
    stripe_payment_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications Table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    message TEXT,
    type VARCHAR(50),
    read BOOLEAN DEFAULT FALSE,
    data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Aerovido Projects Table
CREATE TABLE aerovido_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'in_progress', 'completed', 'failed'
    character_id UUID,
    environment_id UUID,
    script_id UUID,
    storyboard_id UUID,
    video_id UUID,
    settings JSONB, -- quality preferences, model selections, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Aerovido Characters Table
CREATE TABLE aerovido_characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES aerovido_projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    reference_images TEXT[], -- URLs to reference images
    face_id_embedding VECTOR(512), -- Face embedding for consistency
    voice_timbre_id VARCHAR(255), -- Voice ID for TTS
    style_prompt TEXT, -- Consistent style description
    metadata JSONB, -- Additional character attributes
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Aerovido Environments Table
CREATE TABLE aerovido_environments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES aerovido_projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT, -- Generated environment image
    depth_map_url TEXT, -- Depth map for 3D effects
    style VARCHAR(100), -- 'realistic', 'cartoon', 'anime', etc.
    prompt TEXT, -- Generation prompt
    model_used VARCHAR(100), -- Which model generated it
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Aerovido Scripts Table
CREATE TABLE aerovido_scripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES aerovido_projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500),
    act_one TEXT, -- Setup
    act_two TEXT, -- Confrontation
    act_three TEXT, -- Resolution
    dialogue JSONB, -- Structured dialogue with timestamps
    duration_estimate INTEGER, -- Estimated duration in seconds
    model_used VARCHAR(100), -- Which LLM generated it
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Aerovido Storyboards Table
CREATE TABLE aerovido_storyboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES aerovido_projects(id) ON DELETE CASCADE,
    script_id UUID REFERENCES aerovido_scripts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500),
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'review', 'approved'
    total_frames INTEGER DEFAULT 0,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Aerovido Storyboard Frames Table
CREATE TABLE aerovido_storyboard_frames (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    storyboard_id UUID REFERENCES aerovido_storyboards(id) ON DELETE CASCADE,
    frame_number INTEGER NOT NULL,
    description TEXT,
    camera_movement VARCHAR(100), -- 'pan', 'zoom', 'static', etc.
    duration INTEGER, -- Duration in seconds
    keyframe_image_url TEXT, -- Generated keyframe image
    video_segment_url TEXT, -- Generated video segment
    prompt TEXT, -- Full prompt used for generation
    model_used VARCHAR(100), -- Which model generated it
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'generating', 'completed', 'failed'
    metadata JSONB, -- Additional frame data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(storyboard_id, frame_number)
);

-- Aerovido Videos Table
CREATE TABLE aerovido_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES aerovido_projects(id) ON DELETE CASCADE,
    storyboard_id UUID REFERENCES aerovido_storyboards(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500),
    video_url TEXT, -- Final assembled video URL
    preview_url TEXT, -- Preview/thumbnail URL
    duration INTEGER, -- Duration in seconds
    resolution VARCHAR(20), -- '1080p', '4k', etc.
    aspect_ratio VARCHAR(20), -- '16:9', '9:16', '1:1'
    status VARCHAR(50) DEFAULT 'queued', -- 'queued', 'processing', 'completed', 'failed'
    progress INTEGER DEFAULT 0, -- 0-100 percentage
    error_message TEXT,
    models_used JSONB, -- Track which models were used
    processing_time INTEGER, -- Time taken in seconds
    credits_used INTEGER, -- Credits consumed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Aerovido LLM Usage Tracking Table
CREATE TABLE aerovido_llm_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES aerovido_projects(id) ON DELETE SET NULL,
    task_type VARCHAR(100), -- 'character_design', 'script', 'storyboard', etc.
    model_name VARCHAR(100), -- 'grok-3', 'gpt-4o', 'ollama-llama3.1', etc.
    provider VARCHAR(50), -- 'openai', 'xai', 'google', 'local'
    tokens_used INTEGER,
    cost DECIMAL(10, 6), -- Cost in USD
    latency INTEGER, -- Response time in ms
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- FILM PRODUCTION PIPELINE TABLES
-- ============================================

-- Sequences Table (Act 1, Act 2, Act 3)
CREATE TABLE aerovido_sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES aerovido_projects(id) ON DELETE CASCADE,
    sequence_number INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL, -- "Act 1: The Meeting"
    description TEXT,
    duration_estimate INTEGER, -- Estimated duration in seconds
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, sequence_number)
);

-- Scenes Table (Location-based grouping)
CREATE TABLE aerovido_scenes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sequence_id UUID REFERENCES aerovido_sequences(id) ON DELETE CASCADE,
    scene_number INTEGER NOT NULL,
    location VARCHAR(255), -- "INT. COFFEE SHOP - DAY"
    description TEXT,
    environment_id UUID REFERENCES aerovido_environments(id),
    duration_estimate INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(sequence_id, scene_number)
);

-- Shots Table (Individual camera setups)
CREATE TABLE aerovido_shots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scene_id UUID REFERENCES aerovido_scenes(id) ON DELETE CASCADE,
    shot_number VARCHAR(20) NOT NULL, -- "101A", "101B"
    shot_type VARCHAR(50), -- 'EWS', 'WS', 'MS', 'MCU', 'CU', 'ECU'
    camera_movement VARCHAR(100), -- 'pan', 'tilt', 'dolly', 'track', 'crane', 'steadicam', 'handheld', 'static'
    camera_speed VARCHAR(20), -- 'slow', 'medium', 'fast'
    lens_choice VARCHAR(20), -- '14mm', '24mm', '35mm', '50mm', '85mm', '135mm'
    composition_rule VARCHAR(50), -- 'rule_of_thirds', 'centered', 'golden_ratio'
    focus_type VARCHAR(50), -- 'deep_focus', 'shallow_focus', 'rack_focus'
    duration_seconds INTEGER,
    dialogue TEXT,
    description TEXT,
    complexity_score DECIMAL(3, 2) DEFAULT 1.0, -- For cost estimation
    status VARCHAR(50) DEFAULT 'pending',
    metadata JSONB, -- Additional cinematography data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(scene_id, shot_number)
);

-- Takes Table (Multiple attempts per shot)
CREATE TABLE aerovido_takes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shot_id UUID REFERENCES aerovido_shots(id) ON DELETE CASCADE,
    take_number INTEGER NOT NULL,
    video_url TEXT,
    thumbnail_url TEXT,
    quality_level VARCHAR(20) DEFAULT 'preview', -- 'preview', 'proxy', 'final'
    is_selected BOOLEAN DEFAULT FALSE,
    notes TEXT,
    generation_cost DECIMAL(10, 6),
    generation_time INTEGER, -- Time taken in seconds
    models_used JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(shot_id, take_number)
);

-- Asset Library Table (Reusable assets)
CREATE TABLE aerovido_asset_library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    asset_type VARCHAR(50) NOT NULL, -- 'character', 'environment', 'prop', 'animation', 'lighting'
    name VARCHAR(255) NOT NULL,
    description TEXT,
    base_version_id UUID,
    is_template BOOLEAN DEFAULT FALSE,
    usage_count INTEGER DEFAULT 0,
    tags TEXT[],
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Asset Versions Table (Version history)
CREATE TABLE aerovido_asset_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES aerovido_asset_library(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    data JSONB, -- Asset-specific data
    preview_url TEXT,
    file_urls TEXT[],
    change_description TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(asset_id, version_number)
);

-- Animatics Table (Pre-visualization videos)
CREATE TABLE aerovido_animatics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES aerovido_projects(id) ON DELETE CASCADE,
    storyboard_id UUID REFERENCES aerovido_storyboards(id),
    title VARCHAR(500),
    video_url TEXT,
    duration INTEGER,
    has_voiceover BOOLEAN DEFAULT FALSE,
    has_music BOOLEAN DEFAULT FALSE,
    transition_style VARCHAR(50) DEFAULT 'basic',
    generation_cost DECIMAL(10, 6),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Timelines Table (Non-linear editing)
CREATE TABLE aerovido_timelines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES aerovido_projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    total_duration INTEGER DEFAULT 0,
    fps INTEGER DEFAULT 30,
    resolution VARCHAR(20) DEFAULT '1080p',
    aspect_ratio VARCHAR(20) DEFAULT '16:9',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Timeline Tracks Table (Video/audio tracks)
CREATE TABLE aerovido_timeline_tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timeline_id UUID REFERENCES aerovido_timelines(id) ON DELETE CASCADE,
    track_number INTEGER NOT NULL,
    track_type VARCHAR(20) NOT NULL, -- 'video', 'audio', 'subtitle'
    name VARCHAR(255),
    is_locked BOOLEAN DEFAULT FALSE,
    is_muted BOOLEAN DEFAULT FALSE,
    clips JSONB, -- Array of clip data with in/out points
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(timeline_id, track_number, track_type)
);

-- Project Versions Table (Version control)
CREATE TABLE aerovido_project_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES aerovido_projects(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    branch_name VARCHAR(100) DEFAULT 'main',
    commit_message TEXT,
    snapshot_data JSONB, -- Complete project state snapshot
    parent_version_id UUID REFERENCES aerovido_project_versions(id),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, version_number)
);

-- Render Jobs Table (Render queue)
CREATE TABLE aerovido_render_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES aerovido_projects(id) ON DELETE CASCADE,
    job_type VARCHAR(50), -- 'animatic', 'proxy', 'final', 'shot', 'timeline'
    target_id UUID, -- ID of the target (shot, timeline, etc.)
    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    status VARCHAR(50) DEFAULT 'queued', -- 'queued', 'processing', 'completed', 'failed', 'cancelled'
    progress INTEGER DEFAULT 0, -- 0-100
    estimated_cost DECIMAL(10, 6),
    estimated_time INTEGER, -- Estimated time in seconds
    actual_cost DECIMAL(10, 6),
    actual_time INTEGER,
    dependencies JSONB, -- Array of job IDs this depends on
    result_url TEXT,
    error_message TEXT,
    worker_id VARCHAR(100), -- ID of the worker processing this job
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);

-- Continuity States Table (Scene continuity tracking)
CREATE TABLE aerovido_continuity_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scene_id UUID REFERENCES aerovido_scenes(id) ON DELETE CASCADE,
    shot_id UUID REFERENCES aerovido_shots(id),
    character_states JSONB, -- Array of character state objects
    environment_state JSONB, -- Environment details
    lighting_state JSONB, -- Lighting configuration
    props_state JSONB, -- Props in scene
    previous_shot_reference UUID REFERENCES aerovido_shots(id),
    continuity_notes TEXT,
    issues_detected JSONB, -- Array of detected continuity issues
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cinematography Presets Table (Camera/lighting presets)
CREATE TABLE aerovido_cinematography_presets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    preset_type VARCHAR(50), -- 'camera', 'lighting', 'composition', 'complete'
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    configuration JSONB, -- Complete preset configuration
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Aerovido tables
CREATE INDEX idx_aerovido_projects_user_id ON aerovido_projects(user_id);
CREATE INDEX idx_aerovido_projects_status ON aerovido_projects(status);
CREATE INDEX idx_aerovido_characters_project_id ON aerovido_characters(project_id);
CREATE INDEX idx_aerovido_environments_project_id ON aerovido_environments(project_id);
CREATE INDEX idx_aerovido_scripts_project_id ON aerovido_scripts(project_id);
CREATE INDEX idx_aerovido_storyboards_project_id ON aerovido_storyboards(project_id);
CREATE INDEX idx_aerovido_frames_storyboard_id ON aerovido_storyboard_frames(storyboard_id);
CREATE INDEX idx_aerovido_videos_user_id ON aerovido_videos(user_id);
CREATE INDEX idx_aerovido_videos_status ON aerovido_videos(status);
CREATE INDEX idx_aerovido_llm_usage_user_id ON aerovido_llm_usage(user_id);
CREATE INDEX idx_aerovido_llm_usage_created_at ON aerovido_llm_usage(created_at);

-- Indexes for Film Production Pipeline tables
CREATE INDEX idx_aerovido_sequences_project_id ON aerovido_sequences(project_id);
CREATE INDEX idx_aerovido_scenes_sequence_id ON aerovido_scenes(sequence_id);
CREATE INDEX idx_aerovido_shots_scene_id ON aerovido_shots(scene_id);
CREATE INDEX idx_aerovido_shots_status ON aerovido_shots(status);
CREATE INDEX idx_aerovido_takes_shot_id ON aerovido_takes(shot_id);
CREATE INDEX idx_aerovido_takes_is_selected ON aerovido_takes(is_selected);
CREATE INDEX idx_aerovido_asset_library_user_id ON aerovido_asset_library(user_id);
CREATE INDEX idx_aerovido_asset_library_type ON aerovido_asset_library(asset_type);
CREATE INDEX idx_aerovido_asset_versions_asset_id ON aerovido_asset_versions(asset_id);
CREATE INDEX idx_aerovido_animatics_project_id ON aerovido_animatics(project_id);
CREATE INDEX idx_aerovido_timelines_project_id ON aerovido_timelines(project_id);
CREATE INDEX idx_aerovido_timeline_tracks_timeline_id ON aerovido_timeline_tracks(timeline_id);
CREATE INDEX idx_aerovido_project_versions_project_id ON aerovido_project_versions(project_id);
CREATE INDEX idx_aerovido_render_jobs_user_id ON aerovido_render_jobs(user_id);
CREATE INDEX idx_aerovido_render_jobs_status ON aerovido_render_jobs(status);
CREATE INDEX idx_aerovido_render_jobs_priority ON aerovido_render_jobs(priority);
CREATE INDEX idx_aerovido_continuity_states_scene_id ON aerovido_continuity_states(scene_id);
CREATE INDEX idx_aerovido_cinematography_presets_user_id ON aerovido_cinematography_presets(user_id);


### 4.2 MongoDB (Analytics Database)

```javascript
// Analytics Collection
{
  _id: ObjectId,
  contentId: UUID,
  userId: UUID,
  platform: String,
  metrics: {
    views: Number,
    likes: Number,
    comments: Number,
    shares: Number,
    saves: Number,
    reach: Number,
    impressions: Number,
    engagement_rate: Number,
    ctr: Number
  },
  demographics: {
    age_groups: Object,
    gender: Object,
    locations: Array
  },
  timestamp: Date,
  date: Date
}

// Trends Collection
{
  _id: ObjectId,
  keyword: String,
  platform: String,
  search_volume: Number,
  competition: String,
  trend_score: Number,
  related_keywords: Array,
  timestamp: Date
}

// Agent Execution Logs
{
  _id: ObjectId,
  agentId: UUID,
  userId: UUID,
  executionTime: Date,
  status: String,
  input: Object,
  output: Object,
  error: String,
  duration: Number
}

// Aerovido Video Generation Analytics
{
  _id: ObjectId,
  projectId: UUID,
  videoId: UUID,
  userId: UUID,
  pipeline_stage: String, // 'character', 'environment', 'script', 'storyboard', 'video'
  models_used: [{
    model_name: String,
    provider: String,
    task: String,
    tokens_used: Number,
    cost: Number,
    latency_ms: Number,
    success: Boolean
  }],
  total_cost: Number,
  total_duration_seconds: Number,
  quality_settings: Object,
  timestamp: Date
}

// Aerovido Model Performance Tracking
{
  _id: ObjectId,
  model_name: String,
  provider: String,
  task_type: String,
  avg_latency_ms: Number,
  success_rate: Number,
  total_requests: Number,
  failed_requests: Number,
  avg_cost_per_request: Number,
  last_updated: Date,
  date_range: {
    start: Date,
    end: Date
  }
}

// Aerovido Character References (Vector DB metadata)
{
  _id: ObjectId,
  characterId: UUID,
  userId: UUID,
  face_embeddings: Array, // Face ID embeddings
  reference_image_urls: Array,
  voice_profile: {
    timbre_id: String,
    sample_urls: Array,
    provider: String
  },
  usage_count: Number,
  last_used: Date,
  created_at: Date
}
```

### 4.3 Redis (Cache & Session)

```
Key Patterns:
  - user:session:{userId}          -> User session data
  - content:cache:{contentId}      -> Cached content
  - analytics:cache:{key}          -> Cached analytics
  - rate_limit:{userId}:{endpoint} -> Rate limiting
  - trends:cache                   -> Cached trending topics
  - platform:token:{accountId}     -> Platform tokens
  
  # Aerovido-specific cache patterns
  - aerovido:character:{characterId}:refs     -> Character references (FaceID, voice)
  - aerovido:storyboard:{storyboardId}:state  -> Storyboard editing state
  - aerovido:project:{projectId}:progress     -> Real-time project progress
  - aerovido:llm:availability                 -> Model availability status
  - aerovido:video:{videoId}:status           -> Video generation status
  - aerovido:queue:{userId}                   -> User's video generation queue
  - aerovido:model:{modelName}:health         -> Model health check status
```

---

## 5. DATA FLOW

### 5.1 Content Publishing Flow

```
1. User creates content via UI
   │
   ├─> Client validates input
   │
   └─> POST /api/v1/content/create
       │
       ├─> API Gateway authentication
       │
       └─> Content Service
           │
           ├─> Save draft to PostgreSQL
           │
           ├─> Upload media to S3
           │
           └─> If AI generation requested
               │
               └─> AI Service
                   │
                   ├─> Generate caption/hashtags
                   │
                   └─> Return to Content Service
                       │
                       └─> Update content record

2. User schedules post
   │
   └─> POST /api/v1/calendar/schedule
       │
       └─> Calendar Service
           │
           ├─> Save to scheduled_posts table
           │
           └─> Add to Message Queue
               │
               └─> Background Worker
                   │
                   └─> At scheduled time:
                       │
                       └─> Platform Service
                           │
                           ├─> Format for each platform
                           │
                           ├─> Call platform APIs
                           │
                           ├─> Update publish status
                           │
                           └─> Send notification
```

### 5.2 AI Clipping Flow

```
1. User provides video URL
   │
   └─> POST /api/v1/ai/clip-video
       │
       └─> AI Service
           │
           ├─> Download video from URL/S3
           │
           ├─> Video Analysis
           │   │
           │   ├─> Scene detection
           │   ├─> Audio analysis
           │   └─> Identify viral moments
           │
           ├─> Generate clips
           │   │
           │   ├─> Extract segments
           │   ├─> Apply caption style
           │   └─> Optimize for vertical/landscape
           │
           ├─> Upload clips to S3
           │
           └─> Return clip URLs
               │
               └─> Content Service
                   │
                   └─> Create content records
```

### 5.3 Analytics Collection Flow

```
1. Platform webhooks or scheduled jobs
   │
   └─> Platform Service
       │
       ├─> Fetch metrics from platform APIs
       │
       └─> Analytics Service
           │
           ├─> Process and normalize data
           │
           ├─> Store in MongoDB
           │
           ├─> Update cache (Redis)
           │
           └─> Trigger notifications if thresholds met
```

### 5.4 Aerovido Video Generation Flow

```
1. User initiates video project
   │
   └─> POST /api/v1/aerovido/project/create
       │
       └─> Aerovido Service
           │
           ├─> Create project record
           └─> Return project ID

2. Character Design Phase
   │
   └─> POST /api/v1/aerovido/character/create
       │
       └─> Multi-LLM Router
           │
           ├─> Select model: Grok-3 → GPT-4o → Gemini
           │
           └─> Generate character description
               │
               ├─> POST /api/v1/aerovido/environment/generate
               │   │
               │   └─> Image Generation (Flux.1 → SD3 → Gemini)
               │       │
               │       ├─> Generate reference images
               │       ├─> Extract FaceID embeddings (InsightFace)
               │       ├─> Store in Vector DB (Pinecone/Qdrant)
               │       └─> Cache in Redis
               │
               └─> Voice Profile Setup
                   │
                   └─> ElevenLabs / XTTS-v2
                       │
                       └─> Store voice timbre ID

3. Environment Generation Phase
   │
   └─> POST /api/v1/aerovido/environment/generate
       │
       └─> Multi-LLM Router
           │
           ├─> Generate environment description
           │
           └─> Image Generation
               │
               ├─> Flux.1 [pro] → SD3 → Gemini Imagen
               ├─> Generate background image
               ├─> Create depth map
               ├─> Upload to S3
               └─> Save URLs to database

4. Script Generation Phase (3-Act Structure)
   │
   └─> POST /api/v1/aerovido/script/generate
       │
       └─> Multi-LLM Router
           │
           ├─> Select model: o1 → Grok-3 → Gemini 2.0
           │
           └─> Generate script
               │
               ├─> Act 1: Setup
               ├─> Act 2: Confrontation
               ├─> Act 3: Resolution
               ├─> Dialogue with timing
               ├─> Duration estimation
               └─> Save to database

5. Storyboard Creation Phase (HITL)
   │
   └─> POST /api/v1/aerovido/storyboard/create
       │
       └─> Multi-LLM Router
           │
           ├─> Select model: Grok-3 → o1 → Gemini
           │
           └─> Generate storyboard frames
               │
               ├─> Break script into scenes
               ├─> Generate frame descriptions
               ├─> Define camera movements
               ├─> Create frame records
               └─> Save storyboard state to Redis
                   │
                   └─> WebSocket notification to client
                       │
                       └─> User reviews storyboard
                           │
                           ├─> If edits needed:
                           │   │
                           │   └─> PUT /api/v1/aerovido/storyboard/:id/frame/:frameId
                           │       │
                           │       └─> POST /api/v1/aerovido/storyboard/:id/regenerate-frame
                           │           │
                           │           └─> Regenerate only modified frames
                           │               │
                           │               └─> Update Redis state
                           │
                           └─> If approved:
                               │
                               └─> Proceed to video generation

6. Video Generation Phase
   │
   └─> POST /api/v1/aerovido/video/generate
       │
       └─> Add to Message Queue (RabbitMQ/SQS)
           │
           └─> Background Worker
               │
               ├─> Update status: 'processing'
               │
               ├─> For each storyboard frame:
               │   │
               │   ├─> Keyframe Generation
               │   │   │
               │   │   ├─> Retrieve character references from Vector DB
               │   │   ├─> Multi-LLM Router → Image Gen
               │   │   │   │
               │   │   │   └─> Flux.1 → SD3 → Gemini Imagen
               │   │   │
               │   │   ├─> Apply IP-Adapter for character consistency
               │   │   ├─> Generate keyframe image
               │   │   └─> Upload to S3
               │   │
               │   └─> Video Segment Generation
               │       │
               │       └─> Multi-Provider Router
               │           │
               │           ├─> Kling 2.0 → Runway Gen-3 → Luma Ray2
               │           ├─> Send keyframe + motion prompt
               │           ├─> Generate video segment
               │           └─> Upload to S3
               │
               ├─> Voice Synthesis (parallel processing)
               │   │
               │   └─> For each dialogue:
               │       │
               │       ├─> Retrieve voice profile
               │       ├─> ElevenLabs → XTTS-v2 → Fish Speech
               │       ├─> Generate audio
               │       └─> Upload to S3
               │
               ├─> Lip-sync Processing
               │   │
               │   └─> For character close-ups:
               │       │
               │       ├─> Wav2Lip / SadTalker / LivePortrait
               │       ├─> Sync mouth to audio
               │       └─> Replace video segment
               │
               ├─> Video Assembly (FFmpeg / MoviePy)
               │   │
               │   ├─> Combine video segments
               │   ├─> Mix audio tracks
               │   ├─> Add transitions
               │   ├─> Apply color grading
               │   └─> Encode final video
               │
               ├─> Optional Enhancement
               │   │
               │   └─> If user selected high quality:
               │       │
               │       ├─> Topaz Video AI / ComfyUI
               │       ├─> Upscale resolution
               │       ├─> Frame interpolation
               │       └─> Color correction
               │
               ├─> Upload final video to S3
               │
               ├─> Update video record
               │   │
               │   ├─> status: 'completed'
               │   ├─> video_url
               │   ├─> duration
               │   ├─> models_used
               │   ├─> credits_used
               │   └─> processing_time
               │
               ├─> Track usage in aerovido_llm_usage
               │
               ├─> Store analytics in MongoDB
               │
               └─> Send notification to user
                   │
                   └─> WebSocket + Push notification
                       │
                       └─> User can preview/download video

7. Integration with Content Service
   │
   └─> User chooses to publish
       │
       └─> POST /api/v1/content/create
           │
           ├─> Create content record
           ├─> Link to Aerovido video
           ├─> Auto-populate caption from script
           ├─> Extract hashtags
           │
           └─> POST /api/v1/calendar/schedule
               │
               └─> Schedule for platform publishing
```


---

## 6. SECURITY ARCHITECTURE

### 6.1 Authentication & Authorization

```yaml
Authentication:
  Method: JWT (JSON Web Tokens)
  Token Types:
    - Access Token: 15 minutes expiry
    - Refresh Token: 7 days expiry
  Storage:
    - Access Token: Memory/HttpOnly Cookie
    - Refresh Token: HttpOnly Cookie

OAuth 2.0:
  Providers:
    - Google
    - Facebook
  Flow: Authorization Code Flow

Authorization:
  Method: RBAC (Role-Based Access Control)
  Roles:
    - Admin
    - User
    - Guest
  
  Permissions:
    - content.create
    - content.read
    - content.update
    - content.delete
    - analytics.view
    - billing.manage
```

### 6.2 Data Protection

```yaml
Encryption:
  At Rest:
    - Database: AES-256
    - S3 Buckets: Server-side encryption
  
  In Transit:
    - TLS 1.3
    - Certificate: Let's Encrypt / AWS Certificate Manager

Secrets Management:
  - AWS Secrets Manager / HashiCorp Vault
  - Environment variables encrypted
  - API keys rotation policy

Data Privacy:
  - GDPR compliant
  - Data anonymization
  - Right to be forgotten
  - Data export functionality
```

### 6.3 API Security

```yaml
Rate Limiting:
  Strategy: Token Bucket
  Limits:
    - Free Tier: 25 requests/minute
    - Pro Tier: 100 requests/minute
    - Ultra Tier: 500 requests/minute

Input Validation:
  - Request schema validation
  - SQL injection prevention
  - XSS protection
  - File upload validation

CORS Policy:
  - Whitelist domains
  - Allowed methods: GET, POST, PUT, DELETE
  - Credentials allowed
```

---

## 7. SCALABILITY & PERFORMANCE

### 7.1 Horizontal Scaling

```yaml
Load Balancing:
  Strategy: Round Robin / Least Connections
  Health Checks: Every 30 seconds
  Auto-scaling:
    - CPU threshold: 70%
    - Min instances: 2
    - Max instances: 10

Database Scaling:
  PostgreSQL:
    - Read replicas for analytics queries
    - Connection pooling (PgBouncer)
    - Partitioning for large tables
  
  MongoDB:
    - Sharding by userId
    - Replica sets for high availability
  
  Redis:
    - Redis Cluster
    - Master-Slave replication
```

### 7.2 Caching Strategy

```yaml
Cache Layers:
  L1 - Application Cache:
    - In-memory cache per service
    - LRU eviction policy
  
  L2 - Redis Cache:
    - Distributed cache
    - TTL: 1 hour for most data
    - Analytics: 5 minutes
    - Trends: 15 minutes
  
  L3 - CDN:
    - CloudFlare / AWS CloudFront
    - Static assets
    - Media files
    - TTL: 24 hours

Cache Invalidation:
  Strategy: Write-through
  Triggers:
    - Content update
    - Profile change
    - Analytics refresh
```

### 7.3 Performance Optimization

```yaml
Database Optimization:
  - Indexing strategy
  - Query optimization
  - Connection pooling
  - Prepared statements

API Optimization:
  - Response compression (gzip)
  - Pagination for large datasets
  - Field filtering
  - GraphQL for flexible queries

Media Optimization:
  - Lazy loading
  - Image compression
  - Video transcoding
  - Progressive loading
  - Adaptive bitrate streaming
```

---

## 8. MONITORING & LOGGING

### 8.1 Monitoring Stack

```yaml
Application Monitoring:
  Tool: Prometheus + Grafana
  Metrics:
    - Request rate
    - Response time (p50, p95, p99)
    - Error rate
    - Active users
    - Database connections
    - Queue depth
    - Cache hit rate

Infrastructure Monitoring:
  Tool: AWS CloudWatch / DataDog
  Metrics:
    - CPU usage
    - Memory usage
    - Disk I/O
    - Network throughput

Uptime Monitoring:
  Tool: UptimeRobot / Pingdom
  Endpoints:
    - /health
    - /api/v1/health
  Frequency: 1 minute
```

### 8.2 Logging Strategy

```yaml
Centralized Logging:
  Stack: ELK (Elasticsearch, Logstash, Kibana)
  
  Log Levels:
    - ERROR: Critical issues
    - WARN: Warning messages
    - INFO: Important events
    - DEBUG: Detailed information

  Log Structure:
    timestamp: ISO 8601
    level: string
    service: string
    trace_id: string
    user_id: string
    message: string
    metadata: object

  Retention:
    - ERROR logs: 90 days
    - WARN logs: 60 days
    - INFO logs: 30 days
    - DEBUG logs: 7 days
```

### 8.3 Alerting

```yaml
Alerting Rules:
  Critical:
    - Service down > 1 minute
    - Error rate > 5%
    - Response time > 3s
    - Database connection failure
  
  Warning:
    - CPU usage > 80%
    - Memory usage > 85%
    - Disk usage > 80%
    - Cache hit rate < 50%

Notification Channels:
  - Email
  - Slack
  - PagerDuty (for critical)

On-call Rotation:
  - 24/7 coverage
  - Primary and backup engineers
```

---

## 9. DISASTER RECOVERY & BACKUP

### 9.1 Backup Strategy

```yaml
Database Backups:
  PostgreSQL:
    - Full backup: Daily
    - Incremental: Every 6 hours
    - Retention: 30 days
    - Location: S3 + Glacier
  
  MongoDB:
    - Full backup: Daily
    - Retention: 30 days
    - Location: S3
  
  Redis:
    - RDB snapshots: Every 6 hours
    - AOF: Every write

Media Backups:
  S3:
    - Cross-region replication
    - Versioning enabled
    - Lifecycle policies
```

### 9.2 Disaster Recovery Plan

```yaml
RTO (Recovery Time Objective): 1 hour
RPO (Recovery Point Objective): 15 minutes

Disaster Scenarios:
  1. Service Failure:
     - Auto-failover to standby
     - Health check triggers
     - Load balancer rerouting
  
  2. Database Failure:
     - Promote read replica
     - Restore from latest backup
     - Point-in-time recovery
  
  3. Region Failure:
     - Failover to backup region
     - DNS update
     - Data sync from backup

Testing:
  - Monthly DR drills
  - Quarterly full failover test
```

---

## 10. DEPLOYMENT STRATEGY

### 10.1 CI/CD Pipeline

```yaml
Source Control: GitHub
CI/CD Tool: GitHub Actions / Jenkins

Pipeline Stages:
  1. Code Commit
     │
     ├─> Trigger CI pipeline
     │
  2. Build
     │
     ├─> Run linter
     ├─> Run unit tests
     ├─> Build Docker images
     │
  3. Test
     │
     ├─> Integration tests
     ├─> E2E tests
     ├─> Security scan
     │
  4. Deploy to Staging
     │
     ├─> Deploy services
     ├─> Run smoke tests
     │
  5. Manual Approval
     │
  6. Deploy to Production
     │
     ├─> Blue-Green deployment
     ├─> Canary release (10% → 50% → 100%)
     ├─> Monitor metrics
     └─> Rollback if needed

Deployment Frequency: Multiple times per day
Rollback Time: < 5 minutes
```

### 10.2 Infrastructure as Code

```yaml
Tool: Terraform

Resources:
  - VPC configuration
  - EC2 instances / ECS clusters
  - RDS databases
  - S3 buckets
  - Load balancers
  - Security groups
  - IAM roles

Version Control: Git
Environment Separation:
  - Development
  - Staging
  - Production
```

---

## 11. COST OPTIMIZATION

### 11.1 Cloud Cost Management

```yaml
Compute:
  - Use spot instances for non-critical workloads
  - Auto-scaling to match demand
  - Reserved instances for stable workloads

Storage:
  - S3 Intelligent-Tiering
  - Lifecycle policies (S3 → Glacier)
  - Compress media files

Database:
  - Right-size instances
  - Use read replicas judiciously
  - Archive old data

Monitoring:
  - Cost anomaly detection
  - Budget alerts
  - Monthly cost reviews
```

---

## 12. TECHNOLOGY STACK SUMMARY

### Backend
- **Runtime**: Node.js 20+, Python 3.11+
- **Frameworks**: Express.js, FastAPI
- **Languages**: TypeScript, Python
- **ORM**: Prisma, SQLAlchemy

### Frontend
- **Framework**: React.js 18+
- **Language**: TypeScript
- **State**: Redux Toolkit / Zustand
- **Styling**: Tailwind CSS
- **Build**: Vite

### Mobile
- **Framework**: React Native
- **Language**: TypeScript

### Databases
- **Primary**: PostgreSQL 15+
- **Analytics**: MongoDB 6+
- **Cache**: Redis 7+

### Message Queue
- **Tool**: RabbitMQ / AWS SQS

### Storage
- **Media**: AWS S3
- **CDN**: CloudFlare / CloudFront

### AI/ML
- **APIs**: OpenAI GPT-4, DALL-E
- **Processing**: TensorFlow, PyTorch
- **Video**: FFmpeg

#### Aerovido Video Generation Stack:
**LLM Providers:**
- **Cloud LLMs**: 
  - xAI (Grok-2, Grok-3)
  - OpenAI (GPT-4o, o1, o1-preview)
  - Google (Gemini 1.5 Pro/Flash, Gemini 2.0)
- **Local LLMs**: 
  - Ollama (Llama3.1-70B, Qwen2.5-32B/72B, Phi-4)

**Image Generation:**
- **Cloud**: Flux.1 [dev/pro], Stable Diffusion 3, Gemini Imagen 3
- **Local**: ComfyUI, Automatic1111, Flux local

**Video Generation:**
- Kling 2.0
- Runway Gen-3
- Luma Ray2
- Higgsfield
- Pika 2.1

**Voice & Audio:**
- **Cloud TTS**: ElevenLabs, Gemini TTS
- **Local TTS**: XTTS-v2, Fish Speech, Silero, Coqui TTS
- **Lip-sync**: Wav2Lip, SadTalker, LivePortrait

**Video Processing:**
- FFmpeg (encoding, assembly)
- MoviePy (Python video editing)
- ComfyUI (advanced workflows)
- Topaz Video AI (enhancement)

**Character Consistency:**
- InsightFace (face recognition)
- IP-Adapter (image adaptation)
- Pinecone/Qdrant (vector DB)

### DevOps
- **Containers**: Docker
- **Orchestration**: Kubernetes / ECS
- **CI/CD**: GitHub Actions
- **IaC**: Terraform
- **Monitoring**: Prometheus, Grafana, ELK

### External APIs
- YouTube Data API v3
- Instagram Graph API
- Facebook Graph API
- TikTok API for Business
- X (Twitter) API v2
- Stripe API
- OpenAI API
- DataForSEO API

#### Aerovido External APIs:
- **xAI API** (Grok-2, Grok-3)
- **Google AI API** (Gemini 1.5, 2.0, Imagen)
- **Replicate API** (Flux.1, SD3)
- **Kling API** (Video generation)
- **Runway API** (Gen-3 video)
- **Luma API** (Ray2 video)
- **Pika API** (Video generation)
- **ElevenLabs API** (Voice cloning & TTS)
- **Pinecone/Qdrant** (Vector database)


---

## 13. DEVELOPMENT ROADMAP

### Phase 1: MVP (3 months)
- ✅ User authentication
- ✅ Basic content creation
- ✅ YouTube & Instagram integration
- ✅ Content scheduling
- ✅ Basic analytics

### Phase 2: AI Integration (2 months)
- 🚧 AI caption generation
- 🚧 AI Clipping Agent
- 🚧 Hashtag suggestions
- 🚧 Image generation
- 🚧 Multi-LLM Router foundation
- 🚧 Credit system for AI features

### Phase 2.5: Aerovido Video Generation Pipeline (3 months)
- 📋 **Character Design Module**
  - Character builder UI
  - FaceID embedding extraction
  - Character consistency engine
  - Voice profile creation
  
- 📋 **Environment Generation**
  - Background image generation
  - Depth map creation
  - Style transfer capabilities
  
- 📋 **Script Generation (3-Act Structure)**
  - AI-powered script writing
  - Dialogue generation
  - Timing and pacing optimization
  - Multi-LLM routing for script quality
  
- 📋 **Storyboard System with HITL**
  - Interactive storyboard editor
  - Frame-by-frame editing
  - Camera movement controls
  - Real-time preview via WebSocket
  - Selective frame regeneration
  
- 📋 **Video Assembly Pipeline**
  - Keyframe image generation
  - Video segment generation
  - Voice synthesis integration
  - Lip-sync processing
  - Final video assembly
  - Quality enhancement options
  
- 📋 **Multi-LLM Router Implementation**
  - Provider integration (Grok, Gemini, OpenAI, Ollama)
  - Fallback chain management
  - Cost optimization logic
  - Model health monitoring
  - Usage analytics

### Phase 3: Multi-Platform (2 months)
- 📋 Facebook integration
- 📋 TikTok integration
- 📋 X (Twitter) integration
- 📋 Cross-posting automation
- 📋 Platform-specific video formatting for Aerovido

### Phase 4: Advanced Features (3 months)
- 📋 Custom AI agents
- 📋 Trend analysis
- 📋 Advanced analytics
- 📋 Collaboration features
- 📋 Aerovido template library
- 📋 Batch video generation
- 📋 A/B testing for video scripts

### Phase 5: Enterprise (Ongoing)
- 📋 Team management
- 📋 White-label solution
- 📋 API for third-party
- 📋 Advanced security features
- 📋 Custom model training for Aerovido
- 📋 Enterprise-grade video generation


---

## 14. COMPLIANCE & STANDARDS

### 14.1 Data Privacy
- GDPR compliance
- CCPA compliance
- Data retention policies
- User data export
- Right to be forgotten

### 14.2 Platform Compliance
- YouTube API Terms of Service
- Instagram Platform Policy
- Facebook Platform Terms
- TikTok Developer Terms
- X Developer Agreement

### 14.3 Security Standards
- OWASP Top 10
- PCI DSS (for payments)
- SOC 2 Type II
- ISO 27001

---

## 15. SUPPORT & MAINTENANCE

### 15.1 Support Tiers
- **Email Support**: All plans
- **Priority Support**: Pro & Ultra
- **24/7 Support**: Enterprise

### 15.2 SLA (Service Level Agreement)
- **Uptime**: 99.9%
- **Response Time**: < 100ms (p95)
- **Support Response**: < 24 hours

### 15.3 Maintenance Windows
- **Scheduled**: Sunday 2 AM - 4 AM UTC
- **Notification**: 48 hours advance
- **Emergency**: As needed with immediate notification

---

## APPENDIX

### A. Glossary
- **Creator**: Individual content creator
- **Brand**: Business or organization
- **Agent**: Automated AI assistant
- **Profile**: Brand identity configuration
- **Platform**: Social media channel
- **Credit**: Usage unit for premium features

### B. References
- YouTube Data API: https://developers.google.com/youtube/v3
- Instagram Graph API: https://developers.facebook.com/docs/instagram-api
- Facebook Graph API: https://developers.facebook.com/docs/graph-api
- TikTok API: https://developers.tiktok.com
- Stripe API: https://stripe.com/docs/api

### C. Contact
- **Technical Support**: support@viewcreator.ai
- **Documentation**: docs.viewcreator.ai
- **Status Page**: status.viewcreator.ai

---

**Document Version**: 2.1 (Film Production Pipeline Integration)  
**Last Updated**: January 3, 2026  
**Author**: System Architect Team  
**Major Changes**: 
- v2.0: Integrated Aerovido video generation pipeline with multi-LLM routing
- v2.1: Added professional film production pipeline features (shot/scene/sequence hierarchy, asset library, timeline editing, version control, render farm, continuity tracking, animatics)
