const SUPERSCRIPTS: Record<string, string> = {
  "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
  "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
};

export function formatMathText(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .replace(/\^([0-9])/g, (_, d) => SUPERSCRIPTS[d] ?? `^${d}`)
    .replace(/\btheta\b/gi, "θ")
    .replace(/\balpha\b/gi, "α")
    .replace(/\bbeta\b/gi, "β")
    .replace(/\bgamma\b/gi, "γ")
    .replace(/\bdelta\b/gi, "δ")
    .replace(/\blambda\b/gi, "λ")
    .replace(/\bmu\b/gi, "μ")
    .replace(/\bsigma\b/gi, "σ")
    .replace(/\bphi\b/gi, "φ")
    .replace(/\bomega\b/gi, "ω")
    .replace(/\bpi\b/gi, "π")
    .replace(/\bsqrt\b/g, "√")
    .replace(/<=/g, "≤")
    .replace(/>=/g, "≥")
    .replace(/!=/g, "≠")
    .replace(/->/g, "→")
    .replace(/\bpm\b/g, "±")
    .replace(/\binfty\b/g, "∞")
    .replace(/\binfinity\b/gi, "∞");
}

// Error type tags: fully neutral — diagnostic metadata, not a primary signal.
export function errorTypeClasses(_id: string): string {
  return "border-border bg-surface-subtle text-muted-foreground";
}

// Confidence tags: neutral elevation system — no opacity on text, no semantic colours.
// Uses the existing dark token stack (background < surface-subtle < card) as three
// distinct, readable levels. Low = most recessed surface, high = most elevated.
const CONFIDENCE_CLASSES: Record<string, string> = {
  low:    "border-border/50 bg-background text-muted-foreground",
  medium: "border-border bg-surface-subtle text-muted-foreground",
  high:   "border-border bg-card text-foreground",
};

export function confidenceClasses(level: string | null | undefined): string {
  return CONFIDENCE_CLASSES[level?.toLowerCase() ?? ""] ?? "border-border bg-surface-subtle text-muted-foreground";
}

export function scoreClasses(score: number | null | undefined): string {
  if (score == null) return "border-border bg-surface-subtle text-muted-foreground";
  // 0–2: red — critical
  if (score <= 2) return "border-red-400 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-950/50 dark:text-red-300";
  // 3–7: amber softened — developing (amber-200 reads warm-neutral, not warning)
  if (score <= 7) return "border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/25 dark:text-amber-200";
  // 8–10: green — strong
  return "border-green-400 bg-green-50 text-green-800 dark:border-green-700 dark:bg-green-950/50 dark:text-green-300";
}
