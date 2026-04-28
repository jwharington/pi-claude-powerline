export function measureFooterContentWidth(segmentWidths: number[], separatorWidth = 1): number {
  if (segmentWidths.length === 0) return 0;

  let total = 0;
  for (let i = 0; i < segmentWidths.length; i += 1) {
    total += segmentWidths[i] ?? 0;
    if (i < segmentWidths.length - 1) {
      total += separatorWidth;
    }
  }
  return total;
}
