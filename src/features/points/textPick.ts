import { getDocumentAsync } from 'expo-document-picker';

/** A plain text file the person chose for the Audiobook (POINTS-18): its words are read on the phone and fill the box; the file itself is never sent. */
export type PickedText = { name: string; mimeType: string | null; text: string; /** True when the file is bigger than any text the Hub takes: it is not read. */ tooBig: boolean };

const looksLikeText = (name: string, mimeType: string | null | undefined): boolean => /\.txt$/i.test(name) || (mimeType ?? '').toLowerCase() === 'text/plain';

/**
 * Opens the phone's document picker for a text file. A file that is not text is handed back unread (so the screen says why), and so is one far
 * over `maxChars` (a UTF-8 character is at most four bytes): the Hub's own count is made on the words.
 */
export async function pickTextFile(maxChars: number): Promise<PickedText | null> {
  const result = await getDocumentAsync({ type: ['text/plain'], copyToCacheDirectory: true, multiple: false });
  const asset = result.canceled ? undefined : result.assets?.[0];
  if (!asset) return null;
  const base = { name: asset.name, mimeType: asset.mimeType ?? null };
  if (!looksLikeText(asset.name, asset.mimeType)) return { ...base, text: '', tooBig: false };
  if (typeof asset.size === 'number' && asset.size > maxChars * 4 + 4) return { ...base, text: '', tooBig: true };
  const text = await (await fetch(asset.uri)).text();
  return { ...base, text, tooBig: false };
}
