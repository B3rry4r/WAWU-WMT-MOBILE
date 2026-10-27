import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, Share, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isApiError } from '@/api/errors';
import { Banner } from '@/components/Banner';
import { Button, IconButton } from '@/components/Button';
import { GroupedList } from '@/components/Card';
import { KeyValueRow } from '@/components/ListRow';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { StatusPill } from '@/components/StatusPill';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { CoverHeader, CoverShare, coverMetrics } from '@/features/communities/CoverHeader';
import { fetchRoom, roomKey, type RoomView } from '@/features/communities/api';
import { membersFull } from '@/features/communities/format';
import { openRoom } from '@/features/communities/routes';
import { RestoreRow, SaidBanner, StoreLoading, StoreUnready } from '@/features/store/StoreParts';
import { buyLabel, forDays } from '@/features/store/model';
import { useLadder } from '@/features/store/ladder/useLadder';
import { font, layout, space, useWawu } from '@/theme';

import { fetchHostHandle, fetchPass, hostKey, passKey, type PassView } from './api';
import { BLOCKED_LINE, endedLine, GATE_LINE, joinedLine, runningLine } from './model';

const GAP = 16;
const BODY_TOP = 26;

export type PassScreenProps = {
  id: string;
  onBack: () => void;
};

/**
 * I30 · Private, pay to join, and I31 · Joined (INBOX-14, R-63, R-86). One screen for a private room that sells a 30-day pass, read from
 * `GET /communities/{id}/pass` and the room: a person with no pass sees the STORE's price and buys it in the store sheet ("Join"); a member
 * sees "You're in" with the day the pass ends and one tap to renew; a person whose pass ended is shown the way back in ("Renew"). The host
 * is inside already. The pass end and the member count are the Hub's. A pass is bought ONCE for this room (IAP-03 round 2): nothing renews
 * it and nothing is charged by time, so renewing is buying again, and the new days stack behind the days left. There is no request to the host.
 */
export function PassScreen({ id, onBack }: PassScreenProps) {
  const { colors } = useWawu();
  const insets = useSafeAreaInsets();
  const room = useQuery({ queryKey: roomKey(id), queryFn: () => fetchRoom(id) });
  const pass = useQuery({ queryKey: passKey(id), queryFn: () => fetchPass(id), staleTime: 0 });
  const hostWawuId = room.data?.hostWawuId;
  const host = useQuery({ queryKey: hostKey(hostWawuId ?? ''), queryFn: () => fetchHostHandle(hostWawuId as string), enabled: Boolean(hostWawuId), retry: false });

  const retryAll = () => {
    void room.refetch();
    void pass.refetch();
  };
  const hidden = (isApiError(room.error) && room.error.status === 404) || (isApiError(pass.error) && pass.error.status === 404);
  const failed = (room.isError && !room.data) || (pass.isError && !pass.data);

  let content;
  if (hidden) {
    content = (
      <Plain onBack={onBack}>
        <EmptyState testID="pass-unavailable" icon="Ban" title="This community isn’t available" message="It may have been taken down, or you may not be able to see it." />
      </Plain>
    );
  } else if (failed) {
    const error = room.error ?? pass.error;
    content = (
      <Plain onBack={onBack}>
        <ErrorState
          testID="pass-error"
          title="Couldn’t open this community"
          message={isApiError(error) ? error.message : 'Something went wrong. Try again.'}
          icon={isApiError(error) && error.kind === 'network' ? 'WifiOff' : 'TriangleAlert'}
          onRetry={retryAll}
        />
      </Plain>
    );
  } else if (!room.data || !pass.data) {
    content = (
      <Plain onBack={onBack}>
        <LoadingView testID="pass-loading" label="Opening the community">
          <View style={styles.loading}>
            <Skeleton width={layout.screenW / 2} height={coverMetrics.pillHeight} />
            <Skeleton width="100%" height={space.xl * 4} />
          </View>
        </LoadingView>
      </Plain>
    );
  } else {
    content = <Loaded id={id} room={room.data} pass={pass.data} handle={host.data ?? null} onBack={onBack} />;
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.surfacePage }]} testID="pass-screen">
      {content}
      <View style={{ height: 0, paddingBottom: insets.bottom }} />
    </View>
  );
}

/** A bar with Back only: shown while the room or the pass has not been read, or cannot be. */
function Plain({ onBack, children }: { onBack: () => void; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.plain, { paddingTop: insets.top }]}>
      <View style={styles.bar}>
        <IconButton icon="ChevronLeft" label="Back" onPress={onBack} size={coverMetrics.glass} testID="pass-back" />
      </View>
      <View style={styles.center}>{children}</View>
    </View>
  );
}

