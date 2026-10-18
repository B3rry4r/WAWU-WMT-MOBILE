import { Pressable, StyleSheet, View } from 'react-native';

import { Banner } from '@/components/Banner';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { GroupedList } from '@/components/Card';
import { IconTile } from '@/components/IconTile';
import { KeyValueRow } from '@/components/ListRow';
import { Money } from '@/components/Money';
import { formatNaira, PaySheet } from '@/components/pay-sheet';
import { PAYMENT_UNANSWERED_LINE, PinSheet } from '@/components/pin-sheet';
import { Skeleton } from '@/components/Skeleton';
import { StatusPill } from '@/components/StatusPill';
import { Text } from '@/components/Text';
import { WalletRow } from '@/features/money-attempt/WalletRow';
import { useOpenWalletEntry } from '@/features/open-wallet/entry';
import { TOTAL_LABEL, WALLET_LABEL } from '@/features/money-attempt/refusal';
import { font, radius, space, useWawu } from '@/theme';

import type { CreditPack } from './api';
import { addedLine, badgeWords, breakdownOf, buyLabel, creditCount, SHEET_LINE, SHEET_TITLE, STILL_CONFIRMING_LINE } from './model';
import { useBuyCredits, type BuyCreditsArgs } from './useBuyCredits';

/**
 * design/_gen/inbox.js lines 79 and 80: a pack is a 20 radius card, 14 by 12 inside, 6 between its parts: the badge pill (a 26 high gap
 * when there is none, so the counts line up), the count at 26 / 700 with -0.03em, "credits" at 12 muted and the price at 15; the chosen
 * pack has the accent tint and a 1.5 accent ring, the others a 1 hairline. The packs are 8 apart. The wallet row is kit.js line 69.
 */
const packMetrics = { corner: radius.media, padV: 14, padH: 12, between: 6, badge: 26, count: 26, countTracking: -0.03, unit: 12, price: 15, ringOn: 1.5, ringOff: 1, row: 8 } as const;
const addedMetrics = { tile: 72, tileGlyph: 32 } as const;
const SHEET_GAP = 16;

export type BuyCreditsSheetProps = Omit<BuyCreditsArgs, 'onOpenWallet'> & {
  /** What I29's button says: "Back to chat" in a room, "Done" anywhere else. */
  doneLabel: string;
  /** The credits were added: the host reads its own copy of the balance again. */
  onAdded?: () => void;
  /** Leave the sheet and open Open your wallet. Left out, the shared entry is used. */
  onOpenWallet?: () => void;
};

/**
 * I28 · Buy WAWU Credits and I29 · Credits added (INBOX-13), over whatever opened them (a room, the communities list). The sheet
 * is the packs, the bank's charge and the total from the Hub's quote, "Pay from wallet" and "Buy N credits · total"; the PIN is the
 * shared PIN sheet. A purchase the Hub has not finished and a refusal are the shared pay sheet's own states. A short wallet is not: the packs
 * stay drawn, so a person can pick a smaller one, and the "Not enough" note and Add money speak for the chosen pack only.
 */
