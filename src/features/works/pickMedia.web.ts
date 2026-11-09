import { isPhoto, redrawPhoto } from '@/features/media/redrawPhoto';

import type { PickedFile } from './form';

export type { PickedFile } from './form';

/** The browser's file chooser, restricted to the kinds of file a work can carry. */
export const canPickMedia = true;

/** The photo and video types the Hub's `profile/work` upload folder accepts (`FOLDER_CONTENT_TYPES` in wawu-backend). */
const ACCEPT = 'image/png,image/jpeg,image/webp,video/mp4';

const extensionOf = (type: string, name: string): string => {
  const fromType = type.split('/')[1]?.split('+')[0];
  if (fromType) return fromType === 'jpeg' ? 'jpg' : fromType;
  return name.split('.').pop() ?? 'jpg';
};

/** Resolves with the chosen files, each photo written again with no Exif or GPS (`PickFailed` when one cannot be read), none when the person closes the chooser without choosing. */
export function pickMedia(): Promise<PickedFile[]> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = ACCEPT;
    input.multiple = true;
    input.onchange = () => {
      const files = Array.from(input.files ?? []);
      Promise.all(
        files.map(async (file): Promise<PickedFile> => {
          if (!isPhoto(file.type)) return { blob: file, contentType: file.type || 'image/jpeg', extension: extensionOf(file.type, file.name), previewUri: URL.createObjectURL(file) };
          const out = await redrawPhoto(file);
          return { blob: out.blob, contentType: out.contentType, extension: out.extension, previewUri: URL.createObjectURL(out.blob) };
        }),
      ).then(resolve, reject);
    };
    input.oncancel = () => resolve([]);
    input.click();
  });
}
