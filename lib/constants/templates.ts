import type { TemplateInfo } from "@/lib/types";

export const TEMPLATES: TemplateInfo[] = [
  {
    id: "story",
    name: "Story to Lesson",
    description: "Personal story with a professional takeaway",
    icon: "BookOpen",
    placeholder:
      'What happened? (e.g., "A customer asked one question that changed the whole meeting...")',
  },
  {
    id: "contrarian",
    name: "Contrarian Take",
    description: "Challenge conventional industry wisdom",
    icon: "Zap",
    placeholder:
      'What belief do you want to challenge? (e.g., "Everyone thinks consistency matters more than clarity...")',
  },
  {
    id: "framework",
    name: "Framework Reveal",
    description: "Share a named method or process",
    icon: "LayoutGrid",
    placeholder:
      'What framework do you use? (e.g., "My 3-step filter for deciding what matters first...")',
  },
  {
    id: "data-insight",
    name: "Data Insight",
    description: "Lead with a surprising stat or finding",
    icon: "BarChart3",
    placeholder:
      'What data surprised you? (e.g., "Most teams track activity before decision quality...")',
  },
  {
    id: "listicle",
    name: "Listicle",
    description: "Numbered tips, lessons, or observations",
    icon: "ListOrdered",
    placeholder:
      'What list do you want to share? (e.g., "5 mistakes that make smart teams look scattered...")',
  },
];
