/**
 * The browser's side of "Download" (POINTS-13): the Hub's link is an attachment link, so opening it saves the file. There is no
 * progress to report and nothing to stop; the phone's file, photos and share sheet parts are `resultDownload.ts`.
 */
export type DownloadFile = { url: string; name: string; contentType: string };
export type DownloadOutcome = 'saved' | 'shared' | 'denied' | 'cancelled' | 'started';
export type DownloadOptions = { onProgress?: (share: number | null) => void; signal?: AbortSignal };

export async function downloadResult(file: DownloadFile): Promise<DownloadOutcome> {
  const link = globalThis.document?.createElement('a');
  if (!link) throw new Error('This browser cannot download.');
  link.href = file.url;
  link.download = file.name;
  link.rel = 'noopener';
  link.click();
  return 'started';
}
