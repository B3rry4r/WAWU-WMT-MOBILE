import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, type ReactNode } from 'react';
import { ScrollView, Share, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isApiError } from '@/api/client';
import { Avatar } from '@/components/Avatar';
import { Button, IconButton } from '@/components/Button';
import { Icon, VerifiedTick } from '@/components/icon';
import { Money } from '@/components/Money';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { canvasNormalLineHeight, font, layout, radius, space, useWawu } from '@/theme';

import { detailKey, fetchEvent, fetchTickets, ticketsKey, type EventView, type TicketType } from './api';
import {
  basketCount,
  basketTotal,
  maxQuantity,
  quantityOf,
  ticketCount,
  tierStatus,
  venueOf,
  whenLine,
  withQuantity,
  type Basket,
} from './format';
import { useGoing } from './going';
import { DateBadge, GoingButton } from './parts';
import { TicketRow } from './TicketRow';

/** design/_gen/events.js `detailTop` and `detailBody`: a 230 picture, 20 sides, 16 between the parts, a 22 title, 22 and 16 icons in the card. */
export const detailMetrics = {
  cover: 230,
  title: 22,
  titleTracking: -0.025,
  titleLeading: 1.15,
  cardPadV: 14,
  cardPadH: 16,
  cardGap: 10,
  inline: 8,
  icon: 16,
  host: 22,
  tick: 14,
  info: 14,
  footTop: 12,
  footBottom: 34,
  count: 12,
  labelSize: 11,
  total: 20,
  topInset: 6,
  fadeEnd: 0.4,
  stack: 16,
  tight: 2,
} as const;

export type EventDetailScreenProps = {
  id: string;
  onBack: () => void;
};

