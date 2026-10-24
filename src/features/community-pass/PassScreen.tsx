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
import { Money } from '@/components/Money';
import { PaySheet, formatNaira } from '@/components/pay-sheet';
import { PAYMENT_UNANSWERED_LINE, PinSheet } from '@/components/pin-sheet';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { StatusPill } from '@/components/StatusPill';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { breakdownOf } from '@/features/credits/model';
import { CoverHeader, CoverShare, coverMetrics } from '@/features/communities/CoverHeader';
import { fetchRoom, roomKey, type RoomView } from '@/features/communities/api';
import { membersFull } from '@/features/communities/format';
import { openRoom } from '@/features/communities/routes';
import { addMoneyHref } from '@/features/addmoney/entry';
import { WalletRow } from '@/features/money-attempt/WalletRow';
import { TOTAL_LABEL, WALLET_LABEL } from '@/features/money-attempt/refusal';
import { OPEN_WALLET_PIN_PATH, useOpenWalletEntry } from '@/features/open-wallet/entry';
import { layout, space, useWawu } from '@/theme';

import { fetchHostHandle, fetchPass, fetchPassQuote, hostKey, passKey, passQuoteKey, type PassView } from './api';
import { endedLine, GATE_LINE, joinedLine, payLabel, priceLine, runningLine, STILL_CONFIRMING_LINE } from './model';
import { usePassPurchase } from './usePassPurchase';

const GAP = 16;
const BODY_TOP = 26;

export type PassScreenProps = {
  id: string;
  onBack: () => void;
};

