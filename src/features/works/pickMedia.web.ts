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

/** Resolves with the chosen files (none when the person closes the chooser without choosing). */
export function pickMedia(): Promise<PickedFile[]> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = ACCEPT;
    input.multiple = true;
    input.onchange = () => {
      const files = Array.from(input.files ?? []);
      resolve(
        files.map((file) => ({
          blob: file,
          contentType: file.type || 'image/jpeg',
          extension: extensionOf(file.type, file.name),
          previewUri: URL.createObjectURL(file),
        })),
      );
    };
    input.oncancel = () => resolve([]);
    input.click();
  });
}
