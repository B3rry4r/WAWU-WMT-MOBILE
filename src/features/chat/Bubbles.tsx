import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Icon } from '@/components/icon';
import { formatMoney, Money } from '@/components/Money';
import { StatusPill } from '@/components/StatusPill';
import { Text } from '@/components/Text';
import { clockTime } from '@/features/communities/format';
import { MoneyGround } from '@/features/wallet/home/BalanceCard';
import { font, space, useWawu } from '@/theme';

import type { MoneyRequest } from './api';

/**
 * design/_gen/inbox.js lines 49 to 52 (`b`, `moneyB`, `reqB`): a text bubble is at most 78% wide, 10 by 14 inside, a 20 corner with a 6
 * corner at the sender's bottom, 15 on a 1.4 line, the time 4 under it at 11.5. The money bubble is 230 wide, a 22 corner, 14 by 16
 * inside; its label 12.5 / 600 at 75%, the amount 26 eight under it, the note 13.5 six under that and the status 12 / 600 ten under.
 * The request bubble is 240 wide, a 22 corner, 14 by 16 inside, 8 between its rows, a 1.5 ring (positive once paid).
 */
export const bubbleMetrics = { maxWidth: '78%', padV: 10, padH: 14, corner: 20, tail: 6, body: 15, line: 1.4, timeGap: 4, time: 11.5 } as const;
const moneyMetrics = { width: 230, corner: 22, padV: 14, padH: 16, label: 12.5, amount: 26, amountTop: 8, note: 13.5, noteTop: 6, status: 12, statusTop: 10, glyph: 14, statusGlyph: 13, ring: 1, labelGap: 6, statusGap: 5 } as const;
const requestMetrics = { width: 240, corner: 22, padV: 14, padH: 16, rows: 8, label: 12.5, glyph: 15, amount: 26, note: 13.5, ring: 1.5, buttonsTop: 4, payGrow: 1.4 } as const;

const wholeNaira = (kobo: number) => kobo % 100 !== 0;

export function DayLabel({ label }: { label: string }) {
  return (
    <Text variant="caption" tone="textMuted" style={[font(600), styles.day]}>
      {label}
    </Text>
  );
}

export function Time({ iso, mine }: { iso: string; mine: boolean }) {
  return (
    <Text variant="caption" tone="textMuted" style={[{ fontSize: bubbleMetrics.time }, mine ? styles.timeMine : null]}>
      {clockTime(iso)}
    </Text>
  );
}

export type PendingState = { status: 'sending' | 'failed'; error?: string; onRetry: () => void; onDiscard: () => void };

/** What sits under a message the Hub has not confirmed: "Sending", or why it was not sent with Try again and Delete. */
export function PendingNote({ id, pending }: { id: string; pending: PendingState }) {
  return (
    <View style={styles.pending}>
      <Text variant="caption" tone={pending.status === 'failed' ? 'danger' : 'textMuted'} style={{ fontSize: bubbleMetrics.time }}>
        {pending.status === 'failed' ? (pending.error ?? 'Not sent.') : 'Sending'}
      </Text>
      {pending.status === 'failed' ? (
        <View style={styles.pendingButtons}>
          <Button testID={`bubble-${id}-retry`} label="Try again" size="sm" variant="secondary" onPress={pending.onRetry} />
          <Button testID={`bubble-${id}-discard`} label="Delete" size="sm" variant="secondary" onPress={pending.onDiscard} />
        </View>
      ) : null}
    </View>
  );
}

export type TextBubbleProps = {
  id: string;
  text: string;
  mine: boolean;
  /** When it was sent. Left out for a message that is still on its way. */
  at?: string;
  /** A line under the bubble in place of its time ("09:51 · ₦1,500 paid", a paid question, INBOX-10). */
  stamp?: string;
  /** A message the Hub has not confirmed: dimmed, with its state under it. */
  pending?: PendingState;
};

