---
id: TIER-01
title: Prices, tiers and the billing currency: one config file
owner: YOU
area: VERIFY
order: 199
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: [MONEY-04]
decisions: [R-43, R-44, R-21]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# TIER-01 · Prices, tiers and the billing currency: one config file

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `docs/PAYMENTS-PLAN.md` (the order of work, what waits for the Nuvion sandbox key, the owner questions and the defaults this task builds)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands (backend checks: `tsc`, eslint, the task's specs, the full suite, the protected suite 253/253, gates with the same 16 fail lines as main, `npm run contract:build`, then `npm run api -- --backend <worktree>` here).
- DECISIONS.md R-43 (the plan, and what it leaves open), R-44, R-5, R-10 and R-21
- `docs/designer/CLAUDE-DESIGN-ROUND-2.md` sections 1 to 7 (tiers, VF, PT, RF, the wallet on Nuvion, open points) and the owner's Developer Brief v2.0 of 5 Oct (the lead's scratchpad `nuvion/brief-docx.txt`, sections 2, 3, 6 and 8)

## Goal

Every price, product count, points amount, expiry, cost and cap of the 5 Oct plan lives in one file and is read
everywhere (R-43: "until then the plan's figures are config values, never facts"). Every person has one billing
currency, naira or dollars, fixed at their first purchase. A person billed in naira only ever sees naira; a person
billed in dollars only ever sees dollars.

## Scope

