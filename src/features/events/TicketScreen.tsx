import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isApiError } from '@/api/client';
import { Button } from '@/components/Button';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { layout, radius, space } from '@/theme';

import { boostBrightness, canBoostBrightness } from './brightness';
import { checkedInLine, position } from './ticketFormat';
import { cardMetrics, Note, Page, RefreshFailed, TicketCard, TicketNav } from './ticketParts';
import { fetchHeldTicket, heldTicketKey, isTicketId } from './ticketsApi';

/** design/_gen/events.js `ticketView`: 14 between the note, the card and the line under it. */
const bodyGap = 14;

export type TicketScreenProps = {
  id: string;
  onBack: () => void;
  onOpenTicket: (ticketId: string) => void;
};

/**
 * E7 · Ticket QR, and E12 once the door has scanned it: the event, the QR the door reads, the code, and who it is for.
 * A ticket in the same order and tier is one tap away. A link that is not a ticket id never reaches the Hub.
 */
export function TicketScreen({ id, onBack, onOpenTicket }: TicketScreenProps) {
  const insets = useSafeAreaInsets();
  const valid = isTicketId(id);
  const ticket = useQuery({ queryKey: heldTicketKey(id), queryFn: () => fetchHeldTicket(id), enabled: valid });
  const [now] = useState(() => Date.now());
  const status = ticket.data?.status;

  useEffect(() => (status === 'valid' && canBoostBrightness ? boostBrightness() : undefined), [status]);

  const frame = (body: React.ReactNode) => (
    <Page testID="ticket-screen" insetTop={insets.top}>
      <TicketNav title="Ticket" onBack={onBack} backTestID="ticket-back" />
      {body}
    </Page>
  );

  if (!valid || (ticket.isError && isApiError(ticket.error) && ticket.error.kind === 'not_found')) {
    return frame(
      <EmptyState
        testID="ticket-gone"
        icon="Ticket"
        title="This ticket is not available"
        message="It may belong to someone else, or it was never issued."
      />,
    );
  }
  if (ticket.isPending) {
    return frame(
      <LoadingView label="Loading the ticket" testID="ticket-loading">
        <View style={styles.body}>
          <Skeleton height={cardMetrics.banner + cardMetrics.plate + cardMetrics.pad * 2 + cardMetrics.stack * 2} radius={radius.money} />
        </View>
      </LoadingView>,
    );
  }
  if (ticket.isError && !ticket.data) {
    const offline = isApiError(ticket.error) && ticket.error.kind === 'network';
    return frame(
      <ErrorState
        testID="ticket-error"
        title={offline ? "You're offline" : "Couldn't load this ticket"}
        message={isApiError(ticket.error) ? ticket.error.message : 'Check your connection and try again.'}
        onRetry={() => void ticket.refetch()}
      />,
    );
  }

  const data = ticket.data;
  const offlineNow = ticket.isError && isApiError(ticket.error) && ticket.error.kind === 'network';
  const void_ = data.status === 'void';
  const checkedIn = data.status === 'checked_in' && data.checkedInAt !== null;
  const where = position(data);

  return frame(
    <ScrollView contentContainerStyle={[styles.body, { paddingBottom: space.s3xl + insets.bottom }]} showsVerticalScrollIndicator={false}>
      {ticket.isError ? (
        <RefreshFailed
          testID="ticket-refresh-failed"
          message={offlineNow ? "You're offline. This ticket may be out of date." : "Couldn't refresh. This ticket may be out of date."}
          onRetry={() => void ticket.refetch()}
        />
      ) : null}
      {checkedIn ? (
        <Note
          testID="ticket-checked-in"
          tone="info"
          icon="CircleCheck"
          title="Already checked in"
          body={`${checkedInLine(data.checkedInAt as string, data.event, now)}.`}
        />
      ) : null}
      {void_ ? (
        <Note
          testID="ticket-void"
          tone="warning"
          icon="CircleAlert"
          title="This ticket is not valid"
          body={data.event.cancelledAt ? 'The event was called off, so this ticket cannot be used.' : 'This ticket cannot be used at the door.'}
        />
      ) : null}
      <TicketCard ticket={data} showCode={!void_} now={now} />
      {canBoostBrightness && data.status === 'valid' ? (
        <Text variant="muted" style={styles.centered} testID="ticket-brightness">
          Brightness goes up when this opens.
        </Text>
      ) : null}
      {where ? (
        <View style={styles.pager} testID="ticket-pager">
          <Text variant="muted" accessibilityRole="header">{`Ticket ${where.index} of ${where.count}`}</Text>
          <View style={styles.pagerButtons}>
            {where.previous ? (
              <Button testID="ticket-previous" label="Previous" icon="ChevronLeft" variant="secondary" size="md" onPress={() => onOpenTicket(where.previous as string)} />
            ) : null}
            {where.next ? (
              <Button testID="ticket-next" label="Next" iconRight="ChevronRight" variant="secondary" size="md" onPress={() => onOpenTicket(where.next as string)} />
            ) : null}
          </View>
        </View>
      ) : null}
    </ScrollView>,
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: layout.gutter, paddingTop: space.sm, gap: bodyGap },
  centered: { textAlign: 'center' },
  pager: { alignItems: 'center', gap: space.md },
  pagerButtons: { flexDirection: 'row', gap: space.md },
});
