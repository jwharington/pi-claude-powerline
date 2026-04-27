export type GlyphEnv = {
  TERM_PROGRAM?: string;
  VSCODE_PID?: string;
  VSCODE_INJECTION?: string;
  POWERLINE_NERD_FONTS?: string;
};

type SegmentLike = { id: string };

export function isVscodeTerminal(env: GlyphEnv = process.env): boolean {
  return env.TERM_PROGRAM === "vscode"
    || typeof env.VSCODE_PID === "string"
    || typeof env.VSCODE_INJECTION === "string";
}

export function separatorGlyph(
  current: SegmentLike,
  next: SegmentLike,
  powerlineGlyph: string,
  env: GlyphEnv = process.env,
): string {
  if (current.id === "directory" && next.id === "directory") return "";
  if (current.id === "session" && next.id === "model") return powerlineGlyph;

  const isModelContextBoundary = (
    (current.id === "model" && next.id === "context")
    || (current.id === "context" && next.id === "model")
  );

  if (isModelContextBoundary && (isVscodeTerminal(env) || env.POWERLINE_NERD_FONTS === "0")) {
    return powerlineGlyph;
  }

  if (next.id === "model") return "◣"; // U+25E3
  if (current.id === "model") return "◤"; // U+25E4
  return powerlineGlyph;
}

export function fillBoundaryGlyph(powerlineGlyph: string, env: GlyphEnv = process.env): string {
  return isVscodeTerminal(env) || env.POWERLINE_NERD_FONTS === "0" ? powerlineGlyph : "◤";
}
