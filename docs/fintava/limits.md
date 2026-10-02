# Fintava wallet tiers and daily limits

From Fintava's wallet policy, shared by the owner on 2 Oct 2026. This
replaces the earlier note in `naira-api.md` that tiers don't exist. Tiers are
policy on Fintava's side. Their published API has no endpoint to change a
wallet's tier, but the API does report one: `GET /merchant/balance` returned
`"tier": "TIER_3"` for WAWU's merchant account in the sandbox
(`sandbox/22-merchant-balance.md`), and a new customer wallet reports
`"tier": "TIER_2"` (`sandbox/08-wallet-balance.md`).

- **Tier 1:** ₦50,000 a day. Needs BVN.
- **Tier 2:** ₦500,000 a day. Needs BVN and NIN.
- **Tier 3:** ₦5,000,000 a day. Needs BVN, NIN, address and facial
  verification.
- **WAWU's merchant account:** ₦10,000,000 per transaction.

## What this means for us

- "Open your wallet" (KYC-01 to KYC-04) already collects BVN, NIN, address
  and a selfie matched to the BVN photo, which is everything Tier 3 asks for.
  The plan was that a user who finishes it holds a Tier 3 wallet from day
  one, so the tier-upgrade screens (A17 to A20) might not be needed. The
  sandbox does not bear that out (next point).
- **`POST /create/customer` opens a Tier 2 wallet** (₦500,000 a day), not
  Tier 3. Measured in the sandbox re-run on 2 Oct 2026 (OPS-02): both test
  customers, opened with BVN, NIN and address, came back `TIER_2`
  (`sandbox/07-create-customer.md`). The selfie check is a separate call,
  not part of create, so finishing "Open your wallet" gives Tier 2 as things
  stand, and the tier-upgrade screens (A17 to A20) are still needed unless
  Fintava says otherwise.
- **The create response does not show the tier; the reads do.**
  `GET /customer/wallet/balance/{walletId}` returns `data.tier`, and
  `GET /customers/list` and `GET /customers/{id}` return `wallet.tier`
  (`sandbox/08-wallet-balance.md`, `sandbox/07-create-customer.md`). The
  backend reads the tier from there, never from our own records.
- **No limit error was seen.** The largest amount moved was ₦300
  (`sandbox/13-wallet-to-wallet.md`), far below any limit, so the wording
  and code of a limit refusal are still unknown.
- Still to confirm with Fintava: how a wallet moves from Tier 2 to Tier 3
  (automatic after the BVN selfie check, a dashboard action, or an API call
  that isn't published). No call in the sandbox changed a tier
  (`sandbox/README.md`, question 19).
- Until then: limits come from config (`TIER_LIMITS`, per tier), the app shows
  the user's daily limit and what's left of it, and a send that would pass the
  limit is stopped before the PIN with a clear message. Never hard-code the
  numbers in a screen.
- The merchant account's ₦10,000,000 per-transaction cap matters for paying
  out to schools and for large school-fee payments; amounts above it are split
  or refused with a message.
