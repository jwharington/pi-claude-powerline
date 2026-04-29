const LOW_CONTEXT_GLYPH = "◔"; // U+25D4
const MID_CONTEXT_GLYPH = "◑"; // U+25D1
const HIGH_CONTEXT_GLYPH = "◕"; // U+25D5

export function chooseContextGlyph(percent: number | undefined | null): string {
  if (typeof percent !== "number" || !Number.isFinite(percent)) {
    return LOW_CONTEXT_GLYPH;
  }

  if (percent < 34) return LOW_CONTEXT_GLYPH;
  if (percent < 67) return MID_CONTEXT_GLYPH;
  return HIGH_CONTEXT_GLYPH;
}
