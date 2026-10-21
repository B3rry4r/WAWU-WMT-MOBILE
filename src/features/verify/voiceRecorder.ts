import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { useCallback, useState } from 'react';

/** A take the person made: where the phone wrote it and how long it ran, in seconds. */
export type Take = { uri: string; seconds: number };

/** The microphone was refused; `canAskAgain` false means only the phone's settings can turn it on. */
export type MicRefusal = { canAskAgain: boolean };

export type VoiceRecorder = {
  recording: boolean;
  /** How long the take has run, in seconds. */
  seconds: number;
  /** Set when the phone refused the microphone: the screen says how to turn it on. Cleared on the next start. */
  refused: MicRefusal | null;
  /** Asks for the microphone (the first time), then starts. `failed` is a recorder the phone could not open. */
  start: () => Promise<'started' | 'refused' | 'failed'>;
  /** Stops and answers the take, or null when nothing was recording or the file is missing. */
  stop: () => Promise<Take | null>;
  /** Stops and lets go of the microphone without keeping a take (Redo while recording). Resolves once the recorder is released. */
  cancel: () => Promise<void>;
};

/**
 * VF9's recorder, on `expo-audio` (SHARED-CHANGES VERIFY-03 #1: the microphone text and RECORD_AUDIO). The high-quality preset writes
 * an `.m4a` the Hub takes. Nothing is uploaded here: `stop` hands the file's address to the screen.
 */
export function useVoiceRecorder(): VoiceRecorder {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const state = useAudioRecorderState(recorder, 200);
  const [refused, setRefused] = useState<MicRefusal | null>(null);

  const start = useCallback(async () => {
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setRefused({ canAskAgain: permission.canAskAgain !== false });
        return 'refused' as const;
      }
      setRefused(null);
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      return 'started' as const;
    } catch {
      return 'failed' as const;
    }
  }, [recorder]);

  const stop = useCallback(async () => {
    try {
      // The phone reports the take's length on the recorder; the browser only through its state: the longer of the two is the take.
      const seconds = Math.max(recorder.currentTime || 0, state.durationMillis / 1000);
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => undefined);
      const uri = recorder.uri;
      return uri ? { uri, seconds } : null;
    } catch {
      return null;
    }
  }, [recorder, state.durationMillis]);

  const cancel = useCallback(async () => {
    try {
      await recorder.stop();
    } catch {
      // A recorder that was not recording has nothing to let go of.
    }
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => undefined);
  }, [recorder]);

  return { recording: state.isRecording, seconds: state.durationMillis / 1000, refused, start, stop, cancel };
}
