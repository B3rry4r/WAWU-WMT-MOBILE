import { abandonDraft, getDraft, setFormat, setFull, setSmallCopy } from '@/features/create/draft';
import { setDetails } from '@/features/create/details';
import { smallCopyOf } from '@/features/create/previewCopy';

import type { AiPiece } from './mediaToolApi';

/**
 * Puts a Studio result into Create as a piece (POINTS-13, R-109): the format chosen, the file already in the draft as an upload of the
 * person's own, and the details step's title prefilled from the Hub's suggestion. Create's preview step (M22) is next; its tier and place
 * gates are Create's own and stay. Whatever draft was open is given back first (a new piece starts a fresh draft, as the Content tile does).
 */
export function putPieceInDraft(piece: AiPiece, previewUri?: string): void {
  abandonDraft();
  setFormat(piece.format);
  setFull({ name: piece.full.name, bytes: piece.full.bytes, contentType: piece.full.contentType, key: piece.full.key, fileUrl: piece.full.fileUrl, ...(previewUri && piece.format === 'image' ? { previewUri } : {}) });
  if (piece.suggestedTitle) setDetails({ title: piece.suggestedTitle });
}

/**
 * R-118: a PAID picture piece is previewed by a smaller copy the phone makes of the picture, held in the draft until Send uploads it (Create's
 * upload step makes it when the person chooses the file). A Studio picture arrives already up, so the copy is made here from its link, after the
 * draft holds it. If the draft has moved on to another piece meanwhile the copy is dropped; if the phone cannot make it the draft holds none
 * and Create's own sentence (`COPY_GONE`) is what a paid Send says. A free picture needs none.
 */
export async function holdPictureCopy(piece: AiPiece, from: string = piece.full.fileUrl): Promise<void> {
  if (piece.format !== 'image') return;
  const copy = await smallCopyOf({ previewUri: from });
  if (!copy) return;
  if (!draftHolds(piece.full.key)) {
    copy.discard?.();
    return;
  }
  setSmallCopy(copy);
}

/** True when the draft already holds this very upload (the person came back from Create to the result and tapped again): there is nothing to copy twice. */
export const draftHolds = (key: string): boolean => getDraft().full?.key === key;

/** Which upload each result's piece made, so tapping "Make it a piece" again after Back from Create opens the same file and does not copy it twice. */
const made = new Map<string, string>();
export const rememberPiece = (jobId: string, outputIndex: number, key: string): void => void made.set(`${jobId}:${outputIndex}`, key);
/** The key of the piece this result already made, while the draft still holds it; otherwise null. */
export function heldPiece(jobId: string, outputIndex: number): string | null {
  const key = made.get(`${jobId}:${outputIndex}`);
  return key && draftHolds(key) ? key : null;
}
