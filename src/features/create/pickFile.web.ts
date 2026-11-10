import { isPhoto, redrawPhoto } from '@/features/media/redrawPhoto';
import type { ReadOptions } from '@/features/profile-edit/readPicked';

import type { ChosenFile } from './chosen';
import { contentTypeFor, extensionOfName } from './fileTypes';

/** The browser's file chooser, restricted to the types the Hub lists for the step. */
export const canPickFile = true;

/** Resolves with the chosen file (null when the person closes the chooser without choosing). A photo is written again with no Exif or GPS, as on the phone (`options` are how); any other file goes as it is. */
export function pickFile(types: readonly string[], options?: ReadOptions): Promise<ChosenFile | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = types.join(',');
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      const contentType = contentTypeFor(file.name, file.type);
      if (isPhoto(contentType)) {
        redrawPhoto(file, options).then((out) => {
          const stem = file.name.replace(/\.[^.]*$/, '') || 'photo';
          resolve({ blob: out.blob, name: `${stem}.${out.extension}`, contentType: out.contentType, extension: out.extension, previewUri: URL.createObjectURL(out.blob) });
        }, reject);
        return;
      }
      resolve({
        blob: file,
        name: file.name,
        contentType,
        extension: extensionOfName(file.name),
        previewUri: contentType.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      });
    };
    input.oncancel = () => resolve(null);
    input.click();
  });
}
