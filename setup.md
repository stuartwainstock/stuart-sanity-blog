# Quick Setup Guide

Follow these steps to get your blog running locally:

## 1. Install Dependencies
```bash
npm install
```

## 2. Set up Sanity Project

### Get your Project ID
```bash
cd sanity
npx sanity manage
```
This opens your Sanity dashboard where you can find your Project ID.

### Update Configuration
1. Copy the Project ID from the Sanity dashboard
2. Edit `sanity/sanity.config.ts` and replace `'new'` with your actual Project ID:
   ```typescript
   projectId: 'your-actual-project-id', // Replace 'new' with your Project ID
   ```

## 3. Configure Environment Variables
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your Sanity details:
```env
NEXT_PUBLIC_SANITY_PROJECT_ID=your-actual-project-id
NEXT_PUBLIC_SANITY_DATASET=production
```

## 4. Start Development
```bash
# Start the Next.js development server
npm run dev

# In another terminal, start Sanity Studio
npm run studio
```

## 5. Access Your Applications
- **Frontend**: http://localhost:3000
- **Sanity Studio**: http://localhost:3333

## 6. Add Your First Content

1. **Go to Sanity Studio** (http://localhost:3333)
2. **Create Site Settings**:
   - Add site title: "My Awesome Blog"
   - Add description: "A blog about amazing things"
   - Upload a logo (optional)

3. **Create an Author**:
   - Add your name and bio
   - Upload a profile photo

4. **Create Categories**:
   - Add categories like "Technology", "Design", "Tutorials"
   - Choose different colors for each

5. **Write Your First Post**:
   - Create a new blog post
   - Add a featured image
   - Write some content
   - Assign categories and author
   - Mark as "featured" to show on homepage

6. **Create an About Page**:
   - Create a new page with slug "about"
   - Enable "Show in Navigation"
   - Add content about yourself or your blog

## 7. View Your Blog
Go back to http://localhost:3000 to see your blog with the new content!

## Next Steps

- **Deploy to production**: Follow the [DEPLOYMENT.md](./DEPLOYMENT.md) guide
- **Customize styling**: Edit components in `src/components/`
- **Add new features**: Extend schemas in `sanity/schemaTypes/`
- **Configure SEO**: Update meta tags and Open Graph settings

## Troubleshooting

### "Project not found" error
- Make sure you've updated the Project ID in both `.env.local` and `sanity/sanity.config.ts`
- Verify the Project ID is correct in your Sanity dashboard

### Content not showing
- Check that you've created content in Sanity Studio
- Ensure the content is published (not in draft mode)
- Verify your environment variables are correct

### Build errors
- Run `npm run type-check` to check for TypeScript errors
- Make sure all required fields are filled in your Sanity content

## Need Help?

- Check the main [README.md](./README.md) for detailed documentation
- Review the [DEPLOYMENT.md](./DEPLOYMENT.md) for production setup
- Visit [Sanity documentation](https://www.sanity.io/docs) for CMS help
- Check [Next.js documentation](https://nextjs.org/docs) for frontend help
