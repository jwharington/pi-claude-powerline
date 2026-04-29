export function estimatePromptTokens(text: string | undefined | null): number {
  if (!text) return 0;
  return Math.max(0, Math.ceil(text.length / 4));
}

export function calculateSystemPromptRatio(systemPrompt: string | undefined | null, totalTokens: number | null | undefined): number {
  if (typeof totalTokens !== "number" || !Number.isFinite(totalTokens) || totalTokens <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(1, estimatePromptTokens(systemPrompt) / totalTokens));
}

export function describeSystemPrompt(systemPrompt: string | undefined | null): string {
  const text = (systemPrompt ?? "").replace(/\s+/g, " ").trim();
  if (!text) return "empty";

  const preview = text.slice(0, 120);
  const suffix = text.length > 120 ? "…" : "";
  return `${estimatePromptTokens(systemPrompt)}t ${preview}${suffix}`;
}
