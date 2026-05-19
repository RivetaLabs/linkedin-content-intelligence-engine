# LinkedIn Content Intelligence Engine

Public staging build for a reusable LinkedIn content workflow. It demonstrates a configurable creator app with AI-assisted drafting, article-to-post generation, source-aware research, scoring, refinement tools, safety checks, post history, and audience intelligence.

This directory is intentionally self-contained. It is staged inside the private working repo first so it can be scrubbed, documented, built, and tested before moving to a fresh public repository.

## Quick Start

```bash
npm ci
cp .env.example .env.local
npm run typecheck
npm run test:public
npm run build
npm run dev
```

Create a Supabase project, run the migration in `supabase/migrations/0001_public_schema.sql`, then load `supabase/seed.sql` for synthetic demo data.

## What This Demonstrates

- Six-pillar LinkedIn copywriting engine: hook, value, format, framework, contrarian angle, story-to-lesson.
- Classifier that resolves template, audience, and article mode.
- Research-to-create bridge with source-aware prompt injection.
- Dynamic gold-standard selection from local post data.
- Audience intelligence from synthetic comments and reactions.
- Scoring, chat refine, condense, hook variation, framework builder, and apply-all refinement flows.
- Claim/source safety scan with fix and dismiss actions.
- Supabase schema with generated score and engagement columns.

## Public Boundary

The staged app contains placeholder environment values and synthetic seed data only. Private client data, scraped exports, internal docs, private agent instructions, local build artifacts, and copyrighted reference material are excluded from this directory.

See `docs/public/SPEC.md` for the full reproduction and redaction spec.
