import type { IconName } from '@/components/icon';
import { IconTile } from '@/components/IconTile';
import { PaySheet } from '@/components/pay-sheet';
import { PAYMENT_UNANSWERED_LINE, PinSheet } from '@/components/pin-sheet';
import { WALLET_NAME } from '@/features/events/buyModel';

import { approvalPurpose } from './model';
import type { LegalFeePay } from './useLegalFeePay';

/** S19's head draws the call's icon in a 44 accent tile before "Video consultation" (SWEEP-APP-4 row 140). */
const LEAD_TILE = 44;

/**
 * S19 · Pay and the PIN sheet over it. S19 is the shared pay sheet in its purchase form: what was booked, the bank's charge, the total, and "Pay
 * from wallet" with the balance the Hub read (BRIEF S19, R-10). Pay opens the shared PIN sheet; the pay sheet steps aside while the keypad is up.
 * Every figure is the Hub's quote; the sheets add nothing of their own.
 */
export function PaySheets({ pay, title, subtitle, icon }: { pay: LegalFeePay; title: string; subtitle: string; icon?: IconName }) {
  const quote = pay.quote;
  if (!quote) return null;
  const { payment } = quote;
  return (
    <>
      <PaySheet
        visible={pay.payOpen && !pay.pinOpen}
        item={{ title, subtitle, lead: icon ? <IconTile icon={icon} tone="accent" size={LEAD_TILE} /> : undefined }}
        amountKobo={payment.priceKobo}
        fees={pay.fees}
        wallet={pay.wallet}
        walletName={WALLET_NAME}
        actionLabel="Pay"
        status={pay.status}
        onPay={pay.pay}
        onAddMoney={pay.addMoney}
        onCancel={pay.cancel}
        onOpenWallet={pay.openWallet}
        onRetry={pay.tryAgain}
        onRefresh={pay.confirming ? pay.refresh : undefined}
      />
      <PinSheet
        visible={pay.pinOpen}
        onClose={pay.closePin}
        approval={{ totalKobo: payment.totalKobo, purpose: approvalPurpose(quote.stage) }}
        onSubmit={pay.submitPin}
        unansweredLine={PAYMENT_UNANSWERED_LINE}
        onForgotPin={pay.forgotPin}
        lockedUntil={pay.lockedUntil}
      />
    </>
  );
}

/** S22 and S26 draw the fee on the page, so only the shared PIN sheet opens over it. */
export function PayPin({ pay }: { pay: LegalFeePay }) {
  const quote = pay.quote;
  if (!quote) return null;
  return (
    <PinSheet
      visible={pay.pinOpen}
      onClose={pay.closePin}
      approval={{ totalKobo: quote.payment.totalKobo, purpose: approvalPurpose(quote.stage) }}
      onSubmit={pay.submitPin}
      unansweredLine={PAYMENT_UNANSWERED_LINE}
      onForgotPin={pay.forgotPin}
      lockedUntil={pay.lockedUntil}
    />
  );
}
