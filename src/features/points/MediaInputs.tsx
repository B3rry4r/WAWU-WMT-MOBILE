import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { GroupedList } from '@/components/Card';
import { FilterChips } from '@/components/FilterChips';
import { Icon } from '@/components/icon';
import { ListRow } from '@/components/ListRow';
import { Text } from '@/components/Text';
import { canvasNormalLineHeight, font, radius, space, useWawu } from '@/theme';

import { fetchRecentJobs, recentJobsKey, voiceResultsOf } from './mediaToolApi';
import { MEDIA_WORDS, photoLimits, shapeName, typeNames } from './mediaToolModel';
import { canTakePhoto } from './photoPick';
import type { AiTool } from './studioApi';
import type { PhotoState, Refusal, VoiceState } from './useMediaInputs';

/** PT2's label above a group (kit.js line 43: 11, 700, .08em, capitals); the photo thumbnail 56 with a 12 corner; the rows 14 apart like PT2's parts. */
const LABEL = { size: 11, tracking: 0.08 } as const;
const THUMB = { size: 56, radius: radius.chip } as const;

function Label({ children }: { children: string }) {
  return (
    <Text variant="body" tone="textMuted" accessibilityRole="header" style={[font(700), styles.label]}>
      {children}
    </Text>
  );
}

/** The shapes the Hub lists for the tool, as chips (Square, Portrait, Tall, Wide). */
export function ShapeRow({ shapes, value, onChange }: { shapes: readonly string[]; value: string; onChange: (shape: string) => void }) {
  return (
    <View style={styles.group} testID="tool-shapes">
      <Label>{MEDIA_WORDS.shape}</Label>
      <FilterChips variant="option" label={MEDIA_WORDS.shape} items={shapes.map((s) => ({ value: s, label: shapeName(s) }))} value={value} onChange={onChange} testID="tool-shape" />
    </View>
  );
}

/** The lengths the Hub lists for a clip, in seconds, as chips. */
export function LengthRow({ lengths, value, onChange }: { lengths: readonly number[]; value: number; onChange: (seconds: number) => void }) {
  return (
    <View style={styles.group} testID="tool-lengths">
      <Label>{MEDIA_WORDS.length}</Label>
      <FilterChips variant="option" label={MEDIA_WORDS.length} items={lengths.map((n) => ({ value: String(n), label: MEDIA_WORDS.seconds(n) }))} value={String(value)} onChange={(v) => onChange(Number(v))} testID="tool-length-chip" />
    </View>
  );
}

type PhotoRule = NonNullable<NonNullable<AiTool['input']['options']>['photo']>;

/**
 * The photo row of Edit a photo, Make a video (optional) and Talking photo: "Choose a photo" (the library) and "Take a photo" (the camera,
 * on a phone), a thumbnail once chosen with the upload's progress, "Change photo" and "Remove photo". The Hub's rule is the line under the row.
 */
