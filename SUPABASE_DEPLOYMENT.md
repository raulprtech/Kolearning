# 🚀 Supabase Production Deployment Guide

## Overview

This guide covers how to deploy Kolearning with Supabase integration to production environments like Vercel, Netlify, or any hosting platform.

## Prerequisites

✅ Completed Supabase setup (see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md))  
✅ Supabase project configured with schema and RLS policies  
✅ Environment variables configured  
✅ Application tested locally  

## Production Environment Variables

### Required Variables

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# AI Configuration
GEMINI_API_KEY=your-gemini-api-key-here

# Optional: Database URL (for migrations)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.your-project-ref.supabase.co:5432/postgres
```

### How to Get These Values

1. **Supabase URL & Keys**: 
   - Go to your Supabase project dashboard
   - Navigate to Settings → API
   - Copy the Project URL and anon/service_role keys

2. **Database URL**:
   - Settings → Database → Connection string
   - Use for database migrations if needed

## Deployment Options

### Option 1: Vercel (Recommended)

#### One-Click Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/kolearningMVP)

#### Manual Deploy
1. **Connect Repository**:
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login and deploy
   vercel login
   vercel --prod
   ```

2. **Environment Variables**:
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add all required variables from above
   - Make sure to add them for all environments (Development, Preview, Production)

3. **Build Settings**:
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

#### Vercel Configuration (vercel.json)
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "https://your-project-ref.supabase.co",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase-service-role-key",
    "GEMINI_API_KEY": "@gemini-api-key"
  }
}
```

### Option 2: Netlify

1. **Connect Repository**:
   - Go to Netlify Dashboard
   - New site from Git
   - Choose your repository

2. **Build Settings**:
   - Build command: `npm run build`
   - Publish directory: `.next`

3. **Environment Variables**:
   - Site settings → Environment variables
   - Add all required variables

4. **Netlify Configuration (netlify.toml)**:
```toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Option 3: Docker Deployment

#### Dockerfile
```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Environment variables must be present at build time
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG SUPABASE_SERVICE_ROLE_KEY
ARG GEMINI_API_KEY

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
ENV GEMINI_API_KEY=$GEMINI_API_KEY

RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

#### Docker Compose
```yaml
version: '3.8'

services:
  kolearning:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    restart: unless-stopped
```

## Post-Deployment Checklist

### 1. Database Setup
- [ ] Supabase project created
- [ ] Database schema applied (`database/schema.sql`)
- [ ] RLS policies enabled and configured
- [ ] Test database connection

### 2. Authentication
- [ ] Authentication providers enabled (Email, Google OAuth)
- [ ] Redirect URLs configured in Supabase
- [ ] Test signup/login flow

### 3. Environment Variables
- [ ] All environment variables set correctly
- [ ] No sensitive keys exposed in client-side code
- [ ] Test environment variable access

### 4. Security
- [ ] RLS policies prevent unauthorized access
- [ ] API keys are properly scoped
- [ ] HTTPS enabled on production domain

### 5. Functionality Tests
- [ ] User can sign up and log in
- [ ] Projects can be created and saved
- [ ] Migration from localStorage works
- [ ] AI features function correctly
- [ ] Data persists across sessions

## Domain Configuration

### Custom Domain Setup

1. **Vercel**:
   ```bash
   vercel domains add yourdomain.com
   vercel domains ls
   ```

2. **DNS Configuration**:
   - Add CNAME record pointing to your deployment
   - Update Supabase redirect URLs to include new domain

3. **Update Supabase Settings**:
   - Authentication → Settings → Site URL: `https://yourdomain.com`
   - Add redirect URLs for auth providers

## Performance Optimization

### 1. Next.js Configuration
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js'],
  },
  images: {
    domains: ['your-project-ref.supabase.co'],
  },
  // Enable standalone output for Docker
  output: 'standalone',
}

module.exports = nextConfig
```

### 2. Database Optimization
- Enable database connection pooling in Supabase
- Use proper indexes for frequently queried data
- Consider Supabase Edge Functions for heavy operations

### 3. Caching Strategy
- Enable Vercel's Edge Network caching
- Use Next.js ISR for static content
- Implement proper cache headers

## Monitoring & Analytics

### 1. Supabase Dashboard
- Monitor database performance
- Track authentication metrics
- Review logs for errors

### 2. Application Monitoring
```bash
# Add monitoring services
npm install @vercel/analytics
```

### 3. Error Tracking
```bash
# Optional: Add error tracking
npm install @sentry/nextjs
```

## Backup & Recovery

### 1. Database Backups
- Supabase automatically backs up data
- Enable point-in-time recovery
- Export critical data regularly

### 2. Code Backups
- Keep repository synchronized
- Tag production releases
- Maintain deployment documentation

## Scaling Considerations

### 1. Database Scaling
- Monitor Supabase usage limits
- Upgrade to Pro plan when needed
- Consider read replicas for high traffic

### 2. Application Scaling
- Use Vercel's automatic scaling
- Implement proper caching
- Optimize bundle size

## Troubleshooting

### Common Issues

#### 1. Environment Variables Not Working
```bash
# Check if variables are properly set
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
```

#### 2. Database Connection Issues
- Verify Supabase URL format
- Check RLS policies
- Ensure proper authentication

#### 3. Build Failures
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

#### 4. Authentication Issues
- Verify redirect URLs in Supabase
- Check environment variables
- Test auth flow locally first

### Debug Mode
```javascript
// Enable debug logging
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      debug: process.env.NODE_ENV === 'development'
    }
  }
)
```

## Support & Resources

- **Supabase Docs**: https://supabase.com/docs
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **Vercel Guide**: https://vercel.com/docs
- **GitHub Issues**: Report issues in your repository

---

## Quick Deploy Commands

```bash
# Complete deployment in one go
git clone <your-repo>
cd kolearningMVP

# Set up environment
cp .env.example .env
# Fill in your environment variables

# Install and build
npm install
npm run build

# Deploy to Vercel
npx vercel --prod

# Or deploy with Docker
docker build -t kolearning .
docker run -p 3000:3000 kolearning
```

🎉 **Your Kolearning app is now production-ready with Supabase!**