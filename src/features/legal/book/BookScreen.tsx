import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { useFocusRing } from '@/components/focusRing';
import { IconTile } from '@/components/IconTile';
import { Money } from '@/components/Money';
import { formatNaira } from '@/components/pay-sheet';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { ListSection } from '@/components/ListRow';
import { font, layout, useWawu } from '@/theme';

import { normal } from '../look';
import { matterKeys } from '../matter/api';
import { matterMetrics as m } from '../look2';
import { PaySheets } from '../pay/PaySheets';
import { useLegalFeePay, type FeePayArgs } from '../pay/useLegalFeePay';
import { LegalFrame } from '../ui';
import { bookConsultation, bookKeys, fetchOptions, fetchSlots, type SlotMedium } from './api';
import { consultationTitle, dayChips, horizonWords, isCall, mediumRows, pickedLine, sheetSubtitle, type DayChip, type MediumRow } from './model';

export type BookArgs = {
  requestId: string;
  onBack: () => void;
  /** The consultation is paid, or an in-person request was made: the matter (S20). */
  onBooked: () => void;
  wallet: Pick<FeePayArgs, 'onOpenWallet' | 'onSetPin' | 'onForgotPin' | 'onAddMoney'>;
};

const sentence = (error: unknown, fallback: string) => (isApiError(error) && error.message ? error.message : fallback);

/**
 * S18 · Book, S19 · Pay (over it) and S25 · No slots: choose how (video, phone or in person, each with the length and price WAWU set, R-14), then
 * the day and the hour from the Hub's calendar for that kind of call, then Pay. Pay holds the hour on the person's own request (nothing is charged),
 * asks the Hub for a fresh quote, and opens the shared pay sheet and PIN sheet. When the calendar has nothing free, S25 says so and offers an
 * in-person request, which the Hub records and WAWU arranges by email.
 */
