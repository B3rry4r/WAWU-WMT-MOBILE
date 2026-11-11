import { fetchFeeQuote } from '@/features/send/api';
import { hasQuotedFee } from '@/features/send/quotedFee';

/**
 * What W17 reads beyond the shared money reads (`@/api/money` for the balance, `@/features/wallet/api/payoutAccount` for the
 * destination, `@/features/send/api` for the send itself):
 *
 * - the fee quote for a bank send of an amount (`GET /money/fees/quote?kind=bank_transfer`): the Hub's bank charge and WAWU's fee,
 *   each its own part, the total that leaves the wallet and the signed token the send must carry. A withdrawal is a bank send to the
 *   payout account, so it is quoted as one.
 *
 * The quote is asked for once the person stops typing (`useSettled`), never held across a tap: Withdraw asks for a fresh one first.
 * The query's key says `fee-quote` in its second slot so a decided send's refresh of every `money` read leaves it alone.
 */
export const withdrawQuoteQuery = (owner: string | null, amountKobo: number, round: number, enabled: boolean) =>
  ({
    queryKey: ['money', 'fee-quote', 'bank_transfer', owner ?? '', amountKobo, round] as const,
    queryFn: () => fetchFeeQuote(amountKobo, 'bank_transfer'),
    staleTime: Infinity,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
    enabled: Boolean(owner) && amountKobo > 0 && enabled,
  }) as const;

/** The fee a bank send of `amountKobo` costs on top, from a fresh quote: its fee and VAT, as the Hub says them (Max follows it down). */
export async function feeAt(amountKobo: number): Promise<number> {
  const quote = await fetchFeeQuote(amountKobo, 'bank_transfer');
  return hasQuotedFee(quote) ? quote.feeMinor + quote.vatMinor : quote.parts.reduce((sum, part) => sum + part.amountKobo, 0);
}
