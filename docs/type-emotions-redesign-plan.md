# Type Emotions — Redesign & Sanity/Supabase Migration Plan

Hand this to Cursor as the working spec. It covers three tracks that should land in this order: (1) data model migration to Sanity, (2) Supabase review-queue wiring, (3) UI/interaction redesign. Data model first because the UI redesign is much easier to build against a real query layer than against three static files you're about to delete.

**Status as of this update:** Sanity migration (section 1) is live. Supabase review queue (section 2) is live. Axis collapse, `wdth`, drag-to-shape, the floating settings card (3a/3b), and the permanent-block reduction (3c) are all shipped and confirmed against production — the top block is now just emotion chips/search + Intensity + specimen, with a real Axes/Font/Palette tabbed card. New issue found in that build: the card's background inherits the active `SpecimenPalette` and blends into the specimen backdrop on saturated palettes — see 3d, the current fast-follow. Also worth confirming whether the Style (Roman/Italic) tab shipped. Multi-specimen remains deferred.

## 0a. Pre-flight verification — do this first, before the 3c ticket

Two things from the original audit (section 0 below) were true when this plan was written but predate the Sanity migration and the drawer work, and may be stale now. Confirm both before starting 3c (permanent-block reduction), since the answers change how that ticket should be scoped. (The drawer itself is done — this gate now applies to the 3c ticket, not the drawer.)

1. **What are the old static data files actually being used for now?** Run a repo-wide check for lingering imports:
   ```
   grep -rn "from '@/lib/typeEmotions/catalog'" src/
   grep -rn "from '@/lib/typeEmotions/variableFonts'" src/
   grep -rn "from '@/lib/typeEmotions/palettes'" src/
   ls src/lib/typeEmotions/catalog.ts src/lib/typeEmotions/variableFonts.ts src/lib/typeEmotions/palettes.ts
   ```
   Confirmed: these imports are still real, but as **types and fallbacks**, not a second live data path — this isn't the dual-source bug it looked like when this section was first written. **Don't delete these files mid-3c** or treat this as a blocker for the ticket; leave them in place and treat cleanup (deciding whether the fallback is still needed, or replacing it with proper generated types from `sanity/types.ts`) as a separate follow-up, not a 3c dependency.

2. **Did the component extraction happen?** Check whether `TypeEmotionsStudio.tsx` is still one file:
   ```
   wc -l src/app/type-emotions/TypeEmotionsStudio.tsx
   ls src/app/type-emotions/
   ```
   If it's still ~578 lines with no `EmotionChipRow.tsx` / `AxisSlider.tsx` / `AxisPanel.tsx` / `PaletteSwatches.tsx` / `FontSwitcher.tsx` siblings, the extraction from section 3 (item 5) didn't happen yet.

**Recommendation:** don't turn either of these into a debate — they're 15-minute factual checks, not design decisions. Run both at the start of the next Cursor session, before opening the 3c ticket. If extraction turned out not to happen, do it as its own small PR first (mechanical, no behavior change) rather than folding it into the 3c PR — building the new Axes tab and relocating sliders inside a file that's still one large monolith means 3c inherits that file's structure instead of being a clean addition. If the extraction already happened, skip straight to 3c.

## 0. Current state (confirmed against the repo + Supabase, as of the original audit)

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

## 2. Supabase as editor review queue — **shipped**

Confirmed live: `type_emotion_search_events` has `reviewed_at`, `reviewed_by`, and `resolution` columns, and `/admin/type-emotions` has working Add synonym / Dismiss / Flag actions per the spec below. This track is done, not "not started" — see the corrected build order in section 4. Original spec kept below for reference and to spot any remaining gaps/polish (e.g. confirm "Add as synonym" is actually patching Sanity via `patch().setIfMissing().append()` and marking the row resolved, not just updating local state).

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
- ~~Default view shows only `core` axis group... collapse under "More axes."~~ **Shipped.**
- ~~Move the palette swatches and font switcher into a compact sidebar/drawer rather than stacked full-width rows.~~ **Shipped — see 3a.**
- Drop the explanatory caption line ("Matched emotion id 'calm' · Soft Fraunces...") from the primary view — move it to a subtle tooltip or the admin/editor view only. **Shipped** (production copy now reads "DRAG TO SHAPE" instead).