/** One text message: the person's own on the right in the accent, theirs on the left on a card. */
export function TextBubble({ id, text, mine, at, stamp, pending }: TextBubbleProps) {
  const { colors } = useWawu();
  return (
    <View testID={`bubble-${id}`} style={[styles.row, mine ? styles.rowMine : styles.rowTheirs]} accessible accessibilityLabel={`${mine ? 'You' : 'They'}${at ? `, ${clockTime(at)}` : stamp ? `, ${stamp}` : ''}, ${text}`}>
      <View
        style={[
          styles.bubble,
          mine ? styles.tailMine : styles.tailTheirs,
          mine
            ? { backgroundColor: colors.accent }
            : { backgroundColor: colors.surfaceCard, boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 1, color: colors.borderHairline, inset: true }] },
          pending ? { opacity: 0.6 } : null,
        ]}
      >
        <Text variant="body" tone={mine ? 'textOnAccent' : 'textPrimary'} style={styles.bubbleText}>
          {text}
        </Text>
      </View>
      {pending ? (
        <PendingNote id={id} pending={pending} />
      ) : stamp ? (
        <Text variant="caption" tone="textMuted" style={[{ fontSize: bubbleMetrics.time }, mine ? styles.timeMine : null]} testID={`bubble-${id}-stamp`}>
          {stamp}
        </Text>
      ) : at ? (
        <Time iso={at} mine={mine} />
      ) : null}
    </View>
  );
}

export type SentBubbleProps = {
  id: string;
  amountKobo: number;
  note: string | null;
  /** The Hub's own state of the send: delivered, still going, or not delivered. */
  state: 'delivered' | 'sending' | 'not_delivered';
  /** The other person's first name: "Delivered to Femi". */
  toName: string;
  at: string;
};

const SENT_WORDS: Record<SentBubbleProps['state'], (name: string) => string> = {
  delivered: (name) => `Delivered to ${name}`,
  sending: (name) => `Sending to ${name}`,
  not_delivered: () => 'Not delivered',
};

/** I15: "You sent ₦25,000.00", the note, and whether it was delivered. Every word and figure is the Hub's record of the send. */
export function SentBubble({ id, amountKobo, note, state, toName, at }: SentBubbleProps) {
  const { colors, shadows } = useWawu();
  const words = SENT_WORDS[state](toName);
  return (
    <View testID={`sent-${id}`} style={[styles.row, styles.rowMine, { width: moneyMetrics.width }]} accessible accessibilityLabel={`You sent ${formatMoney(amountKobo)}${note ? `, ${note}` : ''}, ${words}, ${clockTime(at)}`}>
      <View style={[styles.money, { boxShadow: shadows.money }]}>
        <MoneyGround corner={moneyMetrics.corner} glowId={`sent-glow-${id}`} />
        <View style={styles.label}>
          <Icon name="ArrowUpRight" size={moneyMetrics.glyph} color={colors.textOnAccent} strokeWidth={2.4} />
          <Text variant="caption" tone="textOnAccent" style={[font(600), { fontSize: moneyMetrics.label, opacity: 0.75 }]}>
            You sent
          </Text>
        </View>
        <Money minorUnits={amountKobo} size={moneyMetrics.amount} weight={700} tone="textOnAccent" style={styles.amount} />
        {note ? (
          <Text variant="body" tone="textOnAccent" style={[{ fontSize: moneyMetrics.note, opacity: 0.85 }, styles.note]}>
            {note}
          </Text>
        ) : null}
        <View style={styles.status}>
          <Icon name={state === 'not_delivered' ? 'CircleAlert' : state === 'sending' ? 'Clock' : 'CircleCheck'} size={moneyMetrics.statusGlyph} color={colors.textOnAccent} strokeWidth={2.2} />
          <Text variant="caption" tone="textOnAccent" style={[font(600), { fontSize: moneyMetrics.status, opacity: 0.7 }]}>
            {words}
          </Text>
        </View>
      </View>
      <Time iso={at} mine />
    </View>
  );
}

export type RequestBubbleProps = {
  request: MoneyRequest;
  /** The other person's first name: "Waiting for Femi". */
  otherName: string;
  at: string;
  /** Pay and Decline, for the person who was asked while the request is open. */
  onPay?: () => void;
  onDecline?: () => void;
  /** Declining is on its way: the buttons wait. */
  busy?: boolean;
};

/**
 * I17, I18, I19: a request for money in the chat. The person who asked sees "You requested" and "Waiting for Femi"; the person asked
 * sees "Requested from you" with Decline and Pay while it is open. It flips to Paid, and shows Declined, Cancelled and a payment on its
 * way as the Hub says (`status`, `paying`).
 */
