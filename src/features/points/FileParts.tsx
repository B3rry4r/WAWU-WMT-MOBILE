import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { browserOutlineOff, useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { Text } from '@/components/Text';
import { formatBytes } from '@/features/create/model';
import { canvasNormalLineHeight, font, space, useWawu } from '@/theme';

import { DUB_WORDS, FILE_WORDS, type Cue } from './fileToolModel';
import { MUSIC_WORDS } from './voiceToolsModel';

/*
 * The parts of the file step (POINTS-10). No board draws them (G-POINTS-09-1): they are PT2's own words box turned into a
 * choose-a-recording row, and PT2b's card holding words where it holds the player. They use only the measures PT2 already draws.
 */

/** points.js `pt2Body`: the same 20 corner box on the input colour, 14 by 16 padding; a 1.5 accent ring while nothing is chosen, a 1 hairline after. */
const BOX = { radius: 20, padV: 14, padH: 16, ringOn: 1.5, ringOff: 1, min: 76, mark: 22, parts: 12, name: 15, line: 12.5, lineGap: 2 } as const;
const CARD = { text: 15, leading: 1.5, label: 11, labelTracking: 0.08, cueAt: 12.5, cueWidth: 44 } as const;

/** What a chosen recording is doing: going up, being measured by the Hub, ready, or refused (the refusal is the banner under the box). */
export type RecordingPhase = 'uploading' | 'checking' | 'ready' | 'refused';
export type Recording = { name: string; bytes: number; phase: RecordingPhase; share: number };

const statusOf = (r: Recording): string =>
  r.phase === 'uploading' ? `${FILE_WORDS.uploading} ${Math.round(Math.min(1, Math.max(0, r.share)) * 100)}%` : r.phase === 'checking' ? FILE_WORDS.checking : r.bytes > 0 ? formatBytes(r.bytes) : FILE_WORDS.ready;

/**
 * The row where PT2 has the text box: "Choose a recording" until one is chosen, then its name and where it is. Once its job is done
 * (`settled`, PT2b) the row stays the way to a new recording, and says so to a screen reader, but does not write "Choose another" above the result.
 */
export type FileStepWords = { choose: string; chooseAnother: string; boxLabel: string; icon: 'AudioWaveform' | 'Video' };
const FILE_STEP: FileStepWords = { choose: FILE_WORDS.choose, chooseAnother: FILE_WORDS.chooseAnother, boxLabel: FILE_WORDS.boxLabel, icon: 'AudioWaveform' };

export function RecordingBox({
  recording,
  onChoose,
  enabled,
  settled = false,
  words = FILE_STEP,
}: {
  recording: Recording | null;
  onChoose: () => void;
  enabled: boolean;
  settled?: boolean;
  /** The words of a tool whose file is not "a recording" (a video, a song): POINTS-17. */
  words?: FileStepWords;
}) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const empty = recording === null || recording.phase === 'refused';
  const edge = empty ? { width: BOX.ringOn, color: colors.accent } : { width: BOX.ringOff, color: colors.borderHairline };
  const label = recording === null ? words.choose : recording.phase === 'refused' ? words.choose : words.chooseAnother;
  return (
    <Pressable
      testID="tool-file"
      accessibilityRole="button"
      accessibilityLabel={recording && recording.phase !== 'refused' ? `${words.boxLabel}: ${statusOf(recording)}. ${label}` : label}
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
      <Icon name={empty ? 'Upload' : words.icon} size={BOX.mark} color={empty ? colors.accentFg : colors.textSecondary} strokeWidth={2} />
      <View style={styles.words}>
        <Text variant="body" numberOfLines={1} testID="tool-file-name" style={[font(600), { fontSize: BOX.name, lineHeight: canvasNormalLineHeight(BOX.name) }]}>
          {empty ? label : recording.name}
        </Text>
        <Text variant="body" tone="textMuted" numberOfLines={1} testID="tool-file-status" style={{ fontSize: BOX.line, lineHeight: canvasNormalLineHeight(BOX.line) }}>
          {empty ? '' : statusOf(recording)}
        </Text>
      </View>
      {empty || settled ? null : (
        <Text variant="body" tone="accentFg" style={[font(600), { fontSize: BOX.line, lineHeight: canvasNormalLineHeight(BOX.line) }]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

/** A big upload can be stopped (POINTS-17): a plain "Cancel" link under the row while the file is going up. Nothing is held until Run, so a stopped upload holds nothing. */
export function CancelUpload({ onCancel }: { onCancel: () => void }) {
  return (
    <Pressable testID="tool-file-cancel" accessibilityRole="button" accessibilityLabel={MUSIC_WORDS.cancelUpload} onPress={onCancel} hitSlop={space.md} style={styles.cancel}>
      <Text variant="body" tone="textMuted" style={[font(600), styles.underline, { fontSize: BOX.line, lineHeight: canvasNormalLineHeight(BOX.line) }]}>
        {MUSIC_WORDS.cancelUpload}
      </Text>
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

/**
 * Dubbing's subtitles (POINTS-11): the same card as the transcript, holding each line with where it starts, and the same share row under it
 * where the phone has a share sheet. What is shared is the Hub's WebVTT file, untouched; this card only reads it for the person.
 */
export function SubtitlesCard({ cues, onShare }: { cues: Cue[]; onShare?: () => void }) {
  return (
    <View style={styles.transcript}>
      <Card padded testID="tool-subtitles-card">
        <Text variant="label" accessibilityRole="header" style={[font(700), { fontSize: CARD.label, letterSpacing: CARD.labelTracking * CARD.label, textTransform: 'uppercase' }]}>
          {DUB_WORDS.subtitles}
        </Text>
        <View style={styles.cues} testID="tool-subtitles">
          {cues.map((cue, i) => (
            <View key={i} style={styles.cue}>
              <Text variant="body" tone="textMuted" style={[styles.cueAt, { fontSize: CARD.cueAt }]}>
                {cue.at}
              </Text>
              <Text variant="body" selectable style={[styles.cueText, { fontSize: CARD.text, lineHeight: CARD.text * CARD.leading }]}>
                {cue.text}
              </Text>
            </View>
          ))}
        </View>
      </Card>
      {onShare ? <Button label={FILE_WORDS.shareSubtitles} variant="secondary" icon="Share2" full onPress={onShare} testID="tool-share-subtitles" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cues: { gap: space.sm, marginTop: space.sm },
  cue: { flexDirection: 'row', gap: space.md },
  cueAt: { width: CARD.cueWidth, fontVariant: ['tabular-nums'] },
  cueText: { flex: 1, minWidth: 0 },
  box: { flexDirection: 'row', alignItems: 'center', gap: BOX.parts, minHeight: BOX.min, borderRadius: BOX.radius, paddingVertical: BOX.padV, paddingHorizontal: BOX.padH },
  words: { flex: 1, minWidth: 0, gap: BOX.lineGap },
  transcript: { gap: space.md },
  cancel: { alignSelf: 'flex-start', minHeight: 32, justifyContent: 'center' },
  underline: { textDecorationLine: 'underline' },
});
