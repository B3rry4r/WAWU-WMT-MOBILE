import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Text';
import { VoiceLabel, VoicePlayer, type VoicePlayerProps } from '@/components/VoicePlayer';
import { LeaveDevRoute } from '@/features/shell/LeaveDevRoute';
import { layout, space, useWawu } from '@/theme';

/**
 * Development-only gallery of the Voice Intro player, for pictures beside M1 (idle, with the label inline) and VF11 (playing, the
 * label above on its own): /preview/voice-player?state=<name>, or no state for every one. Pressing the button moves between idle and
 * playing, and out of an error, as a screen will. The length is the brief's example value: the app reads it from the Hub.
 * A release build redirects home.
 */
type Shown = Pick<VoicePlayerProps, 'status' | 'progress' | 'label' | 'aiVoice'> & { note: string; labelAbove?: boolean };

const cases: Record<string, Shown> = {
  idle: { status: 'idle', note: 'Idle, Bio and AI voice inline (M1)' },
  playing: { status: 'playing', progress: 12 / 26, note: 'Playing, partway' },
  paused: { status: 'idle', progress: 0.7, note: 'Paused partway (Play, bars kept)' },
  loading: { status: 'loading', note: 'Audio on its way' },
  error: { status: 'error', note: 'Audio could not play' },
  notag: { status: 'idle', aiVoice: false, note: 'Hub says not AI voice: Bio only' },
  above: { status: 'playing', progress: 12 / 26, label: 'none', labelAbove: true, note: 'Label above, player below (VF11)' },
};

export default function VoicePlayerPreview() {
  const { colors } = useWawu();
  const { state } = useLocalSearchParams<{ state?: string }>();
  if (!__DEV__) return <LeaveDevRoute />;

  const keys = state && cases[state] ? [state] : Object.keys(cases);
  /** Idle goes to playing; playing, and an error being tried again, go to idle. */
  const toggle = (key: string) => () => router.setParams({ state: cases[key].status === 'idle' ? 'playing' : 'idle' });
  return (
    <ScrollView style={{ backgroundColor: colors.surfacePage }} contentContainerStyle={styles.page}>
      {keys.map((key) => {
        const { note, labelAbove, ...props } = cases[key];
        return (
          <View key={key} style={styles.item}>
            <Text variant="meta">{note}</Text>
            {labelAbove ? (
              <View style={styles.above}>
                <VoiceLabel aiVoice={props.aiVoice} testID={`voice-${key}-above`} />
              </View>
            ) : null}
            <VoicePlayer {...props} durationSeconds={22} onToggle={toggle(key)} testID={`voice-${key}`} />
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { paddingTop: layout.tapMin * 2, paddingHorizontal: layout.gutter, paddingBottom: space.s3xl, gap: space.s2xl },
  item: { gap: space.sm },
  above: { alignItems: 'center', paddingBottom: space.sm },
});
