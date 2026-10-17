import { PaySheet } from '@/components/pay-sheet';
import { PinSheet } from '@/components/pin-sheet';
import { WALLET_NAME } from '@/features/events/buyModel';

import { approvalPurpose } from './model';
import type { LegalFeePay } from './useLegalFeePay';

/**
 * S19 · Pay and the PIN sheet over it. S19 is the shared pay sheet in its purchase form: what was booked, the bank's charge, the total, and "Pay
 * from wallet" with the balance the Hub read (BRIEF S19, R-10). Pay opens the shared PIN sheet; the pay sheet steps aside while the keypad is up.
 * Every figure is the Hub's quote; the sheets add nothing of their own.
 */
export function PaySheets({ pay, title, subtitle }: { pay: LegalFeePay; title: string; subtitle: string }) {
  const quote = pay.quote;
  if (!quote) return null;
  const { payment } = quote;
  return (
    <>
      <PaySheet
        visible={pay.payOpen && !pay.pinOpen}
        item={{ title, subtitle }}
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
      onForgotPin={pay.forgotPin}
      lockedUntil={pay.lockedUntil}
    />
  );
}
