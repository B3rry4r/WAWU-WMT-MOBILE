const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] as const;

/**
 * "Updated 1 September 2026" from the date the owner gave the text (`2026-09-01`).
 * Written out here, not with `Intl`, so every phone and the web say it the same way.
 * Null when the date is not one.
 */
export function updatedLine(isoDate: string | null): string | null {
  const match = isoDate ? /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate) : null;
  if (!match) return null;
  const month = MONTHS[Number(match[2]) - 1];
  const day = Number(match[3]);
  if (!month || day < 1 || day > 31) return null;
  return `Updated ${day} ${month} ${match[1]}`;
}

/** The owner's text with its paragraphs: a blank line starts a new one. */
export function paragraphsOf(body: string): string[] {
  return body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}
