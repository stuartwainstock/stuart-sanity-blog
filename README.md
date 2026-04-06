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
- 🦅 Pileated Watch: map + sightings table on one page via the [eBird API 2.0](https://science.ebird.org/en/use-ebird-data/download-ebird-data-products/ebird-api/) (see below)

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
│   │   ├── pileated-watch/          # eBird map + sightings table
│   │   ├── studio/                   # Embedded Sanity Studio route
│   │   ├── [slug]/                   # Dynamic page route
│   │   ├── layout.tsx                # Root layout
│   │   └── page.tsx                  # Homepage
│   ├── components/                   # React components
│   │   ├── backyard/                 # Map + sightings table UI
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
- **Projects menu** (optional): top-level label (e.g. “Projects”) and links to **internal paths** like `/pileated-watch` or `/runs`. Each route implements its own data layer (eBird, Strava, etc.) in the Next.js app—not in this menu.
- Footer configuration
- Default SEO settings

#### Resources (Unified Reading List)
- URL-based resources captured from bookmarklet/extension
- Workflow status: `inbox`, `reviewed`, `published`, `rejected`
- Media type support: article, book, video, podcast, tool, other
- `published` resources render on `/reading-list`

#### Pileated Watch (eBird)
- Singleton document: **Pileated Watch (eBird)** in Studio (`ebirdBirding`, document id `ebirdBirding`)
- **One geographic area** (hotspots or region) and **one focus species** (default: Pileated Woodpecker, code `pilwoo`) drive the map and the sightings table on the **same page**
- Public URL: **`/pileated-watch`**.

## Pileated Watch & eBird

**Pileated Watch** is a single page showing **recent sightings of one species** (default **Pileated Woodpecker**) in **your chosen hotspots or region**, using [eBird](https://ebird.org/home). All observers’ checklists in that area are included.

### How it works

1. Birders submit checklists to eBird as usual; your site does not write to eBird.
2. Set **`EBIRD_API_KEY`** in the environment (server-only; [ebird.org/api/keygen](https://ebird.org/api/keygen); follow [eBird API terms](https://science.ebird.org/en/use-ebird-data/download-ebird-data-products/ebird-api/)).
3. Sanity stores **page title**, intro, SEO, **geographic area**, **focus species** (code + display name), **days back** (1–30), **max rows**, and default map center.
4. Next.js calls **`GET /v2/data/obs/{loc}/recent/{species}`** with `detail=full`, then renders **`/pileated-watch`**: MapLibre map plus an accessible sightings table (skip link, checklist links).

### Important limitations

- **Recent window only:** eBird caps the lookback at **30 days**.
- **Coordinates required:** Rows without lat/lng are dropped.
- Change **focus species** in Studio; the code must match [eBird taxonomy](https://ebird.org/science/use-ebird-data/the-ebird-taxonomy/) (e.g. `pilwoo`).

### Configure in Sanity Studio

1. Open **Pileated Watch (eBird)** under Content.
2. Add **`EBIRD_API_KEY`** to `.env.local` and production — never `NEXT_PUBLIC_`.
3. Set **Page title** (required), optional intro, and **Geographic area** (hotspots or region).
4. Set **Focus species** code (default `pilwoo`) and display name.
5. Tune **days of recent sightings** (1–30), **max sighting rows**, optional default map center.
6. **Publish**.

If you previously used the retired **Backyard birds (iNaturalist)** singleton, create this document from scratch; old `inaturalistBackyard` documents are no longer in the schema.

### Caching and updates

- **`/pileated-watch`** uses **ISR** (`revalidate` ≈ 5 minutes). Config uses **`fetchEbirdBirdingConfig`** (`useCdn: false`, Next **`revalidate` 60s** on the query).
- **Redeploy** after schema or code changes so hosted Studio stays aligned.

### Production notes

- **CSP** in `next.config.ts` allows `api.ebird.org` and Carto basemap tiles.
- Map style: Carto Positron in `BackyardBirdMap.tsx` (no Mapbox token).
- **Pileated Watch** loads MapLibre through a small client wrapper (`BackyardBirdMapDynamic`) using `next/dynamic` (`ssr: false`) so map code is split into its own chunk. `experimental.optimizePackageImports` trims `@portabletext/react` imports.

### Repository hygiene

- Root `.gitignore` lists `.gitdata/` and `.ssh/` so accidental local copies of git metadata or keys are not committed.

## Strava runs & Supabase

**Strava runs** at **`/runs`** syncs **your** Strava activities (**runs only**) into **Supabase** for a personal archive. Visitors never log in; you connect once with OAuth.

### Prerequisites

- **Supabase** project with tables `strava_oauth`, `strava_activities`, and `strava_sync_state` (create them in the SQL Editor using the schema documented when you set up this feature).
- **Strava API** application ([strava.com/settings/api](https://www.strava.com/settings/api)): note **Client ID** and **Client Secret**, and set the **Authorization Callback Domain** (or redirect URL) so that `https://<your-domain>/api/strava/callback` is allowed—must match **`STRAVA_REDIRECT_URI`** exactly.

### How it works

1. **Environment** (server-only — see `.env.local.example`):
   - **`SUPABASE_URL`** and **`SUPABASE_SERVICE_ROLE_KEY`** — use the **Secret** key from Supabase (Settings → API), not the publishable/anon key.
   - **`STRAVA_CLIENT_ID`**, **`STRAVA_CLIENT_SECRET`**, **`STRAVA_REDIRECT_URI`** — e.g. `http://localhost:3000/api/strava/callback` locally and `https://yourdomain.com/api/strava/callback` in production.
2. **OAuth**: Open **`/runs`** → **Connect Strava** → approve. Scopes include **`activity:read_all`** and **`profile:read_all`** (needed for athlete shoe list and richer profile). Tokens are stored in **`strava_oauth`**. If you connected before `profile:read_all` was added, use **Connect Strava** again so Strava re-authorizes.
3. **Sync**: **Sync from Strava** on `/runs`, or **`POST /api/strava/sync`**. If **`STRAVA_SYNC_SECRET`** is set, the POST route requires `Authorization: Bearer <secret>` (useful for cron).
4. **Data**: First successful sync performs a **full backfill** of activity history; later syncs are **incremental** (with a short lookback for edits). Only activities with **`sport_type` Run** are stored.
5. **Map & table**: **`/runs`** shows a **MapLibre** map of run routes (**last 365 days**, full polylines) and a **recent runs** table with links to Strava—same page layout and typography pattern as Pileated Watch. **Location** uses city/state/country when Strava provides them; otherwise **start coordinates** from the activity, or a **per-activity detail** fetch (`GET /activities/:id`) for the newest rows still missing a label (Strava’s list endpoint often omits place names).

### Navigation

Add **`/runs`** under **Site settings → Projects menu** if you want it in the header **Projects** dropdown.

### Production (Vercel)

- Add the same Supabase and Strava variables in **Vercel → Environment Variables** (Production).
- **`STRAVA_REDIRECT_URI`** must use your real **HTTPS** site URL and match the Strava app settings.
- Redeploy after changing env vars, then connect Strava once on production if needed.

### Attribution

The `/runs` page includes a small **Strava** credit link, consistent with API terms.

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

# Strava runs (/runs) — Supabase + Strava (server-only)
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-secret-key
STRAVA_CLIENT_ID=
STRAVA_CLIENT_SECRET=
STRAVA_REDIRECT_URI=https://yourdomain.com/api/strava/callback
# Optional: protect POST /api/strava/sync (e.g. cron)
# STRAVA_SYNC_SECRET=
```

- `NEXT_PUBLIC_GA_MEASUREMENT_ID` enables baseline GA4 pageview tracking.
- `EBIRD_API_KEY` powers `/pileated-watch` (server-only; get a key at [ebird.org/api/keygen](https://ebird.org/api/keygen)).
- `SUPABASE_*` and `STRAVA_*` power **`/runs`** (see [Strava runs & Supabase](#strava-runs--supabase)).

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