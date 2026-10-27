import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isApiError } from '@/api/client';
import { Button } from '@/components/Button';
import { useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { PricePicker } from '@/components/PricePicker';
import { SegmentedTabs } from '@/components/SegmentedTabs';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { TextField, fieldMetrics } from '@/components/TextField';
import { fetchMyTier, tierKey } from '@/features/me/api';
import { listOf, refetchIfNotOnList, usePrices } from '@/features/prices/api';
import { digitsOfNaira, nairaOfDigits } from '@/features/prices/model';
import { canPickImage, pickImage, type PickedImage } from '@/features/profile-edit/pickImage';
import { layout, radius, space, useWawu } from '@/theme';

import { eventsKey, fetchOptions, optionsKey, type EventOptions, type EventView } from '../api';
import { EventsTabs, NavBar } from '../chrome';
import { HostGateScreen } from './HostGateScreen';
import { Submitted, footMetrics } from './HostEnds';
import { createEvent, fetchMyVerification, mayHost, uploadBanner, verificationKey } from './hostApi';
import {
  createBody,
  dayChoices,
  dayLabel,
  digitsOf,
  emptyDraft,
  endShown,
  hasErrors,
  addDays,
  daysBetween,
  newTicket,
  priceShown,
  startLabel,
  stepErrors,
  ticketNote,
  timeChoices,
  type Errors,
  type HostDraft,
  type Step,
  type TicketDraft,
} from './hostForm';
import { AreaField, BannerTile, ChoiceSheet, LockedField, OptionRow, PickerField, SectionLabel, Stepper, WhenSheet } from './hostParts';
import { isHostTierRefusal, tierRunning, type HostTierRefusal } from './hostTier';

/** events_b.js form1 to form3: `body(..., { between: 14, pt: 14 })`, tickets at 12; the FORMAT label 10 over its options; a ticket card 14 in, 10 between its rows. */
const bodyMetrics = { top: 14, between: 14, ticketsGap: 12, labelGap: 10, cardPad: 14, cardGap: 10, pairBetween: 10 } as const;
/** events_b.js form3's Add a ticket type: 12 padding, 16 corner, a 1.5 strong ring, a 16 Plus at 2.2, 7 to the words, 13.5 semi-bold. */
const ACCESS = [
  { value: 'paid', label: 'Paid' },
  { value: 'free', label: 'Free' },
] as const;
const addMetrics = { pad: 12, corner: 16, ring: 1.5, icon: 16, iconStroke: 2.2, between: 7, font: 13.5 } as const;
/** How far ahead a start can be picked, and the gap between the times offered. PROVISIONAL(HOST-PICKER, owner=DEV3, why=no ruling sizes them). */
const PICKER = { days: 365, minutes: 30, endDays: 14 } as const;

export type Sheet = 'kind' | 'category' | 'starts' | 'ends' | null;

export type HostScreenProps = {
  onBack: () => void;
  onDiscover: () => void;
  onDone: () => void;
  /** The My events tab, and E16's My events button (E17, EVENTS-08). */
  onMine?: () => void;
  /** E21's See tiers opens VF5. The button is not drawn without it. */
  onSeeTiers?: () => void;
  /** The clock the wizard checks a start against. */
  now?: () => number;
};

/**
 * E13 to E16, and E21 for an account without a tier: the host wizard and its ends. The entry is decided from what the app already
 * reads: a running tier (`GET /me/tier`) or a verification tick that has not ended (`GET /verification/me`) opens the form; neither
 * opens E21 (the Hub has no read that says "may host" before a POST, G-EVENTS-12-2). The Hub's 403 has the last word: a refused send
 * opens E21 with the Hub's own sentence and price, whatever the app thought.
 */
export function HostScreen({ onBack, onDiscover, onDone, onMine, onSeeTiers, now = Date.now }: HostScreenProps) {
  const { colors } = useWawu();
  const insets = useSafeAreaInsets();
  const client = useQueryClient();
  const verification = useQuery({ queryKey: verificationKey, queryFn: fetchMyVerification });
  const options = useQuery({ queryKey: optionsKey, queryFn: fetchOptions });
  const priceList = listOf(usePrices().data);
  // Read again on every visit: a tier bought or ended since the last one decides the entry.
  const tier = useQuery({ queryKey: tierKey, queryFn: fetchMyTier, staleTime: 0, retry: false });

  const [step, setStep] = useState<Step>(0);
  const [draft, setDraft] = useState<HostDraft>(emptyDraft);
  const [errors, setErrors] = useState<Errors>({});
  const [sheet, setSheet] = useState<Sheet>(null);
  const [banner, setBanner] = useState<PickedImage | null>(null);
  const [sending, setSending] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [sent, setSent] = useState<EventView | null>(null);
  const [refused, setRefused] = useState<HostTierRefusal | null>(null);
  const inFlight = useRef(false);

  const set = (patch: Partial<HostDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setFailure(null);
  };
  const setTicket = (key: string, patch: Partial<TicketDraft>) =>
    set({ tickets: draft.tickets.map((t) => (t.key === key ? { ...t, ...patch } : t)) });

  const back = () => {
    if (step > 0) {
      setErrors({});
      setStep((step - 1) as Step);
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

  const tickLive = verification.data ? mayHost(verification.data) : false;
  const loading = verification.isPending || options.isPending || tier.isPending;
  // A tier read that fails matters only when no live tick already opens the form; a refetch that fails after the form is up never replaces it.
  const failed =
    !verification.data && verification.isError
      ? verification.error
      : !options.data && options.isError
        ? options.error
        : verification.data && !tickLive && !tier.data && tier.isError
          ? tier.error
          : null;

  if (sent) return <Submitted name={sent.name} onDone={onDone} onMyEvents={onMine} />;

  if (!loading && !failed && verification.data && (refused || !(tickLive || tierRunning(tier.data)))) {
    return <HostGateScreen refusal={refused} onBack={onBack} onSeeTiers={onSeeTiers} />;
  }

  const opts = options.data;

  const advance = (o: EventOptions) => {
    const found = stepErrors(step, draft, o, now(), undefined, priceList);
    setErrors(found);
    if (hasErrors(found)) return;
    setStep((step + 1) as Step);
  };

  const send = async (o: EventOptions) => {
    if (inFlight.current) return;
    const at = now();
    const all: Errors = { ...stepErrors(0, draft, o, at), ...stepErrors(1, draft, o, at), ...stepErrors(2, draft, o, at, undefined, priceList) };
    setErrors(all);
    if (hasErrors(all)) {
      const firstBad = ([0, 1, 2] as Step[]).find((s) => hasErrors(stepErrors(s, draft, o, at, undefined, priceList)));
      if (firstBad !== undefined && firstBad !== step) setStep(firstBad);
      return;
    }
    inFlight.current = true;
    setSending(true);
    setFailure(null);
    try {
      const bannerUrl = banner ? await uploadBanner(banner) : null;
      const event = await createEvent(createBody(draft, bannerUrl));
      void client.invalidateQueries({ queryKey: eventsKey });
      setSent(event);
    } catch (error) {
      // An admin changed the price list while the picker was open: read it again; the Hub's own sentence is shown below.
      refetchIfNotOnList(client, error);
      if (isHostTierRefusal(error)) {
        // E21 is the answer, with the Hub's own words; what the app read about the tier and the tick is out of date.
        setRefused(error as HostTierRefusal);
        void client.invalidateQueries({ queryKey: verificationKey });
        void client.invalidateQueries({ queryKey: tierKey });
      } else {
        setFailure(isApiError(error) ? error.message : 'Your event was not sent. Try again.');
      }
    } finally {
      inFlight.current = false;
      setSending(false);
    }
  };

  const chooseBanner = async () => {
    const picked = await pickImage();
    if (picked) {
      setBanner(picked);
      setFailure(null);
    }
  };

  return (
    <View testID="host-screen" style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: insets.top }]}>
      <NavBar title="Host an event" onBack={back} backTestID="host-back" />
      <EventsTabs active="host" onChange={(tab) => (tab === 'discover' ? onDiscover() : tab === 'mine' ? onMine?.() : undefined)} />
      {loading ? (
        <HostSkeleton />
      ) : failed || !opts ? (
        <ErrorState
          testID="host-error"
          title="Couldn't open the host form"
          message={isApiError(failed) ? failed.message : 'Check your connection and try again.'}
          onRetry={() => {
            void verification.refetch();
            void options.refetch();
            void tier.refetch();
          }}
        />
      ) : (
        <>
          <ScrollView
            contentContainerStyle={[styles.body, { gap: step === 2 ? bodyMetrics.ticketsGap : bodyMetrics.between }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Stepper step={step} />
            {step === 0 ? (
              <Basics draft={draft} errors={errors} options={opts} set={set} openKind={() => setSheet('kind')} />
            ) : step === 1 ? (
              <WhenWhere
                draft={draft}
                errors={errors}
                options={opts}
                now={now()}
                set={set}
                open={setSheet}
                bannerUri={banner?.previewUri ?? null}
                onBanner={canPickImage ? chooseBanner : null}
              />
            ) : (
              <Tickets
                draft={draft}
                errors={errors}
                options={opts}
                setTicket={setTicket}
                add={() => set({ tickets: [...draft.tickets, newTicket()] })}
                remove={(key) => set({ tickets: draft.tickets.filter((t) => t.key !== key) })}
              />
            )}
          </ScrollView>
          <View style={[styles.foot, { backgroundColor: colors.surfacePage, paddingBottom: footMetrics.bottom + insets.bottom }]}>
            {failure ? (
              <Text variant="errorLine" tone="danger" accessibilityRole="alert" testID="host-failure">
                {failure}
              </Text>
            ) : null}
            {step < 2 ? (
              <Button testID="host-continue" label="Continue" full onPress={() => advance(opts)} />
            ) : (
              <Button testID="host-send" label="Send for review" full loading={sending} onPress={() => void send(opts)} />
            )}
          </View>
          <StepSheets sheet={sheet} setSheet={setSheet} draft={draft} options={opts} now={now()} set={set} />
        </>
      )}
    </View>
  );
}

const TIMES = timeChoices(PICKER.minutes);

/** The four pickers the steps open (kind, category, starts, ends), shared by the wizard and the edit screens. */
export function StepSheets({
  sheet,
  setSheet,
  draft,
  options,
  now,
  set,
}: {
  sheet: Sheet;
  setSheet: (s: Sheet) => void;
  draft: HostDraft;
  options: EventOptions;
  now: number;
  set: (p: Partial<HostDraft>) => void;
}) {
  // G-443: the end's day, from the start's day and the thirteen after it. The board draws one time; a day picker is built from the
  // start sheet's own parts (R-29), and leaving it on the first day is the board's event that ends on its start day.
  const start = draft.day;
  const endDays = useMemo(
    () => (start ? Array.from({ length: PICKER.endDays }, (_, i) => addDays(start, i)).map((d) => ({ value: d, label: dayLabel(d, now) })) : undefined),
    [start, now],
  );
  return (
    <>
      <ChoiceSheet
        visible={sheet === 'kind'}
        title="Kind"
        items={options.types}
        value={draft.kind}
        onPick={(kind) => {
          set({ kind });
          setSheet(null);
        }}
        onClose={() => setSheet(null)}
        testID="host-kind-sheet"
      />
      <ChoiceSheet
        visible={sheet === 'category'}
        title="Category"
        items={options.categories}
        value={draft.category}
        onPick={(category) => {
          set({ category });
          setSheet(null);
        }}
        onClose={() => setSheet(null)}
        testID="host-category-sheet"
      />
      <StartsSheet draft={draft} now={now} visible={sheet === 'starts'} set={set} close={() => setSheet(null)} />
      <WhenSheet
        visible={sheet === 'ends'}
        title="Ends"
        days={endDays}
        day={draft.day ? addDays(draft.day, draft.endDaysAfter ?? 0) : null}
        onDay={(day) => set({ endDaysAfter: draft.day ? daysBetween(draft.day, day) : 0 })}
        times={TIMES}
        time={draft.endTime}
        onTime={(endTime) => set({ endTime })}
        onClose={() => setSheet(null)}
        footer={<Button testID="host-ends-done" label="Done" full onPress={() => setSheet(null)} />}
        testID="host-ends-sheet"
      />
    </>
  );
}

function StartsSheet({ draft, now, visible, set, close }: { draft: HostDraft; now: number; visible: boolean; set: (p: Partial<HostDraft>) => void; close: () => void }) {
  const days = useMemo(() => dayChoices(now, PICKER.days).map((d) => ({ value: d, label: dayLabel(d, now) })), [now]);
  return (
    <WhenSheet
      visible={visible}
      title="Starts"
      days={days}
      day={draft.day}
      onDay={(day) => set({ day })}
      times={TIMES}
      time={draft.startTime}
      onTime={(startTime) => set({ startTime })}
      onClose={close}
      footer={<Button testID="host-starts-done" label="Done" full onPress={close} />}
      testID="host-starts-sheet"
    />
  );
}

export type StepProps = { draft: HostDraft; errors: Errors; options: EventOptions };

/** E13 · Basics. */
export function Basics({ draft, errors, options, set, openKind }: StepProps & { set: (p: Partial<HostDraft>) => void; openKind: () => void }) {
  const kind = options.types.find((t) => t.value === draft.kind)?.label ?? null;
  return (
    <>
      <TextField
        testID="host-name"
        label="Event name"
        value={draft.name}
        onChangeText={(name) => set({ name })}
        error={errors.name}
        maxLength={options.fields.nameMax}
      />
      <AreaField
        testID="host-description"
        label="What happens at it"
        value={draft.description}
        onChangeText={(description) => set({ description })}
        error={errors.description}
        maxLength={options.fields.descriptionMax}
      />
      <TextField
        testID="host-org"
        label="Who is running it"
        value={draft.hostOrg}
        onChangeText={(hostOrg) => set({ hostOrg })}
        error={errors.hostOrg}
        maxLength={options.fields.hostOrgMax}
      />
      <View style={styles.labelled}>
        <SectionLabel>Format</SectionLabel>
        <OptionRow label="Format" items={options.formats} value={draft.format} onChange={(format) => set({ format })} testID="host-format" />
      </View>
      <PickerField label="Kind" value={kind} placeholder="Pick a kind" icon="ChevronDown" onPress={openKind} error={errors.kind} testID="host-kind" />
    </>
  );
}

/** E14 · When and where. */
export function WhenWhere({
  draft,
  errors,
  options,
  now,
  set,
  open,
  bannerUri,
  onBanner,
}: StepProps & {
  now: number;
  set: (p: Partial<HostDraft>) => void;
  open: (s: Sheet) => void;
  bannerUri: string | null;
  onBanner: (() => void) | null;
}) {
  const category = options.categories.find((c) => c.value === draft.category)?.label ?? null;
  return (
    <>
      <View style={styles.pair}>
        <View style={styles.half}>
          <PickerField
            half
            label="Starts"
            value={draft.day && draft.startTime ? startLabel(draft.day, draft.startTime, now) : draft.day ? dayLabel(draft.day, now) : null}
            placeholder="Pick a day"
            icon="Calendar"
            onPress={() => open('starts')}
            error={errors.starts}
            testID="host-starts"
          />
        </View>
        <View style={styles.half}>
          <PickerField
            label="Ends"
            value={endShown(draft, now)}
            placeholder="Pick a time"
            icon="Clock"
            onPress={() => open('ends')}
            error={errors.ends}
            testID="host-ends"
          />
        </View>
      </View>
      <TextField
        testID="host-address"
        label="Street address"
        hint="Missing addresses are the top reason events get sent back."
        value={draft.address}
        onChangeText={(address) => set({ address })}
        error={errors.address}
      />
      {onBanner ? <BannerTile previewUri={bannerUri} onPress={onBanner} /> : null}
      <PickerField
        label="Category"
        value={category}
        placeholder="Pick a category"
        icon="ChevronDown"
        onPress={() => open('category')}
        error={errors.category}
        testID="host-category"
      />
    </>
  );
}

/** E15 · Tickets. With `locked` (a ticket has sold) every type is read-only and nothing that would be refused is offered: no add, no remove. */
export function Tickets({
  draft,
  errors,
  options,
  setTicket,
  add,
  remove,
  locked = false,
}: StepProps & { setTicket: (key: string, p: Partial<TicketDraft>) => void; add: () => void; remove: (key: string) => void; locked?: boolean }) {
  const { colors } = useWawu();
  const rules = options.tickets;
  return (
    <>
      {draft.tickets.map((t, i) => (
        <View key={t.key} testID={`host-ticket-${i}`} style={[styles.card, { backgroundColor: colors.surfaceCard, borderColor: colors.borderHairline }]}>
          {locked ? (
            <>
              <LockedField testID={`host-ticket-${i}-name`} label="What buyers see" value={t.name} />
              <View style={styles.pair}>
                <View style={styles.half}>
                  <LockedField testID={`host-ticket-${i}-price`} label="Price" value={priceShown(t.price)} />
                </View>
                <View style={styles.half}>
                  <LockedField testID={`host-ticket-${i}-quantity`} label="How many" value={t.quantity} />
                </View>
              </View>
            </>
          ) : (
            <>
              <TextField
                testID={`host-ticket-${i}-name`}
                label="What buyers see"
                value={t.name}
                onChangeText={(name) => setTicket(t.key, { name })}
                error={errors[`${t.key}.name`]}
                maxLength={rules.nameMaxLength}
              />
              <SegmentedTabs
                testID={`host-ticket-${i}-access`}
                label="Paid or free"
                items={ACCESS}
                value={t.price === '0' ? 'free' : 'paid'}
                // Free is a ₦0 ticket (R-8); paid starts empty and the picker offers its first price at once.
                onChange={(access) => setTicket(t.key, { price: access === 'free' ? '0' : '' })}
              />
              {t.price === '0' ? null : (
                <View testID={`host-ticket-${i}-price`}>
                  <PricePicker
                    testID={`host-ticket-${i}-picker`}
                    value={nairaOfDigits(t.price)}
                    onChange={(naira) => setTicket(t.key, { price: digitsOfNaira(naira) })}
                    label="Price"
                    earnSuffix="a ticket"
                    storeNote={false}
                    bleed={bodyMetrics.cardPad}
                  />
                  {errors[`${t.key}.price`] ? (
                    <Text variant="errorLine" tone="danger" accessibilityRole="alert">
                      {errors[`${t.key}.price`]}
                    </Text>
                  ) : null}
                </View>
              )}
              <TextField
                testID={`host-ticket-${i}-quantity`}
                label="How many"
                keyboardType="number-pad"
                value={t.quantity}
                onChangeText={(typed) => setTicket(t.key, { quantity: digitsOf(typed).replace(/^0+(?=\d)/, '') })}
                error={errors[`${t.key}.quantity`]}
              />
            </>
          )}
          {!locked && draft.tickets.length > 1 ? <RemoveLink onPress={() => remove(t.key)} testID={`host-ticket-${i}-remove`} /> : null}
        </View>
      ))}
      {errors.tickets ? (
        <Text variant="errorLine" tone="danger" accessibilityRole="alert">
          {errors.tickets}
        </Text>
      ) : null}
      {!locked && draft.tickets.length < rules.maxTypes ? <AddTicket onPress={add} /> : null}
      {locked ? null : (
        <Text variant="muted" testID="host-ticket-note">
          {ticketNote(rules)}
        </Text>
      )}
    </>
  );
}

function AddTicket({ onPress }: { onPress: () => void }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID="host-add-ticket"
      accessibilityRole="button"
      accessibilityLabel="Add a ticket type"
      onPress={onPress}
      {...ring.handlers}
      style={({ pressed }) => [
        styles.add,
        { borderColor: colors.borderStrong, backgroundColor: pressed ? colors.surfaceSunken : colors.surfacePage },
        ring.style,
      ]}
    >
      <Icon name="Plus" size={addMetrics.icon} color={colors.accentFg} strokeWidth={addMetrics.iconStroke} />
      <Text variant="linkStrong" style={{ fontSize: addMetrics.font }}>
        Add a ticket type
      </Text>
    </Pressable>
  );
}

function RemoveLink({ onPress, testID }: { onPress: () => void; testID: string }) {
  const ring = useFocusRing();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel="Remove this ticket type"
      hitSlop={space.md}
      onPress={onPress}
      {...ring.handlers}
      style={[styles.remove, ring.style]}
    >
      <Text variant="linkStrong" tone="danger">
        Remove
      </Text>
    </Pressable>
  );
}