export function BuyCreditsSheet(props: BuyCreditsSheetProps) {
  const entry = useOpenWalletEntry();
  const buy = useBuyCredits({ ...props, onOpenWallet: props.onOpenWallet ?? entry.open });
  const { visible, onClose, doneLabel } = props;
  const quote = buy.quote;
  const chosen = buy.list.find((candidate) => candidate.pack === buy.pack) ?? null;
  const credits = chosen?.credits ?? quote?.credits ?? 0;
  // The wallet cannot pay for the chosen pack: its quote says so (or the Hub did after the PIN). Another pack may still be affordable.
  const short = quote !== null && buy.balanceKobo !== null && buy.shortfallKobo > 0;

  const close = () => {
    onClose();
    if (buy.added) props.onAdded?.();
    buy.reset();
  };

  const pin =
    quote && visible ? (
      <PinSheet
        visible={buy.pinOpen}
        onClose={buy.closePin}
        approval={{ totalKobo: quote.payment.totalKobo, purpose: `${creditCount(quote.credits)} credits` }}
        onSubmit={buy.submitPin}
        unansweredLine={PAYMENT_UNANSWERED_LINE}
        onForgotPin={buy.forgotPin}
        lockedUntil={buy.lockedUntil}
      />
    ) : null;

  if (buy.added) {
    return (
      <BottomSheet visible={visible} onClose={close} label="Credits added" gap={SHEET_GAP} testID="credits-added">
        <View style={styles.added}>
          <IconTile icon="Coins" tone="in" size={addedMetrics.tile} />
          <Text variant="sheetTitle" style={styles.centre} testID="credits-added-title">
            {`${creditCount(buy.added.credits)} credits added`}
          </Text>
          <Text variant="muted" style={styles.centre} testID="credits-added-line">
            {addedLine(buy.added.totalKobo, buy.added.balance)}
          </Text>
        </View>
        <Button label={doneLabel} full onPress={close} testID="credits-added-done" />
      </BottomSheet>
    );
  }

  // The shared pay sheet draws the states the packs sheet does not: still confirming and a refusal.
  if (quote && (buy.confirming || buy.status.kind === 'failed')) {
    const status = buy.confirming ? ({ kind: 'confirming', line: STILL_CONFIRMING_LINE } as const) : buy.status.kind === 'failed' ? buy.status : ({ kind: 'review' } as const);
    return (
      <>
        <PaySheet
          visible={visible}
          item={{ title: `${creditCount(quote.credits)} credits` }}
          amountKobo={quote.payment.priceKobo}
          amountLabel="Price"
          fees={breakdownOf(quote.payment)}
          wallet={buy.balanceKobo === null ? { kind: 'loading' } : { kind: 'open', balanceKobo: buy.balanceKobo }}
          walletName={WALLET_LABEL}
          actionLabel="Buy"
          status={status}
          onPay={() => void buy.buy()}
          onAddMoney={buy.addMoney}
          onCancel={close}
          onRetry={buy.dismissFailed}
          onRefresh={buy.refresh}
        />
        {pin}
      </>
    );
  }

  return (
    <>
      <BottomSheet visible={visible} onClose={close} label={SHEET_TITLE} gap={SHEET_GAP} dismissible={!buy.tapping} testID="credits-sheet">
        <View style={styles.head}>
          <Text variant="sheetTitleSm">{SHEET_TITLE}</Text>
          <Text variant="muted">{SHEET_LINE}</Text>
        </View>
        <Packs buy={buy} />
        {quote ? (
          <GroupedList>
            {breakdownOf(quote.payment).map((line) => (
              <KeyValueRow key={line.label} label={line.label} value={<Money minorUnits={line.amountKobo} size={14.5} decimals />} />
            ))}
            <KeyValueRow key="total" label={TOTAL_LABEL} value={<Money minorUnits={quote.payment.totalKobo} size={14.5} decimals />} testID="credits-total" />
          </GroupedList>
        ) : buy.quoteLoading ? (
          <Skeleton width="100%" height={space.xl * 4} testID="credits-quote-loading" />
        ) : null}
        {short && quote && buy.balanceKobo !== null ? (
          <Banner
            tone="warning"
            icon="Wallet"
            title={`Not enough in your ${WALLET_LABEL}`}
            body={`This costs ${formatNaira(quote.payment.totalKobo)}. You have ${formatNaira(buy.balanceKobo, 'always')}.`}
            testID="credits-short"
          />
        ) : (
          <WalletRow balanceKobo={buy.balanceKobo} />
        )}
        {buy.notice ? (
          <Text variant="errorLine" tone="danger" accessibilityRole="alert" testID="credits-notice">
            {buy.notice}
          </Text>
        ) : null}
        {buy.quoteError ? (
          <View style={styles.retry}>
            <Text variant="errorLine" tone="danger" accessibilityRole="alert" testID="credits-quote-error">
              We couldn’t get the price. Try again.
            </Text>
            <Button label="Try again" variant="secondary" size="sm" onPress={buy.retryQuote} />
          </View>
        ) : null}
        {short ? (
          buy.addMoney ? <Button testID="credits-add" label={`Add ${formatNaira(buy.shortfallKobo)}`} icon="Plus" full onPress={buy.addMoney} /> : null
        ) : (
          <Button
            testID="credits-buy"
            label={quote ? buyLabel(quote.credits, quote.payment.totalKobo) : credits > 0 ? `Buy ${creditCount(credits)} credits` : 'Buy credits'}
            full
            loading={buy.tapping}
            disabled={!quote || buy.tapping}
            onPress={() => void buy.buy()}
          />
        )}
      </BottomSheet>
      {pin}
    </>
  );
}

