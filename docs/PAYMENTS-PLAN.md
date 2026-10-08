# Payments plan

8 Oct 2026, PLAN-PAY. Payment work is the top priority (R-44). This page says the order of work, what runs in
parallel, what waits for the Nuvion sandbox key, which existing tasks are replaced, and the few owner questions,
each with the default that is built until the owner answers. The task files are the detail.

## Owner rulings this plan follows

- **R-39:** Nuvion replaces Fintava, reversibly (`WALLET_PROVIDER`, MONEY-20). No SMS: codes go by email.
- **R-42:** start Nuvion now; fees and limits are settings filled in when Nuvion answers, and nothing moves real
  money before they are set. ID document and proof of address at opening. Adding money by bank transfer only.
  Held money goes through a WAWU operational account on Nuvion. Bills off at launch.
- **R-43:** the 5 Oct plan: free sign-up and drafts, publishing needs a tier (Verify, Verify Plus, Founding Maker:
  3, 6 or 10 products), points with expiring lots and a cash-out rate, dollar prices outside Nigeria, referral
  points. The plan's figures are config values, never facts.
- **R-44, owner, 8 Oct 2026 ("Same as the app"):** on the website (wawuafrica.com) people can buy a tier, buy
  points, add money by bank transfer and pay from their wallet, through the same Hub routes as the app. The website
  is not a checkout that the app sends people to, and there is no card payment for now. The web tasks below are
  built on that; none waits for a scope answer.

**How everything is built today:** against Nuvion's documented API, with Nuvion stood in at the provider seam
(the stand-in NUV-01 builds). No task calls a Nuvion, Fintava or wawuafrica.com host. No fee or limit figure is
written anywhere; prices are the plan's example values in one config file (TIER-01).

## The tasks

| Task | Title | Repo | Depends on | Can start now |
|---|---|---|---|---|
| NUV-01 | Nuvion client, webhook receiver and the switch to Nuvion | backend | MONEY-20 | yes |
| NUV-07 | Fees and limits as settings, and nothing moves before they are set | backend | MONEY-20, WALLET-15 | yes |
| TIER-01 | Prices, tiers and the billing currency: one config file | backend | MONEY-04 | yes |
| POINTS-01 | Points: lots that expire, and the points ledger | backend | none | yes |
| NUV-02 | Open a wallet on Nuvion: the person, BVN and NIN, review, approved or rejected | backend | NUV-01, MONEY-12, KYC-01 | no |
| NUV-03 | ID document, proof of address and the hosted selfie, then submit for review | backend | NUV-01, KYC-02 | no |
| NUV-04 | The account number, adding money by bank transfer, and the balance | backend | NUV-01, MONEY-10, MONEY-11 | no |
| NUV-05 | Pay from the wallet and held money: book transfers and WAWU's operational account | backend | NUV-01 | no |
| NUV-06 | Send to a bank and pay out, with the account name check | backend | NUV-01, WALLET-14 | no |
| NUV-08 | Reconciliation with Nuvion: missed deliveries, statements and the nightly figures | backend | NUV-04, NUV-05, NUV-06, NUV-07 | no |
| NUV-09 | A dollar wallet for people billed in dollars | backend | NUV-02, NUV-03, NUV-04, NUV-05, TIER-01 | no |
| TIER-02 | Publishing needs a tier: the gate and the product count | backend | TIER-01, ME-17 | no |
| TIER-03 | Buy, renew or upgrade a tier from the wallet | backend | TIER-01, POINTS-01, MONEY-17, MONEY-19 | no |
| TIER-04 | Add 5 more products | backend | TIER-02, TIER-03 | no |
| TIER-05 | Pay by bank transfer at checkout | backend | TIER-03, NUV-04 | no |
| POINTS-02 | Buy points | backend | POINTS-01, TIER-03, TIER-05 | no |
| POINTS-03 | Spend points on AI tools: the cost first, caps, and paying the shortfall from the wallet | backend | POINTS-01, POINTS-02 | no |
| POINTS-04 | Convert points to cash | backend | POINTS-01, TIER-01, MONEY-18 | no |
| REF-01 | Referral points | backend | POINTS-01, TIER-03 | no |
| WEBPAY-01 | Open your wallet on the website | web | NUV-02, NUV-03, NUV-04, NUV-09, MONEY-09 | no |
| WEBPAY-02 | Add money by bank transfer on the website | web | NUV-04, WEBPAY-01 | no |
| WEBPAY-03 | Pay from the wallet on the website: the pay sheet and the PIN | web | MONEY-14, MONEY-17, MONEY-19, NUV-01, WEBPAY-01 | no |
| WEBPAY-04 | Buy a tier on the website | web | TIER-02, TIER-03, TIER-04, TIER-05, WEBPAY-02, WEBPAY-03 | no |
| WEBPAY-05 | Buy points on the website | web | POINTS-01, POINTS-02, TIER-05, WEBPAY-03 | no |
| NUV-10 | Nuvion on the production backend: live key, webhook, operational account, fees and limits | backend (ops) | NUV-01 to NUV-09 | no (waits for Nuvion) |