export function BookScreen({ requestId, onBack, onBooked, wallet }: BookArgs) {
  const client = useQueryClient();
  const options = useQuery({ queryKey: bookKeys.options, queryFn: fetchOptions, staleTime: 0 });
  const rows = useMemo(() => mediumRows(options.data?.options ?? []), [options.data]);

  const [picked, setPicked] = useState<MediumRow['medium'] | null>(null);
  const medium = rows.find((r) => r.medium === picked) ?? rows[0] ?? null;
  const call = medium && isCall(medium.medium) ? medium.medium : null;
  const slots = useQuery({
    queryKey: bookKeys.slots((call ?? 'zoom') as SlotMedium),
    queryFn: () => fetchSlots(call as SlotMedium),
    enabled: call !== null,
    staleTime: 0,
  });
  const days = useMemo(() => (slots.data ? dayChips(slots.data) : []), [slots.data]);
  const [dayDate, setDayDate] = useState<string | null>(null);
  const [slotAt, setSlotAt] = useState<string | null>(null);
  const day = days.find((d) => d.date === dayDate) ?? days[0] ?? null;
  const slot = day?.slots.find((s) => s.startsAt === slotAt && s.available) ?? null;

  const [booking, setBooking] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const tapping = useRef(false);

  const pay = useLegalFeePay({
    requestId,
    onPaid: () => {
      onBooked();
    },
    ...wallet,
  });

  const choose = (next: MediumRow['medium']) => {
    setPicked(next);
    setSlotAt(null);
    setDayDate(null);
  };

  const noSlots = call !== null && slots.isSuccess && days.length === 0;
  const inPerson = rows.find((r) => r.medium === 'physical') ?? null;

  /** Holds the hour (or records the in-person request) on the person's request. Resolves true when the Hub took it. */
  const hold = async (): Promise<boolean> => {
    if (!medium) return false;
    try {
      await bookConsultation(requestId, call && slot ? { medium: call, scheduledFor: slot.startsAt } : { medium: 'physical' });
      void client.invalidateQueries({ queryKey: matterKeys.request(requestId) });
      return true;
    } catch (error) {
      setProblem(sentence(error, 'We could not hold that time. Check your connection and try again.'));
      if (call) {
        setSlotAt(null);
        void slots.refetch();
      }
      return false;
    }
  };

  const submit = async () => {
    if (tapping.current || !medium) return;
    tapping.current = true;
    setBooking(true);
    setProblem(null);
    try {
      if (!(await hold())) return;
      await pay.start();
    } finally {
      tapping.current = false;
      setBooking(false);
    }
  };

  let label = 'Pay';
  let ready = false;
  if (medium) {
    if (medium.medium === 'physical' && medium.priceKobo === null) {
      label = 'Request in person';
      ready = true;
    } else if (noSlots) {
      label = 'Request in person';
      ready = inPerson !== null;
    } else {
      label = medium.priceKobo === null ? 'Pay' : `Pay ${formatNaira(medium.priceKobo)}`;
      ready = medium.medium === 'physical' || slot !== null;
    }
  }
  // S25's button asks for an in-person hour whatever card is chosen: the call has none.
  const asksInPerson = label === 'Request in person';
  const submitInPerson = async () => {
    if (tapping.current || !inPerson) return;
    tapping.current = true;
    setBooking(true);
    setProblem(null);
    try {
      await bookConsultation(requestId, { medium: 'physical' });
      void client.invalidateQueries({ queryKey: matterKeys.request(requestId) });
      onBooked();
    } catch (error) {
      setProblem(sentence(error, 'We could not send your request. Check your connection and try again.'));
    } finally {
      tapping.current = false;
      setBooking(false);
    }
  };

  const foot =
    medium !== null ? (
      <Button
        label={label}
        onPress={() => void (asksInPerson ? submitInPerson() : submit())}
        disabled={!ready}
        loading={booking || pay.loading}
        full
        testID="legal-book-pay"
      />
    ) : undefined;

  return (
    <>
      <LegalFrame title="Book your consultation" onBack={onBack} foot={foot} testID="legal-book">
        {options.isPending ? (
          <Loading />
        ) : options.isError ? (
          <ErrorState
            testID="legal-book-error"
            title="We couldn't load the consultations"
            message={sentence(options.error, 'Check your connection, then try again.')}
            onRetry={() => void options.refetch()}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            testID="legal-book-empty"
            icon="CalendarX"
            title="No consultations right now"
            message="Consultations are not open for booking at the moment. Check back soon."
          />
        ) : (
          <>
            <ListSection title="How" testID="legal-book-how">
              <View style={styles.cards}>
                {rows.map((row) => (
                  <MediumCard key={row.medium} row={row} on={row.medium === medium?.medium} onPress={() => choose(row.medium)} />
                ))}
              </View>
            </ListSection>
            {noSlots && slots.data ? (
              <Banner
                tone="info"
                icon="CalendarX"
                title={`No slots in the next ${horizonWords(slots.data.horizonDays)}`}
                body={inPerson ? "Choose in person and we'll arrange a time by email." : 'Try again later.'}
                testID="legal-book-no-slots"
              />
            ) : null}
            {call !== null && !noSlots ? (
              <When
                loading={slots.isPending}
                failed={slots.isError}
                onRetry={() => void slots.refetch()}
                days={days}
                day={day}
                slotAt={slot?.startsAt ?? null}
                onDay={(d) => {
                  setDayDate(d);
                  setSlotAt(null);
                }}
                onSlot={setSlotAt}
                timeZone={slots.data?.timeZone ?? 'Africa/Lagos'}
              />
            ) : null}
            {problem ? <Banner tone="danger" title="Not booked" body={problem} testID="legal-book-problem" /> : null}
            {pay.problem ? <Banner tone="danger" title="We couldn't ask for the price" body={pay.problem} testID="legal-book-fee-problem" /> : null}
            {pay.notice ? <Banner tone="warning" title="Check the total" body={pay.notice} testID="legal-book-notice" /> : null}
          </>
        )}
      </LegalFrame>
      {medium ? (
        <PaySheets
          pay={pay}
          title={consultationTitle(medium.medium)}
          subtitle={sheetSubtitle(slot?.startsAt ?? null, slots.data?.minutes ?? null)}
        />
      ) : null}
    </>
  );
}

function Loading() {
  return (
    <View testID="legal-book-loading" accessibilityLabel="Loading" style={styles.cards}>
      <Skeleton height={72} radius={m.mediumCorner} />
      <Skeleton height={72} radius={m.mediumCorner} />
      <Skeleton height={72} radius={m.mediumCorner} />
    </View>
  );
}

/** `medium`: the tile, the kind and its line, and its price (or "On request"). The chosen one is tinted and ringed in the accent. */
function MediumCard({ row, on, onPress }: { row: MediumRow; on: boolean; onPress: () => void }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID={`legal-medium-${row.medium}`}
      accessibilityRole="radio"
      accessibilityState={{ selected: on }}
      accessibilityLabel={`${row.title}, ${row.sub}${row.priceKobo === null ? ', on request' : `, ${formatNaira(row.priceKobo)}`}`}
      onPress={onPress}
      {...ring.handlers}
      style={[
        styles.medium,
        {
          backgroundColor: on ? colors.accentTint : colors.surfaceCard,
          boxShadow: [
            { offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: on ? m.mediumRing : 1, color: on ? colors.accent : colors.borderHairline, inset: true },
          ],
        },
        ring.style,
      ]}
    >
      <IconTile icon={row.icon} tone={on ? 'accent' : 'neutral'} size={m.mediumTile} />
      <View style={styles.flex}>
        <Text variant="body" style={[font(600), { fontSize: m.mediumTitle, lineHeight: normal(m.mediumTitle) }]}>
          {row.title}
        </Text>
        <Text variant="body" tone="textMuted" style={{ fontSize: m.mediumSub, lineHeight: normal(m.mediumSub), marginTop: m.mediumSubTop }}>
          {row.sub}
        </Text>
      </View>
      {row.priceKobo === null ? (
        <Text variant="meta">On request</Text>
      ) : (
        <Money minorUnits={row.priceKobo} size={m.mediumPrice} weight={700} decimals={row.priceKobo % 100 !== 0} />
      )}
    </Pressable>
  );
}

