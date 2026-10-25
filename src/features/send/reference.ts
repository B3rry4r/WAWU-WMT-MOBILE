/**
 * The reference a person reads off a send (W12, W14, W27) and quotes to support (R2-MONEY D-03). The board shows `WAW-8F2A-91C3`; the Hub
 * stores `wawu-send-<id>` (a send to a WAWU user) or `wawu-bank-<id>` (a send to a bank account). The short form is derived from the
 * stored one by a fixed rule, the first eight hex digits of the id in two groups of four, upper case, and the Hub's admin lookup
 * (`GET /admin/money/transfers/lookup`, wawu-backend `src/money/transfers/transfer-reference.ts`) finds the send from it. Never a
 * reference nobody can search: any reference of another shape (a fee leg, a school settlement, a provider's own) is shown whole, as the
 * Hub gave it.
 */
const STORED = /^(?:wawu-send-|wawu-bank-)([0-9a-f]{8})-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function shortReference(reference: string): string {
  const found = STORED.exec(reference.trim());
  if (!found) return reference;
  const hex = found[1].toUpperCase();
  return `WAW-${hex.slice(0, 4)}-${hex.slice(4)}`;
}