function Loaded({ id, room, pass, handle, onBack }: { id: string; room: RoomView; pass: PassView; handle: string | null; onBack: () => void }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // R-101: a pass is a store purchase on the price ladder, at the room's list price (whole naira, on the Hub's list). The Hub says whether this
  // person can buy: the room sells a pass and they are not its host. The price drawn is the store's for that list price, never the list price.
  const ladder = useLadder();
  const { buyer } = ladder;
  const store = { state: ladder.state, refetch: ladder.refetch };
  const naira = pass.priceKobo !== null && pass.priceKobo % 100 === 0 ? pass.priceKobo / 100 : null;
  const selected = ladder.itemFor(naira);
  const credit = ladder.creditFor('pass', naira);
  const buyPass = (payWith?: 'credit') => (naira === null ? undefined : void buyer.buyLadder({ kind: 'pass', communityId: id, listPriceNaira: naira }, payWith));
  // A room that sells a pass and a person who cannot buy it: the host removed them (a pending row in a pass room, G-INBOX-24-6; R-63 has no
  // join request, and the host lets them back in with the existing approve). A removed member can still hold a pass that has days left (the
  // Hub keeps `active` true and turns `canBuy` and `canRenew` off), so the pass being active does not make them a member: what decides is
  // that the room sells a pass and this person, who is not the host, cannot buy it.
  const blocked = pass.sellsPass && !pass.isHost && !pass.canBuy;
  const verb = pass.canRenew || pass.passUntil ? 'Renew' : 'Join';
  const enter = () => openRoom(router, id);
  const sub = [membersFull(room.memberCount), handle ? `hosted by @${handle}` : null].filter(Boolean).join(' · ');
  const share = () => {
    void Share.share({ message: room.link }).catch(() => undefined);
  };
  const cover = <CoverHeader name={room.name} imageUrl={room.imageUrl} sub={sub} onBack={onBack} right={<CoverShare onPress={share} />} />;

  let body;
  let footer;
  if (buyer.granted) {
    // I31: the store took the payment, the Hub checked it with the store, and the person is in.
    body = <Joined headline="You’re in" line={joinedLine(buyer.granted.grant.until ?? buyer.granted.expiresAt)} />;
    footer = <Button label="Open the room" full onPress={enter} testID="pass-open" />;
  } else if (pass.isHost) {
    body = <Joined headline="You host this room" line="You are always inside, and members pay you for each pass." pill={false} />;
    footer = <Button label="Open the room" full onPress={enter} testID="pass-open" />;
  } else if (blocked) {
    body = (
      <>
        <EmptyState testID="pass-blocked" icon="Lock" title="Removed by the host" message={BLOCKED_LINE} />
      </>
    );
    footer = null;
  } else if (pass.active) {
    // I31 reopened: a running pass. Nothing renews it: Renew buys the next 30 days at the store's price, and they stack behind the days left.
    const problem = pass.canBuy && store.state.kind !== 'ready' && store.state.kind !== 'loading';
    body = (
      <>
        <Joined headline="You’re in" line={runningLine(pass.passUntil)} />
        {problem ? <StoreUnready state={store.state} onRetry={store.refetch} testID="pass-store" /> : null}
        <SaidBanner said={buyer.said} testID="pass-said" />
        {pass.canBuy && credit ? <CreditNote /> : null}
        <RestoreRow buyer={buyer} testID="pass-restore" communityId={id} />
      </>
    );
    footer = (
      <View style={styles.footerStack}>
        <Button label="Open the room" full onPress={enter} testID="pass-open" />
        {pass.canBuy && credit ? <Button testID="pass-use-credit" label={buyer.busy ? 'Working...' : 'Use your credit'} variant="secondary" full loading={buyer.busy} disabled={buyer.busy} onPress={() => buyPass('credit')} /> : null}
        {pass.canBuy && selected ? (
          <Button testID="pass-pay" label={buyer.busy ? 'Buying...' : buyLabel(selected, 'Renew')} variant="secondary" full loading={buyer.busy} disabled={buyer.busy} onPress={() => buyPass()} />
        ) : null}
      </View>
    );
  } else if (pass.sellsPass && pass.canBuy) {
    // I30: no pass running (new, or ended): the store's price for the pass.
    const ended = pass.canRenew && pass.passUntil !== null;
    body = (
      <>
        {ended ? (
          <View style={styles.head}>
            <Text variant="sheetTitleSm" testID="pass-ended-title">
              Your pass ended
            </Text>
            <Text variant="muted" testID="pass-ended-line">
              {endedLine(pass.passUntil)}
            </Text>
          </View>
        ) : (
          <Text variant="muted" testID="pass-gate-line">
            {GATE_LINE}
          </Text>
        )}
        {store.state.kind === 'loading' ? (
          <StoreLoading testID="pass-quote-loading" label="Loading the price" />
        ) : store.state.kind !== 'ready' || selected === null ? (
          <StoreUnready state={store.state.kind === 'ready' ? { kind: 'not_open', why: 'not_configured' } : store.state} onRetry={store.refetch} testID="pass-store" />
        ) : (
          <>
            <Details room={room} pass={pass} handle={handle} price={selected?.price ?? null} withCard />
            {credit ? <CreditNote /> : null}
          </>
        )}
        <SaidBanner said={buyer.said} testID="pass-said" />
        <RestoreRow buyer={buyer} testID="pass-restore" communityId={id} />
      </>
    );
    footer = selected ? (
      <View style={styles.footerStack}>
        {credit ? <Button testID="pass-use-credit" label={buyer.busy ? 'Working...' : 'Use your credit'} full loading={buyer.busy} disabled={buyer.busy} onPress={() => buyPass('credit')} /> : null}
        <Button testID="pass-pay" label={buyer.busy ? 'Buying...' : buyLabel(selected, verb)} variant={credit ? 'secondary' : 'primary'} full loading={buyer.busy && !credit} disabled={buyer.busy} onPress={() => buyPass()} />
      </View>
    ) : null;
  } else {
    // A private room that sells no pass: nothing here to pay for. The older join requests are not drawn (R-63).
    body = <EmptyState testID="pass-none" icon="Lock" title="This community is private" message="It isn’t selling passes right now." />;
    footer = null;
  }

  return (
    <>
      {cover}
      <ScrollView testID="pass-body" contentContainerStyle={[styles.body, { paddingTop: BODY_TOP, paddingBottom: space.xl }]} keyboardShouldPersistTaps="handled">
        {body}
      </ScrollView>
      {footer ? <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>{footer}</View> : null}
    </>
  );
}

