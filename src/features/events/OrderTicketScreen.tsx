import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isApiError } from '@/api/client';
import { Banner } from '@/components/Banner';
import { Button, IconButton } from '@/components/Button';
import { Icon } from '@/components/icon';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { Toast } from '@/components/Toast';
import { font, layout, radius, space, useWawu } from '@/theme';

import { detailKey, fetchEvent } from './api';
import { fetchOrder, walletOrderKey, type WalletOrder } from './buyApi';
import { CONFIRMING_LINE, CONFIRMING_TITLE, FAILED_TITLE, failedLine } from './buyModel';
import { addToCalendar } from './calendar';
import { CALLED_OFF_TITLE, refundBannerBody } from './ticketFormat';
import { cardMetrics, navMetrics, Note, Page, TicketCard } from './ticketParts';
import type { HeldTicket } from './ticketsApi';

/** design/_gen/events.js `ticketView`: 14 between the note, the card and the line under it. */
const bodyGap = 14;
const POLL_MS = 4000;

export type OrderTicketScreenProps = {
  orderId: string;
  /** The close button: back to where the person was before buying. */
  onClose: () => void;
  /** My tickets (E6). */
  onMyTickets: () => void;
};

/** An order's ticket as the ticket card draws it: the Hub's own order answer, one ticket at a time. */
function heldOf(order: WalletOrder, index: number): HeldTicket {
  const ticket = order.tickets[index];
  return {
    id: ticket.id,
    orderId: order.id,
    code: ticket.code,
    status: ticket.status,
    checkedInAt: null,
    tierName: ticket.tierName,
    holderName: order.holderName,
    event: {
      id: order.event.id,
      name: order.event.name,
      startsAt: order.event.startsAt,
      endsAt: order.event.endsAt,
      timezone: order.event.timezone,
      timeLabel: order.event.timeLabel,
      format: 'in_person',
      location: order.event.location,
      venueName: order.event.venueName,
      bannerUrl: order.event.bannerUrl,
      status: 'published',
      cancelledAt: null,
    },
    siblings: [],
  };
}

/**
 * E5 · Ticket, the success after paying: "You're in. Show this at the door.", the QR the door reads, the code, the tier and who it
 * is for, Add to calendar and My tickets. It reads the order by its id (`GET /events/orders/wallet/{id}`), so it is the same page for
 * a free ticket, a paid one, and one that was still confirming a minute ago (read again until the Hub has decided). An order with
 * several tickets shows them one at a time.
 */
