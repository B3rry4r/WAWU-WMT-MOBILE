import { accountNameOf, type PaidFrom } from '@/components/pay-sheet';

import type { LegalRequest } from '../matter/api';
import type { FeeQuote, FeePayment } from './api';

/**
 * Whether the fee a payment settled is recorded on the matter: the consultation fee once `consultationPaidAt` is set, the service fee once
 * `servicePaidAt` is. The matter is the Hub's own record of "paid", so a payment whose answer was lost is found by reading it.
 */
export function feeSettled(request: Pick<LegalRequest, 'consultationPaidAt' | 'servicePaidAt'>, stage: FeeQuote['stage']): boolean {
  return stage === 'consultation' ? request.consultationPaidAt !== null : request.servicePaidAt !== null;
}

/** The words on the PIN sheet's line: "₦15,015.75 for your consultation". */
export const approvalPurpose = (stage: FeeQuote['stage']): string => (stage === 'consultation' ? 'your consultation' : 'starting your request');

/** The line a payment that failed, or was paid back, ends on: the Hub's own sentence, or a plain one. */
export function failedPaymentLine(payment: Pick<FeePayment, 'status' | 'statusMessage'> & { payment?: { source?: PaidFrom | null } | null }): string {
  const said = payment.statusMessage?.trim();
  if (said) return said;
  // PAY-FX (R-91): a fee paid from another currency's account goes back to that account.
  const from = payment.payment?.source ?? null;
  const back = from ? `your ${accountNameOf(from.currency)}` : 'your wallet';
  return payment.status === 'refunded' ? `This fee could not be applied, so the price is going back to ${back}.` : "Your payment didn't go through. Nothing was kept.";
}

export const CONFIRMING_LINE = "Don't pay again. Your request updates in a minute.";