type WhenProps = {
  loading: boolean;
  failed: boolean;
  onRetry: () => void;
  days: DayChip[];
  day: DayChip | null;
  slotAt: string | null;
  onDay: (date: string) => void;
  onSlot: (startsAt: string) => void;
  timeZone: string;
};

/** `When`: the days (a row that runs off the edge), the hours of the chosen day three to a row, and the pick in words. */
function When({ loading, failed, onRetry, days, day, slotAt, onDay, onSlot, timeZone }: WhenProps) {
  const { colors } = useWawu();
  let body;
  if (loading) {
    body = (
      <View testID="legal-when-loading" accessibilityLabel="Loading times" style={styles.days}>
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} width={m.dayWidth} height={m.dayPadY * 2 + m.dayName + m.dayNumber + m.dayGap} radius={m.dayCorner} />
        ))}
      </View>
    );
  } else if (failed) {
    body = <ErrorState testID="legal-when-error" title="We couldn't load the times" message="Check your connection, then try again." onRetry={onRetry} />;
  } else {
    body = (
      <>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.days} style={styles.daysScroll} testID="legal-days">
          {days.map((d) => (
            <DayButton key={d.date} d={d} on={d.date === day?.date} onPress={() => onDay(d.date)} />
          ))}
        </ScrollView>
        <View style={styles.slots}>
          {day?.slots.map((s) => {
            const on = s.startsAt === slotAt;
            return (
              <Pressable
                key={s.startsAt}
                testID={`legal-slot-${s.time}`}
                accessibilityRole="button"
                accessibilityLabel={s.available ? s.time : `${s.time}, taken`}
                accessibilityState={{ selected: on, disabled: !s.available }}
                disabled={!s.available}
                onPress={() => onSlot(s.startsAt)}
                style={[
                  styles.slot,
                  !s.available
                    ? { backgroundColor: colors.surfaceSunken }
                    : on
                      ? { backgroundColor: colors.accent }
                      : { boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: m.slotRing, color: colors.borderStrong, inset: true }] },
                ]}
              >
                <Text variant="body" style={[font(600), { fontSize: m.slotText, lineHeight: normal(m.slotText), color: !s.available ? colors.textDisabled : on ? colors.textOnAccent : colors.textPrimary }]}>
                  {s.time}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {slotAt ? (
          <Text variant="body" tone="textMuted" testID="legal-picked" style={{ fontSize: m.pickedText, lineHeight: normal(m.pickedText) }}>
            {pickedLine(slotAt, timeZone)}
          </Text>
        ) : null}
      </>
    );
  }
  return (
    <ListSection title="When" testID="legal-book-when">
      <View style={styles.when}>{body}</View>
    </ListSection>
  );
}

function DayButton({ d, on, onPress }: { d: DayChip; on: boolean; onPress: () => void }) {
  const { colors } = useWawu();
  return (
    <Pressable
      testID={`legal-day-${d.date}`}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      accessibilityLabel={`${d.weekday} ${d.day}`}
      onPress={onPress}
      style={[
        styles.day,
        on
          ? { backgroundColor: colors.textPrimary }
          : { backgroundColor: colors.surfaceCard, boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 1, color: colors.borderHairline, inset: true }] },
      ]}
    >
      <Text variant="body" style={[font(600), { fontSize: m.dayName, lineHeight: normal(m.dayName), opacity: 0.7, color: on ? colors.surfacePage : colors.textPrimary }]}>
        {d.weekday}
      </Text>
      <Text variant="body" style={[font(700), { fontSize: m.dayNumber, lineHeight: normal(m.dayNumber), color: on ? colors.surfacePage : colors.textPrimary }]}>
        {d.day}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  cards: { gap: m.cardsGap },
  medium: { flexDirection: 'row', alignItems: 'center', gap: m.mediumGap, padding: m.mediumPad, borderRadius: m.mediumCorner },
  when: { gap: m.whenGap },
  // The row of days runs to the screen's edge (`margin-right: -20px` in the canvas).
  daysScroll: { marginRight: -layout.gutter },
  days: { flexDirection: 'row', gap: m.daysGap, paddingRight: layout.gutter },
  day: { width: m.dayWidth, borderRadius: m.dayCorner, paddingVertical: m.dayPadY, alignItems: 'center', gap: m.dayGap },
  slots: { flexDirection: 'row', flexWrap: 'wrap', gap: m.slotsGap },
  slot: { width: '31.7%', height: m.slotHeight, borderRadius: m.slotCorner, alignItems: 'center', justifyContent: 'center' },
});
