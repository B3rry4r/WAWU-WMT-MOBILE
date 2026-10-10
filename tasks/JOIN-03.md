---
id: JOIN-03
title: Event registration: claim the paid plan in the app with the access code
owner: YOU
area: WEB
order: 243
priority: launch
repo: wawu-backend, wawu-wmt-mobile
type: money-path
status: verifying
depends_on: [JOIN-01, TIER-01]
decisions: [R-48, R-43, R-47]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# JOIN-03 · Event registration: claim the paid plan in the app with the access code

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, `docs/people/YOU.md`
- DECISIONS.md R-48 (the registration link and the owner's answers), R-43 (the tiers)
- `tasks/JOIN-01.md` (every round and verifier report: the access code, `failed` rows kept for refunds, notes N6 and the round 4 verifier's notes) and `tasks/JOIN-02.md` (the access code screen's words)

## Goal

A person who paid on wawuafrica.com/join gets what they paid for in the app. The owner's words on the access code
screen: "Your code is your key to redeeming your subscription discount when WHO MADE THIS? officially launches on
October 17, 2026. IMPORTANT: Without this code, you'll pay the standard subscription fee of ₦10,000."

## What the code redeems

R-48's answer, built as it stands: the code grants the plan the registration paid for (what Verify gives), its days
starting at claim. The access code screen's ₦10,000 line is what a person without a code pays at launch; it adds no
second price here. If the owner rules otherwise before this is built, the builder builds that.

## Scope (the parts that hold whatever the answer)

- Backend: a signed-in person claims a PAID registration with its access code; the claim proves the person holds the
  registration's verified phone or verified email (never the code alone); a `failed` (refund) row's code is refused;
  a code is claimed once; the claim records `claimedBy` and `claimedAt` and grants what the owner rules, starting at
  claim. The purge and data export maps updated.
- App: where a signed-in person enters the code (after sign-up and in the plan screen), the claim's answers in plain
  words, and what they now have.

## Capability checks

- [ ] A paid code claimed by the person holding its verified phone or email grants what the owner ruled, once.
- [ ] A code claimed by anyone else, a `failed` row's code, an unknown code and a second claim are each refused.
- [ ] The claim never shows another person's details.

## Builder report

Builder, 10 Oct 2026 (Sonnet agent). Backend `wmt/JOIN-03` `8bb6045` (a merge of backend main `181ee5d`, NUV-02 and NUV-03, into the branch built on `7b4ffef`, which already holds JOIN-01
round 4), mobile `wmt/JOIN-03` (this file, with mobile main `aff0e96` merged). depends_on JOIN-01 and TIER-01 are `done`. No Flutterwave, Fintava, Nuvion, wawuafrica.com or AI
host was called. Scratch, scripts, logs and pictures: the lead's scratchpad `join03/` (`live/walk.py`, `shots/`, `mut/`, `logs/`).

**The lead's rulings, as built**
- The code grants the plan the registration paid for (what Verify gives, R-48), its days starting at claim, through ONE grant path:
  `TierGrantService` (`src/plans/tier-grant.service.ts`). TIER-01 holds the tables and the reader, and TIER-03 (the purchase, `todo`) is the
  task that will write them, so no grant function existed to call; this one writes `MakerTier` (dates and copied figures), `EventPass` and the
  bonus points lot through POINTS-01's own `grant`, and TIER-03 is to call the same service (`docs/contract/PLANS.md` section 6). Not a second way.
- The claim proves the person holds the registration's verified phone or verified email; the code alone is never enough. A `failed` (refund)
  row's code, an unknown code, a code claimed already and a code claimed by anyone else are each refused in plain words; no answer carries
  another person's details. A code is claimed once, even under two taps at once on two servers.
- The admin list and CSV show claimed and claimedAt; the CSV's Paid column no longer shows 2000 on `failed` rows.

**How "proven" is read from the Hub (the lead's note from AUTH-07 round 2, G-221).** A phone counts only when the account has PROVEN it, never a
phone that was only typed (a mailed sign-up leaves `phone_verified_at` empty, and a newer sign-up can take such a number); the verified email route
is as before. In `waitlist-claim-proof.ts`, for the caller only (their own token and their own `WalletIdentity` row, by their id):
- EMAIL: the token's `emailVerified` is exactly `true` (WAWU ID's `email_verified`) and the token's `email` is the address;
- PHONE, either of two proofs: (1) the token's `phoneVerified` is exactly `true` (`phone_verified_at` set), or (2) the Hub's `WalletIdentity` holds
  a `verifiedPhone` with `bvnVerifiedAt` set (the BVN check matched the BVN's phone to the account's, G-11) AND that number is still the account's
  current phone, so a number the account has since given up proves nothing;
- a phone that equals the registration's but is neither is refused like any contact that is not the caller's: `code_not_found` (the same words as an
  unknown code, so a holder of a typed number learns nothing), or `contact_not_verified` when the account proves nothing at all.

**FINDING FOR THE LEAD (launch blocker for the EMAIL route and for phones WAWU ID proved, filed as BACKEND_GAPS G-634 and SHARED-CHANGES JOIN-03 #3).**
WAWU ID's access token carries `phone` and `email` whether or not either was proven (a web sign-up types both and still gets a token, G-2; a mobile
sign-up proves one: the phone by SMS today, the email since AUTH-07). So "verified" cannot be read from the token as it is. The Hub reads two flags,
`emailVerified` and `phoneVerified`, from the verified token; WAWU ID sends neither yet, so in production the email route and the WAWU-ID phone route
refuse every claim with `contact_not_verified` until WAWU ID adds them (only a person whose phone the Hub's own BVN check proved can claim today).
Fail closed, never trust a typed number. The WAWU ID change is two lines and a spec (`AccessTokenPayload`/`buildAccessPayload` in
`src/auth/tokens.service.ts`); the diff is ready and proved in `join03/wawu-id-claims.patch` (wawu-id worktree `bi-JOIN-03`, not pushed: this brief
named two repos). The live walk below ran against a real wawu-id with that patch.

**Built (backend).** `POST /waitlist/claims` (signed in, body `{ code }`, answers `WaitlistClaimView`: offer name, days, `extended`, points
granted and when they end, and the person's tier exactly as `GET /me/tier` answers it): `waitlist-claim.controller.ts`, `waitlist-claim.service.ts`,
`waitlist-claim-proof.ts` (the proven contacts, the code reader), `waitlist-error.ts` (seven new `reason.code`s), `dto/waitlist.dto.ts`,
`waitlist-view.type.ts`, `waitlist.module.ts` (now imports `PlansModule`, `WawuAuthModule`; the claim lives here and NOT in the route-free
`WaitlistCoreModule` the Flutterwave webhook imports). `src/plans/tier-grant.service.ts`, `plans.module.ts` (imports `PointsModule`, exports the
service; both already mounted ahead of it, so no route moves). Admin: `claimed` on the list, `Claimed` and `Refund due (₦)` columns on the CSV
(`waitlist-export.ts`, `waitlist.service.ts`). Migration `20261019150000_waitlist_claim_paid` (+ `rollback.sql`): one CHECK, only a paid row can
have an owner; `prisma/schema.prisma` untouched. `account-data-map.ts` comment; `docs/contract/PLANS.md`. `contract/openapi.json` regenerated: one
operation, two schemas, one field; nothing removed or changed.
**Built (mobile).** `src/features/claim/` (`ClaimCodeScreen`, `model`, `claimFailure`, `api`), route `src/app/claim-code.tsx`, a Settings row
"Access code" ("Claim a plan you paid for at an event", drawn only when the route passes a handler, R-47), contract and generated types copied from
the backend branch (SHARED-CHANGES JOIN-03 #2), `docs/designer/BRIEF.md` (the added row and the screen, no artboard).

**How the claim decides** (`WaitlistClaimService`): the code is read as 8 hex digits (spaces, dashes and lower case accepted) else `code_invalid`
400; no proven phone or email on the account (read as above): `contact_not_verified` 409; an unknown code, an unpaid one, or one whose registration contacts the
caller has not proven: the SAME `code_not_found` 404 (a guesser learns nothing about which codes exist); from here the caller has proven the
registration is theirs: a `failed` row is `code_refunded` 409, an owned row is `claimed_by_you` or `already_claimed` 409, an offer no longer in the
plans file is `offer_unavailable` 409. Then, in ONE transaction: a conditional `UPDATE ... WHERE status = 'paid' AND claimedByWawuId IS NULL`
(the second tap queues on the row, finds it claimed and is refused), then `TierGrantService.grant`. A grant that fails rolls the claim back.

**Capability checks**
1. A paid code claimed by the person holding its verified phone or email grants what the owner ruled, once. `waitlist-claim.contract.spec.ts`
   (24 tests, HTTP, real database, real RS256 tokens) and `waitlist-claim-proof.spec.ts` (8, the proof rules alone): the plan from the offer's `tier_days`, counted from the claim (the row was paid 21 days
   earlier); pass, 100-point lot (90 days) and the claim written once; verified email alone, verified phone alone, the phone in four spellings, the
   code in four forms; `tier_days` changed gives the new days; 6 taps at once on one server and on two servers: one 200 and five 409, one tier row,
   one pass, one lot; two accounts on one phone tapping at once: one wins. Live (`live/walk.py`, 31 of 31): real wawu-id sign-in, real Hub build,
   real app: the screen shows "Your plan is ready" with Verify, 9 Nov, 3 products, 100 points, the pass; the database holds a `verify` tier of exactly
   30 days, the row claimed by that account, one pass and one new lot; a plan already held gets the 30 days added (Verify Plus to 18 Apr 2027); an
   account whose phone is only typed is refused for a registration with that phone and another email, then claims it once the Hub's own BVN check
   (`WalletIdentity`, a passed check for that number) proves the phone.
2. A code claimed by anyone else, a `failed` row's code, an unknown code and a second claim are each refused. Spec: each, plus an unpaid code, a code
   that is not 8 characters, a typed-only account, a half-proven account, and a TYPED-ONLY PHONE THAT EQUALS THE REGISTRATION'S (refused as an
   unknown code, byte for byte; asked to confirm a contact first when nothing is proven); the Hub's BVN-proven phone claims, and does not without a
   passed check, for a number the account no longer has, or from another person's proof; nothing granted each time. Live: unknown, someone else's, own refund row,
   a code claimed by another account, the same code again, a typed-only account: each in plain words and nothing granted.
3. The claim never shows another person's details. Spec: every refusal body is searched for the registration's name, phone (two spellings), email,
   reference, transaction id, row id and the owner's id: none; an unknown code and someone else's code answer byte-identically. Live: the screen for
   someone else's code is the same text as for an unknown code and holds no part of that registration.
Also: the days are added to a plan the person already holds (whichever tier; the end moves by the offer's days), an ended plan is replaced from
the claim; the purge removes the claimed registration, the tier, the pass, the lot and its ledger and leaves a bystander's, and the export carries
each (`the purge and export maps cover everything a claim writes`); a CHECK refuses an owner on a pending or failed row; the CSV lists a refund in
`Refund due (₦)` and not in `Paid (₦)`.

**Numbers (backend).** `npx tsc --noEmit` 0. eslint (`--no-fix`) 0 and prettier clean on every changed `.ts` file. New and changed specs:
`waitlist-claim.contract` 25, `waitlist-claim-proof` 8, `tier-grant` 6, `waitlist-admin` 6 (was 5). Private network namespace (own :4001, fresh migrated and seeded `bj03_ns_test`) on the final head `8bb6045`:
`waitlist plans points payment-webhook account-purge account openapi common me`: 30 suites, 542 of 542 (`src/waitlist` 9 suites 155, `src/plans` 6 suites 102,
`src/points` 59, `src/payment-webhook` 17, `src/common` including route shadowing 148, `src/me` 37, `src/account` 6, `src/account-purge` 4). A run before
the merge of backend main added `src/data-export-request`: its `data-export.contract.spec.ts` fails 14 tests in this harness ("a user can ask for
their data and the link is emailed", `fulfil` answers false) and the same 14 fail on `git archive` of backend `origin/main` in the same harness (16
tests, 14 failed), so they are not from this task; it was left out of the final set for that reason. `hub-rate-limits.contract.spec.ts` (host network) 22 of 22 (no `@Throttle` was added: the claim
answers under the global limits, and a guess learns nothing). Protected suite `scripts/protected-routes/run.sh --fresh HEAD` in a private network
namespace on the final head `8bb6045` (earlier runs on `da3c58f` and `a89512b`, before the merge of main and the migration renames, were 253 of 253 too),
lock `origin/main` `181ee5d`: 253 of 253, "all 244 required tests passed", lock files untouched. Gates `python3 scripts/gates/run.py`: 16 fail, 88 warn, 76 accepted on the branch and on
`git archive` of `origin/main` `181ee5d`, the output identical line for line (the first run had a 17th: a comment said "never a start in the future", which the deferrals
gate reads as prose; reworded). `check_baseline.py` clean. `npm run contract:build` run on the branch after the merge, twice: `contract/openapi.json` byte
identical each time and to the auto-merged file (sha256 `9163705b...3b74`); before the merge it was identical three times (`20557e76...13bf`). The
same file is in mobile `contract/` (`SOURCE_COMMIT` `wmt/JOIN-03@8bb6045`); against backend main it adds one path (`POST /waitlist/claims`), two schemas
and the admin list's `claimed`, and removes or changes nothing. Migration `20261019150000_waitlist_claim_paid` sorts after
every folder on main (newest `20261019120000`, NUV-02 and NUV-03) and on every open branch, leaving room for MONEY-17 and INBOX-05 (the lead's note; it was
`20261019110000`, then `...130000`, and is now `...150000`); `migrate deploy` applies it after
main's 114, its `rollback.sql` runs and applies again clean; `prisma migrate diff` shows only the `ContentPiece` index line main's schema also shows.
wawu-id (the ready patch, worktree `bi-JOIN-03`): `token-contact-proof.spec.ts` 6 of 6; the rest of `src/auth`: the other 15 suites pass except one timing test (`AUTH-08 ... under a second`, 1208 to 1317 ms against the 1000
limit at a load average of 18 to 36); the same test fails the same way on an unpatched checkout of wawu-id `origin/main` `fb8717e` (1408 ms), so it
is the machine's load, not the patch. Five suites also hit 5 s argon2 timeouts in the first, loaded run and pass with `--testTimeout=120000`.
**Mutants (backend, 23, each applied alone to the source, the specs that should catch it run, source restored, tree clean after; all killed; the
whole set was run again after the lead's note on proven phones):** M1 and M2 a contact accepted without its proven flag (phone, email); M3 any proven
contact wins, matched or not; M4 the token's phone compared as typed; M5 the code read case-sensitive; M6 a refund row claimable; M7 an unpaid row answered differently from an unknown code; M8 the conditional claim
ignoring an earlier claim; M9 a claim by someone else told as the owner; M10 the claim marked before the transaction; M11 the days counted from the
payment; M12 a held plan extended from now not from its end; M13 an ended plan extended instead of replaced; M14 no bonus points; M15 the pass
reference not the grant reference; M16 a repeated reference granting again; M17 grants not serialised per person; M18 the offer's days ignored;
M19 the CSV Paid showing a refund; M20 the admin list never saying claimed; M21 the Hub's phone counted without a passed BVN check; M22 the Hub's
phone counted although the account now has another number; M23 the Hub identity read for anyone with a verified phone, not the caller (this one
SURVIVED the first time: no spec had the other person's passed check as the only one in the table; the spec "does not count another person's proof
of the same phone" now kills it). Logs `join03/mut/`.

**Numbers (mobile).** Before: `npm run gates` 10 run, 469 files, 0 fail, 1 warn (`PROVISIONAL(HOST-PICKER)`), 0 accepted. After: 477 files, the same.
New tests `src/features/claim/__tests__`: `model` 7, `claimScreen` 16, `settingsEntry` 2. Mobile `npm run check` on the final head (backend contract `8bb6045` copied in, mobile main `aff0e96` merged): EXIT 0, typecheck and lint 0, jest 123
suites 2043 tests (it was 121 and 2029 before the later tests and the merge), gates 10 run, 480 files, 0 fail, 1 warn, 0 accepted, 273 tasks and 279
artboards. The runs before it: EXIT 0 on the earlier head; then one run EXIT 1 with the known load flake in `eventsScreens.test.tsx` (D8, at a load average of
30), which passes alone (46 of 46); then the run above.
**Mutants (mobile, 11, applied alone, `src/features/claim` and the Settings tests run, source restored; all killed):** MM1 no guard against a second
send in the same frame; MM2 the field not upper-casing; MM3 the space sent with the code; MM4 a refund code given the generic words; MM5 "already used"
told as "yours"; MM6 the points lines left out; MM7 an extended plan told as new; MM8 a short code sent; MM9 the Settings row drawn without a place to
go; MM10 a refusal clearing the typed code; MM11 the unconfirmed-contact note saying the code is wrong.

**Pictures** (390 px, light and dark, from a web export with its OWN Metro cache, `TMPDIR` in the scratchpad; the bundle was grepped and holds
`localhost:6162` and `localhost:6163` only; every request outside those ports and the page's 6164 was aborted and none was made): the real app
against the real Hub and the real wawu-id, signed in through the real sign-in screen. There is no artboard for this screen (`artboards: []`), so
none is "beside": `join03/shots/ref-A22-*.png` is the sign-in canvas it is built in the style of. Sheets `shots/sheet-1-light.png`, `sheet-1-dark.png`,
`sheet-2-light.png`, `sheet-2-dark.png`; files `shots/NN-<state>-<light|dark>.png`: 01 Settings with the row, 02 empty, 03 short code, 04 a letter after
F, 05 typed, 06 not matched, 07 refund code, 08 offer gone, 09 already used, 10 offline, 11 busy (a held request), 12 plan ready, 13 already claimed
by you, 14 plan ready with days added to a plan already held, 15 an account whose contacts were only typed (a session wawu-id gave a web sign-up,
put in the browser's storage: the app has no screen for that sign-up), 16 a typed-only phone that equals the registration's. Every state came from a real cause: a real answer from the real Hub, a
request aborted for "offline", a request held for "busy". I do not say they match anything.

**Decisions (each Default (agent), owner may override)**
- Grant rules for a person who already holds a plan: not ended, whichever tier, the offer's days are added to its end and everything else is left
  (no downgrade, no change of tier); none or ended: this tier from the moment of the claim. The bonus points lot and the pass are granted either way.
- The days are the offer's `tier_days` (default the tier's days), from the claim. What it gives is what the Verify entry in `plans.config.json` says
  (3 products, 100 points for 90 days, the Watch live pass, the first Voice Intro), copied onto the row, so a later config change takes nothing away.
- The Hub's own phone proof (`WalletIdentity`) counts only while the proved number is still the account's current phone and the BVN check passed
  (`bvnVerifiedAt` set): a number the account has given up, a stored-but-unchecked number and another person's proof count for nothing.
- The claim does NOT fix the billing currency: the registration was paid by Flutterwave checkout, not through a wallet purchase, and TIER-01 fixes
  the currency at a wallet purchase; the person's currency is still decided at their first real purchase.
- One answer (`code_not_found`) for an unknown code, an unpaid one and one the caller has not proven, so the route is no oracle for which codes exist;
  `contact_not_verified` is its own answer because it is about the caller's own account. No per-account attempt counter: the proof, not a rate, is what
  keeps a code from the wrong person, and the global per-address limits apply (no `@Throttle` override, so the rate-limit spec is untouched).
- The CSV: `Paid (₦)` is empty on a `failed` row and the amount is in a new `Refund due (₦)` column (a filter on a non-empty Paid cannot count a
  refund as income); `Claimed` (`yes` or `no`) comes before `Claimed at`.
- The entry is Settings > Access code (route `/claim-code`). "After sign-up" needs a guarded step in the root layout, and "in the plan screen" has
  no screen yet (VF5 to VF14, TIER-02 to TIER-05 are `todo`): SHARED-CHANGES JOIN-03 #4 (open, the lead decides). The row is a deviation from
  artboard Z2, listed in `docs/designer/BRIEF.md`.
- The success screen lists points, the event pass and the first Voice Intro because the Hub's answer says the plan gave them (what Verify gives,
  R-48), though the screens that spend or use them are not built; each line is the Hub's own and none is worked out on the phone.
- A failed claim keeps the typed code and shows the Hub's words as the app's own plain sentences; only `offer_unavailable` shows the Hub's sentence
  (it names the support address the website already uses).

**Gaps and shared changes filed.** BACKEND_GAPS G-634. SHARED-CHANGES JOIN-03 #1 (migration and contract, made on the branch), #2 (mobile contract
copy, made on the branch), #3 (WAWU ID's two claims, open, needed for production), #4 (the post-sign-up step, open).

**NOT RUN**
- A claim against a real WAWU ID that already sends the two flags: unblocked when SHARED-CHANGES JOIN-03 #3 merges and deploys (the walk used the
  same change in a local wawu-id). Until then production refuses every claim with `contact_not_verified`.
- A real Flutterwave payment turning into a claim: the paid rows in the walk were written by SQL (the stand-in mock cannot confirm a waitlist payment,
  JOIN-01 N10); the claim path from the row on is real. Unblocked by the owner's one real payment on production (JOIN-01 NOT RUN).
- A phone (V10) and the release build: unblocked by a tester build pointed at a deployed backend.
- The post-sign-up step and the plan-screen entry: see Decisions (SHARED-CHANGES JOIN-03 #4; the plan screens' tasks).
- `data-export.contract.spec.ts` green in this harness: it fails the same 14 tests on main's code here; unblocked by running it where it passes
  (`npm run test:contract` with the stand-in WAWU ID on :4001 and the mail outbox reachable).
- The full backend suite (229 suites) as one run: the touched modules' suites and the protected suite ran; unblocked by `npm run test:contract` in a
  private namespace.
- Production Postgres: the new CHECK needs nothing beyond what the table already has.

### Builder report, part 3 (WAWU ID)

Builder, 10 Oct 2026 (Sonnet agent). This is the part the first report called "not pushed: this brief named two repos"; it is now built and pushed
(SHARED-CHANGES JOIN-03 #3, BACKEND_GAPS G-634; the gap was filed as G-629 and renumbered, because SCHOOLS-03 holds G-629 and WALLET-06 holds G-630 to
G-633). wawu-id branch `wmt/JOIN-03` `5b132f7`, on `origin/main` `fb8717e`. No server was started and no provider was called.

- **The change.** `src/auth/tokens.service.ts`: the access token carries `emailVerified` (true only when the account has an email AND `email_verified`)
  and `phoneVerified` (true only when `phone_verified_at` is set). Two additive claims; every other claim is as it was. `AccessTokenPayload` says what
  they mean. `WAWUAfrica_API_Contracts.md` has a paragraph for them. `contract/openapi.json` does not describe token claims, so it is unchanged:
  `npm run contract:build` run twice leaves it byte-identical (sha256 `eae61a48...ea11` each time and before).
- **Spec.** `src/auth/token-contact-proof.spec.ts`, 7 tests (the first report's 6, plus a released phone): a web sign-up with a confirmed email proves the
  email only; a phone-code sign-up proves the phone and not an email it never confirmed; an email-code sign-up (AUTH-07) proves the email and leaves the phone
  unproven; typed-only contacts prove nothing; an absent email is never proven whatever the flag says; a released phone (`released:<id>`, never proven) is an
  empty `phone` and `phoneVerified: false`; the old claims are all still there. On `origin/main`'s `tokens.service.ts` 6 of the 7 fail (the seventh checks
  claims that already exist); on the branch 7 of 7 pass.
- **AUTH-07 (wawu-id `origin/wmt/AUTH-07`).** Trial merge into a throwaway copy of the branch: 0 conflicts (git merged `tokens.service.ts` and
  `WAWUAfrica_API_Contracts.md` on its own; `released-phone.ts` and the sign-up files are not touched by this change). On the merged copy: `tsc` 0,
  `token-contact-proof` 7 of 7, `unproven-phone` 18, `released-phone` 3, `two-tick-verification` 12, `email-signup.service` 47, `signup-channel.service` 17,
  `contract` 5, all green. AUTH-07 releases a number by writing `released:<id>` and leaving `phone_verified_at` empty, so the released account's token says
  `phoneVerified: false` (and an empty `phone`).
- **Checks (wawu-id).** `npx tsc --noEmit` 0. `eslint --no-fix` on the two changed files: 8 errors, all in lines this change did not touch (prettier and one
  unnecessary-assertion rule at lines 159 to 181 and 370 of `tokens.service.ts`), the same on `origin/main`; none in the new lines or the spec.
  `python3 scripts/gates/run.py` 9 run, 0 fail, 20 warn (all `PROVISIONAL`), `check_baseline.py` clean. `jest src/auth`: 12 of 16 suites pass in one loaded
  run (load average 17 to 35); the other 4 (`phone-signup.service`, `signup-sequence.service`, `pending-signup-no-session`, `refresh-token-lookup`) hit the
  5 s argon2 timeout; run alone with `--testTimeout=120000`, the first three pass (44, 22, 14 tests). `refresh-token-lookup` passes 19 of 20 and fails the one
  timing test ("under a second"): it fails the same way on `origin/main` (refresh 1046 ms, sign-out 530 ms there), so it is the machine's load, not this change.
- **NOT RUN.** A claim against a deployed WAWU ID that sends the flags: it needs the merge and a WAWU ID deploy (until then production refuses every claim
  with `contact_not_verified`, as above). The first report's live walk already ran the Hub against a real local wawu-id with this same two-line change.

## Owner sign-off