/**
 * I30 · Private, pay to join, and I31 · Joined (INBOX-14, R-63). One screen for a private room that sells a monthly pass, read from
 * `GET /communities/{id}/pass` and the room: a person with no pass sees the host's price and pays it from the wallet with the PIN
 * ("Join"); a member sees "You're in" with the day the pass ends and one tap to renew; a person whose pass ended is shown the way back
 * in ("Renew"). The host is inside already. The price, the pass end and the member count are the Hub's, and the total with the bank's
 * charge and WAWU's fee comes from the Hub's quote, never added up here. There is no request to the host and nothing is debited by time:
 * a pass is paid for by a PIN-confirmed tap.
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
  const wallet = useOpenWalletEntry();
  // The Hub says whether this person can pay: the room sells a pass and they are not its host.
  const buy = usePassPurchase({
    id,
    enabled: pass.canBuy,
    onOpenWallet: wallet.open,
    onSetPin: () => router.push(OPEN_WALLET_PIN_PATH),
    onForgotPin: () => router.push('/reset-pin'),
    // A short wallet opens W15 with what is missing (WALLET-05); the route asks for the price again when the person comes back.
    onAddMoney: (short) => router.push(addMoneyHref(short)),
  });
  const quote = buy.quote;
  // A room that sells a pass and a person who cannot buy it: the host removed them (a pending row in a pass room, G-INBOX-24-6; R-63 has no
  // join request, and the host lets them back in with the existing approve). The Hub says why in its own words on the pass quote, so they
  // are read from there and shown under "Removed by the host", with no Pay and no way to buy back in.
  // A removed member can still hold a pass that has days left (the Hub keeps `active` true and turns `canBuy` and `canRenew` off), so the pass
  // being active does not make them a member: what decides is that the room sells a pass and this person, who is not the host, cannot buy it.
  const blocked = pass.sellsPass && !pass.isHost && !pass.canBuy;
  const why = useQuery({ queryKey: [...passQuoteKey(id), 'blocked'], queryFn: () => fetchPassQuote(id), enabled: blocked, retry: false, staleTime: 0, gcTime: 0 });
  const verb = pass.canRenew || pass.passUntil ? 'Renew' : 'Join';
  const enter = () => openRoom(router, id);
  const sub = [membersFull(room.memberCount), handle ? `hosted by @${handle}` : null].filter(Boolean).join(' · ');
  const share = () => {
    void Share.share({ message: room.link }).catch(() => undefined);
  };
  const cover = <CoverHeader name={room.name} imageUrl={room.imageUrl} sub={sub} onBack={onBack} right={<CoverShare onPress={share} />} />;

  // The shared pay sheet draws the states the landing does not: still confirming and a refusal (a refunded pass is one).
  if (quote && pass.canBuy && (buy.confirming || buy.status.kind === 'failed')) {
    const status = buy.confirming ? ({ kind: 'confirming', line: STILL_CONFIRMING_LINE } as const) : buy.status.kind === 'failed' ? buy.status : ({ kind: 'review' } as const);
    return (
      <>
        {cover}
        <PaySheet
          visible
          item={{ title: room.name, subtitle: `${quote.periodDays} days` }}
          amountKobo={quote.payment.priceKobo}
          amountLabel="Price"
          fees={breakdownOf(quote.payment)}
          wallet={buy.balanceKobo === null ? { kind: 'loading' } : { kind: 'open', balanceKobo: buy.balanceKobo }}
          walletName={WALLET_LABEL}
          actionLabel={verb}
          status={status}
          onPay={() => void buy.pay()}
          onAddMoney={buy.addMoney}
          onCancel={onBack}
          onRetry={buy.dismissFailed}
          onRefresh={buy.refresh}
        />
      </>
    );
  }

  const pin = quote ? (
    <PinSheet
      visible={buy.pinOpen}
      onClose={buy.closePin}
      approval={{ totalKobo: quote.payment.totalKobo, purpose: `a ${quote.periodDays} day pass` }}
      onSubmit={buy.submitPin}
      unansweredLine={PAYMENT_UNANSWERED_LINE}
      onForgotPin={buy.forgotPin}
      lockedUntil={buy.lockedUntil}
    />
  ) : null;

  let body;
  let footer;
  if (buy.bought) {
    // I31: the pass is paid and the person is in.
    body = <Joined headline="You’re in" line={joinedLine(buy.bought.totalKobo, buy.bought.passUntil)} />;
    footer = <Button label="Open the room" full onPress={enter} testID="pass-open" />;
  } else if (pass.isHost) {
    body = <Joined headline="You host this room" line="You are always inside, and members pay you for each pass." pill={false} />;
    footer = <Button label="Open the room" full onPress={enter} testID="pass-open" />;
  } else if (blocked) {
    body = why.isPending ? (
      <Skeleton width="100%" height={space.xl * 3} testID="pass-blocked-loading" />
    ) : (
      <EmptyState
        testID="pass-blocked"
        icon="Lock"
        title="Removed by the host"
        message={isApiError(why.error) && why.error.message ? why.error.message : 'A pass can’t be bought here right now.'}
      />
    );
    footer = null;
  } else if (pass.active) {
    // I31 reopened: a running pass, with one tap to renew.
    body = <Joined headline="You’re in" line={runningLine(pass.passUntil)} />;
    footer = (
      <View style={styles.footerStack}>
        <Button label="Open the room" full onPress={enter} testID="pass-open" />
        {pass.canBuy ? (
          <Button
            label={payLabel('Renew', quote ? quote.payment.totalKobo : null)}
            variant="secondary"
            full
            loading={buy.tapping}
            disabled={buy.tapping || (!quote && !buy.noWallet)}
            onPress={() => void buy.pay()}
            testID="pass-pay"
          />
        ) : null}
      </View>
    );
    body = (
      <>
        {body}
        <Details room={room} pass={pass} handle={handle} buy={buy} withCard={false} />
      </>
    );
  } else if (pass.sellsPass && pass.canBuy) {
    // I30: no pass running (new, or ended): the host's price and the wallet it is paid from.
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
        <Details room={room} pass={pass} handle={handle} buy={buy} withCard />
      </>
    );
    footer = (
      <Button
        testID="pass-pay"
        label={quote ? payLabel(verb, quote.payment.totalKobo) : pass.priceKobo !== null ? `${verb} · ${priceLine(pass.priceKobo)}` : verb}
        full
        loading={buy.tapping}
        disabled={buy.tapping || (!quote && !buy.noWallet) || (buy.shortfallKobo > 0 && quote !== null)}
        onPress={() => void buy.pay()}
      />
    );
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
      {pin}
    </>
  );
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

/** The price card, the bank's charge and WAWU's fee from the Hub's quote, and the wallet it is paid from (or what is missing). */
function Details({ room, pass, handle, buy, withCard }: { room: RoomView; pass: PassView; handle: string | null; buy: ReturnType<typeof usePassPurchase>; withCard: boolean }) {
  const quote = buy.quote;
  const short = quote !== null && buy.balanceKobo !== null && buy.shortfallKobo > 0;
  return (
    <>
      {withCard ? (
        <GroupedList testID="pass-card">
          {pass.priceKobo !== null ? <KeyValueRow label="Price" value={priceLine(pass.priceKobo)} testID="pass-price" /> : null}
          <KeyValueRow label="Members" value={String(room.memberCount)} testID="pass-members" />
          {handle ? <KeyValueRow label="Host" value={`@${handle}`} testID="pass-host" /> : null}
        </GroupedList>
      ) : null}
      {quote ? (
        <GroupedList testID="pass-breakdown">
          {breakdownOf(quote.payment).map((line) => (
            <KeyValueRow key={line.label} label={line.label} value={<Money minorUnits={line.amountKobo} size={14.5} decimals />} />
          ))}
          <KeyValueRow label={TOTAL_LABEL} value={<Money minorUnits={quote.payment.totalKobo} size={14.5} decimals />} testID="pass-total" />
        </GroupedList>
      ) : buy.quoteLoading ? (
        <Skeleton width="100%" height={space.xl * 3} testID="pass-quote-loading" />
      ) : null}
      {short && quote && buy.balanceKobo !== null ? (
        <Banner
          tone="warning"
          icon="Wallet"
          title={`Not enough in your ${WALLET_LABEL}`}
          body={`This costs ${formatNaira(quote.payment.totalKobo)}. You have ${formatNaira(buy.balanceKobo, 'always')}.`}
          testID="pass-short"
        />
      ) : buy.noWallet ? (
        <Banner tone="warning" icon="Wallet" title="You need a wallet to pay" body="Open your wallet, then come back to join." testID="pass-no-wallet" />
      ) : (
        <WalletRow balanceKobo={buy.balanceKobo} />
      )}
      {short && buy.addMoney ? <Button testID="pass-add" label={`Add ${formatNaira(buy.shortfallKobo)}`} icon="Plus" full onPress={buy.addMoney} /> : null}
      {buy.notice ? (
        <Text variant="errorLine" tone="danger" accessibilityRole="alert" testID="pass-notice">
          {buy.notice}
        </Text>
      ) : null}
      {buy.quoteError ? (
        <View style={styles.retry}>
          <Text variant="errorLine" tone="danger" accessibilityRole="alert" testID="pass-quote-error">
            We couldn’t get the price. Try again.
          </Text>
          <Button label="Try again" variant="secondary" size="sm" onPress={buy.retryQuote} />
        </View>
      ) : null}
    </>
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