export function OrderTicketScreen({ orderId, onClose, onMyTickets }: OrderTicketScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useWawu();
  const order = useQuery({
    queryKey: walletOrderKey(orderId),
    queryFn: () => fetchOrder(orderId),
    refetchInterval: (query) => (query.state.data?.status === 'processing' ? POLL_MS : false),
  });
  const [index, setIndex] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  // E11: an order that ended refunded, or whose tickets were all voided, may belong to an event the host called off. The order carries no
  // such flag, so the event is read for it (`cancelledAt`); the plain failed or "not valid" words stand until it says so, or if it cannot be read.
  const orderEventId = order.data?.event.id ?? '';
  const failed = order.data?.status === 'failed';
  const allVoid = order.data?.status === 'paid' && order.data.tickets.length > 0 && order.data.tickets.every((t) => t.status === 'void');
  const event = useQuery({ queryKey: detailKey(orderEventId), queryFn: () => fetchEvent(orderEventId), enabled: failed || allVoid, retry: false });
  const calledOff = Boolean(event.data?.cancelledAt) || event.data?.status === 'cancelled';

  const frame = (body: React.ReactNode, title = 'Your ticket') => (
    <Page testID="order-ticket-screen" insetTop={insets.top}>
      <View style={styles.nav}>
        <IconButton icon="X" label="Close" onPress={onClose} testID="order-ticket-close" />
        <Text variant="body" accessibilityRole="header" numberOfLines={1} style={[styles.navTitle, font(700)]}>
          {title}
        </Text>
        <View style={styles.navSpacer} />
      </View>
      {body}
    </Page>
  );

  const loading = frame(
    <LoadingView label="Loading your ticket" testID="order-ticket-loading">
      <View style={styles.body}>
        <Skeleton height={cardMetrics.banner + cardMetrics.plate + cardMetrics.pad * 2 + cardMetrics.stack * 2} radius={radius.money} />
      </View>
    </LoadingView>,
  );
  if (order.isPending) return loading;
  if (order.isError) {
    if (isApiError(order.error) && order.error.kind === 'not_found') {
      return frame(
        <EmptyState testID="order-ticket-gone" icon="Ticket" title="This order is not available" message="It may belong to someone else, or it was never made." />,
      );
    }
    return frame(
      <ErrorState
        testID="order-ticket-error"
        title="Couldn't load your ticket"
        message={isApiError(order.error) ? order.error.message : 'Check your connection and try again.'}
        onRetry={() => void order.refetch()}
      />,
    );
  }

  const data = order.data;
  if (data.status === 'processing') {
    return frame(
      <View style={styles.body}>
        <Banner tone="warning" icon="Clock" title={CONFIRMING_TITLE} body={CONFIRMING_LINE} testID="order-ticket-confirming" />
        <Button label="Refresh" icon="RotateCcw" full loading={order.isFetching} onPress={() => void order.refetch()} testID="order-ticket-refresh" />
      </View>,
    );
  }
  if (data.status === 'failed') {
    if (event.isLoading) {
      return loading;
    }
    if (calledOff) {
      // The same state the ticket page draws for the same purchase (E11): the event was called off and what came back to the wallet.
      return frame(
        <View style={styles.body}>
          <Banner tone="danger" icon="CalendarX" title={CALLED_OFF_TITLE} body={(data.returned ? refundBannerBody(data) : null) ?? failedLine(data)} testID="order-ticket-called-off" />
        </View>,
      );
    }
    return frame(
      <View style={styles.body}>
        <Banner tone="danger" title={FAILED_TITLE} body={failedLine(data)} testID="order-ticket-failed" />
      </View>,
    );
  }
  if (data.status !== 'paid' || data.tickets.length === 0) {
    return frame(
      <EmptyState testID="order-ticket-unpaid" icon="Ticket" title="No tickets yet" message="This order has not been paid." />,
    );
  }

  if (allVoid && event.isLoading) {
    return loading;
  }
  const at = Math.min(index, data.tickets.length - 1);
  const many = data.tickets.length > 1;
  const calendar = async () => {
    if (!(await addToCalendar(data.event))) setNotice("We couldn't open your calendar.");
  };

  return frame(
    <>
      <ScrollView contentContainerStyle={[styles.body, styles.scroll]} showsVerticalScrollIndicator={false}>
        {allVoid && calledOff ? (
          <Banner tone="danger" icon="CalendarX" title={CALLED_OFF_TITLE} body={(data.returned ? refundBannerBody(data) : null) ?? 'The event was called off, so this ticket cannot be used.'} testID="order-ticket-called-off" />
        ) : allVoid ? (
          <Note testID="order-ticket-void" tone="warning" icon="CircleAlert" title="This ticket is not valid" body="This ticket cannot be used at the door." />
        ) : (
          <View testID="order-ticket-note" accessibilityRole="summary" style={[styles.note, { backgroundColor: colors.successTint }]}>
            <Icon name="CircleCheck" size={20} color={colors.success} strokeWidth={2.2} />
            <Text variant="kvValue">{"You're in. Show this at the door."}</Text>
          </View>
        )}
        <TicketCard ticket={heldOf(data, at)} showCode={data.tickets[at].status !== 'void'} />
        {many ? (
          <View style={styles.pager} testID="order-ticket-pager">
            <Text variant="muted" accessibilityRole="header">{`Ticket ${at + 1} of ${data.tickets.length}`}</Text>
            <View style={styles.pagerButtons}>
              {at > 0 ? (
                <Button testID="order-ticket-previous" label="Previous" icon="ChevronLeft" variant="secondary" size="md" onPress={() => setIndex(at - 1)} />
              ) : null}
              {at < data.tickets.length - 1 ? (
                <Button testID="order-ticket-next" label="Next" iconRight="ChevronRight" variant="secondary" size="md" onPress={() => setIndex(at + 1)} />
              ) : null}
            </View>
          </View>
        ) : null}
      </ScrollView>
      <View style={[styles.foot, { paddingBottom: Math.max(insets.bottom, space.s3xl) }]}>
        <View style={styles.flex}>
          <Button label="Add to calendar" icon="CalendarPlus" variant="secondary" full onPress={() => void calendar()} testID="order-ticket-calendar" />
        </View>
        <View style={styles.flex}>
          <Button label="My tickets" full onPress={onMyTickets} testID="order-ticket-mine" />
        </View>
      </View>
      <Toast message={notice} tone="alert" placement="top" lines={2} duration={4000} onHide={() => setNotice(null)} testID="order-ticket-notice" />
    </>,
    many ? 'Your tickets' : 'Your ticket',
  );
}

const styles = StyleSheet.create({
  nav: { height: navMetrics.height, paddingHorizontal: layout.gutter, flexDirection: 'row', alignItems: 'center', gap: space.md },
  navTitle: { flex: 1, textAlign: 'center', fontSize: navMetrics.title, paddingTop: navMetrics.titleNudge, letterSpacing: navMetrics.titleTracking * navMetrics.title },
  navSpacer: { width: navMetrics.button },
  body: { paddingHorizontal: layout.gutter, paddingTop: space.sm, gap: bodyGap },
  scroll: { paddingBottom: space.lg },
  note: { flexDirection: 'row', alignItems: 'center', gap: space.md, borderRadius: radius.tile, paddingVertical: space.md + 2, paddingHorizontal: space.lg },
  pager: { alignItems: 'center', gap: space.md },
  pagerButtons: { flexDirection: 'row', gap: space.md },
  foot: { flexDirection: 'row', gap: space.md, paddingHorizontal: layout.gutter, paddingTop: space.md },
  flex: { flex: 1 },
});
