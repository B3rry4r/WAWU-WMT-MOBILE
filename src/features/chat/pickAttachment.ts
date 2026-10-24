import { launchImageLibraryAsync } from 'expo-image-picker';

import { pickFile } from '@/features/create/pickFile';
import { isVideoAsset, readPicked } from '@/features/profile-edit/readPicked';

import type { ChatFile } from './attachments';

/**
 * The phone's pickers for a chat (FIX-104, I13), with the modules the app already ships (`expo-image-picker`, `expo-document-picker`).
 * Both resolve with null when the person closes the picker without choosing, and reject when the picker fails or the file cannot be
 * read. The web build (`pickAttachment.web.ts`) opens the browser's chooser.
 */

/** One photo or video from the library. A photo is written again without where it was taken (the lead's 8 Oct ruling, `readPicked`); a video goes as chosen. */
export async function pickPhotoOrVideo(): Promise<ChatFile | null> {
  const result = await launchImageLibraryAsync({ mediaTypes: ['images', 'videos'], allowsMultipleSelection: false });
  const asset = result.canceled ? undefined : result.assets?.[0];
  if (!asset) return null;
  const picked = await readPicked(asset);
  const name = asset.fileName ?? `${isVideoAsset(asset) ? 'video' : 'photo'}.${picked.extension}`;
  return { blob: picked.blob, name, contentType: picked.contentType, previewUri: picked.previewUri, discard: picked.discard };
}

/** One file, of the types the Hub's chat rule lists (`GET /chats/attachment-rules`). */
export async function pickChatFile(types: readonly string[]): Promise<ChatFile | null> {
  const chosen = await pickFile(types);
  if (!chosen) return null;
  return { blob: chosen.blob, name: chosen.name, contentType: chosen.contentType, previewUri: chosen.previewUri, discard: chosen.discard };
}
