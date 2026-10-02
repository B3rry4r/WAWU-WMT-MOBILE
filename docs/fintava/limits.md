# Fintava wallet tiers and daily limits

From Fintava's wallet policy, shared by the owner on 2 Oct 2026. This
replaces the earlier note in `naira-api.md` that tiers don't exist. Tiers are
policy on Fintava's side; their published API has no endpoint to read or
change a wallet's tier.

- **Tier 1:** ₦50,000 a day. Needs BVN.
- **Tier 2:** ₦500,000 a day. Needs BVN and NIN.
- **Tier 3:** ₦5,000,000 a day. Needs BVN, NIN, address and facial
  verification.
- **WAWU's merchant account:** ₦10,000,000 per transaction.

## What this means for us

- "Open your wallet" (KYC-01 to KYC-04) already collects BVN, NIN, address
  and a selfie matched to the BVN photo, which is everything Tier 3 asks for.
  So a user who finishes it should be able to hold a Tier 3 wallet from day
  one, and the tier-upgrade screens (A17 to A20) may not be needed.
- Still to confirm with Fintava (OPS-02): which tier `POST /create/customer`
  opens, and how a wallet moves up a tier (automatic after the BVN selfie
  check, a dashboard action, or an API call that isn't published).
- Until then: limits come from config (`TIER_LIMITS`, per tier), the app shows
  the user's daily limit and what's left of it, and a send that would pass the
  limit is stopped before the PIN with a clear message. Never hard-code the
  numbers in a screen.
- The merchant account's ₦10,000,000 per-transaction cap matters for paying
  out to schools and for large school-fee payments; amounts above it are split
  or refused with a message.
