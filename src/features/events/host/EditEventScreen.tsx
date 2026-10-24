import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isApiError } from '@/api/client';
import { Button } from '@/components/Button';
import { Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { fieldMetrics } from '@/components/TextField';
import { canPickImage, pickImage, type PickedImage } from '@/features/profile-edit/pickImage';
import { layout, space, useWawu } from '@/theme';

import { detailKey, eventsKey, fetchEvent, fetchOptions, optionsKey } from '../api';
import { NavBar } from '../chrome';
import { Basics, StepSheets, WhenWhere, type Sheet } from './HostScreen';
import { Submitted, footMetrics } from './HostEnds';
import { HostGateScreen } from './HostGateScreen';
import { ReviewSheet } from './ReviewSheet';
import { updateEvent, uploadBanner } from './hostApi';
import { draftFromEvent, eventChanged, hasErrors, patchBody, stepErrors, type Errors, type HostDraft, type Step } from './hostForm';
import { Stepper } from './hostParts';
import { isHostTierRefusal, type HostTierRefusal } from './hostTier';

/** The wizard's body metrics (E13 and E14): 14 above, 14 between rows. */
const bodyMetrics = { top: 14, between: 14 } as const;
/** An edit has the wizard's first two steps; the ticket types are the other row on E18. */
const EDIT_STEPS = ['Basics', 'When and where'] as const;

export type EditEventScreenProps = {
  id: string;
  onBack: () => void;
  /** Done, as the wizard's own "Sent for review" end has it. */
  onDone: () => void;
  /** The end's My events button (E17, where the event now reads In review). */
  onMine?: () => void;
  /** E21's See tiers opens VF5. The button is not drawn without it. */
  onSeeTiers?: () => void;
  now?: () => number;
};

/**
 * E18's Edit event: the wizard's Basics (E13) and When and where (E14), filled from the event, saved with `PATCH /events/{id}`. The Hub
 * puts every edit back in review (R-79 (c)), so a sheet says so before the save, and the end is the wizard's "Sent for review" (E16).
 * The person's edits are kept apart from the event so a refetch never throws them away; only the fields they changed are sent.
 */
export function EditEventScreen({ id, onBack, onDone, onMine, onSeeTiers, now = Date.now }: EditEventScreenProps) {
  const { colors } = useWawu();
  const insets = useSafeAreaInsets();
  const client = useQueryClient();
  const event = useQuery({ queryKey: detailKey(id), queryFn: () => fetchEvent(id) });
  const options = useQuery({ queryKey: optionsKey, queryFn: fetchOptions });

  const [step, setStep] = useState<Step>(0);
  const [edits, setEdits] = useState<Partial<HostDraft>>({});
  const [errors, setErrors] = useState<Errors>({});
  const [sheet, setSheet] = useState<Sheet>(null);
  const [banner, setBanner] = useState<PickedImage | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [sending, setSending] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [refused, setRefused] = useState<HostTierRefusal | null>(null);
  const inFlight = useRef(false);
  const mounted = useRef(true);
  useEffect(() => () => void (mounted.current = false), []);

  const data = event.data;
  const original = useMemo(() => (data ? draftFromEvent(data) : null), [data]);
  const draft: HostDraft | null = original ? { ...original, ...edits } : null;
  const opts = options.data;

  const set = (patch: Partial<HostDraft>) => {
    setEdits((e) => ({ ...e, ...patch }));
    setFailure(null);
  };

  const back = () => {
    if (step > 0) {
      setErrors({});
      setStep(0);
    } else onBack();
  };

  // The phone's own Back does what the on-screen one does: a step back with the text kept, then out.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!sending) back();
      return true;
    });
    return () => sub.remove();
  });

  const chooseBanner = async () => {
    const picked = await pickImage();
    if (picked) {
      setBanner(picked);
      setFailure(null);
    }
  };

  const advance = () => {
    if (!draft || !opts) return;
    const found = stepErrors(0, draft, opts, now());
    setErrors(found);
    if (!hasErrors(found)) setStep(1);
  };

  /** Save changes: every step is checked again, then the sheet says what the Hub will do. */
  const review = () => {
    if (!draft || !original || !opts) return;
    const at = now();
    const all: Errors = { ...stepErrors(0, draft, opts, at), ...stepErrors(1, draft, opts, at, original) };
    setErrors(all);
    if (hasErrors(all)) {
      if (hasErrors(stepErrors(0, draft, opts, at)) && step !== 0) setStep(0);
      return;
    }
    setConfirm(true);
  };

  const send = async () => {
    if (inFlight.current || !draft || !original) return;
    inFlight.current = true;
    setSending(true);
    setFailure(null);
    try {
      const bannerUrl = banner ? await uploadBanner(banner) : null;
      await updateEvent(id, patchBody(draft, original, bannerUrl));
      void client.invalidateQueries({ queryKey: eventsKey });
      if (mounted.current) setSent(true);
    } catch (error) {
      if (!mounted.current) return;
      setConfirm(false);
      if (isHostTierRefusal(error)) {
        // E21 is the answer, with the Hub's own words.
        setRefused(error as HostTierRefusal);
      } else {
        setFailure(isApiError(error) ? error.message : 'Your changes were not saved. Try again.');
      }
    } finally {
      inFlight.current = false;
      if (mounted.current) setSending(false);
    }
  };

  if (sent) return <Submitted name={draft?.name ?? data?.name ?? 'Your event'} onDone={onDone} onMyEvents={onMine} />;
  if (refused) return <HostGateScreen refusal={refused} onBack={onBack} onSeeTiers={onSeeTiers} />;

  const failed = (!data && event.isError ? event.error : null) ?? (!opts && options.isError ? options.error : null);
  const loading = event.isPending || options.isPending;
  const changed = draft && original ? eventChanged(draft, original, banner !== null) : false;

  return (
    <View testID="edit-event-screen" style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: insets.top }]}>
      <NavBar title="Edit event" onBack={back} backTestID="edit-back" />
      {loading ? (
        <View style={styles.body} testID="edit-loading">
          <Skeleton height={space.s2xl} />
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={fieldMetrics.height} radius={fieldMetrics.radius} />
          ))}
        </View>
      ) : failed || !data || !opts || !draft || !original ? (
        <ErrorState
          testID="edit-error"
          title="Couldn't open this event"
          message={isApiError(failed) ? failed.message : 'Check your connection and try again.'}
          onRetry={() => {
            void event.refetch();
            void options.refetch();
          }}
        />
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Stepper step={step} steps={EDIT_STEPS} />
            {step === 0 ? (
              <Basics draft={draft} errors={errors} options={opts} set={set} openKind={() => setSheet('kind')} />
            ) : (
              <WhenWhere
                draft={draft}
                errors={errors}
                options={opts}
                now={now()}
                set={set}
                open={setSheet}
                bannerUri={banner?.previewUri ?? data.bannerUrl ?? null}
                onBanner={canPickImage ? chooseBanner : null}
              />
            )}
          </ScrollView>
          <View style={[styles.foot, { backgroundColor: colors.surfacePage, paddingBottom: footMetrics.bottom + insets.bottom }]}>
            {failure ? (
              <Text variant="errorLine" tone="danger" accessibilityRole="alert" testID="edit-failure">
                {failure}
              </Text>
            ) : null}
            {step === 0 ? (
              <Button testID="edit-continue" label="Continue" full onPress={advance} />
            ) : (
              <Button testID="edit-save" label="Save changes" full disabled={!changed} onPress={review} />
            )}
          </View>
          <StepSheets sheet={sheet} setSheet={setSheet} draft={draft} options={opts} now={now()} set={set} />
          <ReviewSheet visible={confirm} onClose={() => setConfirm(false)} onConfirm={() => void send()} busy={sending} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignSelf: 'center', width: '100%', maxWidth: layout.screenW },
  body: { paddingHorizontal: layout.gutter, paddingTop: bodyMetrics.top, paddingBottom: bodyMetrics.top, gap: bodyMetrics.between },
  foot: { paddingTop: footMetrics.top, paddingHorizontal: layout.gutter, gap: space.sm },
});
