import type { ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Banner } from '@/components/Banner';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { Card, GroupedList } from '@/components/Card';
import { CurrencyFlag } from '@/components/CurrencyFlag';
import { browserOutlineOff, useFocusRing } from '@/components/focusRing';
import { Icon, ICON_STROKE } from '@/components/icon';
import { KeyValueRow } from '@/components/ListRow';
import { Money } from '@/components/Money';
import { Skeleton } from '@/components/Skeleton';
import { PaySheet, SourceFooter, feesTotalKobo, formatNaira, paidFromRows, sourceApproval, sourceRows, type PaySource } from '@/components/pay-sheet';
import { PAYMENT_UNANSWERED_LINE } from '@/components/pin-sheet';
import { PayPinSheet } from '@/features/device-approval';
import { Text } from '@/components/Text';
import { PRICE_CHANGED_LINE } from '@/features/events/buyModel';
import { StatusSheet } from '@/features/feedpay/StatusSheet';
import { useKeyboardLift } from '@/features/feedpay/useKeyboardLift';
import { canvasNormalLineHeight, font, layout, radius, space, text, useWawu } from '@/theme';

import { earnOf } from '@/features/prices/model';

import { NOTE_MAX, getsWords, noteEcho, sentHeading, tipTitle, WALLET_NAME } from './model';
import type { TipState } from './useTip';
import { usePaySource } from '@/features/pay-source/usePaySource';
import { StoreUnready } from '@/features/store/StoreParts';
import { StoreBuySheet, storeLabel } from '@/features/store/ladder/StoreBuySheet';
import type { Ladder } from '@/features/store/ladder/useLadder';
import type { ShownPrice } from '@/features/store/ladder/usePrice';

/** design/_gen/home.js `tipSheet`: the sheet's parts 14 apart, the chips 48 high with a 16 corner, the fields 50 high. */
const SHEET_GAP = space.md + space.xs / 2;
const TILE_H = 72;
const TILE_AMOUNT = 19;
const TILE_GETS = 11.5;
const FIELD_H = 50;
const FIELD_PAD = space.lg;
const FIELD_TEXT = 15.5;
const PEN = 17;
const AVATAR = space.s3xl * 2;

/** H26's two kinds of notice, as a tinted note: the price moved, or something went wrong. */
function Notice({ line }: { line: string }) {
  if (line === PRICE_CHANGED_LINE) {
    return <Banner tone="warning" title="The price changed" body="Check the new total before you tip." testID="tip-notice" />;
  }
  return <Banner tone="danger" title="Couldn't check the price" body={line} testID="tip-notice" />;
}

/**
 * One tip tile (the approved design, PRICE-PICKER): the amount the fan pays and what the creator gets of it (85%, R-5, rounded down).
 * The chosen one is tinted with the accent and its "gets" line turns to the success colour. Payment is unchanged: what the fan pays
 * today is the tip itself, with the Hub's own fees added below in the breakdown.
 */
function Tile({ naira, shownKobo, name, selected, onPress }: { naira: number; shownKobo?: number; name: string | null | undefined; selected: boolean; onPress: () => void }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const gets = getsWords(name);
  return (
    <Pressable
      testID={`tip-tile-${naira}`}
      accessibilityRole="button"
      accessibilityLabel={`${formatNaira(shownKobo ?? naira * 100)}. ${gets} ${formatNaira(earnOf(naira) * 100)}`}
      accessibilityState={{ selected }}
      onPress={onPress}
      {...ring.handlers}
      style={[
        styles.tile,
        { backgroundColor: selected ? colors.accentTint : colors.surfaceSunken, borderColor: selected ? colors.accent : 'transparent' },
        ring.style,
      ]}
    >
      <Money minorUnits={shownKobo ?? naira * 100} size={TILE_AMOUNT} weight={700} decimals={false} />
      <View style={styles.gets}>
        <Text variant="caption" tone={selected ? 'success' : 'textMuted'} style={styles.getsText}>
          {gets}
        </Text>
        <Money minorUnits={earnOf(naira) * 100} size={TILE_GETS} weight={500} decimals={false} tone={selected ? 'success' : 'textMuted'} />
      </View>
    </Pressable>
  );
}

