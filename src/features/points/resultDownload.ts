import { File, Paths } from 'expo-file-system';
import { Asset, requestPermissionsAsync } from 'expo-media-library';
import * as Sharing from 'expo-sharing';

/**
 * The phone's side of a Studio result's quiet "Download" (POINTS-13, R-109): the Hub's attachment link is fetched to the app's cache
 * (`expo-file-system`, with progress and a signal that stops it), then a picture or a video is saved to the phone's photos
 * (`expo-media-library`, permission asked once) and audio goes to the share sheet (`expo-sharing`, "Save to Files"). Nothing new is
 * installed. The web build (`resultDownload.web.ts`) hands the link to the browser.
 */
export type DownloadFile = { url: string; name: string; contentType: string };
export type DownloadOutcome = 'saved' | 'shared' | 'denied' | 'cancelled' | 'started';
export type DownloadOptions = { onProgress?: (share: number | null) => void; signal?: AbortSignal };

const isPhotoKind = (contentType: string): boolean => contentType.startsWith('image/') || contentType.startsWith('video/');
/** A name safe to write in the cache: letters, digits, dot, dash and underscore. */
const safeName = (name: string): string => name.replace(/[^A-Za-z0-9._-]+/g, '-').slice(0, 80) || 'result';

export async function downloadResult(file: DownloadFile, options: DownloadOptions = {}): Promise<DownloadOutcome> {
  const target = new File(Paths.cache, safeName(file.name));
  try {
    await File.downloadFileAsync(file.url, target, {
      idempotent: true,
      signal: options.signal,
      onProgress: (p) => options.onProgress?.(p.totalBytes > 0 ? Math.min(1, p.bytesWritten / p.totalBytes) : null),
    });
  } catch (error) {
    // A stopped download leaves a part of a file: it goes.
    try {
      target.delete();
    } catch {
      // Nothing was written.
    }
    if (options.signal?.aborted) return 'cancelled';
    throw error;
  }
  if (isPhotoKind(file.contentType)) {
    try {
      const permission = await requestPermissionsAsync(true);
      if (!permission.granted) return 'denied';
      await Asset.create(target.uri);
      return 'saved';
    } finally {
      // The photos hold their own copy once it is saved; the cache keeps nothing.
      try {
        target.delete();
      } catch {
        // Already gone.
      }
    }
  }
  if (!(await Sharing.isAvailableAsync())) throw new Error('This phone has no share sheet.');
  await Sharing.shareAsync(target.uri, { mimeType: file.contentType, dialogTitle: 'Save to Files' });
  return 'shared';
}
