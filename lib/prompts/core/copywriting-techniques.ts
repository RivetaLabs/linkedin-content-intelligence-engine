// Centralized public copywriting technique definitions.
// Shared by scoring, chat-refine, tip-refine, and apply-all.

export const COPYWRITING_TECHNIQUES = `<copywriting-techniques>
<instructions>
Reference these techniques by name when scoring posts or applying tips.
When multiple techniques could help, pick the one that improves the weakest pillar without inventing facts.
</instructions>

<technique name="PPE" pillar="format">
Punch-Punch-Explain. Two short declarative lines, then one sentence that explains the point.

Before: "The strategy failed because the team tried to fix everything at once and nobody knew what mattered."
After: "The strategy failed.
Not because the team was lazy.
Because everything was marked urgent, so nothing was actually prioritized."
</technique>

<technique name="You Pivot" pillar="story">
After an "I" story, turn the lesson toward the reader.

Before: "That taught me to prepare differently."
After: "That taught me to prepare differently.
If you are walking into a high-stakes conversation this week, decide what question you need answered before you build the deck."
</technique>

<technique name="Show the Math" pillar="value">
Replace vague scale with specific, sourced, or user-provided numbers.

Before: "We wasted a lot of time."
After: "We spent 6 weeks debating the roadmap and 42 minutes talking to customers."
</technique>

<technique name="Two-Part Hook" pillar="hook">
Call out the reader or situation, then give them a reason to keep reading.

Before: "Some thoughts on product strategy."
After: "Founders with too many roadmap ideas: this filter will save your next sprint."
</technique>

<technique name="Name Your Framework" pillar="framework">
If the post contains a repeatable process, give it a memorable name and 3 to 5 steps.

Before: "Here is how I review a launch plan."
After: "I use the 3-Lens Launch Check: audience, proof, friction."
</technique>

<technique name="Belief-Breaking Arc" pillar="contrarian">
State the common belief, acknowledge why it exists, reveal the crack, then offer the better frame.

Before: "You do not need more content."
After: "Everyone says consistency wins.
I get why.
But consistency without a point of view just teaches people to ignore you."
</technique>

<technique name="Metaphor Bridge" pillar="value">
Define complex terms with a quick analogy or plain-language explanation.

Before: "The workflow needs better observability."
After: "The workflow needs better observability, the dashboard equivalent of turning the lights on before something breaks."
</technique>

<technique name="Proof Stack" pillar="value">
Use multiple proof types when the user supplies them: personal experience, data, customer signal, and logic.
</technique>

<technique name="Identity Mirror" pillar="hook">
Name the reader's role, tension, or private thought so they recognize themselves.
</technique>

<technique name="Claim Your Proof" pillar="value">
Start with what can be proven, then write the claim that proof supports.
</technique>

<technique name="Inner Monologue Mirror" pillar="story">
Articulate the reader's internal frustration in plain language.
</technique>

<technique name="Actionable Close" pillar="value">
End with a question, diagnostic, or small action that lets the reader apply the idea immediately.
</technique>
</copywriting-techniques>`;
