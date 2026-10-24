import { pickFile } from '@/features/create/pickFile';

import type { ChatFile } from './attachments';

/** The browser's file chooser for a chat (FIX-104, I13): a photo or video, and a file of the types the Hub's chat rule lists. */

const MEDIA_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'video/mp4', 'video/quicktime'] as const;

export function pickPhotoOrVideo(): Promise<ChatFile | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = MEDIA_TYPES.join(',');
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      resolve({ blob: file, name: file.name, contentType: file.type, previewUri: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined });
    };
    input.oncancel = () => resolve(null);
    input.click();
  });
}

export async function pickChatFile(types: readonly string[]): Promise<ChatFile | null> {
  const chosen = await pickFile(types);
  if (!chosen) return null;
  return { blob: chosen.blob, name: chosen.name, contentType: chosen.contentType, previewUri: chosen.previewUri, discard: chosen.discard };
}
