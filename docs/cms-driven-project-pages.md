## CMS-driven project pages (pattern)

For “Projects” routes like `/runs` and `/pileated-watch`, the goal is that **a non-engineer can update page copy and SEO in Sanity** without code changes.

### Principles

- **Copy belongs in Sanity**: titles, intros, section headings, helper text, empty-state messages, and SEO.
- **Code owns behavior**: data fetching, auth, aggregation, map/table logic, and legally-required attribution/terms.
- **Fallbacks are required**: pages should render even if the singleton document hasn’t been created or is missing fields.
- **Prefer reusable schemas**: add a new `projectKey` + singleton id rather than creating one-off page types.

### Recommended implementation steps

1. **Create/update schema**
   - Add a singleton schema type (prefer reuse, e.g. `toolProjectPage`).
   - Add the singleton to Studio structure with a fixed id.
2. **Query + fetch**
   - Add a GROQ query in `src/lib/queries.ts`.
   - Add a fetch helper in `src/lib/sanity.ts` with `useCdn: false` and `next.revalidate`.
   - Wrap fetch helper in `cache()` if used in both `generateMetadata()` and the page.
3. **Render**
   - Use `PortableText` for rich copy blocks.
   - Keep attribution in code where required (e.g. Strava credit; OSM/ODbL credit).
4. **Performance**
   - If data assembly is slow (multiple HTTP calls, geocoding, etc.), move it to a separate async server component and wrap it in `Suspense` so the hero can stream (improves LCP).
5. **Deploy**
   - Validate: `cd sanity && npx sanity schema validate`
   - Deploy schema: `cd sanity && npx sanity schema deploy`
   - Redeploy Studio (Sanity hosted): `npm run studio:deploy`

