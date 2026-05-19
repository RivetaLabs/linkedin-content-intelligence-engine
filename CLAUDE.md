# LinkedIn Content Intelligence Engine Runtime Policy

This file is runtime policy, not product documentation. Keep it short, current,
and useful at execution time. If a detail belongs in setup docs, architecture
docs, or a feature walkthrough, put it in `README.md` or `docs/public/SPEC.md`
instead.

## Operating Mode

You are working in a public, reusable LinkedIn content engine. Treat it as an
open-source proof of work for a configurable AI content workflow, not as a
private client clone.

Default behavior:

- Read source before making claims about behavior.
- Prefer direct implementation when the request is clear.
- Ask only when the missing answer changes the design or risk materially.
- Keep responses concise unless the user asks for a spec, audit, or handoff.
- Explain trade-offs plainly, then recommend one path.

## Public Boundary

NEVER reintroduce private-project material into this repository.

Do not add:

- Real creator/customer data.
- Scraped profile exports or real comments/reactions.
- Private project names, hosting project names, IDs, URLs, or email addresses.
- Real API keys, passwords, tokens, service-role keys, or hashes.
- Copyrighted source transcripts or book-derived private reference material.
- Internal handoff notes, agent reports, local workspace folders, or build
  artifacts.

All demo content must be synthetic or clearly generic. Environment examples must
stay placeholder-only.

## What This Repo Is

This app demonstrates a reusable AI loop for LinkedIn content creation:

- Classify the user input into mode, template, and audience.
- Assemble a layered system prompt with voice, audience, examples, and optional
  post intelligence.
- Generate or transform posts, including article-to-post mode.
- Inject source-aware research context when provided.
- Score drafts against six public copywriting pillars.
- Run safety checks for unsupported claims, source drift, professional risk,
  fabricated experience, and domain drift.
- Support refinement tools: tips, apply-all, chat, condense, framework builder,
  and hook variations.
- Persist posts, versions, conversations, settings, insights, and synthetic
  audience intelligence in Supabase.

If a change weakens that loop, call it out before proceeding.

## Architecture Invariants

Preserve these unless the user explicitly asks for an architectural change:

- Streaming AI routes stay on Edge runtime.
- Prompt assembly that reads dynamic data must be awaited.
- Generated database columns are stripped from client write payloads.
- Parent rows are created before foreign-key child rows.
- Safety scan runs after generation and remains visible in the create flow.
- Environment provider keys override encrypted Supabase settings.
- Source code is authoritative when docs and implementation disagree.

Edge runtime routes must not depend on Node-only APIs such as filesystem access
or Node `Buffer`.

## Prompt Rules

Prompts should remain portable and generic.

- Keep the six-pillar copywriting framework: hook, value, format, framework,
  contrarian angle, and story-to-lesson.
- Do not encode a single niche, employer, person, or customer as the default.
- Keep examples synthetic and broadly reusable.
- Keep safety language focused on claims, sourcing, professional risk, and
  factual grounding.
- Avoid copying private prompt text from any non-public source.

When changing prompts, check related UI labels, scoring language, tests, and
seed data so the product still describes one coherent engine.

## Data And Schema Rules

The public schema lives in `supabase/migrations/0001_public_schema.sql`.
Synthetic demo data lives in `supabase/seed.sql`.

Required tables:

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

When editing persistence:

- Keep `settings` singleton behavior.
- Keep generated columns out of inserts and updates.
- Update `lib/database.types.ts` when schema shape changes.
- Update seed data when UI or prompt defaults depend on seeded examples.

## Verification Contract

Run the smallest useful check while working, then run the full public gate before
calling the repo ready:

```bash
npm ci
npm run typecheck
npm run test:public
npm run build
```

The public sanitization suite is not optional. If it fails, fix the source of
the leak instead of weakening the test.

Use the Supabase CLI or SQL editor to apply `supabase/migrations/0001_public_schema.sql`
and `supabase/seed.sql` when database behavior changes. If local Supabase cannot
run because of Docker or disk constraints, say that explicitly and still verify
the SQL files structurally where possible.

## Documentation Rules

Use:

- `README.md` for setup and high-level demonstration value.
- `docs/public/SPEC.md` for reproduction details, architecture, schema, prompt
  pipeline, seed data, verification, and redaction rules.
- `CLAUDE.md` for execution policy only.

Do not put changing status, test counts, session history, or deployment state in
this file.

## Git And Release Boundary

Keep commits narrow and reviewable. This repository should be safe to publish
from its current tree, but do not push or create a remote unless the user asks.

Before any publish or handoff, check:

- No install or build artifacts are present.
- `.env.local` is absent.
- `.env.example` contains placeholders only.
- Sanitization tests pass.
- The final tree does not depend on the original private workspace.
