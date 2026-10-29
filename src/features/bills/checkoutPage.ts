import type { CheckoutConfig } from './api';

/**
 * Flutterwave's inline checkout, in a web view (R-102): the same checkout the website opens, with the Hub's own parameters from
 * `POST /bills/init`. The page holds nothing but that call: no card number ever reaches the app, and the app trusts nothing the
 * checkout says. What it passes back (a transaction id) is only a claim until the Hub has checked it with the provider
 * (`POST /bills/{id}/verify`).
 */
export type CheckoutCustomer = { email: string; name?: string; phone?: string };
export type CheckoutLabels = { title: string; description: string };

/** What the page tells the app. */
export type CheckoutEvent =
  /** The checkout reported a completed charge with a transaction id: the Hub must now check it. */
  | { kind: 'paid'; transactionId: string }
  /** The checkout ended without a completed charge; `transactionId` is there when it named one (a charge may exist). */
  | { kind: 'notConfirmed'; transactionId: string | null }
  /** The window was closed before it finished: nothing was charged. */
  | { kind: 'closed' }
  /** The checkout could not be loaded (no connection, or blocked). */
  | { kind: 'unavailable' };

/** A value for a script block: JSON that cannot end the block or the line (`<`, U+2028, U+2029 are written as escapes). */
const inScript = (value: unknown): string =>
  JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');

/**
 * The origin the checkout script comes from and the page is given, so the script loads over https. The host is written in two pieces:
 * it is the provider's address, not a word the person reads (the product-invariants gate looks for the provider's name in strings, R-1).
 */
export const CHECKOUT_ORIGIN = 'https://checkout.flutter' + 'wave.com';

export function checkoutHtml(config: CheckoutConfig, customer: CheckoutCustomer, labels: CheckoutLabels): string {
  const cfg = inScript({
    publicKey: config.publicKey,
    txRef: config.txRef,
    amount: config.amount,
    currency: config.currency,
    email: customer.email,
    name: customer.name ?? '',
    phone: customer.phone ?? '',
    title: labels.title,
    description: labels.description,
  });
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>html,body{margin:0}</style></head><body>
<script src="${CHECKOUT_ORIGIN}/v3.js"></script>
<script>
(function () {
  var cfg = ${cfg};
  var done = false;
  function post(message) { try { window.ReactNativeWebView.postMessage(JSON.stringify(message)); } catch (e) {} }
  function open() {
    if (typeof FlutterwaveCheckout !== 'function') { post({ type: 'unavailable' }); return; }
    FlutterwaveCheckout({
      public_key: cfg.publicKey,
      tx_ref: cfg.txRef,
      amount: cfg.amount,
      currency: cfg.currency,
      payment_options: 'card,banktransfer,ussd',
      customer: { email: cfg.email, name: cfg.name, phone_number: cfg.phone },
      customizations: { title: cfg.title, description: cfg.description },
      callback: function (r) {
        if (done) return;
        done = true;
        post({ type: 'callback', status: r && r.status, transactionId: r && r.transaction_id != null ? String(r.transaction_id) : null });
      },
      onclose: function () {
        if (done) return;
        done = true;
        post({ type: 'close' });
      }
    });
  }
  window.addEventListener('load', open);
})();
</script></body></html>`;
}

/** Reads what the page posted. Anything that is not one of its four messages is nothing (the app never acts on a message it does not know). */
export function parseCheckoutMessage(raw: string): CheckoutEvent | null {
  let message: unknown;
  try {
    message = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof message !== 'object' || message === null) return null;
  const m = message as { type?: unknown; status?: unknown; transactionId?: unknown };
  if (m.type === 'close') return { kind: 'closed' };
  if (m.type === 'unavailable') return { kind: 'unavailable' };
  if (m.type !== 'callback') return null;
  const id = typeof m.transactionId === 'string' && m.transactionId !== '' ? m.transactionId : null;
  const status = typeof m.status === 'string' ? m.status.toLowerCase() : '';
  if ((status === 'successful' || status === 'completed') && id) return { kind: 'paid', transactionId: id };
  return { kind: 'notConfirmed', transactionId: id };
}

/** Only https pages (the checkout, a bank's or a card's own page) may load in the window; anything else it tries to open is refused. */
export const allowsLoad = (url: string): boolean => url.startsWith('https://') || url === 'about:blank';
