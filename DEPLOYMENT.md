# Deployment Guide

## Overview

This guide covers deploying ViniBank to production across different platforms.

## Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Security audit completed
- [ ] Performance tested (Lighthouse 90+)
- [ ] Backup strategy in place
- [ ] Monitoring configured
- [ ] SSL certificate obtained
- [ ] DNS records updated

## Vercel (Recommended)

Vercel is the recommended platform for Next.js applications.

### 1. Connect GitHub Repository

```bash
# Push to GitHub
git push origin main
```

### 2. Import Project in Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Select "Next.js" framework

### 3. Configure Environment Variables

In Vercel dashboard:

```env
DATABASE_URL=postgresql://user:pass@host:5432/vinibank
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
NEXTAUTH_URL=https://yourdomain.com
GOOGLE_ID=<your-google-id>
GOOGLE_SECRET=<your-google-secret>
ENCRYPTION_KEY=<generate-with-crypto>
ENCRYPTION_SALT=<generate-with-crypto>
```

### 4. Setup Database

Option A: **PostgreSQL on Vercel Postgres**

1. Add "Storage" → "Postgres"
2. Get connection string
3. Set `DATABASE_URL`

Option B: **External PostgreSQL**

Use cloud provider (AWS RDS, Heroku Postgres, etc.)

### 5. Deploy

```bash
# Automatic on push to main
git push origin main

# Manual deployment
vercel --prod
```

### 6. Run Migrations

After first deployment:

```bash
# SSH into Vercel or use terminal
npx prisma migrate deploy
npx prisma db seed
```

---

## Docker Deployment

### Dockerfile

```dockerfile
FROM node:18-alpine AS base
WORKDIR /app
RUN npm install -g npm@latest

# Build stage
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --only=production && \
    npm cache clean --force

# Build dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Build application
FROM base AS builder
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Production image
FROM base AS runner
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json
COPY prisma ./prisma

EXPOSE 3000
CMD ["npm", "run", "start"]
```

### Build and Run

```bash
# Build image
docker build -t vinibank:latest .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e NEXTAUTH_SECRET="..." \
  -e NEXTAUTH_URL="https://yourdomain.com" \
  -e ENCRYPTION_KEY="..." \
  -e ENCRYPTION_SALT="..." \
  vinibank:latest

# Push to registry
docker tag vinibank:latest yourregistry/vinibank:latest
docker push yourregistry/vinibank:latest
```

---

## AWS Deployment

### Using ECS + Fargate

1. **Create ECR Repository**

```bash
aws ecr create-repository --repository-name vinibank
```

2. **Build and Push Image**

```bash
docker build -t vinibank:latest .
docker tag vinibank:latest <account-id>.dkr.ecr.<region>.amazonaws.com/vinibank:latest
docker push <account-id>.dkr.ecr.<region>.amazonaws.com/vinibank:latest
```

3. **Create ECS Cluster**

```bash
aws ecs create-cluster --cluster-name vinibank-prod
```

4. **Create Task Definition**

```json
{
  "family": "vinibank",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "vinibank",
      "image": "<account-id>.dkr.ecr.<region>.amazonaws.com/vinibank:latest",
      "portMappings": [{"containerPort": 3000}],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "NEXTAUTH_URL", "value": "https://yourdomain.com"}
      ],
      "secrets": [
        {"name": "DATABASE_URL", "valueFrom": "arn:aws:secretsmanager:..."},
        {"name": "ENCRYPTION_KEY", "valueFrom": "arn:aws:secretsmanager:..."}
      ]
    }
  ]
}
```

5. **Create ECS Service**

```bash
aws ecs create-service \
  --cluster vinibank-prod \
  --service-name vinibank-app \
  --task-definition vinibank \
  --desired-count 2 \
  --launch-type FARGATE
```

---

## Environment-Specific Configurations

### Development

