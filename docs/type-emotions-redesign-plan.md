# Type Emotions — Redesign & Sanity/Supabase Migration Plan

Hand this to Cursor as the working spec. It covers three tracks that should land in this order: (1) data model migration to Sanity, (2) Supabase review-queue wiring, (3) UI/interaction redesign. Data model first because the UI redesign is much easier to build against a real query layer than against three static files you're about to delete.

## 0. Current state (confirmed against the repo + Supabase)

- Emotion → font → axis → palette mapping lives entirely in static TypeScript: `src/lib/typeEmotions/catalog.ts` (519 lines), `variableFonts.ts` (200 lines), `palettes.ts` (277 lines). No CMS involvement. Changing an emotion means editing code and redeploying.
- `src/app/type-emotions/TypeEmotionsStudio.tsx` (578 lines) is a single monolithic client component — emotion chips, search, font switcher, axis sliders, specimen text, palette swatches all inlined, no subcomponents.
- `src/app/type-emotions/fonts.ts` declares 8 `next/font/google` variable fonts (Fraunces, Recursive, Roboto Flex, Bricolage Grotesque, Anybody, Nabla, Shantell Sans, Workbench) and exposes their axes via CSS vars.
- Runtime axis values are applied live via `font-variation-settings` (built in `intensity.ts`) — not swapped static files. Good foundation, keep this.
- **Supabase**: project `design-thinking` (`gvpatakryoskoewkalny`) already has `public.type_emotion_search_events` — a logging table for fallback/weak-match search queries and "Not quite right?" flags, currently 0 rows, RLS on with no policies (service-role only). This is exactly the review-queue seed you were thinking of — it doesn't hold canonical emotion data today, only feedback signal. There's an existing gated admin page at `src/app/admin/type-emotions/page.tsx` that reads it. We extend this table and page rather than building a queue from scratch.
- I didn't find a second Supabase table holding emotion definitions anywhere in the connected Supabase projects (checked `Strava Application` and `design-thinking`, the two active ones). If there's another source you have in mind, it's likely a spreadsheet, Airtable, or local file we haven't located — worth double-checking before Cursor starts the migration so nothing gets left behind.

## 1. Sanity schema

Add four new schema types under `sanity/schemaTypes/typeEmotions/` and register them in `index.ts`.