/** R-101: a credit that covers the pass is offered first. A credit is never cash and can only be used on Who Made This. */
function CreditNote() {
  return <Banner tone="info" icon="Ticket" title="You have a credit" body="A credit from an earlier purchase pays for this pass. It can only be used on Who Made This." testID="pass-credit" />;
}

function Joined({ headline, line, pill = true }: { headline: string; line: string; pill?: boolean }) {
  return (
    <>
      <View style={styles.head}>
        <Text variant="sheetTitleSm" testID="pass-joined-title">
          {headline}
        </Text>
        <Text variant="muted" testID="pass-joined-line">
          {line}
        </Text>
      </View>
      {pill ? (
        <View style={styles.pillRow}>
          <StatusPill label="Member" tone="positive" icon="Check" />
        </View>
      ) : null}
    </>
  );
}

/** The price card: the store's own price for the pass, the members and the host. */
function Details({ room, pass, handle, price, withCard }: { room: RoomView; pass: PassView; handle: string | null; price: string | null; withCard: boolean }) {
  if (!withCard) return null;
  return (
    <GroupedList testID="pass-card">
      {pass.sellsPass && price ? <KeyValueRow label="Price" value={[price, forDays(pass.periodDays)].filter(Boolean).join(' ')} testID="pass-price" /> : null}
      <KeyValueRow label="Members" value={String(room.memberCount)} testID="pass-members" />
      {handle ? <KeyValueRow label="Host" value={`@${handle}`} testID="pass-host" /> : null}
    </GroupedList>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  plain: { flex: 1 },
  bar: { paddingHorizontal: space.md, paddingVertical: space.sm, flexDirection: 'row' },
  center: { flex: 1, justifyContent: 'center', paddingHorizontal: layout.gutter },
  loading: { gap: space.md, paddingHorizontal: layout.gutter },
  body: { paddingHorizontal: layout.gutter, gap: GAP },
  head: { gap: space.xs },
  pillRow: { flexDirection: 'row' },
  footer: { paddingHorizontal: layout.gutter, paddingTop: space.md },
  footerStack: { gap: space.md },
  retry: { gap: space.sm, alignItems: 'flex-start' },
});
