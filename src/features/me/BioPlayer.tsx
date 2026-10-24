import { useCallback, useEffect, useState } from 'react';

import { VoicePlayer, type VoicePlayerStatus } from '@/components/VoicePlayer';
import { AudioSource, type SeekRequest } from '@/features/feed/player';

/**
 * How long a tap on Play waits for the clip to come in before the player says it could not play it. The audio player reports
 * nothing when a file cannot be fetched (it only reports a length once the file is in), so a clip that never reports one in this
 * time is the failed case. A pacing figure, not a product figure.
 */
export const BIO_LOAD_PATIENCE_MS = 15000;

export type BioPlayerProps = {
  /** The Hub's link to the Voice Intro (`audioUrl` on my own, `url` on a listener's read). */
  url: string;
  /** The Hub marks the audio as an AI voice (R-66): the player draws the small "AI voice" tag beside "Bio". */
  aiVoice: boolean;
  /** False while another screen or tab is in front: the clip stops, and does not start again by itself when this one returns. */
  active?: boolean;
  testID?: string;
};

/**
 * The Bio player on a profile (M1, M5; R-66): the shared `VoicePlayer` pill with "Bio" and the "AI voice" tag, and the audio under it.
 * It reads the clip's length as soon as it is drawn (so the clock shows it before Play), plays on Play, pauses where it is, and goes
 * back to the start when the clip ends. A clip that does not come in after Play shows the player's own "Couldn't play this" row, and a
 * tap on it asks for the clip again.
 */
export function BioPlayer({ url, aiVoice, active = true, testID }: BioPlayerProps) {
  const [wantsPlay, setWantsPlay] = useState(false);
  const [position, setPosition] = useState(0);
  const [length, setLength] = useState(0);
  const [seek, setSeek] = useState<SeekRequest>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [wasActive, setWasActive] = useState(active);

  // Another screen came in front: stop, so the voice does not carry on under it and does not start again on return.
  if (active !== wasActive) {
    setWasActive(active);
    if (!active) setWantsPlay(false);
  }

  const onTime = useCallback((at: number, total: number) => {
    setPosition(at);
    setLength(total);
  }, []);
  const onEnded = useCallback(() => {
    setWantsPlay(false);
    setPosition(0);
    setSeek({ to: 0, at: Date.now() });
  }, []);

  const status: VoicePlayerStatus = failed ? 'error' : !wantsPlay ? 'idle' : length > 0 ? 'playing' : 'loading';

  useEffect(() => {
    if (status !== 'loading') return;
    const timer = setTimeout(() => setFailed(true), BIO_LOAD_PATIENCE_MS);
    return () => clearTimeout(timer);
  }, [status]);

  const toggle = () => {
    if (failed) {
      // Ask for the clip again: a new audio source for the same link, and play when it is in.
      setFailed(false);
      setAttempt((n) => n + 1);
      setWantsPlay(true);
      return;
    }
    setWantsPlay((on) => !on);
  };

  return (
    <>
      <AudioSource key={attempt} uri={url} playing={wantsPlay && active && !failed} seek={seek} onTime={onTime} onEnded={onEnded} />
      <VoicePlayer
        testID={testID}
        status={status}
        progress={length > 0 ? position / length : 0}
        durationSeconds={length}
        aiVoice={aiVoice}
        onToggle={toggle}
      />
    </>
  );
}
