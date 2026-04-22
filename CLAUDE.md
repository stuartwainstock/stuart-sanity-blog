# CLAUDE.md — stuart-sanity-blog

> Agentic session standards for Claude (Cowork / Claude Code).  
> Last updated: 2026-04-22 via Agentic Audit.
>
> **Coding standards** (tokens, CSS Modules, Sanity schema, data integrations, map patterns)
> live in `.cursor/rules/` — that is the single source of truth. This file covers
> session-level concerns: MCP setup, data flows, env vars, and the pre-session checklist.

---

## 1. Stack at a Glance

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.4 |
| UI | React | 19.2.5 |
| CMS | Sanity v5 | ^5.20.0 |
| Database | Supabase (Postgres) | 2.104.0 |
| Mapping | MapLibre GL + react-map-gl | 5.23 / 8.1.1 |
| Design Tokens | Style Dictionary | ^4.3.3 |
| Component dev | Storybook | ^10.3.5 |
| Type safety | TypeScript + Sanity TypeGen | — |

The Sanity Studio is embedded in the Next.js app at `/studio` (basePath) and deployed separately via `sanity deploy`. Project ID: `ojv692hs`, Dataset: `production`.

---

## 2. MCP Architecture

### 2a. Sanity MCP (REQUIRED — add before any schema or content work)

Official remote MCP server — queries the content lake, patches documents, and introspects schemas.

```bash
# Add to Claude Code / Cowork
claude mcp add Sanity -t http https://mcp.sanity.io --scope user

# Auto-configure for Cursor, VS Code, and Claude Code in one shot
npx sanity@latest mcp configure
```

Authenticates via OAuth. Enables GROQ queries, document patches, and schema introspection
without copy-pasting context into the session.

> After any schema change, run `npm run typegen` so generated types stay in sync.

### 2b. Filesystem MCP (TripIt data)

Scoped to `src/data/` — treats the committed TripIt JSON as a live queryable source.

```bash
claude mcp add filesystem -s user -- npx -y @modelcontextprotocol/server-filesystem \
  /path/to/stuart-sanity-blog-main/src/data
```

`fetchTripItFlights()` in `src/lib/tripit/flights.ts` already prefers the local file over
the live OAuth API. Set `TRIPIT_FLIGHTS_JSON` in `.env.local` to override the path.

### 2c. Strava — Keep Custom (do NOT swap for a community MCP)

No official Strava MCP exists. Community servers (r-huijts, MariyaFilippova) do not handle
the token-refresh + Supabase-persistence pattern this codebase requires. See
`.cursor/rules/data-integrations.mdc` for the full rationale and architecture.

### 2d. eBird — Keep Custom (do NOT swap for a community MCP)

No official eBird MCP from Cornell Lab. The production client is Sanity-config-driven and
that coupling cannot be replicated by a generic MCP tool. See
`.cursor/rules/data-integrations.mdc` for the full rationale and architecture.

---

## 3. Data Flow Reference

```
Strava API
  └─ OAuth callback → /api/strava/callback
  └─ Sync → /api/strava/sync → Supabase strava_activities
  └─ Read → src/lib/strava/runsQuery.ts → Supabase (no live Strava calls on render)

eBird API
  └─ src/lib/ebird/client.ts → fetchMapObservations()
  └─ Config from Sanity ebirdBirding document (hotspots / region / species)
  └─ Rendered by src/components/backyard/

TripIt
  └─ src/data/tripit/list-air-historical.json (committed export, preferred)
  └─ fallback: live OAuth via src/lib/tripit/client.ts
  └─ Env: TRIPIT_FLIGHTS_JSON (override path)
  └─ Rendered by src/components/travel/

Sanity CMS
  └─ src/lib/sanity.ts (client config)
  └─ src/lib/queries.ts (GROQ queries)
  └─ sanity/types.ts (TypeGen output — import from here)
```

---

## 4. Key Environment Variables

```bash
# Strava OAuth
STRAVA_CLIENT_ID=
STRAVA_CLIENT_SECRET=
STRAVA_REDIRECT_URI=

# eBird
EBIRD_API_KEY=

# TripIt (optional — uses local JSON if unset)
TRIPIT_CONSUMER_KEY=
TRIPIT_CONSUMER_SECRET=
TRIPIT_OAUTH_TOKEN=
TRIPIT_OAUTH_TOKEN_SECRET=
TRIPIT_FLIGHTS_JSON=          # override: path to list-air JSON export

# Sanity
NEXT_PUBLIC_SANITY_PROJECT_ID=ojv692hs
NEXT_PUBLIC_SANITY_DATASET=production

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=    # server-only
```

---

## 5. Common Commands

```bash
npm run dev                 # Next.js dev server
npm run tokens:build        # Rebuild CSS tokens from tokens/**/*.json
npm run typegen             # Regenerate Sanity TypeScript types
npm run storybook           # Component development
npm run build               # Production build (runs tokens:build first)
npm run lint                # ESLint
npm run type-check          # tsc --noEmit (root)
```

---

## 6. Agentic Session Checklist

Before starting any session that touches content or schema:

- [ ] Confirm Sanity MCP is connected (`claude mcp list` should show `Sanity`)
- [ ] Confirm Filesystem MCP is scoped to `src/data/` (for TripIt queries)
- [ ] Run `npm run typegen` if any schema changes are pending
- [ ] Run `npm run tokens:build` if `tokens/**/*.json` has been edited
- [ ] Coding standards → `.cursor/rules/` (tokens, CSS Modules, Sanity schema, integrations)
