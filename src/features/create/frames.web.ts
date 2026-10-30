import type { ChosenFile, Frame } from './chosen';

/** The same limits as the phone's (`frames.ts`). */
const AT_SECONDS = 0.5;
const MAX_SIDE = 480;
const TIMEOUT_MS = 4000;

/**
 * One frame out of the video the person chose, drawn from the browser's own player onto a canvas, or null when the browser
 * cannot play the file (the codecs a browser has are its own), cannot read a frame, or takes longer than the phone's limit.
 * It never throws and never waits for ever.
 */
export function frameFor(file: Pick<ChosenFile, 'contentType' | 'blob'>): Promise<Frame | null> {
  if (!file.contentType.startsWith('video/')) return Promise.resolve(null);
  return new Promise((resolve) => {
    let link: string | null = null;
    const video = document.createElement('video');
    const finish = (frame: Frame | null) => {
      clearTimeout(timer);
      video.onerror = null;
      video.onloadeddata = null;
      video.onseeked = null;
      video.removeAttribute('src');
      video.load();
      if (link) URL.revokeObjectURL(link);
      resolve(frame);
    };
    const timer = setTimeout(() => finish(null), TIMEOUT_MS);
    const draw = () => {
      try {
        const { videoWidth: w, videoHeight: h } = video;
        if (!w || !h) return finish(null);
        const scale = Math.min(1, MAX_SIDE / Math.max(w, h));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(w * scale);
        canvas.height = Math.round(h * scale);
        canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((png) => finish(png ? URL.createObjectURL(png) : null), 'image/jpeg', 0.85);
      } catch {
        finish(null);
      }
    };
    try {
      link = URL.createObjectURL(file.blob);
      video.muted = true;
      video.preload = 'auto';
      video.playsInline = true;
      video.onerror = () => finish(null);
      video.onseeked = draw;
      video.onloadeddata = () => {
        const at = video.duration > 0 ? Math.min(AT_SECONDS, video.duration / 2) : AT_SECONDS;
        video.currentTime = at;
      };
      video.src = link;
    } catch {
      finish(null);
    }
  });
}
