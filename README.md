# stuartwainstock.com

My personal site — built with Next.js 16 (App Router) and Sanity v6. It's a blog, a small dashboard for things I track (Strava runs, eBird sightings, TripIt flights), and a lab for design experiments. The goal was to own my own data and have a place that grows with whatever I'm interested in, without being locked to a CMS that controls the frontend.

**Live:** [stuartwainstock.com](https://stuartwainstock.com)

---

## What's on it

- **Blog** — writing, organized by category and author
- **[/lab](https://stuartwainstock.com/lab)** — hub for side experiments (cards come from Sanity `siteSettings`)
- **[/type-emotions](https://stuartwainstock.com/type-emotions)** — emotion → variable-font playground (live axes + Coolors mood palette)
- **[/pixel-art](https://stuartwainstock.com/pixel-art)** — turn an image (including Unsplash search) into a pixel palette canvas
- **[/runs](https://stuartwainstock.com/runs)** — Strava activities synced to Supabase, rendered as a MapLibre route map + table
- **[/pileated-watch](https://stuartwainstock.com/pileated-watch)** — recent eBird sightings of one species (usually Pileated Woodpecker) in a configured area, with a map
- **[/birding-dashboard](https://stuartwainstock.com/birding-dashboard)** — eBird sightings pulled into Sanity as editable documents, enriched with alt text, plumage colors, and Xeno-canto bird call audio
- **[/flights](https://stuartwainstock.com/flights)** — flight map from TripIt export data
- **[/reading-list](https://stuartwainstock.com/reading-list)** — articles and books I've marked as published from a bookmarklet-captured inbox

## Stack choices

**Next.js App Router** — Server Components + ISR let the data-heavy pages (eBird, Strava) revalidate on a schedule without client-side fetches.

**Sanity** — headless CMS for blog posts, lab hub cards, and editorial enrichment of structured data (birding sightings get alt text, plumage color swatches, and audio suggestions from Studio). Studio is embedded at `/studio` and also deployed to hosted `*.sanity.studio`.

**CSS Modules + Style Dictionary** — no Tailwind. Design tokens live in `tokens/*.json`, Style Dictionary builds them to `src/styles/generated/tokens.css` as CSS variables, and components import `.module.css` files. Shared atoms (Button, Chip, etc.) live under `src/components/atoms/`; Storybook under Foundations → Design Tokens.

**Supabase** — Postgres for Strava activity storage and lab telemetry (Type Emotions miss/feedback events). The render path for `/runs` only reads Supabase; no live Strava or Nominatim calls happen on page load.

**MapLibre GL** — Carto Positron basemap, no Mapbox token required.

---

## Running locally

### Prerequisites

- Node.js ≥ 22.12
- A Sanity account ([sanity.io](https://sanity.io) — free tier works)

### Setup

```bash
git clone <repo-url>
cd stuart-sanity-blog-main
npm install
cp .env.local.example .env.local
```

Edit `.env.local` — at minimum you need:

```env
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
NEXT_PUBLIC_SANITY_DATASET=production
```

Then:

```bash
npm run dev          # Next.js at http://localhost:3000
npm run studio       # Sanity Studio at http://localhost:3000/studio
```

The data pages (`/runs`, `/pileated-watch`) won't show content until you configure the relevant API keys — see the sections below. Lab tools (`/type-emotions`, `/pixel-art`) work without third-party keys; Type Emotions miss logging needs Supabase when you want the admin queue.

---

## Design tokens

Tokens are the source of truth for colors and font stacks. After editing any file under `tokens/`:

```bash
npm run tokens:build
```

This regenerates `src/styles/generated/tokens.css`. Don't hand-edit that file. `npm run build` and `npm run build-storybook` run token generation automatically via `prebuild` hooks — commit `tokens.css` after token changes so other environments don't need to regenerate.

Use `var(--color-…)` and font vars such as `--font-work-sans` / `--font-mono` in modules and globals — never hardcode hex or font stacks. There's no Tailwind layer.

---

## Lab experiments

Lab cards on **[/lab](https://stuartwainstock.com/lab)** are CMS-driven (`siteSettings.projectsMenu`). Experiment logic stays in code so font allowlists and matching rules can ship with the route.

### Type Emotions (`/type-emotions`)

Maps a chip or free-text emotion to a **starting coordinate** in a variable Google Font. Live axis sliders (including Roboto Flex parametrics and experimental faces like Nabla / Shantell Sans / Workbench), italic toggles where supported, and editable specimen text turn the match into a playground; intensity is a macro over the emotion’s featured ↔ intense coordinates. Coolors mood roles stay scoped to the specimen panel. **Emotion catalog, font axis metadata, and palettes live in Sanity** (`typeEmotion`, `variableFontFace`, `specimenPalette`); font *files* still load only on this route via `next/font/google` in `src/app/type-emotions/fonts.ts`. Match/intensity helpers stay under `src/lib/typeEmotions/`. Review unmatched searches at **`/admin/type-emotions`** (Add synonym patches Sanity).

Weak matches and “Not quite right?” feedback POST to `/api/type-emotions/search-events` and land in Supabase `type_emotion_search_events` (see `scripts/supabase-type-emotion-search-events.sql`). Review the queue at **`/admin/type-emotions`** after signing in at `/admin/login` (same `ADMIN_PASSWORD` as Strava admin). Needs `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` for logging; the page still works without them.

### Pixel Art (`/pixel-art`)

Client-side pixelation studio with optional Unsplash search. Pattern sibling to Type Emotions: tool chrome on the page, heavy work kept route-local.

---

## Pileated Watch & eBird

**`/pileated-watch`** fetches recent sightings of one species in a configured geographic area from the [eBird API v2](https://science.ebird.org/en/use-ebird-data/download-ebird-data-products/ebird-api/) and renders them on a map with a sightings table.

### Setup

1. Get an API key at [ebird.org/api/keygen](https://ebird.org/api/keygen) and add it **server-only**:
   ```env
   EBIRD_API_KEY=your-key
   ```
2. In Sanity Studio, open **Pileated Watch (eBird)** and fill in:
   - Page title (required to unlock the page)
   - Geographic area — hotspot L-codes or a region code (e.g. `US-MN`)
   - Focus species code — eBird alpha code, default `pilwoo` (Pileated Woodpecker)
   - Days back (1–30), max rows, default map center
3. Publish the document.

### How it works

The eBird endpoint is `GET /v2/data/obs/{loc}/recent/{species}?detail=full`. The page revalidates every 5 minutes (ISR). Rows without coordinates are dropped. The species code must match [eBird taxonomy](https://ebird.org/science/use-ebird-data/the-ebird-taxonomy/).

---

## Birding Dashboard

**`/birding-dashboard`** pulls recent eBird sightings into Sanity as `birdSighting` documents. From Studio, you can add alt text, plumage color swatches, and confirm a bird call audio recording.

### Audio suggestions (Xeno-canto API v3)

The suggestion panel in Studio calls the site's `/api/birding/suggest-audio` endpoint, which queries [Xeno-canto](https://xeno-canto.org/) and writes the suggestion back to Sanity.

**Required:**
```env
# Site server env
XENO_CANTO_API_KEY=your-key
```

**For hosted Studio (`*.sanity.studio`) to reach the suggestion endpoint:**
```env
# Studio build env
SANITY_STUDIO_BIRDING_SUGGEST_API_URL=https://your-domain.com/api/birding/suggest-audio
SANITY_STUDIO_BIRDING_SUGGEST_SECRET=your-random-secret

# Site server env
BIRDING_SUGGEST_PROXY_SECRET=your-random-secret   # must match above
SANITY_BIRDING_CORS_ORIGINS=https://your-project.sanity.studio
```

If `XENO_CANTO_API_KEY` is missing, the endpoint returns `503` with `code: MISSING_XENO_CANTO_API_KEY`.

---

## Strava runs

**`/runs`** syncs your Strava activities (runs only) into Supabase and renders them as a route map + table. Visitors read from Supabase; no live Strava API calls happen on page render.

### Prerequisites

- A [Supabase](https://supabase.com) project with tables `strava_oauth`, `strava_activities`, `strava_sync_state`, `strava_reverse_geocode_cache`, and `strava_gear_cache`. SQL for the cache tables (and Type Emotions events) is in `scripts/`.
- A [Strava API app](https://www.strava.com/settings/api) — note Client ID and Secret, and set the callback domain so `https://your-domain.com/api/strava/callback` is allowed.

### Environment variables

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-secret-key   # use the service role key, not anon
STRAVA_CLIENT_ID=
STRAVA_CLIENT_SECRET=
STRAVA_REDIRECT_URI=https://your-domain.com/api/strava/callback
ADMIN_PASSWORD=your-admin-password          # gates the OAuth connect flow
# Optional
STRAVA_SYNC_SECRET=                         # protects POST /api/strava/sync for cron
STRAVA_REVERSE_GEOCODE=1                    # set to 0 to skip Nominatim lookups
```

### Connecting

1. Set `ADMIN_PASSWORD` in production, open `/admin/login`, and sign in.
2. Go to `/runs` and click **Connect Strava** — Strava redirects back and stores tokens in `strava_oauth`.
3. Click **Sync** (or POST to `/api/strava/sync`) to pull activities. The first sync does a full backfill; later syncs are incremental.

**Local dev only:** set `ALLOW_INSECURE_STRAVA_CONNECT=1` to skip the admin gate.

### Place names

During sync, the app attempts to resolve a location label for each run: first from Strava's own place name field, then from a per-activity detail fetch, and finally from Nominatim reverse geocoding (city-level, rate-limited, cached in Supabase). The render path never calls Strava or Nominatim directly.

---

## Flights

**`/flights`** renders a MapLibre flight path map from TripIt data. The app prefers a committed export at `src/data/tripit/list-air-historical.json`; the live TripIt OAuth client is a fallback. To update: export from TripIt, run `npm run tripit:transform`, and commit the result.

---

## Reading list + quick-add

**`/reading-list`** renders `resource` documents from Sanity with `status: "published"`. Resources are captured from a bookmarklet or browser extension that calls `/api/add-link` to scrape Open Graph metadata and create a Sanity draft.

### Setup

```env
SANITY_API_WRITE_TOKEN=your-write-token
QUICK_ADD_API_KEY=your-bookmarklet-secret
```

### Bookmarklet

Create a browser bookmark with this URL (replace domain and key):

```javascript
javascript:(function(){var endpoint='https://your-domain.com/api/add-link';var apiKey='YOUR_KEY';var target=endpoint+'?url='+encodeURIComponent(window.location.href)+'&key='+encodeURIComponent(apiKey);window.open(target,'_blank','noopener,noreferrer');})();
```

### Chrome/Arc extension

If bookmarklets are unreliable (Arc tends to block them), use the extension in `extensions/quick-add/`:

1. Open `chrome://extensions` → enable Developer mode → Load unpacked → select `extensions/quick-add/`
2. Set the endpoint and API key in the extension popup.

The API deduplicates by normalized URL and auto-populates `sourceDomain`.

---

## Useful commands

```bash
npm run dev                    # Next.js dev server
npm run studio                 # Sanity Studio locally
npm run studio:deploy          # Deploy hosted Studio (required after schema changes for *.sanity.studio editors)
npm run tokens:build           # Regenerate CSS variables from tokens/*.json
npm run typegen                # Regenerate Sanity TypeScript types after schema changes
npm run type-check             # tsc --noEmit
npm run lint                   # ESLint
npm run storybook              # Storybook at :6006
npm run test:storybook         # Vitest + a11y audit via Storybook (run `npx playwright install chromium` once)
npm run strava:sync            # Manual Strava sync (reads .env.local)
```

### After schema changes

```bash
cd sanity && npx sanity schema validate
cd sanity && npx sanity schema deploy   # updates Content Lake / API types
npm run typegen                         # regenerate src/lib/types from schema
npm run studio:deploy                   # required for production Studio editors
```

---

## Project structure

```
├── tokens/                          # Design token source (Style Dictionary JSON)
├── config.style-dictionary.json     # Builds → src/styles/generated/tokens.css
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── admin/                   # Password-gated tools (Strava connect, Type Emotions review)
│   │   ├── api/                     # Route handlers (Strava, eBird, type-emotions, quick-add, …)
│   │   ├── lab/                     # Lab hub
│   │   ├── type-emotions/           # Emotion → variable-font axis playground
│   │   ├── pixel-art/               # Pixelation lab
│   │   ├── birding-dashboard/
│   │   ├── flights/
│   │   ├── pileated-watch/
│   │   ├── runs/
│   │   ├── studio/                  # Embedded Sanity Studio
│   │   └── [slug]/                  # CMS-driven pages
│   ├── components/
│   │   ├── atoms/                   # Button, Chip, Pagination, …
│   │   ├── backyard/                # Birding map + table + card components
│   │   ├── molecules/               # PageHero, PortableText, …
│   │   ├── strava/                  # Runs map + table components
│   │   └── ui/                      # DataTable, shared UI
│   ├── lib/
│   │   ├── typeEmotions/            # Emotion catalog, matcher, palettes
│   │   ├── pixelArt/                # Pixel-art helpers
│   │   ├── ebird/                   # eBird API client + sync
│   │   ├── strava/                  # Strava OAuth + sync
│   │   ├── birding/                 # Xeno-canto helpers
│   │   ├── sanity.ts                # Sanity client
│   │   ├── queries.ts               # GROQ queries
│   │   └── types.ts                 # Shared TypeScript types
│   └── styles/
│       └── generated/tokens.css     # Auto-generated — do not edit
├── sanity/                          # Studio source (separate npm package; keep version aligned with root)
│   ├── schemaTypes/                 # Content model
│   ├── components/                  # Custom Studio input panels
│   └── sanity.config.ts
├── extensions/quick-add/            # Browser extension
└── scripts/                         # SQL migrations + utility scripts
```

---

## Deployment

The site deploys to Vercel from the main branch. Sanity Studio deploys separately via `npm run studio:deploy` (hosted `*.sanity.studio` does **not** pick up Studio UI upgrades from a Next-only deploy). After changing environment variables in Vercel, redeploy for them to take effect.

Keep root and `sanity/` package versions of `sanity` / `@sanity/vision` aligned — the embedded `/studio` route imports the nested Studio config into the Next app.

Set all the relevant env vars in Vercel → Environment Variables (Production). The full reference is in `.env.local.example`.
