const TRAILING_ELLIPSIS_PATTERN = /\x1b\[0m(\.\.\.|…)(?:\x1b\[0m)?$/;

export function preserveTrailingEllipsisStyle(text: string): string {
  return text.replace(TRAILING_ELLIPSIS_PATTERN, "$1\x1b[0m");
}

export function colorizeTrailingEllipsis(text: string, ellipsisStyle: string): string {
  const match = text.match(/(\.\.\.|…)$/);
  if (!match) return text;
  return `${text.slice(0, -match[1].length)}${ellipsisStyle}${match[1]}`;
}
