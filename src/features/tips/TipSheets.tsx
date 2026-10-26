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
import { PaySheet, SourceFooter, feesTotalKobo, formatNaira, sourceApproval, sourceRows, type PaySource } from '@/components/pay-sheet';
import { PAYMENT_UNANSWERED_LINE } from '@/components/pin-sheet';
import { PayPinSheet } from '@/features/device-approval';
import { Text } from '@/components/Text';
import { PRICE_CHANGED_LINE } from '@/features/events/buyModel';
import { StatusSheet } from '@/features/feedpay/StatusSheet';
import { useKeyboardLift } from '@/features/feedpay/useKeyboardLift';
import { canvasNormalLineHeight, font, layout, radius, space, text, useWawu } from '@/theme';

import { NOTE_MAX, QUICK_AMOUNTS_KOBO, noteEcho, sentHeading, tipTitle, WALLET_NAME } from './model';
import type { TipState } from './useTip';
import { usePaySource } from '@/features/pay-source/usePaySource';

/** design/_gen/home.js `tipSheet`: the sheet's parts 14 apart, the chips 48 high with a 16 corner, the fields 50 high. */
const SHEET_GAP = space.md + space.xs / 2;
const CHIP_H = 48;
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

/** One quick amount: the chosen one is filled with the ink colour, the rest are outlined (H26). */
function Chip({ kobo, selected, onPress }: { kobo: number; selected: boolean; onPress: () => void }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID={`tip-chip-${kobo}`}
      accessibilityRole="button"
      accessibilityLabel={formatNaira(kobo)}
      accessibilityState={{ selected }}
      onPress={onPress}
      {...ring.handlers}
      style={[
        styles.chip,
        selected ? { backgroundColor: colors.textPrimary } : { borderColor: colors.borderStrong, borderWidth: 1 },
        ring.style,
      ]}
    >
      <Money minorUnits={kobo} size={15} decimals={false} tone={selected ? 'surfacePage' : 'textPrimary'} />
    </Pressable>
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
 * H26 · Tip sheet: "Tip Tife", where it goes, four quick amounts, any other amount, an optional note, the breakdown (BRIEF H26,
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
      <View style={styles.chips}>
        {QUICK_AMOUNTS_KOBO.map((kobo) => (
          <View key={kobo} style={styles.chipCell}>
            <Chip kobo={kobo} selected={tip.chosen === kobo} onPress={() => tip.pick(kobo)} />
          </View>
        ))}
      </View>
      <Box>
        <TextInput
          testID="tip-other"
          value={tip.typed}
          onChangeText={tip.type}
          keyboardType="number-pad"
          inputMode="numeric"
          placeholder="Other amount"
          placeholderTextColor={colors.textMuted}
          accessibilityLabel="Other amount in naira"
          selectionColor={colors.accent}
          cursorColor={colors.accent}
          style={[styles.input, Platform.OS === 'web' ? browserOutlineOff : null, { color: colors.textPrimary }]}
        />
      </Box>
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
        <KeyValueRow label="Total paid" value={<Money minorUnits={view.payment.totalKobo} size={text.kvValue.fontSize} decimals={view.payment.totalKobo % 100 !== 0} />} />
      </GroupedList>
      <Button testID="tip-done" label="Done" onPress={tip.close} full />
    </StatusSheet>
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
  chips: { flexDirection: 'row', gap: space.sm },
  chipCell: { flex: 1 },
  chip: { height: CHIP_H, borderRadius: radius.input, alignItems: 'center', justifyContent: 'center' },
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