/** What the wizard is until the Hub answers: the stepper and three fields' shapes. */
function HostSkeleton() {
  return (
    <LoadingView label="Loading the host form" testID="host-loading">
      <View style={styles.body}>
        <Skeleton height={space.s2xl} />
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} height={fieldMetrics.height} radius={fieldMetrics.radius} />
        ))}
      </View>
    </LoadingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignSelf: 'center', width: '100%', maxWidth: layout.screenW },
  body: { paddingHorizontal: layout.gutter, paddingTop: bodyMetrics.top, paddingBottom: bodyMetrics.top, gap: bodyMetrics.between },
  labelled: { gap: bodyMetrics.labelGap },
  pair: { flexDirection: 'row', gap: bodyMetrics.pairBetween },
  half: { flex: 1 },
  card: { borderRadius: radius.card, borderWidth: StyleSheet.hairlineWidth, padding: bodyMetrics.cardPad, gap: bodyMetrics.cardGap },
  add: {
    padding: addMetrics.pad,
    borderRadius: addMetrics.corner,
    borderWidth: addMetrics.ring,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: addMetrics.between,
  },
  remove: { alignSelf: 'flex-end' },
  foot: { paddingTop: footMetrics.top, paddingHorizontal: layout.gutter, gap: space.sm },
});
