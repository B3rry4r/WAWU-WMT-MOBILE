
import { StyleSheet } from 'react-native';

import { Button } from '@/components/Button';
import { GroupedList } from '@/components/Card';
import { IconTile } from '@/components/IconTile';
import { KeyValueRow } from '@/components/ListRow';
import { Money } from '@/components/Money';
import { PaySheet, paidFromRows, sourceApproval } from '@/components/pay-sheet';
import { PAYMENT_UNANSWERED_LINE } from '@/components/pin-sheet';
import { PayPinSheet } from '@/features/device-approval';
import { PRICE_CHANGED_LINE } from '@/features/events/buyModel';
import { isPicture } from '@/features/feed/model';
import { StatusSheet } from '@/features/feedpay/StatusSheet';
import { Text } from '@/components/Text';
import { useOpenSupport } from '@/features/support/useOpenSupport';
import { paymentReference } from '@/features/support/api';
import { font, layout, space, text } from '@/theme';
import { ICON_STROKE } from '@/components/icon';

import { openIcon, openingLine, openLabel, PRICE_MOVED_TITLE, sheetSubtitle, tickOf, unlockedLine, unlockPayee, WALLET_NAME } from './model';
import type { UnlockState } from './useUnlock';
import { usePaySource } from '@/features/pay-source/usePaySource';

/** H16's and H18's round mark: 72 across, its glyph stroked at 2.4 (design/_gen/home.js lines 138 and 140). */
const MARK = layout.tapMin + space.s3xl - space.xs;
const MARK_STROKE = ICON_STROKE.fab;

/**
 * H14 to H18, and the states between. H14 and H17 are the shared pay sheet (the piece, Price, the bank's charge, the total, Pay from
 * wallet, "Unlock · ₦2,523.25"; "Not enough in your Naira wallet" with the shortfall and Add). The fee is always its parts then the Total, also when a
 * part is ₦0, never "No fee" (BRIEF rules 3 and 4, H14). Pay opens H15, the shared PIN sheet,
 * "Approve ₦2,523.25 to Chidi Eze". A paid unlock ends on H16. When the money has left and the opening is not finished, H18, whose
 * Contact support opens the support chat (I12) with this payment already attached as its first message (SUPPORT-01, R-30).
 */
/** H14's row between the price and the fee: an unlock never ends, and My purchases (M29) keeps it. */
const YOURS = [{ label: 'Yours', value: 'Forever, in My purchases' }] as const;