**Push the "explore type forms" goal further:**
- ~~Add `wdth` (width) as a first-class core axis~~ **Shipped.** `GRAD` (grade) status unconfirmed — verify it's wired for Roboto Flex/Recursive; add if not.
- ~~Direct-manipulation drag on the specimen text~~ **Shipped** ("drag to shape").
- Let "Intensity" drive more than axis coordinates: letter-spacing overshoot, subtle idle animation (jitter for Anxious, slow ease-in for Playful) via CSS, keyed off the emotion's `transform`/`italic` fields already in the schema. **Not started — candidate for after 3c.**
- Multi-specimen desktop: allow 2–3 specimen instances on screen at once (different emotions/words), draggable, rather than one fixed text field. **Deliberately deferred** — hold until 3c ships and the single-specimen interaction model feels settled. Don't start this yet.

### 3a. Settings drawer spec — **decided: floating card / popover, not a persistent rail**

First shipped attempt used a card nested inside the specimen stage's own container — read as "a box inside a box" and felt forced. Decision after reviewing that build: keep the floating-card *concept*, fix the *mechanics*. Superseding the original persistent-rail spec below.

**Status: the overlay mechanics are shipped, the card's content shape is not yet what 3c needs.** Confirmed live — viewport-anchored popover off the `Aa` toggle, desktop card + mobile bottom sheet, click-outside/`Escape`/focus trap, toggle-origin spring animation. What's still the old shape: the card today is a **Font / Style / Palette accordion**, no Axes content. The tabbed Axes / Font / Style / Palette surface described below (and needed for 3c) hasn't been built yet — 3c isn't just "move sliders into the existing Axes tab," it's "build the Axes tab, then move sliders into it."

~~Split controls into two systems, split by category (axes here, font there).~~ **Superseded by 3c** — the split is no longer "axes vs. font," it's "has another way to be set vs. doesn't." The card becomes a single unified, tabbed control surface (Axes / Font / Style / Palette), not a font-and-palette-only setup panel. Axes is the default open tab. **This tabbed restructure is itself unbuilt** — see status note above.

**What changes with the floating-card decision, and the tradeoffs to accept knowingly:**
- **Give up simultaneous visibility, gain one component instead of two.** A persistent rail's whole argument was "see the font change land on the specimen without anything covering it." A floating card is an overlay by definition — while open, it sits above the page rather than beside it. In exchange, it's the same conceptual component at every breakpoint (popover on desktop, full-width sheet from the bottom on mobile) instead of a rail + a separate bottom-sheet implementation. Accept the tradeoff explicitly rather than let it happen by accident.
- **Anchor to the toggle, not to the specimen's container.** The nested/forced feeling came from the card being positioned and clipped relative to the specimen stage's own DOM box. Fix: position it relative to the viewport (`position: fixed` or a proper anchor-positioning/popover API), anchored to the `Aa` toggle button, rendered in its own stacking context above everything — not as a child element inside `SpecimenStage.tsx`.
- **Specimen length works in the card's favor here.** Specimen text is a short English word, roughly 3–12 characters, not a long compound string — so the popover doesn't need to dodge wrapped or overflowing text. It's safe to anchor top-right near the toggle without worrying about covering the word itself, since the word renders large but narrow and the toggle/card sit clear of it in the current layout. Don't over-engineer collision detection for this — a fixed top-right anchor is sufficient.
- **Needs real overlay mechanics**, which a persistent rail didn't require: click-outside-to-close, `Escape` to close, and focus trapping while open (it's now a transient overlay, not persistent page chrome — accessibility expectations differ).
- **Mobile stays a bottom sheet** — full-width, slides up from the bottom, same open/close animation language as the desktop popover (see 3b). This part of the original spec is unchanged.

