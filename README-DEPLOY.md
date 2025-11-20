# 🚀 Quick Start - Deploy to Google Cloud Run

## Project Information
- **Project ID**: `gen-lang-client-0712182643`
- **Service Name**: `phuocbuu`
- **Region**: `asia-southeast1`

## Prerequisites Checklist

- [ ] Google Cloud SDK (gcloud) installed
- [ ] Docker installed and running
- [ ] Google Cloud account with billing enabled
- [ ] Project `gen-lang-client-0712182643` created and active

## Quick Deployment (3 Steps)

### Step 1: Authenticate

```bash
# Login to Google Cloud
gcloud auth login

# Set project
gcloud config set project gen-lang-client-0712182643

# Configure Docker
gcloud auth configure-docker
```

### Step 2: Enable APIs

```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

### Step 3: Deploy

```bash
# Option A: Using deployment script (easiest)
./deploy.sh

# Option B: Using npm script
npm run deploy

# Option C: Manual deployment
npm run docker:build
npm run docker:push
gcloud run deploy phuocbuu \
  --image gcr.io/gen-lang-client-0712182643/phuocbuu:latest \
  --platform managed \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --port 3000 \
  --memory 2Gi \
  --cpu 2
```

## Environment Variables Setup

After first deployment, set your environment variables:

```bash
gcloud run services update phuocbuu \
  --region asia-southeast1 \
  --update-env-vars \
    DATABASE_URL="your-database-url",\
    NEXTAUTH_URL="https://your-service-url.run.app",\
    NEXTAUTH_SECRET="your-secret-key",\
    NODE_ENV="production"
```

## Get Your Service URL

```bash
gcloud run services describe phuocbuu \
  --region asia-southeast1 \
  --format 'value(status.url)'
```

## View Logs

```bash
gcloud run services logs tail phuocbuu --region asia-southeast1
```

## Troubleshooting

If deployment fails:
1. Check logs: `gcloud builds list`
2. Verify Dockerfile syntax
3. Ensure all environment variables are set
4. Check database connectivity

For detailed instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

