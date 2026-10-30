import { getDocumentAsync } from 'expo-document-picker';
import { launchImageLibraryAsync } from 'expo-image-picker';

import { readPicked } from '@/features/profile-edit/readPicked';

import type { ChosenFile } from './chosen';
import { contentTypeFor, extensionOfName } from './fileTypes';

/** The phone opens its photo library for pictures and videos and its files for everything else. The web build (`pickFile.web.ts`) opens the browser's chooser. */
export const canPickFile = true;

const allOf = (types: readonly string[], prefix: string) => types.length > 0 && types.every((t) => t.startsWith(prefix));

/**
 * Resolves with the chosen file, or null when the person closes the picker without choosing. `types` is the Hub's list for
 * the step (`GET /uploads/formats`). A photo is written again without where it was taken (`readPicked`, the lead's 8 Oct
 * ruling); a video and any other file go as chosen. Rejects when the picker fails or the file cannot be read.
 */
export async function pickFile(types: readonly string[]): Promise<ChosenFile | null> {
  if (allOf(types, 'image/') || allOf(types, 'video/')) {
    const result = await launchImageLibraryAsync({ mediaTypes: allOf(types, 'image/') ? 'images' : 'videos' });
    const asset = result.canceled ? undefined : result.assets?.[0];
    if (!asset) return null;
    const picked = await readPicked(asset);
    const name = asset.fileName ?? `${allOf(types, 'image/') ? 'photo' : 'video'}.${picked.extension}`;
    const seconds = typeof asset.duration === 'number' && asset.duration > 0 ? asset.duration / 1000 : undefined;
    return { blob: picked.blob, name, contentType: picked.contentType, extension: picked.extension, previewUri: picked.previewUri, ...(seconds ? { seconds } : {}), discard: picked.discard };
  }
  const result = await getDocumentAsync({ type: [...types], copyToCacheDirectory: true, multiple: false });
  const asset = result.canceled ? undefined : result.assets?.[0];
  if (!asset) return null;
  const blob = await (await fetch(asset.uri)).blob();
  const contentType = contentTypeFor(asset.name, asset.mimeType);
  return { blob, name: asset.name, contentType, extension: extensionOfName(asset.name), previewUri: contentType.startsWith('image/') ? asset.uri : undefined };
}
