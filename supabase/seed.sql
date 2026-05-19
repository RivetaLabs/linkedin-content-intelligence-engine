-- Synthetic demo data for the public staging app.
-- Safe to publish. No real scraped posts or private profile data.

insert into public.settings (
  id,
  password_hash,
  linkedin_profile_url,
  default_model,
  default_target_length
) values (
  '10000000-0000-4000-8000-000000000001',
  'replace-with-local-password-hash',
  'https://www.linkedin.com/in/demo-creator',
  'claude',
  75
) on conflict (is_singleton) do nothing;

insert into public.posts (
  id,
  linkedin_post_id,
  user_input,
  generated_content,
  template,
  model,
  mode,
  source,
  audience,
  hook_score,
  value_score,
  format_score,
  framework_score,
  contrarian_score,
  story_score,
  likes,
  comments,
  shares,
  impressions,
  reaction_breakdown,
  dominant_reaction,
  annotations,
  word_count,
  posted_at
) values
(
  '20000000-0000-4000-8000-000000000001',
  'demo-post-001',
  'A story about changing the order of a customer presentation.',
  $$We had the right answer.

We just explained it in the wrong order.

That was the lesson from a customer review that should have been simple. We opened with the roadmap. The customer opened with the risk.

Once we moved their concern to slide one, the room changed.

The lesson was not "make better slides."

It was this:

Sequence is strategy.

If your audience is worried about risk, do not start with ambition. Start with the risk, then show why the ambition is still worth it.

Where does your best point show up too late?$$,
  'story',
  'claude',
  'create',
  'linkedin',
  'hybrid',
  5.5,
  5.0,
  5.2,
  3.8,
  4.2,
  5.8,
  82,
  14,
  6,
  4100,
  '{"like": 52, "love": 16, "insight": 10, "support": 4, "celebrate": 0, "funny": 0}'::jsonb,
  'love',
  'Strong story-to-lesson structure. The hook starts with tension, then moves into a clear reader-facing lesson.',
  137,
  now() - interval '10 days'
),
(
  '20000000-0000-4000-8000-000000000002',
  'demo-post-002',
  'A framework for choosing which work deserves attention.',
  $$I use a 3-question filter before I trust a priority list.

I call it the Signal Filter.

1. What changed?
If nothing changed, the work may be noise.

2. Who feels it?
If no customer, teammate, or user feels it, the urgency may be internal theater.

3. What becomes easier after this?
If the answer is vague, the work is probably underdefined.

Most teams do not need a longer roadmap.

They need a sharper filter.

Which question would save your team the most time this week?$$,
  'framework',
  'claude',
  'create',
  'linkedin',
  'expert',
  5.2,
  5.7,
  5.5,
  5.9,
  3.9,
  3.8,
  104,
  18,
  11,
  5600,
  '{"like": 62, "love": 12, "insight": 27, "support": 3, "celebrate": 0, "funny": 0}'::jsonb,
  'insight',
  'Clear named framework with three steps and a practical close.',
  122,
  now() - interval '8 days'
),
(
  '20000000-0000-4000-8000-000000000003',
  'demo-post-003',
  'A contrarian take about consistency.',
  $$Everyone says consistency wins.

I think clarity wins first.

Consistency without a point of view teaches people to ignore you faster.

The better order is:

1. Find the sharp claim.
2. Prove it with a real example.
3. Repeat the idea until the market can explain it back.

Publishing more will not fix a vague message.

It will just spread the vagueness.

Where are you being consistent before you are clear?$$,
  'contrarian',
  'gpt4o',
  'create',
  'linkedin',
  'leadership',
  5.8,
  4.8,
  5.4,
  4.6,
  5.7,
  3.7,
  96,
  22,
  9,
  5200,
  '{"like": 46, "love": 18, "insight": 28, "support": 4, "celebrate": 0, "funny": 0}'::jsonb,
  'insight',
  'Strong belief-breaking arc. The post acknowledges common advice and replaces it with a useful sequence.',
  107,
  now() - interval '6 days'
),
(
  '20000000-0000-4000-8000-000000000004',
  'demo-post-004',
  'A data insight about project updates.',
  $$I reviewed 30 project updates.

The strongest ones did not have more information.

They had clearer decisions.

The weak updates said:
"We are making progress."

The strong updates said:
"We changed the plan because the user signal changed."

That difference matters.

Progress is activity.

Decision quality is leadership.

If your update does not tell people what changed, what it means, and what happens next, it is probably just a status report.

What would your next update look like if it had to end with a decision?$$,
  'data-insight',
  'claude',
  'create',
  'linkedin',
  'hybrid',
  5.4,
  5.3,
  5.6,
  3.6,
  4.3,
  4.6,
  74,
  11,
  5,
  3300,
  '{"like": 41, "love": 10, "insight": 19, "support": 4, "celebrate": 0, "funny": 0}'::jsonb,
  'insight',
  'Uses a synthetic count and converts it into a practical decision-making lesson.',
  131,
  now() - interval '4 days'
),
(
  '20000000-0000-4000-8000-000000000005',
  'demo-post-005',
  'A list of mistakes teams make when explaining work.',
  $$5 ways good teams bury the signal:

1. They lead with context before tension.

2. They report activity instead of decisions.

3. They treat every detail like it has equal weight.

4. They hide the tradeoff until the final paragraph.

5. They ask for alignment before they explain the cost of inaction.

None of these are talent problems.

They are communication design problems.

The fix is simple, but not easy:

Decide what the reader must understand first.

Then remove anything that delays that understanding.

Which one do you see most often?$$,
  'listicle',
  'claude',
  'create',
  'linkedin',
  'expert',
  5.1,
  5.2,
  5.8,
  4.8,
  4.0,
  3.9,
  68,
  9,
  7,
  2900,
  '{"like": 38, "love": 8, "insight": 18, "support": 4, "celebrate": 0, "funny": 0}'::jsonb,
  'insight',
  'Clean listicle with a practical pattern and direct CTA.',
  113,
  now() - interval '2 days'
);

