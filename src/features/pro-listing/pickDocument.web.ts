import type { PickedDocument } from './pickDocument';

export type { PickedDocument } from './pickDocument';

/** The browser's file chooser, restricted to what `professional/document` takes. */
export const canPickDocument = true;

const TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];
const EXTENSIONS: Record<string, string> = { 'application/pdf': 'pdf', 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };

/** Resolves with the chosen file, or null when the person closes the chooser without choosing. */
export function pickDocument(): Promise<PickedDocument | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = TYPES.join(',');
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      const contentType = TYPES.includes(file.type) ? file.type : 'application/pdf';
      resolve({ blob: file, name: file.name, contentType, extension: EXTENSIONS[contentType] ?? 'pdf' });
    };
    input.oncancel = () => resolve(null);
    input.click();
  });
}