/** The six tiles from the Hub's tip list: a grid of three, a skeleton while the list is read, and a try again if it could not be. */
function Tiles({ tip }: { tip: TipState }) {
  if (tip.tipsFailed) {
    return (
      <View testID="tip-tiles-failed" style={styles.failed}>
        <Text variant="muted">The tip amounts did not load.</Text>
        <Button label="Try again" variant="secondary" size="sm" full={false} onPress={tip.readTips} testID="tip-tiles-retry" />
      </View>
    );
  }
  if (tip.tips.length === 0) {
    return (
      <View testID="tip-tiles-loading" style={styles.tiles} accessibilityLabel="Loading tip amounts">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={styles.tileCell}>
            <Skeleton height={TILE_H} radius={radius.input} />
          </View>
        ))}
      </View>
    );
  }
  return (
    <View testID="tip-tiles" style={styles.tiles}>
      {tip.tips.map((naira) => (
        <View key={naira} style={styles.tileCell}>
          <Tile naira={naira} shownKobo={tip.store?.shown.kobo(naira) ?? undefined} name={tip.target?.name} selected={tip.amountKobo === naira * 100} onPress={() => tip.pick(naira * 100)} />
        </View>
      ))}
    </View>
  );
}

/** A plain box for a line of text, the kit's `field` with no label (H26's "Other amount" and the note). */
function Box({ children }: { children: ReactNode }) {
  const { colors } = useWawu();
  return <View style={[styles.box, { backgroundColor: colors.surfaceInput, borderColor: colors.borderHairline }]}>{children}</View>;
}

/** The kit's `fromWallet` card: the Naira coin, "Pay from wallet", the balance, and the tick of the one wallet there is. */
function WalletLine({ balanceKobo }: { balanceKobo: number | null }) {
  const { colors } = useWawu();
  return (
    <Card style={styles.walletCard} testID="tip-wallet">
      <CurrencyFlag currency="NGN" />
      <View style={styles.flex}>
        <Text variant="cardTitle">Pay from wallet</Text>
        <Text variant="meta" style={styles.walletLine}>
          {balanceKobo === null ? (
            'Checking your balance'
          ) : (
            <>
              {WALLET_NAME} · <Money minorUnits={balanceKobo} size={text.meta.fontSize} weight={500} tone="textMuted" /> available
            </>
          )}
        </Text>
      </View>
      {balanceKobo === null ? null : <Icon name="CircleCheck" size={space.xl} color={colors.accentFg} strokeWidth={ICON_STROKE.button} />}
    </Card>
  );
}

/** The breakdown above Pay from wallet (BRIEF H26, R-10): the tip, the bank's charge, WAWU's fee when it has one, the total. */
function Breakdown({ tip, source }: { tip: TipState; source?: PaySource }) {
  const q = tip.quote;
  const row = (label: string, kobo: number | null, key: string) => (
    <KeyValueRow
      key={key}
      label={label}
      value={<Money minorUnits={kobo ?? 0} size={text.kvValue.fontSize} decimals={kobo !== null && kobo % 100 !== 0} loading={kobo === null} />}
      testID={`tip-row-${key}`}
    />
  );
  const rows = [row('Tip', q ? q.amountKobo : tip.amountKobo, 'tip')];
  if (source) {
    // Paying from another currency (PAY-FX, R-91): the account and the firm amount, drawn by the same piece as the pay sheet.
    rows.push(...sourceRows(source));
  } else if (q) {
    for (const f of tip.fees) rows.push(row(f.label, f.amountKobo, f.label));
    if (tip.fees.length > 1) rows.push(row('Fees', feesTotalKobo(tip.fees), 'fees'));
    rows.push(row('Total', q.payment.totalKobo, 'total'));
  } else {
    rows.push(row('Bank charge', null, 'charge'), row('Total', null, 'total'));
  }
  return <GroupedList testID="tip-breakdown">{rows}</GroupedList>;
}

/**
 * H26 · Tip sheet: "Tip Tife", where it goes, six tip tiles from the Hub's list (PRICE-PICKER, R-101: nothing is typed), an optional note, the breakdown (BRIEF H26,
 * R-10), Pay from wallet and "Tip ₦2,023.25". The Naira, Dollar and USDT picker is not drawn (R-64). Tip opens H27, the shared
 * PIN sheet, and a paid tip ends on H28.
 */