function Packs({ buy }: { buy: ReturnType<typeof useBuyCredits> }) {
  if (buy.packs.isPending) {
    return (
      <View style={styles.packs} testID="credits-packs-loading">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} width="31%" height={packMetrics.badge * 4} radius={packMetrics.corner} />
        ))}
      </View>
    );
  }
  if (buy.packs.isError) {
    return (
      <View style={styles.retry}>
        <Text variant="errorLine" tone="danger" accessibilityRole="alert" testID="credits-packs-error">
          We couldn’t load the packs. Try again.
        </Text>
        <Button label="Try again" variant="secondary" size="sm" onPress={() => void buy.packs.refetch()} />
      </View>
    );
  }
  return (
    <View style={styles.packs} accessibilityRole="radiogroup">
      {buy.list.map((pack) => (
        <Pack key={pack.pack} pack={pack} on={pack.pack === buy.pack} onPress={() => buy.choose(pack.pack)} />
      ))}
    </View>
  );
}

function Pack({ pack, on, onPress }: { pack: CreditPack; on: boolean; onPress: () => void }) {
  const { colors } = useWawu();
  const badge = badgeWords(pack.badge);
  return (
    <Pressable
      testID={`credits-pack-${pack.pack}`}
      accessibilityRole="radio"
      accessibilityState={{ selected: on }}
      accessibilityLabel={`${creditCount(pack.credits)} credits, ${badge ? `${badge}, ` : ''}${pack.priceKobo / 100} naira`}
      onPress={onPress}
      style={[
        styles.pack,
        {
          backgroundColor: on ? colors.accentTint : colors.surfaceCard,
          boxShadow: [
            { offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: on ? packMetrics.ringOn : packMetrics.ringOff, color: on ? colors.accent : colors.borderHairline, inset: true },
          ],
        },
      ]}
    >
      {badge ? <StatusPill label={badge} tone="accent" /> : <View style={styles.noBadge} />}
      <Text variant="body" style={[font(700), { fontSize: packMetrics.count, letterSpacing: packMetrics.countTracking * packMetrics.count }]}>
        {creditCount(pack.credits)}
      </Text>
      <Text variant="caption" tone="textMuted" style={{ fontSize: packMetrics.unit }}>
        credits
      </Text>
      <Money minorUnits={pack.priceKobo} size={packMetrics.price} weight={600} decimals={pack.priceKobo % 100 !== 0} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  head: { gap: packMetrics.between },
  packs: { flexDirection: 'row', gap: packMetrics.row },
  pack: {
    flex: 1,
    minWidth: 0,
    borderRadius: packMetrics.corner,
    paddingVertical: packMetrics.padV,
    paddingHorizontal: packMetrics.padH,
    alignItems: 'center',
    gap: packMetrics.between,
  },
  noBadge: { height: packMetrics.badge },
  retry: { gap: space.sm, alignItems: 'flex-start' },
  added: { alignItems: 'center', gap: space.md, paddingTop: space.sm },
  centre: { textAlign: 'center' },
});
