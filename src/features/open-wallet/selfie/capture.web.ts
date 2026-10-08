import { SELFIE_MAX_BASE64_CHARS } from '@/api/walletIdentity';

import { isSendableSelfie } from '../api/opening';

import { SELFIE_LONGEST_SIDE as LONGEST_SIDE, SELFIE_QUALITIES as QUALITIES } from './encoding';
import type { CaptureResult, SelfieCapture } from './types';

/**
 * A6's capture in the browser build (the web export the screens are checked
 * on, and a phone's browser). There is no live camera view here: "Take
 * selfie" opens the browser's own picker for one photo (`capture="user"`
 * asks a phone's browser for its front camera; a desktop browser offers a
 * file). Whatever is picked is drawn onto a canvas no larger than
 * `LONGEST_SIDE` and re-encoded as JPEG, stepping the quality down until it
 * fits the server's limit: the result carries nothing after the image's end
 * (the server refuses such files). Only the re-encoded copy is sent; the
 * picked file is dropped as is. The base64 lives in the returned value only.
 */

function pickPhoto(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png';
    input.setAttribute('capture', 'user');
    input.setAttribute('data-testid', 'open-wallet-selfie-picker');
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

async function reencode(file: File): Promise<string | null> {
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
    for (const quality of QUALITIES) {
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
      if (base64.length <= SELFIE_MAX_BASE64_CHARS) return isSendableSelfie(base64) ? base64 : null;
    }
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function take(): Promise<CaptureResult> {
  const file = await pickPhoto();
  if (!file) return { kind: 'cancelled' };
  const image = await reencode(file);
  return image ? { kind: 'image', image } : { kind: 'unusable' };
}

export function useSelfieCapture(): SelfieCapture {
  return { kind: 'ready', take };
}