export function PhotoRow({
  rule,
  optional,
  photo,
  refused,
  cameraOff,
  enabled,
  onChoose,
  onRemove,
}: {
  rule: PhotoRule;
  optional: boolean;
  photo: PhotoState | null;
  refused: Refusal | null;
  cameraOff: boolean;
  enabled: boolean;
  onChoose: (from: 'library' | 'camera') => void;
  onRemove: () => void;
}) {
  const { colors } = useWawu();
  return (
    <View style={styles.group} testID="tool-photo">
      <Label>{MEDIA_WORDS.photo}</Label>
      {photo ? (
        <View style={[styles.card, { backgroundColor: colors.surfaceCard, borderColor: colors.borderHairline }]}>
          <View style={[styles.thumb, { backgroundColor: colors.surfaceSunken }]}>{photo.previewUri ? <Image testID="tool-photo-thumb" source={{ uri: photo.previewUri }} contentFit="cover" style={styles.thumbFill} accessibilityIgnoresInvertColors /> : <Icon name="Image" size={22} color={colors.textMuted} />}</View>
          <View style={styles.cardText}>
            <Text variant="body" numberOfLines={1} style={[font(600), styles.cardName]}>
              {photo.name}
            </Text>
            <Text variant="body" tone="textMuted" testID="tool-photo-state" style={styles.cardLine}>
              {photo.phase === 'uploading' ? `${MEDIA_WORDS.photoUploading} ${Math.round(photo.share * 100)}%` : MEDIA_WORDS.photoReady}
            </Text>
          </View>
        </View>
      ) : (
        <Text variant="body" tone="textMuted" style={styles.cardLine}>
          {`${optional ? `${MEDIA_WORDS.photoOptional} ` : ''}${photoLimits(rule)}`}
        </Text>
      )}
      <View style={styles.buttons}>
        <View style={styles.buttonWide}>
          <Button testID="tool-photo-choose" label={photo ? MEDIA_WORDS.changePhoto : MEDIA_WORDS.choosePhoto} variant="secondary" full disabled={!enabled} onPress={() => onChoose('library')} />
        </View>
        {canTakePhoto ? (
          <View style={styles.buttonWide}>
            <Button testID="tool-photo-camera" label={MEDIA_WORDS.takePhoto} variant="secondary" full disabled={!enabled} onPress={() => onChoose('camera')} />
          </View>
        ) : null}
      </View>
      {photo && enabled ? (
        <Pressable testID="tool-photo-remove" accessibilityRole="button" accessibilityLabel={MEDIA_WORDS.removePhoto} onPress={onRemove} hitSlop={space.md} style={styles.removeLink}>
          <Text variant="body" tone="textMuted" style={[font(600), styles.underline, styles.cardLine]}>
            {MEDIA_WORDS.removePhoto}
          </Text>
        </Pressable>
      ) : null}
      {cameraOff ? <Banner tone="warning" icon="Camera" title={MEDIA_WORDS.cameraOffTitle} body={MEDIA_WORDS.cameraOff} testID="tool-camera-off" /> : null}
      {refused ? <Banner tone="danger" icon="CircleX" title={refused.title} body={refused.body} testID="tool-photo-refused" /> : null}
    </View>
  );
}

/**
 * Talking photo's voice row: "Choose a recording" (an MP3 or WAV, the Hub's list) and "Use a voice result" (the person's own finished voice
 * jobs, `GET /ai-tools/jobs`). The Hub's reading of the voice's length is the line once it is ready. The phone's recorder writes a type the
 * Hub does not take for a Talking photo, so "Record now" is not drawn (R-47, G-STUDIO2-APP-1).
 */
export function VoiceRow({
  owner,
  accepts,
  voice,
  seconds,
  refused,
  picking,
  enabled,
  onChoosePicking,
  onChooseFile,
  onUseResult,
  onClear,
}: {
  owner: string | null;
  accepts: readonly string[];
  voice: VoiceState | null;
  seconds: number | null;
  refused: Refusal | null;
  picking: boolean;
  enabled: boolean;
  onChoosePicking: (on: boolean) => void;
  onChooseFile: () => void;
  onUseResult: (jobId: string, label: string) => void;
  onClear: () => void;
}) {
  const { colors } = useWawu();
  const working = voice?.phase === 'uploading' || voice?.phase === 'checking';
  return (
    <View style={styles.group} testID="tool-voice-row">
      <Label>{MEDIA_WORDS.voice}</Label>
      {voice ? (
        <View style={[styles.card, { backgroundColor: colors.surfaceCard, borderColor: colors.borderHairline }]}>
          <View style={[styles.thumb, { backgroundColor: colors.surfaceSunken }]}>
            <Icon name="Mic" size={22} color={colors.textMuted} />
          </View>
          <View style={styles.cardText}>
            <Text variant="body" numberOfLines={1} style={[font(600), styles.cardName]}>
              {voice.source === 'file' ? voice.name : voice.label}
            </Text>
            <Text variant="body" tone="textMuted" testID="tool-voice-state" style={styles.cardLine}>
              {voice.phase === 'uploading' ? `${MEDIA_WORDS.voiceUploading} ${Math.round(voice.share * 100)}%` : voice.phase === 'checking' ? MEDIA_WORDS.voiceChecking : seconds !== null ? MEDIA_WORDS.speechLine(seconds) : MEDIA_WORDS.photoReady}
            </Text>
          </View>
        </View>
      ) : (
        <Text variant="body" tone="textMuted" style={styles.cardLine}>
          {`${typeNames(accepts)}`}
        </Text>
      )}
      <View style={styles.buttons}>
        <View style={styles.buttonWide}>
          <Button testID="tool-voice-file" label={voice ? MEDIA_WORDS.voiceChanged : MEDIA_WORDS.voiceChooseFile} variant="secondary" full disabled={!enabled || working} onPress={onChooseFile} />
        </View>
        <View style={styles.buttonWide}>
          <Button testID="tool-voice-result" label={MEDIA_WORDS.voiceUseResult} variant="secondary" full disabled={!enabled || working} onPress={() => onChoosePicking(!picking)} />
        </View>
      </View>
      {voice && enabled && !working ? (
        <Pressable testID="tool-voice-clear" accessibilityRole="button" accessibilityLabel={MEDIA_WORDS.voiceChanged} onPress={onClear} hitSlop={space.md} style={styles.removeLink}>
          <Text variant="body" tone="textMuted" style={[font(600), styles.underline, styles.cardLine]}>
            {MEDIA_WORDS.removeVoice}
          </Text>
        </Pressable>
      ) : null}
      {picking ? <VoiceResults owner={owner} onPick={(id, label) => onUseResult(id, label)} /> : null}
      {refused ? <Banner tone="danger" icon="CircleX" title={refused.title} body={refused.body} testID="tool-voice-refused" /> : null}
    </View>
  );
}

