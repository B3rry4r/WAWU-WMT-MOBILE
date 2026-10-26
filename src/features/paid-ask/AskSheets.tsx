import { Platform, StyleSheet, TextInput, View } from 'react-native';
import { useState } from 'react';

import { Avatar } from '@/components/Avatar';
import { Banner } from '@/components/Banner';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { Card, GroupedList } from '@/components/Card';
import { CurrencyFlag } from '@/components/CurrencyFlag';
import { browserOutlineOff } from '@/components/focusRing';
import { Icon, ICON_STROKE, VerifiedTick, type IconName } from '@/components/icon';
import { KeyValueRow } from '@/components/ListRow';
import { Money } from '@/components/Money';
import { PaySheet, SourceFooter, accountNameOf, feesTotalKobo, formatNaira, shortfallKobo, sourceApproval, sourceRows, sourceTotalMinor, type PaySource } from '@/components/pay-sheet';
import { PayPinSheet } from '@/features/device-approval';
import { Text } from '@/components/Text';
import { WALLET_NAME } from '@/features/events/buyModel';
import { useKeyboardLift } from '@/features/feedpay/useKeyboardLift';
import { canvasNormalLineHeight, font, layout, radius, space, text, useWawu } from '@/theme';

import { heldLine, refundLine, shortLine, SHORT_TITLE, usualReplyLine, whoOf, windowLine } from './model';
import { MAX_QUESTION, type AskState } from './useAsk';
import { usePaySource } from '@/features/pay-source/usePaySource';
import { usePaySourceCode } from '@/api/paySource';

/** design/_gen/inbox.js `composeSheet`: the sheet's parts 16 apart; the head 12 between; the field 110 high, 18 corner, 14 by 16 inside, 15 on a 1.45 line; the three lines 10 apart with a 17 mark; the avatar 44. */
const SHEET_GAP = space.lg;
const FIELD_MIN = 110;
const FIELD_RING = 1.5;
const FIELD_TEXT = 15;
const FIELD_LINE = 1.45;
const MARK = 17;
const LINE_TEXT = 13.5;
const AVATAR = 44;
const NAME_TEXT = 16;
const PRICE_TEXT = 18;
const SUB_TEXT = 13;

const lines: { icon: IconName; key: 'window' | 'refund' | 'held' }[] = [
  { icon: 'Clock', key: 'window' },
  { icon: 'RotateCcw', key: 'refund' },
  { icon: 'ShieldCheck', key: 'held' },
];

