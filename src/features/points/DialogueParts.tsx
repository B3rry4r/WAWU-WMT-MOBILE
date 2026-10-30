import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { browserOutlineOff, useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { Text } from '@/components/Text';
import { canvasNormalLineHeight, font, radius, space, useWawu } from '@/theme';

import type { AiTool } from './studioApi';
import { VoiceList } from './VoiceRows';
import { DIALOGUE_WORDS, type SceneLine } from './voiceToolsModel';
import { countLine } from './voiceoverModel';

/** PT2's box measures for a line's words (20 corner, 14 by 16 padding, 15 on 1.5), the card holds the line's box and its voice chip; the chip is the voice row's 16 corner. No board draws it (R-29). */
const LINE = { radius: 20, padV: 12, padH: 16, font: 15, leading: 1.5, min: 64, ringOn: 1.5, ringOff: 1, label: 11 } as const;

/**
 * Dialogue's scene (POINTS-16): a card for each line with its words and a chip for its voice (a tap opens PT2's single-choice voice rows under
 * the card), "Add a line", a card's remove, and the counter against the Hub's characters. The Hub's limits are the entry's: the characters in
 * all, and the most different voices. A change that would pass one is refused with the reason (`note`) and the scene stays as it was.
 */
export function SceneLines({
  lines,
  voices,
  characters,
  max,
  editable,
  onWrite,
  onVoice,
  onAdd,
  onRemove,
  note,
}: {
  lines: readonly SceneLine[];
  voices: AiTool['voices'];
  characters: number;
  max: number;
  editable: boolean;
  onWrite: (id: number, text: string) => void;
  onVoice: (id: number, voiceId: string) => void;
  onAdd: () => void;
  onRemove: (id: number) => void;
  note: string | null;
}) {
  const { colors } = useWawu();
  const [open, setOpen] = useState<number | null>(null);
  return (
    <View testID="scene" style={styles.scene}>
      <Text variant="body" tone="textMuted" accessibilityRole="header" style={[font(700), styles.label]}>
        {DIALOGUE_WORDS.sceneLabel}
      </Text>
      {lines.map((line, i) => {
        const voice = voices.find((v) => v.id === line.voiceId);
        return (
          <View key={line.id} testID={`scene-line-${i}`} style={styles.line}>
            <View style={[styles.box, { backgroundColor: colors.surfaceInput, boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: line.text === '' ? LINE.ringOn : LINE.ringOff, color: line.text === '' ? colors.accent : colors.borderHairline, inset: true }] }]}>
              <View style={styles.head}>
                <Text variant="body" tone="textMuted" style={[font(600), { fontSize: 12.5, lineHeight: canvasNormalLineHeight(12.5) }]}>
                  {DIALOGUE_WORDS.line(i + 1)}
                </Text>
                {lines.length > 1 && editable ? <RemoveLine n={i + 1} onPress={() => onRemove(line.id)} testID={`scene-remove-${i}`} /> : null}
              </View>
              <TextInput
                testID={`scene-text-${i}`}
                accessibilityLabel={DIALOGUE_WORDS.boxLabel(i + 1)}
                multiline
                editable={editable}
                value={line.text}
                onChangeText={(next) => onWrite(line.id, next)}
                placeholder={DIALOGUE_WORDS.placeholder}
                placeholderTextColor={colors.textMuted}
                textAlignVertical="top"
                style={[styles.input, { color: colors.textPrimary }, font(400), browserOutlineOff]}
              />
            </View>
            <VoiceChip n={i + 1} name={voice?.name ?? line.voiceId} open={open === line.id} enabled={editable} onPress={() => setOpen(open === line.id ? null : line.id)} testID={`scene-voice-${i}`} />
            {open === line.id ? (
              <VoiceList
                voices={voices}
                value={line.voiceId}
                onChange={(id) => {
                  onVoice(line.id, id);
                  setOpen(null);
                }}
                label={DIALOGUE_WORDS.pickVoice}
                testID={`scene-voices-${i}`}
                rowPrefix={`scene-voice-${i}-pick`}
              />
            ) : null}
          </View>
        );
      })}
      <View style={styles.foot}>
        <Button testID="scene-add" label={DIALOGUE_WORDS.addLine} variant="secondary" icon="Plus" disabled={!editable} onPress={onAdd} />
        <Text variant="body" tone="textMuted" testID="tool-count" style={{ fontSize: 12.5, lineHeight: canvasNormalLineHeight(12.5) }}>
          {countLine(characters, max)}
        </Text>
      </View>
      {note ? (
        <Text variant="body" tone="danger" accessibilityLiveRegion="polite" testID="scene-note" style={{ fontSize: 13, lineHeight: canvasNormalLineHeight(13) }}>
          {note}
        </Text>
      ) : null}
    </View>
  );
}

function VoiceChip({ n, name, open, enabled, onPress, testID }: { n: number; name: string; open: boolean; enabled: boolean; onPress: () => void; testID: string }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={DIALOGUE_WORDS.voiceChip(n, name)}
      accessibilityState={{ expanded: open, disabled: !enabled }}
      disabled={!enabled}
      onPress={onPress}
      {...ring.handlers}
      style={[styles.chip, { backgroundColor: colors.accentTint, boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 1, color: colors.accent, inset: true }] }, ring.style]}
    >
      <Icon name="Mic" size={14} color={colors.accentFg} strokeWidth={2.2} />
      <Text variant="body" numberOfLines={1} style={[font(600), { fontSize: 13.5, lineHeight: canvasNormalLineHeight(13.5), flexShrink: 1 }]}>
        {name}
      </Text>
      <Icon name="ChevronDown" size={14} color={colors.textMuted} />
    </Pressable>
  );
}

function RemoveLine({ n, onPress, testID }: { n: number; onPress: () => void; testID: string }) {
  const { colors } = useWawu();
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={DIALOGUE_WORDS.removeLine(n)} onPress={onPress} hitSlop={space.md}>
      <Icon name="X" size={16} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scene: { gap: space.md },
  label: { fontSize: LINE.label, letterSpacing: 0.88, textTransform: 'uppercase' },
  line: { gap: space.sm },
  box: { borderRadius: LINE.radius, paddingVertical: LINE.padV, paddingHorizontal: LINE.padH, gap: space.xs, minHeight: LINE.min },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  input: { fontSize: LINE.font, lineHeight: LINE.font * LINE.leading, padding: 0, margin: 0, minHeight: LINE.font * LINE.leading },
  chip: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: space.sm, paddingVertical: space.sm, paddingHorizontal: space.md, borderRadius: radius.chip, maxWidth: '100%' },
  foot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.md },
});