function TipSheet({ tip, source }: { tip: TipState; source?: PaySource }) {
  const { colors } = useWawu();
  const lift = useKeyboardLift();
  const { flow, quote, target } = tip;
  const ready = quote !== null && !flow.asking;
  const blank = tip.amountKobo === null;
  return (
    <BottomSheet visible={tip.open && !flow.pinOpen} onClose={tip.close} label="Tip" gap={SHEET_GAP} testID="tip-sheet">
      <View style={styles.head}>
        <Text variant="sheetTitleSm" accessibilityRole="header" testID="tip-title">
          {tipTitle(target?.name)}
        </Text>
        <Text variant="muted">Goes straight to their wallet. They see your name and note.</Text>
      </View>
      {flow.notice ? <Notice line={flow.notice} /> : null}
      <Tiles tip={tip} />
      <Box>
        <Icon name="PenLine" size={PEN} color={colors.textMuted} />
        <TextInput
          testID="tip-note"
          value={tip.note}
          onChangeText={tip.setNote}
          maxLength={NOTE_MAX}
          placeholder="Add a note (optional)"
          placeholderTextColor={colors.textMuted}
          accessibilityLabel="Note, optional"
          selectionColor={colors.accent}
          cursorColor={colors.accent}
          style={[styles.input, Platform.OS === 'web' ? browserOutlineOff : null, { color: colors.textPrimary }]}
        />
      </Box>
      <Breakdown tip={tip} source={source} />
      {source ? (
        <SourceFooter
          source={source}
          actionLabel="Tip"
          actionJoin="space"
          onPay={() => void flow.pay()}
          statusKind={flow.status.kind}
          loading={flow.asking}
          disabled={!ready || blank}
          testID="tip-pay"
        />
      ) : (
        <>
          <WalletLine balanceKobo={tip.balanceKobo} />
          <Button
            testID="tip-pay"
            label={quote ? `Tip ${formatNaira(quote.payment.totalKobo)}` : 'Tip'}
            onPress={() => void flow.pay()}
            loading={flow.asking}
            disabled={!ready || blank}
            full
          />
        </>
      )}
      {lift > 0 ? <View style={{ height: lift }} /> : null}
    </BottomSheet>
  );
}

/** H28 · Tip sent: "₦2,000 sent to Tife", the note echoed, and "Total paid ₦2,023.25" (BRIEF H28). Done returns to the feed. */
function SentSheet({ tip }: { tip: TipState }) {
  const view = tip.flow.view;
  if (!view) return null;
  const echo = noteEcho(view.note);
  const name = tip.target?.name?.trim() || view.creator.displayName;
  return (
    <StatusSheet
      visible
      onClose={tip.close}
      label="Tip sent"
      testID="tip-sent"
      mark={<Avatar name={name ?? undefined} hue={tip.target?.hue} source={tip.target?.avatarUrl ?? view.creator.avatarUrl ?? undefined} size={AVATAR} decorative />}
      title={sentHeading(view.amountKobo, name)}
      line={echo ? `"${echo}"` : null}
    >
      <GroupedList testID="tip-total-paid">
        {view.payment.source ? (
          // PAY-FX (R-91): what left the buyer's own account and which account; the heading keeps the naira tip.
          paidFromRows(view.payment.source, { paidLabel: 'Total paid' })
        ) : (
          <KeyValueRow label="Total paid" value={<Money minorUnits={view.payment.totalKobo} size={text.kvValue.fontSize} decimals={view.payment.totalKobo % 100 !== 0} />} />
        )}
      </GroupedList>
      <Button testID="tip-done" label="Done" onPress={tip.close} full />
    </StatusSheet>
  );
}

/**
 * H26 and H28 for a phone with a store (R-101): a tip is a store purchase on the price ladder. The tiles are the Hub's tip list at the
 * STORE's price with what the creator gets (85% of the list tip) beneath; there is no wallet, PIN, bank charge or note (the Hub's tip intent
 * carries no note). A credit that covers the tip is offered first. The tip ends on H28 with what was paid and where.
 */
function StoreTipSheet({ tip, store }: { tip: TipState; store: { ladder: Ladder; shown: ShownPrice } }) {
  const { ladder } = store;
  const { buyer } = ladder;
  const { target } = tip;
  const naira = tip.amountKobo === null ? null : tip.amountKobo / 100;
  const entry = ladder.itemFor(naira);
  const credit = ladder.creditFor('tip', naira);
  const name = target?.name?.trim() || null;

  if (buyer.granted && naira !== null) {
    const withCredit = Boolean(buyer.granted.paidWithCredit);
    return (
      <StatusSheet
        visible
        onClose={tip.close}
        label="Tip sent"
        testID="tip-sent"
        mark={<Avatar name={name ?? undefined} hue={target?.hue} source={target?.avatarUrl ?? undefined} size={AVATAR} decorative />}
        title={sentHeading(naira * 100, name)}
        line={null}
      >
        <GroupedList testID="tip-total-paid">
          {[<KeyValueRow key="paid" label="Total paid" value={withCredit ? 'Your credit' : (entry?.price ?? '')} />, <KeyValueRow key="with" label="Paid with" value={withCredit ? 'Who Made This' : storeLabel()} />]}
        </GroupedList>
        <Button testID="tip-done" label="Done" onPress={tip.close} full />
      </StatusSheet>
    );
  }

  const state = ladder.state;
  let unready: ReactNode = null;
  if (state.kind === 'ready') {
    if (tip.tipsNone || (naira !== null && entry === null)) unready = <StoreUnready state={{ kind: 'not_open', why: 'not_configured' }} onRetry={ladder.refetch} testID="tip-store" />;
  } else if (state.kind !== 'loading') {
    unready = <StoreUnready state={state} onRetry={ladder.refetch} testID="tip-store" />;
  }
  return (
    <StoreBuySheet
      visible
      testID="tip-sheet"
      label="Tip"
      head={{ title: tipTitle(target?.name), subtitle: naira === null ? undefined : `${getsWords(target?.name)} ${formatNaira(earnOf(naira) * 100)}` }}
      price={entry?.price ?? null}
      priceLabel="Tip"
      actionLabel="Tip"
      disabled={naira === null}
      busy={buyer.busy}
      said={buyer.said}
      credit={credit ? { line: 'A credit from an earlier purchase pays for this tip.' } : null}
      unready={unready}
      onBuy={() => (naira === null || !target ? undefined : void buyer.buyLadder({ kind: 'tip', creatorWawuId: target.wawuId, listPriceNaira: naira }))}
      onUseCredit={() => (naira === null || !target ? undefined : void buyer.buyLadder({ kind: 'tip', creatorWawuId: target.wawuId, listPriceNaira: naira }, 'credit'))}
      onCancel={tip.close}
    >
      <Tiles tip={tip} />
    </StoreBuySheet>
  );
}

