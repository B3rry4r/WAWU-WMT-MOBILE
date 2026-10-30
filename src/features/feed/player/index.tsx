import { useAudioPlayer, type AudioPlayer } from 'expo-audio';
import { useVideoPlayer, VideoView, type VideoPlayer } from 'expo-video';
import { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';

import { pieceStartedSound } from '@/features/music/pieceSound';

import { metrics } from '../look';

import { holdContentAudio } from './audioMode';
import { bufferFor, PLAY_BUFFER, readAhead } from './buffer';

import type { AudioSourceProps, PlayerEvents, SeekRequest, VideoSurfaceProps } from './types';

export type { AudioSourceProps, SeekRequest, VideoSurfaceProps } from './types';

/** The phone plays through `expo-video` and `expo-audio` (SHARED-CHANGES HOME-02 #2, installed by SHARED-04). */
export const canPlay = true;
export { FRAME_BUFFER, PLAY_BUFFER } from './buffer';

/** Seconds between the position reports; the scrubber and the clock follow them. */
const TICK_SECONDS = 0.25;

/** A length the player has not read yet is 0, as the web build reports it. */
function lengthOf(value: number | undefined | null): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0;
}

/** The newest handlers, read by the listeners, so a new closure each render does not re-subscribe. */
function useLatest<T>(value: T) {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  });
  return ref;
}

/**
 * A seek is applied once. A new player for a new file (or a render with the same request) must not
 * jump back to an old position, so the request is remembered by its `at`.
 */
function useSeekOnce(seek: SeekRequest, apply: (to: number) => void) {
  const done = useRef<number | null>(null);
  useEffect(() => {
    if (!seek || done.current === seek.at) return;
    done.current = seek.at;
    apply(seek.to);
  }, [seek, apply]);
}

/** The player's own position, written outside the component (a hook's value is not changed in render code). */
function moveTo(player: VideoPlayer, to: number) {
  player.currentTime = to;
}

/** H2 and H5: a video that fills the frame. */
export function VideoSurface({ uri, playing, seek, frosted, onTime, onEnded, onFirstFrame, testID }: VideoSurfaceProps) {
  const player = useVideoPlayer(uri, (p) => {
    // A surface that only shows its first picture reads two seconds ahead, not the player's stock 50 (`buffer.ts`).
    p.bufferOptions = bufferFor(playing);
    p.loop = false;
    p.timeUpdateEventInterval = TICK_SECONDS;
    p.staysActiveInBackground = false;
    p.showNowPlayingNotification = false;
  });
  const events = useLatest<PlayerEvents>({ onTime, onEnded });

  useEffect(() => {
    const report = () => events.current.onTime(player.currentTime, lengthOf(player.duration));
    const listeners = [
      player.addListener('timeUpdate', report),
      player.addListener('sourceLoad', report),
      player.addListener('statusChange', report),
      player.addListener('playToEnd', () => events.current.onEnded()),
    ];
    return () => listeners.forEach((l) => l.remove());
  }, [player, events]);

  // The seek is declared before the play, so a restart from the end moves first and plays after.
  useSeekOnce(seek, (to) => moveTo(player, to));

  useEffect(() => {
    if (playing) {
      // The read widens once, when the person (or the feed) starts it; a pause afterwards keeps it.
      readAhead(player, PLAY_BUFFER);
      // R-99: a piece with sound takes the floor from the WAWU theme.
      pieceStartedSound();
      player.play();
    } else player.pause();
  }, [player, playing]);

  return (
    <VideoView
      testID={testID}
      player={player}
      nativeControls={false}
      contentFit="cover"
      allowsPictureInPicture={false}
      playsInline
      onFirstFrameRender={onFirstFrame}
      // A texture view, not the default surface: it can be blurred and scaled, and it sits in a paged list.
      surfaceType="textureView"
      style={frosted ? [styles.fill, styles.frost] : styles.fill}
    />
  );
}

/** Puts this player on the lock screen (and, on Android, behind the media-playback service that keeps it going past about 3 minutes in the background). */
function showOnLockScreen(player: AudioPlayer, title: string | undefined) {
  try {
    player.setActiveForLockScreen(true, title ? { title } : undefined);
  } catch {
    // A phone that will not show the controls still plays the piece.
  }
}

function hideFromLockScreen(player: AudioPlayer) {
  try {
    player.setActiveForLockScreen(false);
  } catch {
    // A player the phone has already let go of has nothing to hide.
  }
}

/**
 * H6: the sound of an audio post. It draws nothing; the post draws the waveform and the buttons.
 *
 * R-115: this is every content player's sound (audio pieces, audiobooks, podcasts, Studio results, previews), so it plays in the
 * content audio mode (`audioMode.ts`): heard with the iPhone's silent switch on and kept going when the screen locks. The mode is
 * on the phone before `play()`, and let go of when the piece pauses, ends or goes away.
 */
export function AudioSource({ uri, playing, seek, onTime, onEnded, title }: AudioSourceProps) {
  const player = useAudioPlayer(uri, { updateInterval: TICK_SECONDS * 1000 });
  const events = useLatest<PlayerEvents>({ onTime, onEnded });
  const lockScreenTitle = useLatest(title);
  const finished = useRef(false);

  useEffect(() => {
    finished.current = false;
    const listener = player.addListener('playbackStatusUpdate', (status) => {
      events.current.onTime(status.currentTime, lengthOf(status.duration));
      if (status.didJustFinish) {
        finished.current = true;
        events.current.onEnded();
      }
    });
    return () => listener.remove();
  }, [player, events]);

  useSeekOnce(seek, (to) => {
    finished.current = false;
    player.seekTo(to).catch(() => undefined);
  });

  useEffect(() => {
    if (!playing) {
      player.pause();
      return;
    }
    // R-99: a piece with sound takes the floor from the WAWU theme.
    pieceStartedSound();
    // R-115: the content mode goes on the phone first; a piece that was stopped meanwhile never starts.
    // Only a piece with a title stays on in the background and shows on the lock screen; a short voice clip stops on background.
    const named = Boolean(lockScreenTitle.current);
    const content = holdContentAudio(named);
    let live = true;
    void content.ready.then(() => {
      if (!live) return;
      if (named) showOnLockScreen(player, lockScreenTitle.current);
      // A file that played to its end starts again from the top, whatever the phone's player does at the end.
      if (finished.current) {
        finished.current = false;
        player
          .seekTo(0)
          .catch(() => undefined)
          .finally(() => player.play());
        return;
      }
      player.play();
    });
    return () => {
      live = false;
      if (named) hideFromLockScreen(player);
      content.release();
    };
  }, [player, playing, lockScreenTitle]);

  return null;
}

/**
 * Waveform peaks need the decoded file. The phone has no decoder for it (BACKEND_GAPS G-217: the Hub
 * serves no peaks), so the bars stay level there and fill as the audio plays.
 */
export async function loadPeaks(_uri: string, _bars: number): Promise<number[] | null> {
  return null;
}

const styles = StyleSheet.create({
  fill: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  // H5: the frame frosts and grows past the edges so the blur has no rim (the web build does the same).
  frost: { filter: [{ blur: metrics.backdropBlur }], transform: [{ scale: 1.15 }] },
});
