import { useState } from 'react';

/**
 * The first of the candidate pictures that has not failed to load, and what to call when it fails (`Image`'s `onError`): the next one is
 * then drawn, and when none is left the screen draws the kind's mark. A cover that cannot load falls back to the preview's own picture, and
 * that to the mark, so a row is never an empty box (PREVIEWS-APP, COVERS-APP). The list comes from `pictureCandidates`.
 */
export function usePicture(candidates: readonly string[]): { uri: string | null; onError: () => void } {
  const [failed, setFailed] = useState<readonly string[]>([]);
  const uri = candidates.find((c) => !failed.includes(c)) ?? null;
  return { uri, onError: () => setFailed((f) => (uri && !f.includes(uri) ? [...f, uri] : f)) };
}