insert into public.conversations (id, post_id)
values
  ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001'),
  ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002')
on conflict do nothing;

insert into public.post_versions (
  id,
  post_id,
  conversation_id,
  version_number,
  content,
  change_description,
  scores,
  word_count
) values
  (
    '40000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    1,
    (select generated_content from public.posts where id = '20000000-0000-4000-8000-000000000001'),
    'Initial generated draft',
    '{"hook":5.5,"value":5.0,"format":5.2,"framework":3.8,"contrarian":4.2,"story":5.8}'::jsonb,
    137
  ),
  (
    '40000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000002',
    1,
    (select generated_content from public.posts where id = '20000000-0000-4000-8000-000000000002'),
    'Initial generated draft',
    '{"hook":5.2,"value":5.7,"format":5.5,"framework":5.9,"contrarian":3.9,"story":3.8}'::jsonb,
    122
  )
on conflict do nothing;

update public.posts
set conversation_id = '30000000-0000-4000-8000-000000000001',
    current_version_id = '40000000-0000-4000-8000-000000000001'
where id = '20000000-0000-4000-8000-000000000001';

update public.posts
set conversation_id = '30000000-0000-4000-8000-000000000002',
    current_version_id = '40000000-0000-4000-8000-000000000002'
where id = '20000000-0000-4000-8000-000000000002';

insert into public.messages (conversation_id, role, content, message_type, metadata)
values
  ('30000000-0000-4000-8000-000000000001', 'user', 'Make the hook sharper.', 'chat', '{}'::jsonb),
  ('30000000-0000-4000-8000-000000000001', 'assistant', 'Try opening with the contrast between the right answer and the wrong order.', 'chat', '{}'::jsonb)
on conflict do nothing;

insert into public.linkedin_comments (
  linkedin_post_id,
  comment_id,
  commentary,
  actor_name,
  actor_headline,
  comment_engagement,
  commented_at
) values
  ('demo-post-001', 'demo-comment-001', 'The line about sequence being strategy is useful. I am going to borrow that framing.', 'Avery Chen', 'Product operator', '{"likes": 5}'::jsonb, now() - interval '9 days'),
  ('demo-post-002', 'demo-comment-002', 'The Signal Filter is exactly what our team needs before planning.', 'Jordan Lee', 'Founder', '{"likes": 8}'::jsonb, now() - interval '7 days'),
  ('demo-post-003', 'demo-comment-003', 'Clarity before consistency is a better standard than most content advice.', 'Sam Rivera', 'Growth lead', '{"likes": 6}'::jsonb, now() - interval '5 days')
on conflict (comment_id) do nothing;

insert into public.linkedin_reactions (
  linkedin_post_id,
  reaction_type,
  actor_name,
  actor_headline
) values
  ('demo-post-001', 'love', 'Taylor Brooks', 'Operations leader'),
  ('demo-post-001', 'insight', 'Riley Patel', 'Strategy consultant'),
  ('demo-post-002', 'insight', 'Casey Nolan', 'Product lead'),
  ('demo-post-003', 'insight', 'Jamie Ortiz', 'Founder')
