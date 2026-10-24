import { useQuery } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { GroupedList } from '@/components/Card';
import { useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { IconTile } from '@/components/IconTile';
import { ListRow } from '@/components/ListRow';
import { Text } from '@/components/Text';
import { AudioSource } from '@/features/feed/player';
import { draftsKey, fetchDrafts } from '@/features/me/api';
import { updateDraft } from '@/features/verify/api';
import { canvasNormalLineHeight, font, radius, space, useWawu } from '@/theme';

import { sampleAddress, setJobSaved, type SavedJob } from './ownVoiceApi';
import { voiceJobQuery } from './voiceoverApi';
import { EXTRAS_WORDS } from './voiceoverModel';

/** PT2 `voiceRow`: a 32 round play button on the sunken fill at the row's left, a 13 play mark in 2.4 stroke, the words and the radio after it. */
const PLAY = { size: 32, icon: 13, stroke: 2.4, slop: 6 } as const;
/** PT2b: the card holds two rows 64 high; each has a 44 round mark on the left. */
const ACTION = { mark: 44 } as const;

/** PT2's play button on a voice row: plays the voice's sample from the Hub, and again to stop. Drawn only for a voice the Hub gives a sample for. */
export function PreviewPlay({ sampleUrl, name }: { sampleUrl: string; name: string }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const [playing, setPlaying] = useState(false);
  const onTime = useCallback(() => undefined, []);
  const onEnded = useCallback(() => setPlaying(false), []);
  return (
    <View>
      <AudioSource uri={sampleAddress(sampleUrl)} playing={playing} seek={null} onTime={onTime} onEnded={onEnded} />
      <Pressable
        testID={`sample-play-${name}`}
        accessibilityRole="button"
        accessibilityLabel={playing ? EXTRAS_WORDS.stopSample(name) : EXTRAS_WORDS.playSample(name)}
        onPress={() => setPlaying((on) => !on)}
        hitSlop={PLAY.slop}
        {...ring.handlers}
        style={[styles.play, { backgroundColor: colors.surfaceSunken }, ring.style]}
      >
        <Icon name={playing ? 'Pause' : 'Play'} size={PLAY.icon} color={colors.textPrimary} fill={colors.textPrimary} strokeWidth={PLAY.stroke} />
      </Pressable>
    </View>
  );
}

/**
 * The words the person agrees to before their own voice reads a VoiceOver, exactly as the Hub served them, and "I agree". Built from VF8's
 * parts (the card, the line in 600 type, the one button): no board draws a consent for VoiceOver (G-AITOOLS-07-1, R-29).
 */
export function OwnVoiceConsent({ line, busy, failure, onAgree, onCancel }: { line: string; busy: boolean; failure: string | null; onAgree: () => void; onCancel: () => void }) {
  const { colors } = useWawu();
  return (
    <View testID="own-voice-consent" style={[styles.consent, { backgroundColor: colors.surfaceCard, borderColor: colors.borderHairline }]}>
      <Text variant="body" tone="textMuted" accessibilityRole="header" style={[font(700), styles.consentLabel]}>
        {EXTRAS_WORDS.consentLabel}
      </Text>
      <Text variant="body" testID="own-voice-consent-line" style={[font(600), styles.consentLine]}>
        {line}
      </Text>
      <Text variant="body" tone="textSecondary" style={styles.consentNote}>
        {EXTRAS_WORDS.consentNote}
      </Text>
      {failure ? <Banner tone="danger" icon="CircleX" title={EXTRAS_WORDS.consentFailed} body={failure} testID="own-voice-consent-failure" /> : null}
      <Button testID="own-voice-agree" label={EXTRAS_WORDS.agree} full loading={busy} onPress={onAgree} />
      <Button testID="own-voice-cancel" label={EXTRAS_WORDS.notNow} variant="secondary" full onPress={onCancel} />
    </View>
  );
}

/** PT2b's card under the player: "Save, To your library" and "Use in a product, Attach to a draft". */
export function ResultActions({ owner, job, onUse }: { owner: string | null; job: SavedJob; onUse: () => void }) {
  const [saved, setSaved] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const isSaved = saved ?? job.saved === true;
  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    setFailure(null);
    try {
      const next = await setJobSaved(job.id, !isSaved);
      setSaved(next.saved === true);
      // The job as the Hub now has it, so the page reads `saved` from it on the next visit.
      queryClient.setQueryData(voiceJobQuery(owner, job.id).queryKey, next);
    } catch (error) {
      setFailure(isApiError(error) && error.message ? error.message : EXTRAS_WORDS.saveFailed);
    } finally {
      setBusy(false);
    }
  };
  return (
    <View style={styles.actions}>
      <GroupedList testID="result-actions">
        <ListRow
          testID="result-save"
          lead={<IconTile icon={isSaved ? 'Check' : 'Download'} tone={isSaved ? 'accent' : 'neutral'} size={ACTION.mark} />}
          title={isSaved ? EXTRAS_WORDS.savedTitle : EXTRAS_WORDS.saveTitle}
          subtitle={isSaved ? EXTRAS_WORDS.savedLine : EXTRAS_WORDS.saveLine}
          accessibilityLabel={isSaved ? EXTRAS_WORDS.unsaveLabel : EXTRAS_WORDS.saveLabel}
          onPress={() => void toggle()}
        />
        <ListRow testID="result-use" lead={<IconTile icon="Package" tone="neutral" size={ACTION.mark} />} title={EXTRAS_WORDS.useTitle} subtitle={EXTRAS_WORDS.useLine} onPress={onUse} />
      </GroupedList>
      {failure ? <Banner tone="danger" icon="CircleX" title={EXTRAS_WORDS.saveFailedTitle} body={failure} testID="result-save-failure" /> : null}
    </View>
  );
}

