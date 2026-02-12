/** Shared constants for the knowledge base feature. */

export interface KnowledgeCategory {
  value: string;
  label: string;
  colorClasses: string;
  borderClass: string;
}

export const KNOWLEDGE_CATEGORIES: KnowledgeCategory[] = [
  { value: "bizdev", label: "BizDev", colorClasses: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700", borderClass: "border-l-amber-500" },
  { value: "product", label: "Product Features", colorClasses: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700", borderClass: "border-l-blue-500" },
  { value: "dev_knowledge", label: "Dev Knowledge", colorClasses: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700", borderClass: "border-l-emerald-500" },
  { value: "general", label: "General", colorClasses: "bg-secondary text-secondary-foreground border-border", borderClass: "border-l-muted-foreground" },
  { value: "gtm", label: "GTM Playbooks", colorClasses: "bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700", borderClass: "border-l-violet-500" },
];

export const CATEGORY_LABEL_MAP: Record<string, string> = Object.fromEntries(
  KNOWLEDGE_CATEGORIES.map((c) => [c.value, c.label]),
);

export const CATEGORY_COLOR_MAP: Record<string, KnowledgeCategory> = Object.fromEntries(
  KNOWLEDGE_CATEGORIES.map((c) => [c.value, c]),
);

/** Maps checklist phase names to the most relevant knowledge entry title. */
export const PHASE_KNOWLEDGE_MAP: Record<string, string> = {
  "PH: 1. Foundation": "The 7 Phases Explained",
  "PH: 2. Community": "The Role of a Hunter",
  "PH: 3. Assets": "The Maker's Comment",
  "PH: 4. Pre-Launch": "The Coming Soon Page",
  "PH: 5. Launch Day": "Why Timing Matters",
  "PH: 6. Post-Launch": "Common Mistakes That Kill Launches",
  "PH: 7. Leverage": "What Top 5 Actually Takes",
};

/** Estimate reading time in minutes for a text string. */
export function estimateReadingTime(text: string): number {
  const wordCount = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}