Default state: **closed**, small persistent `Aa`-style toggle near the specimen. Rationale unchanged from original spec — first-time visitors should see the emotion→type mapping working before being invited to reconfigure it.

Inside the card, each section shows its current selection when collapsed ("Fraunces ›", "Roman ›", "Neutral Elegance ›") rather than all options expanded at once.

### 3b. Drawer affordance + reveal animation

- **One-time peek, not a loop.** ~1-2s after page settles, the toggle nudges a few px and springs back once, then goes still. No repeating pulse — reads as nagging otherwise.
- **Typographic toggle**, not a generic icon — the shipped `Aa` glyph is the right call. Consider a subtle variable-font shift (slight width/weight change) on hover/idle to echo the specimen's own "drag to shape" interaction.
- **Open/close transition**: spring-based squash-and-stretch (slight overshoot on settle) expanding *out from the toggle's position*, 250–350ms — this now has a clear, obvious origin point once the card is anchored to the toggle instead of nested in the specimen box, which is a better match for "motion communicates structure" than a flat slide.
- **Accessibility requirement, not optional:** gate all of the above behind `prefers-reduced-motion` — reduced-motion users get an instant toggle, no peek, no spring. State this explicitly in the Cursor ticket so it doesn't get dropped.

### 3c. Permanent-block reduction — decided: cut redundant controls, not just rearrange them

Root cause identified: the top block isn't heavy because of *where* things are, it's heavy because some values are controlled twice. Weight and width are set by both a slider **and** the drag-to-shape gesture on the specimen — same value, two competing UIs, double the vertical cost for zero interaction gain. Two-column layouts, moving Size into the card, inline specimen text editing (all raised earlier) are still valid, but they're rearrangement — this is the actual cut.

**Rule for what's allowed to stay in the permanent block: a control only lives there if there's no other way to set that value.** Apply it per control:
- **Weight (`wght`)** — covered by drag-to-shape (vertical drag). Remove the slider from the permanent block; it moves into the card's Axes tab for people who want numeric precision instead of gesture.
- **Width (`wdth`)** — covered by drag-to-shape (horizontal drag). Same treatment as weight.
- **Optical size (`opsz`)** — **not currently covered by any gesture. Decided: option (a) — stays as the one slider remaining in the permanent block**, since it genuinely has no other way to be set. Not extending the drag gesture to cover it for now; revisit only if it turns out to want more exploration room later.
- **Size (`rem`)** — no gestural equivalent, but it's a viewport/display setting rather than a type-form exploration control. Moves into the card regardless (Stage or a general "Display" grouping), same reasoning as the original Section-3 note.
- **Intensity (macro)** — no gestural equivalent, and it's the primary emotional dial. **Stays in the permanent block, full stop.**
- **Specimen text** — becomes directly editable on the specimen itself (click into the headline, type) rather than a separate labeled input. Removes the row entirely rather than moving it.

**Net result:** the permanent block reduces to emotion chips/search, Intensity, and the specimen (plus the small `Aa` toggle and the existing footer readout, e.g. `FRAUNCES · "WGHT" 340, "OPSZ" 40...`, which stays as the always-visible numeric feedback loop even with the sliders gone). Optical size stays permanent too (decided above — no drag equivalent). Everything else — weight, width, size, font, style, palette — lives in the unified tabbed card from 3a, opened on demand, defaulting to the Axes tab.

**Risk, accepted knowingly:** first-time visitors who don't notice "DRAG TO SHAPE" may not realize weight/width are adjustable at all with the sliders gone from view. Explicitly accepted — this is a playground/lab page, not a polished production tool, and the value of a lighter, more exploratory first impression outweighs the discoverability cost for now. Don't over-engineer a state-dependent compromise (e.g. "show sliders until first drag, then collapse") — ship the simple cut first and revisit only if usage data or feedback says people are missing the controls entirely.

## 4. Suggested build order for Cursor