/**
 * "Use in a product": the person's drafts, one tap attaches the audio to one (`PATCH /product-drafts/{id}` with `mediaJobId`). No board
 * draws the list (G-AITOOLS-07-3, R-29): it is the rows PT2b's card uses, with the draft's title. A person with no drafts is pointed at
 * starting one.
 */
export function DraftPicker({ jobId, onAttached, onCancel, onStartDraft }: { jobId: string; onAttached: (title: string) => void; onCancel: () => void; onStartDraft: () => void }) {
  const drafts = useQuery({ queryKey: draftsKey, queryFn: fetchDrafts, staleTime: 0 }, queryClient);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const attach = async (id: string, title: string) => {
    if (busyId) return;
    setBusyId(id);
    setFailure(null);
    try {
      await updateDraft(id, { mediaJobId: jobId });
      void queryClient.invalidateQueries({ queryKey: draftsKey });
      onAttached(title);
    } catch (error) {
      setFailure(isApiError(error) && error.message ? error.message : EXTRAS_WORDS.attachFailed);
    } finally {
      setBusyId(null);
    }
  };
  return (
    <View testID="draft-picker" style={styles.actions}>
      <Text variant="body" tone="textMuted" accessibilityRole="header" style={[font(700), styles.consentLabel]}>
        {EXTRAS_WORDS.pickDraft}
      </Text>
      {drafts.isPending ? (
        <Text variant="body" tone="textMuted" testID="draft-picker-loading">
          {EXTRAS_WORDS.loadingDrafts}
        </Text>
      ) : drafts.isError ? (
        <Banner tone="danger" icon="CircleX" title={EXTRAS_WORDS.draftsFailed} body={isApiError(drafts.error) && drafts.error.message ? drafts.error.message : EXTRAS_WORDS.draftsFailedBody} testID="draft-picker-error" />
      ) : drafts.data.length === 0 ? (
        <View style={styles.none}>
          <Text variant="body" tone="textSecondary" testID="draft-picker-empty">
            {EXTRAS_WORDS.noDrafts}
          </Text>
          <Button testID="draft-picker-start" label={EXTRAS_WORDS.startDraft} full onPress={onStartDraft} />
        </View>
      ) : (
        <GroupedList>
          {drafts.data.map((draft) => (
            <ListRow
              key={draft.id}
              testID={`draft-pick-${draft.id}`}
              title={draft.title}
              subtitle={draft.mediaJobId ? EXTRAS_WORDS.hasAudio : undefined}
              accessibilityLabel={EXTRAS_WORDS.attachTo(draft.title)}
              onPress={() => void attach(draft.id, draft.title)}
            />
          ))}
        </GroupedList>
      )}
      {failure ? <Banner tone="danger" icon="CircleX" title={EXTRAS_WORDS.attachFailedTitle} body={failure} testID="draft-picker-failure" /> : null}
      <Button testID="draft-picker-cancel" label={EXTRAS_WORDS.cancel} variant="secondary" full onPress={onCancel} />
    </View>
  );
}

const styles = StyleSheet.create({
  play: { width: PLAY.size, height: PLAY.size, borderRadius: PLAY.size / 2, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  consent: { gap: space.md, padding: space.lg, borderRadius: radius.card, borderWidth: 1 },
  consentLabel: { fontSize: 11, letterSpacing: 0.88, textTransform: 'uppercase' },
  consentLine: { fontSize: 18, lineHeight: 18 * 1.45 },
  consentNote: { fontSize: 13.5, lineHeight: canvasNormalLineHeight(13.5) },
  actions: { gap: space.md },
  none: { gap: space.md },
});
