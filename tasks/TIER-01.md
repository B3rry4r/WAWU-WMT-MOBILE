---
id: TIER-01
title: Prices, tiers and the billing currency: one config file
owner: YOU
area: VERIFY
order: 199
priority: launch
repo: wawu-backend
type: backend-endpoint
status: done
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

Verifier, 8 Oct 2026 (independent; wrote none of this). Backend `wmt/TIER-01` `a0900cd` (two builder commits and the
lead's mount, on main `965280e`) in detached worktree `/home/user/wt/vt01b`; backend main `965280e` in
`/home/user/wt/vt01main` for every comparison; wawu-id main `fb8717e` in `/home/user/wt/vt01id` (its own `npm ci`);
mobile `db4f999` in `/home/user/wt/vt01m`. **Backend main moved** while this ran: origin/main is now `ea79fca` (FIX-06,
the professional takedown, migration `20261015100000_professional_takedown`); `git merge-tree` of `a0900cd` with
`ea79fca` is clean, the protected lock is the same at both, and the migration stamp still sorts after every folder on
it. Evidence: lead's scratchpad `vt01/`. No Fintava, Nuvion, wawuafrica.com or AI host was called: the booted
servers had no provider key, wawu-id ran with `WAWUAFRICA_API_URL` on a closed local port, and the full suite ran in a
private network namespace.

**Verdict: two defects, so back to `building`.** The price list, the boot check, the currency rule, the insert-only
fix and the tier reader do what the report says, live and in specs; the figures equal the brief's. What is wrong:
D1, the contract types three nullable fields of `GET /me/tier` as never null, so the mobile types generated from it
are wrong; D2, a price written twice in the file (a repeated key) boots and silently serves the second value.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed | `tsc --noEmit` 0 (`v1-tsc.log`). eslint (no `--fix`) on the 15 changed `.ts` files: exit 0. Gates: main `965280e` 16 fail / 58 warn / 76 accepted on 889 files; branch 16 / 62 / 76 on 901 files; the 16 FAIL lines identical; the 4 new warnings are exactly the `PROVISIONAL(PLAN-PRICES / PLAN-CASHOUT-MINIMUM / PLAN-BOUGHT-POINTS-DAYS / PLAN-ENDING-DAYS, owner=YOU, why=...)` markers at `src/plans/plans-config.ts:30-33`, each with `why=` (`v1-gates-*.txt`). Tripwire on added lines: 0 matches in both repos. `npm run contract:build` on the branch: `contract/openapi.json` unchanged (sha256 `c1175853cb3006c3...`), 379 paths. Mobile `npm run check` on `db4f999`: see the Mobile paragraph. |
| V2 Contract and config | failed (D1, D2) | Contract vs main `965280e`: +2 paths (`/api/hub/plans`, `/api/hub/me/tier`), +11 schemas (the eleven SHARED-CHANGES TIER-01 #1 names), 0 removed, 0 served path changed; the only other change is the order of values inside the `status`/`action` enums of five `Ad*` schemas (`AdCampaignView`, `AdOverlapView`, `AdAuditEntryView`, `AdSummaryReportView`, `AdCampaignDetailView`) and inside two `required` lists of `AdSummaryReportView`: equal as sets, no value added or removed, so no meaning changed (G-54). But see D1. Figures: 77 figures of the brief's section 2 compared with the file by script (naira and dollars x 100, points, days, counts, caps, referral levels and milestones): 77 equal, 0 differ; the script catches a planted change (`v2-figures.txt`). Bad config: 64 broken copies through the built loader (`v2-badconfig.txt`): 58 refused, each naming the field or the file (fraction, text, null, zero, negative, missing, misspelt, unknown key, naira keys, `__proto__`, beyond a safe integer, `1e21`, unknown pass, repeated tier/pass/pack id, upper-case id, empty list, em-dash, spaces, non-boolean, percent 101, unknown unit, bare-number action, bad action key, empty actions, referral base missing or extra, levels not rising or not starting at 1, multiplier below 1, milestones not rising, negative hold, bad provisional key, empty file, BOM, a list at the top, not JSON, a missing file); 6 accepted (D2's repeated key, and five notes below). On the built server: four bad files each exit 1 with the named field (`v2-boot-*.log`); a changed file and a restart, no build, served the new figures (`v2-config-change.txt`). |
| V3 Regression | passed | Protected suite `run.sh --fresh HEAD` on `vt01_protected_test`, code `a0900cd`, lock origin/main `ea79fca` (lock files identical to `965280e`): 253/253, all 244 required (`v3-protected.log`); the branch changes no lock file. Full suite in my own network namespace (copies of `t3ns/ns2.sh`/`inner2.sh`, own :4001, fresh migrated and seeded `vt01_full_test` per shard), three serial `--runInBand --shard=i/3` passes: 187 suites, 4,818 tests, 4,800 passed, 4 skipped, 14 failed (`ns/full-s*.json`): 11 in `hub-rate-limits.contract.spec.ts` (needs a non-loopback interface; 22/22 on the host network, `v3-rerun-hub-rate-limits.txt`) and 3 timing tests in `fintava-stall.spec.ts` at a load average near 27 (120/120 alone at load 10, `v3-rerun-fintava-stall.txt`). No failing test touches a file this task changed. |
| V4 States | passed | `GET /me/tier` live on the built branch server (`v4-tier-live.txt`): `none` (every field empty) for a new person; `active` at 8 days and at 7 days + 60 s; `ending` at 7 days - 60 s and at 60 s; `ended` at 2 s past and a year past; exact edges of `tierStateAt` (7 days + 1 ms active, 7 days exactly ending, 1 ms ending, 0 ended, -1 ms ended; `v4-boundaries.txt`); `productsAllowed` is the bought products plus extras (a seeded 3 + 5 answers 8); the highest of four passes shown and a retired pass type ignored; a tier the config no longer names answers its id with `name` and `badge` null. One person never sees another's: B asking with `?wawuUserId=<A>`, `?sub=<A>` or `/me/tier/<A>` gets `none` or 404. |
| V8 Money | passed | `fixAtFirstPurchase` driven from the built code inside real transactions (`v8-fix.txt`, `v8-fix2.txt`): fixed USD, then a naira wallet, a Nigerian phone and a second purchase: still USD, row unchanged (first reference and time kept); fixed NGN then a phone abroad: still NGN; a purchase that rolls back fixes nothing; 8 first purchases at once (half Nigerian phone, half abroad) at READ COMMITTED: one row, all 8 told the winner's currency; a first purchase that rolls back while a second waits on its row: the second fixes its own. Every write to `PersonBilling` in `src/` is the insert-only `createMany({ skipDuplicates: true })` (the purge deletes generically by owner, which removes the person, never switches a currency). No route writes it. |
| V9 Live seam | passed (fintava); NOT RUN (nuvion) | Built branch server against the real wawu-id (`fb8717e`, own `npm ci`, own keys, :5713): three people registered through `POST /auth/register` and signed in through `POST /auth/login` (no injected token). `+2348031110001` got `NGN` tiers `[100000, 300000, 500000]`; `+447700900456` got `USD` `[300, 900, 1500]`, packs `2500/7000/14000` points, and its seeded Founding tier as `ending` with 10 + 5 products and the priority pass (`v9/drive-branch-fintava.txt`). Fee quotes under `WALLET_PROVIDER=fintava` (bank send ₦10,000, purchases ₦4,999 and ₦5,000, a WAWU send): identical on main `965280e` and the branch; main answers `GET /plans` 404. Under `WALLET_PROVIDER=nuvion` both main and the branch stop at boot with MONEY-20's reserved-provider message (`v9/hub-*-nuvion.log`), so nothing can be served under nuvion on this branch. |

**Capability checks, as written**
1. Naira people see kobo, dollar people see cents, never both: passed live for 19 phone forms and 3 odd tokens
   (`v2-currency-live.txt`): every price and pack/bump points equal the config for the person's currency, the
   other currency's code and the words `kobo`/`cents` absent. See finding N1 on phones without a country code.
2. A changed figure and a restart change `GET /plans`; a malformed file stops boot naming the field: passed
   (Founding to 550000/1700 and Verify to 1 product and 50 points served after a restart with no build), except
   D2 (a repeated key).
3. A fixed currency never changes through any route: passed (V8 row; no route writes the table).
4. `GET /me/tier` none, active, ending, ended: passed (V4 row).
5. No price, points amount, cost or cap in source outside the file: passed. The spec's two greps plus mine: no plan
   id (`verify`, `founding`, `maker_pass`, `voice_intro`, `checkout_bump` ...) is used in `src/` outside `src/plans/`;
   the price-shaped literals in the changed files are older comments about credits and legal prices; no em-dash added
   anywhere.

**Defects**
- **D1 (defect): `GET /me/tier`'s contract says three nullable fields are never null, so the app's generated types
  are wrong.** `MyTierView.tier`, `MyTierView.eventPass` and `MyTierSummaryView.badge` are `X | null` in
  `src/plans/plans-view.type.ts` and the server answers `null` (a new person: `"tier":null`, `"eventPass":null`;
  a tier the config no longer names: `"badge":null`), but `contract/openapi.json` writes them as
  `{ "$ref": ..., "nullable": true }`. OpenAPI 3.0 ignores every sibling of a `$ref`, so the mobile types generated
  from it (`db4f999` `src/api/schema.generated.ts` lines 9280, 9289 and 9296) read `tier:
  components["schemas"]["MyTierSummaryView"]`, `eventPass: components["schemas"]["PlanEventPassView"]` and `badge:
  components["schemas"]["PlanBadgeView"]`, never null. A VF14 screen written against them that reads `tier.name`
  type-checks and crashes for every person who has not bought a tier. `docs/contract/CONVENTIONS.md` section 0 names
  this exact problem and its fix (`{ "allOf": [{ "$ref" }], "nullable": true }`), applied by
  `scripts/enrich-contract.js` only to folders in `NULLABLE_REF_AS_ALLOF_DIRS`; every task that added new routes since
  (`src/money`, `src/chat`, `src/legal-intake/assistant`, `src/inbox`, `src/me`) added its folder; `src/plans` is not
  there. Reproduce: `sed -n '9277,9297p' src/api/schema.generated.ts` on mobile `db4f999`; `curl /api/hub/me/tier` as a new person answers `"tier":null`. Fix: add `src/plans` to that
  list, `npm run contract:build` (the three fields become `allOf` + `nullable`; nothing published changes), then
  `npm run api` on mobile (SHARED-CHANGES TIER-01 #3 again).
- **D2 (defect): a repeated key in `plans.config.json` boots and silently takes the last value.** The file goes
  through `JSON.parse`, which keeps the last of two equal keys, so the whole-file check never sees the first. With
  line 21 written `"price": { "kobo": 100000, "kobo": 1, "cents": 300 },` the built server boots and `GET /plans`
  serves Verify at `priceMinor: 1` (₦0.01) to every naira person (`v2-dupkey-live.txt`; also in `v2-badconfig.txt`).
  A one-line edit of a price that leaves the old line in place is the likeliest way this file goes wrong, and the
  task's own rule is that a malformed file stops the server naming the field. Fix: refuse a repeated key while
  reading (a key repeated in one object stops boot: `tiers[0].price.kobo is written twice`), with a spec.

**Findings (not defects)**
- N1 (decision 1, a caveat): a phone written without a country code is read as Nigerian if its 10 digits look like
  one. Through the real wawu-id, a web sign-up (`POST /auth/register`, which stores the phone as typed and keeps the
  dial code apart) with phone `(803) 555-0100`, dial code `+1` and country `United States` is served `NGN`; so is a UK
  local `07123456789`. WAWU ID's own mobile sign-up turns any leading-0 number into `+234...`, so for app sign-ups
  this agrees with WAWU ID; the exposed path is the web's register. The currency is fixed at the first purchase and
  then needs support to change. The token carries `country`; the builder chose not to read it. For TIER-03: when the
  phone carries no country code (no `+`, no `234`), break the tie with `country` or the wallet.
- N2: every amount in `GET /plans` (`priceMinor`, points, counts) is `"type": "number"` in the contract, not
  `integer`; CONVENTIONS section 1's integer rule is keyed on the `Kobo` name, which this route rightly avoids. The
  values are integers (checked at boot). Same fix point as D1 (`scripts/enrich-contract.js`).
- N3 (for TIER-03): at READ COMMITTED (what every transaction in `src/` uses today) concurrent first purchases are
  fine; at REPEATABLE READ or SERIALIZABLE the losers get Prisma `P2034` (serialization failure) from the
  `createMany` instead of the winner's currency (`v8-fix2.txt`). Safe (nothing half-fixed), but TIER-03 must stay at
  READ COMMITTED or retry on `P2034`.
- N4: `GET /plans` and `GET /me/tier` send no `Cache-Control`; both answers are personal (the currency is the
  caller's). The money routes send `no-store`.
- N5: the boot check accepts values the tables cannot hold or the later tasks will need: tier `products` or
  `bonus_points` above 2,147,483,647 (copied into the INTEGER columns `productsIncluded`/`pointsIncluded`, so
  TIER-03's insert would fail at purchase time); an `action_points` object without an action the brief names (for
  example no `voice_intro`; POINTS-03 should require the ids it charges); an emptied `provisional` object (the spec,
  not boot, keeps it equal to the markers). A top-level non-object is reported with an empty field name
  (`plans.config.json:  must be an object`).
- N6: a `phone` claim that is not a string (a number or a list) answers 500; WAWU ID always sends a string (the
  column is NOT NULL; a released phone is sent as `""`), so no real token reaches it.
- N7: `PersonBilling` has no CHECK that `purchaseRef` is set when `fixedBy = first_purchase`; a `MakerTier` row whose
  `activeFrom` is in the future answers `active`. Neither is written by anything yet; TIER-03 should not write either.
- N8 (main moved): a local trial merge of `a0900cd` into `ea79fca` (not pushed, aborted): no conflict, `tsc` 0, a
  fresh `npm run contract:build` byte-identical to the merged `contract/openapi.json`, `prisma migrate deploy` applies
  FIX-06's and this task's migrations in order, and the plans, export-map and purge-map specs 72/72
  (`trial-*.txt`).
- N9 (merge order): the stamp `20261016120000` sorts after every folder on main (`965280e` and `ea79fca`, latest
  `20261015100000`) and shares no stamp with any origin/wmt/* branch; three branches carry later stamps by plan
  (POINTS-01 `...130000`, MONEY-17 `...140000`, NUV-01 `...150000`), so TIER-01 merging first keeps every merge in
  order. `git merge-tree` with `ea79fca`, MONEY-17 and NUV-07: clean; with NUV-01 and POINTS-01: only
  `contract/openapi.json` conflicts (regenerate).
- G-410, G-411 and G-7 do not apply here: this task serves no money-moving route and reads no limit. Nuvion's docs
  give every transfer `amount` in the smallest currency unit, the same unit as the file's `kobo`/`cents`, so TIER-03
  can pass `priceIn(...)` through unchanged.

**Decisions** (each judged)
- Billing currency in its own table, "nullable" as no row: agree (a `UserProfile` column would widen `GET`/`PATCH
  /users/me`). Wallet or Nigerian phone, `country` not read: agree with N1's caveat. "A wallet still being opened
  does not count": true (`FintavaWalletOpening` is a separate table; a `FintavaWallet` row exists only once open;
  NUV-01 keeps Nuvion wallets in `FintavaWallet` with a `provider` column, so they count too).
- `priceMinor` with one top-level `currency`: agree (a `*Kobo` field would be false for dollar people); N2.
- The brief's key names, `{ kobo, cents }`, `{ points, per }`, and the additions (names, `event_passes` order as
  rank, `badge`, `preselected_tier`, `tier_ending_days`): agree. Verify Plus's `verified` badge is an assumption the
  round 2 table does not state; it is not a price and is visible in the file.
- Provisional cash-out minimum 1,000 points, bought points 365 days, ending window 7 days: agree; each is its own
  marker and shows in the gates.
- `MakerTier` copies products and points when bought: agree; proved live (config Verify 3 to 1 products and 100 to
  50 points: a bought Verify still answers 3 and 100). No spec pins it for a tier the config still names (mutants
  V17, V18).
- Event passes do not end with the tier; the highest held is shown: agree; proved live.
- `GET /plans` without referral and cash-out figures: agree (REF-01, POINTS-04 add them).
- The file read from the source tree at boot: agree. `deploy.yml` rsyncs the whole tree (`src/` included, `dist`
  excluded) and `deploy.sh` restarts; the built `dist/src/plans` walks up to `package.json`. A hand edit on the
  droplet is overwritten by the next deploy (`rsync --delete`), so a figure change is a commit and a deploy.
- `hasNairaWallet` reading `FintavaWallet` until NUV-09: agree (see the first decision).

**Mutants** (24 of mine, each applied in `/home/user/wt/vt01b`, the four plans specs run, restored; tree clean after;
`mutants.txt`): 22 killed, 2 survived.
Killed: a fraction passing the whole-number check; a price of 0 accepted; an unknown (misspelt) key accepted;
referral levels allowed to repeat; the instant of the end counted as `ending`; exactly 7 days left counted as
`active`; an `ending` tier refused by `hasActiveTier` (the gate); the window hard-coded to 3 days; concurrent losers
told their own currency; the insert turned into an upsert that overwrites; the fix written outside the purchase
transaction; the phone rule checked before the fixed currency; `priceIn` giving kobo to dollar people; `countIn`
giving naira points to dollar people; any phone counted as Nigerian; a naira wallet ignored; `GET /plans` and
`GET /me/tier` each without the sign-in guard; the reader reading anyone's newest tier; the lowest event pass shown;
the em-dash check dropped; a figure (7) written into `src/plans/` code.
Survived (a spec gap, not a defect; the behaviour is right, proved live in V2): `productsAllowed` and
`pointsIncluded` read from the config whenever it still names the tier (V17, V18). The only spec of "a later config
change never reduces a bought tier" uses a tier the config no longer names, seeded with the config's own figures, so
reading the config gives the same numbers. A spec that seeds a named tier with figures different from the config's
would pin it.

**Mobile** (`db4f999`): `contract/openapi.json` is byte-identical to backend `a0900cd`'s; `SOURCE_COMMIT` names it.
`npm run check` on `db4f999` at a load average near 14: typecheck and lint 0, jest 1375/1377, the 2 failures 20 s
render timeouts in files this task does not touch (`OpenWalletScreen.test.tsx`, `settingsScreens.test.tsx`), both
files 128/128 alone (`v1-mobile-check.log`, `v1-mobile-rerun2.log`). With this report: `npm run check` exit 0 (typecheck, lint 0, jest 1377/1377 in 76 suites, gates 0 fail / 0 warn on 346 files, 249 tasks and 279 artboards).

**NOT RUN**
- The plans routes under `WALLET_PROVIDER=nuvion`: the branch (like main `965280e`) refuses to boot under nuvion
  until the Nuvion adapter lands. Unblocked when NUV-01 is merged to backend main and `WALLET_PROVIDER=nuvion` boots
  the built server to `GET /api/hub/health` 200.
- The full suite as one in-band process (run as three serial shards; memory is shared with other sessions).
- The purchase path itself (TIER-03 writes `MakerTier`, `EventPass` and calls `fixAtFirstPurchase`; nothing in
  `src/` calls them yet). Unblocked when `grep -rn fixAtFirstPurchase src --include=*.ts | grep -v tests` names a
  purchase service on backend main.

## Lead rulings after the verifier (8 Oct 2026)

Build round 2 on backend `wmt/TIER-01` `a0900cd` (the lead mounted `PlansModule`, SHARED-CHANGES TIER-01 #1) and
mobile `6a26f95` (the lead synced the contract, `db4f999`), with backend origin/main `8d7a054` and mobile origin/main
`eb62049` merged in first (merge, never rebase); then status `verifying`.

Defects:
1. **D1.** Add `src/plans` to `NULLABLE_REF_AS_ALLOF_DIRS` in `scripts/enrich-contract.js`, run `contract:build`, then
   copy the branch's contract into mobile `contract/openapi.json` and run `python3 scripts/api/sync_contract.py`
   without `--backend` (that flag copies backend main). The mobile types for `MyTierView.tier`, `MyTierView.eventPass`
   and `MyTierSummaryView.badge` must be nullable; add a spec that fails if any is non-null in the generated contract.
2. **D2.** Boot refuses `plans.config.json` with a repeated key anywhere, naming the key and its path (parse with a
   duplicate-key check, not plain `JSON.parse`).

Rulings on the findings:
3. **N1.** When the phone has no country code, use the WAWU ID `country` claim to break the tie; only a +234 number or
   a Nigerian `country` gives NGN without a naira wallet. Spec the United States sign-up case.
4. **N2.** `priceMinor` and every count are `integer` in the contract.
5. **N4.** Both routes send `Cache-Control: no-store`.
6. **N5.** Boot refuses values the INTEGER columns cannot hold, and an `action_points` table missing any action.
7. **N6.** A non-string phone claim is treated as no phone, never a 500.
8. **N3 and N7** are for TIER-03: a short "Lead note (8 Oct 2026)" in `tasks/TIER-03.md` (stay at READ COMMITTED or
   retry P2034; never write the two states N7 names).
9. Kill the verifier's two surviving mutants with a spec that seeds a still-named tier whose figures differ from the
   config.
10. **Merge order:** TIER-01 merges first of the payment set (its migration stamp is the earliest of them).

## Builder report, round 2

Builder, 8 Oct 2026. Backend `wmt/TIER-01` `3e1dc15`: the lead's `a0900cd` with origin/main `8d7a054` merged in
(`7ed239e`, no conflict), then `9c5e91f` (the fixes) and `3e1dc15` (`docs/contract/PLANS.md`). Mobile `wmt/TIER-01`:
`6a26f95` with origin/main `eb62049` merged in (`2c902ef`; conflicts in `BACKEND_GAPS.md` and `SHARED-CHANGES.md` kept
both sides, `contract/SOURCE_COMMIT` and the generated `docs/PROGRESS.md` regenerated), then this round.

**Defects**
- **D1, fixed.** `src/plans` is in `NULLABLE_REF_AS_ALLOF_DIRS` (`scripts/enrich-contract.js`); `npm run contract:build`
  writes `MyTierView.tier`, `MyTierView.eventPass` and `MyTierSummaryView.badge` as `{ allOf: [{ $ref }], nullable:
  true }`. Mobile: the branch's `contract/openapi.json` copied in, `SOURCE_COMMIT` `wmt/TIER-01@3e1dc15`,
  `python3 scripts/api/sync_contract.py` without `--backend`: `src/api/schema.generated.ts` now reads
  `tier: components["schemas"]["MyTierSummaryView"] | null`, `eventPass: ...PlanEventPassView | null` and
  `badge: ...PlanBadgeView | null`. New `src/plans/tests/plans-contract-shape.spec.ts` (5) reads the generated
  contract and fails if any of the three is not `allOf` + `nullable` (M25 below).
- **D2, fixed.** `loadPlansConfig` runs `repeatedKey(text)` after `JSON.parse`: a key written twice in one object,
  anywhere, stops boot naming it (`plans.config.json: tiers[0].price.kobo is written twice. Fix the file and
  restart.`); keys are compared as JSON decodes them (`"hold_days"` is `hold_days`). Specs: five repeated-key
  files (a price, a top-level key, a key in a list item, another spelling, a whole section) and the scanner on its
  own. Live, the built server with the verifier's own edit (`"kobo": 100000, "kobo": 1`) exits 1 with that message.

**Rulings**
- **N1.** `BillingCurrencyService` takes the token's `phone` and `country` (`BillingClaims`). Order: the fixed
  currency; a naira wallet; the phone's country code (`+234`, `00234`, or `234` and ten digits is NGN; any other
  `+` or `00` code is USD); a phone with no country code, no phone, or a `phone` that is not text is decided by
  `country` (`Nigeria`, `NG`, `NGA`, any case, trimmed, is NGN; anything else or nothing is USD). So only a naira
  wallet, a +234 number or a Nigerian country gives NGN. Spec: 15 phone and country pairs, and the United States web
  sign-up `(803) 555-0100` with `United States` billed in USD (cents prices). Live on :5652: the same sign-up `USD
  [300, 900, 1500]`; `08031234567` with `Nigeria` NGN; `+2348031234567` with `United States` NGN; `+14155550100`
  with `Nigeria` USD. `fixAtFirstPurchase` takes `{ wawuUserId, phone, country, purchaseRef }`.
- **N2.** A new `WHOLE_NUMBER_DIRS` in the enricher (only `src/plans`): every number of the plans schemas is
  `integer` (`priceMinor`, points, counts, days, the percent); the shape spec fails on any `number` left.
- **N4.** `@Header('Cache-Control', 'no-store')` on both routes; spec and live (both answer `no-store`).
- **N5.** Every whole number in the file is at most 2,147,483,647 (`INT4_MAX`, the most an INTEGER column holds):
  `tiers[2].products must be at most 2147483647, the most a whole-number column holds (it is 2147483648)`;
  `action_points` must price exactly the brief's twelve actions (`PLAN_ACTIONS`): one left out is `is missing`, one
  added is `is not a known field`. A file whose top is not an object now names `(the file)`, not an empty field.
- **N6.** A `phone` claim that is a number, a list, an object or null is no phone: the country decides, 200 every
  time (spec, and live for a number and a list).
- **N3 and N7.** "Lead note (8 Oct 2026)" added to `tasks/TIER-03.md`; `docs/contract/PLANS.md` says the same.
- **Item 9.** New spec: a tier the config still names, bought with other figures (products + 2, points + 7, one
  extra, the Voice Intro flag flipped), answers the bought figures on `GET /me/tier` and from `tierOf`; it kills the
  verifier's two survivors (M23, M24 below).

**Mutants** (each applied, specs run, `git restore`d, tree clean after each; 26 of 26 failed a spec, none by a
compile error): the 12 of round 1 re-applied to the new code (M1 to M12), and 14 new: M13 the repeated-key check
skipped; M14 keys compared as written; M15 a local number read as Nigerian (the old rule); M16 the country ignored;
M17 the country outranking the phone's code; M18 a non-text phone reaching `.trim()`; M19 numbers above INTEGER
accepted; M20 `action_points` free to drop or add actions; M21 and M22 each route without `no-store`; M23 and M24
the verifier's V17 and V18 (products and points read from the config while it names the tier); M25 `src/plans` out
of `NULLABLE_REF_AS_ALLOF_DIRS` and M26 the integer rule off (each regenerated with `contract:emit` and
`contract:enrich`, which reproduce the committed contract byte for byte, then the shape spec).

**Checks.** tsc 0; eslint on every changed `.ts` file 0. Plans specs 4 + 1 files, 96/96 (config 43, figures 5,
writers 3, HTTP 40, contract shape 5). Gates: 16 fail, the same 16 lines as main `8d7a054`; warnings 58 to 62, the
four new ones the same `PROVISIONAL(...)` markers at `src/plans/plans-config.ts:30-33`; 76 accepted; files 908 to
921. Tripwire on added lines: empty (both repos). Secret scan of the staged diffs: nothing. `npm run contract:build`:
only the plans' 8 schemas and the 2 operations' summaries change; no other schema or path (SHARED-CHANGES TIER-01 #4).
Protected suite `run.sh --fresh HEAD` (code `3e1dc15`, lock origin/main `8d7a054`, no lock file changed): 253 passed, 244 of 244 required. Full suite in my own network namespace (copies of `ns2.sh`/`inner2.sh`, own :4001, fresh migrated and seeded `bt01_full_test`, code `3e1dc15`, one in-band run): 193 of 195 files, 4923 passed, 4 skipped, 12 failed: 11 in `hub-rate-limits.contract.spec.ts` (needs a non-loopback interface; 22/22 on the host network) and 1 in the timing test `receipt-units` (357 ms against 300 at a load average near 11; 43/43 alone). Neither touches a file this task changed. Live on the built server (:5652, the stand-in WAWU ID on :5651): the phone and country cases above, a number and a list as `phone` both 200, both routes `no-store`, and the repeated-key file exiting 1. Mobile `npm run check` exit 0 (typecheck with the regenerated types, lint 0, jest 1377/1377 in 76 files, gates 0 fail on 346 files, 249 tasks and 279 artboards).

**Merge order (item 10).** Backend and mobile both carry their mains (`8d7a054`, `eb62049`); the migration stamp
`20261016120000` still sorts after every folder on backend main (latest `20261015100000`), so TIER-01 can merge
first of the payment set.

**NOT RUN**
- The plans routes under `WALLET_PROVIDER=nuvion`: main and this branch both stop at boot under nuvion until NUV-01
  merges. Unblocked when `WALLET_PROVIDER=nuvion` boots the built server to `GET /api/hub/health` 200.
- The purchase path (TIER-03 writes `MakerTier`, `EventPass` and calls `fixAtFirstPurchase`). Unblocked when
  `grep -rn fixAtFirstPurchase src --include=*.ts | grep -v tests` names a purchase service on backend main.
- No (key) checks: this task calls no provider.

## Verifier report, round 2

Verifier, 8 Oct 2026 (independent; wrote none of this). Backend `wmt/TIER-01` `3e1dc15` in detached worktree
`/home/user/wt/vt01r2b`; backend main in `/home/user/wt/vt01r2main` (`8d7a054` for every comparison, then the two
trial merges below); wawu-id main `fb8717e` in `/home/user/wt/vt01r2id` (its own `npm ci`, own keys); mobile `2a5c93a`
in `/home/user/wt/vt01r2m`. Evidence: lead's scratchpad `vt01r2/`. No Fintava, Nuvion, wawuafrica.com or AI host was
called: every booted server ran with a clean environment and no provider key, wawu-id with `WAWUAFRICA_API_URL` on a
closed local port, and the full suite in a private network namespace.

**Backend main moved twice while this ran.** `8359057` (FIX-11, PR #88, 11:10 UTC; migration
`20261015200000_legal_chat_opener`) and then `6ce2ddf` (LEGAL-03, PR #77, 11:39 UTC; migration
`20261016160000_legal_consultations`). The protected lock is the same at `8d7a054`, `8359057` and `6ce2ddf`. Mobile main
moved too (`c8928e3`); this report is on the branch as it was (`2a5c93a`), with no merge.

**Verdict: back to `building` for one low defect, D3: the migration stamp no longer sorts after main's newest
folder.** Everything else holds: D1 and D2 are fixed, every lead ruling (N1, N2, N4, N5, N6, item 9) is built and
holds live and in specs, V17 and V18 are killed, the figures equal the brief, and nothing outside the config holds a
price. D3 is not in the code: LEGAL-03 merged to main after round 2 with a later stamp. It is a rename and a merge,
proved below on a local trial merge.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed | `tsc --noEmit` 0 (`v1-tsc.log`). eslint (no `--fix`) on the 16 changed `.ts` files: exit 0. `scripts/enrich-contract.js` is not in the tsconfig, so eslint cannot parse it, on main too; `node --check` passes. Gates: main `8d7a054` 16 fail / 58 warn / 76 accepted on 908 files; branch 16 / 62 / 76 on 921 files; the 16 FAIL lines identical; the 4 new warnings are the `PROVISIONAL(PLAN-PRICES / PLAN-CASHOUT-MINIMUM / PLAN-BOUGHT-POINTS-DAYS / PLAN-ENDING-DAYS, owner=YOU, why=...)` markers at `src/plans/plans-config.ts:30-33` (`v1-gates-*.txt`). Tripwire on added lines: 0 in both repos; no em-dash added. `npm run contract:build`: `contract/openapi.json` unchanged (sha256 `5a9a32fa45ccc133...`). Mobile: `contract/openapi.json` byte-identical to the backend branch's; `python3 scripts/api/sync_contract.py` regenerates the committed types with no change; `npm run check` on `2a5c93a`: see the Mobile paragraph. |
| V2 Contract and config | passed | Contract against main `8d7a054` (`v2-contract-diff.txt`): +2 paths (`/api/hub/plans`, `/api/hub/me/tier`), +11 schemas, 0 removed, 0 served path changed; the other change is value order inside nine enum or `required` lists of five `Ad*` schemas (`AdAuditEntryView`, `AdCampaignDetailView`, `AdCampaignView`, `AdOverlapView`, `AdSummaryReportView`), equal as sets, so no meaning changed (G-54). D1: `MyTierView.tier`, `.eventPass` and `MyTierSummaryView.badge` are `allOf` + `nullable` in the contract and in `openapi.mobile.json`, and `X \| null` in the mobile `src/api/schema.generated.ts`; every number of the 11 schemas is `integer` (N2). Figures: 81 figures of the brief's section 2 against the file by my own script (naira and dollars x 100, points, days, counts, caps, the 12 action ids in order, referral levels and milestones): 81 equal, 0 differ; a planted change is caught (`v2-figures.txt`). No plan id or figure in `src/` outside `src/plans/`, and none in `docs/contract/PLANS.md`. Bad config through the built loader (`v2-badconfig.txt`): 63 files, each as expected: 52 refused naming the field or the file (repeated keys in 8 places including a `k` spelling, a list item and the provisional and base-points maps; fraction, text, null, zero, negative, `1e21`, INT4_MAX + 1 in products, bonus points, extra count and a price; percent 101; zero days and window; multiplier 0.5; missing, misspelt, unknown and `__proto__` keys; naira keys; unknown pass; repeated or upper-case id; empty list; unknown preselected tier; em-dash; spaces; boolean as text; an action missing, added, a bare number or with an unknown unit; referral base, levels and milestones out of order; negative hold; bad provisional key; empty name; a list, number or null at the top; empty file; BOM; trailing comma; comment; truncated file), and 11 accepted by design (the shipped file, INT4_MAX itself, `1e5` and `100000.0`, a `\"kobo\"` inside a string, the same key in different objects, multiplier `1e300`, an emptied `provisional`). The built server with seven bad files (D2's own edit, the escaped repeat, INT4 + 1, an action missing, an action added, a list at the top, a fraction): each exits 1 naming it (`boot-*.log`). A changed file and a restart, no build: Founding 550000/1700 and Verify 1 product and 50 points served; a bought Verify still answers 3 products and 100 points (`v2-config-change.txt`). |
| V2 Currency (N1, N6) | passed | 39 phone and country pairs live on the built server (`v2-currency-live.txt`, `no-store` on every answer): `+234` E.164 and spaced, `00234`, `234` with ten digits (spaced too), `+2340...` with a stray zero and `+234` alone are NGN whatever the country; `234` with nine or eleven digits, or ten starting with 1, has no code and the country decides; a local `0803...` is NGN with `Nigeria`, USD with `United States` or no country; `(***) ***-0100` with `United States` is USD, with `Nigeria` NGN; a UK local number with `United Kingdom` is USD; `+44`, `+1`, `+1 234 ...` (a US area code 234) and `0044 ...` are USD even with `Nigeria`; an empty, missing, null, number, list, object or boolean phone is decided by the country, 200 every time; `ng`, ` NGA `, `NIGERIA`, `nigeria ` count, `Niger`, `Federal Republic of Nigeria` and `234` do not. Every price, pack and bump figure equals the config for that currency, the other currency's code and the words kobo and cents absent. 0 wrong. |
| V3 Regression | passed | Protected suite `run.sh --fresh HEAD` on `vt01r2_protected_test`, code `3e1dc15`, lock origin/main `8359057` (same lock files as `8d7a054` and `6ce2ddf`): 253/253, all 244 required (`v3-protected.log`); the branch changes no lock file. Full suite, one in-band run in my own network namespace (copies of `t3ns/ns2.sh`/`inner2.sh`, own :4001, fresh migrated and seeded `vt01r2_full_test`): 195 files, 4,939 tests, 4,738 passed, 4 skipped, 197 failed in 12 files at a load average of 15 to 17 (other sessions, and my mutant runs for part of it) (`ns/full-run1.json`): 11 in `hub-rate-limits` (needs a non-loopback interface) and the rest 5-second timeouts or timing limits in 11 money, fintava, tgif, learn-guide and credit files (120 of them in `fintava-stall`). Those 11 files rerun in the namespace: 467 of 468 (`ns/full.json`), the one left the 300 ms limit of `receipt-units`, which then passed 43/43 alone (`v3-rerun-receipt-units.txt`); `hub-rate-limits` 22/22 on the host network (`v3-rerun-hub-rate-limits.txt`). No failing file touches a file this task changed. |
| V4 States | passed | `GET /me/tier` live (`v4-tier-live.txt`, 18 checks, 0 wrong): `none` with every field empty; `active` at 8 days and 7 days + 60 s; `ending` at 7 days - 60 s and 60 s; `ended` 2 s past and a year past; the highest of three passes shown and a retired type ignored; only a retired pass and no tier: `none` with `eventPass` null; a tier the config no longer names: its id, `name` and `badge` null, the bought figures; a still-named tier bought with other figures (9 + 2 products, 333 points, no Voice Intro) answers those. One person never sees another's: B with `?wawuUserId=A`, `?sub=A` gets `none`, `/me/tier/A` 404; no token 401 on both routes. Exact edges of the built `tierStateAt` (`v4-boundaries.txt`): 7 days + 1 ms active, 7 days exactly and 1 ms ending, 0 and -1 ms ended. |
| V8 Money | passed | The built `fixAtFirstPurchase` in real transactions (`v8-fix.txt`, 10 checks, 0 wrong): fixed USD then a naira wallet, a Nigerian phone and a second purchase: still USD, row unchanged (first reference and time); fixed NGN then a phone abroad: NGN; a rolled-back purchase fixes nothing; 8 at once: one row, all told the winner; a first purchase that rolls back while a second waits: the second fixes its own; no phone and no country: USD; a phone abroad with a naira wallet: NGN; a local number with `Nigeria` NGN and the US web sign-up USD; a repeated confirmation: one row. 20 rounds of 6 concurrent first purchases, mixed phones: one row and one answer every round, both currencies won (`v8-fix2.txt`). At SERIALIZABLE the losers get `P2034` (N3, the TIER-03 lead note covers it). The only writer of `PersonBilling` in `src/` is that insert; nothing in `scripts/`, the seed or `test/` writes the three tables; no route writes them. |
| Migration | failed (D3) | Fresh migrate and seed on the branch, on main and on both trial merges. Additive (one enum, three tables, no existing object touched). CHECKs hold (`v2-checks.txt`): empty tier id, `activeUntil` not after `activeFrom` (equal and earlier), negative products, extras or points, an out-of-range integer, a second row per person, an empty pass type, a repeated pass `purchaseRef`, `fixedBy` other than the two values and a currency other than the two are refused; `support` is accepted; `first_purchase` with no reference is accepted (N7, TIER-03's). `prisma migrate diff` (database to schema): the same single `DROP INDEX "ContentPiece_specializations_idx"` on main and branch. Purge and export on the built code (`v2-purge-export.txt`): the purge deletes the person's three rows and leaves another person's; the export carries currency, tier and passes without the payment reference. Stamp: no other folder shares it, but see D3. |
| V9 Live seam | passed (fintava); NOT RUN (nuvion) | Built branch server (:5752) against the real wawu-id (:5753): five people registered through `POST /auth/register` and signed in through `POST /auth/login`; wawu-id mails no code here, so each address was marked proven in wawu-id's own table before the real sign-in (`v9/drive-fintava.txt`). A `+234` sign-up with `Nigeria` and a local `0803...` with `Nigeria` got NGN `[100000, 300000, 500000]`; a UK `+44` with `United Kingdom`, the web US sign-up `(***) ***-0187` with dial code `+1` and `United States`, and a `+1` phone with `Nigeria` got USD `[300, 900, 1500]` and packs `2500/7000/14000` points; `?currency=` of the other side is ignored; `no-store`; each `GET /me/tier` `none`; the UK person's seeded Founding tier answers `ending` with 10 + 5 products and the priority pass, and nobody else sees it. Main `8d7a054` (:5754) answers both routes 404. Fee quotes under `WALLET_PROVIDER=fintava` (bank send ₦10,000, purchases ₦4,999 and ₦5,000, a WAWU send ₦1,000) identical on main and the branch. Under `WALLET_PROVIDER=nuvion` both main and the branch exit at boot with MONEY-20's reserved-provider message (`v9/hub-*-nuvion.log`). |

**Rulings, checked one by one**
- D1: fixed (V1, V2 rows); the shape spec fails if any of the three loses `allOf` + `nullable` (builder's M25).
- D2: fixed; my reproduction (`"kobo": 100000, "kobo": 1` on Verify) stops the built server with `plans.config.json:
  tiers[0].price.kobo is written twice. Fix the file and restart.`
- N1: built as ruled: only a naira wallet, a `+234` number in any spelling or a Nigerian `country` gives NGN (39 pairs
  live, 5 through the real wawu-id, 15 in the spec). N2: every number `integer`. N4: `no-store` on both. N5: INT4_MAX
  accepted, INT4_MAX + 1 refused in every whole field; `action_points` must be exactly the brief's 12 ids, in the
  file's order (one missing or one added stops boot). N6: a non-text phone is no phone, never a 500. N3 and N7: the
  lead note is in `tasks/TIER-03.md`. Item 9: my mutants M-q and M-r (V17, V18) are killed.

**Defects**
- **D3 (defect, low; merge rule): the migration no longer sorts after every folder on backend main.** Main
  `6ce2ddf` (LEGAL-03, merged 11:39 UTC, after round 2) holds `20261016160000_legal_consultations`; the branch's
  `20261016120000_maker_plan` sorts before it, so the rule "a new migration folder's timestamp must sort AFTER every
  folder on backend origin/main" fails, and the round 2 report's "still sorts after every folder on backend main" is
  no longer true. Reproduce: `git -C <backend> ls-tree --name-only origin/main prisma/migrations/ | sort | tail -1`
  prints `prisma/migrations/20261016160000_legal_consultations`. No data risk is shown: on a database already
  migrated to `6ce2ddf`, `prisma migrate deploy` of the merged tree applies `20261016120000_maker_plan` and `migrate
  status` is up to date (`trial2-*.txt`). Fix: merge origin/main into the branch and rename the folder to a stamp after
  `20261016160000` and after every open `origin/wmt/*` folder (newest today `20261016160000`, on LEGAL-03 and
  SCHOOLS-04), checked right before pushing; update SHARED-CHANGES TIER-01 #2 and the merge-order line; copy the
  regenerated contract into mobile again (TIER-01 #3). A local trial merge with `6ce2ddf` (not pushed, aborted) is
  clean: `tsc` 0, `npm run contract:build` byte-identical to the auto-merged `contract/openapi.json`, which adds only
  the 2 paths and 11 schemas (and the `Ad*` order flip) to main's; the plans, export-map and purge-map specs 105/105.
  The same with `8359057`: clean, `tsc` 0, migrations in order, 127/127 with FIX-11's own spec.

**Findings (not defects)**
- F1 (N1, what the rule cannot see): WAWU ID's web register discards `dialCode` and stores the phone as typed, and the
  web form's country defaults to `Nigeria`; a US person who picks `+1`, types a local number and leaves the country
  alone is billed NGN (live: `(***) ***-0100` with `Nigeria`). The country match is exact (`Nigeria`, `NG`, `NGA`):
  `Nigerian` or `Federal Republic of Nigeria` with a local number is USD (the old apps send `Nigeria` or `NG`). A
  `+` followed by a local number (`+0803...`) is read as a foreign code (USD); `234` + `0` + ten digits has no code
  (country decides) while `+2340...` is NGN. Each is a typing slip that only matters before the first purchase, and
  `GET /plans` shows the currency before paying. For the owner's support process and a wawu-id task (keep the dial
  code), not this branch.
- F2 (N5, values boot accepts that later tasks cannot use): `tiers[].days` above about 99,970,000 makes the end date
  an invalid JavaScript date when TIER-03 adds it (INT4_MAX is allowed); `referral.levels[].x` has no upper bound
  (`1e300` boots) and REF-01 multiplies points by it. For TIER-03 and REF-01.
- F3: `WHOLE_NUMBER_DIRS` types every number declared under `src/plans` as `integer`; a later view there with a
  fraction (REF-01's level multiplier `1.25`) would be published as `integer`. REF-01 should keep such a field out of
  `src/plans` view types or narrow the rule.
- F4 (spec gaps, behaviour right): my survivors M-a, M-e, M-m, M-t (below).
- F5 (merge order, other branches): INBOX-03 `20261016100000`, POINTS-01 `...130000`, MONEY-17 `...140000` and NUV-01
  `...150000` also sort before main's newest now.

**Decisions** (each judged)
- Billing currency in its own table, "nullable" as no row: agree. The `country` claim, unused in round 1, is now the
  tie-break (lead ruling N1): agree. "A wallet still being opened does not count": agree.
- `priceMinor` with one top-level `currency`, never `*Kobo`: agree; with N2 the contract says `integer`.
- The brief's key names, `{ kobo, cents }`, `{ points, per }`, and the additions (names, pass order as rank, `badge`,
  `preselected_tier`, `tier_ending_days`): agree. Verify Plus's `verified` badge is still an assumption the round 2
  table does not state; it is visible in the file.
- Provisional cash-out minimum 1,000 points, bought points 365 days, ending window 7 days: agree; each is its own
  marker in the gates.
- `MakerTier` copies products and points when bought: agree; proved live and now pinned (M-q, M-r killed).
- Event passes do not end with the tier, the highest shown: agree.
- `GET /plans` without referral and cash-out figures: agree.
- The file read from the source tree at boot: agree (`deploy.yml` rsyncs `src/`, excludes only `dist`, `node_modules`,
  generated and secrets).
- `hasNairaWallet` reading `FintavaWallet` until NUV-09: agree.
- Round 2: `00234` and `234` with ten digits count as `+234`: agree (wawu-id's own `normalisePhone` reads them so).
  `action_points` refuses an added action as well as a missing one: agree (nothing could charge it). The INT4 bound
  on every whole number, prices included (largest price ₦21,474,836.47): agree. `WHOLE_NUMBER_DIRS` for the whole
  folder: agree, with F3.

**Mutants** (25 of mine, in a scratch copy of `3e1dc15` (`git archive`), the five plans specs run after each, the
file restored byte for byte, the copy identical to the branch after all; `mutants.txt`): 21 killed, 4 survived.
Killed: `00234` no longer Nigerian (M-b); a `00` prefix no longer foreign (M-c); a non-text phone turned into text
(M-d); the country not trimmed (M-f); the phone code before the naira wallet (M-g); the wallet before the fixed
currency (M-h); the phone rule before the fixed currency (M-y); the winner re-read outside the purchase transaction
(M-i); the fix recorded as `support` (M-j); a 23-hour day (M-k); a tier ending a second early (M-l); dollar people
given the naira bump points (M-n); bonus expiry served as the tier's days (M-o); Voice Intro read from the config, not
the purchase (M-p); products and points read from the config while it names the tier (M-q, M-r: V17 and V18); the
repeated-key scanner ignoring escapes (M-s); an unnamed tier shown as the first tier (M-u) or named by its id (M-v);
either route without the sign-in guard (M-w, M-x).
Survived (spec gaps; the behaviour is right live): M-a `234` with nine or ten digits of any kind read as Nigerian
(live: `234` + nine digits with no country is USD); M-e `Niger` read as Nigeria (live: USD); M-m `hasActiveTier`
ignoring the instant it is asked about (the spec only asks at the real now); M-t INT4_MAX itself refused (accepted
in `v2-badconfig.txt`).

**Mobile** (`2a5c93a`): `npm run check` at a load average of 12 to 15: typecheck and lint 0, jest 1375/1377, the 2
failures 20 s render timeouts in files this task does not touch (`OpenWalletScreen.test.tsx`,
`settingsScreens.test.tsx`), both files 128/128 alone (`v1-mobile-check.log`, `v1-mobile-rerun.log`). With this
report: `npm run check` exit 0 (typecheck, lint 0, jest 1377/1377 in 76 suites, gates 0 fail / 0 warn on 346 files,
249 tasks and 279 artboards; `v1-mobile-check-final.log`).

**NOT RUN**
- The plans routes under `WALLET_PROVIDER=nuvion`: main and the branch stop at boot under nuvion. Unblocked when NUV-01
  is merged to backend main and `WALLET_PROVIDER=nuvion` boots the built server to `GET /api/hub/health` 200.
- The purchase path (TIER-03 writes the tables and calls `fixAtFirstPurchase`). Unblocked when
  `grep -rn fixAtFirstPurchase src --include=*.ts | grep -v tests` names a purchase service on backend main.
- An emailed sign-up code in V9 (wawu-id has no mail provider here; the address was marked proven in its table, then
  the real sign-in issued the token). Unblocked when a wawu-id with `RESEND_API_KEY` set may be run by a brief.

## Lead merge note (8 Oct 2026)

Merged after two independent verifier rounds (round 2 report 10728c2) and backend PR #90 (merge 38a0dca): every price, tier, event pass, action and cap comes from src/plans/plans.config.json, which a bad edit stops at boot; GET /plans and GET /me/tier answer no-store; the billing currency is fixed at first purchase (a fixed one, else a naira wallet or a Nigerian phone, else USD). Round 2's only defect, D3 (the migration stamp sorted before LEGAL-03's 20261016160000 once that merged), was closed by the lead at merge: the folder is now 20261016170000_maker_plan, SQL unchanged, and a fresh migrate deploy applies it last. Protected suite 253/253 on the PR. Carried forward: F1 (WAWU ID's web sign-up drops the dial code and defaults the country to Nigeria, so a US person keeping that default is billed in naira) is a follow-up for the web sign-up; F2 (tiers[].days and the referral multiplier have no upper bound) is for TIER-03 and REF-01; F3 (the integer rule covers every number in src/plans, so REF-01's 1.25 multiplier needs its own field type) is for REF-01. Four mutants survive as spec gaps, behaviour right live.

## Owner sign-off