1. ~~Sanity schema (`typeEmotion`, `variableFontFace`, `specimenPalette`) + `typegen`.~~ **Done.**
2. ~~Migration script... keep static files around read-only until verified, then delete.~~ **Done** — confirm the static `catalog.ts`/`variableFonts.ts`/`palettes.ts` files have actually been removed (or are explicitly marked dead) now that Sanity is the source of truth, so the two don't drift.
3. ~~Wire `page.tsx` to fetch from Sanity...~~ **Done.**
4. ~~Extend the Supabase table + rework the admin review page.~~ **Done** — `reviewed_at`/`reviewed_by`/`resolution` columns and Add synonym / Dismiss / Flag actions are live on `/admin/type-emotions`. Worth a pass to confirm "Add synonym" is actually round-tripping to Sanity per section 2's spec rather than just updating the Supabase row, but the track itself is shipped, not queued.
5. ~~Component extraction (no behavior change)~~ — confirm this actually happened alongside the axis-collapse ship; if the component is still one file, do the extraction before adding the drawer (3a) so the drawer lands as its own component, not more inline JSX in an already-large file.
6. ~~Ship the vertical-space fixes (collapsible axis groups)~~ **Done.** ~~Settings card overlay mechanics (3a/3b)~~ **Done.** ~~Permanent-block reduction per 3c~~ **Done** — confirmed live: permanent block is trimmed to emotion chips/search + Intensity + specimen, card is a real Axes/Font/Palette tabbed surface. See 3d below for a bug found in this build (card surface inherits the active palette, blends into the backdrop) — **fix next.**
7. ~~Ship `wdth` axis + direct-manipulation drag~~ **Done.** `GRAD` axis and intensity-driven idle animation remain open, lower priority than 3d.
8. Multi-specimen desktop — **deferred**, do not start until 3d ships and the single-specimen interaction settles.

## Immediate next ticket for Cursor

~~**Cut the permanent-block redundancy per 3c.**~~ **Done** — verified against a production screenshot (Anxious/Recursive/Magenta Dream): permanent block is now just emotion chips/search, Intensity, and the specimen; card has Axes/Font/Palette tabs. Two things to fix next, see 3d:
1. **Card surface bug.** The card's background inherits the active `SpecimenPalette` (e.g. Magenta Dream's purple) instead of a fixed neutral surface token, so on saturated palettes the card blends into the specimen backdrop behind it and becomes hard to read/engage with.
2. **Missing Style tab?** Spec called for four tabs (Axes / Font / Style / Palette); the shipped card shows three (Axes / Font / Palette), no visible Style/Roman-Italic control. Confirm with Cursor whether it got folded into Font or dropped.

### 3d. Card surface & elevation fix

Root cause: palettes exist to style the *specimen* (the content), not the tool's own chrome. The card is UI, and UI should pull from the site's fixed neutral surface tokens (the same ones the original top block's white background uses) regardless of which `SpecimenPalette` is currently active — right now it's wired to inherit palette/page context instead.

Two changes, both required:
- **Decouple the card's background from `palette.roles.*` entirely.** Use the standard neutral card token (`--color-card-bg` / `--color-card-border`, or equivalent) so the card looks the same regardless of active palette — always readable, never blending into a saturated backdrop like Magenta Dream's purple.
- **Add real elevation.** A `box-shadow` plus a visible border, so the card reads as floating above the page rather than part of it — this matters more now that it can't rely on any color-contrast difference from the backdrop to separate itself.

Verify against at least two palettes with very different lightness/saturation (e.g. Magenta Dream and Neutral Elegance) to confirm the fix holds regardless of which one's active, not just the one that surfaced the bug.

## Open questions for you before Cursor starts

- Should `reason` (the editorial caption) stay visible anywhere in the public UI, or become purely internal? Still open.
- "Add as synonym" (section 2, shipped) currently writes straight to Sanity's published dataset. Should that change to go through a draft/release so it's reviewable before going live, or is direct-to-published fine for this?
- Confirm the old static `catalog.ts`/`variableFonts.ts`/`palettes.ts` files are actually deleted or clearly marked dead now that Sanity is live, so a future edit doesn't accidentally touch the abandoned copy.
