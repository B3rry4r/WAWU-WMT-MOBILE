import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import type { ChosenFile } from '@/features/create/chosen';
import { useVoiceRecorder, type MicRefusal, type Take } from '@/features/verify/voiceRecorder';

/**
 * The microphone for a Studio tool that takes the person's own voice (Voice changer, Clone your own voice: POINTS-16), on the same recorder
 * the Voice Intro uses. On top of it: a take that reaches the tool's longest stops itself, and a take that is cut short by the phone
 * (the app goes to the background, a call comes in) is stopped and KEPT, never lost, and said so. Nothing is uploaded here.
 */
export type TakeRecorder = {
  recording: boolean;
  seconds: number;
  refused: MicRefusal | null;
  failed: boolean;
  /** The take that was cut short by the phone, until the person records again or keeps it. */
  interrupted: boolean;
  take: Take | null;
  start: () => Promise<boolean>;
  stop: () => Promise<Take | null>;
  clear: () => void;
};

export function useTakeRecorder(maxSeconds?: number): TakeRecorder {
  const rec = useVoiceRecorder();
  const [take, setTake] = useState<Take | null>(null);
  const [failed, setFailed] = useState(false);
  const [interrupted, setInterrupted] = useState(false);
  const stopping = useRef(false);
  const recordingRef = useRef(false);
  useEffect(() => {
    recordingRef.current = rec.recording;
  }, [rec.recording]);

  const stopAndKeep = useCallback(
    async (cut: boolean) => {
      if (stopping.current) return null;
      stopping.current = true;
      try {
        const got = await rec.stop();
        if (!got) {
          setFailed(true);
          return null;
        }
        const kept = { ...got, seconds: maxSeconds ? Math.min(got.seconds, maxSeconds) : got.seconds };
        setTake(kept);
        setInterrupted(cut);
        return kept;
      } finally {
        stopping.current = false;
      }
    },
    [rec, maxSeconds],
  );

  const start = useCallback(async () => {
    setFailed(false);
    setInterrupted(false);
    setTake(null);
    const started = await rec.start();
    if (started === 'failed') setFailed(true);
    return started === 'started';
  }, [rec]);

  // A phone call or the app going away ends the take where it is. The take is kept.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if ((state === 'background' || state === 'inactive') && recordingRef.current) void stopAndKeep(true);
    });
    return () => sub.remove();
  }, [stopAndKeep]);

  // A take that reaches the longest stops itself.
  useEffect(() => {
    if (!rec.recording || !maxSeconds || rec.seconds < maxSeconds) return undefined;
    const id = setTimeout(() => void stopAndKeep(false), 0);
    return () => clearTimeout(id);
  }, [rec.recording, rec.seconds, maxSeconds, stopAndKeep]);

  return {
    recording: rec.recording,
    seconds: rec.seconds,
    refused: rec.refused,
    failed,
    interrupted,
    take,
    start,
    stop: () => stopAndKeep(false),
    clear: () => {
      setTake(null);
      setInterrupted(false);
      setFailed(false);
    },
  };
}

/** The take as a file the upload takes: the phone wrote an `.m4a`. */
export async function takeToFile(take: Take): Promise<ChosenFile> {
  const blob = await (await fetch(take.uri)).blob();
  return { blob, name: 'recording.m4a', contentType: 'audio/mp4', extension: 'm4a', seconds: take.seconds };
}

/** "0:07": the clock of a take. */
export const takeClock = (seconds: number): string => `${Math.floor(Math.max(0, seconds) / 60)}:${String(Math.floor(Math.max(0, seconds) % 60)).padStart(2, '0')}`;