- New `src/plans/`: `plans.config.json` with the Developer Brief's section 2 figures as example values (tiers: id, days, products, bonus points and their expiry days, price in NGN kobo and USD cents, event pass type, badge, pack bonus percent, first Voice Intro; extra products; packs; checkout bump; action points; caps; referral; cash-out rate), plus the two values the brief does not give, each its own `PROVISIONAL(..., owner=YOU, why=...)`: the cash-out minimum and how long bought points last. One marker `PROVISIONAL(PLAN-PRICES, owner=YOU, why=R-43 the owner sends final prices)` covers the file.
- A schema check at boot: a malformed or incomplete file stops the server naming the field.
- Billing currency: a nullable `billingCurrency` (`NGN` or `USD`) on the person; a resolver (the fixed value; else NGN for a person with a naira wallet or a Nigerian phone, else USD); TIER-03 fixes it at the first purchase; no route changes it (support only, owner rule in the brief).
- Tier state: `MakerTier` (person, tier, active from, active until, extra products, Voice Intro included) and `EventPass` (person, type, purchase); one reader service the gate (TIER-02) and the purchases use.
- Routes: `GET /plans` (signed in: tiers, extra products, packs, bump, action costs and caps, in the caller's currency only); `GET /me/tier` (VF14: tier, badge, active until, products allowed, points included, event pass, state `none`, `active`, `ending` within `PROVISIONAL(PLAN-ENDING-DAYS, ...)` days, or `ended`).
- `data-export-sections.ts` decides the new models.

## Capability checks

- [ ] A person billed in naira gets every price from `GET /plans` in ₦ (kobo) and a person billed in dollars in $ (cents), never both.
- [ ] Changing a figure in `plans.config.json` and restarting changes `GET /plans` with no code change; a malformed file stops boot naming the bad field.
- [ ] A person's billing currency, once set, never changes through any route, including after they open a naira wallet or change their phone.
- [ ] `GET /me/tier` answers `none` for a new person, and `active`, `ending` and `ended` for seeded tier rows.
- [ ] No price, points amount, cost or cap appears in source outside `plans.config.json` (spec grep).

## Builder report

Builder, 8 Oct 2026. wawu-backend `wmt/TIER-01` `d6fcea2` (two commits on main `965280e`); mobile `wmt/TIER-01`
(this file, on main `50a7a89`). depends_on MONEY-04 is `done`. This task moves no money and calls no provider
(Fintava, Nuvion or any other host): it is the price list and the state the purchases write later.

**Built (backend).** `src/plans/`: `plans.config.json` (every figure of the brief's section 2, money as
`"price": { "kobo", "cents" }`, pack and checkout points per currency; a script compared every figure with the brief,
naira and dollars x 100: all equal); `plans-config.ts` (types, `loadPlansConfig`, the whole-file check,
`PlansConfigError`, `priceIn`/`countIn`, the four `PROVISIONAL(...)` markers); `billing-currency.service.ts`
(`resolve`, `fixAtFirstPurchase(input, tx)`); `maker-tier.service.ts` (the one reader: `tierOf`, `hasActiveTier`,
`tierStateAt`); `plans.service.ts`, `plans.controller.ts` (`GET /plans`), `me-tier.controller.ts` (`GET /me/tier`),
`plans-view.type.ts`, `plans.module.ts` (exports `PLANS_CONFIG`, `BillingCurrencyService`, `MakerTierService`).
`prisma/schema.prisma` + migration `20261016120000_maker_plan` (enum `BillingCurrency`; tables `PersonBilling`,
`MakerTier`, `EventPass`; CHECKs; rollback in the header); `account-data-map.ts` (3 OWNED rows);
`data-export-sections.ts` (3 sections, payment references left out); `docs/contract/PLANS.md`. Specs in
`src/plans/tests/`: `plans-config.spec.ts` 31, `plans-figures.spec.ts` 5, `billing-currency-writers.spec.ts` 3,
`plans.contract.spec.ts` 24 (HTTP, real database, RS256 tokens signed with the stand-in WAWU ID's key so each
person's phone can be chosen). **Mobile:** this report, `SHARED-CHANGES.md` TIER-01 #1 to #3, `BACKEND_GAPS.md`
G-420 and G-421, `docs/LOG.md`.

**Not mounted on the branch.** `PlansModule` needs one import and one entry in `src/app.module.ts`; the payment
builders were told to queue that file, so it is SHARED-CHANGES TIER-01 #1 with the exact lines, not an edit. Every
"live" proof below that names the mount ran with that change applied in the worktree, then `git restore`d.

**Capability checks**
1. Naira people see kobo, dollar people see cents, never both: `plans.contract.spec.ts` (a Nigerian phone in four
   forms, a phone abroad, a phone abroad with a naira wallet, an empty phone; every tier, extra products, pack and
   checkout price and points compared with the config; the answer's text has no `USD`/`NGN` of the other side and no
   `kobo`/`cents` field) and `plans-config.spec.ts` (`planIn` per currency). Live with the mount on :5652: a
   `08031234567` token got `NGN` tiers `[100000, 300000, 500000]`, a `+447700900123` token `USD` `[300, 900, 1500]`.
2. A changed figure after a restart, and a bad file stops boot naming the field: the spec boots a second app from a
   changed copy (tier price, dollar pack points, an action's points) while the first still answers the shipped
   figure, and boots from a non-number price and a missing `event_pass` (both refused with the field named); in
   `plans-config.spec.ts` 22 broken copies (fractions, text, zero, missing, misspelt, unknown pass, repeated id,
   unknown preselected tier, referral bases, level order, percent, action unit, em-dash) plus a file that is not
   JSON and a missing file, each refused naming the field or the file. Live
   with the mount: Founding changed to 550000/1700 and a restart served it; `3000.5` at `tiers[1].price.kobo`
   stopped the server ("plans.config.json: tiers[1].price.kobo must be a whole number of 1 or more (it is 3000.5).
   Fix the file and restart."), a missing `tiers[0].products` exited with code 1 naming it.
3. A fixed currency never changes: the spec fixes USD, then opens a naira wallet and signs in with a Nigerian phone:
   `GET /plans` stays USD with `currencyFixed: true`, a second purchase's fix answers USD and the row is unchanged
   (first purchase reference and time kept); the reverse (NGN, then a phone abroad) stays NGN; six first purchases at once
   leave one row and all six are told the same currency; a purchase transaction that rolls back fixes nothing.
   `billing-currency-writers.spec.ts`: in all of `src/` the only write to `PersonBilling` is the insert-only
   `createMany({ skipDuplicates: true })` in `fixAtFirstPurchase`; no update, upsert or raw SQL. No route writes it.
4. `GET /me/tier`: `none` (every field) for a new person; `active`, `ending` (inside `tier_ending_days`) and `ended`
   for seeded rows, `hasActiveTier` true, true, false, false; the full answer (tier, badge, dates, products with
   extras, points, Voice Intro, the highest event pass, a retired pass type ignored); another person's tier never
   shown; a tier the config no longer names keeps what was bought. Boundaries in `plans-config.spec.ts`.
5. No figure outside the config: `plans-figures.spec.ts` walks the TypeScript syntax tree (comments never count):
   no number in `src/plans/` code equals a config figure (one listed exception: `100`, a percent's top), and no string
   anywhere in `src/` writes a plan price as `₦`/`$` money or a plan points amount as points. It proves it can catch
   a planted price. Not grepped, and why: number literals across all of `src/`, because the plan's kobo figures
   collide with unrelated limits there (Fintava's fee band edge `500_000`, `STATEMENT_MAX_ROWS` `50_000`, the selfie
   size `100_000`).

**Money safety.** No balance is read, summed or shown; no provider is called. Prices are whole minor units, checked
at boot (a fraction, a float or a string stops the server); one function (`priceIn`) picks the price for a currency,
so an answer cannot mix currencies. The currency is fixed insert-only inside the purchase's own transaction, so a
repeated confirmation, two first purchases at once or a rolled-back purchase cannot change or half-fix it. The tier
reader is keyed on the caller's id only; neither route takes an id. No BVN, NIN, PIN or image is touched; the phone
is read from the token to decide the currency and never stored.

**Mutants** (each applied, specs run, `git restore`d, tree clean after each; all 12 failed a spec):
M1 wrong currency (dollar people priced in kobo); M2 rounding (fractional kobo accepted); M3 idempotency (the
insert stops skipping an existing row); M4 a fixed currency ignored after a wallet or phone change; M5 wrong account
(the reader reads any person's tier); M6 double spend (concurrent first purchases each told their own currency);
M7 the fix outside the purchase transaction; M8 products allowed without the extras; M9 the ending window's last
instant; M10 a price written into code; M11 an unknown (misspelt) field accepted; M12 the lowest event pass shown.

**Checks.** tsc 0. eslint on every changed file 0. Specs: the four above 63/63, plus `data-export-map` and
`account-data-map` (72/72 with them). Gates: 16 fail, the same 16 lines as main; warnings 58 to 62, the four new
ones the deliberate `PROVISIONAL(PLAN-PRICES | PLAN-CASHOUT-MINIMUM | PLAN-BOUGHT-POINTS-DAYS | PLAN-ENDING-DAYS,
owner=YOU, why=...)` at `src/plans/plans-config.ts:30-33`; 76 accepted; files 889 to 901. Tripwire on added lines:
empty (both repos). Secret scan of the staged diffs (hex and base64 runs, `sk_`, `FLWSECK`, bearer tokens, key
headers): nothing. Protected suite `run.sh --fresh HEAD` (code `d6fcea2`, and before it `ab6f2b0`; lock origin/main `965280e`): 253
passed, 244 of 244 required, lock unchanged; on the working tree with TIER-01 #1 applied: 253, 244 of 244.
Route-shadowing regression (full AppModule, with the mount, seeded database) 8/8. `npm run contract:build` on the
branch leaves `contract/openapi.json` unchanged (the enricher notes `GET /plans` and `GET /me/tier` as "present in
code but not in the spec" until they are mounted); with the mount it adds the two paths and 11 schemas and changes no
served path (TIER-01 #1 lists it). Full suite in a private network namespace (copies of `ns2.sh`/`inner2.sh`, own :4001, fresh migrated and seeded `bt01_full_test`, code `d6fcea2`): 185 of 187 files, 4801 passed, 4 skipped, 13 failed: 12 in `hub-rate-limits.contract.spec.ts` (needs a non-loopback interface; 22/22 on the host network) and 1 in the timing test `receipt-units` (median 396 ms against 300 at a load average near 13; 43/43 alone). Two earlier attempts were killed by the out-of-memory killer of the memory cgroup every session's shell shares (`dmesg`: processes 19626 and 14197) while other builders' suites ran; in between, grouped runs gave `src/money` 942/943 and `src/fintava` with only `fintava-stall` timing failures (it passed in the full run). No failing test touches a file this task changed.
Mobile: `npm run api -- --backend /home/user/wt/b-TIER-01` copied backend main `965280e`: only `contract/SOURCE_COMMIT` moved (from `3041887`), the generated types are unchanged; `npm run check` exit 0 (typecheck, lint 0, jest 1377/1377 in 76 files, gates 0 fail on 346 files, 249 tasks and 279 artboards). Two earlier runs under a load average near 40 failed only on render timeouts in files this task does not touch (2, then 7 tests); each of those files passed alone; the baseline run before any change failed the same way.

**Decisions** (each Default (agent), owner may override):
- The billing currency is its own table, `PersonBilling` (a column on `UserProfile` would widen `GET`/`PATCH
  /users/me`); "nullable" is no row until a purchase fixes it. The rule reads an open wallet (`FintavaWallet`, the
  wallet gate's table) as a naira wallet and the token's `phone` through `toLocalNigerianPhone`; the WAWU ID
  `country` claim is not used (the ticket names wallet and phone). A wallet still being opened does not count.
- Amounts in `GET /plans` are `priceMinor` with one top-level `currency` (kobo for NGN, cents for USD), not `*Kobo`
  fields: CONVENTIONS' kobo naming is for naira-only money routes, and a dollar person must never get a `*Kobo` field.
- The file keeps the brief's key names; prices become `{ kobo, cents }`, each action `{ points, per }` (PT1 needs the
  unit). Added beside the brief's figures: tier `name`s, `event_passes` with names (lowest first: that order ranks
  passes), `badge { id, numbered }` (Verify and Verify Plus `verified`, Founding `founding`, numbered; the round 2
  table names Verify's and Founding's badges, Plus's is not stated), `preselected_tier: founding` (VF5) and
  `tier_ending_days`.
- The provisional values: cash-out minimum 1,000 points (the unit the rate is quoted per); bought points last 365
  days (the longest period the plan uses); `ending` within 7 days.
- `MakerTier` copies `productsIncluded` and `pointsIncluded` when bought, so a later config change never takes away
  what was paid for; a tier the config no longer names still answers with its id and copied figures. An ended tier
  keeps its figures in `GET /me/tier` (VF14 draws the ended tier); `state` is what gates (TIER-02).
- Event passes do not end with the tier (the Christmas event has no date); the highest held is shown.
- `GET /plans` carries what the ticket lists; the referral and cash-out figures are in the file for REF-01 and
  POINTS-04, which add them to an answer.
- The file is read from the source tree at boot (the deploy rsyncs `src/`, as the TGIF book is read), so a figure
  change is an edit and a restart with no build.
- For NUV-09: `hasNairaWallet` reads `FintavaWallet`, which holds only naira accounts today; when dollar accounts
  arrive, that function is where "naira" narrows. For TIER-03 and POINTS-02: price with `priceIn(config...,
  currency)` using the currency `fixAtFirstPurchase(..., tx)` answers inside the purchase transaction.

**Gaps and shared changes.** G-420 (VF5's "Priority in search" has nothing behind it), G-421 (Founding's badge number
is not allocated; TIER-03). SHARED-CHANGES TIER-01 #1 (mount, open), #2 (schema and migration, made on the branch),
#3 (mobile types after merge).

**NOT RUN**
- The routes served from the branch's own AppModule: not mounted until TIER-01 #1 is applied. Unblocked when
  `grep -n PlansModule src/app.module.ts` on the backend shows the import and `GET /api/hub/plans` answers 200 on the
  built server (proved here with the change applied, then restored).
- The mobile app's `PlansView`/`MyTierView` types: `npm run api` copies backend origin/main. Unblocked when
  `grep -c PlansView src/api/schema.generated.ts` is above 0 after TIER-01 merges with #1 applied (TIER-01 #3).
- No (key) checks: this task calls no provider, so nothing waits for the Nuvion sandbox key.
- Screens: none in this task (`artboards: []`); VF5, VF6, VF13, VF14 and PT read these routes when cut.

## Verifier report

## Owner sign-off
