import { isPhoto, redrawPhoto } from '@/features/media/redrawPhoto';

import type { PickedImage } from './pickImage';

export type { PickedImage } from './pickImage';

/** The browser's file chooser, restricted to pictures. */
export const canPickImage = true;

const extensionOf = (type: string, name: string): string => {
  const fromType = type.split('/')[1]?.split('+')[0];
  if (fromType) return fromType === 'jpeg' ? 'jpg' : fromType;
  return name.split('.').pop() ?? 'jpg';
};

/** Resolves with the chosen picture written again with no Exif or GPS (`PickFailed` when it cannot be read), or null when the person closes the chooser without choosing. */
export function pickImage(): Promise<PickedImage | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      if (!isPhoto(file.type)) {
        return resolve({ blob: file, contentType: file.type || 'image/jpeg', extension: extensionOf(file.type, file.name), previewUri: URL.createObjectURL(file) });
      }
      redrawPhoto(file).then(
        (out) => resolve({ blob: out.blob, contentType: out.contentType, extension: out.extension, previewUri: URL.createObjectURL(out.blob) }),
        reject,
      );
    };
    input.oncancel = () => resolve(null);
    input.click();
  });
}
