# Sanity Blog

A modern, full-featured blog built with Next.js 16 and Sanity CMS. This project includes both a frontend and a content management system.

## Features

### Frontend
- 🎨 Modern, responsive design with Tailwind CSS
- 📱 Mobile-first approach
- ⚡ Built with Next.js 16 App Router
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
- 🦅 Birding: map + life list powered by the [eBird API 2.0](https://science.ebird.org/en/use-ebird-data/download-ebird-data-products/ebird-api/) (see below)

## Quick Start

### Prerequisites
- Node.js 20+
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
│   ├── app/                         # Next.js App Router routes
│   │   ├── api/add-link/route.ts    # Quick-add ingestion endpoint
│   │   ├── blog/                     # Blog listing and post pages
│   │   ├── author/                   # Author pages
│   │   ├── category/                 # Category pages
│   │   ├── journal/                  # Journal pages
│   │   ├── backyard-birds/          # eBird map + life list
│   │   ├── studio/                   # Embedded Sanity Studio route
│   │   ├── [slug]/                   # Dynamic page route
│   │   ├── layout.tsx                # Root layout
│   │   └── page.tsx                  # Homepage
│   ├── components/                   # React components
│   │   ├── backyard/                 # Map + observation / life list UI
│   │   ├── GoogleAnalytics.tsx       # GA4 baseline tracking
│   │   ├── Navigation.tsx            # Site navigation
│   │   ├── ReadingList.tsx           # Unified resource list UI
│   │   ├── SpeakingEngagements.tsx   # Speaking list UI
│   │   └── ...
│   └── lib/                          # Utilities and configs
│       ├── sanity.ts                 # Sanity client setup
│       ├── queries.ts                # GROQ queries
│       ├── types.ts                  # TypeScript types
│       └── ebird/                    # eBird API client + normalized types
├── sanity/                           # Sanity Studio source
│   ├── schemaTypes/
│   │   ├── resource.ts               # Unified resource model
│   │   ├── link.ts                   # Legacy/transition link schema
│   │   └── ...
│   ├── scripts/                      # One-off migration scripts
│   └── sanity.config.ts              # Studio structure/config
├── extensions/
│   └── quick-add/                    # Chrome/Arc quick-add extension
└── public/                           # Static assets
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
- Supports rich sections like speaking engagements

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

#### Resources (Unified Reading List)
- URL-based resources captured from bookmarklet/extension
- Workflow status: `inbox`, `reviewed`, `published`, `rejected`
- Media type support: article, book, video, podcast, tool, other
- `published` resources render on `/reading-list`

#### Birding (eBird)
- Singleton document: **Birding (eBird)** in Studio (`ebirdBirding`, document id `ebirdBirding`)
- Stores page copy, SEO, and **which eBird endpoints to call** (not a mirror of the whole database)
- Map rows come from **recent observations**; the life list comes from **historical species for a location** (see below)

## Birding & eBird

This site can show **recent eBird checklist rows** on a map and a **species list** for a chosen region or hotspot, using [eBird](https://ebird.org/home) as the data source and Sanity for copy and filters.

### How it works

1. You submit checklists with the eBird mobile app or website as usual.
2. Set **`EBIRD_API_KEY`** in the environment (server-only; request a key at [ebird.org/api/keygen](https://ebird.org/api/keygen) and follow [eBird API terms](https://science.ebird.org/en/use-ebird-data/download-ebird-data-products/ebird-api/)).
3. Sanity holds one configuration document: titles, intros, SEO, **map source** (hotspot ID(s) or region code), optional **map observer filter** (your eBird display name → only your rows on the map), **life list location** (region or hotspot for `product/spplist`), **days back** for the map (1–30; eBird recent API limit), **max rows**, and default map center.
4. Next.js calls the [eBird API 2.0](https://api.ebird.org/v2) on the server (`X-eBirdApiToken`), normalizes responses in `src/lib/ebird/`, and renders:
   - **`/backyard-birds`** — MapLibre map plus an **accessible table** (skip link, checklist links on eBird). Pins reflect **recent** checklists only (not your entire historical map).
   - **`/backyard-birds/life-list`** — Species from **`/product/spplist/{location}`** for your configured hotspot or region, with names joined from the cached **`/ref/taxonomy/ebird`** feed.

### Important limitations

- The **map** uses eBird’s **recent** observation endpoints (`/data/obs/hotspot/recent` or `/data/obs/{region}/recent`). There is a **maximum 30-day window**. Older sightings will not appear as pins; use the **life list** page for cumulative species at a location.
- **Only my checklists on the map:** set **Map: only this observer** in Studio to your eBird **display name** (as shown on your profile/checklists). The app requests `detail=full` and filters rows; matching is case-insensitive. The **life list** API is still **every species at that location**, not per-observer—use a **personal** hotspot for a list that is effectively yours, or treat the life list as regional.
- The **life list** does not include per-species observation counts from `spplist` alone; the table focuses on identity and links to eBird species pages.

### Configure in Sanity Studio

1. Open **Birding (eBird)** under Content.
2. Add **`EBIRD_API_KEY`** to `.env.local` (local) and to your host (e.g. Vercel) — never prefix with `NEXT_PUBLIC_`.
3. Choose **map source**: **Hotspots** (enter `L…` IDs, one per line or comma-separated) or **Region** (e.g. `US-NY-109`).
4. Set **Life list: region or hotspot ID** — passed to `spplist` (can match your yard hotspot or a broader region).
5. Optional: **Map: only this observer** — your name as eBird shows it, to hide other birders’ rows at shared hotspots or large regions.
6. Tune **days back** (1–30) and **max observation rows**; set default map center if the recent window is empty.
7. Publish the document.

If you previously used the retired **Backyard birds (iNaturalist)** singleton, create this new document from scratch; old `inaturalistBackyard` documents are no longer in the schema.

### Caching and updates

- Pages use **ISR** (`revalidate` ≈ 5 minutes). Taxonomy for names is cached longer (24h) to reduce load on `ref/taxonomy/ebird`.
- **Redeploy** the Next.js app after schema or code changes so `/studio` stays aligned.

### Production notes

- **CSP** in `next.config.ts` allows `api.ebird.org` and Carto basemap tiles.
- Map style: Carto Positron in `BackyardBirdMap.tsx` (no Mapbox token).

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
SANITY_API_WRITE_TOKEN=your-write-token
QUICK_ADD_API_KEY=your-bookmarklet-secret
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
EBIRD_API_KEY=your-ebird-api-key
```

- `NEXT_PUBLIC_GA_MEASUREMENT_ID` enables baseline GA4 pageview tracking.
- `EBIRD_API_KEY` powers `/backyard-birds` (server-only; get a key at [ebird.org/api/keygen](https://ebird.org/api/keygen)).

### Quick-Add Link Bookmarklet

This project includes a secure endpoint at `/api/add-link` that creates `resource` documents in Sanity by scraping Open Graph metadata from a URL.

#### 1) Set required env vars

Add these to your local `.env.local` and your production host:

```env
SANITY_API_WRITE_TOKEN=your-write-token
QUICK_ADD_API_KEY=your-bookmarklet-secret
```

- `SANITY_API_WRITE_TOKEN` should be a Sanity token with write access.
- `QUICK_ADD_API_KEY` is shared between the API route and your bookmarklet.

#### 2) Create a bookmark in Chrome

- Create a new bookmark.
- Name it something like `Quick Add Link`.
- Paste this as the bookmark URL (replace domain + key):

```javascript
javascript:(function(){var endpoint='https://stuart-sanity-blog.vercel.app/api/add-link';var apiKey='REPLACE_WITH_YOUR_QUICK_ADD_API_KEY';var target=endpoint+'?url='+encodeURIComponent(window.location.href)+'&key='+encodeURIComponent(apiKey);window.open(target,'_blank','noopener,noreferrer');})();
```

#### 3) Use it

Open any page you want to save, click the bookmarklet, and a new `resource` document will be created in Sanity with:

- `title`
- `url`
- `summary`
- `image` (OG image URL)
- `addedDate` (current time)
- `mediaType: "article"`
- `status: "inbox"` (publish from Studio when ready)

The API also performs two quality-of-life behaviors:

- **URL dedupe**: uses a normalized URL (hash removed, trailing slash normalized) and skips creating duplicates.
- **Domain tagging**: auto-populates `sourceDomain` (for example, `nytimes.com`) from the saved link.

### Reading List Workflow

- Capture from the browser bookmarklet into the `Resources` collection.
- Review items in Studio and update `status` from `inbox`/`reviewed` to `published`.
- Only `published` resources render on `/reading-list`.

### Quick-Add Chrome/Arc Extension (Alternative)

If bookmarklets are unreliable in your browser (for example Arc), use the extension in `extensions/quick-add/`.

#### Install (Developer mode)

1. Open `chrome://extensions` (works in Chrome + Arc).
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select `extensions/quick-add` from this repo.

#### Configure + use

1. Open the extension popup.
2. Set:
   - Endpoint: `https://stuart-sanity-blog.vercel.app/api/add-link`
   - API key: your `QUICK_ADD_API_KEY`
3. Click **Save Settings**.
4. Navigate to any article and click **Save Current Tab**.

The extension calls your existing `/api/add-link` endpoint and creates `resource` docs with `status: "inbox"`.

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