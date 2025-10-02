# Deployment Guide

This guide will help you deploy your Sanity blog to production.

## Prerequisites

1. A Sanity account (free at [sanity.io](https://sanity.io))
2. A GitHub account
3. A Vercel account (recommended) or another hosting platform

## Step 1: Set up Sanity Project

1. **Get your Sanity Project ID**
   ```bash
   cd sanity
   npx sanity manage
   ```
   This will open your Sanity project dashboard where you can find your Project ID.

2. **Update environment variables**
   Create `.env.local` in the root directory:
   ```env
   NEXT_PUBLIC_SANITY_PROJECT_ID=your-actual-project-id
   NEXT_PUBLIC_SANITY_DATASET=production
   ```

3. **Update Sanity configuration**
   Edit `sanity/sanity.config.ts` and replace `'new'` with your actual project ID:
   ```typescript
   projectId: 'your-actual-project-id',
   ```

## Step 2: Deploy Sanity Studio

1. **Deploy the Studio**
   ```bash
   cd sanity
   npm run deploy
   ```
   
2. **Choose a Studio hostname**
   When prompted, choose a unique hostname for your Studio (e.g., `my-blog-studio`)

3. **Access your Studio**
   Your Studio will be available at `https://your-studio-name.sanity.studio`

## Step 3: Add Initial Content

1. **Access your deployed Studio**
2. **Configure Site Settings**
   - Add site title, description
   - Upload logo and favicon
   - Set up social media links
   
3. **Create an Author**
   - Add your profile with photo and bio
   
4. **Create Categories**
   - Add a few categories (e.g., "Technology", "Design", "Tutorials")
   
5. **Write your first post**
   - Create a blog post with featured image
   - Mark it as "featured" to show on homepage

## Step 4: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial blog setup"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository

3. **Configure Environment Variables**
   In Vercel dashboard, add:
   ```
   NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
   NEXT_PUBLIC_SANITY_DATASET=production
   ```

4. **Deploy**
   Click "Deploy" and wait for the build to complete

### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login and deploy**
   ```bash
   vercel login
   vercel --prod
   ```

3. **Set environment variables**
   ```bash
   vercel env add NEXT_PUBLIC_SANITY_PROJECT_ID
   vercel env add NEXT_PUBLIC_SANITY_DATASET
   ```

## Step 5: Configure Domain (Optional)

1. **Add custom domain in Vercel**
   - Go to your project settings
   - Add your custom domain
   - Update DNS records as instructed

2. **Update Sanity CORS settings**
   - Go to [sanity.io/manage](https://sanity.io/manage)
   - Select your project
   - Go to Settings > API
   - Add your domain to CORS origins

## Step 6: Set up Webhooks (Optional)

To automatically rebuild your site when content changes:

1. **In Vercel**
   - Go to Settings > Git
   - Copy the Deploy Hook URL

2. **In Sanity**
   - Go to Settings > Webhooks
   - Add new webhook with your Vercel Deploy Hook URL
   - Set trigger to "Create", "Update", "Delete"

## Alternative Deployment Options

### Netlify

1. **Connect GitHub repository**
2. **Build settings:**
   - Build command: `npm run build`
   - Publish directory: `.next`
3. **Environment variables:**
   ```
   NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
   NEXT_PUBLIC_SANITY_DATASET=production
   ```

### Railway

1. **Connect GitHub repository**
2. **Add environment variables**
3. **Deploy automatically**

### Self-hosted

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start the production server**
   ```bash
   npm start
   ```

3. **Use a process manager like PM2**
   ```bash
   npm install -g pm2
   pm2 start npm --name "blog" -- start
   ```

## Troubleshooting

### Common Issues

1. **Build fails with Sanity errors**
   - Check that your Project ID is correct
   - Ensure environment variables are set
   - Verify Sanity dataset exists

2. **Images not loading**
   - Check Sanity CORS settings
   - Verify image URLs in Sanity Studio

3. **Content not updating**
   - Set up webhooks for automatic rebuilds
   - Or manually trigger a rebuild in Vercel

4. **TypeScript errors**
   - Run `npm run type-check` locally
   - Fix any type errors before deploying

### Performance Tips

1. **Enable ISR (Incremental Static Regeneration)**
   - Add `revalidate` to your page exports
   - Set appropriate cache times

2. **Optimize images**
   - Use WebP format in Sanity
   - Set appropriate image dimensions

3. **Use CDN**
   - Vercel includes CDN by default
   - Configure caching headers

## Security Considerations

1. **Environment Variables**
   - Never commit `.env.local` to Git
   - Use different datasets for development/production

2. **Sanity Tokens**
   - Only use read tokens in frontend
   - Keep write tokens secure and server-side only

3. **CORS Settings**
   - Only allow your domains
   - Remove localhost from production CORS

## Monitoring

1. **Vercel Analytics**
   - Enable in project settings
   - Monitor performance and usage

2. **Sanity Usage**
   - Monitor API usage in Sanity dashboard
   - Set up alerts for quota limits

3. **Error Tracking**
   - Consider adding Sentry or similar
   - Monitor build logs in Vercel

## Support

If you encounter issues:
1. Check the [Next.js documentation](https://nextjs.org/docs)
2. Review [Sanity documentation](https://www.sanity.io/docs)
3. Check Vercel deployment logs
4. Open an issue in this repository