All are owner `YOU`, priority `launch`, ordered after FIX-17 and before CHECK-3. CHECK-2 (money moves correctly)
moved after them (order 222) and now depends on NUV-10 instead of OPS-10, and on the new money paths.

## Order of work and what runs in parallel

1. **Now, four builders at once:** NUV-01, NUV-07, TIER-01, POINTS-01. They share no files. Also now, on the
   existing list: **MONEY-17 (pay from wallet) is on the critical path of every purchase.** Its branch
   (`wmt/MONEY-17`, d840c73) does not compile on main until it goes through `WALLET_PROVIDER` (MONEY-20 finding 3);
   re-pointing it comes first, then MONEY-19 and MONEY-18.
2. **After NUV-01, five at once:** NUV-02, NUV-03, NUV-04, NUV-05, NUV-06. NUV-01 gives each its own area file
   (`src/nuvion/areas/*.ts`) and its own webhook handler file, and adds the one migration they all write to, so no
   two of them edit the same file. Two or three builders: one on opening (NUV-02 then NUV-03), one on money in and
   book transfers (NUV-04 then NUV-05), one on payouts (NUV-06).
3. **After TIER-01 (and MONEY-17, MONEY-19):** TIER-02 alongside TIER-03; then TIER-04, POINTS-02, POINTS-03,
   POINTS-04 (needs MONEY-18) and REF-01 in parallel; TIER-05 once NUV-04 is in.
4. **Then:** NUV-08 (needs NUV-04 to NUV-07) and NUV-09 (needs NUV-02 to NUV-05).
5. **Web, after the routes it calls:** WEBPAY-01, then WEBPAY-02 and WEBPAY-03 in parallel, then WEBPAY-04 and
   WEBPAY-05 in parallel.
6. **NUV-10, then CHECK-2.**

Files several tasks touch: the payment purposes list (`src/money/dto/money-enums.ts`; TIER-03, TIER-04, POINTS-02,
POINTS-03, POINTS-04 each add one line, a trivial merge) and `data-export-sections.ts` (each new model decided by
the task that adds it). Each later migration is its own folder, timestamped after every folder on main.

## What waits for the Nuvion sandbox key, and what does not

**Nothing is blocked from being built.** Every task above is built and verified against the stand-in today. What
waits:

- **The checks marked (key)** in NUV-01 to NUV-09: one real sandbox call each (the bank list, an entity decision,
  the hosted selfie for a child entity, document uploads, account details going active, a naira inflow, a book
  transfer by `nuvion_ban`, the account name check, a statement, a USD account). The fact that unblocks them:
  `GET https://api.nuvion.dev/bank-codes/NG` answers 200 with the key in the local `.env`, and a lead brief allows
  that host. Until then each is reported NOT RUN with that fact.
- **From Nuvion, not the key:** test BVNs and NINs that approve and reject; NIP test bank accounts; how to credit a
  naira sandbox account (SANDBOX-FINDINGS item 8); whether `POST /kyc/liveness/sessions` and
  `POST /counterparty-lookups` work for child entities with an API key; whether the BVN check compares the phone;
  the written NGN fees and limits.
- **NUV-10 entirely:** the live key, the fees and limits, the production webhook. Until the fee settings are filled,
  every money-moving route under `nuvion` answers `fees_not_set` (NUV-07). That is R-42 working, not a defect.

## Existing tasks this plan replaces, rewires or makes obsolete

Nothing is deleted. The lead decides when to close the obsolete ones and re-point their dependants.

**Rewired** (still built, on the seam; the Nuvion task supplies the provider half):

