---
id: JOIN-03
title: Event registration: claim the paid plan in the app with the access code
owner: YOU
area: WEB
order: 243
priority: launch
repo: wawu-backend, wawu-wmt-mobile
type: money-path
status: building
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

## Verifier report

Verifier, 10 Oct 2026 (Sonnet agent, an independent session that wrote none of this). Heads: backend `wmt/JOIN-03` `8bb6045` (backend main `181ee5d`
is already inside it), wawu-id `wmt/JOIN-03` `5b132f7` (main `fb8717e` is its base), mobile `wmt/JOIN-03` `ab37542` (mobile main moved to `90bdbfc`
since the builder merged). Evidence: the lead's scratchpad `vjoin03/` (`harness/` = my own drivers `s1` to `s9`, `live/states.py`, `mut/`, `logs/`,
`shots/`). The REAL wawu-id (branch, then main, then the AUTH-07 merge) and the REAL built Hub (two copies on one database) ran on ports 6161, 6162 and
6164; Resend and Fintava SMS were stood in on 6163 (a receiver that records the mail and the text). No Flutterwave, Fintava, Nuvion, wawuafrica.com or
AI host was called. The paid rows were written by SQL (the registration page cannot pay here); every claim path from the row on is real.

**Verdict: building. One blocker (D1), one low defect (D2).** The claim does what R-48 rules and held under every attack I ran except one: D1, a way
the "proven phone" flag stays true for a number nobody proved. Everything else is CONFIRMED below. If the lead rules that no service lets a signed-in
person change their phone through WAWU ID's internal routes (and that none will before launch), D1 drops to a should-fix and the status can be `review`.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed | Backend `tsc --noEmit` 0. `scripts/gates/run.py`: branch 16 fail, 88 warn, 76 accepted; `git archive` of `origin/main` the same 16 fail (sorted FAIL lines `diff` empty; files scanned 1091 against 1084). `check_baseline.py` exit 0. wawu-id: `tsc` 0; gates 9 run, 101 files, 0 fail, 20 warn; eslint on `tokens.service.ts` 8 errors at lines 159 to 164, 181, 370, the same 8 as main at 147 to 152, 169, 358 (12 lines earlier), none in the new lines or the spec. Mobile (trial merge of `origin/main`, see below): `typecheck` 0, `lint` 0 errors (7 warnings, all in other tasks' tests), jest 123 suites, 2042 of 2043: the one failure is `OpenWalletScreen.test.tsx` (20 s timeout at load average 24 to 34), 37 of 37 alone; `npm run gates` 10 run, 480 files, 0 fail, 1 warn, 0 accepted; `npm run tasks` exit 0. The same chain on the branch itself is the last line of this report. |
| V2 Contract | passed | HTTP against the real Hub: the code as `5f6c 15e4`, `5F6C-15E4`, upper and lower case (200); `ZZZZ ZZZZ` 400 `code_invalid`; missing, number, array, null, empty, 50 characters, and an extra property: 400 (a validation line, no `reason`). Token phones in the three forms WAWU ID writes: `08...` typed (BVN route claims), `+234...`, `234...` without the plus (an account whose phone was changed through the internal route): all read as the same number. `npm run contract:build` run twice: `contract/openapi.json` sha256 `9163705b...3b74` both times, equal to the committed file (tree clean) and to mobile's copy; `python3 scripts/api/sync_contract.py` on the merged mobile copy changes nothing (generated types match). Against main: one path, two schemas, one field added (builder's claim, not re-derived: the file is byte-identical to the auto-merged one). |
| V3 Regression | passed | `scripts/protected-routes/run.sh --fresh HEAD` in a private network namespace (own :4001, fresh migrated and seeded database): code `HEAD (8bb6045)`, lock `origin/main (181ee5d)`, 253 of 253, "all 244 required tests passed". |
| V4 Field trace | passed | `claimedByWawuId` and `claimedAt` (written once by the claim, the CHECK pair and the paid CHECK hold): read by the admin list (`claimed`, `claimedByWawuId`, `claimedAt`), the CSV (`Claimed`, `Claimed at`), the purge map (OWNED) and the export (spec `waitlist-claim.contract`, "the purge and export maps cover everything a claim writes", passes). `MakerTier`, `EventPass`, `PointLot`, `PointLedger`: read by `GET /me/tier` (the claim answer's `tier` equals `GET /me/tier` for the same account, byte for byte, `s8`), the purge and the export. On the app, every line of "Your plan is ready" (plan, end date, products, points and their end, pass, Voice Intro) is the Hub's answer and matches the rows. |
| V6 States | passed | 18 states, each by its real cause, 390 px, light and dark (list under Pictures). A capture of the generic error screen: none. |
| V7 Flow walk | passed (D1 aside) | Cold start through the real sign-in screen as: a mobile sign-up whose phone was proven by SMS; the same plus an email proven afterwards; a web sign-up with a verified email only; a web sign-up with nothing proven (session wawu-id issued, put in storage: the app has no screen for it); an account already on Verify Plus; an account that holds a phone of a registration another account claimed. AUTH-07 (merged copy): an email-code sign-up proves the email and not the phone; a typed phone released to a newer sign-up reads as an empty phone and `phoneVerified: false`. Resume: see N1 (a token issued before a contact was proven). |
| V8 Money attack | passed (adapted: the claim moves no money, it grants) | Below. |
| V9 Live seam | passed | Real wawu-id sign-in screen (no injected token) for the three accounts that claim (a phone-proven one, one already on Plus, one holding a claimed registration's phone); the fourth (typed-only) had the session wawu-id issued put in storage; the claim wrote a `verify` tier of exactly 30 days from the claim, the row claimed by that account, one pass, one lot, one ledger row, read back by the admin list and CSV. |
| Mutants | 44 run, 39 killed, 5 survived | Below. |

### Capability checks, as written

1. **A paid code claimed by the person holding its verified phone or email grants what R-48 rules, once: CONFIRMED.** Verify, 30 days exactly
   (`activeUntil - activeFrom` = 30 x 86,400,000 ms, from the claim), 3 products, 100 points ending after 90 days, the Watch live pass, the first
   Voice Intro; one `MakerTier`, one `EventPass`, one `PointLot`, one `PointLedger` row (`s1`, `s2`, `s8`). The plan goes through
   `TierGrantService`, the only code that writes `MakerTier`, `EventPass` or `PointLot` (grep of `src/`). A phone proven by SMS claims, an email proven
   by the mailed code claims, a phone the Hub's BVN check proved (and that is still the account's phone) claims.
2. **Refusals: CONFIRMED** (`s1`): unknown, unpaid (`pending`), someone else's, a `failed` row (refund), a used code, a second claim, a code that is
   not 8 characters, no token (401). Unknown, unpaid, someone else's and a refund row met by a stranger are the same bytes (`text` equal). A refund row
   met by its own payer says "That code cannot be used ... extra payment ... refunded". A typed-only account is told `contact_not_verified` whatever
   code it sends (so the answer is about its own account, never about the code).
3. **No answer shows another person's details: CONFIRMED.** Three callers (proven phone, typed-only, proven email) against a registration with a
   distinctive name, phone, email and reference: no refusal body contains any of them; the Hub log holds one line per claim with a row id, no phone,
   email or code.
4. **Many taps at once on two servers: one 200: CONFIRMED** (`s2`). 24 taps on one account, alternating the two Hubs: one 200, 23 `claimed_by_you`,
   one of each row. Two accounts that each hold one contact of the same registration, 20 taps on both servers: one 200 overall (9 `claimed_by_you` for
   the winner, 10 `already_claimed` for the loser), the loser has nothing, the winner exactly one of each. Two registrations of one account, 4 taps:
   both claimed once, 60 days, two passes, two lots.
5. **Proof with and without WAWU ID's flags.** With the branch (`s1`, `s3`): the matrix above. Typed-only phone equal to the registration's, on an
   account that also has a PROVEN email: `code_not_found` (`s9`). Forged tokens: payload edited with the signature kept,
   `alg: none`, HS256 signed with the public key as the secret: 401 each. Another person's passed BVN check for the same phone, a stored phone with
   `bvnVerifiedAt` empty, a BVN phone the account no longer has: each refused (`s3`). With wawu-id main, what production does today (`s4`): the token has
   neither flag; the SMS-proven phone and the mail-proven email both answer `contact_not_verified` and nothing is granted; the Hub's BVN route still claims.
   So until WAWU ID deploys `5b132f7` (or later) no claim works except by the BVN route (known, G-634, SHARED-CHANGES JOIN-03 #3); either deploy order is safe.
6. **The migration `20261019150000_waitlist_claim_paid`: CONFIRMED.** Sorts after main's newest (`20261019120000_nuvion_documents`); on a database
   migrated with main's own folder set, `migrate deploy` of the branch applies exactly that one (116 then 117); the CHECK refuses an owner on a `failed`
   row (UPDATE) and on a `pending` row (INSERT); `rollback.sql` drops it and its history row, `migrate deploy` applies it again, `migrate status` up to
   date. `prisma/schema.prisma` is byte-identical to main's; `migrate diff` shows the one `ContentPiece_specializations_idx` line main also shows;
   `git diff origin/main..HEAD -- prisma` is the two new files.
7. **Admin list and CSV: CONFIRMED** (`s6`, real admin login). The list carries `claimed`, `claimedByWawuId`, `claimedAt`; a `failed` row shows
   `paidKobo` 200000 and is never claimed. The CSV (BOM, 17 columns) has `Refund due (₦)` and `Claimed`; on the 2 `failed` rows `Paid (₦)` is empty
   and `Refund due (₦)` is 2000.00; no other row has a refund; `Claimed` is `yes` exactly where `Claimed at` is set (19 yes, 10 no); `rowCount` equals the
   lines; no token and a user token are 401.

### Defects

- **D1 · defect · medium · BLOCKER (the lead can lower it, see the verdict) · `phoneVerified` stays true after a phone change nobody proved.** WAWU ID's
  two internal phone-change routes write the new number and leave `phone_verified_at` as it was (its own contract doc says so: "Changing a phone number
  through the internal routes writes the phone and nothing else, so a mobile account keeps its right to sign in"). `phoneVerified: user.phoneVerifiedAt !== null`
  then vouches for a number that was never texted or checked, and the claim accepts it. Reproduction (real wawu-id `5b132f7`, real Hub `8bb6045`;
  `harness/s3.mjs` last check, `harness/s5.mjs`): (1) account A signs up on mobile, its phone proven by SMS; (2) a paid, unclaimed registration whose
  phone is V, a number A never proved; (3) `PATCH /internal/users/<A>/phone` with the service key, or `POST .../phone/request` and `.../phone/confirm`
  with the code mailed to A's own email (the "verified" flow proves the mailbox, not the number): 200; (4) A's next token says `phone` V,
  `phoneVerified: true`; (5) `POST /waitlist/claims` with the registration's code: 200, the plan is granted to A. The code alone is then enough for
  anyone who can hold it and change a phone, which is what R-48 and the task say must never be. Exposure: the routes need `X-Service-Key`; nothing in
  the Hub (grep), the web (grep) or the app calls them; WAWU ID's own comment says the legacy API proxies "a user's own phone update" there, and that API
  is not here, so whether a signed-in person can reach it is for the lead. Fix is in WAWU ID (not made here): e.g. an additive nullable column holding
  the number `phone_verified_at` was set for, with `phoneVerified` true only while it equals the account's phone (backfilled from rows that have
  `phone_verified_at`), or clearing the proof in those two routes if the sign-in rule can bear it. The Hub's side needs no change then.
- **D2 · defect · low · the wrong gap number in the backend.** The gap was renumbered G-634 (SCHOOLS-03 holds G-629) but the backend branch still says
  `G-629` in `src/waitlist/waitlist-claim-proof.ts` line 26, `src/waitlist/tests/waitlist-claim.contract.spec.ts` line 34 and `docs/contract/PLANS.md`
  line 147; a reader follows it to SCHOOLS-03's gap. Comments and one doc line only.

### Notes (not defects)

- **N1 · low · a contact proven in the app is not in the token until it refreshes.** The app refreshes only on a 401, so for up to 15 minutes after
  someone proves the registration's EMAIL in the post-sign-up step, their old token still says `emailVerified: false` and the claim answers
  `code_not_found` ("... that you have confirmed it"). Reproduced: `s7` (404 with the old token, 200 with a fresh one). The phone route is not affected
  (the phone is proven before the first session). The app could refresh once on that answer.
- **N2 · unclear (lead) · "Your plan is ready" lists things whose tasks are not built.** Products you can publish (3), points added and when they end,
  the event pass, the first Voice Intro. Each line is the Hub's answer and the rows back it (V4), so nothing is invented; but TIER-02 (the publishing
  gate), the points tools and Voice Intro are not built, and the flat 5-item cap (`MAX_ITEMS_PER_ACCOUNT`) is what the backend enforces today, so "3
  products" is a promise of the plan, not a rule in force. Keep (it is what R-48 says the money buys) or trim to plan and end date until those tasks land.
- **N3 · low · a lost answer cannot be replayed.** A claim that succeeded but whose answer never reached the phone shows "No connection"; the retry says
  "You already claimed this code. Your plan is already on your account." The plan is there, but there is no plan screen to see it (TIER-02 to TIER-05
  todo). Answering `claimed_by_you` with the same view would close it.
- **N4 · low · CSV columns.** `Refund due (₦)` is inserted before `Paid at` and `Claimed` before `Claimed at`, so those columns move one place right;
  `Fee` and `Paid` keep their places. A consumer that reads by position breaks; by header it does not.
- **N5 · low · words nobody reads.** A body without `code` or with a non-string `code` answers 400 "code must be shorter than or equal to 40 characters"
  (the app never sends it). The "offer gone" banner says "no longer available" in its title and again in its body.
- **N6 · note · stamp room.** The lead's note says INBOX-05 can still stamp before `20261019150000`; its branch is already `20261020120000`, which sorts
  after. MONEY-17 (`20261019130000`) does sort before. Harmless (independent tables).
- **N7 · note · the proofs, for the owner.** The BVN route proves a phone by a BVN whose phone equals the account's phone: it needs the other person's
  BVN and phone, weaker than a text, and the same proof PIN reset already uses. WAWU ID backfilled `email_verified = true` for every account that existed
  before its sign-in gate (migration `20260816020000`), typed or not, so a legacy account's email counts as proven.
- **N8 · note · production until WAWU ID deploys.** A person whose phone WAWU ID did prove sees "Confirm your phone number or email first". True to the
  Hub, wrong to the person, for as long as `5b132f7` is not deployed.

### Rulings asked for

- **A person with a running plan gets the days added to its end, whichever tier: RULED, accept as built.** It matches TIER-03's renewal rule (extend from
  the current end) and its "no downgrade while a tier is active"; the end moves by exactly the offer's days (`s2`: Verify +30 days, start and tier
  untouched; Plus +30 days, still Plus; an ended plan is replaced from the claim, Verify, 30 days from now; the pass and the 100-point lot are granted
  either way). The one oddity, Verify's days lengthening a Plus or Founding plan, cannot happen at launch because no purchase writes a plan yet (TIER-03
  is todo); the owner can override.
