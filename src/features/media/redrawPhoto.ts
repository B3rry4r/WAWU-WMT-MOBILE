import { PickFailed, type ReadOptions } from '@/features/profile-edit/readPicked';

/*
 * A photo picked in a browser is drawn onto a canvas and written again before it goes anywhere (WEBAPP-04, R-127), the way the phone
 * writes every photo again (`profile-edit/readPicked.ts`, lead ruling 8 Oct 2026): the encoder writes the pixels and no metadata, so the
 * upload carries no Exif block, no GPS, no time and no camera details. Same kinds as the phone: a PNG stays a PNG and a WebP a WebP (a
 * browser that cannot write WebP gets a JPEG), a GIF becomes a PNG of its first frame, a JPEG, a HEIC or anything else becomes a JPEG at 0.9.
 * The browser turns the picture the way the camera held it before it is drawn, so it still stands upright. A photo the browser cannot read
 * throws `PickFailed`, as on the phone, and is never sent as it was. A video, a PDF or any other file is not touched.
 */
const QUALITY = 0.9;

/** The type a photo of `type` goes up as. */
export function redrawnType(type: string): 'image/png' | 'image/webp' | 'image/jpeg' {
  switch (type.toLowerCase()) {
    case 'image/png':
    case 'image/gif':
      return 'image/png';
    case 'image/webp':
      return 'image/webp';
    default:
      return 'image/jpeg';
  }
}

export const isPhoto = (type: string): boolean => type.toLowerCase().startsWith('image/') && !type.toLowerCase().startsWith('image/svg');

function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = url;
  });
}

export type Redrawn = { blob: Blob; contentType: string; extension: string };

const extensionOf = (type: string): string => (type === 'image/jpeg' ? 'jpg' : (type.split('/')[1] ?? 'jpg'));

/** The photo written again with no metadata, or `PickFailed`. `options` are the phone's (`maxSide`, `jpeg`, `quality`). */
export async function redrawPhoto(file: Blob, options: ReadOptions = {}): Promise<Redrawn> {
  if (file.size === 0) throw new PickFailed();
  const wanted = options.jpeg ? 'image/jpeg' : redrawnType(file.type);
  const url = URL.createObjectURL(file);
  try {
    const image = await loadImage(url);
    if (!image || image.naturalWidth === 0 || image.naturalHeight === 0) throw new PickFailed();
    const longest = Math.max(image.naturalWidth, image.naturalHeight);
    const scale = options.maxSide && options.maxSide > 0 ? Math.min(1, options.maxSide / longest) : 1;
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new PickFailed();
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const quality = wanted === 'image/png' ? undefined : (options.quality ?? QUALITY);
    let blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, wanted, quality));
    // A browser that cannot write the kind asked for (WebP in Safari) hands back a PNG: a JPEG is the safe answer for a photo.
    if (blob && wanted === 'image/webp' && blob.type !== 'image/webp') blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', QUALITY));
    if (!blob || blob.size === 0) throw new PickFailed();
    const contentType = blob.type || wanted;
    return { blob, contentType, extension: extensionOf(contentType) };
  } finally {
    URL.revokeObjectURL(url);
  }
}