/** E2 · Event, and E9 when every tier has sold: when and where, who hosts it, Going, the tiers with a stepper each, and the running total. */
export function EventDetailScreen({ id, onBack }: EventDetailScreenProps) {
  const { colors } = useWawu();
  const insets = useSafeAreaInsets();
  const event = useQuery({ queryKey: detailKey(id), queryFn: () => fetchEvent(id) });
  const tickets = useQuery({
    queryKey: ticketsKey(id),
    queryFn: () => fetchTickets(id),
    enabled: event.data?.ticketed === true,
  });
  const going = useGoing();
  const [picked, setPicked] = useState<Basket | null>(null);
  const [now] = useState(() => Date.now());

  if (event.isPending) return <DetailSkeleton onBack={onBack} />;
  if (event.isError) {
    // A link that is not an event id is refused by the Hub's validator (400); it reads the same as a missing event.
    const gone = isApiError(event.error) && (event.error.kind === 'not_found' || event.error.kind === 'validation');
    return (
      <Frame onBack={onBack} insetTop={insets.top}>
        {gone ? (
          <EmptyState
            testID="event-gone"
            icon="CalendarX"
            title="This event is not available"
            message="It may have been taken down or never existed."
          />
        ) : (
          <ErrorState
            testID="event-error"
            title="Couldn't load this event"
            message={isApiError(event.error) ? event.error.message : 'Check your connection and try again.'}
            onRetry={() => void event.refetch()}
          />
        )}
      </Frame>
    );
  }

  const data = event.data;
  const called = data.cancelledAt !== null;
  const tiers: readonly TicketType[] = tickets.data ?? [];
  // Tiers that can be bought come first; the ones that cannot (sold out, ended) follow, each group in the Hub's order.
  const rows = tiers
    .map((tier) => ({ tier, status: tierStatus(tier, data, now) }))
    .sort((a, b) => Number(b.status.open) - Number(a.status.open));
  const buyable = rows.filter((r) => r.status.open && !called).map((r) => r.tier);
  const allSold = tiers.length > 0 && tiers.every((t) => t.soldOut || t.remaining <= 0);
  const soldBar = allSold && !called;
  const basket: Basket = picked ?? (buyable[0] ? { [buyable[0].id]: 1 } : {});
  const count = basketCount(basket);
  const total = basketTotal(buyable, basket);

  const share = () => {
    const message = [data.name, whenLine(data.startsAt, data), venueOf(data)].filter(Boolean).join('\n');
    Share.share({ message }).catch(() => undefined);
  };

  return (
    <View testID="event-screen" style={[styles.root, { backgroundColor: colors.surfacePage }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: buyable.length > 0 || soldBar ? layout.tabbarH + insets.bottom : insets.bottom + space.s2xl }}
      >
        <Cover event={data} insetTop={insets.top} onBack={onBack} onShare={share} />
        <View style={styles.body}>
          <View style={styles.titleRow}>
            <DateBadge startsAt={data.startsAt} zone={data} />
            <Text variant="body" accessibilityRole="header" style={[font(700), styles.title]}>
              {data.name}
            </Text>
          </View>
          <View style={[styles.card, { backgroundColor: colors.surfaceCard, borderColor: colors.borderHairline }]}>
            <InfoLine icon="Clock" text={whenLine(data.startsAt, data)} />
            {venueOf(data) ? <InfoLine icon="MapPin" text={venueOf(data)} /> : null}
            <View style={styles.hostLine}>
              <Avatar name={data.hostOrg} hue="lilac" size={detailMetrics.host} decorative />
              <Text variant="body" numberOfLines={1} style={[styles.infoText, styles.hostName]}>
                {data.hostOrg}
              </Text>
              {data.hostVerification.creator.verified || data.hostVerification.professional.verified ? (
                <VerifiedTick kind={data.hostVerification.creator.verified ? 'creator' : 'pro'} size={detailMetrics.tick} />
              ) : null}
              <View style={styles.spacer} />
              <GoingButton
                testID="event-going"
                going={data.userGoing}
                name={data.name}
                busy={going.busy.has(data.id)}
                onPress={() => void going.toggle(data.id)}
              />
            </View>
          </View>
          {going.failure ? (
            <Text variant="errorLine" accessibilityRole="alert" testID="event-going-error">
              {going.failure}
            </Text>
          ) : null}
          {called ? (
            <Text variant="muted" testID="event-called-off">
              This event was called off.
            </Text>
          ) : data.ticketed ? (
            <View>
              <Text variant="label" style={styles.sectionLabel}>
                Tickets
              </Text>
              {tickets.isPending ? (
                <LoadingView label="Loading tickets" testID="tickets-loading">
                  <View style={styles.tierSkeletons}>
                    <Skeleton height={detailMetrics.cover / 4} />
                    <Skeleton height={detailMetrics.cover / 4} />
                  </View>
                </LoadingView>
              ) : tickets.isError ? (
                <ErrorState
                  testID="tickets-error"
                  title="Couldn't load the tickets"
                  message={isApiError(tickets.error) ? tickets.error.message : 'Check your connection and try again.'}
                  onRetry={() => void tickets.refetch()}
                />
              ) : (
                <>
                  {rows.map(({ tier, status }) => (
                    <TicketRow
                      key={tier.id}
                      tier={tier}
                      status={status}
                      quantity={status.open ? quantityOf(basket, tier.id) : 0}
                      max={maxQuantity(tier)}
                      onChange={(q) => setPicked(withQuantity(basket, tier, q))}
                    />
                  ))}
                  {allSold ? (
                    <Text variant="muted" testID="event-sold-out" style={styles.soldNote}>
                      Every ticket for this event has sold.
                    </Text>
                  ) : buyable.length === 0 && tiers.length > 0 ? (
                    <Text variant="muted" testID="event-closed" style={styles.soldNote}>
                      Tickets are not on sale right now.
                    </Text>
                  ) : null}
                </>
              )}
            </View>
          ) : null}
        </View>
      </ScrollView>
      {soldBar ? (
        <View
          testID="event-sold-bar"
          style={[
            styles.foot,
            { backgroundColor: colors.surfacePage, paddingBottom: Math.max(insets.bottom, detailMetrics.footBottom) },
          ]}
        >
          <Button label="Sold out" full disabled onPress={() => void tickets.refetch()} testID="event-sold-button" />
        </View>
      ) : null}
      {buyable.length > 0 ? (
        <View
          testID="event-total"
          style={[
            styles.foot,
            {
              backgroundColor: colors.surfacePage,
              paddingBottom: Math.max(insets.bottom, detailMetrics.footBottom),
            },
          ]}
        >
          <Text variant="body" tone="textMuted" style={{ fontSize: detailMetrics.count }}>
            {ticketCount(count)}
          </Text>
          {total === 0 && count > 0 ? (
            <Text variant="body" style={[font(600), { fontSize: detailMetrics.total }]}>
              Free
            </Text>
          ) : (
            <Money minorUnits={total} size={detailMetrics.total} decimals={false} testID="event-total-amount" />
          )}
        </View>
      ) : null}
    </View>
  );
}

