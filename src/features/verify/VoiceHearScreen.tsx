import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Avatar, type AvatarHue } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Text } from '@/components/Text';
import { VoiceLabel, VoicePlayer } from '@/components/VoicePlayer';
import { AudioSource, type SeekRequest } from '@/features/feed/player';
import { space } from '@/theme';

import { ShopFrame } from './parts';

/** design/_gen/verify.js `vf11`: the avatar is 96 and sits 30 down, 14 above its label; the body's parts are 18 apart; the words are 14.5 on a 1.55 line. */
const board = { avatar: 96, top: 30, headGap: 14, bodyGap: 18, words: 14.5, leading: 1.55, pairGap: 8 } as const;

export type VoiceHearScreenProps = {
  /** The person, for the avatar. */
  name: string;
  hue: AvatarHue;
  avatarUrl: string | null;
  /** The Hub's link to the intro it made. */
  audioUrl: string;
  /** The words the intro says, as the Hub keeps them. */
  text: string | null;
  /** The Hub marks the audio as an AI voice (R-66): it draws the "AI voice" tag with "Bio". */
  aiVoice: boolean;
  onBack: () => void;
  /** Use this: the intro is the person's Bio, so the flow ends. */
  onUse: () => void;
  /** Edit text: VF4. */
  onEditText: () => void;
  /** Re-record: VF9. */
  onReRecord: () => void;
};

/**
 * VF11 · Hear yourself. The intro the Hub made, in the person's own voice, in the shared Voice Intro player with the "Bio" label and
 * the "AI voice" tag (R-66), above the words it says. It plays as the screen opens (the board draws it playing). Use this ends the flow;
 * Edit text opens VF4 and Re-record starts VF9 again.
 */
export function VoiceHearScreen({ name, hue, avatarUrl, audioUrl, text, aiVoice, onBack, onUse, onEditText, onReRecord }: VoiceHearScreenProps) {
  const [playing, setPlaying] = useState(true);
  const [position, setPosition] = useState(0);
  const [length, setLength] = useState(0);
  const [seek, setSeek] = useState<SeekRequest>(null);

  const onTime = useCallback((at: number, total: number) => {
    setPosition(at);
    setLength(total);
  }, []);
  const onEnded = useCallback(() => {
    setPlaying(false);
    setPosition(0);
    setSeek({ to: 0, at: Date.now() });
  }, []);

  return (
    <ShopFrame
      testID="voice-hear-screen"
      title="Hear yourself"
      onBack={onBack}
      foot={
        <>
          <Button testID="voice-hear-use" label="Use this" full onPress={onUse} />
          <View style={styles.pair}>
            <View style={styles.half}>
              <Button testID="voice-hear-edit" label="Edit text" variant="secondary" size="md" full onPress={onEditText} />
            </View>
            <View style={styles.half}>
              <Button testID="voice-hear-rerecord" label="Re-record" variant="secondary" size="md" full onPress={onReRecord} />
            </View>
          </View>
        </>
      }
    >
      <AudioSource uri={audioUrl} playing={playing} seek={seek} onTime={onTime} onEnded={onEnded} />
      <View style={styles.body}>
        <View style={styles.head}>
          <Avatar name={name} hue={hue} size={board.avatar} source={avatarUrl ?? undefined} testID="voice-hear-avatar" />
          <VoiceLabel aiVoice={aiVoice} testID="voice-hear-label" />
        </View>
        <VoicePlayer
          testID="voice-hear-player"
          label="none"
          aiVoice={aiVoice}
          status={playing ? 'playing' : 'idle'}
          progress={length > 0 ? position / length : 0}
          durationSeconds={length}
          onToggle={() => setPlaying((on) => !on)}
        />
        {text ? (
          <Card padded>
            <Text variant="secondary" testID="voice-hear-text" style={{ fontSize: board.words, lineHeight: board.words * board.leading }}>
              {text}
            </Text>
          </Card>
        ) : null}
      </View>
    </ShopFrame>
  );
}

const styles = StyleSheet.create({
  body: { gap: board.bodyGap, paddingTop: board.top - space.sm },
  head: { alignItems: 'center', gap: board.headGap },
  pair: { flexDirection: 'row', gap: board.pairGap },
  half: { flex: 1 },
});
