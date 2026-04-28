export type FooterSessionCandidate = {
  text: string;
  width: number;
};

export function chooseSessionNameForFooter(
  candidates: FooterSessionCandidate[],
  footerContentWidth: number,
  availableWidth: number,
  separatorWidth: number,
): string {
  if (candidates.length === 0) return "";

  for (const candidate of candidates) {
    const remainingWidth = availableWidth - candidate.width - separatorWidth;
    if (remainingWidth >= footerContentWidth) {
      return candidate.text;
    }
  }

  return candidates[candidates.length - 1]!.text;
}