- **The Z2 deviation (a fourth Settings row, "Access code", no artboard): `differs-for-recorded-reason`.** `docs/designer/BRIEF.md` carries the Z2 entry and
  the screen's entry; the row is drawn only because the screen exists and opens it (R-47), and `settingsEntry.test` plus the live walk prove it opens.
  The row has a second line the others do not; it sits in the same group and tile style.
- **"Settings only" as the entry: accepted for `review`, flagged for the lead.** The task asks for the code to be enterable "after sign-up and in the plan
  screen". The plan screen does not exist (R-47 forbids drawing a way to it); the post-sign-up step is buildable and is SHARED-CHANGES JOIN-03 #4, open.
  Without it a person who paid and signs up on 17 October is not led to the screen anywhere in the app, and the registration page names the code but not
  where to put it. Not a capability-check failure; the lead decides before launch.

### Trial merges (throwaway copies, never pushed)

- **Backend:** `origin/main` `181ee5d` is an ancestor of the branch: nothing to merge, 0 conflicts; the branch is the merged state. Merged state: `tsc` 0; the
  waitlist, plans and points specs on a fresh migrated and seeded database `vj03_ns_test` in a private network namespace: 17 suites, 316 of 316
  (`src/waitlist` 155, `src/plans` 102, `src/points` 59); also `src/me`, `src/payment-webhook`, `src/account`, `src/account-purge`, `src/mentor*`,
  `src/openapi`, `src/common`: 174 pass, and `src/common/tests/protected-registry.regression.spec.ts` fails 52 only inside that combined run ("fetch
  failed, other side closed" talking to the mock WAWU ID) and passes 52 of 52 alone, so it is the harness, not the branch.
- **wawu-id:** `origin/main` `fb8717e` is its base: 0 conflicts. `origin/wmt/AUTH-07` (`955e61f`) into the branch: 0 conflicts (git merged
  `tokens.service.ts` and the contract doc), `tsc` 0, 7 suites 109 of 109 (`token-contact-proof` 7, `unproven-phone`, `released-phone`,
  `two-tick-verification`, `email-signup`, `signup-channel`, `contract`), and live (`s9`): see the table.
- **Mobile:** `origin/main` `90bdbfc` into the branch: 2 conflicts, both generated or hand-resolvable: `contract/SOURCE_COMMIT` (take the branch's
  `wmt/JOIN-03@8bb6045`; main's is `181ee5d`) and `docs/PROGRESS.md` (take either side, then `python3 scripts/tasks/check_tasks.py --write`).
  `contract/openapi.json` and `contract/openapi.mobile.json` and `src/api/schema.generated.ts` auto-merge, and the merged `contract/openapi.json` is
  byte-identical to the backend branch's. Checks on the merged copy are in V1. After the backend merges, `npm run api -- --backend ../wawu-backend`
  replaces the copy and `SOURCE_COMMIT`.

### Money attack (V8), my reproductions

`s1` to `s9` (Node, over HTTP), `states.py` (Playwright). Same code twice: `claimed_by_you`, nothing more written. Double and many taps: 24 on two servers,
one 200 (and the app, three taps on a 4 s network, sends one request). Forged tokens: three kinds, 401. Replay of a refused claim: the same answer, no
write. A refund row: refused for its payer and for strangers (different words, no leak). Rate: 60 parallel guesses from one address, 18 answered,
42 `429` (the global 20 a second; no `@Throttle` was added; a guess learns nothing, and a hit needs a proven contact). The 32-bit code is not the
proof: a proven contact is, and a guess that hits another person's code answers like a miss.

### Mutants of my own (applied alone, the claim, proof, grant and admin specs (backend), `src/features/claim` and Settings tests (mobile) or `token-contact-proof` (wawu-id) run, source restored from a backup, tree clean after each)

Backend, 27 run, 26 killed: B1 any proven phone matches any registration (26 failed); B2 an unproven email counts (9); B3 a typed phone counts (9); B4 the Hub's phone
counted without a passed BVN check (2); B5 and B5b a token WITHOUT the flag counts as proven, phone and email (5, 5); B6 the claim UPDATE ignores an earlier claim (2); B7a no
explicit refusal of a failed row (1); B7b the same and no `status` in the UPDATE, so only the database CHECK stands (1); B8a a new plan one day short (5); B8b an extension one day short (3); B9 a repeated
reference grants again (1); B10 no `contact_not_verified` (5); B11 an unpaid row answered unlike an unknown code (1); B12 a stranger told a code is a refund (1); B13 the admin list's `claimed` inverted
(2); B14 an extended plan told as new (2); B15 no sign-in needed (24); B16 `claimedAt` not written (16); H3 the claim answers 201 (15); H7 the wrong pass (1); H8 no first Voice Intro (3); H9 one product too many
(3); H10 points end with the plan, not after 90 days (1); H11 Refund due on every paid row (2); H15 a purge no longer removes the claimed registration (1). **Survived: H4** (the `Cache-Control: no-store` header on the claim
answer removed): test gap, a spec asserting the header on a 200 and on a 409 kills it.
wawu-id, 5 run, 5 killed: W1 an absent email proven (1 failed); W2 `phoneVerified` from the typed phone (4); W3 `phoneVerified` always true (4); W4 the flags swapped (4); W5 an email proven whenever present (2).
Mobile, 12 run, 8 killed: V1 `claimed_by_you` told as "used" (3); V2 letters after F accepted (2); V3 "1 days" (1); V4 end-line labels swapped (4); V6 no guard against a second send (1); V9 a ended session told as generic (1);
V10 a zero points line drawn (1); V12 a stranger told the code does not exist (1). **Survived (test-gap notes, none breaks a capability check, a ruling, money or identity):** V5 an answer with no plan object is drawn
(the guard in `api.ts` is only tested with `data: null`; add a test with `data: {}`); V7 the old refusal stays on screen while the next try is sent (test: fail once, press Claim again, assert no banner while busy); V8 a refusal
stays after the code is edited (test: fail, edit the field, assert no banner); V11 the Settings row opens `/claim-code?x=1` (the route file `src/app/settings/index.tsx` is not exercised; test: render the route, press the row, assert `router.push('/claim-code')`; the live walk proves the real path works).

### Pictures

390 px, light and dark, from a web export of mobile `ab37542` with its OWN Metro cache (`TMPDIR` in the scratchpad; the bundle was grepped: `localhost:6161` and `localhost:6162` only, no other host), against the
real Hub and the real wawu-id, signed in through the real sign-in screen. There is no artboard for this screen (`artboards: []`, V5 is not in the task's passes), so none is "beside". Sheets
`vjoin03/shots/sheet-1-light.png`, `sheet-1-dark.png`, `sheet-2-*.png`, `sheet-3-*.png`; files `NN-<state>-<light|dark>.png`: 01 Settings with the row, 02 empty, 03 empty tap, 04 short, 05 a letter after F, 06 typed, 07 unknown code,
08 someone else's code (the same words as 07), 09 refund code, 10 offer gone, 11 offline, 12 busy (a 4 s network), 13 plan ready, 14 already claimed by you, 15 too many tries (a real 429), 16 plan ready with days added to a Plus plan, 17 already used
(another account's claim, caller holds its phone), 18 contact not confirmed (a typed-only web sign-up). Every state came from its real cause; no em-dash on any screen (also grepped in the new source and the Hub's words). The success
screen has no back arrow (only Done), as designed. `states.py` ran 21 of 21 checks (one earlier run failed one check because the screenshot was taken before a slow answer; rerun clean).

### NOT RUN

- A claim against a DEPLOYED wawu-id that sends the flags: needs the merge and deploy (the branch and the AUTH-07 merge ran locally).
- A real Flutterwave payment turning into a claim (the stand-in cannot confirm a waitlist payment, JOIN-01 N10): the paid rows are SQL.
- "Your session ended" by its real cause: a refused refresh signs the app out and opens sign-in, so no banner shows; the copy is covered by the unit test only.
- A phone (V10) and the release build.
- The legacy WAWU API's use of WAWU ID's internal phone routes (D1's exposure): the repo is not here.
- The full backend suite as one run (the touched modules, the protected suite and the neighbours ran).

**Mobile `npm run check` on this head, with status `building` (typecheck, lint, `npm test -- --maxWorkers=2`, gates, tasks): EXIT 0**, 123 suites, 2043 of 2043,
gates 10 run, 480 files, 0 fail, 1 warn, 0 accepted, 273 tasks. The first two runs of the chain ended EXIT 1 on the one known load flake, `OpenWalletScreen.test.tsx` (a 20 s
timeout at a load average of 24 to 34; 37 of 37 alone each time, in 9 and 16 s); the third, at a load average of 14, was clean. Setting `review` would add the `unbuilt_entries`
gate; this task has no `unbuilt()` entry (grep of `src/features/claim`, the route and the Settings row), but that run was not made because the status is `building`.

## Builder report, round 2

Builder, 10 Oct 2026 (Sonnet agent, round 2 of JOIN-03; the lead's rulings of the same day, each Default (lead), owner may override). Heads: backend `wmt/JOIN-03`
`800dee6` (backend main `8e57981`, MONEY-17 #105, merged in), wawu-id `wmt/JOIN-03` `1d8b54e` (main `fb8717e` is inside it), mobile `wmt/JOIN-03` (this
commit; mobile main `b04cbe6` merged in). Evidence: the lead's scratchpad `join03r2/` (`harness/` the live scripts `s3`, `s5`, `s10`, `live/pics.py` the
browser walk, `mut/` the mutants and their logs, `logs/`, `shots/`). No Flutterwave, Fintava, Nuvion, wawuafrica.com or AI host was called; ports 6161 to
6164 only; Resend and the SMS provider were the stand-in on 6163 that records what was mailed and texted.

**The lead's rulings, as built (before, then after)**

1. **D1: `phoneVerified` no longer outlives the number that was proven (wawu-id).** *Before* (real wawu-id `5b132f7`, real Hub `8bb6045`; `logs/repro-s5.txt`,
   `repro-s3.txt`): an account that proved its phone by SMS has its phone changed through `PATCH /internal/users/:id/phone`, or through `POST .../phone/request`
   and `.../phone/confirm` (the code goes to its own email): the next token says `phoneVerified: true` for the new number and `POST /waitlist/claims` with the
   registration of that number answers **200** and grants the plan (s5: 200 OK; s3 last check: FAIL, 200). *After* (`logs/after-s5.txt`, `after-s3.txt`,
   `after-s10.txt`): the token says `phoneVerified: false`, the same claim answers **409 `contact_not_verified`** and nothing is granted (s5 and s3: 0 FAILS).
   What was built: one additive nullable column `wawu_users.phone_verified_for`, the number `phone_verified_at` was set for (the number the sign-up code was
   texted to: `phone-signup.service.ts` writes `pending.phone`), migration `20261011120000_phone_verified_for` which backfills it in the same migration
   (`UPDATE ... SET phone_verified_for = phone WHERE phone_verified_at IS NOT NULL`; on a populated database 4 of 6 and later 15 of 20 accounts had it,
   `logs/id-migrate-backfill.txt`, `id-migrate-rollback.txt`: the rollback in the header runs, `migrate deploy` applies it again, 15 of 15 backfilled, none
   wrong). `src/auth/phone-proof.ts` `phoneIsProven`: true only when `phone_verified_at` is set AND the recorded number is the account's phone, the same number
   in any spelling (`0803...`, `234803...`, `+234803...`); a row with no recorded number, no phone, a `released:<id>` or `deleted:<id>` marker proves nothing.
   `tokens.service.ts` reads it. Sign-in rules are untouched (they read `phone_verified_at`): live, the account whose phone was changed still signs in by the new
   phone (200), and its token says `phoneVerified: false`; an account whose phone was only respelled by the internal route keeps `phoneVerified: true` and claims
   its own registration (`after-s10.txt`). Known limit: an account that changed its phone through those routes BEFORE the migration cannot be told apart from
   one that never did (the routes left no trace), so it is backfilled with the number it holds; every change after the migration is caught (stated in the
   migration, the contract doc and SHARED-CHANGES JOIN-03 #7).
   **AUTH-07 trial merge** (throwaway copy of my tip `1d8b54e`, never pushed): `origin/wmt/AUTH-07` `90f507c` (round 3, which holds `926ee7a` and `955e61f`) merged
   with **0 conflicts** (git merged `WAWUAfrica_API_Contracts.md`, `prisma/schema.prisma`, `phone-signup.service.ts`, `phone-signup.service.spec.ts` and
   `tokens.service.ts` on its own; I put my line before `phoneVerifiedAt: new Date()` in `phone-signup.service.ts` so it does not touch AUTH-07 round 3's added
   `...(takesNumber ...)` line, which an earlier placement did conflict with). On the merged copy: `tsc` 0; `src/auth` and `src/contract`: 20 of 21 suites, 326 of
   327 tests, the one failure the AUTH-08 timing test (see Numbers). A released phone (`released:<id>`, never proven) still gives `phoneVerified: false` and an
   empty `phone` (`token-contact-proof` "a released phone" and "a released or deleted marker", both green on the merged copy), and an AUTH-07 email-code sign-up
   (phone never proven) still gives `phoneVerified: false`.
2. **D2: the three references say G-634** (`src/waitlist/waitlist-claim-proof.ts`, `src/waitlist/tests/waitlist-claim.contract.spec.ts`,
   `docs/contract/PLANS.md`). *Before* they said G-629 (SCHOOLS-03's gap). `grep -rn G-629 src docs` in the backend finds nothing now.
3. **N1: a person who just proved their email claims at once (mobile).** *Before* (verifier's `s7`): the app renewed its token only on a 401, so for up to 15
   minutes after the email step the token still said `emailVerified: false` and a claim by that email answered `code_not_found` ("... that you have confirmed
   it"). *After*, two rules in `src/features/claim/freshToken.ts`, used by `claimCode` in `api.ts`: (1) the email step notes which token was current when the
   email was proven (`noteContactProved`, one line in `confirmEmailCode`, SHARED-CHANGES JOIN-03 #6; kept in memory and in the phone's store per account), and
   before a claim a token issued at or before that moment (its `iat`, WAWU ID's clock against WAWU ID's clock, never this phone's) is exchanged once; (2) on
   `contact_not_verified` the token is exchanged once and the claim is sent once more, and a second answer is final (no third claim, no second exchange); no other
   refusal renews anything; a renewal that fails leaves the first answer standing. Live, in the real app (`live/pics.py`, flow A and C): a real sign-up, the email
   proven by the mailed code, then Enter code with a registration made with that email: the network shows one `POST /auth/refresh` and then **one** claim, 200,
   "Your plan is ready" (A3, A4). A web-registered account whose email was proven after its token was issued: claim 409, one refresh, claim 200 (C1).
   `claimFresh.test.ts` 14 tests.
4. **N2: "Your plan is ready" lists only what the Hub granted and the app puts to use today.** *Before*: Plan, Runs until, Products you can publish (3), Points
   added, Points last until, Event pass, Voice Intro. *After*: Plan, Runs until, and, when points were credited, Points added and Points last until. The
   products, the pass and the Voice Intro are not drawn (their tasks, TIER-02 to TIER-05, the points tools and Voice Intro, are not built, and the cap the
   backend enforces is still the flat `MAX_ITEMS_PER_ACCOUNT`); their lines come back with those tasks. Recorded in `docs/designer/BRIEF.md`. Live: the screen's
   text is "Plan, Verify, Runs until, 9 Nov, Points added, 100, Points last until, 8 Jan 2027" and none of the removed words (A5).
5. **N3: a claim repeated by the same account with the same code answers 200 with the first result (backend).** *Before*: "You already claimed this code" (409
   `claimed_by_you`), so an answer lost on the way left the person with nothing to look at. *After*: the claim keeps what it told its claimer on the row
   (`WaitlistRegistration.claimResult`, one nullable jsonb column, written in the claim's own transaction: the offer's name, the days, whether they were added to
   a running plan, the points and when they end; nothing about anybody) and the same account sending the same code again is answered from it as a 200 with the
   tier read fresh, nothing granted or written a second time; anyone else still gets 409 `already_claimed` (a stranger the same 404 as before). The six-taps-at-once
   test is now six 200s with one body. Migration `20261020140000_waitlist_claim_result` (+ `rollback.sql`, run and re-applied clean: `logs/be-migrate-rollback.txt`),
   SHARED-CHANGES JOIN-03 #5; a row claimed before the column existed has none and keeps answering `claimed_by_you` (no such row can exist in production: this task
   is unmerged). Live: the repeat on the other server is byte-identical to the first answer, one tier, one pass, one lot, one ledger row, the answer kept on the row
   (`after-s10.txt`); in the app, "Your plan is ready" again for the same code (A7).
6. **N4: the CSV's header and rows line up.** *Before*: two parallel lists (the header and the row), 17 cells each. *After*: the row is built FROM the header list
   (`CELLS` keyed by heading), so a column cannot drift from its heading, and `src/waitlist/tests/waitlist-export.spec.ts` (4 tests, no database) reads each row
   back by header with a real CSV reader (quotes, commas and line breaks inside a cell) for a paid and claimed, a refund, a pending and an awkward row.
   **N5:** a body with no code, an empty one or one that is not text answers 400 "Enter your access code."; one too long "Type the 8 letters and numbers of your
   access code." (it was the validator's "code must be shorter than or equal to 40 characters"). The offer-gone banner's title is now "That code cannot be
   claimed", so it no longer repeats the Hub's sentence under it ("The offer for that code is no longer available. Email support@wawuafrica.com with your code.").
7. **The post-sign-up step (SHARED-CHANGES JOIN-03 #4, approved).** Right after sign-up a guarded step asks "Have an access code?" with **Enter code** and **Skip**
   (`claim-offer` route, `ClaimOfferScreen`, no back arrow). It shows once per account and never blocks the app. How: sign-up marks the NEW account where it adopts
   its first session (`confirmPhone`, one line, row #6), so only a person who just signed up ever sees it (existing accounts and every sign-in never do); the
   root layout got one import, one hook line and one `Stack.Protected` group, and the tabs' group gained `&& !offer.visible` so the step is the first screen while
   it shows (a person with an email step left sees that first: `needsEmail` has priority); the step settles its own mark the moment it is drawn, so closing the app
   on it never brings it back; every read and write of the mark is bounded to 1.5 s and swallowed (`localStore.ts`), so a store that fails or hangs means no step,
   never a held-up app. Settings > Access code stays. Live (real sign-up through the screens): the step is the first screen after the email step with no flash of
   the tabs (A1); Enter code opens the claim screen (A2); Done lands on Home (A6); a reload does not show the step again (A8); Skip opens Home (B1); signing in
   as that account later shows nothing (B2). Router tests render the real root layout (`claimOfferStep.test.tsx`, 10 tests). AUTH-07: its `confirmSignupCode`
   replaces `confirmPhone`; a trial merge of mobile `origin/wmt/AUTH-07` (`50005bc`) into this branch has one conflict, the generated `docs/PROGRESS.md`, and
   git placed the `markOfferPending` line between `clearSignup()` and `adoptSession(tokens)` inside `confirmSignupCode` on its own.
8. **Tests that kill the survivors.** H4 (`Cache-Control: no-store`) is asserted on a 200, a repeated 200, a 404, a 409 (used), a 409 (nothing proven) and a 400
   (`waitlist-claim.contract.spec.ts`, mutant B7). V5 (an answer with no plan drawn), V7 (the last refusal stays while the next try is sent), V8 (a refusal stays
   after the code is edited) in `claimScreen.test.tsx`, V11 (the Settings row opens `/claim-code?x=1`) in `settingsRoute.test.tsx` (the route file, with the
   router's `push` seen). Each killed (below).

**Numbers (wawu-id).** `npx tsc --noEmit` 0. `eslint --no-fix` on the five changed `.ts` files: 8 errors, all in `tokens.service.ts` lines this change did not
touch (prettier and one unnecessary-assertion rule at lines 164 to 169, 186 and 375; on `origin/main` the same 8 at 159 to 164, 181 and 370, five lines
earlier because of my comment), none in `phone-proof.ts`, the specs or my lines. `python3 scripts/gates/run.py` 9 run, 102 files, 0 fail, 20 warn;
`check_baseline.py` clean. `npm run contract:build` twice: `contract/openapi.json` sha256 `eae61a48...ea11` before and after, each time (it does not describe token
claims). New and changed specs: `token-contact-proof` 15 tests (it was 7), `phone-signup.service` 45 (it was 44: one new test for the number the code went to when
the account's phone moved meanwhile, and an existing test now also checks the recorded number). `jest src/auth` at the tip, two workers and `--testTimeout=300000` (`logs/id-auth-final.log`): 16 suites, 15 pass; the sixteenth, `refresh-token-lookup`, fails only AUTH-08's "under a second" timing test in that loaded run (1242 ms against 1000, load average about 21) and passes alone, 20 of 20 (refresh 829 ms, sign-out 514 ms): the machine's load, as AUTH-08 and the first JOIN-03 report found; none of the other 202 tests failed. Live (`harness/s3`,
`s5`, `s10`, the real built wawu-id and Hub): the table in ruling 1.

**Numbers (backend).** `npx tsc --noEmit` 0. `eslint --no-fix` 0 on the 8 changed `.ts` files. Specs in a private network namespace (own :4001) on a fresh migrated
database `bj03r2_ns_test`, `src/waitlist src/plans src/points`: 18 suites, 328 of 328 (it was 17 and 316: +8 in the claim spec, +4 in the new export spec).
Protected suite `scripts/protected-routes/run.sh --fresh HEAD` in a private network namespace: code `HEAD (800dee6)`, lock `origin/main (8e57981)`: 253 of 253,
"all 244 required tests passed". Gates: 16 fail, 91 warn, 76 accepted on the branch and on `git archive` of `origin/main` `8e57981`, the 16 FAIL lines identical
(sorted `diff` empty); `check_baseline.py` clean. `npm run contract:build` twice after the merge of main: sha256 `135df7e5...6d8c` both times, equal to the
auto-merged file, tree clean; against backend main it adds one path (`POST /waitlist/claims`), two schemas and the admin list's `claimed`, and changes no
operation. The same file is in mobile `contract/` (`SOURCE_COMMIT` `wmt/JOIN-03@800dee6`, types regenerated with `python3 scripts/api/sync_contract.py`).
Migration `20261020140000_waitlist_claim_result` sorts after every folder on main (newest `20261019130000`, MONEY-17) and on every open `origin/wmt/*` branch
(newest seen `20261020120000`, INBOX-05); `prisma migrate diff` shows only the `ContentPiece` index line main's schema also shows.

**Numbers (mobile).** `npm run check` as the same steps with two jest workers (`npm run typecheck && npm run lint && npm test -- --maxWorkers=2 && npm run gates && npm run tasks`), on
the head `2821dc3` (this report's numbers and the final `check_tasks.py --write` are the only change after it, and `npm run tasks` passes on the final head): **EXIT 0**.
Typecheck 0; lint 0 errors and 7 warnings, all in other tasks' tests (`eventsFocus`, `ticketsRefetchFails`, `professionals` screens), none in this task's files;
jest 127 suites, **2095 of 2095** (it was 123 and 2043 in round 1); gates 10 run, 491 files, 0 fail, 1 warn (`PROVISIONAL(HOST-PICKER)`), 0 accepted; 273 tasks and 279
artboards. New and changed tests in `src/features/claim/__tests__`: `claimFresh` 14 (new), `claimOfferStep` 10 (new, the real root layout), `signupMarksOffer` 3 (new),
`settingsRoute` 1 (new), `claimScreen` 19 (was 16), `model` 5 (the lines), `settingsEntry` 2 (as it was). Mobile `tsc --noEmit` 0 after the contract was copied from the
backend branch.

**Mutants.** Applied alone, the specs that should catch it run, source restored from a copy, tree clean after (`mut/`, `result-*.json`). Backend 10, all killed: B1
a replay told `claimed_by_you` though an answer is stored; B2 any account answered the stored result; B3 the answer not stored; B4 the replay says 30 days
whatever was given; B5 a tap that lost the race by the same account refused; B6 the early check refuses the claimer; **B7 `Cache-Control: no-store` removed
(the verifier's H4)**; B8 the validator's words back; B9 the Paid and Refund due cells swapped; B10 the Claimed cells swapped. wawu-id 6, all killed: W1
`phoneVerified` from `phone_verified_at` alone (the D1 bug); W2 no respelling; W3 any recorded number proves; W4 the token back to `phone_verified_at`; W5 the
confirm records nothing; W6 the confirm records the account's phone at that moment, not the number the code went to. Mobile 22, all killed: M1 no renewal before a
claim; M2 renews on every claim; M3 a token issued in the same second as the proof is not renewed; M4 a third claim after the retry; M5 retry on any refusal; M6 the
email step does not note the proof; M7 sign-up does not mark the account; M8 marked after the session is adopted; M9 and M10 the products, the pass and the Voice
Intro drawn again; M11 the offer-gone title repeats; M12 the step shown to every sign-in; M13 the step not settled when drawn; M14 Skip does not end it; **M15 a
read of the phone's store not bounded SURVIVED the first time** (only the app's start was tested, and that is not held up by a read; a claim is), so
`claimFresh.test.ts` gained "never hangs on a store that does not answer" and the same mutant (M15b) is killed; M16 the tabs not held back while the step shows;
M17 Enter code keeps the step; **V5, V7, V8, V11 (the verifier's survivors)**.

**Pictures** (390 px, light and dark; the real app from a web export with its OWN Metro cache, `TMPDIR` in the scratchpad; the bundle was grepped: `localhost:6161`
and `localhost:6162` only, no other host; every request outside 6161 to 6164 was aborted and none was made): the real app, signed up through the real sign-up
screens (the text and the mail read from the stand-in on 6163), against the real built Hub and the real built wawu-id. There is no artboard for these screens, so
none is "beside" and I do not say they match anything. `shots/01-post-signup-step-{light,dark}.png` "Have an access code?" (the first screen after sign-up, an
email proven moments before), `02-claim-screen-*` the claim screen (Enter code), `03-claim-typed-*` a code typed, `04-plan-ready-*` "Your plan is ready" (Plan, Runs
until, Points added, Points last until), `05-plan-ready-repeat-*` the same code claimed again by the same account. Every state came from its real cause.

**Decisions (each Default (agent), owner may override)**
- The first result is KEPT on the row (a jsonb column) rather than worked out again from the plans file and the points lot: the days, the name and whether the
  plan was extended are not stored anywhere else, and a later change to the file would otherwise change what a lost answer says. The cost is one nullable column.
- `phone_verified_for` compares the SAME number in any spelling (the internal route writes digits only, sign-up writes `+234...`), so a respelling is not a change.
- The post-sign-up step comes after the email step when there is one (a texted sign-up), and straight after the code for a sign-up that proves the email at the
  code (AUTH-07). It is marked at the place the first session is adopted, not by guessing from the state of the app later.
- The claim renews its token on the account's own record of the proof (the `iat` of the token current at the proof), kept in the phone's store too so a restart in
  the 15 minutes does not lose it; it asks WAWU ID, never the clock of the phone.
- The words: "Enter your access code." for a body with no code; "That code cannot be claimed" for the offer-gone banner's title.

**NOT RUN**
- A claim against a DEPLOYED wawu-id that has the migration and the new token: unblocked by the owner merging and deploying `wmt/JOIN-03` of wawu-id (until then
  production refuses every claim with `contact_not_verified`, G-634); the walk ran a local build of the same code.
- The legacy WAWU API's proxying of users' own phone updates to the internal routes (the repo is not here): D1 is closed at the token whichever way it calls them.
- A phone or a store build (V10): the web export at 390 px only.
- The mobile AUTH-07 round 3 working tree (uncommitted in another builder's worktree): the trial merge on mobile is against `origin/wmt/AUTH-07` (round 2) only;
  the wawu-id trial merge is against the pushed round 3 (`90f507c`).
- The whole backend suite as one run (the waitlist, plans and points specs and the protected suite ran), and the whole wawu-id suite (`src/auth` and `src/contract` ran).
- Mailed and texted codes were the stand-in's on 127.0.0.1: Resend and the SMS provider were not called.

## Verifier report, round 2

Verifier, 10 Oct 2026 (Sonnet agent, an independent session that wrote none of this). Heads: backend `wmt/JOIN-03` `800dee6` (backend main `8e57981` is an
ancestor of it), wawu-id `wmt/JOIN-03` `1d8b54e` (main `fb8717e` is its base), mobile `wmt/JOIN-03` `82e25e8` (mobile main moved to `9426060`). Evidence: the lead's
scratchpad `vjoin03r2/` (`harness/` my drivers `d1`, `n3`, `n5`, `a07a`, `a07b`, `erase`, `fuzz-phone*`, `csvcheck` and the round 1 `s3`, `s5`; `live/` the browser
walks `r2a` to `r2d`; `mut/` the mutation runner and its logs; `logs/`; `shots/`). The REAL built wawu-id (branch, then the AUTH-07 merge) and the REAL built Hub (one or two
copies on one database) ran on 6161, 6162 and 6164; Resend and the SMS provider were the stand-in on 6163 (it records what was mailed and texted). The real app ran from a web
export of `82e25e8` with its OWN Metro cache (`TMPDIR` in the scratchpad); the bundle was grepped and holds `localhost:6161` and `localhost:6162` only, and every browser
request outside 6161 to 6164 was aborted (none was made, `OUTSIDE []` in every run). No Flutterwave, Fintava, Nuvion, wawuafrica.com or AI host was called. The paid rows were written by SQL
(the registration page cannot pay here).

**Verdict: building. One blocker (D3, medium, a one-line fix) and two low defects (D4, D5).** Every ruling and every item the brief names is CONFIRMED below except D3: the
new column `wawu_users.phone_verified_for` holds the person's real phone number and the account-deletion path (`DELETE /internal/users/:id?mode=anonymize`) does not clear it,
so an account the Hub has finalised as deleted keeps its number. If the lead rules that retention acceptable until that path is next touched, D3 drops to a should-fix and the status can be `review`.

### What is CONFIRMED

- **D1 (wawu-id) CONFIRMED.** The round 1 `s3` and `s5` against the branch: the last check of `s3` (a proven-phone account whose phone was changed through `PATCH /internal/users/:id/phone`
  claims the new number's registration) is now `409 contact_not_verified` (it was 200), and `s5` (the request and confirm pair, the code mailed to the account's own address): token
  `phoneVerified: false`, claim `409 contact_not_verified`; no service key is 401. `d1.mjs` (live, 17 of 18 checks pass; the one that does not is a fail-closed note, N10): PATCH to the 0-form, the 234-form
  and a stray-0 form, and the request and confirm route to a respelling, each keep `phoneVerified: true` and the account claims its own registration (the stray-0 form: see N10); a different number by
  either route gives `false` and a claim for the new number is `409 contact_not_verified`, a claim for the OLD proven number's registration is refused too, nothing is granted, and the sign-in rules are as
  they were (email works, the new number as stored works, the old number finds nobody, 404); changing back to the proven number (another spelling) gives `true` again and that registration claims.
  The diff does not touch `auth.service.ts` (sign-in reads `phone_verified_at`), so the sign-in rules are unchanged by construction. A structured and a random fuzz of the two normalisers
  (720 and 400,000 cases, `phone-proof.ts` against the Hub's `normalisePhone`): no stored phone that wawu-id calls "the proven number" is read by the Hub as a DIFFERENT valid number (0 attacks); 11 spellings wawu-id
  proves and the Hub reads as no number, and 3 the other way, all fail closed.
  **The migration `20261011120000_phone_verified_for`:** sorts after main's newest (`20261007120000_refresh_token_jti`) and AUTH-07's `20261006120000`; on a database at main's migration state with 8
  accounts, `migrate deploy` applies exactly it and the backfill sets `phone_verified_for = phone` only where `phone_verified_at` is set (4 proven accounts recorded, the 4 others NULL, `phone` untouched);
  the header's rollback (drop the column, delete the history row) runs, `migrate status` lists it pending, `migrate deploy` applies it again and the recorded values hash the same (`md5` equal). Additive: one nullable
  column and one UPDATE of that column.
- **N3 (backend) CONFIRMED** (`n3.mjs`, two Hubs on one database, 29 of 29). The same account repeating the code on the other Hub, in a second spelling of the code, and after a fresh sign-in: 200 and the SAME BYTES as the
  first answer, `Cache-Control: no-store`; tier, pass, lot, ledger and every `updatedAt` stamp unchanged. 30 first taps alternating the two Hubs: 30 answers 200 with ONE body, one tier (30 days exactly), one pass, one lot,
  one ledger row. Two accounts each holding one contact of the same registration, 40 taps on both Hubs: the winner's every tap is a 200 with one body, the loser's every tap is `409 already_claimed`, the loser holds nothing,
  and the loser's refusal carries nothing of the winner; a stranger meets the same bytes as for an unknown code, and none of the stored answer. A row claimed before the column (answer set to NULL): its claimer gets `409 claimed_by_you`
  as in round 1; six damaged stored answers (`{}`, `[]`, a string, a wrong type, a fractional day count, JSON null): `claimed_by_you`, no crash. The stored answer holds the offer name, days, `extended`, points and their end, nothing about anybody. The `tier` on a replay is read
  fresh (a second code claimed since moves its end, a plan that ended since says `ended`): the stored fields are the first answer byte for byte, the tier is the account's tier now (ruling accepted, see D4 for its words on screen). The migration `20261020140000_waitlist_claim_result`: on a database at main's 117 folders `migrate deploy` applies exactly the two of the branch (`...150000_waitlist_claim_paid`, then it, 119),
  its `rollback.sql` runs (the column is gone, `migrate status` lists it pending), `migrate deploy` applies it again and the schema is up to date; `migrate diff` against `schema.prisma` shows only the `ContentPiece_specializations_idx` line main's schema also shows.
- **N1 (mobile) CONFIRMED** (`r2a`, `r2b`, `r2c`, `r2d`, the real app, the network counted). A real sign-up through the screens, the email proven by the mailed code, Enter code, a claim by that email: ONE `POST /auth/refresh` and then ONE claim, 200. A
  web account whose email was proven AFTER its token was issued: claim 409, ONE refresh, ONE more claim, 200. An account that proves nothing: exactly 2 claims and 1 refresh, then the Hub's answer stands; a second tap does the same, never more. A refused renewal (refresh token revoked): 1 claim, 1 refresh,
  no second claim. A store that fails on every read and write: the claim still works (the proof note lives in memory too). Replay of the same code: no refresh. A signed-out visit to `/claim-code` sends one claim without a token and says "Your session ended" (N14).
- **N2 CONFIRMED.** "Your plan is ready" reads `Plan | Verify`, `Runs until | 9 Nov`, `Points added | 100`, `Points last until | 8 Jan 2027` and nothing else (no products, no pass, no Voice Intro, no "Watch live"); each is the Hub's answer and the rows back it (the lot is 100 for 90 days, the tier is 30 days from the claim).
- **N4 CONFIRMED.** `waitlist-export.spec` (4 tests, a real CSV reader) and my own check on the built export (`csvcheck.cjs`, 10 of 10): quotes, commas and a line break inside a cell, a formula cell (neutralised with a `'`), absent optionals empty, a paid, a claimed, a `failed` and a pending
  row, every row 17 cells read back BY HEADER (Paid empty and Refund due 2000.00 on `failed`; Claimed `yes` with its time). The columns are where round 1 said (`Refund due (₦)` before `Paid at`, `Claimed` before `Claimed at`): by header nothing moves.
- **N5 CONFIRMED** (`n5.mjs`): `{}`, a number, null, an empty string, an array, an object and `true` as the code, and a `text/plain` body: 400 "Enter your access code."; 41 and 50 characters: 400 "Type the 8 letters and numbers of your access code."; `ZZZZ ZZZZ`, spaces only and full-width digits: `code_invalid` with the same words; no em-dash in any body.
  An extra property ("property extra should not exist") and a broken JSON body are the framework's words, and the app never sends either. The offer-gone banner's title no longer repeats its body (round 1 unit tests, unchanged).
- **D2 CONFIRMED.** `grep -rn G-629 src docs prisma` in the backend finds nothing; the three references say G-634.
- **The survivors, each now killed by a mutant of its own:** H4 (the `Cache-Control: no-store` header removed: 2 tests fail), V5 (an answer with no plan drawn: 1), V7 (the old refusal stays while the next try is sent: 1), V8 (a refusal stays after the code is edited: 1), V11 (the Settings row opens `/claim-code?x=1`: 1).
- **The post-sign-up step CONFIRMED** (`r2a`, `r2b`, `r2c`, 15 of 15 and 5 of 5, light and dark). Right after a real texted sign-up and its email step the first screen is "Have an access code?" with Enter code and Skip (no back arrow); Enter code opens the claim screen; Done lands on the app, and Back from the claim screen too; a reload
  after that shows nothing; Skip opens the app and a reload and a later sign-in as that account show nothing; closing the app (a reload) ON the step brings it back never; a reload DURING the email step keeps the email step first and the step shows once after it; an account that was never signed up in the app (a web sign-up) never sees it on sign-in;
  `/claim-offer` typed by hand shows the app, not the step (signed in with the step over, and signed out). A claim store that throws on every read and write: the step is drawn once from memory and the app opens, and after a restart nothing is drawn (the BRIEF's line "if the phone cannot remember whether it was shown, it is not shown" holds for a later start; at the sign-up itself it is shown once, N15).
  Merged with mobile AUTH-07 (`origin/wmt/AUTH-07` `a0c37a0`, a git-level trial only): 1 conflict, the generated `docs/PROGRESS.md`; git put `markOfferPending` in `confirmSignupCode` between `clearSignup()` and `adoptSession(tokens)`, the only place the sign-up adopts its first session.
- **The root layout change, RULED minimal.** `src/app/_layout.tsx` is +1 import, +1 hook line (`useClaimOfferStep(signedIn)`), +1 `Stack.Protected` group holding the one screen, and `&& !offer.visible` added to the tabs' guard: +6 and -1 lines in the file, no route moved, no screen renamed. Cold starts of signed-in accounts do one bounded read (1.5 s at most) that
  never holds the first render (`visible` is false until it answers). Accepted as the smallest change that can do the job; recorded in SHARED-CHANGES JOIN-03 #4.
- **Trial merges (throwaway copies, never pushed).** *Backend:* `origin/main` `8e57981` is an ancestor of the branch, 0 conflicts. *wawu-id:* `origin/main` `fb8717e` is an ancestor, 0 conflicts. `origin/wmt/AUTH-07` `90f507c` (round 3) into the branch: 0 conflicts (git merged `WAWUAfrica_API_Contracts.md`, `prisma/schema.prisma`, `phone-signup.service.ts`, its spec and `tokens.service.ts`),
  `tsc` 0, built, migrated fresh, and live (`a07a`, `a07b`): a stranger signs up by MAIL with a number typed (token: phone is the typed number, `phoneVerified: false`, `emailVerified: true`, and it cannot claim that number's registration); the victim signs up TEXTED with that number: a wrong code moves nothing, the right code makes the victim the holder with `phoneVerified: true` and `phone_verified_for` recorded, and the stranger's account
  is `released:<id>` with `phone: ''` and `phoneVerified: false`; the victim claims the registration (200), the released account cannot (404 `code_not_found`). `src/auth` and `src/contract` on the merged copy: 21 suites, 19 pass; the two others are `refresh-token-lookup` (the AUTH-08 timing test, N11) and `session-security` (a 300 s timeout in the loaded batch; 24 of 24 alone). *Mobile:* `origin/main` `9426060` into the branch: 2 conflicts, both generated or hand-resolvable: `contract/SOURCE_COMMIT`
  (take the branch's `wmt/JOIN-03@800dee6`) and `docs/PROGRESS.md` (keep either side, then `python3 scripts/tasks/check_tasks.py --write`); `contract/openapi.json`, `contract/openapi.mobile.json`, `src/api/schema.generated.ts`, `docs/LOG.md`, `SHARED-CHANGES.md`, `BACKEND_GAPS.md` auto-merge, and the merged `contract/openapi.json` is byte-identical to the backend branch's (sha256 `135df7e5...6d8c`).

### Defects

- **D3 · defect · medium · BLOCKER (the lead can lower it, see the verdict) · an anonymised account keeps its real phone number in `phone_verified_for`.** `AuthService.deleteUser(.., 'anonymize')`, the call the Hub makes to finalise an account deletion, scrubs the row (`phone` becomes `deleted:<id>`, the email,
  names, password hash go) and does not list the new column. Reproduction (`harness/erase.mjs`, real wawu-id `1d8b54e`): a texted sign-up proves `+234817...`; `DELETE /internal/users/<id>?mode=anonymize` with the service key answers 200 `banned`; the row then reads `phone = deleted:<id>` and `phone_verified_for = +234817...` (the full number).
  The column is not in any API answer (`toUserResponse` and the token read it only through `phoneIsProven`), so nothing leaks to a client, but a person who asked to be deleted still has their number in the identity service's table. Introduced by this change (the column is new). Fix (WAWU ID, not made here): add `phoneVerifiedFor: null` to the anonymise update in `auth.service.ts` and a spec that reads the column back after it; the migration's backfill is unaffected.
- **D4 · defect · low · a replay's words say "starting today".** N3 makes a repeat of the code a 200 with the first result, and the first result's line is the app's `readyLine`: "Verify for 30 days, starting today." Reproduced (`r2b` F3, pictures `07` and `08`): the same code sent 10 days after the claim reads "Verify for 30 days, starting today." beside "Runs until 30 Oct";
  sent after the plan ended it still says "Your plan is ready", "starting today" and "Runs until 31 Aug". The data is right (the stored answer, the tier read fresh); the sentence and the heading are the replay's problem, because the answer carries no claim date. Fix: say "starting today" only when the tier's `activeFrom` is today (the app has it), and say what is true otherwise (or the Hub adds the claim date to the view).
- **D5 · defect · low · the backfill makes a marker phone read as proven.** The migration copies `phone` into `phone_verified_for` wherever `phone_verified_at` is set, markers included, and `phoneIsProven` returns true when the two strings are equal. An account anonymised BEFORE the migration (its phone is `deleted:<id>`, `phone_verified_at` kept) therefore says `phoneVerified: true` with `phone: 'deleted:<id>'`,
  and a released account that kept `phone_verified_at` (the G-16 script keeps the proving account and releases the other, so none is expected, but nothing prevents it) says `phoneVerified: true` with `phone: ''` (shown with the built code, `phoneIsProven` and `buildAccessPayload`). The Hub cannot be fooled by it (a phone claim needs the token's phone to read as a real number, and neither does), and an anonymised account cannot sign in, but it contradicts the builder's own
  statement that a `released:<id>` or `deleted:<id>` marker proves nothing; the spec checks a marker only against a real recorded number. Fix: in `phoneIsProven`, require that the phone reads as a number before the equal-strings shortcut (or exclude the markers in the backfill's WHERE), and add the equal-marker case to the spec.

### Notes (not defects)

- **N9 · low · a deploy window.** `start:prod` migrates, then starts the new code, while the old instance can still serve a texted sign-up: an account that completes its code on the OLD instance after the migration has `phone_verified_at` and no `phone_verified_for`, and says `phoneVerified: false` for good (fail closed; it can still claim by a proven email or the BVN route). A one-off `UPDATE ... WHERE phone_verified_for IS NULL AND phone_verified_at IS NOT NULL` after the deploy, or stopping the old instance first, closes it.
- **N10 · low · fail closed.** An internal respelling `234` + `0` + the 10 digits (a stray 0) is the same number to WAWU ID (`phoneVerified: true`) and no number to the Hub's reader, so that account's claim by phone is `contact_not_verified`; `d1` shows it (the one check of 18 that does not pass).
- **N11 · note · load.** The AUTH-08 timing test ("with 200 stored refresh tokens ... in under a second") fails at a load average near 30: 2821 ms on the branch, 1546 ms on `git archive` of wawu-id `origin/main` in the same run, so it is the machine, not this change.
- **N12 · low · N1's remaining gap.** The renewal covers a proof made in the app's email step (rule 1) and a person who proves nothing (rule 2). A person whose PHONE is proven and whose email was proven elsewhere (the web) within 15 minutes, claiming a registration made with that email, gets `code_not_found` ("We could not match that code to you") until the token is renewed (`r2d` H2); rule 2 fires only on `contact_not_verified`.
- **N13 · low · survivors of my own mutants (test gaps, none breaks a capability check, a ruling, money or identity).** `MV6`: removing the memory-first publish in `markOfferPending` passes every test (the step then waits on the read; no test sees the first render, which matters for a sign-up with no email step, AUTH-07's mailed one); `MV9`: removing `onSessionEnd(resetOfferStep)` passes (the layout's effect resets on sign-out anyway; a refresh to ANOTHER account's token would be the case it serves);
  `Y7b` and `Y7c`: the stored answer's reader accepts a fractional day count, and accepts it when it refuses a null points end, with no spec for a replay of a claim that gave no points or a damaged answer (my live check covers six damaged values). `Y7` and `Y9` are equivalent (the object guard is redundant with the field checks; `offer.tierDays` equals `granted.daysAdded` today).
- **N14 · low · a signed-out visit to `/claim-code`** draws the claim screen (it is not in a guarded group, as the other Settings screens are) and a claim then says "Your session ended. Sign in again, then enter your code." Round 1 design, no data involved.
- **N15 · low · words.** The BRIEF's "if the phone cannot remember whether it was shown, it is not shown": at the sign-up itself the step is shown once from memory even when the store fails (never twice).
- **N16 · note.** MONEY-18's backend branch holds `20261020160000_wallet_holds`, which sorts after this task's `20261020140000` (independent tables, harmless, the round 1 N6 pattern).

### Rulings

- **The root layout change: minimal, accepted.** See above.
- **The replay's `tier` read fresh (not stored): accepted.** The view says "the person's tier exactly as `GET /me/tier` answers it"; what the claim told (name, days, extended, points) is stored and replayed byte for byte.
- **N2's list (plan, end, points): accepted** as the lead's ruling; each line is the Hub's and in force in the app.
- **D1 is closed at the token** whichever way the legacy API calls the internal routes (the column only moves with the sign-up code), with the known limit the builder states: an account that changed its phone through those routes BEFORE the migration is backfilled with the number it holds.

### Mutants of my own (applied alone to a throwaway copy, the specs that should catch it run, source restored from a copy, tree clean after; logs `mut/`)

29 run, 23 killed, 6 survived (2 equivalent, 4 test gaps). **wawu-id, 8 run, 8 killed:** X1 `phone_verified_at` not required (1 test fails); X2 the respelling not read (1); X3 any recorded number proves while the phone is any number (3); X4 the sign-up confirm records no number (2); X6 the token's `phoneVerified` from `phone_verified_at` alone, the D1 bug itself (6); X7 the backfill's WHERE flipped, X8 the backfill removed, X9 the backfill for everyone: no repo test reads the migration, so these three are killed by `mut/backfill_check.sh` (my own populated-database check) only, and X9 is harmless to the token (it also needs `phone_verified_at`).
**Hub, 9 run, 5 killed, 4 survived:** Y1 any account answered the stored result (4 fail); Y2 a replay still told `claimed_by_you` (7); Y3 the answer not stored (8); Y5 the Paid and Refund due cells swapped (2); Y8 `Cache-Control: no-store` removed, the H4 survivor (2); survivors Y7, Y7b, Y7c, Y9 (N13).
**Mobile, 12 run, 10 killed, 2 survived:** MV1 a finished step brings the step back at a cold start (2 fail); MV2 the token's `iat` never read, so no renewal (4); MV3 a token newer than the proof renewed anyway (2); MV4 the retry on any refusal, not only `contact_not_verified` (1); MV7 the tabs not held back while the step shows (3); MV12 a second retry loop (1); V5, V7, V8, V11 the round 1 survivors (1 each); survivors MV6 and MV9 (N13).

### Checks

- **Backend** (`800dee6`): `npx tsc --noEmit` 0. The waitlist, plans and points specs on a fresh migrated and seeded `vj03r2_ns_test` in a private network namespace (own :4001): 18 suites, **328 of 328** (it is the builder's number). `scripts/protected-routes/run.sh --fresh HEAD` in a private namespace: code `HEAD (800dee6)`, lock `origin/main (8e57981)`, **253 of 253**, "all 244 required tests passed".
  `python3 scripts/gates/run.py`: 16 fail, 91 warn, 76 accepted on the branch and on `git archive` of `origin/main` (files scanned 1105 and 1096); the sorted FAIL lines are identical (`diff` empty). `check_baseline.py` exit 0 (108 entries, each with an owner and a reason). `npm run contract:build` twice: `contract/openapi.json` sha256 `135df7e5...6d8c` both times, equal to the committed file (tree clean) and to mobile's merged copy. The claim contract spec alone: 33 tests.
- **wawu-id** (`1d8b54e`): `tsc` 0. `eslint --no-fix` on the five changed `.ts` files: 8 errors, all in `tokens.service.ts` at 164 to 169, 186 and 375; `git archive` of `origin/main` has the same 8 at 147 to 152, 169 and 358 (17 lines earlier), none in `phone-proof.ts`, the specs or the new lines. `scripts/gates/run.py` 9 run, 102 files, 0 fail, 20 warn; `check_baseline.py` clean. `npm run contract:build` twice: `contract/openapi.json` sha256 `eae61a48...ea11` both times and unchanged.
  `jest src/auth` (two workers, `--testTimeout=300000`): 16 suites, 15 pass, 202 of 203 tests; the one failure is the AUTH-08 timing test (N11, it fails on main in the same run). `token-contact-proof` 15 of 15, `phone-signup.service` 52 of 52 on the merged copy.
- **Mobile**, merged with `origin/main` `9426060` (the 2 conflicts resolved as above): `npm run typecheck && npm run lint && npm test -- --maxWorkers=2 && npm run gates && npm run tasks`: **EXIT 0**; lint 0 errors and 7 warnings (other tasks' tests); jest 127 suites, **2120 of 2120**; gates 10 run, 491 files, 0 fail, 1 warn, 0 accepted; 273 tasks, 279 artboards. (One earlier run of the claim feature's tests on that copy had two suites time out under a load average of 35; the same suites pass alone and in the full run.)
  The same chain on the branch itself, with this report (docs and task file only on top of `82e25e8`): **EXIT 0** on the tenth run, as `npm run typecheck && npm run lint && npm test -- --maxWorkers=2 --testTimeout=60000 && npm run gates && npm run tasks`: lint 0 errors and 7 warnings, jest 127 suites, 2095 of 2095, gates 10 run, 491 files, 0 fail, 1 warn, 0 accepted, 273 tasks, 279 artboards.
  The nine runs before it ended EXIT 1 on load alone (a load average of 17 to 38 on 4 CPUs shared with other agents, memory down to 1 to 3 GB): different suites each time (`OpenWalletScreen`, `settingsScreens`, `CreatePinScreen`, `SelfieScreen`, `walletTabFlow`, `detailScreens`, `eventsScreens`, `professionals/screens`, `auth-signup`, `explore/screens`, `hostScreens`, `sessionEnd`), each a 20 s test timeout or a jest worker killed for memory (SIGKILL), none a failed assertion of this task; the six that failed in the second run pass alone (6 suites, 196 tests), `auth-signup` passes alone (61 of 61), and the one recurring suite, `eventsScreens` (the D8 race the builder named in round 1), also fails the same way on `git archive` of mobile `origin/main` in one of two runs and passes 46 of 46 in the other. The tenth run is the form of the common rules with one change: `--testTimeout=60000` (a command-line flag, nothing edited), because the 20 s default is what the load was breaking. Logs `logs/mobile-final-check*.log` (the runs) and `logs/flaky-suites-alone.log`.

### Pictures

390 px, light and dark, from the web export of `82e25e8` (own Metro cache; bundle grepped, `localhost:6161` and `localhost:6162` only), the real app against the real Hub and the real wawu-id, signed up and signed in through the real screens (the texted code and the mailed code read from the stand-in on 6163). There is no artboard for these screens, so none is "beside" and I do not say they match anything. Sheets
`vjoin03r2/shots/sheet-1-light.png`, `sheet-1-dark.png`, `sheet-2-light.png`, `sheet-2-dark.png`; files `NN-<state>-<light|dark>.png`: 01 the post-sign-up step, 02 the claim screen, 03 a code typed, 04 "Your plan is ready" (Plan, Runs until, Points added, Points last until), 05 the same code repeated by the same account, 06 "Confirm your phone number or email first" (nothing proven, after the one renewal), 07 a replay 10 days later (D4), 08 a replay after the plan ended (D4), 09 a signed-out visit to the claim screen (N14). Every state came from its real cause; no em-dash on any screen.

### NOT RUN

- A claim against a DEPLOYED wawu-id that has the migration and the new token: unblocked by the owner merging and deploying `wmt/JOIN-03` of wawu-id (until then production refuses every claim with `contact_not_verified`, G-634). The legacy WAWU API's use of the internal phone routes (D1's exposure): the repo is not here.
- A phone or a store build (V10): the web export at 390 px only. The mobile AUTH-07 merge was a git-level trial only (the merged tree was not type-checked or tested).
- The whole backend suite and the whole wawu-id suite as one run (the touched modules, the protected suite, `src/auth` and `src/contract` ran). A real Flutterwave payment turning into a claim (the paid rows are SQL).
- A rolling deploy with an old and a new wawu-id side by side (N9 is from the code and the migration, not from a run).

## Owner sign-off