| Existing | Rewired by | What changes |
|---|---|---|
| MONEY-12, KYC-01 (done) | NUV-02 | Opening is a Nuvion entity and review; no separate BVN lookup under Nuvion |
| KYC-02 (done) | NUV-03 | No selfie match under Nuvion; the hosted selfie, or no selfie (R-39) |
| MONEY-11 (done), WALLET-10 (todo) | NUV-04 | Balance is Nuvion's `available`; money in comes from `inflows.*` |
| MONEY-17, MONEY-18 (todo) | NUV-05 | Book transfers; WAWU's operational account replaces the Fintava merchant wallet (R-42 over R-19). MONEY-17's branch must be re-pointed first |
| WALLET-07, WALLET-16, WALLET-17 (todo) | NUV-05 | Moves are book transfers through the seam |
| WALLET-09 (todo), WALLET-14 (done) | NUV-06 | NIP payouts; Nuvion's bank codes and name check |
| WALLET-15 (done) | NUV-07 | The provider part of a quote comes from the running provider's settings |
| MONEY-16 (todo), MONEY-08 (done) | NUV-08 | The nightly check and the pending sweep read Nuvion through the seam |
| MONEY-14 (done) | NUV-01 | The PIN reset code goes by email under Nuvion |
| ME-17 (done) | TIER-02 | Tiers' 3, 6 or 10 products replace the ticks' 5 and 25 uploads |
| WALLET-32 (after launch) | NUV-09 | The dollar account R-43 needs moves to launch; swaps stay after launch |
| CHECK-2 | this plan | Moved after the new tasks; depends on NUV-10 instead of OPS-10 |

**Obsolete** (Fintava-only, or replaced):

| Existing | Why | Replaced by |
|---|---|---|
| OPS-09 | Fintava dashboard merchant charges | NUV-07 |
| OPS-10 | Fintava live keys, webhook and charges | NUV-10 |
| WALLET-23, WALLET-19 (after launch) | Account limits and tiers from Fintava; Nuvion documents no account tiers | NUV-07 (limits as settings) |
| WALLET-24, WALLET-34 (after launch) | Proof of address later, reviewed by WAWU | NUV-03 (at opening, reviewed by Nuvion) |
| WALLET-25, WALLET-26, WALLET-36 (after launch) | Card and USSD top-up | Transfer only (R-42); NUV-04 |
| WALLET-33 (after launch) | Crypto through Cardex, Fintava's partner | Nothing yet (R-16) |
| ME-18 | Pay for a tick | TIER-03 |
| ME-12, ME-13 | The tick screens (M11 to M14 are replaced by VF5 to VF7) | The mobile VF screens, cut from the round 2 boards |

**For the lead:** CHECK-2 and CHECK-3 still depend on ME-12 and on the bills tasks (BILLS-03, BILLS-05), which are
off at launch (R-42, kept, not deleted); WALLET-05 depends on BILLS-02. Those dependencies need re-pointing when
the mobile VF screen tasks are cut. Kept for rollback and not obsolete: MONEY-06, MONEY-07 and the Fintava paths
of MONEY-12 and KYC-02.

## Not in this plan

- **Mobile screens** for VF, PT, RF, W1, W15, W44 and the new Open your wallet steps: cut from the round 2 boards
  once they are exported into `design/` (R-43). They call the routes above.
- The AI tools and the Voice Intro (ElevenLabs), the draft reminders, the share card image, and event hosting by
  tier (E21). POINTS-03 is the points service they call.

## Owner questions

Each has a default that is built now (Default (agent), owner may override). Already open in R-43 and not asked
again, with the default built: points stay separate from WAWU Credits; tiers and points are WAWU's own sales, so no
split applies; when a tier ends, published products stay up and new publishing pauses (VF14 as drawn); the
Christmas event date shows as "Date to be announced".

1. **Paying needs an open wallet, so the identity check comes before the first payment.** VF15 draws the check
   after payment, but on Nuvion money can only sit in an approved account, and the round 2 checkout pays from the
   wallet or by transfer into the person's own account number. Default: a person opens their wallet (BVN, NIN, ID,
   proof of address) before their first purchase; "bank transfer" at checkout means a transfer into their own
   wallet, and the purchase completes when it lands (TIER-05). The other way would need Nuvion to issue an account
   number per checkout, which its docs do not offer.
2. **How people billed in dollars pay.** There is no card for now (R-44). Default: their own Nuvion dollar account,
   opened with an ID and a proof of address (no BVN or NIN), filled by bank transfer to its USD details (NUV-09).
3. **People who already paid for a verification tick.** Default: they keep publishing under the tick's rules until
   the tick ends, then need a tier (TIER-02).
4. **The phone against the BVN (R-42), if Nuvion cannot do it.** Nuvion's docs return no BVN phone and no match
   (SANDBOX-FINDINGS item 3); the sandbox confirms it once the key works (NUV-02). Default: no phone-to-BVN match
   at launch; the A14 screen shows only if Nuvion reports a mismatch; AUTH-07's email code at sign-up stays the
   protection.
