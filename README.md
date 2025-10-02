# Sanity Blog

A modern, full-featured blog built with Next.js 15 and Sanity CMS. This project includes both a beautiful frontend and a powerful content management system.

## Features

### Frontend
- 🎨 Modern, responsive design with Tailwind CSS
- 📱 Mobile-first approach
- ⚡ Built with Next.js 15 App Router
- 🖼️ Optimized images with Next.js Image component
- 📝 Rich text content with Portable Text
- 🏷️ Category-based organization
- 👤 Author profiles and bios
- 🔍 SEO optimized with meta tags and Open Graph
- 📊 TypeScript for type safety

### Content Management
- 🎛️ Sanity Studio for content management
- 📄 Blog posts with rich content
- 📋 Custom pages (About, Contact, etc.)
- 👥 Author management
- 🏷️ Category system with color coding
- ⚙️ Site settings configuration
- 🖼️ Image management with alt text
- 🔧 SEO fields for all content types

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- A Sanity account (free at [sanity.io](https://sanity.io))

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd sanity-blog
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local` and add your Sanity project details:
   ```env
   NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
   NEXT_PUBLIC_SANITY_DATASET=production
   ```

4. **Deploy Sanity Studio**
   ```bash
   cd sanity
   npm run deploy
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Sanity Studio: [http://localhost:3000/studio](http://localhost:3000/studio)

## Project Structure

```
sanity-blog/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── blog/              # Blog listing and post pages
│   │   ├── category/          # Category pages
│   │   ├── [slug]/            # Dynamic pages
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Homepage
│   ├── components/            # React components
│   │   ├── Navigation.tsx     # Site navigation
│   │   ├── Footer.tsx         # Site footer
│   │   ├── PostCard.tsx       # Blog post card
│   │   └── PortableText.tsx   # Rich text renderer
│   └── lib/                   # Utilities and configurations
│       ├── sanity.ts          # Sanity client setup
│       ├── queries.ts         # GROQ queries
│       └── types.ts           # TypeScript types
├── sanity/                    # Sanity Studio
│   ├── schemaTypes/          # Content schemas
│   │   ├── post.ts           # Blog post schema
│   │   ├── page.ts           # Page schema
│   │   ├── author.ts         # Author schema
│   │   ├── category.ts       # Category schema
│   │   ├── siteSettings.ts   # Site settings schema
│   │   └── index.ts          # Schema exports
│   └── sanity.config.ts      # Studio configuration
└── public/                   # Static assets
```

## Content Management

### Getting Started with Content

1. **Access Sanity Studio**
   - Visit `/studio` on your deployed site or run `npm run studio` locally
   - Sign in with your Sanity account

2. **Configure Site Settings**
   - Go to "Site Settings" in the studio
   - Add your site title, description, logo, and social links
   - Configure footer content and SEO defaults

3. **Create Authors**
   - Add author profiles with photos and bios
   - Include social media links

4. **Add Categories**
   - Create categories for organizing your posts
   - Choose colors for visual distinction

5. **Write Your First Post**
   - Create a new blog post
   - Add a featured image, categories, and rich content
   - Mark as "featured" to highlight on homepage

6. **Create Pages**
   - Add custom pages like About, Contact, etc.
   - Enable "Show in Navigation" to add to menu

### Content Types

#### Blog Posts
- Title and slug
- Author and categories
- Featured image with alt text
- Rich text content with images and code blocks
- SEO metadata
- Featured post option

#### Pages
- Title and slug
- Rich text content
- Navigation settings
- SEO metadata

#### Authors
- Name and bio
- Profile image
- Social media links
- Contact information

#### Categories
- Title and description
- Color coding
- URL slug

#### Site Settings
- Site title and description
- Logo and favicon
- Social media links
- Footer configuration
- Default SEO settings

## Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Connect your GitHub repository to Vercel
   - Add environment variables in Vercel dashboard
   - Deploy automatically on push

3. **Deploy Sanity Studio**
   ```bash
   cd sanity
   npm run deploy
   ```

### Environment Variables

For production deployment, set these environment variables:

```env
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
NEXT_PUBLIC_SANITY_DATASET=production
```

## Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run Sanity Studio locally
npm run studio

# Deploy Sanity Studio
npm run studio:deploy

# Type checking
npm run type-check

# Linting
npm run lint
```

### Customization

#### Styling
- Edit `src/app/globals.css` for global styles
- Modify Tailwind classes in components
- Update color schemes in `tailwind.config.js`

#### Content Schemas
- Add new fields to existing schemas in `sanity/schemaTypes/`
- Create new content types by adding schema files
- Update `sanity/schemaTypes/index.ts` to include new schemas

#### Queries
- Modify GROQ queries in `src/lib/queries.ts`
- Add new queries for custom functionality

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For questions and support:
- Check the [Sanity documentation](https://www.sanity.io/docs)
- Review [Next.js documentation](https://nextjs.org/docs)
- Open an issue in this repository

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Content management by [Sanity](https://sanity.io/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons from [Heroicons](https://heroicons.com/)