**`variableFontFace`** (document) — one per typeface. Mirrors `variableFonts.ts` entries.
- `key` (slug, matches the `next/font` binding in `fonts.ts` — schema doesn't replace `fonts.ts`, since font loading has to stay a build-time `next/font` call for performance; Sanity just becomes the source of truth for axis *metadata and defaults*, which the app fetches at build/request time and cross-references against the fixed set of fonts actually loaded)
- `label`, `googleFontName`
- `axes` (array of object `{ tag, label, min, max, step, default, group }` — group is a string list `core | parametric | expression`, keep it as-is since the UI redesign relies on it for progressive disclosure)
- `supportsItalic` (boolean)

**`specimenPalette`** (document) — mirrors `palettes.ts`.
- `key`, `label`, `sourceUrl` (Coolors link)
- `swatches` (array of hex strings)
- `roles` (object: bg/fg/muted/line/accent/chip)
- `highIntensityOverrides` (optional, same shape)

**`typeEmotion`** (document) — mirrors `catalog.ts`, the core content type editors will actually touch.
- `emotionId` (slug)
- `label`
- `synonyms` (array of strings — this is the ~40-word lexicon; keep it editable as a plain text list, one per line, since that's what non-technical editors will maintain)
- `fontFace` (reference → `variableFontFace`)
- `alternateFontFaces` (array of references)
- `coordinate` / `intense` (object matching axis tags → numeric value; consider a generic `{ tag: string, value: number }[]` rather than hardcoded fields so it stays font-agnostic)
- `italic`, `transform` (optional)
- `palette` (reference → `specimenPalette`, optional)
- `specimenWord`
- `reason` (the editorial caption — "Soft Fraunces with open optical size reads quiet without going precious." Given the redesign drops this from the primary UI per below, keep it as internal/editor-facing documentation rather than user-facing copy)
- `status` (string: `draft | published | flagged` — gives editors a lightweight workflow state independent of Sanity's own draft/publish, useful once the Supabase queue starts surfacing flags against specific emotions)

Query layer: replace the static imports in `catalog.ts`/`variableFonts.ts`/`palettes.ts` with GROQ fetches through `src/lib/sanity.ts` + `src/lib/queries.ts`, following the existing pattern used for `ebirdBirding`. Because this is a client-heavy interactive page, fetch once server-side in `page.tsx` (already a server component) and pass the resolved catalog down as props/context to `TypeEmotionsStudio`, rather than having the client component hit Sanity directly. Run `npm run typegen` after the schema lands so `sanity/types.ts` has the new types.

Keep `intensity.ts` and `matchEmotion.ts` as pure functions operating on the fetched data shape — they don't need to change structurally, just take Sanity-sourced objects instead of the static array.

## 2. Supabase as editor review queue

Extend `type_emotion_search_events` rather than replacing it:

- Add `emotion_id` (nullable text, references `typeEmotion.emotionId` loosely — Supabase doesn't need a hard FK into Sanity) so a flag can be tied to a specific emotion doc, not just a raw query string.
- Add `reviewed_at` (timestamptz, nullable) and `reviewed_by` (text, nullable) so the admin page can mark items resolved instead of them accumulating forever.
- Add `resolution` (text: `applied | dismissed | needs_content`, nullable) to record what the editor decided.

Rework `src/app/admin/type-emotions/page.tsx` into an actual review queue rather than a read-only log:
- Group by `kind` (fallback/weak/feedback) and by `emotion_id` where present.
- Each row gets action buttons: "Add as synonym" (patches the matched `typeEmotion.synonyms` array in Sanity directly via the Sanity client — this is the main payoff of wiring the two systems together), "Dismiss," "Flag for content review."
- "Add as synonym" should call a small server action that does a Sanity `patch().setIfMissing().append()` on the target emotion doc, then marks the Supabase row `reviewed_at`/`resolution: applied`.

This makes the actual editorial loop: user searches something the lexicon doesn't catch → event logged in Supabase → editor reviews in `/admin/type-emotions` → approves → Sanity doc patched → next search matches. Supabase stays the fast, disposable event log; Sanity stays the durable content store. Don't try to make Supabase hold canonical emotion data — that's the inversion that would cause the "half the data is somewhere else" problem you have today.

## 3. UI/interaction redesign

Reference: toomuchtype.com (No Replica) — direct manipulation of letterforms over labeled control panels, playful chrome instead of explanatory captions, multiple specimens coexisting rather than one text field.

**Component extraction** (out of the 578-line monolith):
- `EmotionChipRow.tsx`
- `AxisSlider.tsx` — single control, used for both "primary" and "other" axis groups (currently duplicated inline)
- `AxisPanel.tsx` — groups sliders by `core/parametric/expression`, collapses non-core groups behind a disclosure by default (this alone should recover most of the vertical space)
- `PaletteSwatches.tsx`
- `FontSwitcher.tsx`
- `SpecimenStage.tsx` — the live text render, becomes the interaction surface (see below)

**Space/vertical-scroll fix:**
- Default view shows only `core` axis group (weight, optical size — 2 sliders) plus emotion chips and specimen. `parametric`/`expression` groups collapse under "More axes."
- Move the palette swatches and font switcher into a compact sidebar/drawer rather than stacked full-width rows.
- Drop the explanatory caption line ("Matched emotion id 'calm' · Soft Fraunces...") from the primary view — move it to a subtle tooltip or the admin/editor view only.

**Push the "explore type forms" goal further:**
- Add `wdth` (width) and `GRAD` (grade) as first-class core axes wherever the underlying font supports them (Roboto Flex and Recursive both do per `fonts.ts`) — currently only weight/optical-size get primary billing, and width is the single biggest lever for "does this look different" that's sitting unused.
- Direct-manipulation drag on the specimen text itself: dragging horizontally maps to `wdth`, vertically to `wght`, as an alternative to (not necessarily a replacement for) the sliders. This is the toomuchtype.com move — the type becomes the control, not just the output.
- Let "Intensity" drive more than axis coordinates: letter-spacing overshoot, subtle idle animation (jitter for Anxious, slow ease-in for Playful) via CSS, keyed off the emotion's `transform`/`italic` fields already in the schema.
- Multi-specimen desktop: allow 2–3 specimen instances on screen at once (different emotions/words), draggable, rather than one fixed text field — makes it a comparison/play surface instead of a single-shot tool.

## 4. Suggested build order for Cursor

1. Sanity schema (`typeEmotion`, `variableFontFace`, `specimenPalette`) + `typegen`.
2. Migration script: one-off Node script reading `catalog.ts`/`variableFonts.ts`/`palettes.ts` and writing the equivalent Sanity documents via the Sanity client (mutate API) — keep the static files around read-only until the migration is verified, then delete.
3. Wire `page.tsx` to fetch from Sanity instead of importing the static modules; confirm `TypeEmotionsStudio` renders identically off the new data shape before touching UI.
4. Extend the Supabase table + rework the admin review page.
5. Component extraction (no behavior change) — de-risks the UI redesign by separating "same behavior, cleaner files" from "new behavior."
6. Ship the vertical-space fixes (collapsible axis groups, sidebar) — highest value, lowest risk.
7. Ship `wdth`/`GRAD` axes and direct-manipulation drag — the more experimental interaction work, do last once the data layer and layout are stable.

## Open questions for you before Cursor starts

- Confirm there isn't a second data source for emotions beyond `catalog.ts` that I haven't found — I only checked the two active Supabase projects connected here.
- Should `reason` (the editorial caption) stay visible anywhere in the public UI, or become purely internal?
- Do you want the "Add as synonym" review action to write straight to Sanity's published dataset, or go through a draft/release so it's reviewable before going live?