on conflict do nothing;

insert into public.audience_intelligence (
  id,
  audience_profile,
  top_commenters,
  topic_triggers,
  engagement_by_topic
) values (
  '50000000-0000-4000-8000-000000000001',
  '{"segments":["operators","founders","product leaders"],"tone":"practical and direct"}'::jsonb,
  '[{"name":"Avery Chen","context":"Product operator","signals":["frameworks","decision quality"]}]'::jsonb,
  '{"strong":["decision clarity","customer signal","communication design"],"weak":["generic motivation"]}'::jsonb,
  '{"frameworks":142,"stories":124,"contrarian":167}'::jsonb
) on conflict (is_singleton) do nothing;

insert into public.insights_cache (
  id,
  aggregate_stats,
  ai_summary,
  suggested_next,
  post_count
) values (
  '60000000-0000-4000-8000-000000000001',
  '{"total_posts":5,"avg_content_score_total":4.93,"avg_engagement_total":103.4,"pillar_averages":{"hook":5.4,"value":5.2,"format":5.5,"framework":4.5,"contrarian":4.4,"story":4.4},"template_breakdown":{"story":1,"contrarian":1,"framework":1,"data-insight":1,"listicle":1,"polish":0},"top_performers":["20000000-0000-4000-8000-000000000002","20000000-0000-4000-8000-000000000003"],"source_breakdown":{"generated":0,"linkedin":5}}'::jsonb,
  'Synthetic demo data suggests frameworks and contrarian reframes perform well when they include a practical next step.',
  '[{"title":"Publish another framework post","description":"The synthetic audience responds to named systems and practical filters.","priority":"medium"}]'::jsonb,
  5
) on conflict (is_singleton) do nothing;

insert into public.pillar_metrics (
  pillar_code,
  pillar_name,
  avg_score,
  weight,
  engagement_correlation,
  engagement_delta,
  calibrated_weight,
  rank,
  verdict,
  recommendation,
  last_calibrated_at
) values
  ('hook', 'Hook-First', 5.4, 0.10, 0.42, 18.0, 0.18, 2, 'strong', 'Keep opening with tension or a direct reader call-out.', now()),
  ('value', 'Value-First', 5.2, 0.15, 0.36, 14.0, 0.16, 3, 'strong', 'Keep making the takeaway concrete.', now()),
  ('format', 'Short Punchy Format', 5.5, 0.10, 0.28, 9.0, 0.12, 5, 'healthy', 'Maintain mobile-friendly line breaks.', now()),
  ('framework', 'Frameworks/Lists', 4.5, 0.20, 0.55, 22.0, 0.22, 1, 'highest leverage', 'Add named systems when the post implies a process.', now()),
  ('contrarian', 'Contrarian Takes', 4.4, 0.20, 0.39, 16.0, 0.17, 4, 'use more', 'Challenge default advice respectfully.', now()),
  ('story', 'Story-to-Lesson', 4.4, 0.25, 0.25, 8.0, 0.15, 6, 'steady', 'Use vivid moments and a reader-facing pivot.', now())
on conflict (pillar_code) do update set
  avg_score = excluded.avg_score,
  calibrated_weight = excluded.calibrated_weight,
  last_calibrated_at = excluded.last_calibrated_at;

insert into public.signature_phrases (phrase, category, frequency)
values
  ('Here is the move', 'directive', 4),
  ('The practical question is', 'transition', 3),
  ('That difference matters', 'emphasis', 3)
on conflict do nothing;

insert into public.voice_metrics (
  metric_name,
  category,
  creator_value,
  copywriting_value,
  gap_severity,
  adoption_priority,
  technique_reference
) values
  ('specificity', 'style', 'uses practical examples', 'make examples concrete and sourced', 'low', 'keep', 'Show the Math'),
  ('reader pivot', 'structure', 'sometimes implied', 'turn every story into a reader action', 'medium', 'increase', 'You Pivot'),
  ('framework naming', 'structure', 'emerging pattern', 'name repeatable systems', 'medium', 'increase', 'Name Your Framework')
on conflict do nothing;

insert into public.post_images (
  post_id,
  storage_path,
  mime_type,
  style,
  model
) values (
  '20000000-0000-4000-8000-000000000002',
  'demo/signal-filter.png',
  'image/png',
  'graphic',
  'demo'
) on conflict do nothing;
