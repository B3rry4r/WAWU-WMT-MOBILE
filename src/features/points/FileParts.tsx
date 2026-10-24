import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { browserOutlineOff, useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { Text } from '@/components/Text';
import { formatBytes } from '@/features/create/model';
import { canvasNormalLineHeight, font, space, useWawu } from '@/theme';

import { FILE_WORDS } from './fileToolModel';

/*
 * The parts of the file step (POINTS-10). No board draws them (G-POINTS-09-1): they are PT2's own words box turned into a
 * choose-a-recording row, and PT2b's card holding words where it holds the player. They use only the measures PT2 already draws.
 */

/** points.js `pt2Body`: the same 20 corner box on the input colour, 14 by 16 padding; a 1.5 accent ring while nothing is chosen, a 1 hairline after. */
const BOX = { radius: 20, padV: 14, padH: 16, ringOn: 1.5, ringOff: 1, min: 76, mark: 22, parts: 12, name: 15, line: 12.5, lineGap: 2 } as const;
const CARD = { text: 15, leading: 1.5, label: 11, labelTracking: 0.08 } as const;

/** What a chosen recording is doing: going up, being measured by the Hub, ready, or refused (the refusal is the banner under the box). */
export type RecordingPhase = 'uploading' | 'checking' | 'ready' | 'refused';
export type Recording = { name: string; bytes: number; phase: RecordingPhase; share: number };

const statusOf = (r: Recording): string =>
  r.phase === 'uploading' ? `${FILE_WORDS.uploading} ${Math.round(Math.min(1, Math.max(0, r.share)) * 100)}%` : r.phase === 'checking' ? FILE_WORDS.checking : r.bytes > 0 ? formatBytes(r.bytes) : FILE_WORDS.ready;

/** The row where PT2 has the text box: "Choose a recording" until one is chosen, then its name and where it is. */
export function RecordingBox({ recording, onChoose, enabled }: { recording: Recording | null; onChoose: () => void; enabled: boolean }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const empty = recording === null || recording.phase === 'refused';
  const edge = empty ? { width: BOX.ringOn, color: colors.accent } : { width: BOX.ringOff, color: colors.borderHairline };
  const label = recording === null ? FILE_WORDS.choose : recording.phase === 'refused' ? FILE_WORDS.choose : FILE_WORDS.chooseAnother;
  return (
    <Pressable
      testID="tool-file"
      accessibilityRole="button"
      accessibilityLabel={recording && recording.phase !== 'refused' ? `${FILE_WORDS.boxLabel}: ${statusOf(recording)}. ${label}` : label}
      accessibilityState={{ disabled: !enabled, busy: recording?.phase === 'uploading' || recording?.phase === 'checking' }}
      disabled={!enabled}
      onPress={onChoose}
      {...ring.handlers}
      style={[
        styles.box,
        { backgroundColor: colors.surfaceInput, boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: edge.width, color: edge.color, inset: true }] },
        browserOutlineOff,
        ring.style,
      ]}
    >
      <Icon name={empty ? 'Upload' : 'AudioWaveform'} size={BOX.mark} color={empty ? colors.accentFg : colors.textSecondary} strokeWidth={2} />
      <View style={styles.words}>
        <Text variant="body" numberOfLines={1} testID="tool-file-name" style={[font(600), { fontSize: BOX.name, lineHeight: canvasNormalLineHeight(BOX.name) }]}>
          {empty ? label : recording.name}
        </Text>
        <Text variant="body" tone="textMuted" numberOfLines={1} testID="tool-file-status" style={{ fontSize: BOX.line, lineHeight: canvasNormalLineHeight(BOX.line) }}>
          {empty ? '' : statusOf(recording)}
        </Text>
      </View>
      {empty ? null : (
        <Text variant="body" tone="accentFg" style={[font(600), { fontSize: BOX.line, lineHeight: canvasNormalLineHeight(BOX.line) }]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

/** PT2b's card where the player sits, holding the words the Hub heard: selectable, so the person can copy them. */
export function TranscriptCard({ text, onShare }: { text: string; onShare?: () => void }) {
  return (
    <View style={styles.transcript}>
      <Card padded testID="tool-transcript-card">
        <Text variant="label" accessibilityRole="header" style={[font(700), { fontSize: CARD.label, letterSpacing: CARD.labelTracking * CARD.label, textTransform: 'uppercase' }]}>
          {FILE_WORDS.transcript}
        </Text>
        <Text variant="body" selectable testID="tool-transcript" style={{ fontSize: CARD.text, lineHeight: CARD.text * CARD.leading, marginTop: space.sm }}>
          {text}
        </Text>
      </Card>
      {onShare ? <Button label={FILE_WORDS.shareSubtitles} variant="secondary" icon="Share2" full onPress={onShare} testID="tool-share-subtitles" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: 'row', alignItems: 'center', gap: BOX.parts, minHeight: BOX.min, borderRadius: BOX.radius, paddingVertical: BOX.padV, paddingHorizontal: BOX.padH },
  words: { flex: 1, minWidth: 0, gap: BOX.lineGap },
  transcript: { gap: space.md },
});
