/** The browser has no share sheet for a file, so the web build draws no "Share subtitles" row (as `tgif/cardFile.web.ts` draws no Story). */
export async function canShareSubtitles(): Promise<boolean> {
  return false;
}

export async function shareSubtitles(): Promise<void> {
  throw new Error('no share sheet on the web');
}
