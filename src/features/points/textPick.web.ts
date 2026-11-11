import type { PickedText } from './textPick';

export type { PickedText };

/** The browser's file chooser for a text file. */
export function pickTextFile(maxChars: number): Promise<PickedText | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,text/plain';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      const base = { name: file.name, mimeType: file.type || null };
      if (!/\.txt$/i.test(file.name) && file.type !== 'text/plain') return resolve({ ...base, text: '', tooBig: false });
      if (file.size > maxChars * 4 + 4) return resolve({ ...base, text: '', tooBig: true });
      resolve({ ...base, text: await file.text(), tooBig: false });
    };
    input.oncancel = () => resolve(null);
    input.click();
  });
}
