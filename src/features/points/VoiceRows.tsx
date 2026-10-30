import { Pressable, StyleSheet, View } from 'react-native';

import { useFocusRing } from '@/components/focusRing';
import { Text } from '@/components/Text';
import { canvasNormalLineHeight, font, useWawu } from '@/theme';

import type { AiTool } from './studioApi';
import { PreviewPlay } from './VoiceExtras';
import { TOOL_WORDS } from './voiceoverModel';

/** Line 88, `voiceRow`: 10 between the parts, 10 by 12 padding, a 16 corner, a 1.5 accent ring on the picked voice; the name 14 semi-bold, the line 12; line 60, `radio`: 22 across, the picked one a 6.5 ring. The label above is kit.js line 43: 11, 700, .08em, capitals. */
export const VOICE = { parts: 10, padV: 10, padH: 12, radius: 16, name: 14, line: 12, radio: 22, radioOn: 6.5, radioOff: 1.5, between: 8, labelSize: 11, labelTracking: 0.08, ringOn: 1.5, ringOff: 1 } as const;

/** PT2's single-choice rows: the voices of a tool that reads words aloud, and (POINTS-11) the languages of Dubbing, the same row under another label. */
export function VoiceList({
  voices,
  value,
  onChange,
  label = TOOL_WORDS.voice,
  testID = 'tool-voices',
  rowPrefix = 'tool-voice',
}: {
  voices: AiTool['voices'];
  value: string;
  onChange: (id: string) => void;
  label?: string;
  testID?: string;
  rowPrefix?: string;
}) {
  return (
    <View style={styles.voices}>
      <Text variant="body" tone="textMuted" accessibilityRole="header" style={[font(700), styles.label]}>
        {label}
      </Text>
      <View accessibilityRole="radiogroup" testID={testID} style={styles.voiceList}>
        {voices.map((voice) => (
          <VoiceRow key={voice.id} voice={voice} on={voice.id === value} onPress={() => onChange(voice.id)} testID={`${rowPrefix}-${voice.id}`} />
        ))}
      </View>
    </View>
  );
}

export function VoiceRow({ voice, on, onPress, testID }: { voice: AiTool['voices'][number]; on: boolean; onPress: () => void; testID: string }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="radio"
      accessibilityState={{ checked: on }}
      accessibilityLabel={voice.description ? `${voice.name}, ${voice.description}` : voice.name}
      onPress={onPress}
      {...ring.handlers}
      style={[
        styles.voice,
        {
          backgroundColor: on ? colors.accentTint : colors.surfaceCard,
          boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: on ? VOICE.ringOn : VOICE.ringOff, color: on ? colors.accent : colors.borderHairline, inset: true }],
        },
        ring.style,
      ]}
    >
      {voice.sampleUrl ? <PreviewPlay sampleUrl={voice.sampleUrl} name={voice.name} /> : null}
      <View style={styles.voiceText}>
        <Text variant="body" numberOfLines={1} style={[font(600), { fontSize: VOICE.name, lineHeight: canvasNormalLineHeight(VOICE.name) }]}>
          {voice.name}
        </Text>
        {voice.description ? (
          <Text variant="body" tone="textMuted" numberOfLines={2} style={{ fontSize: VOICE.line, lineHeight: canvasNormalLineHeight(VOICE.line) }}>
            {voice.description}
          </Text>
        ) : null}
      </View>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[styles.radio, { borderWidth: on ? VOICE.radioOn : VOICE.radioOff, borderColor: on ? colors.accent : colors.borderStrong }]}
      />
    </Pressable>
  );
}


const styles = StyleSheet.create({
  voices: { gap: VOICE.between },
  label: { fontSize: VOICE.labelSize, letterSpacing: VOICE.labelTracking * VOICE.labelSize, textTransform: 'uppercase' },
  voiceList: { gap: VOICE.between },
  voice: { flexDirection: 'row', alignItems: 'center', gap: VOICE.parts, paddingVertical: VOICE.padV, paddingHorizontal: VOICE.padH, borderRadius: VOICE.radius },
  voiceText: { flex: 1, minWidth: 0 },
  radio: { width: VOICE.radio, height: VOICE.radio, borderRadius: VOICE.radio / 2, flexShrink: 0 },
});
