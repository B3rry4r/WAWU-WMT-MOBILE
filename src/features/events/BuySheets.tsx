import { PaySheet } from '@/components/pay-sheet';
import { PAYMENT_UNANSWERED_LINE } from '@/components/pin-sheet';
import { PayPinSheet } from '@/features/device-approval';

import { WALLET_NAME } from './buyModel';
import type { BuySheet } from './useTicketBuy';

/**
 * E3 · Pay and E4 · PIN, over E2. E3 is the shared pay sheet in its purchase form: the tickets, the bank's charge and WAWU's own
 * fee when it has one, the total, and "Pay from wallet" with the balance the Hub read (BRIEF E3, R-10). Pay opens E4, the shared
 * PIN sheet, "Approve ₦X to <event>"; the pay sheet steps aside while the keypad is up, as the artboard draws it.
 * Every figure is the Hub's quote; the sheets add nothing of their own.
 */
export function BuySheets({ sheet }: { sheet: BuySheet }) {
  const { order, payment } = sheet.quote;
  return (
    <>
      <PaySheet
        visible={sheet.payOpen && !sheet.pinOpen}
        item={{ title: order.event.name, subtitle: sheet.subtitle, image: order.event.bannerUrl ?? undefined }}
        amountKobo={payment.priceKobo}
        amountLabel="Tickets"
        fees={sheet.fees}
        wallet={sheet.wallet}
        walletName={WALLET_NAME}
        actionLabel="Pay"
        status={sheet.status}
        onPay={sheet.pay}
        onAddMoney={sheet.addMoney}
        onCancel={sheet.cancel}
        onOpenWallet={sheet.openWallet}
        onRetry={sheet.tryAgain}
      />
      <PayPinSheet
        visible={sheet.pinOpen}
        onClose={sheet.closePin}
        approval={{ totalKobo: payment.totalKobo, payee: sheet.eventName }}
        run={sheet.run}
        unansweredLine={PAYMENT_UNANSWERED_LINE}
        onForgotPin={sheet.forgotPin}
        lockedUntil={sheet.lockedUntil}
      />
    </>
  );
}