export function RequestBubble({ request, otherName, at, onPay, onDecline, busy }: RequestBubbleProps) {
  const { colors } = useWawu();
  const mine = request.direction === 'outgoing';
  const amount = request.amountKobo;
  let state;
  if (request.status === 'paid') state = <StatusPill label="Paid" tone="positive" icon="Check" testID={`request-${request.id}-state`} />;
  else if (request.status === 'declined') state = <StatusPill label="Declined" tone="neutral" icon="X" testID={`request-${request.id}-state`} />;
  else if (request.status === 'cancelled') state = <StatusPill label="Cancelled" tone="neutral" icon="X" testID={`request-${request.id}-state`} />;
  else if (request.paying) state = <StatusPill label="Payment on its way" tone="warning" icon="Clock" testID={`request-${request.id}-state`} />;
  else if (mine) state = <StatusPill label={`Waiting for ${otherName}`} tone="warning" icon="Clock" testID={`request-${request.id}-state`} />;
  else
    state = (
      <View style={styles.buttons}>
        <Button testID={`request-${request.id}-decline`} label="Decline" size="sm" variant="secondary" disabled={busy} onPress={() => onDecline?.()} style={styles.declineButton} />
        <Button testID={`request-${request.id}-pay`} label={`Pay ${formatMoney(amount, { decimals: wholeNaira(amount) })}`} size="sm" disabled={busy} onPress={() => onPay?.()} style={styles.payButton} />
      </View>
    );
  return (
    <View testID={`request-${request.id}`} style={[styles.row, mine ? styles.rowMine : styles.rowTheirs, { width: requestMetrics.width }]}>
      <View
        style={[
          styles.request,
          {
            backgroundColor: colors.surfaceCard,
            boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: requestMetrics.ring, color: request.status === 'paid' ? colors.positive : colors.borderStrong, inset: true }],
          },
        ]}
      >
        <View style={styles.label}>
          <Icon name="HandCoins" size={requestMetrics.glyph} color={colors.textSecondary} />
          <Text variant="caption" tone="textSecondary" style={[font(600), { fontSize: requestMetrics.label }]}>
            {mine ? 'You requested' : 'Requested from you'}
          </Text>
        </View>
        <Money minorUnits={amount} size={requestMetrics.amount} weight={700} decimals={wholeNaira(amount)} />
        {request.memo ? (
          <Text variant="body" tone="textSecondary" style={{ fontSize: requestMetrics.note }}>
            {request.memo}
          </Text>
        ) : null}
        <View style={styles.state}>{state}</View>
      </View>
      <Time iso={at} mine={mine} />
    </View>
  );
}

const styles = StyleSheet.create({
  day: { alignSelf: 'center', paddingVertical: space.xs, fontSize: 12 },
  row: { gap: bubbleMetrics.timeGap },
  rowMine: { alignSelf: 'flex-end', alignItems: 'flex-end', maxWidth: bubbleMetrics.maxWidth },
  rowTheirs: { alignSelf: 'flex-start', alignItems: 'flex-start', maxWidth: bubbleMetrics.maxWidth },
  bubble: { paddingVertical: bubbleMetrics.padV, paddingHorizontal: bubbleMetrics.padH, borderRadius: bubbleMetrics.corner },
  tailMine: { borderBottomRightRadius: bubbleMetrics.tail },
  tailTheirs: { borderBottomLeftRadius: bubbleMetrics.tail },
  bubbleText: { fontSize: bubbleMetrics.body, lineHeight: bubbleMetrics.body * bubbleMetrics.line },
  timeMine: { textAlign: 'right' },
  pending: { gap: space.xs, alignItems: 'flex-end' },
  pendingButtons: { flexDirection: 'row', gap: space.sm },
  money: { width: '100%', borderRadius: moneyMetrics.corner, paddingVertical: moneyMetrics.padV, paddingHorizontal: moneyMetrics.padH },
  label: { flexDirection: 'row', alignItems: 'center', gap: moneyMetrics.labelGap },
  amount: { marginTop: moneyMetrics.amountTop },
  note: { marginTop: moneyMetrics.noteTop },
  status: { marginTop: moneyMetrics.statusTop, flexDirection: 'row', alignItems: 'center', gap: moneyMetrics.statusGap },
  request: { width: '100%', borderRadius: requestMetrics.corner, paddingVertical: requestMetrics.padV, paddingHorizontal: requestMetrics.padH, gap: requestMetrics.rows },
  state: { alignItems: 'flex-start' },
  buttons: { flexDirection: 'row', gap: requestMetrics.rows, marginTop: requestMetrics.buttonsTop, alignSelf: 'stretch' },
  declineButton: { flex: 1 },
  payButton: { flex: requestMetrics.payGrow },
});