/** The kit's `fromWallet` card: the Naira coin, "Pay from wallet", the balance, and the tick of the one wallet there is. */
function WalletLine({ balanceKobo, accountCode }: { balanceKobo: number | null; accountCode?: string | null }) {
  const { colors } = useWawu();
  // PAY-FX (R-91): the person already pays from another currency's account, so the sheet says which as soon as that is known and does
  // not read "Checking your balance" (a naira balance they are not paying from) while the Hub drafts the question and prices it.
  if (accountCode) {
    return (
      <Card style={styles.walletCard} testID="ask-wallet">
        <View style={styles.flex}>
          <Text variant="cardTitle">Pay from</Text>
          <Text variant="meta" style={styles.walletLine} testID="ask-wallet-account">
            {accountNameOf(accountCode)}
          </Text>
        </View>
      </Card>
    );
  }
  return (
    <Card style={styles.walletCard} testID="ask-wallet">
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

/** The breakdown under the three lines (BRIEF I3, R-10, R-53): the question's price, the bank's charge, WAWU's fee when it has one, the total. */
function Breakdown({ ask, source }: { ask: AskState; source?: PaySource }) {
  const q = ask.quote;
  const row = (label: string, kobo: number | null, key: string) => (
    <KeyValueRow
      key={key}
      label={label}
      value={<Money minorUnits={kobo ?? 0} size={text.kvValue.fontSize} decimals={kobo !== null && kobo % 100 !== 0} loading={kobo === null} />}
      testID={`ask-row-${key}`}
    />
  );
  const rows = [row('Question', q ? q.question.priceKobo : (ask.target?.priceKobo ?? null), 'price')];
  if (source) {
    // Paying from another currency (PAY-FX, R-91): the account and the firm amount, drawn by the same piece as the pay sheet.
    rows.push(...sourceRows(source));
  } else if (q) {
    for (const f of ask.fees) rows.push(row(f.label, f.amountKobo, f.label));
    if (ask.fees.length > 1) rows.push(row('Fees', feesTotalKobo(ask.fees), 'fees'));
    rows.push(row('Total', q.payment.totalKobo, 'total'));
  } else {
    rows.push(row('Bank charge', null, 'charge'), row('Total', null, 'total'));
  }
  return <GroupedList testID="ask-breakdown">{rows}</GroupedList>;
}

/**
 * I3 · Write the question, and I6 when the wallet is short: "Ask Chidi", what the Hub says about replying, the words, the three lines
 * (the window, what comes back, who holds the money), the breakdown (BRIEF I3), then Pay from wallet and "Send · ₦1,523.25", or the
 * not-enough note and "Add ₦623.25" (BRIEF I6), which opens Add money (W15) with the shortfall. Send opens the PIN sheet (W11).
 */
function AskSheet({ ask, onAddMoney, source }: { ask: AskState; onAddMoney: (shortfallKobo: number) => void; source?: PaySource }) {
  const { colors } = useWawu();
  const lift = useKeyboardLift();
  const [focused, setFocused] = useState(false);
  const { flow, quote, target } = ask;
  const code = usePaySourceCode();
  const name = target?.name ?? null;
  const total = quote?.payment.totalKobo ?? null;
  const balance = ask.balanceKobo;
  const short = source === undefined && quote !== null && balance !== null && quote.payment.totalKobo > balance;
  const owed = short ? (quote.payment.shortfallKobo && quote.payment.shortfallKobo > 0 ? quote.payment.shortfallKobo : shortfallKobo(quote.payment.totalKobo, balance)) : 0;
  const ready = quote !== null && !flow.asking && ask.text.trim().length > 0;
  const price = quote?.question.priceKobo ?? target?.priceKobo ?? null;
  const usual = usualReplyLine(quote?.question.usualReplyMinutes);
  const hours = quote?.question.replyWindowHours ?? target?.windowHours ?? null;
  const words: Record<(typeof lines)[number]['key'], string> = { window: windowLine(name, hours), refund: refundLine(total, source ? { currency: source.currency, decimals: source.decimals, totalMinor: sourceTotalMinor(source) } : null), held: heldLine(name) };
  return (
    <BottomSheet visible={ask.open && !flow.pinOpen} onClose={ask.close} label={`Ask ${whoOf(name)}`} gap={SHEET_GAP} testID="ask-sheet">
      <View style={styles.head}>
        <Avatar name={name ?? undefined} hue={target?.hue} source={target?.avatarUrl ?? undefined} size={AVATAR} decorative />
        <View style={styles.flex}>
          <View style={styles.nameLine}>
            <Text variant="sheetTitleSm" numberOfLines={1} accessibilityRole="header" style={[font(700), { fontSize: NAME_TEXT }, styles.name]} testID="ask-title">
              {`Ask ${whoOf(name)}`}
            </Text>
            {target?.tick ? <VerifiedTick kind={target.tick} size={14} /> : null}
          </View>
          {usual ? (
            <Text variant="caption" tone="textMuted" style={[{ fontSize: SUB_TEXT }, styles.sub]} testID="ask-usual">
              {usual}
            </Text>
          ) : null}
        </View>
        {price === null ? null : <Money minorUnits={price} size={PRICE_TEXT} weight={700} decimals={price % 100 !== 0} testID="ask-price" />}
      </View>
      {flow.notice ? <Banner tone="danger" title="Couldn't check the price" body={flow.notice} testID="ask-notice" /> : null}
      <TextInput
        testID="ask-text"
        value={ask.text}
        onChangeText={ask.setText}
        multiline
        maxLength={MAX_QUESTION}
        placeholder={`Write your question for ${whoOf(name)}`}
        placeholderTextColor={colors.textMuted}
        accessibilityLabel="Your question"
        selectionColor={colors.accent}
        cursorColor={colors.accent}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          styles.field,
          Platform.OS === 'web' ? browserOutlineOff : null,
          {
            color: colors.textPrimary,
            backgroundColor: colors.surfaceInput,
            boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: focused || ask.text.length > 0 ? FIELD_RING : 1, color: focused || ask.text.length > 0 ? colors.accent : colors.borderHairline, inset: true }],
          },
        ]}
      />
      <View style={styles.lines}>
        {lines.map(({ icon, key }) => (
          <View key={key} style={styles.line} testID={`ask-line-${key}`}>
            <Icon name={icon} size={MARK} color={colors.accentFg} strokeWidth={2.2} />
            <Text variant="secondary" tone="textSecondary" style={styles.lineText}>
              {words[key]}
            </Text>
          </View>
        ))}
      </View>
      <Breakdown ask={ask} source={source} />
      {source ? (
        <SourceFooter
          source={source}
          actionLabel="Send"
          onPay={() => void flow.pay()}
          statusKind={flow.status.kind}
          loading={flow.asking}
          disabled={!ready}
          testID="ask-send"
        />
      ) : short && quote ? (
        <>
          <Banner tone="warning" icon="Wallet" title={SHORT_TITLE} body={shortLine(quote.payment.totalKobo, balance)} testID="ask-short" />
          <Button testID="ask-add" label={`Add ${formatNaira(owed)}`} icon="Plus" onPress={() => onAddMoney(owed)} full />
        </>
      ) : (
        <>
          <WalletLine balanceKobo={balance} accountCode={code} />
          <Button
            testID="ask-send"
            label={quote ? `Send · ${formatNaira(quote.payment.totalKobo)}` : 'Send'}
            onPress={() => void flow.pay()}
            loading={flow.asking}
            disabled={!ready}
            full
          />
        </>
      )}
      {lift > 0 ? <View style={{ height: lift }} /> : null}
    </BottomSheet>
  );
}

