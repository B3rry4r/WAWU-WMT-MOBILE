# Cardex: Fintava's crypto partner

Read from the developer page Fintava shared (base URL
`https://cardex.live/api`), pasted by the owner on 2 Oct 2026. It is the
partner behind the canvas's "crypto account" (W3, W22, W23) and "swap"
(W20). Crypto is after launch (R-16). This file says what Cardex does, what
the canvas assumes, and the question to answer before WALLET-33 starts.

## What Cardex is

A **business treasury**. WAWU gets one balance per currency at Cardex. Each
WAWU user can be given deposit addresses tagged with our own `customerRef`,
but every deposit lands in **WAWU's treasury**, not in an account belonging
to that user. Cardex keeps one ledger, WAWU's. Who owns which part of it is
something WAWU would have to record itself.

It does four things:

1. **Deposit addresses.** `POST /v1/business/wallets` with `customerRef`,
   currency and network returns a stable address for that combination.
   Asking again returns the same one. Each network has a minimum deposit.
2. **Money in.** On-chain deposits credit the treasury. Settle on
   `deposit.confirmed`, never `deposit.detected`.
3. **Converting** between NGN, USDT and USDC in any direction. Quote first;
   the rate is held **90 seconds** and the quote can be used once. Then
   execute it, and both treasury balances move at once with no pending state.
4. **Money out.** NGN to any Nigerian bank, or USDT or USDC to an address.
   **The fee is charged on top** (amount plus fee). Settle on
   `payout.completed`; on `payout.failed` the treasury is refunded in full.

**Assets: USDT and USDC only.**
- USDT on TRC20, BEP20 (18 decimals there, not 6) and ERC20.
- USDC on TRC20, BEP20, ERC20, BASE and SOL.

## Security and reliability (better than Fintava's)

- Every call: `Authorization: Bearer <key>`. Every call with a body is also
  signed: HMAC-SHA256 over `{timestamp}.{rawBody}`, hex, in
  `x-cardex-signature`, with the Unix time in `x-cardex-timestamp`. Sign the
  exact string you send.
- Every money-moving call takes an `Idempotency-Key`. A retry with the same
  key returns the original result; the same key with a different body is
  `idempotency_conflict`.
- Webhooks are signed the same way. Reject anything outside 300 seconds,
  compare in constant time, deduplicate on the event `id`, sort on
  `sequence`, and answer 200 fast. Delivery is at least once, in any order.
- Rate limits per key per minute: reads 600, writes 120, money 30. Headers
  `X-RateLimit-Remaining` and `X-RateLimit-Reset`; honour `Retry-After`.
- Events: `deposit.detected`, `deposit.confirmed`, `balance.credited`,
  `conversion.completed`, `payout.submitted`, `payout.completed`,
  `payout.failed`, `webhook_endpoint.auto_disabled`.
- Errors: `invalid_api_key`, `invalid_signature`, `stale_timestamp`,
  `insufficient_scope`, `ip_not_allowed`, `rate_limited`,
  `idempotency_conflict`, `below_minimum_deposit`, `business_suspended`,
  `insufficient_balance`, `quote_expired`.
- Sandbox: `cdx_test_` keys give synthetic addresses, and
  `POST /v1/business/sandbox/deposits` fires a simulated deposit event (it
  never changes a balance). Keys are shown once; Cardex keeps only a hash.
  Restrict the live key to the backend's IP addresses (`ip_not_allowed`
  exists for that).

## What the canvas assumes, and what Cardex does

- **Custody.** The canvas (W3) says "USDT and BTC held by Fintava's custody
  partner". Cardex does hold the coins, but as WAWU's treasury. Each user's
  balance would be a number in WAWU's database, owed by WAWU. That is WAWU
  custody.
- **Bitcoin.** The canvas shows BTC holdings and BTC receive. Cardex has no
  BTC. Only USDT and USDC.
- **Networks.** The canvas offers TRC-20, ERC-20 and BEP-20 for USDT, which
  matches. USDC adds BASE and SOL.
- **Rate hold.** The canvas counts down 30 seconds (W20); Cardex holds 90. The
  screen shows the real `expiresInSeconds`.
- **Dollars.** The canvas's swap and "dollar account" (W2, W20) total crypto
  in dollars. Cardex converts NGN to and from stablecoins, and there is no
  USD bank account (R-16: not available). A "dollar account" here would be
  USDT or USDC shown in dollars, which is not the same thing and must not
  be called a dollar account.
- **Network fee.** The canvas deducts it from what's sent (W23). Cardex
  charges it on top. The screen shows Cardex's real fee and total.
- **Naira into crypto.** The canvas swaps from the Naira wallet. Cardex
  converts its own NGN treasury. Getting a user's naira from their Fintava
  wallet into WAWU's Cardex NGN treasury isn't in either set of docs; ask
  both.
- **Crypto into naira.** The canvas swaps into the Naira wallet. Cardex
  converts, then an NGN payout goes to the user's Fintava account number
  (fee on top), and Fintava's `account_funded` webhook confirms it arrived.

## The question to answer before WALLET-33 starts

**Who is the custodian of record for users' crypto, and under whose licence?**

The product's rule is that WAWU instructs and never holds money itself.
Fintava's Naira accounts keep that rule: each user has an account in their own
name at a licensed bank. Cardex does not. Every user's coins sit in one WAWU
treasury, and WAWU's database decides who owns what. In Nigeria, a business
that holds digital assets for other people is normally a virtual asset
service provider that has to register with the SEC, on top of any CBN
question about the naira side. That needs checking with counsel and with
Fintava. It is not something to assume either way.

Ask Fintava and Cardex:
1. Is Cardex licensed (SEC, CBN, or abroad), and does that cover holding
   assets for WAWU's end users?
2. Can each user have a segregated account in their own name, like the Naira
   wallet, instead of a share of WAWU's treasury?
3. How does WAWU fund or empty its NGN treasury at Cardex? Can it be the same
   balance as WAWU's Fintava merchant wallet?
4. Is BTC planned?
5. What are the payout and conversion fees and the network minimums?

Until those are answered, the crypto screens stay after launch and behind a
flag. If WAWU does end up keeping its own crypto ledger, the nightly check
must compare the sum of user balances with Cardex's treasury balance every
night, the same way MONEY-16 does for Fintava.

## Keys

The owner will receive test (`cdx_test_`) and live keys, plus a signing secret
and a webhook secret. They go into the backend's environment secrets as
`CARDEX_API_KEY`, `CARDEX_SIGNING_SECRET` and `CARDEX_WEBHOOK_SECRET`. Never
paste them into a chat, a commit, a task file or the app.