```env
NODE_ENV=development
NEXTAUTH_URL=http://localhost:3000
DEBUG=true
```

### Staging

```env
NODE_ENV=production
NEXTAUTH_URL=https://staging.vinibank.com
LOG_LEVEL=info
```

### Production

```env
NODE_ENV=production
NEXTAUTH_URL=https://vinibank.com
LOG_LEVEL=warn
ENABLE_MONITORING=true
```

---

## Database Migrations

### Before Deployment

1. **Test migrations locally**

```bash
npm run db:push
```

2. **Create backup**

```bash
pg_dump $DATABASE_URL > backup.sql
```

3. **Run migrations in production**

```bash
PRISMA_SKIP_ENGINE_CHECK=1 npx prisma migrate deploy
```

### Rollback

```bash
# If migration fails
PRISMA_SKIP_ENGINE_CHECK=1 npx prisma migrate resolve --rolled-back <migration-name>
```

---

## Monitoring & Logging

### Sentry (Error Tracking)

1. Create Sentry project
2. Add environment variable:

```env
SENTRY_DSN=https://...@sentry.io/...
```

### CloudWatch (AWS)

Logs automatically sent if using CloudWatch logging driver.

### Application Logging

Logs sent to stdout (captured by container runtime).

---

## SSL/TLS Certificates

### Let's Encrypt (Free)

For self-hosted:

```bash
certbot certonly --standalone -d yourdomain.com
```

### Vercel

Automatic SSL certificates included.

---

## Performance Optimization

### Image Optimization

Already configured with `next/image`.

### Static Generation

Critical pages use ISR:

```typescript
export const revalidate = 3600; // Revalidate every hour
```

### Database Indexing

Create indexes for frequently queried fields:

```sql
CREATE INDEX idx_user_email ON "User"(email);
CREATE INDEX idx_account_user_id ON "Account"("userId");
CREATE INDEX idx_transaction_account ON "Transaction"("fromAccountId", "toAccountId");
```

---

## Security in Production

### 1. Enable HTTPS Only

All traffic redirects to HTTPS (Vercel/AWS default).

### 2. Security Headers

Already configured in `src/lib/security.ts`.

### 3. Rate Limiting

Enabled on all endpoints. Increase limits as needed:

```typescript
const rateLimiter = new RateLimiter(100, 60); // 100 req/min
```

### 4. Secrets Management

- Never commit `.env` files
- Use platform-specific secret managers:
  - Vercel: Environment Variables
  - AWS: Secrets Manager
  - Docker: Secrets or external manager

### 5. Database Encryption

Enable at-rest encryption:
- AWS RDS: Enable encryption
- PostgreSQL: PgCrypto extension

---

## Backup & Disaster Recovery

### Automated Backups

**AWS RDS:**
```bash
# Enable automated backups
aws rds modify-db-instance \
  --db-instance-identifier vinibank \
  --backup-retention-period 30
```

**Vercel Postgres:**
Automatic daily backups included.

### Manual Backups

```bash
# Backup database
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore from backup
psql $DATABASE_URL < backup.sql
```

---

## Continuous Integration

### GitHub Actions

See `.github/workflows/` for CI/CD pipelines.

---

## Cost Estimation

| Service | Monthly Cost |
|---------|--------------|
| Vercel Pro | $20 |
| Vercel Postgres (1GB) | ~$15 |
| Domain | ~$10 |
| **Total** | **~$45+** |

---

## Troubleshooting

### Application won't start

```bash
# Check logs
vercel logs
# or Docker
docker logs <container-id>

# Validate environment
npm run env:check
```

### Database connection failed

```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check credentials
echo $DATABASE_URL
```

### Performance issues

```bash
# Check build size
npm run build

# Analyze bundles
npm run analyze
```

---

## Support

For issues or questions:
- GitHub: [Issues](https://github.com/viniciusfausto02/vinicius-mainbank/issues)
- Email: support@vinibank.com