/**
 * I3, I6, W11 and the states between: the ask sheet while the person writes and reviews; the shared pay sheet when the payment is
 * still confirming, did not go through or cannot be tried; the shared PIN sheet over either. A paid question is not drawn here: it
 * ends the flow and the screen opens the thread (I4).
 */
export function AskSheets({
  ask,
  onAddMoney,
  onOpenWallet,
  onForgotPin,
}: {
  ask: AskState;
  onAddMoney: (shortfallKobo: number) => void;
  onOpenWallet: () => void;
  onForgotPin: () => void;
}) {
  const { flow, quote, target } = ask;
  const paySource = usePaySource({ payment: quote?.payment ?? null, open: ask.open, requote: flow.ask });
  if (!ask.open || !target) return null;
  const name = whoOf(target.name);
  const reviewing = flow.status.kind === 'review' && flow.stage === null;
  return (
    <>
      {reviewing || !quote ? (
        <AskSheet ask={ask} onAddMoney={onAddMoney} source={paySource} />
      ) : (
        <PaySheet
          visible={!flow.pinOpen}
          item={{ title: `Ask ${name}`, subtitle: 'Held until they answer', image: target.avatarUrl ?? undefined }}
          amountKobo={quote.question.priceKobo}
          amountLabel="Question"
          fees={ask.fees}
          source={paySource}
          wallet={ask.balanceKobo === null ? { kind: 'loading' } : { kind: 'open', balanceKobo: ask.balanceKobo }}
          walletName={WALLET_NAME}
          actionLabel="Send"
          status={flow.status}
          onPay={flow.pay}
          onAddMoney={onAddMoney}
          onCancel={ask.close}
          onOpenWallet={onOpenWallet}
          onRetry={() => flow.setStatus({ kind: 'review' })}
          onRefresh={flow.refresh}
        />
      )}
      {quote ? (
        <PayPinSheet
          visible={flow.pinOpen}
          onClose={flow.closePin}
          approval={{ totalKobo: quote.payment.totalKobo, payee: target.name?.trim() || 'this creator', ...sourceApproval(paySource) }}
          run={flow.run}
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
  head: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  flex: { flex: 1, minWidth: 0 },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  name: { flexShrink: 1 },
  sub: { marginTop: space.xs / 2 },
  field: {
    ...font(500),
    minHeight: FIELD_MIN,
    borderRadius: radius.card,
    paddingVertical: space.md + space.xs / 2,
    paddingHorizontal: space.lg,
    fontSize: FIELD_TEXT,
    lineHeight: FIELD_TEXT * FIELD_LINE,
    textAlignVertical: 'top',
  },
  lines: { gap: space.sm + space.xs / 2 },
  line: { flexDirection: 'row', alignItems: 'center', gap: space.sm + space.xs / 2 },
  lineText: { flex: 1, minWidth: 0, fontSize: LINE_TEXT, lineHeight: canvasNormalLineHeight(LINE_TEXT) },
  walletLine: { marginTop: space.xs / 2 },
  walletCard: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md + space.xs / 2, paddingHorizontal: layout.cardPad },
});