/**
 * H26, H27 and H28, and the states between: the tip sheet while the person chooses; the shared pay sheet when the wallet is too
 * low, the payment is still confirming, did not go through or cannot be tried; the shared PIN sheet over either; and "Tip sent".
 */
export function TipSheets({
  tip,
  onAddMoney,
  onOpenWallet,
  onForgotPin,
}: {
  tip: TipState;
  onAddMoney: (shortfallKobo: number) => void;
  onOpenWallet: () => void;
  onForgotPin: () => void;
}) {
  const { flow, quote, target } = tip;
  const paySource = usePaySource({ payment: quote?.payment ?? null, open: tip.open, requote: flow.ask });
  if (!tip.open || !target) return null;
  // R-101: on a phone with a store a tip is a store purchase; the wallet sheets below are the web's.
  if (tip.store) return <StoreTipSheet tip={tip} store={tip.store} />;
  if (flow.stage === 'paid') return <SentSheet tip={tip} />;

  const short = paySource === undefined && quote !== null && tip.balanceKobo !== null && quote.payment.totalKobo > tip.balanceKobo;
  const reviewing = flow.status.kind === 'review' && !short && flow.stage === null;
  const name = target.name?.trim() || 'this creator';
  return (
    <>
      {reviewing || !quote ? (
        <TipSheet tip={tip} source={paySource} />
      ) : (
        <PaySheet
          visible={!flow.pinOpen}
          item={{ title: tipTitle(target.name), subtitle: 'Goes straight to their wallet', image: target.avatarUrl ?? undefined }}
          amountKobo={quote.amountKobo}
          amountLabel="Tip"
          fees={tip.fees}
          source={paySource}
          wallet={tip.balanceKobo === null ? { kind: 'loading' } : { kind: 'open', balanceKobo: tip.balanceKobo }}
          walletName={WALLET_NAME}
          actionLabel="Tip"
          status={flow.status}
          onPay={flow.pay}
          onAddMoney={onAddMoney}
          onCancel={tip.close}
          onOpenWallet={onOpenWallet}
          onRetry={() => flow.setStatus({ kind: 'review' })}
          onRefresh={flow.refresh}
        />
      )}
      {quote ? (
        <PayPinSheet
          visible={flow.pinOpen}
          onClose={flow.closePin}
          approval={{ totalKobo: quote.payment.totalKobo, payee: name, ...sourceApproval(paySource) }}
          run={flow.run}
          unansweredLine={PAYMENT_UNANSWERED_LINE}
          onForgotPin={() => {
            flow.closePin();
            onForgotPin();
          }}
          lockedUntil={flow.lockedUntil}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  head: { gap: space.xs + space.xs / 2 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  tileCell: { width: '31.5%', flexGrow: 1 },
  tile: { minHeight: TILE_H, borderRadius: radius.input, borderWidth: 1, paddingVertical: space.md + 2, paddingHorizontal: space.xs + 2, alignItems: 'center', gap: space.xs - 1 },
  gets: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', columnGap: space.xs - 1 },
  getsText: { fontSize: TILE_GETS },
  failed: { alignItems: 'center', gap: space.sm },
  box: {
    height: FIELD_H,
    borderRadius: radius.tile,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm + space.xs / 2,
    paddingHorizontal: FIELD_PAD,
  },
  input: { ...font(500), flex: 1, minWidth: 0, fontSize: FIELD_TEXT, lineHeight: canvasNormalLineHeight(FIELD_TEXT), padding: 0 },
  flex: { flex: 1, minWidth: 0 },
  walletLine: { marginTop: space.xs / 2 },
  walletCard: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md + space.xs / 2, paddingHorizontal: layout.cardPad },
});
