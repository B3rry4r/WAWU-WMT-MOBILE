import { useEffect, useRef, type CSSProperties } from 'react';

import { pieceStartedSound } from '@/features/music/pieceSound';

import { metrics } from '../look';
import { peaksFrom } from '../model';

import type { AudioSourceProps, PlayerEvents, VideoSurfaceProps } from './types';

export type { AudioSourceProps, SeekRequest, VideoSurfaceProps } from './types';
export { FRAME_BUFFER, PLAY_BUFFER } from './buffer';

/** The web build plays through the browser's own `<video>` and `<audio>`. */
export const canPlay = true;

type Media = HTMLMediaElement;

/**
 * Plays when asked. A browser refuses sound before the person has touched the page; then
 * the post plays muted rather than not at all, as feeds do.
 */
function usePlayback(ref: { current: Media | null }, playing: boolean, uri: string) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!playing) {
      el.pause();
      return;
    }
    // R-99: a piece with sound takes the floor from the WAWU theme.
    pieceStartedSound();
    el.play().catch(() => {
      el.muted = true;
      el.play().catch(() => undefined);
    });
  }, [ref, playing, uri]);
}

function useEvents(ref: { current: Media | null }, { onTime, onEnded }: PlayerEvents) {
  const handlers = useRef({ onTime, onEnded });
  useEffect(() => {
    handlers.current = { onTime, onEnded };
  });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const time = () => handlers.current.onTime(el.currentTime, Number.isFinite(el.duration) ? el.duration : 0);
    const ended = () => handlers.current.onEnded();
    el.addEventListener('timeupdate', time);
    el.addEventListener('loadedmetadata', time);
    el.addEventListener('durationchange', time);
    el.addEventListener('ended', ended);
    return () => {
      el.removeEventListener('timeupdate', time);
      el.removeEventListener('loadedmetadata', time);
      el.removeEventListener('durationchange', time);
      el.removeEventListener('ended', ended);
    };
  }, [ref]);
}

function useSeek(ref: { current: Media | null }, seek: VideoSurfaceProps['seek']) {
  useEffect(() => {
    const el = ref.current;
    if (el && seek) el.currentTime = seek.to;
  }, [ref, seek]);
}

const fill: CSSProperties = { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' };
/** H5: the frame frosts, and grows past the edges so the blur has no rim. */
const frost: CSSProperties = { filter: `blur(${metrics.backdropBlur}px)`, transform: 'scale(1.15)' };

export function VideoSurface({ uri, playing, seek, frosted, onTime, onEnded, onFirstFrame, testID }: VideoSurfaceProps) {
  const ref = useRef<HTMLVideoElement>(null);
  usePlayback(ref, playing, uri);
  useEvents(ref, { onTime, onEnded });
  useSeek(ref, seek);
  return (
    <video
      ref={ref}
      src={uri}
      data-testid={testID}
      playsInline
      preload="metadata"
      onLoadedData={onFirstFrame}
      style={frosted ? { ...fill, ...frost } : fill}
    />
  );
}

export function AudioSource({ uri, playing, seek, onTime, onEnded, testID }: AudioSourceProps) {
  const ref = useRef<HTMLAudioElement>(null);
  usePlayback(ref, playing, uri);
  useEvents(ref, { onTime, onEnded });
  useSeek(ref, seek);
  return <audio ref={ref} src={uri} data-testid={testID} preload="metadata" />;
}

/** H6's waveform from the file itself: decoded in the browser, the loudest sample per bar. */
export async function loadPeaks(uri: string, bars: number): Promise<number[] | null> {
  const Context = globalThis.AudioContext;
  if (!Context) return null;
  try {
    const response = await fetch(uri);
    if (!response.ok) return null;
    const context = new Context();
    try {
      const decoded = await context.decodeAudioData(await response.arrayBuffer());
      return peaksFrom(decoded.getChannelData(0), bars);
    } finally {
      context.close().catch(() => undefined);
    }
  } catch {
    return null;
  }
}
