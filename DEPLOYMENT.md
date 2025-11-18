# Deployment Guide

Complete guide for deploying Colores to production using Vercel, Supabase, and Railway.

## Prerequisites

- GitHub repository with the code
- Vercel account
- Supabase account
- Railway account (for background worker)
- API keys for:
  - Anthropic Claude
  - Unsplash

## Step 1: Supabase Setup

### 1.1 Create Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose organization and region
4. Set database password (save it!)
5. Wait for project to initialize

### 1.2 Run Database Migrations

1. Go to SQL Editor in Supabase dashboard
2. Copy contents of `supabase/migrations/001_initial_schema.sql`
3. Paste and run the migration
4. Verify tables were created in Table Editor

### 1.3 Seed Database

1. Go back to SQL Editor
2. Copy contents of `supabase/seed.sql`
3. Paste and run to populate colors
4. Verify data in Table Editor

### 1.4 Get API Keys

1. Go to Project Settings → API
2. Copy these values:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

### 1.5 Configure Authentication (Optional)

1. Go to Authentication → Providers
2. Enable Email provider
3. Configure email templates if desired
4. Set Site URL to your domain

## Step 2: Get API Keys

### 2.1 Anthropic Claude

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create account or sign in
3. Go to API Keys
4. Create new key
5. Copy `ANTHROPIC_API_KEY`

### 2.2 Unsplash

1. Go to [unsplash.com/developers](https://unsplash.com/developers)
2. Create new application
3. Fill out application details
4. Copy:
   - Access Key → `UNSPLASH_ACCESS_KEY`
   - Secret Key → `UNSPLASH_SECRET_KEY`

## Step 3: Vercel Deployment

### 3.1 Connect Repository

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Select the `colores` repository

### 3.2 Configure Build Settings

Vercel should auto-detect Next.js settings:

```
Framework Preset: Next.js
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

### 3.3 Add Environment Variables

In Vercel project settings → Environment Variables, add:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=your-anthropic-api-key
UNSPLASH_ACCESS_KEY=your-unsplash-access-key
UNSPLASH_SECRET_KEY=your-unsplash-secret-key
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

### 3.4 Deploy

1. Click "Deploy"
2. Wait for build to complete
3. Visit your deployment URL
4. Test the application

## Step 4: Railway Background Worker

### 4.1 Create Project

1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Choose "Deploy from GitHub repo"
4. Select your repository

### 4.2 Configure Service

1. Set Root Directory: `.` (or leave empty)
2. Set Start Command: `npm run worker`
3. Or use custom Dockerfile if needed

### 4.3 Add Environment Variables

In Railway project → Variables, add:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=your-anthropic-api-key
```

### 4.4 Deploy

1. Railway will auto-deploy
2. Check logs to ensure worker is running
3. Look for "Starting annotation processor..." message

### 4.5 Monitor

Railway provides:
- Logs for debugging
- Metrics for performance
- Auto-restarts on crashes

## Step 5: Post-Deployment Configuration

### 5.1 Update Supabase Auth

1. Go to Supabase → Authentication → URL Configuration
2. Set:
   - Site URL: `https://your-domain.vercel.app`
   - Redirect URLs: Add your Vercel domain

### 5.2 Test ML Annotation

1. Go to your app
2. Navigate to "Learn" section
3. Select a level
4. Trigger image fetch
5. Check Railway logs for annotation processing
6. Verify annotations appear in Supabase

### 5.3 Admin Access

To review and approve annotations:
1. Navigate to `/admin/annotations`
2. Review ML-generated content
3. Approve or edit as needed

## Step 6: Custom Domain (Optional)

### 6.1 Add Domain to Vercel

1. Go to Vercel project → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

### 6.2 Update Environment Variables

Update `NEXT_PUBLIC_APP_URL` to your custom domain

### 6.3 Update Supabase Auth URLs

Update Site URL and Redirect URLs in Supabase

## Monitoring & Maintenance

### Vercel Analytics

1. Enable Analytics in Vercel dashboard
2. Monitor performance and usage
3. Set up alerts for errors

### Supabase Monitoring

1. Check Database → Usage
2. Monitor API requests
3. Review logs for errors

### Railway Monitoring

1. Monitor worker uptime
2. Check processing logs
3. Set up alerts for failures

## Troubleshooting

### Images Not Loading

- Check Unsplash API limits (50 requests/hour for free tier)
- Verify `UNSPLASH_ACCESS_KEY` is correct
- Check Vercel function logs

### Annotations Not Processing

- Check Railway worker logs
- Verify `ANTHROPIC_API_KEY` is valid
- Check annotation queue in Supabase
- Ensure worker has correct Supabase credentials

### Database Errors

- Verify Row Level Security policies
- Check service role key permissions
- Review Supabase logs

### Build Failures

- Check Node.js version compatibility
- Verify all dependencies are installed
- Review Vercel build logs

## Scaling Considerations

### Supabase

- Free tier: 500MB database, 50MB file storage
- Upgrade for:
  - More storage
  - Better performance
  - More concurrent connections

### Vercel

- Free tier: Generous limits for small projects
- Upgrade for:
  - More bandwidth
  - More function executions
  - Better analytics

### Railway

- Free tier: Limited hours/month
- Upgrade for:
  - Always-on services
  - More resources
  - Better performance

### Anthropic

- Pay-per-use pricing
- Monitor API usage
- Implement rate limiting if needed

### Unsplash

- Free tier: 50 requests/hour
- Upgrade to paid plan for:
  - More requests
  - Better rate limits
  - Commercial use

## Performance Optimization

1. **Enable Caching**
   - Images cached in Supabase
   - Vercel Edge caching for static content

2. **Optimize Images**
   - Next.js Image component handles optimization
   - Use appropriate sizes and formats

3. **Database Indexes**
   - Already included in migration
   - Monitor slow queries

4. **API Rate Limiting**
   - Implement if needed
   - Use Vercel Edge functions

## Backup Strategy

1. **Database Backups**
   - Supabase automatic daily backups (paid tier)
   - Manual exports for free tier

2. **Code Repository**
   - GitHub maintains code history
   - Tag releases for versions

3. **Environment Variables**
   - Document in secure location
   - Rotate keys periodically

## Security Checklist

- [ ] Row Level Security enabled in Supabase
- [ ] Service role key kept secret
- [ ] API keys rotated if exposed
- [ ] HTTPS enforced (automatic with Vercel)
- [ ] Input validation implemented
- [ ] Rate limiting configured
- [ ] Regular dependency updates

## Support

For deployment issues:
- Check documentation
- Review logs in respective platforms
- Open GitHub issue if problem persists

---

Your application should now be live and fully functional!
