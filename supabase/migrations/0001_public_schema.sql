-- Public LinkedIn Content Intelligence Engine schema.
-- Run in a new Supabase project before loading supabase/seed.sql.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_input text,
  generated_content text not null,
  template text not null default 'story',
  model text not null default 'claude',
  mode text not null default 'create',
  source text not null default 'generated',
  audience text,
  linkedin_post_id text unique,
  linkedin_url text,
  posted_at timestamptz,
  copied_at timestamptz,
  last_synced_at timestamptz,
  generated_from_id uuid references public.posts(id) on delete set null,
  conversation_id uuid,
  current_version_id uuid,
  hook_score numeric,
  value_score numeric,
  format_score numeric,
  framework_score numeric,
  contrarian_score numeric,
  story_score numeric,
  content_score_total numeric generated always as (
    case
      when hook_score is null
        and value_score is null
        and format_score is null
        and framework_score is null
        and contrarian_score is null
        and story_score is null
      then null
      else round(((coalesce(hook_score, 0) + coalesce(value_score, 0) + coalesce(format_score, 0) + coalesce(framework_score, 0) + coalesce(contrarian_score, 0) + coalesce(story_score, 0)) / 6.0)::numeric, 2)
    end
  ) stored,
  likes integer,
  comments integer,
  shares integer,
  impressions integer,
  engagement_total integer generated always as (
    coalesce(likes, 0) + (coalesce(comments, 0) * 2) + (coalesce(shares, 0) * 3)
  ) stored,
  comment_ratio numeric,
  reaction_breakdown jsonb,
  dominant_reaction text,
  post_type text,
  content_attributes jsonb,
  generation_metadata jsonb,
  score_explanation jsonb,
  scoring_tips text[],
  compliance_results jsonb,
  refinement_history jsonb,
  publication_edits jsonb,
  post_images jsonb,
  annotations text,
  word_count integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.post_versions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  version_number integer not null,
  content text not null,
  change_description text,
  scores jsonb,
  word_count integer,
  created_at timestamptz default now()
);

alter table public.posts
  add constraint posts_conversation_id_fkey
  foreign key (conversation_id) references public.conversations(id) on delete set null;

alter table public.posts
  add constraint posts_current_version_id_fkey
  foreign key (current_version_id) references public.post_versions(id) on delete set null;

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role text not null,
  content text not null,
  message_type text not null default 'chat',
  metadata jsonb,
  created_at timestamptz default now()
);

create table public.settings (
  id uuid primary key default gen_random_uuid(),
  is_singleton boolean not null default true unique,
  password_hash text not null,
  anthropic_api_key_encrypted text,
  openai_api_key_encrypted text,
  search_api_key_encrypted text,
  linkedin_profile_url text,
  default_model text not null default 'claude',
  default_target_length integer default 75,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint settings_singleton_check check (is_singleton = true)
);

create table public.insights_cache (
  id uuid primary key default gen_random_uuid(),
  is_singleton boolean not null default true unique,
  aggregate_stats jsonb not null default '{}'::jsonb,
  ai_summary text,
  suggested_next jsonb,
  post_count integer not null default 0,
  last_computed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint insights_cache_singleton_check check (is_singleton = true)
);

create table public.audience_intelligence (
  id uuid primary key default gen_random_uuid(),
  is_singleton boolean default true unique,
  audience_profile jsonb,
  top_commenters jsonb,
  topic_triggers jsonb,
  engagement_by_topic jsonb,
  computed_at timestamptz default now(),
  constraint audience_intelligence_singleton_check check (is_singleton = true)
);

create table public.linkedin_comments (
  id uuid primary key default gen_random_uuid(),
  linkedin_post_id text not null,
  comment_id text not null unique,
  commentary text,
  actor_name text,
  actor_headline text,
  actor_linkedin_url text,
  actor_profile_image text,
  comment_engagement jsonb,
  linkedin_url text,
  pinned boolean,
  edited boolean,
  commented_at timestamptz,
  created_at timestamptz default now()
);

create table public.linkedin_reactions (
  id uuid primary key default gen_random_uuid(),
  linkedin_post_id text not null,
  reaction_type text,
  actor_name text,
  actor_headline text,
  actor_linkedin_url text,
  actor_profile_image text,
  created_at timestamptz default now()
);

create table public.post_images (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade,
  storage_path text not null,
  mime_type text not null default 'image/png',
  style text not null default 'graphic',
  model text not null default 'demo',
  created_at timestamptz default now()
);

create table public.pillar_metrics (
  id uuid primary key default gen_random_uuid(),
  pillar_code text not null unique,
  pillar_name text not null,
  avg_score numeric,
  weight numeric,
  engagement_correlation numeric,
  engagement_delta numeric,
  calibrated_weight numeric,
  rank integer,
  verdict text,
  recommendation text,
  last_calibrated_at timestamptz,
  created_at timestamptz default now()
);

create table public.signature_phrases (
  id uuid primary key default gen_random_uuid(),
  phrase text not null,
  category text,
  frequency integer default 1,
  created_at timestamptz default now()
);

create table public.voice_metrics (
  id uuid primary key default gen_random_uuid(),
  metric_name text not null,
  category text,
  creator_value text,
  copywriting_value text,
  gap_severity text,
  adoption_priority text,
  technique_reference text,
  created_at timestamptz default now()
);

create index posts_created_at_idx on public.posts(created_at desc);
create index posts_template_idx on public.posts(template);
create index posts_audience_idx on public.posts(audience);
create index post_versions_post_id_idx on public.post_versions(post_id);
create index messages_conversation_id_idx on public.messages(conversation_id);
create index linkedin_comments_post_id_idx on public.linkedin_comments(linkedin_post_id);
create index linkedin_reactions_post_id_idx on public.linkedin_reactions(linkedin_post_id);

create trigger settings_set_updated_at
before update on public.settings
for each row execute function public.set_updated_at();

create trigger posts_set_updated_at
before update on public.posts
for each row execute function public.set_updated_at();

create trigger conversations_set_updated_at
before update on public.conversations
for each row execute function public.set_updated_at();

create trigger insights_cache_set_updated_at
before update on public.insights_cache
for each row execute function public.set_updated_at();