/** The person's own finished voice results, newest first: one tap uses one as the voice. */
function VoiceResults({ owner, onPick }: { owner: string | null; onPick: (jobId: string, label: string) => void }) {
  const jobs = useQuery({ queryKey: recentJobsKey(owner), queryFn: fetchRecentJobs, enabled: Boolean(owner), staleTime: 0 }, queryClient);
  if (jobs.isPending) {
    return (
      <Text variant="body" tone="textMuted" testID="tool-voice-results-loading" style={styles.cardLine}>
        Loading
      </Text>
    );
  }
  if (jobs.isError) return <Banner tone="danger" icon="CircleX" title={MEDIA_WORDS.voiceResultsFailed} body={isApiError(jobs.error) && jobs.error.message ? jobs.error.message : MEDIA_WORDS.voiceFailedBody} testID="tool-voice-results-error" />;
  const results = voiceResultsOf(jobs.data);
  if (results.length === 0) {
    return (
      <Text variant="body" tone="textSecondary" testID="tool-voice-results-empty" style={styles.cardLine}>
        {MEDIA_WORDS.voiceNoResults}
      </Text>
    );
  }
  return (
    <View testID="tool-voice-results" style={styles.group}>
      <Label>{MEDIA_WORDS.voicePickResult}</Label>
      <GroupedList>
        {results.map((job) => {
          const label = `${when(job.createdAt)}, ${job.characters} characters`;
          return <ListRow key={job.id} testID={`tool-voice-result-${job.id}`} title={label} subtitle={`${job.units} minute${job.units === 1 ? '' : 's'}`} onPress={() => onPick(job.id, label)} />;
        })}
      </GroupedList>
    </View>
  );
}

/** "30 Oct, 14:05": when a result was made, in the phone's own time. */
function when(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'A result';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate()} ${months[d.getMonth()]}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  group: { gap: space.sm },
  label: { fontSize: LABEL.size, letterSpacing: LABEL.tracking * LABEL.size, textTransform: 'uppercase' },
  card: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.card, borderWidth: 1 },
  thumb: { width: THUMB.size, height: THUMB.size, borderRadius: THUMB.radius, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  thumbFill: { width: '100%', height: '100%' },
  cardText: { flex: 1, minWidth: 0 },
  cardName: { fontSize: 14, lineHeight: canvasNormalLineHeight(14) },
  cardLine: { fontSize: 12.5, lineHeight: canvasNormalLineHeight(12.5) },
  buttons: { flexDirection: 'row', gap: space.sm },
  buttonWide: { flex: 1 },
  removeLink: { alignSelf: 'flex-start' },
  underline: { textDecorationLine: 'underline' },
});