function InfoLine({ icon, text }: { icon: 'Clock' | 'MapPin'; text: string }) {
  const { colors } = useWawu();
  return (
    <View style={styles.infoLine}>
      <Icon name={icon} size={detailMetrics.icon} color={colors.textMuted} />
      <Text variant="body" style={styles.infoText}>
        {text}
      </Text>
    </View>
  );
}

type CoverProps = { event: EventView; insetTop: number; onBack: () => void; onShare: () => void };

/** The picture across the top with a soft fade under the two round buttons. */
function Cover({ event, insetTop, onBack, onShare }: CoverProps) {
  const { colors, gradients } = useWawu();
  const fade = gradients.scrimFeed;
  return (
    <View style={[styles.cover, { backgroundColor: colors.surfaceCardInk }]}>
      {event.bannerUrl ? (
        <Image source={event.bannerUrl} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityElementsHidden />
      ) : null}
      <LinearGradient
        pointerEvents="none"
        colors={[fade.colors[0], fade.colors[1]]}
        locations={[0, detailMetrics.fadeEnd]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.coverBar, { paddingTop: insetTop + detailMetrics.topInset }]}>
        <IconButton icon="ChevronLeft" label="Back" tone="glass" onPress={onBack} testID="event-back" />
        <IconButton icon="Share" label="Share this event" tone="glass" onPress={onShare} testID="event-share" />
      </View>
    </View>
  );
}

/** The bar and a message, where the event could not be drawn. */
function Frame({ onBack, insetTop, children }: { onBack: () => void; insetTop: number; children: ReactNode }) {
  const { colors } = useWawu();
  return (
    <View style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: insetTop + detailMetrics.topInset }]}>
      <View style={styles.frameBar}>
        <IconButton icon="ChevronLeft" label="Back" onPress={onBack} testID="event-back" />
      </View>
      {children}
    </View>
  );
}

function DetailSkeleton({ onBack }: { onBack: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <Frame onBack={onBack} insetTop={insets.top}>
      <LoadingView label="Loading the event" testID="event-loading">
        <View style={styles.body}>
          <Skeleton height={detailMetrics.cover / 2} radius={radius.card} />
          <Skeleton width="70%" height={detailMetrics.title} />
          <Skeleton height={detailMetrics.cover / 2} radius={radius.card} />
        </View>
      </LoadingView>
    </Frame>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignSelf: 'center', width: '100%', maxWidth: layout.screenW },
  cover: { height: detailMetrics.cover },
  coverBar: { paddingHorizontal: layout.gutter, flexDirection: 'row', justifyContent: 'space-between' },
  frameBar: { paddingHorizontal: layout.gutter, alignItems: 'flex-start' },
  body: { paddingHorizontal: layout.gutter, gap: detailMetrics.stack },
  titleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: space.md },
  title: {
    flex: 1,
    fontSize: detailMetrics.title,
    letterSpacing: detailMetrics.titleTracking * detailMetrics.title,
    lineHeight: detailMetrics.title * detailMetrics.titleLeading,
  },
  card: {
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: detailMetrics.cardPadV,
    paddingHorizontal: detailMetrics.cardPadH,
    gap: detailMetrics.cardGap,
  },
  infoLine: { flexDirection: 'row', alignItems: 'center', gap: detailMetrics.inline },
  infoText: { fontSize: detailMetrics.info, lineHeight: canvasNormalLineHeight(detailMetrics.info), flexShrink: 1 },
  hostLine: { flexDirection: 'row', alignItems: 'center', gap: detailMetrics.inline },
  hostName: { flexShrink: 1 },
  spacer: { flex: 1 },
  sectionLabel: { lineHeight: canvasNormalLineHeight(detailMetrics.labelSize) },
  tierSkeletons: { gap: space.md },
  soldNote: { paddingTop: space.lg },
  foot: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: detailMetrics.footTop,
    paddingHorizontal: layout.gutter,
    gap: detailMetrics.tight,
  },
});