export function UnlockSheets({
  unlock,
  onAddMoney,
  onOpenWallet,
  onForgotPin,
}: {
  unlock: UnlockState;
  onAddMoney: (shortfallKobo: number) => void;
  onOpenWallet: () => void;
  onForgotPin: () => void;
}) {
  const { flow, item, quote, fees, balanceKobo } = unlock;
  const paySource = usePaySource({ payment: quote?.payment ?? null, open: flow.payOpen, requote: flow.ask });
  const support = useOpenSupport();
  if (!item) return null;

  const view = flow.view;
  if (flow.stage === 'paid' && view) {
    return (
      <StatusSheet
        visible
        onClose={unlock.done}
        label="Unlocked"
        testID="unlock-done"
        mark={<IconTile icon="Check" tone="in" size={MARK} strokeWidth={MARK_STROKE} />}
        title="Unlocked"
        line={unlockedLine(item)}
      >
        <GroupedList testID="unlock-receipt">
          {view.payment.source ? (
            // PAY-FX (R-91): what left the buyer's own account, in its currency, and where from; the naira price beside it.
            paidFromRows(view.payment.source, { paidLabel: 'Paid', priceKobo: view.payment.priceKobo, paidSize: text.kvValue.fontSize })
          ) : (
            [
              <KeyValueRow key="paid" label="Paid" value={<Money minorUnits={view.payment.totalKobo} size={text.kvValue.fontSize} />} />,
              <KeyValueRow key="from" label="From" value={WALLET_NAME} />,
            ]
          )}
          <KeyValueRow
            label="Reference"
            value={
              // The Hub's own reference is a long one (BACKEND_GAPS G-1722): both ends stay visible rather than the tail.
              <Text variant="body" numberOfLines={1} ellipsizeMode="middle" style={[styles.reference, font(600)]} testID="unlock-reference">
                {view.payment.reference}
              </Text>
            }
          />
        </GroupedList>
        <Button testID="unlock-open" label={openLabel(item)} icon={openIcon(item)} onPress={unlock.done} full />
      </StatusSheet>
    );
  }
  if (flow.stage === 'opening' && view) {
    return (
      <StatusSheet
        visible
        onClose={flow.cancel}
        label="Paid, still opening"
        testID="unlock-opening"
        mark={<IconTile icon="Clock" tone="warn" size={MARK} strokeWidth={MARK_STROKE} />}
        title="Paid, still opening"
        line={openingLine(item, view.payment.totalKobo, view.payment.source)}
      >
        <Button testID="unlock-refresh" label="Refresh" icon="RotateCcw" onPress={flow.refresh} loading={flow.refreshing} full />
        <Button
          testID="unlock-support"
          label="Contact support"
          variant="secondary"
          onPress={() => void support.open(paymentReference(view.payment.id))}
          loading={support.opening}
          full
        />
        {support.error ? (
          <Text variant="errorLine" tone="danger" accessibilityRole="alert" style={styles.supportError} testID="unlock-support-error">
            {support.error}
          </Text>
        ) : null}
      </StatusSheet>
    );
  }
  if (!quote || !flow.payOpen) return null;

  // A notice the sheet cannot hold (the price moved, a failed ask) is the shared sheet's "cannot be tried yet": nothing was sent.
  const status =
    flow.notice !== null && flow.status.kind === 'review'
      ? ({
          kind: 'blocked',
          title: flow.notice === PRICE_CHANGED_LINE ? PRICE_MOVED_TITLE : "Couldn't check the price",
          message: flow.notice === PRICE_CHANGED_LINE ? 'Check the new total before you unlock.' : flow.notice,
          tryAgain: true,
        } as const)
      : flow.status;
  const payee = unlockPayee(quote.creator);
  return (
    <>
      <PaySheet
        visible={!flow.pinOpen}
        // H14's thumbnail is the piece's own still: the Hub's preview when that is a picture (a template, a photo, a cover). A video's preview
        // is a clip, not a still, and the Hub serves no poster for one, so the head is the words alone there, with no empty square (R2-SOCIAL).
        item={{
          title: quote.title,
          by: payee,
          verified: tickOf(quote.creator.tick),
          subtitle: sheetSubtitle(item),
          image: isPicture(item.previewAssetUrl) ? item.previewAssetUrl : undefined,
        }}
        amountKobo={quote.payment.priceKobo}
        fees={fees}
        source={paySource}
        wallet={balanceKobo === null ? { kind: 'loading' } : { kind: 'open', balanceKobo }}
        walletName={WALLET_NAME}
        details={YOURS}
        actionLabel="Unlock"
        status={status}
        onPay={flow.pay}
        onAddMoney={onAddMoney}
        onCancel={flow.cancel}
        onOpenWallet={onOpenWallet}
        onRetry={() => {
          flow.clearNotice();
          flow.setStatus({ kind: 'review' });
        }}
        onRefresh={flow.refresh}
      />
      <PayPinSheet
        visible={flow.pinOpen}
        onClose={flow.closePin}
        approval={{ totalKobo: quote.payment.totalKobo, payee, ...sourceApproval(paySource) }}
        run={flow.run}
        unansweredLine={PAYMENT_UNANSWERED_LINE}
        onForgotPin={() => {
          flow.closePin();
          onForgotPin();
        }}
        lockedUntil={flow.lockedUntil}
      />
    </>
  );
}


const styles = StyleSheet.create({
  reference: { fontSize: text.kvValue.fontSize, flexShrink: 1, textAlign: 'right' },
  supportError: { textAlign: 'center' },
});
