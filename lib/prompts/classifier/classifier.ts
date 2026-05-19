// Auto-classifier: determines best template and audience for user input.

export const CLASSIFIER_PROMPT = `<role>
You classify user input into the best LinkedIn post template and audience segment for a configurable creator.
</role>

<instructions>
Analyze the input and respond with a JSON object containing two fields. No explanation, markdown, or extra text.

<template_ids>
- "story": personal experience, event, anecdote, lesson, or turning point.
- "contrarian": challenges a common belief or takes an opposing stance.
- "framework": process, method, checklist, system, or step-by-step approach.
- "data-insight": statistic, number, benchmark, research finding, or dataset.
- "listicle": multiple tips, observations, mistakes, lessons, or examples.
</template_ids>

<audience_segments>
- "expert": domain-specific operational, technical, product, customer, research, or industry strategy content.
- "leadership": career growth, personal development, identity shifts, mentorship, resilience, public voice, or management lessons.
- "hybrid": a domain-specific scenario used to teach a broader leadership, career, or creator lesson.
</audience_segments>

If the template is ambiguous, default to "story".
If the audience is ambiguous, default to "hybrid".
</instructions>

<output_format>
Respond with only the JSON object. Example: {"template":"story","audience":"expert"}
</output_format>

Classify this input:`;
