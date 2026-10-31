import { useAudioPlayer, type AudioPlayer } from 'expo-audio';
import { useVideoPlayer, VideoView, type VideoPlayer, type VideoViewProps } from 'expo-video';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';

import { pieceStartedSound } from '@/features/music/pieceSound';

import { metrics } from '../look';

import { holdContentAudio } from './audioMode';
import { bufferFor, PLAY_BUFFER, readAhead } from './buffer';
import { audioLoadState, createLoadTracker, videoLoadState } from './loadState';

import type { AudioSourceProps, LoadState, PlayerEvents, SeekRequest, VideoSurfaceProps } from './types';

export type { AudioSourceProps, LoadState, SeekRequest, VideoSurfaceProps } from './types';
export { LOAD_PATIENCE_MS } from './loadState';

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

/**
 * R-117 · the phone's own full-screen video: any rotation is allowed (the person turns the phone to fill the screen with a wide video),
 * and it is the same `VideoPlayer`, so the position and the play state go in and come back out as they were.
 */
export const FULLSCREEN: NonNullable<VideoViewProps['fullscreenOptions']> = { enable: true, orientation: 'default' };

/** Asks the view for the phone's full-screen video. The Android activity that shows it is the module's; a view that is gone has nothing to open. */
function openFullscreen(view: VideoView | null) {
  try {
    void Promise.resolve(view?.enterFullscreen()).catch(() => undefined);
  } catch {
    // A view the phone has let go of opens nothing.
  }
}

/** A tracker that reports to the newest `onLoad`, kept for the life of the component. */
function useLoadTracker(onLoad: ((state: LoadState) => void) | undefined) {
  const report = useLatest(onLoad);
  const [tracker] = useState(() => createLoadTracker((state) => report.current?.(state)));
  useEffect(() => () => tracker.idle(), [tracker]);
  return tracker;
}

/** H2 and H5: a video that fills the frame. */
export function VideoSurface({ uri, playing, seek, frosted, fullscreenAt, onTime, onEnded, onLoad, onFirstFrame, testID }: VideoSurfaceProps) {
  const player = useVideoPlayer(uri, (p) => {
    // A surface that only shows its first picture reads two seconds ahead, not the player's stock 50 (`buffer.ts`).
    p.bufferOptions = bufferFor(playing);
    p.loop = false;
    p.timeUpdateEventInterval = TICK_SECONDS;
    p.staysActiveInBackground = false;
    p.showNowPlayingNotification = false;
  });
  const events = useLatest<PlayerEvents>({ onTime, onEnded });
  const view = useRef<VideoView>(null);
  const load = useLoadTracker(onLoad);
  const asked = useLatest(playing);

  useEffect(() => {
    const report = () => events.current.onTime(player.currentTime, lengthOf(player.duration));
    const listeners = [
      player.addListener('timeUpdate', report),
      player.addListener('sourceLoad', report),
      player.addListener('statusChange', (change?: { status?: string }) => {
        report();
        // R-117: only a player that is asked to play is "waiting"; one holding its first frame is just loading quietly.
        if (asked.current) load.set(videoLoadState(change?.status ?? player.status));
      }),
      player.addListener('playToEnd', () => events.current.onEnded()),
    ];
    return () => listeners.forEach((l) => l.remove());
  }, [player, events, asked, load]);

  // R-117: the full-screen button was pressed (each press is a new number).
  const openedAt = useRef(fullscreenAt ?? 0);
  useEffect(() => {
    if (!fullscreenAt || openedAt.current === fullscreenAt) return;
    openedAt.current = fullscreenAt;
    openFullscreen(view.current);
  }, [fullscreenAt]);

  // The seek is declared before the play, so a restart from the end moves first and plays after.
  useSeekOnce(seek, (to) => moveTo(player, to));

  useEffect(() => {
    if (playing) {
      // The read widens once, when the person (or the feed) starts it; a pause afterwards keeps it.
      readAhead(player, PLAY_BUFFER);
      // R-99: a piece with sound takes the floor from the WAWU theme.
      pieceStartedSound();
      player.play();
      // R-117: a new ask to play starts from what the player says now (loading, or ready with the picture already in).
      load.begin();
      load.set(videoLoadState(player.status));
    } else {
      player.pause();
      load.idle();
    }
  }, [player, playing, load]);

  return (
    <VideoView
      ref={view}
      testID={testID}
      player={player}
      nativeControls={false}
      fullscreenOptions={FULLSCREEN}
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

/**
 * The player that is on the phone's lock screen now. The phone has ONE lock screen for the whole app, and it answers "hide" for whichever
 * player asks: on the iPhone `setActiveForLockScreen(false)` clears the one now-playing entry whoever it belongs to (`MediaController.setActivePlayer(nil)`),
 * on Android only the player that owns it clears it. A player that is let go of AFTER another took over (the feed's post under a piece page,
 * a piece that was paused a moment after the next one started) must therefore never ask to hide what is no longer its own: R-117 part D.
 */
let onLockScreen: AudioPlayer | null = null;

/** Puts this player on the lock screen (and, on Android, behind the media-playback service that keeps it going past about 3 minutes in the background). */
function showOnLockScreen(player: AudioPlayer, title: string | undefined) {
  try {
    player.setActiveForLockScreen(true, title ? { title } : undefined);
    onLockScreen = player;
  } catch {
    // A phone that will not show the controls still plays the piece.
  }
}

/** Takes this player off the lock screen, but only when it is the one on it. */
function hideFromLockScreen(player: AudioPlayer) {
  if (onLockScreen !== player) return;
  onLockScreen = null;
  try {
    player.setActiveForLockScreen(false);
  } catch {
    // A player the phone has already let go of has nothing to hide.
  }
}

/** Forgets who is on the lock screen. Tests only. */
export function resetLockScreenForTests(): void {
  onLockScreen = null;
}

/**
 * H6: the sound of an audio post. It draws nothing; the post draws the waveform and the buttons.
 *
 * R-115: this is every content player's sound (audio pieces, audiobooks, podcasts, Studio results, previews), so it plays in the
 * content audio mode (`audioMode.ts`): heard with the iPhone's silent switch on and kept going when the screen locks. The mode is
 * on the phone before `play()`, and let go of when the piece pauses, ends or goes away.
 */
export function AudioSource({ uri, playing, seek, onTime, onEnded, onLoad, title }: AudioSourceProps) {
  const player = useAudioPlayer(uri, { updateInterval: TICK_SECONDS * 1000 });
  const events = useLatest<PlayerEvents>({ onTime, onEnded });
  const lockScreenTitle = useLatest(title);
  const finished = useRef(false);
  const load = useLoadTracker(onLoad);
  const asked = useLatest(playing);

  useEffect(() => {
    finished.current = false;
    const listener = player.addListener('playbackStatusUpdate', (status) => {
      events.current.onTime(status.currentTime, lengthOf(status.duration));
      if (status.didJustFinish) {
        finished.current = true;
        events.current.onEnded();
      } else if (asked.current) {
        // R-117: still coming in, or run dry: the button shows the spinner until the sound runs.
        load.set(audioLoadState(status));
      }
    });
    return () => listener.remove();
  }, [player, events, asked, load]);

  useSeekOnce(seek, (to) => {
    finished.current = false;
    player.seekTo(to).catch(() => undefined);
  });

  useEffect(() => {
    if (!playing) {
      player.pause();
      load.idle();
      return;
    }
    // R-117: a new ask to play starts from what the player says now (its file not in yet, or already loaded).
    load.begin();
    load.set(audioLoadState(player));
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
  }, [player, playing, lockScreenTitle, load]);

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
