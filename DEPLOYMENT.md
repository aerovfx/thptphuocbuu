# Google Cloud Run Deployment Guide

## Prerequisites

1. **Google Cloud SDK (gcloud CLI)**
   ```bash
   # Install gcloud CLI
   # macOS
   brew install google-cloud-sdk
   
   # Or download from: https://cloud.google.com/sdk/docs/install
   ```

2. **Docker**
   ```bash
   # Install Docker Desktop
   # macOS: https://www.docker.com/products/docker-desktop
   ```

3. **Google Cloud Project**
   - Project ID: `gen-lang-client-0712182643`
   - Ensure billing is enabled

## Initial Setup

### 1. Authenticate with Google Cloud

```bash
# Login to Google Cloud
gcloud auth login

# Set the project
gcloud config set project gen-lang-client-0712182643

# Configure Docker to use gcloud as credential helper
gcloud auth configure-docker
```

### 2. Enable Required APIs

```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

### 3. Set Environment Variables

Create a `.env.production` file with your production environment variables:

```env
# Database
DATABASE_URL="your-production-database-url"

# NextAuth
NEXTAUTH_URL="https://your-service-url.run.app"
NEXTAUTH_SECRET="your-secret-key"

# Other environment variables...
```

## Deployment Methods

### Method 1: Using Deployment Script (Recommended)

```bash
# Make script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

### Method 2: Using Cloud Build

```bash
# Submit build to Cloud Build
gcloud builds submit --config cloudbuild.yaml
```

### Method 3: Manual Deployment

```bash
# 1. Build Docker image
docker build -t gcr.io/gen-lang-client-0712182643/phuocbuu:latest .

# 2. Push to Container Registry
docker push gcr.io/gen-lang-client-0712182643/phuocbuu:latest

# 3. Deploy to Cloud Run
gcloud run deploy phuocbuu \
  --image gcr.io/gen-lang-client-0712182643/phuocbuu:latest \
  --platform managed \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --port 3000 \
  --memory 2Gi \
  --cpu 2 \
  --min-instances 0 \
  --max-instances 10 \
  --timeout 300 \
  --set-env-vars NODE_ENV=production
```

## Setting Environment Variables

### Using gcloud CLI

```bash
gcloud run services update phuocbuu \
  --region asia-southeast1 \
  --update-env-vars DATABASE_URL="your-database-url",NEXTAUTH_SECRET="your-secret"
```

### Using Cloud Console

1. Go to Cloud Run console
2. Select your service
3. Click "Edit & Deploy New Revision"
4. Go to "Variables & Secrets" tab
5. Add environment variables
6. Click "Deploy"

## Database Setup

### Prisma Migrations

Before deploying, run migrations:

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database (for development)
npx prisma db push

# Or create migration (for production)
npx prisma migrate deploy
```

### Using Prisma Accelerate

If using Prisma Accelerate, ensure `DATABASE_URL` is set correctly in Cloud Run environment variables.

## Monitoring & Logs

### View Logs

```bash
# View logs
gcloud run services logs read phuocbuu --region asia-southeast1

# Follow logs
gcloud run services logs tail phuocbuu --region asia-southeast1
```

### View Service Status

```bash
gcloud run services describe phuocbuu --region asia-southeast1
```

## Updating the Service

### Update Environment Variables

```bash
gcloud run services update phuocbuu \
  --region asia-southeast1 \
  --update-env-vars KEY=VALUE
```

### Rollback to Previous Revision

```bash
# List revisions
gcloud run revisions list --service phuocbuu --region asia-southeast1

# Rollback to specific revision
gcloud run services update-traffic phuocbuu \
  --region asia-southeast1 \
  --to-revisions REVISION_NAME=100
```

## Troubleshooting

### Common Issues

1. **Build fails**
   - Check Dockerfile syntax
   - Ensure all dependencies are in package.json
   - Check build logs: `gcloud builds list`

2. **Service won't start**
   - Check environment variables
   - View logs: `gcloud run services logs read phuocbuu --region asia-southeast1`
   - Ensure PORT is set to 3000

3. **Database connection errors**
   - Verify DATABASE_URL is correct
   - Check database firewall rules
   - Ensure Prisma Client is generated

### Debugging

```bash
# SSH into Cloud Run container (if needed)
gcloud run services proxy phuocbuu --region asia-southeast1

# Check service configuration
gcloud run services describe phuocbuu --region asia-southeast1 --format yaml
```

## CI/CD Setup

### GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloud Run

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - id: 'auth'
        uses: 'google-github-actions/auth@v1'
        with:
          credentials_json: '${{ secrets.GCP_SA_KEY }}'
      
      - name: 'Set up Cloud SDK'
        uses: 'google-github-actions/setup-gcloud@v1'
      
      - name: 'Deploy to Cloud Run'
        run: |
          gcloud builds submit --config cloudbuild.yaml
```

## Cost Optimization

- **Min instances**: Set to 0 to scale to zero when not in use
- **Max instances**: Adjust based on traffic
- **Memory**: Start with 2Gi, adjust based on usage
- **CPU**: Start with 2, adjust based on load

## Security

1. **Environment Variables**: Never commit secrets to git
2. **IAM**: Use service accounts with minimal permissions
3. **HTTPS**: Cloud Run provides HTTPS by default
4. **Authentication**: Consider using `--no-allow-unauthenticated` for internal services

## Useful Commands

```bash
# List all services
gcloud run services list --region asia-southeast1

# Get service URL
gcloud run services describe phuocbuu --region asia-southeast1 --format 'value(status.url)'

# Delete service
gcloud run services delete phuocbuu --region asia-southeast1

# View quotas
gcloud compute project-info describe --project gen-lang-client-0712182643
```

