import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isApiError } from '@/api/client';
import { Button } from '@/components/Button';
import { Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { fieldMetrics } from '@/components/TextField';
import { layout, space, useWawu } from '@/theme';

import { detailKey, eventsKey, fetchEvent, fetchOptions, fetchTickets, optionsKey, ticketsKey } from '../api';
import { NavBar } from '../chrome';
import { dashboardKey, fetchDashboard, saveTicketTypes } from '../organiser/organiserApi';
import { Tickets } from './HostScreen';
import { Submitted, footMetrics } from './HostEnds';
import { HostGateScreen } from './HostGateScreen';
import { ReviewSheet } from './ReviewSheet';
import { emptyDraft, hasErrors, newTicket, ticketDraftOf, ticketErrors, ticketsChanged, tiersBody, type Errors, type TicketDraft } from './hostForm';
import { isHostTierRefusal, type HostTierRefusal } from './hostTier';

/** E15's body: 12 between the ticket cards. */
const bodyMetrics = { top: 14, between: 12 } as const;

export type TicketTypesScreenProps = {
  id: string;
  onBack: () => void;
  /** Done, as the wizard's own "Sent for review" end has it. */
  onDone: () => void;
  /** The end's My events button (E17, where the event now reads In review). */
  onMine?: () => void;
  /** E21's See tiers opens VF5. The button is not drawn without it. */
  onSeeTiers?: () => void;
};

/** The Hub's rule in the app's words (R-79 (c)): once a ticket has sold, a ticket type's price and places stay as they are. */
export const SOLD_LINE = 'A ticket has sold, so the price and places of a ticket type cannot change.';

/**
 * E18's Ticket types: the wizard's Tickets step (E15) filled from the types on sale. While no ticket has sold, Save sends the whole list to
 * `PUT /events/{id}/tickets`, which puts the event back in review (a sheet says so first). Once a ticket has sold, every type is read-only
 * with one line of why, and nothing that the Hub would refuse is offered. A refusal that still arrives (a sale between the read and the
 * save) is shown in the Hub's own words and the screen re-reads what has sold.
 */
export function TicketTypesScreen({ id, onBack, onDone, onMine, onSeeTiers }: TicketTypesScreenProps) {
  const { colors } = useWawu();
  const insets = useSafeAreaInsets();
  const client = useQueryClient();
  const event = useQuery({ queryKey: detailKey(id), queryFn: () => fetchEvent(id), retry: false });
  const options = useQuery({ queryKey: optionsKey, queryFn: fetchOptions });
  // Read again on every visit: a ticket sold since E18 was drawn decides whether these types can change.
  const types = useQuery({ queryKey: ticketsKey(id), queryFn: () => fetchTickets(id), staleTime: 0 });
  const dash = useQuery({ queryKey: dashboardKey(id), queryFn: () => fetchDashboard(id), staleTime: 0, retry: false });

  const [edits, setEdits] = useState<TicketDraft[] | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [confirm, setConfirm] = useState(false);
  const [sending, setSending] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [refused, setRefused] = useState<HostTierRefusal | null>(null);
  const inFlight = useRef(false);
  const mounted = useRef(true);
  useEffect(() => () => void (mounted.current = false), []);

  const opts = options.data;
  const held = types.data;
  const original: TicketDraft[] = held ? held.map(ticketDraftOf) : [];
  // The Hub refuses a change as soon as any type has sold, a retired one included: the sold figure on E18 covers that case.
  const sold = (held ?? []).some((t) => t.sold > 0) || (dash.data?.ticketsSold ?? 0) > 0;
  // Once a ticket has sold the Hub's own list is what is shown, whatever the person had typed.
  const rows = sold ? original : (edits ?? original);

  const change = (next: TicketDraft[]) => {
    setEdits(next);
    setFailure(null);
  };
  const setTicket = (key: string, patch: Partial<TicketDraft>) => change(rows.map((t) => (t.key === key ? { ...t, ...patch } : t)));

  const review = () => {
    if (!opts) return;
    const found = ticketErrors(rows, opts.tickets);
    setErrors(found);
    if (!hasErrors(found)) setConfirm(true);
  };

  const send = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setSending(true);
    setFailure(null);
    try {
      await saveTicketTypes(id, tiersBody(rows));
      void client.invalidateQueries({ queryKey: eventsKey });
      if (mounted.current) setSent(true);
    } catch (error) {
      if (!mounted.current) return;
      setConfirm(false);
      if (isHostTierRefusal(error)) {
        setRefused(error as HostTierRefusal);
      } else {
        setFailure(isApiError(error) ? error.message : 'Your ticket types were not saved. Try again.');
        // "Tickets have already sold" (409): re-read what has sold, so the screen shows the types as the Hub holds them, locked.
        if (isApiError(error) && error.status === 409) {
          void client.invalidateQueries({ queryKey: ticketsKey(id) });
          void client.invalidateQueries({ queryKey: dashboardKey(id) });
        }
      }
    } finally {
      inFlight.current = false;
      if (mounted.current) setSending(false);
    }
  };

  if (sent) return <Submitted name={event.data?.name ?? 'Your event'} onDone={onDone} onMyEvents={onMine} />;
  if (refused) return <HostGateScreen refusal={refused} onBack={onBack} onSeeTiers={onSeeTiers} />;

  const failed = (!held && types.isError ? types.error : null) ?? (!opts && options.isError ? options.error : null);
  const loading = types.isPending || options.isPending || dash.isPending;
  const changed = ticketsChanged(rows, original);

  return (
    <View testID="ticket-types-screen" style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: insets.top }]}>
      <NavBar title="Ticket types" subtitle={event.data?.name} onBack={onBack} backTestID="ticket-types-back" />
      {loading ? (
        <View style={styles.body} testID="ticket-types-loading">
          {[0, 1].map((i) => (
            <Skeleton key={i} height={fieldMetrics.height * 2 + space.xl} />
          ))}
        </View>
      ) : failed || !held || !opts ? (
        <ErrorState
          testID="ticket-types-error"
          title="Couldn't open the ticket types"
          message={isApiError(failed) ? failed.message : 'Check your connection and try again.'}
          onRetry={() => {
            void types.refetch();
            void options.refetch();
            void dash.refetch();
          }}
        />
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {sold ? (
              <Text variant="muted" testID="ticket-types-locked">
                {SOLD_LINE}
              </Text>
            ) : null}
            <Tickets
              draft={{ ...emptyDraft(), tickets: rows }}
              errors={errors}
              options={opts}
              setTicket={setTicket}
              add={() => change([...rows, newTicket()])}
              remove={(key) => change(rows.filter((t) => t.key !== key))}
              locked={sold}
            />
          </ScrollView>
          <View style={[styles.foot, { backgroundColor: colors.surfacePage, paddingBottom: footMetrics.bottom + insets.bottom }]}>
            {failure ? (
              <Text variant="errorLine" tone="danger" accessibilityRole="alert" testID="ticket-types-failure">
                {failure}
              </Text>
            ) : null}
            {sold ? (
              <Button testID="ticket-types-done" label="Done" full onPress={onBack} />
            ) : (
              <Button testID="ticket-types-save" label="Save ticket types" full disabled={!changed} onPress={review} />
            )}
          </View>
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
