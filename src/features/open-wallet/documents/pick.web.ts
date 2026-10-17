import { UnreadableFile, type PickedFile } from './types';

/**
 * A26's and A27's pickers in the browser build (the web export the screens are
 * checked on, and a phone's browser): the browser's own file chooser, asked for
 * the back camera on an ID side (`capture="environment"`; a desktop browser
 * offers a file). A photo is drawn onto a canvas and written again as a JPEG,
 * which drops its Exif (no place, no time); a PDF goes as it is. Nothing is
 * kept but the bytes in the returned value.
 */
const LONGEST_SIDE = 2400;
const QUALITY = 0.9;

function chooser(accept: string, capture: boolean, testID: string): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    if (capture) input.setAttribute('capture', 'environment');
    input.setAttribute('data-testid', testID);
    input.style.display = 'none';
    const done = (file: File | null) => {
      input.remove();
      resolve(file);
    };
    input.addEventListener('change', () => done(input.files?.[0] ?? null), { once: true });
    input.addEventListener('cancel', () => done(null), { once: true });
    document.body.appendChild(input);
    input.click();
  });
}

function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = url;
  });
}

async function rewriteAsJpeg(file: File): Promise<Blob | null> {
  const url = URL.createObjectURL(file);
  try {
    const image = await loadImage(url);
    if (!image || image.naturalWidth === 0 || image.naturalHeight === 0) return null;
    const scale = Math.min(1, LONGEST_SIDE / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) return null;
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', QUALITY));
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function read(file: File, stem: string): Promise<PickedFile> {
  if (file.size === 0) throw new UnreadableFile();
  const type = file.type.toLowerCase();
  if (type === 'application/pdf') return { blob: file, contentType: type, name: file.name || `${stem}.pdf` };
  if (!type.startsWith('image/')) throw new UnreadableFile();
  const blob = await rewriteAsJpeg(file);
  if (!blob || blob.size === 0) throw new UnreadableFile();
  return { blob, contentType: 'image/jpeg', name: `${stem}.jpg` };
}

export async function pickIdPhoto(stem: string): Promise<PickedFile | null> {
  const file = await chooser('image/jpeg,image/png', true, 'open-wallet-id-picker');
  return file ? read(file, stem) : null;
}

export async function pickProofFile(stem: string): Promise<PickedFile | null> {
  const file = await chooser('application/pdf,image/jpeg,image/png', false, 'open-wallet-proof-picker');
  return file ? read(file, stem) : null;
}
