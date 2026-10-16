import type { ChosenFile } from './chosen';
import { contentTypeFor, extensionOfName } from './fileTypes';

/** The browser's file chooser, restricted to the types the Hub lists for the step. */
export const canPickFile = true;

/** Resolves with the chosen file (null when the person closes the chooser without choosing). */
export function pickFile(types: readonly string[]): Promise<ChosenFile | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = types.join(',');
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      const contentType = contentTypeFor(file.name, file.type);
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
