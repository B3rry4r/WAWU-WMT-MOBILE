/**
 * How many pages a PDF says it has, read from the file itself: the largest `/Count` on a `/Type /Pages` node (the root
 * carries the total). A PDF that keeps its page tree inside a compressed object stream has no readable count, and the
 * answer is null: the screen then leaves the figure out rather than guess.
 */
export function pdfPageCount(bytes: Uint8Array): number | null {
  let text = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) text += String.fromCharCode(...bytes.subarray(i, i + chunk));
  let best = 0;
  for (const match of text.matchAll(/\/Type\s*\/Pages\b/g)) {
    const at = match.index ?? 0;
    const start = text.lastIndexOf('obj', at);
    const end = text.indexOf('endobj', at);
    const count = /\/Count\s+(\d+)/.exec(text.slice(start < 0 ? 0 : start, end < 0 ? undefined : end));
    if (count) best = Math.max(best, Number(count[1]));
  }
  return best > 0 ? best : null;
}

/** A file bigger than this is not read into memory just to count its pages. */
const READ_LIMIT = 20 * 1024 * 1024;

/** The page count of a chosen PDF, or null when it cannot be read. */
export async function pagesOf(blob: Blob): Promise<number | null> {
  if (blob.size > READ_LIMIT) return null;
  try {
    return pdfPageCount(new Uint8Array(await blob.arrayBuffer()));
  } catch {
    return null;
  }
}
