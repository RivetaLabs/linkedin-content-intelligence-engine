# Public Reproduction Spec

## Purpose

`public/` is a staging copy of a reusable LinkedIn Content Intelligence Engine. It is designed to be verified inside the original private workspace before it is moved into a fresh public repository.

The public artifact is not a client clone. It preserves the transferable engineering pattern: a configurable creator workflow that turns ideas, articles, research, and drafts into scored, safer, more useful LinkedIn posts.

## Reproduction Workflow

1. Start inside this directory.
2. Install dependencies with `npm ci`.
3. Copy `.env.example` to `.env.local`.
4. Fill in Supabase keys and at least one AI provider key.
5. Run `supabase/migrations/0001_public_schema.sql` in a Supabase SQL editor or through the Supabase CLI.
6. Run `supabase/seed.sql` to load synthetic demo data.
7. Run `npm run typecheck`.
8. Run `npm run test:public`.
9. Run `npm run build`.
10. Run `npm run dev` and open the local Next.js URL.

Only after those checks pass should the contents of this directory be copied into a fresh public repository.

## Architecture

The app is a Next.js App Router project with API routes, React client screens, Supabase persistence, and AI SDK streaming.

Core screens:

- `app/create/page.tsx`: content studio for drafting, scoring, refining, and safety review.
- `app/research/page.tsx`: web research workflow that can bridge findings into the create flow.
- `app/my-posts/page.tsx`: saved post library.
- `app/insights/page.tsx`: aggregate content and engagement insights.
- `app/settings/page.tsx`: provider keys, profile URL, and default post length.

Core AI routes:

- `app/api/generate/route.ts`: streaming generation route. Keeps Edge runtime.
- `app/api/score/route.ts`: structured six-pillar scoring.
- `app/api/refine/route.ts`: tip apply, apply all, condense, framework builder, and hook variations.
- `app/api/chat/route.ts`: conversational post refinement.
- `app/api/compliance/route.ts`: source and professional-risk scan.
- `app/api/research/route.ts`: optional search-backed research synthesis.

## Prompt Pipeline

Generation uses layered prompt assembly:

1. Base system prompt with the six public copywriting pillars.
2. Generic creator voice profile and anti-fabrication rules.
3. Optional post intelligence from saved posts.
4. Audience context for `expert`, `leadership`, or `hybrid`.
5. Template-specific instructions.
6. Dynamic gold standard selected from Supabase.
7. Synthetic hook examples matched to template and audience.

Article mode uses the same base layers, then swaps template instructions for `ARTICLE_TO_POST_PROMPT`. Research context is injected into the user prompt when a user starts in Research and continues into Create.

## Preserved Engine Behaviors

- Classifier resolves template and audience.
- Article-to-post mode activates for long-form inputs.
- Research context can be injected into generation.
- Research-to-create bridge uses `sessionStorage`.
- Post intelligence is queried from Supabase when enough scored posts exist.
- Recent opening lines are injected to reduce repetitive hooks.
- Dynamic gold standards are selected from high-scoring posts.
- Audience intelligence is computed from synthetic comment and reaction data.
- Scoring can use calibrated pillar weights from `pillar_metrics`.
- Refine tools include tip apply, apply all, chat, condense, framework builder, and hook variations.
- Safety scan flags fabricated experience, unsupported claims, source drift, professional risk, and domain drift.

## Schema

The public schema ships the following tables:

- `posts`
- `post_versions`
- `conversations`
- `messages`
- `settings`
- `insights_cache`
- `audience_intelligence`
- `linkedin_comments`
- `linkedin_reactions`
- `post_images`
- `pillar_metrics`
- `signature_phrases`
- `voice_metrics`

Important schema invariants:

- `posts.content_score_total` is a generated column. Client writes must not include it.
- `posts.engagement_total` is a generated column. Client writes must not include it.
- Parent rows are created before child rows with foreign keys.
- Settings is a singleton table enforced by `is_singleton`.
- Provider keys can come from environment variables first, then encrypted settings.

## Synthetic Seed Data

`supabase/seed.sql` contains fake creator data:

- Demo posts across story, framework, contrarian, data insight, and listicle templates.
- Synthetic comments and reactions.
- Demo audience intelligence.
- Pillar calibration rows.
- Signature phrases and voice metrics.
- A default settings row with placeholder password hash.

No real scraped content, private client profile, private project IDs, private emails, or copyrighted reference transcripts are included.

## Redaction Rules

The staged public directory must not include:

- Private project names or private person identifiers.
- Private Supabase project IDs or hosting project names.
- Private email addresses.
- Real application passwords or API keys.
- Scraped personal data exports.
- Local build artifacts.
- Private agent instructions or internal handoff files. The root `CLAUDE.md`
  is intentionally public runtime policy for future coding agents; do not add
  private or nested instruction files.
- Copyrighted reference source material.

The public test suite includes a filesystem sanitization test that checks for excluded directory names, private identifier patterns, and non-placeholder environment values.

## Verification

Run from this directory:

```bash
npm ci
npm run typecheck
npm run test:public
npm run build
npm run dev
```

Expected result:

- Dependencies install cleanly.
- TypeScript passes.
- Public sanitization tests pass.
- Next.js production build succeeds.
- Local dev server starts and serves the app.

## Move To Fresh Public Repo

After verification, copy only the contents of `public/` into a new repository under the target organization. Do not copy the parent private repo, its history, or sibling directories.

Recommended final gate before copying:

```bash
rg -in "private|secret|real-client|copyright-source" .
find . -path "./CLAUDE.md" -prune -o \( -name "CLAUDE.md" -o -name "AGENTS.md" -o -name ".env.local" \) -print
npm run test:public
npm run build
```

The string search above is a final smoke check. The actual private identifiers are intentionally not written into this public spec.
