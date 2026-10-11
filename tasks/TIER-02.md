---
id: TIER-02
title: Publishing needs a tier: the gate and the product count
owner: YOU
area: VERIFY
order: 208
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: [TIER-01, ME-17]
decisions: [R-43, R-7, R-8]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# TIER-02 · Publishing needs a tier: the gate and the product count

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `docs/PAYMENTS-PLAN.md` (the order of work, what waits for the Nuvion sandbox key, the owner questions and the defaults this task builds)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands (backend checks: `tsc`, eslint, the task's specs, the full suite, the protected suite 253/253, gates with the same 16 fail lines as main, `npm run contract:build`, then `npm run api -- --backend <worktree>` here).
- DECISIONS.md R-43 (the plan, and what it leaves open), R-44, R-5, R-10 and R-21
- `docs/designer/CLAUDE-DESIGN-ROUND-2.md` sections 1 to 7 (tiers, VF, PT, RF, the wallet on Nuvion, open points) and the owner's Developer Brief v2.0 of 5 Oct (the lead's scratchpad `nuvion/brief-docx.txt`, sections 2, 3, 6 and 8)
- `tasks/ME-17.md` (the tick rules this replaces)

## Goal

Anyone can sign up, build a profile and draft products free. Publishing, or uploading any file, needs an active
tier, and published products never exceed the tier's products plus any extra products bought (R-43).

**Replaces or rewires** (PLAN-PAY, 8 Oct 2026; nothing is deleted):

- ME-17 (done, ticks unlock uploads; free content): rewired. R-7's 5 and 25 uploads give way to the tier's 3, 6 or 10 plus extras (R-43 reverses the 5-item cap). Free pieces (R-8) still count as products.

## Scope

- Every route that publishes content, a product or a service, or accepts a file (the report lists each) answers `402 tier_required` with the tier offers from `GET /plans` when the person has no active tier, and `402 product_limit_reached` (used, allowed, and the two ways on: extra products or an upgrade) at the limit. A draft with no file saves free.
- Counting: published products across content, products and services; a draft counts only once published; unpublishing frees a place. `GET /me/tier` gains `productsUsed`.
- Ended tier, Default (agent), owner may override (R-43 leaves the expiry rule open; VF14 draws this): published products stay up; new publishing and uploads pause until renewed.
- People who paid for a verification tick before tiers: Default (agent), owner may override (question 3 in `docs/PAYMENTS-PLAN.md`): they keep publishing under the tick's rules until it ends.
- If a gated route is in the protected suite, this is a deliberate change to a protected route; the report lists it for the owner's relock label.
- Not in scope: event hosting by tier (E21 "Needs a tier"), which the events task cut from the round 2 boards carries.

## Capability checks

- [ ] A new person can save a draft with no file, and gets `tier_required` with the offers when they publish or upload a file.
- [ ] A person on Verify publishes 3 products and the 4th answers `product_limit_reached` with 3 of 3; with 5 extra products bought, the 4th to 8th publish.
- [ ] A draft does not count; unpublishing one frees a place.
- [ ] After a tier ends, published products stay visible to buyers, and a new publish or upload answers `tier_required`.
- [ ] A person whose paid tick has not ended keeps publishing as before; once it ends they get `tier_required`.
- [ ] The app's and the website's existing publish and upload calls get the same answers for the same person (V4, both clients).

## Builder report

Builder, 10 Oct 2026. wawu-backend `wmt/TIER-02` 2c2543d (backend main `8e57981` merged in); mobile `wmt/TIER-02`
(this branch) (this file, mobile main `b04cbe6`). depends_on TIER-01 and ME-17 are `done`. No screens: `artboards: []`, so
no pictures; the app change is the regenerated contract and types. This task moves no money and calls no provider.

**Headline for the lead: the protected suite cannot be 253/253 on the main lock, by design.** The suite's own setup
publishes a piece with a brand-new creator (`POST /content as creator2`), and R-43 says a new person with no tier is
refused. Run A (code `f48c3e4`, lock origin/main `8e57981`, fresh database; the later commits add specs, a type-only change and the migration folder's new name): setup step 402, 244 of 244 required tests
fail, 9 of 253 pass. Run B, the same code and the same lock, on a database where a trigger gives every profile a running
tier (a private test database; the suite, the lock and the code unchanged): **253 of 253, 244 of 244 required**. So the
gate is the only change. The entries that change by design are `POST /uploads/presign` (entry 23, content folders) and
`POST /content` (entry 24); `GET /creator/state` (entries 11 and 26) and `PATCH /creator/dm-settings` (25) keep their
shape and answer `slotsTotal` 0 instead of 5 for such a person. This is the deliberate change the task asks to list for
the owner's `relock-approved` label (SHARED-CHANGES TIER-02 #4). **Merge order matters:** until TIER-03 sells a tier,
merging this stops publishing for everyone with no unexpired verification tick, on the app and on the website, which has
no way to buy a tier while web work is paused (R-49; BACKEND_GAPS G-663).

**Built (backend).**
- `src/plans/publishing-allowance.service.ts`: `PublishingAllowanceService.of` / `ofMany`, the one place that says what a
  person may publish and has used. A running tier (`active` or `ending`) allows its products plus extra products; a
  verification tick that has not ended keeps the tick-era 25 (question 3 of `docs/PAYMENTS-PLAN.md`, the default); both
  allow the larger, not the sum; neither allows nothing. Reads `MakerTierService` (new `heldRowsOf`, same row as
  `tierOf`), `holdsTick` and `CreatorState.slotsUsed`.
- `src/plans/publishing-gate.service.ts` (`PublishingGate`), `tier-gate-error.ts` (`TierGateError`),
  `publishing-offers.interceptor.ts` (`@GatesPublishing()`), `dto/tier-gate-error.dto.ts`: the refusal is `402` in the
  contract's one error shape, `reason.code` `tier_required` (tier state `none` or `ended`) or `product_limit_reached`,
  with `productsUsed`, `productsAllowed` and the offers from `GET /plans` in the caller's billing currency only (every
  tier for `tier_required`; for the limit, the tiers that allow more and the extra products). The services throw the
  facts; the route's interceptor adds the offers because only the route has the token (the currency).
- Routes that ask the gate (listed and held to the code by `publishing-gate-coverage.spec.ts`): `POST /content`,
  `POST /content/:id/resubmit`, `PATCH /content/:id` (only when it carries `previewAsset` or `fullAsset`),
  `POST /uploads/presign` (only `content/preview` and `content/full`), `POST /product-drafts/:id/publish`.
- Drafts (new, free, no tier asked): `ProductDraft` table (migration `20261021120000_product_drafts`, additive, rollback
  in its header) and `POST/GET /product-drafts`, `GET/PATCH/DELETE /product-drafts/:id`,
  `POST /product-drafts/:id/publish` (`src/content-piece/product-draft.*`). A draft is a title and optional details with
  no file; it holds no place and is shown to nobody else. `missing` lists what publishing still needs. Publishing asks
  the gate first (so Publish opens the offers), then finishes the check (`400 draft_incomplete`), then creates the piece
  and deletes the draft in one transaction (two taps publish once).
- Counting: `CreatorState.slotsUsed`, the counter every publish claims against with a conditional update (so two
  publishes at once cannot pass the limit); a draft never touches it; removal, rejection and take-down give the place
  back (unchanged). `GET /me/tier` gains `productsUsed`. `GET /creator/state` `slotsTotal`, `GET /uploads/allowance`
  and the admin creator, KYC and content screens now read the same allowance (they showed R-7's 5 or 25).
- Docs: `docs/contract/PLANS.md` section 6, `CONVENTIONS.md` section 18. Account purge (OWNED) and data export decide
  `ProductDraft`.

**Capability checks** (all in `src/plans/tests/publishing-gate.contract.spec.ts`: HTTP, the real modules, a real
database, real RS256 tokens checked against the stand-in WAWU ID's JWKS, tiers seeded as `MakerTier` rows because the
purchase is TIER-03's; 32 tests; every figure compared is read from the config)
1. *A new person saves a draft with no file; publishing or uploading a file gets `tier_required` with the offers.*
   Draft 201 with no tier asked; `POST /content` and presign of `content/preview` and `content/full` 402 with `reason.tiers`
   equal to `GET /plans` (ids, order, prices, `preselected`); nothing signed or recorded; in dollars for a phone abroad,
   with no naira in the answer; an avatar, cover, KYC document, professional document and event banner still presign
   (without them nobody could open a wallet to buy a tier).
2. *Verify publishes 3; the 4th is `product_limit_reached` 3 of 3; with 5 extra products the 4th to 8th publish.* Done
   with the config's figures, the 9th refused; the answer carries the extra-products offer and the tiers that allow
   more; the top tier gets an empty list; two publishes at once at 2 of 3: exactly one wins; the same wall for a new
   file (presign) but not for an avatar.
3. *A draft does not count; unpublishing frees a place.* Three drafts leave `productsUsed` 0; a draft published takes a
   place and is gone (a second tap 404, one piece); at the limit a draft gets `product_limit_reached` and stays; removal
   (`DELETE /content/:id`) frees a place; a turned-down piece takes one again when sent.
4. *After a tier ends, published products stay visible and new publishing and files answer `tier_required`.* A buyer
   still reads the live piece (signed in and public); publish, presign and a file edit answer `tier_required`, state
   `ended`, "Your tier has ended. Renew it ... Everything you published stays up."; nothing is unpublished;
   renewing allows the rest of the products; `ending` still publishes.
5. *A paid tick that has not ended keeps publishing; once it ends, `tier_required`.* 6 publishes, `slotsTotal` 25,
   `GET /uploads/allowance` 25; at 25 `product_limit_reached` with no offer that adds a product; after the tick ends
   `tier_required`, the pieces stay and count, `slotsTotal` 0; a tier and a tick allow the larger.
6. *The app's and the website's calls get the same answers.* There is one route for each, so one gate: the website's
   presign and publish bodies (read from `wawuafrica` `src/lib/api/uploads.ts` and `creator-content.ts`) and the app's
   get the same 402, the same offers, and the same 200/201 once a tier is held.

**Checks.**
- `npx tsc --noEmit` 0 (backend and mobile). eslint on the 51 changed `.ts` files: every problem on a line I added or
  changed is fixed; what remains is on lines of those files that were already failing on main (the admin creator, KYC
  and content specs, `creator-state.contract.spec.ts`, `storage-quota.spec.ts`: prettier and `require-await`, same
  lines as main). New and rewritten files are prettier-clean.
- Specs: the task's own `publishing-gate.contract` 32, `publishing-allowance` 15, `publishing-gate-coverage` 4,
  `publishing-contract-shape` 9; the rewired `upload-allowance` (content-piece) 18, `storage-quota` 25, `creator-state-gate` 8,
  `upload-allowance.contract` (storage) 12;
  and every module touched (plans, content-piece, storage, creator-state, admin creators, KYC review, content review,
  user-profile, data-export-request, account-purge, me, chat, comment, search-response, push): see the full run below.
- Gates: 16 fail, the same 16 FAIL lines as main `8e57981` (one line number moved, `content-piece.service.ts:46` to
  `:41`, the same pre-existing fork finding); warnings 91 to 92, the one new being the deliberate
  `PROVISIONAL(PRODUCT-DRAFTS-MAX, owner=YOU, why=...)`; 76 accepted; `check_baseline` ok.
- `npm run contract:build` twice, byte-identical (sha256 `f25a7ac6...`): against main +3 paths (`/product-drafts`,
  `/{id}`, `/{id}/publish`), +6 schemas, 0 removed, 0 served path changed; `MyTierView` gains `productsUsed`; the four
  gated operations gain a typed `402`; the only other change is the order of values in five `Ad*` schemas, equal as sets
  (G-54, as in TIER-01).
- Mutants (16, each applied, the gate specs run, the file restored from git): extras ignored; an ended tier still
  publishes; the tick ignored; tier and tick added; presign ungated; the claim unconditional; resubmit ungated; an
  edit with a file ungated; the draft not removed on publish; offers offering every tier; `productsUsed` fixed at 0; a
  draft counting as a product; another person's draft readable; limit refused before tier; the offers not added;
  extra products offered to a tick holder. 16 of 16 killed. One survived the first time (the draft not removed: the
  spec never tapped twice at once) and the concurrent-publish spec was added.
- Live seam (V9): the built Hub on :6182, the stand-in WAWU ID on :6181, a person registered and signed in through its
  real `/auth/register` and `/auth/login`, then `PATCH /users/me` to a creator: `GET /me/tier` `none`; draft 201;
  publish and content presign 402 `tier_required` with the offers, an avatar presign 200; a Verify tier row written the
  way TIER-03 will write it: 3 publishes then 402 3 of 3, `GET /creator/state` `slotsUsed 3, slotsTotal 3`; 5 extras:
  the 4th to 8th publish, the 9th 402; the tier ends: `GET /me/tier` `ended`, the draft publish 402 "Your tier has
  ended...", `GET /content/mine` still 8 pieces. Transcript in the lead's scratchpad `tier02/live-transcript.txt`.
- Full backend suite, five serial `--shard=i/5` passes in my own migrated and seeded `bt02_full_test` (a first single
  in-band run was killed by the out-of-memory killer at the memory cgroup every session shares): 250 files, 6,793 tests
  passed, 4 skipped, 349 failed. 244 are the protected suite (above, by design: the suite in `src/` is the branch's
  copy of the lock, so the deploy step's `npx jest` fails on it until the relock). The other 105 are in 13 files that
  fail the same way on backend main `8e57981` in the same environment (the same 13 files with the same counts, except
  the three timing-sensitive ones, `fintava-stall`, `receipt-units` and `ledger`, whose counts move with load): the
  specs that hard-code the stand-in at :4001 (`account`, `data-export`, `tgif-preference`, `privacy-settings`,
  `kyc-submission`, `credits-state`), two that name a database `wawu_hub_test` (`marketplace-save`, `shop`),
  `receipt-units` (a Unicode digit table against this Node), and two suites jest reports as `focused`
  (`legal-intake`, `live-hardening`). `ledger.contract` failed once in its shard and passes alone. No failing test
  touches a file this task changed. Control: backend main, `run.sh --fresh origin/main`, same environment: 253 of 253.
- Mobile: `contract/openapi.json` copied from the backend branch (`SOURCE_COMMIT` `wmt/TIER-02@2c2543d`) and
  `python3 scripts/api/sync_contract.py` (without `--backend`, which copies backend main): `ProductDraftView`,
  `TierGateErrorEnvelope`, `MyTierView.productsUsed` are in `schema.generated.ts`. `npm run check` (typecheck, lint,
  tests, gates, tasks, run as the same steps with two jest workers) exit 0: typecheck 0, lint 0 errors (7 warnings in files this
  task does not touch), jest 2064 of 2064 in 120 suites, gates 0 fail on 473 files, 273 tasks and 279 artboards.

**Decisions** (each Default (agent), owner may override)
- What lets a person publish: a running tier, or a verification tick that has not ended; the larger of the two when both.
  The code cannot tell a bought tick from one an admin granted (or a perpetual one), so any tick `holdsTick` counts is
  kept, as "until it ends" says. A tick keeps the tick-era 25 and not the tier's 3, 6 or 10.
- What is a "file for a product": `content/preview` and `content/full`, the only folders that hold a product and the
  ones R-7's storage already counted. Not gated, because they are not products or must work first: avatars, covers,
  KYC, professional, legal and service-application documents (a wallet must open before a first purchase), community
  and chat pictures, event banner and speaker, and featured works (`profile/work`, "build a profile free"). Events
  are TIER-02's "not in scope". No creator-published service or shop-product route exists to gate (G-664).
- Presign at the limit refuses a content file (the task says every route that accepts a file answers the limit), so a
  person at 3 of 3 cannot swap the file of a piece that is waiting for review; they remove it and add it again.
- Storage for a person on a running tier is R-7's with-a-tick figure, 10 GB (G-660); the 413 text no longer tells
  anyone to buy a tick, which a tier replaces.
- A tier or tick that ends only stops the next publish or file: nothing is unpublished, hidden or deleted, the
  pieces still count in `productsUsed`, and renewing puts the places back. `GET /me/tier` keeps showing the ended
  tier's figures (TIER-01), while the gate's `productsAllowed` in the 402 is 0.
- Drafts: creator accounts only (like publishing); a title is required and anything else may come later; at most 20 a
  person (`PROVISIONAL(PRODUCT-DRAFTS-MAX)`, G-662); unpublish is removal (G-661), there is no route that turns a
  live piece back into a draft because a draft holds no file.
- Order of answers for a person who cannot publish: the body check of the DTO (400) first, then the gate (402), then
  the service's own rules (price against access type); the old specs that sent a bad price as a no-tier creator now
  hold a tier in their setup.
- `403 upload_limit_reached` and `413 storage_limit_reached` text: the first is replaced by `product_limit_reached`
  (402); the second stays, without the tick advice. Neither web nor app reads either code (grepped).

**Existing specs rewired by this task** (the rule they pinned, R-7's 5 and 25, is the one TIER-02 replaces; none was
weakened to pass): `content-piece/tests/upload-allowance.spec.ts` (rewritten for the gate, the same cases plus tier,
extras, ended, tick, both), `storage/tests/storage-quota.spec.ts` and `upload-allowance.contract.spec.ts` (storage
arithmetic now for a tier or tick holder; the no-tier cases assert `tier_required`; the fixture of an over-limit tier
holder is six files because a row holds at most 2 GB), `creator-state/tests/creator-state-gate.spec.ts` and
`creator-state.contract.spec.ts`, `admin-creators`, `admin-kyc-review` and `admin-content-review` contract specs
(`slotsTotal` 0 for a creator with neither), `content-piece.contract` and `my-content.contract` (the seeded creator
holds a tier in the suite's setup; the cap case expects `product_limit_reached`), `plans.contract.spec.ts`
(`productsUsed: 0` in the two full-shape checks), and constructor arguments in `deliverable-key`, `storage.presign` and
`take-down`. New: `publishing-fakes.ts`, `publishing-allowance.spec.ts`, `publishing-gate.contract.spec.ts`,
`publishing-gate-coverage.spec.ts`, `publishing-contract-shape.spec.ts`.

**Gaps and shared changes filed.** BACKEND_GAPS G-660 (storage per tier), G-661 (unpublish), G-662 (drafts cap), G-663
(the website cannot act on the gate; merge order), G-664 (what else may need the gate). SHARED-CHANGES TIER-02 #1
(schema and migration, made on the branch), #2 (remove the four unused exports of `src/common/creator-allowance.ts`; no
fenced file was edited), #3 (mobile contract and types), #4 (the protected routes for the relock label).

**NOT RUN**
- The private network namespace (`unshare -n`): Postgres here is reachable only by TCP on the host or by a socket that
  needs the `postgres` operating-system user, so a namespace could not reach it. I ran my own stand-in WAWU ID on :6181,
  the Hub on :6182, and the suites with `WAWU_ID_BASE_URL` / `WAWU_ID_JWKS_URL` pointing at :6181; the protected suite
  seals its own network. Unblocked when a namespace can reach Postgres (a socat or a role for `root`).
- `account.contract.spec.ts` and `data-export.contract.spec.ts`: they hard-code the stand-in at :4001 (`ECONNREFUSED`),
  fail the same way on backend main (20 of 22 tests fail on main in this environment, the same two suites), and touch nothing this task changed beyond the data-export
  section I added, which the map specs cover. Unblocked when a stand-in is on :4001 in the run.
- The website: no change was made (R-49); its create flow shows "All 5 slots are in use" from `slotsTotal` before it
  sends (G-663). Unblocked when web work resumes (WEBPAY-04).
- Event hosting by tier (E21): not in scope; the events task carries it.
- Screens VF2, VF5, VF12, VF13, VF14: not cut from the round 2 boards; they read these routes.

## Verifier report

Verifier, 10 Oct 2026 (independent; wrote none of this). Backend `wmt/TIER-02` `2c2543d` in detached worktree
`/home/user/wt/vb-TIER-02`; mobile `wmt/TIER-02` `d918761` in `/home/user/wt/vm-TIER-02`. Trial merges: backend main
`e1d436f` (what main was when I started, `/home/user/wt/vbm-TIER-02`) and backend main `40b1970` (MONEY-18, what main is
now, `/home/user/wt/vbm2-TIER-02`); main alone in `/home/user/wt/vbmain-TIER-02`. Evidence (logs, JSON, scripts, the live
transcript): the lead's scratchpad `vtier02/`. No Fintava, Nuvion, Flutterwave, wawuafrica.com or AI host was called. The
sign-in was the Hub repo's stand-in WAWU ID (`mock-wawu-id`) on :6181, through its real `POST /auth/register` and
`POST /auth/login` (no injected token), not the real wawu-id service. Two Hubs (the build of the branch merged with `e1d436f`) on :6182 and :6183
shared one database.

**Verdict: back to `building`. One blocker (D1), three smaller defects (D2 to D4), and the test gaps T1 to T5 (eight surviving mutants, seven of my 31 and one of the 5 route mutants, on behaviours the task states, which the verifier rule counts as defects).**
What is built is right where the report says it is: the allowance arithmetic, the gate on every listed route, the 402
body and offers, drafts, the tick grandfather, the ended-tier rule, concurrent publishes at the limit on two Hub
processes, the protected suite under the relock. What is wrong is next to it: the counter the whole gate stands on
(`CreatorState.slotsUsed`) can be driven down by a double `DELETE`, so a person on a 3-product tier can hold more than 3
live products and keep going (D1).

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed (eslint NOT RUN) | `tsc --noEmit` 0 on the branch merged with `e1d436f` and with `40b1970` (`tsc-merged.log`, `tsc-merged2.log`). Gates on the merged trees: 16 fail, 76 accepted, warnings 95 (`e1d436f` merge) and 96 (`40b1970` merge) against 95 on main `40b1970`; the 16 FAIL lines are the same as main, one line number moved (`content-piece.service.ts:46` to `:41`, the same `FlutterwaveConfigResponse` fork finding); the one new warning is `PROVISIONAL(PRODUCT-DRAFTS-MAX, owner=YOU, why=...)`; files scanned 1,124 / 1,133 against 1,119 (`gates-*.log`, `fails-*.txt`). `check_baseline` ok (108 entries) on both. Specs on a fresh migrated and seeded database: `e1d436f` merge, 40 suites, 1,159 tests: plans, content-piece, storage, creator-state and the admin directories; 1,133 passed and 26 failed, all 26 in `admin-payments.contract.spec.ts` (`fetch failed / other side closed` on its first request to the stand-in under load); that file alone passes 26 of 26 on the merged tree and on main (`payments-merged-alone.log`, `payments-main.log`). `40b1970` merge: 33 suites, 668 tests, 668 passed, EXIT 0 (plans, content-piece, storage, creator-state, admin creators, KYC review and content review, chat, legal-delivery-uploaders, profile-works, account-purge map, data-export map; `specs-merged2.json`). eslint (no `--fix`) on the changed files was killed by the memory limit: NOT RUN. |
| V2 Contract | passed | `contract:build` on the `e1d436f` merge, twice: byte-identical (sha256 `f82a...916955`) and equal to the committed auto-merged file (`contract1.log`, `contract2.log`). On the `40b1970` merge the auto-merged `contract/openapi.json` equals a fresh build byte for byte (sha256 `9b94...6550`). Against main: +3 paths (`/product-drafts`, `/{id}`, `/{id}/publish`), +6 schemas (`CreateProductDraftDto`, `ProductDraftView`, `PublishProductDraftDto`, `TierGateErrorEnvelope`, `TierGateReasonDto`, `UpdateProductDraftDto`), 0 removed; the four gated operations gain a typed 402. The mobile `contract/openapi.json` is the backend branch's file (sha256 `f25a7ac6...`, equal as JSON) and `SOURCE_COMMIT` names `wmt/TIER-02@2c2543d`. Notes: the offers (`currency`, `tiers`, `extraProducts`) are optional in the 402 schema (always present on the wire); `ProductDraftView.price` is `number`, not `integer`; the draft routes' `400 draft_incomplete`, `409 draft_limit_reached` and `404` are documented in CONVENTIONS only, not as responses in the contract. |
| V3 Regression | passed under the relock; failed on the main lock as designed | Run A (`prot-a.log`): code `2c2543d`, lock origin/main `40b1970`, fresh database `vt02_prota_test`: 253 tests, 9 passed, 244 failed, "0 of 244 required tests passed". Every failure is the one `beforeAll` error `setup step POST /content as creator2 failed: 402 ... tier_required`; the suite stops in its setup, so run A shows the designed 402 and cannot show any other effect. Run B2 (`prot-b.log`), the same code and lock, a database where only a profile that becomes a creator account gets a REAL Verify tier row (3 products, a trigger on `UserProfile`): 253 of 253, "all 244 required tests passed", EXIT 0, `MakerTier` rows left after the run 0. That is stricter than the builder's run B (every profile, 25 products): the five identities and every route other than the two publishing ones answer the lock. |
| V4 Field trace | failed (D1, D2), one note | `slotsUsed` is the one counter. Writers: `POST /content` +1, `POST /content/:id/resubmit` +1, `DELETE /content/:id` -1 unless rejected, admin reject -1, admin take-down -1. Readers: the gate (create, resubmit, presign, draft publish), `GET /me/tier` `productsUsed`, `GET /creator/state`, `GET /uploads/allowance`, the admin creator, KYC and content-review views. The allowance (`slotsTotal`, `productsAllowed`, `uploads.allowed`) has one reader, `PublishingAllowanceService`, and live all four agreed for a tick holder (25), a tier plus extras (8) and a tier plus a tick (30). Writer `DELETE /content/:id` is not safe under concurrency (D1). Note N1 below: `GET /me/tier` `productsAllowed` is tier-only, `productsUsed` is the gate's. Both clients: the website calls the same `POST /uploads/presign` and `POST /content` (`wawuafrica` `src/lib/api/uploads.ts:123`, `creator-content.ts:207`) and shows the server's sentence, so it gets the same answers as the app by construction (G-663 stands). |
| V9 Live seam | passed (stand-in WAWU ID); NOT RUN (real wawu-id) | `live-transcript.txt`: 63 checks, 58 passed, 5 failed (D1 twice, D2, D3, and one check of mine that was wrong, N2). People were registered and signed in through the stand-in's real endpoints; a new creator saw `GET /me/tier` `none` with `productsUsed` 0 and a 201 draft; `POST /content` and `POST /uploads/presign` for `content/preview` and `content/full` answered 402 `tier_required` with the three tiers in kobo (NGN) and, for a phone abroad, in cents (USD only, no `NGN` or `kobo` anywhere in the body); the eleven other folders (avatars, covers, KYC, service-application, professional, legal, community image and message, event speaker and banner, featured work) all presigned 200 with no tier. |

**The brief's items**
1. **The allowance: CONFIRMED.** Running tier (`active` or `ending`) = tier products + extras; unexpired tick = 25; both =
   the larger (tick 25 with Founding 10 + 5 = 25; with 10 + 20 = 30, not 55); neither = 0; an ended tier with an unexpired
   tick = 25; an ended tier or an expired tick stops only the next publish or file (25 pieces still listed and counted
   after the tick ended; 2 pieces kept after a tier ended at the second; renewed, the place that was left works; a tier
   2.5 s from its end published, 0.7 s after it answered `tier_required` with `tierState: ended`). **Concurrent publishes:**
   16 at once at 0 of 3 over two Hub processes: exactly 3 pieces and `slotsUsed` 3 in every one of four runs; two at once
   at 2 of 3: one 201, one 402; a draft publish against `POST /content` at 2 of 3: one place, and the draft left if and only
   if it lost; four taps on Publish over two Hubs: one piece; resubmit against resubmit, six taps on Send again, and
   resubmit against publish: one place each (L7). The allowance holds on the claim; what breaks it is D1.
2. **Every gated route: CONFIRMED.** `POST /content`, `POST /content/:id/resubmit`, `PATCH /content/:id` with a file,
   `POST /uploads/presign` for the two content folders, `POST /product-drafts/:id/publish` all answer 402 `tier_required`
   or `product_limit_reached`, in the contract's one error shape, with `tierState`, `productsUsed`, `productsAllowed`
   and the offers in the caller's billing currency, in plain words, no em-dash. The offers equal `GET /plans` (spec) and
   at the limit carry the tiers that allow more and the extra products (`{"count":5,"priceMinor":150000}`), and none of
   either for a tick holder at 25. **Coverage spec, five route mutants** (`mutants-routes.log`): R1 `resubmit` loses the
   decorator KILLED; R2 a new `fullAsset` body on `PUT /content/:id/media` KILLED; R3 the decorator on an unlisted route
   KILLED; R5 a new `folder` body KILLED; **R4 a new file-carrying body under another property name (`assetUrl`) SURVIVED**
   (T5): the spec looks only at the property names `previewAsset`, `fullAsset` and `folder`. **The builder's list: RULED
   right**, with three points for the owner (U1 to U3 below). The routes that must stay open do (eleven folders, drafts,
   profile, KYC, legal, community, events).
3. **Drafts: CONFIRMED** with D3. Free with no tier, ended tier or tick; never counted (`slotsUsed` unchanged by 3 drafts;
   a draft publish takes one place and deletes the draft once); creator accounts only (a plain user is 403); another
   person's draft is 404 on read, change, delete and publish, and the list shows only mine; a blank title and a body that
   carries a file are 400; publish order gate, then completeness, then one transaction (no tier and an incomplete draft:
   402 `tier_required`; with a tier: 400 `draft_incomplete` with `missing`, draft kept; a paid draft priced 0 or with
   preview equal to full: 400, draft kept, no place taken; a free draft with a stale price publishes at 0). The cap holds
   one person at a time (the 21st is 409) but not under concurrency (D3).
4. **The protected suite and the relock recipe, RULED.** Run A and B2 above. **The recipe in SHARED-CHANGES TIER-02 #4 is
   right in substance and incomplete in five places; use this in its place:**
   (a) *Where:* the grant goes in `test/protected-routes/harness.ts` as a helper (like `createAdmins`) and is called from
   `beforeAll` in `src/protected-routes/protected-routes.regression.spec.ts`, **after `takeSnapshot` and before the setup
   steps**, so the snapshot restore removes it (B2 left 0 rows). (b) *Who:* the identities that publish, `creator` and
   `creator2` (B2 passed with only those two); granting all five is harmless (the builder's run B). (c) *The row:*
   `MakerTier(wawuUserId, tierId, activeFrom <= now, activeUntil > now, productsIncluded >= 1, pointsIncluded)`; the suite
   publishes once per creator identity, so a real Verify row of 3 passes, 25 is not needed. (d) *The lock is not
   re-recorded:* its `sha256` covers only `setup` and `routes` (`lockHash` in `registry.ts`), and a harness change leaves both
   alone; but `lock-diff.py` counts any change under `test/protected-routes` or `src/protected-routes` as a relock, so the
   PR needs the owner's `relock-approved` label applied AFTER its last push (`ci-check.sh`). (e) *Order:* `deploy.yml`
   runs `npx jest --runInBand` over everything in `src/`, which includes the suite's copy of the lock, so merging the gate
   without the grant fails the deploy test job on every push to main. Put the grant in the same PR as the gate, or land
   it first (granting a tier before the gate exists changes no answer). The entry numbers in #4 (11, 23, 24, 25, 26) are
   0-based positions in the registry; the file's own `id`s are the method and path. One more visible change #4 does not
   list: the admin dashboard's creator, KYC and content-review screens now show `slotsTotal` 0 for a creator with neither
   a tier nor a tick (their specs were changed to say so; shape `number`, lock unchanged).
5. **Trial merges.** Backend main `e1d436f` into the branch: **no conflicts** (`contract/openapi.json` auto-merged and
   regenerates byte-identical). Backend main `40b1970` (MONEY-18) into the branch: **one conflict,
   `docs/contract/CONVENTIONS.md`**, two additions at the end of the file that are both headed `## 18.`
   (MONEY-18 "Hold, release and refund" and TIER-02 "Publishing needs a tier"). Resolution that I built and checked: keep
   both, renumber TIER-02's to `## 19.` (nothing in `src/` or `docs/` cites the number 18 for it); then `tsc` 0,
   gates and baseline as above, auto-merged contract equals a fresh build, 668 of 668 specs. `prisma/schema.prisma` and
   `src/account-purge/account-data-map.ts` auto-merge; the migration folder (then `20261020170000_product_drafts`) sorts after
   main's newest, `20261020160000_wallet_holds`, and applies on top of it. The merge commit is for the lead; I changed no product file.

**Defects**
- **D1 (blocker, high): two or more concurrent `DELETE /content/:id` of one piece each give the place back, so a person
  can hold more live products than their tier or tick allows, and repeat.** `ContentPieceService.delete`
  (`content-piece.service.ts` near line 480) reads the piece, then in a transaction sets `status: 'removed'` with an
  unconditional `update` and decrements `CreatorState.slotsUsed` whenever the status it READ was not `rejected`. Nothing
  makes the flip conditional, so every concurrent request sees `pending` or `live`, every one flips, every one
  decrements. `slotsUsed` is the counter the gate claims against, so TIER-02's own invariant ("published products never
  exceed the tier's products plus extras") breaks. The same stale read lets a creator `DELETE` race an admin reject: the
  reject hands the place back, the delete (read `pending` before) hands it back again. The admin paths are safe: they
  flip with `updateMany ... status not removed` and decrement only when it changed a row. **Reproduction**
  (`live.js L3`, two Hubs): a person on Verify (3 products) with 3 published pieces; 6 concurrent `DELETE`s of one piece
  across :6182 and :6183 answered 204 six times and moved `slotsUsed` from 2 to 0; the next 6 `POST /content` gave 3 x 201
  and 3 x 402, leaving **4 live pieces on a 3-product tier**; each repeat of the trick adds more. Fix: make the flip
  conditional (`updateMany where { id, status: { not: 'removed' } }`), decrement only when it changed a row and the status
  it changed from was not `rejected`, read inside the transaction; a spec that fires N concurrent deletes and one
  delete against one reject and asserts `slotsUsed` moved once.
- **D2 (medium): a person's first publishes, sent together, can be refused with `409 "That record already exists."`
  although they have room.** The person has no `CreatorState` row until the first publish; `create` and `resubmit` both
  `upsert` it inside the transaction, and two requests that miss the row race to insert it. Reproduction (`race2.js`, two
  Hubs): a Verify Plus person (6 products) sends two `POST /content` at once: 9 of 12 runs ended with one 201 and one 409.
  The allowance still holds (3 pieces in the 16-at-once run), but the refused request was a valid publish, with an error
  that is not in plain words, and a first publish right after buying a tier is exactly when a double tap happens. The
  code is the main branch's; TIER-02 makes it the first thing every new tier holder meets. Fix: create the row with
  `INSERT ... ON CONFLICT DO NOTHING` (or `createMany({ skipDuplicates: true })`) before the claim, or retry once on
  `P2002`.
- **D3 (low): the draft cap of 20 is exceeded under concurrency.** `ProductDraftService.create` counts, then inserts. 30
  `POST /product-drafts` over two Hubs left 22 rows; `GET /product-drafts` shows the newest 20, so two are hidden. A
  provisional cap on a free table: fix with a per-person advisory lock or a conditional insert.
- **D4 (low, copy): the `product_limit_reached` sentence promises ways on that the body does not offer.** "You have used 25
  of 25 products. Add more products or move up a tier to publish another." is sent to a tick holder at the tick-era cap,
  with `tiers: []` and `extraProducts: null` (nothing a tier or extras could add). The task asks for "the two ways on";
  for a tick holder there are none, so the sentence should say that.
**Test gaps: the mutants that survived** (defects under the verifier rule, severity low, none blocks on its own; the code is right in each, checked live; 31 of mine, `mutants.log`; 23 killed, 8 survived, 1 of them equivalent)
- T1 *V05 professional tick ignored* SURVIVED: no TIER-02 spec holds a professional-only tick, which "either tick
  counts" (ME-17) and "paid for a tick" cover. Kill with: a professional-tick-only creator publishes and has
  `slotsTotal` 25.
- T2 *V08 resubmit claim one too generous* SURVIVED: no spec races two resubmits, or a resubmit against a publish. Kill
  with the L7 case (two resubmits at 2 of 3, one place).
- T3 *V10 `PATCH` with a file also asks for room* SURVIVED: the decision "an edit with a file needs a way to publish, not
  a free place" is not tested at the limit. Kill with: at 3 of 3, `PATCH` of a waiting piece with a new `fullAsset` is 200.
- T4 *V11 draft publish: completeness before the gate* SURVIVED: the brief's "gate, then completeness" is held only for a
  complete draft. Kill with: no tier plus an incomplete draft answers 402 `tier_required`, not 400.
- T5 *V13 draft cap counts everyone* SURVIVED, *V27 a free draft keeps its stale price* SURVIVED, *V26 a lost claim always
  says limit* SURVIVED, *R4 another property name* SURVIVED. Kill with: a second person's 20 drafts do not stop the first
  person's first; a free draft with `price: 900` publishes at 0; a claim lost because the tier ended answers
  `tier_required`; and make the coverage spec read every `Is...` property of a body DTO whose name ends `Asset`, `Url`
  or `Key`, not three names. *V23 `heldRowsOf` ignores the injected clock* SURVIVED and is equivalent (production
  passes the real clock).

**Mutants** (31 + 5 route mutants of my own, each applied to `vb-TIER-02`, eight gate and allowance specs run, the file
restored from git; the tree is clean): killed: both held = the smaller (V01), an ending tier not running (V02), the tick
keeps 5 (V03), an expired tick counts (V04), the gate `>` for `>=` (V06), the claim on publish one too generous (V07), a
fullAsset edit ungated (V09), the draft cap `>` (V12), delete of a draft not keyed on the owner (V14), the draft list for
everyone (V15), presign gating only `content/full` (V16), over-gating `legal/document` (V17), `community/image` (V18),
`service-application/document` and `profile/work` (V19), offers priced with no claims (V20), no tiers in `tier_required`
(V21), the claim read-then-write (V22), `/creator/state` showing 5 for nothing (V24), tick holders on 1 GB (V25), a doubled
publish both succeeding (V28), a tier plus a tick summed (V29), an em-dash in the sentence (V30), delete no longer
freeing the place (V31). Survivors: V05, V08, V10, V11, V13, V23 (equivalent), V26, V27, R4.

**Capability checks, as written**
1. A new person saves a draft with no file and gets `tier_required` with the offers on publish and on a file: passed (L1).
2. Verify: 3 publish, the 4th is `product_limit_reached` 3 of 3; with 5 extras the 4th to 8th publish and the 9th is
   refused: passed (L3, L5).
3. A draft does not count; unpublishing frees a place: passed one request at a time, **failed under concurrency (D1)**.
4. After a tier ends published products stay (listed, counted, visible to buyers by spec) and a new publish or file is
   `tier_required`: passed (L5).
5. An unexpired paid tick keeps publishing as before (25); once it ends `tier_required`: passed (L4); see U1 for a
   tick that never ends.
6. The app's and the website's calls get the same answers: passed by construction (same two routes, one gate).

**Findings for the owner (`unclear`)**
- U1: any tick `holdsTick` accepts keeps 25 products, including a PERPETUAL tick (`verifiedUntil` NULL), which is what
  accounts grandfathered off the old ladder and admin grants carry (`verification-state.ts`). PAYMENTS-PLAN question 3
  says people who PAID keep publishing until the tick ends; a perpetual tick never ends, so those accounts publish 25
  products for ever without a tier. The code cannot tell a bought tick from a granted one (the builder says so). A query
  of the production `UserProfile` ticks before launch shows how many accounts this is.
- U2: featured works (`profile/work`) accept photos and `video/mp4` up to 100 MB on any signed-in account with no tier, are
  not counted in content storage, and are shown publicly on the profile. R-43 says "uploading any file"; the builder
  and the brief read "build a profile free". Decide whether a showreel video needs a tier.
- U3: `PUT /content/:id/media` accepts links to files this person already uploaded (the earlier gated presign), on a
  waiting or live piece, with no tier; documented in PLANS.md section 6. With D1 and U1 closed this only re-orders files
  already paid for.
- U4: `counter drift`: `productsUsed` is a counter, not a count of pieces. Pieces removed or turned down before the
  decrements existed (admin reject and creator delete were added later) may have left `slotsUsed` too high, so a creator
  could be told "3 of 3" with fewer live pieces. Run before launch (read-only):
  `SELECT cs."wawuUserId", cs."slotsUsed", count(cp.id) FILTER (WHERE cp.status NOT IN ('rejected','removed')) FROM "CreatorState" cs LEFT JOIN "ContentPiece" cp ON cp."creatorWawuId"=cs."wawuUserId" GROUP BY 1,2 HAVING cs."slotsUsed" <> count(cp.id) FILTER (WHERE cp.status NOT IN ('rejected','removed'));`
  (it returns no rows on my test database; I did not run it on production).
- U5: at the limit the offers list every tier with more products than the tier held, extras ignored, so a person on Verify
  with 5 extras (8 products) is offered Plus (6). That is right only if extras carry over an upgrade (TIER-03/TIER-04
  must keep them); the report does not say so.

**Notes (not defects)**
- N1: `GET /me/tier` `productsAllowed` is the tier's (plus extras) and `productsUsed` is the gate's count, so for a tick
  holder with no tier the meter reads "6 of 0" while `GET /creator/state` says 25. The two screens that will draw the
  meter (VF12, VF14) should read `slotsTotal` or the task should make `productsAllowed` the gate's figure.
- N2: my check "no tier offered that holds fewer than 8" failed because of U5, not a defect.
- N3: presign at the limit refuses a content file, so a person at 3 of 3 cannot swap the file of a piece waiting for
  review (`PATCH` itself would allow it). Recorded by the builder; accepted as the task's wording.
- N4: the website shows the server's sentence "Pick one to carry on" with no way to pick (G-663).

**NOT RUN**
- A private network namespace with a stand-in on :4001 and the full backend suite: ports are 6181 to 6184, and about 100
  spec files hard-code :4001. I ran every spec that touches the files this task changed or that names a presign or
  `POST /content` (plans, content-piece, storage, creator-state, admin creators, KYC review and content review, chat,
  legal-delivery-uploaders, profile-works, account-purge and data-export maps) plus the protected suite.
- eslint (killed for memory). The real wawu-id for the live seam (the Hub repo's stand-in was used). The website (R-49).
- The relock itself and the `relock-approved` label: the owner's. I changed no product code, test, lock or harness.

## Builder report, round 2

Builder, 11 Oct 2026. wawu-backend `wmt/TIER-02` `0d9d3df`; mobile `wmt/TIER-02` (this branch, this file). Backend main `6976aad` merged in (MONEY-18, WALLET-06, the BILLS-01 hotfix, INBOX-05): one conflict, `docs/contract/CONVENTIONS.md`, both sections kept, TIER-02's is now `## 19.` (ruling 7). Mobile main `2d5f648` merged in (and then `15a5b6b`, FIX-31, tests only; its only conflict was the generated `docs/PROGRESS.md`): conflicts only in `BACKEND_GAPS.md` and `SHARED-CHANGES.md` (both sides kept), the generated `docs/PROGRESS.md` (regenerated) and `contract/SOURCE_COMMIT`.
**Migration renamed (lead, 11 Oct):** `20261020170000_product_drafts` is now `20261021030000_product_drafts` (backend `b133beb`), because main gained `20261021010000_community_message_key` (INBOX-05). Contents unchanged except the rollback line, which names the new folder; nothing was deployed under the old name. It applies on a fresh database after main's newest folder. No other migration.

Before and after below were run on two Hub processes (:6182 and :6183) on one database, with the Hub repo's stand-in WAWU ID on :6181: the "before" on a build of `2c2543d` plus main, the "after" on a build of the final head. Scripts and transcripts are in the lead's scratchpad `tier02r2/` (`r2.js`, `live.js`, `before.txt`, `after.txt`, `live-after.txt`).

**Each ruling as built**
1. **D1 (a double delete freed more than one place).** `DELETE /content/:id` now reads the piece inside the transaction and flips it with a conditional `updateMany` on the status it read (never `removed`, so a removed piece never matches). Only the request whose write changed a row gives a place back, and only when the status it changed from was not `rejected`. A request that changed nothing reads again (at most 3 times, then `409 "This piece changed while you removed it. Try again."`), so an admin reject landing between the read and the write is counted once. A loser answers `404`, as a repeat delete always did. *Why not just "status not removed":* with only that, a delete that read `pending` just before an admin reject still decrements for the stale status (the reject already gave the place back); a test that makes that happen fails on that variant (D1b below). *Before:* the verifier's case reproduced, 6 concurrent deletes of one piece, `slotsUsed` 2 to 0 (statuses 204 x3, 404 x3), then 4 live pieces on a 3-product tier; three more runs: `slotsUsed` 3 to 1, 3 to 0, 3 to 0 with 2, 5 and 6 answers of 204, and 4 or 5 live pieces. *After:* three runs, each one 204 and five 404, `slotsUsed` 3 to 2, never more than 3 live products, and a later repeat delete 404 (the code today's suite pins).
2. **D2 (a first publish answered 409 under a race).** `create` and `resubmit` make the `CreatorState` row with `createMany` and `skipDuplicates` (insert-or-nothing) before the conditional claim, in one private method, `ensureCreatorState`. *Before:* two concurrent first publishes, 8 of 12 runs and 11 of 12 runs had a `409 "That record already exists."`. *After:* 0 of 12 refused, `slotsUsed` 2 in each.
3. **D3 (the draft cap passed 20).** `ProductDraftService.create` counts and inserts in one transaction under `pg_advisory_xact_lock(hashtextextended('product-drafts:<person>', 0))`, the pattern WALLET-06 and the beneficiaries use. *Before:* 30 concurrent drafts left 25 rows (and 24 on a second run); the verifier saw 22. *After:* exactly 20 (201 x20, 409 x10) over two Hubs, and `GET /product-drafts` lists all 20.
4. **D4 (copy).** `reason.message` of `product_limit_reached` is written from the offers the answer carries (`TierGateError.withOffers`). With no tiers and no extras (a tick holder at 25): "You've used all 25 of your product places." (the number is the allowance; a unit test with 7 and 40 proves it is not a constant). I applied the same rule to the two other cases that promised a way the body does not carry: only extras ("You have used 10 of 10 products. Add more products to publish another.", the top tier) and only a higher tier ("... Move up a tier to publish another."). Both ways offered keeps the old sentence. No em-dash. *Before:* the tick holder was told "Add more products or move up a tier" with `tiers: []` and `extraProducts: null`.
5. **T1 to T5.** One test for each surviving mutant (V23 left, equivalent): see the table. The coverage spec now reads file-shaped properties by pattern (a body property named `folder`, or ending `Asset`, `Url` or `Key`) and not three names. That found 21 mounted routes with such a property; each is in `NOT_GATED` with its reason (profile pictures and links, the identity document, community and event pictures, staff and admin routes, and three that are not files: a device key and two return addresses), and a new test fails if a listed route stops having one.
6. **The protected suite's tier grant (SHARED-CHANGES TIER-02 #4, rewritten to the verifier's recipe).** `grantVerifyTier` in `test/protected-routes/harness.ts`, called from `beforeAll` in `src/protected-routes/protected-routes.regression.spec.ts` after `takeSnapshot` and the registration of the identities, before the setup steps. It inserts a real Verify `MakerTier` row (the plan config's 3 products, 30 days, running) for `creator` and `creator2`. No lock re-record. **This is why the PR waits:** the change is under `test/protected-routes` and `src/protected-routes`, so `lock-diff.py` counts it as a relock and the PR needs the owner's `relock-approved` label, applied after its last push; the lead carries it to the owner. Row #4 now names the entries (0-based: 23 `POST /uploads/presign`, 24 `POST /content`, 11 and 26 `GET /creator/state`, 25 `PATCH /creator/dm-settings`), the admin screens' `slotsTotal` 0, the order (the gate and the grant in one PR, because `deploy.yml` runs the suite from `src/`) and the evidence.
7. **CONVENTIONS.md.** Both sections kept; TIER-02's is `## 19.`.
8. **Not this round:** the six owner questions stay open under "For the owner" below.

**Mutants** (each applied to the final tree, the 9 gate and allowance specs run, the file restored; all killed)

| Mutant | Killed by |
|---|---|
| D1a `delete` as it was (unconditional flip) | six concurrent deletes; the stale-read test |
| D1b conditional on "not removed" with the decrement from an earlier read | the stale-read test (a DELETE that read the piece before an admin turned it down) |
| D1c flip not conditional on the status read | six concurrent deletes; the stale-read test |
| D1d a rejected piece gives a place back | "a piece turned down already gave its place back" |
| D2 `upsert` again | twelve first publishes at once; 10 of the content-piece unit tests |
| D3 no lock | thirty drafts at once; ten drafts with one place left (fills 19, sends 10) |
| D4a message not rewritten from the offers; D4b always both ways; D4c "25" hard-coded | the three D4 HTTP tests and the `tier-gate-message` unit spec |
| V05 professional tick ignored (T1) | "a professional tick alone keeps publishing" |
| V08 resubmit claim one too generous (T2) | two resends at 2 of 3; a resend against a publish at 2 of 3 |
| V10 `PATCH` with a file asks for room (T3) | "at the limit, a waiting piece can still have its file swapped" |
| V11 draft completeness before the gate (T4) | "with no tier, an unfinished draft is told tier_required" |
| V13 draft cap counts everyone (T5) | the crowd tests; "another person's full drafts" |
| V26 a lost claim always says limit (T5) | "a publish that loses its place because the tier ended meanwhile" |
| V27 a free draft keeps its stale price (T5) | "a free draft publishes at nothing" |
| R4 a body with `assetUrl` (T5) | the coverage spec, by pattern |

One of my own tests was flaky at first (six taps on Send again at the limit, asserting all 200): a tap that read the piece as turned down just before the first one committed can be told `product_limit_reached` afterwards. It now asserts the real rule (the piece goes once, one place, no tap told anything else). See the observations.

**Checks.** All on the head named above, in a fresh migrated and seeded database `bt02r2_fresh_test`, unless said.
- `npx tsc --noEmit` 0; eslint (no `--fix`) EXIT 0 on the 9 files round 2 changed; prettier clean. Over all 54 `.ts` files the branch changes against main, eslint reports 524 problems, every one in 11 older files that already had them (525 on main for the same files, none new; the 15 files this task adds have 0).
- Specs: content-piece, creator-state, storage and plans: 25 suites, 523 tests passed; admin creators, KYC review, content review and the account purge map: 5 suites, 88 passed. The gate contract spec alone is 51 tests (32 from round 1, 19 new), run 7 times with no failure.
- Protected suite, `run.sh --fresh HEAD` with the branch's own suite and lock (`PROTECTED_LOCK_REF=HEAD`) in a private network namespace (`unshare -n`, its own Postgres 16 on 127.0.0.1:5432 inside it): **253 of 253, "all 244 required tests passed", EXIT 0, 0 `MakerTier` rows left** (done twice: before and after the migration rename and the main merge). Without the grant, against the main lock, round 1 and the verifier showed 9 of 253 (the setup step `POST /content as creator2` 402).
- Gates: 16 FAIL, the same 16 FAIL lines as main `6976aad` (one line number moved, `content-piece.service.ts:46` to `:48`, the `FlutterwaveConfigResponse` fork finding), warnings 96 against 95 (the one new is `PROVISIONAL(PRODUCT-DRAFTS-MAX)`), 76 accepted; `check_baseline` ok, 108 entries.
- `npm run contract:build` twice: byte-identical (sha256 `b78232fd...`), and equal to the committed auto-merged file (git shows no change). Synced to mobile: `contract/openapi.json` copied from the backend branch (`SOURCE_COMMIT` `wmt/TIER-02@0d9d3df`) and `python3 scripts/api/sync_contract.py`, because `npm run api -- --backend <worktree>` copies `origin/main` of that repo (backend main), not the branch; the result is main's contract plus this task's.
- Whole backend suite the way `deploy.yml` runs it (`npx jest --runInBand --forceExit` on a fresh `wawu_hub_test`, migrated and seeded, the stand-in WAWU ID on :4001, in a private network namespace on a UTF8 cluster; six serial shards of that one run to stay inside memory), on `0d9d3df`: 265 suites, 7454 tests, 263 suites and 7433 tests green in the run, 4 pending. Two suites were red in the run, neither from this task and neither a file it touches (`git diff origin/main` is empty for `src/money` and `src/tests`): (1) `src/tests/hub-rate-limits.contract.spec.ts`, 11 tests, needs a non-loopback IPv4 interface and the private namespace has only loopback; run alone outside it, 22 of 22 pass. (2) `src/money/receipts/tests/receipt-units.spec.ts`, 6 tests: 2 are timing bounds that failed at load 20 and pass alone, 4 are the Unicode digit table (this machine's Node 22.22.0 has Unicode 16 data, the spec expects the Unicode 17 digits); the same 4 fail on main `6976aad` run on its own checkout (4 failed, 39 passed), so `deploy.yml` on a newer Node 22 is the answer for those. An earlier try on a SQL_ASCII cluster failed the ADS-03 blank-text spec for the cluster's encoding alone; I threw it away and ran the whole suite again on UTF8, the encoding the CI Postgres has. Logs: `tier02r2/whole3-shard1..6.json`, `whole-alone-2.log`, `main-receipt-units.log` in the lead's scratchpad.
- Live seam: the verifier's `live.js` (63 checks) on the after build: 62 passed; the one failure is the verifier's own N2 check ("no tier offered that holds fewer than 8"), which U5 below explains. D1 to D4 checks in `r2.js`: 14 of 14.
- Mobile (after main `2d5f648` was merged in): `npm run gates` EXIT 0 (0 fail, 2 warn, 531 files, baseline 0), `npm run tasks` EXIT 0; `python3 scripts/api/sync_contract.py` changes nothing. No app code changed, so the full check was not run.

**NOT RUN**
- The real wawu-id for the live seam (the Hub repo's stand-in was used), and the website (R-49).
- The relock label: the owner's.
- The mobile full check (typecheck, lint, jest): no app code changed.

**Observations (not changed, for the lead)**
- Admin take-down (`AdminContentReviewService`) reads the piece's status before its transaction and decrements by that read, as `DELETE` did: a take-down racing an admin reject on the same piece could return the place twice. Two admins at the same millisecond on one piece; the same compare-and-swap would close it.
- A second tap on "Send again" that arrives while the first is committing, at the limit, can be told `product_limit_reached` although the piece was sent. One place is taken, nothing breaks; the app shows the offers sheet for a moment. Fix if wanted: on a gate refusal, read the piece again and return it if it is now `pending`.
- `npm run api -- --backend` always copies the backend's `origin/main` contract, so a task branch is synced by copying the file and running the script without `--backend` (as round 1 did).

## Verifier report, round 2

Verifier, 11 Oct 2026 (independent; wrote none of this). Backend `wmt/TIER-02` `0d9d3df` in the detached worktree `/home/user/wt/vb-TIER-02r2`, built and run as two Hub processes (:6182 and :6183) on one database, with the Hub repo's stand-in WAWU ID on :6181; mobile `wmt/TIER-02` `1e354af` in `/home/user/wt/v-TIER-02r2`. Trial merges (throwaway copies, never pushed): backend main `0d5836e` (EVENTS-09, newer than the `6976aad` the builder merged) in `/home/user/wt/vbm-TIER-02r2`; mobile main `4f2549b` (AUTH-07 round 4) in `/home/user/wt/vmm-TIER-02r2`. Evidence (scripts, logs, JSON): the lead's scratchpad `vtier02r2/`. No Fintava, Nuvion, Flutterwave, wawuafrica.com or AI host was called. People signed in through the stand-in's real `/auth/register` and `/auth/login`. I changed no product code, test, lock or harness (the branch worktrees are clean; the one local merge commit is in the throwaway trial copy).

**Verdict: `review`. No blocker.** D1 to D4 are fixed and hold under every attack I could build; T1 to T5 are each killed by a named test. Two new low defects (D5, D6) and three test notes (T6 to T8). The paid allowance cannot be passed by anything a creator can do: 84 rounds of concurrent deletes and 60 rounds of mixed publishes, deletes, resubmits and admin decisions on the same person left `slotsUsed` equal to the live pieces and never above the allowance. The one way found to move it wrongly is staff-only (D5).

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed | `tsc --noEmit` 0 errors on the branch (build) and on the trial merge. Gates: 16 FAIL, the same 16 FAIL lines as main `0d5836e` on the branch and on the merge (one line number moved, `content-piece.service.ts:46` to `:48`, the `FlutterwaveConfigResponse` fork); warnings 96 against 95 on main (the one new is `PROVISIONAL(PRODUCT-DRAFTS-MAX)`), 76 accepted; `check_baseline` ok, 108 entries. eslint (no `--fix`) on the 54 changed `.ts` files of the merge: 524 problems, all in 11 older files that have 525 on main (same files, same counts); 3 sit on lines the branch edited and are the same messages the lines already had on main (prettier and `no-unsafe-member-access` on long `expect` lines whose number changed); the 15 new files and the 9 files of round 2 have 0. |
| V2 Contract | passed | `contract:build` (build, emit, enrich) on the merge twice: byte-identical (sha256 `30dd2ca3...`) and equal to the committed auto-merged file (git shows no change). On the branch, emit and enrich twice: `b78232fd...` both times, equal to the committed file and to mobile `contract/openapi.json`; `SOURCE_COMMIT` is `wmt/TIER-02@0d9d3df`. |
| V3 Regression | passed under the grant; fails as designed without it | See the protected suite block below. |
| V4 Field trace | passed | `slotsUsed` writers: `POST /content` (+1), `POST /content/:id/resubmit` (+1), `DELETE /content/:id` (-1 once), admin reject (-1), admin take-down (-1, D5), the insert-or-nothing row. All attacked in pairs, below. Readers unchanged from round 1 (one allowance service). |
| V9 Live seam | passed (stand-in WAWU ID); NOT RUN (real wawu-id) | Every D-item below was run live on two Hubs; the live scripts were also run against a build with D1, D2 and D3 each put back (see Mutants) and they failed as they should. |

**The brief's items**

1. **D1, a double delete frees one place: CONFIRMED.** The six concurrent deletes of round 1, over two Hubs, 84 rounds in all (24 and then 60), with 6, 8 and 12 requests, on a pending piece, a live piece (approved by an admin) and a rejected piece (rejected by an admin): every round exactly one 204 and the rest 404 (84 x 204, 644 x 404, nothing else), one place freed (none for a rejected piece, which had given its place back at review), a later repeat delete 404, then six publishes took only the freed place; never more than 3 live on a 3-product tier and `slotsUsed` equal to the live pieces. **Other writers**, in pairs, each both ways round: with the piece's row lock held so the second request queues behind the first in a known order (2 runs per order), and with both sent at once over two Hubs (6 runs per order). No drift in any of: delete against admin reject, delete against admin take-down (pending and live), delete against resubmit, delete against approve, reject against reject, take-down against take-down, reject against approve. Chaos at the limit, 60 rounds (4 publishes, 3 deletes of two pieces, 2 resubmits, 1 draft at once on a 3-of-3 person who also had one piece approved and one rejected): never above 3 live, `slotsUsed` equal to the live pieces every time, only 200, 201, 204, 402 and 404 answered (no 409 from the three-attempt loop, no 500, no deadlock). **Admin take-down: REPRODUCED, see D5.**
2. **D2, a first publish is never refused: CONFIRMED.** 60 runs (30 and 30) of 2, 3 and 6 concurrent first publishes from a person with no `CreatorState` row (checked before each run), on tiers of 3 and 6, over two Hubs: 0 refused with 409 or any other error, the answers only 201 and the limit's 402, exactly min(requests, allowance) pieces and `slotsUsed` equal in every run. Also 24 runs of two concurrent resubmits with the row deleted: both 200, 2 places.
3. **D3, the draft cap: CONFIRMED.** 30 and 45 concurrent over two Hubs: exactly 20 rows, 20 x 201, the rest 409 `draft_limit_reached` in plain words, and `GET /product-drafts` lists all 20. Two people at once (30 each): 20 and 20. Per person, not global: with person A's advisory lock held for 3 s from a second connection, person B's draft answered 201 in 35 ms and A's waited 2.6 s. The 21st is 409; after one delete the next is 201.
4. **D4, the sentence: CONFIRMED** (the number is `productsAllowed`, plain words, no em-dash or en-dash anywhere in the body, `reason.message` equal to `message`; for the tick holder the same sentence also came from content presign and from the draft publish, which left the draft in place). Tick holder at 25 with nothing to buy (`tiers: []`, `extraProducts: null`): "You've used all 25 of your product places." Extras only (top tier, 10 of 10): "You have used 10 of 10 products. Add more products to publish another."; with 5 extras bought, "15 of 15". Both (Verify, 3 of 3; with 5 extras "8 of 8"): "You have used 3 of 3 products. Add more products or move up a tier to publish another." Tiers only: not reachable over HTTP (the offers give a running tier extras and always the extras pack; a held tick gets neither), held by the unit spec only (N5). A tier plus a larger tick, both full: "You've used all 25 of your product places." No tier: the `tier_required` sentence, no em-dash. One case reads wrongly: D6.
5. **T1 to T5: CONFIRMED.** Each surviving mutant of round 1 was put back and killed (table under Mutants): T1 V05 by "T1: a professional tick alone keeps publishing"; T2 V08 by two resends at 2 of 3 and a resend against a publish; T3 V10 by "at the limit, a waiting piece can still have its file swapped"; T4 V11 by "T4: with no tier, an unfinished draft is told tier_required"; T5 V13 by the crowd tests and "another person's full set of drafts"; V26 by "T5: a publish that loses its place because the tier ended meanwhile..."; V27 by "T5: a free draft publishes at nothing"; R4 (a body property `assetUrl`) by the coverage spec. **Coverage spec:** the pattern is `folder` or a name ending `Asset`, `Url` or `Key` on a top-level validated property of a body class; its 21 `NOT_GATED` entries are counted and each has a reason of more than ten characters, and a new test fails if a listed route stops being mounted or stops having such a property. Five checked against the routes, all hold: `PATCH users/me` (`avatarUrl`, `coverUrl` and four link fields; profile content); `POST kyc` (`idDocumentUrl`; the identity document a wallet needs before a tier can be bought); `POST legal/ops/requests/:id/deliver` (`deliverableUrl`; class guard `AdminAuthGuard`, roles superadmin and support); `POST admin/professionals/:id/document-url` (`documentUrl`; admin, roles superadmin and reviewer; a signed read link); `PUT money/device` (`publicKey`, a P-256 key, not a file); and `POST learn/guides` (`fileUrl`; superadmin only). The guard has a limit (T8).
6. **The protected suite grant: CONFIRMED, built as SHARED-CHANGES TIER-02 #4 says.** `grantVerifyTier` in `test/protected-routes/harness.ts` is called from `beforeAll` in `src/protected-routes/protected-routes.regression.spec.ts` after `takeSnapshot`, after the five identities and the admins are made, before the setup steps; it writes a real Verify `MakerTier` row (3 products, 30 days, running) for `creator` and `creator2` only. `.pipeline/protected-registry.json` is byte-identical to main (0 diff lines), the lock `sha256` is `755ce4fa...` before and after, no workflow or script changed. With the grant (`run.sh --fresh HEAD`, `PROTECTED_LOCK_REF=HEAD`, fresh database): 253 of 253, "all 244 required tests passed", EXIT 0, `MakerTier` rows left 0. On the trial merge with main `0d5836e`: 253 of 253 again. Without the grant (the branch's code against main's suite and lock): 9 passed, 244 failed, "0 of 244 required tests passed", and every one of the 244 is the single setup error `setup step POST /content as creator2 failed: 402 ... tier_required`, so the 402 is real and the grant is what lets the suite run. **Why the PR needs the owner's `relock-approved` label:** `lock-diff.py` counts the two changed checker files as a relock (exit 1, lock hash unchanged), and without the label, applied after the last push, `ci-check.sh` runs the PR against main's suite, which fails 244 of 253 on that designed 402.
7. **The migration: CONFIRMED.** On a database migrated with backend main `6976aad`'s 119 folders, `prisma migrate deploy` from the branch applies exactly one folder, `20261021030000_product_drafts` (120 in `_prisma_migrations`), which sorts after `20261021010000_community_message_key`; `ProductDraft` has the primary key, the index and both CHECK constraints; its rollback lines run (table dropped, history row deleted) and the folder applies again; `prisma migrate diff` against `schema.prisma` shows only the `ContentPiece` `specializations` index, which main shows too (not this task). Main has since gained `20261021070000_event_door_scans`, which sorts after the TIER folder: with main's 120 folders applied first, the branch's `20261021030000_product_drafts` applied as the one pending folder (121 in all, both tables present), so the order is harmless; SHARED-CHANGES #1's "sorts after every folder on main" is no longer literally true.
8. **Trial merges.** Backend main `0d5836e` into the branch: **no conflicts** (`contract/openapi.json`, `prisma/schema.prisma`, `src/account-purge/account-data-map.ts` and `src/data-export-request/data-export-sections.ts` auto-merge). Mobile main `4f2549b` into the branch: **one conflict, `docs/PROGRESS.md`** (generated); regenerated with `python3 scripts/tasks/check_tasks.py --write`, no markers left, `npm run tasks` EXIT 0 on the merge (275 tasks, 279 artboards); `contract/openapi.json` unchanged by the merge. Merged backend: `tsc` 0; gates, baseline, eslint and `contract:build` as in V1 and V2; in a private network namespace (its own Postgres 16, a fresh migrated and seeded database, the stand-in WAWU ID on :4001 inside it, one jest worker): content-piece, creator-state, storage, plans, admin content-review, and the account-purge and data-export map specs, **29 suites, 564 of 564 tests**, EXIT 0; the protected suite `run.sh --fresh HEAD` **253 of 253**.

**Defects**
- **D5 (low): admin take-down can return a place twice, or never.** `AdminContentReviewService.takeDown` reads the piece's status before its transaction and decrements by that read (`existing.status !== 'rejected'`), while its own flip is "status not removed". Reproduced two ways (`d1b.js`, `d1b.log`; the piece's row lock held so the order is known, and also sent at once): (a) **a place returned twice:** an admin reject and a take-down on one pending piece, reject first: both answer 200, `slotsUsed` 3 to 1 with 2 live pieces (it should be 2), 2 of 2 ordered runs; sent at once over two Hubs 3 of 6 runs one way round and 1 of 6 the other, a phantom place each time; the person may then publish one more than the allowance, once per occurrence. (b) **a place never returned:** a take-down that read `rejected` and a resubmit that lands before it writes: both 200, `slotsUsed` one too high for ever (a place lost to the creator), 2 of 2 ordered runs, 5 of 12 at once. Take-down against delete, against another take-down, against approve are safe (the flip is conditional). **Severity low:** the routes are staff-only (superadmin and reviewer), it needs two staff actions on one piece within milliseconds (or one admin sending reject and take-down together), and a creator cannot cause or repeat it; the effect is at most one place per occurrence, and the creator-side error (b) works against the creator. It is the D1 class, so it should be closed with the same compare-and-swap as `delete` (read the status inside the transaction, flip with `updateMany where { id, status: <the status read> }`, decrement only if the row changed and the status it changed from was not `rejected`, read again on no change); with D1 closed it is the only unconditional status read left that moves `slotsUsed`.
- **D6 (low, copy and offers): a person above their allowance is told "25 of 3" and offered ways that do not let them publish.** Reachable at launch: a verification tick ends with 25 pieces up, the person buys Verify (3 products); `GET /me/tier` reads 25 of 3 and publishing answers `product_limit_reached`: "You have used 25 of 3 products. Add more products or move up a tier to publish another.", with Plus (6), Founding (10) and the 5-extras pack in the body, none of which lets a 26th be published (the offers keep tiers above the tier held, not above the number used). The builder's unit spec pins "all 25" for used above allowed, but only when no offer is made. Fix: offer only what raises the allowance above `productsUsed`, and when nothing does, say that products must come down first.

**Test notes** (survivors of my own mutants, none a product defect)
- **T6 (info):** M10, `resubmit` alone put back to `upsert`, survives: no test races a resubmit for a person with no counter row. Unreachable in practice (a turned-down piece means an earlier publish made the row); the `create` side is killed (M08).
- **T7 (info):** M13, one advisory lock key for everyone instead of one per person, survives: outcomes are identical, only throughput differs. Per person was shown live (D3 above), not by a test.
- **T8 (info):** X1, a new body property named `images` (an array) on `PUT /content/:id/media`, survives the coverage spec: it reads top-level validated names ending `Asset`, `Url` or `Key`, and `folder`, so `images`, `media`, `frames`, `documents`, `files`, `attachment` and nested body classes are not seen (a `fileKey` is: X2 killed). Today's routes with such names are the known ones (frames U3, featured works U2, chat attachments, application documents). A name guard, not a proof.

**Notes (not defects)**
- N5: "tiers only" sentence is unit-tested but unreachable over HTTP (see item 4).
- N6: a person with a running tier whose larger tick is full gets "You've used all 25 of your product places." and no offers, although five more extra-product packs would lift the tier above the tick; the builder's reading ("nothing to buy that adds a product") is right for the next pack, not the fifth. Owner's call, with U5.
- N7: the `NOT_GATED` list keeps all profile, chat and event pictures free by decision (round 1, U2); unchanged.
- N8: PR order, unchanged from round 1: the gate, the grant and the migration go together; web publishing stays closed until TIER-03 sells a tier (G-663).

**Mutants** (30 of my own on round 2's code, each applied to `vb-TIER-02r2`, seven gate and allowance specs run in-band against a fresh migrated database, the file restored from git, the tree clean after each; plus the live scripts against a build with three of them in)

| Mutant | Result | Killed by |
|---|---|---|
| M01 D1 flip no longer conditional on the status read | KILLED | six concurrent deletes; the stale-read test |
| M02 D1 a rejected piece also gives a place back | KILLED | "a piece turned down already gave its place back"; the stale-read test |
| M03 D1 delete never gives a place back | KILLED | the count tests, the six deletes |
| M04 D1 a request that changed no row still decrements | KILLED | six concurrent deletes; the stale-read test |
| M05 D1 one attempt only (no re-read) | KILLED | six concurrent deletes; the stale-read test |
| M06 D1 a removed piece is not refused (repeat delete matches `removed`) | KILLED | six concurrent deletes |
| M07 D1 the read outside the transaction | KILLED | the stale-read test |
| M08 D2 `upsert` again (create and resubmit) | KILLED | twelve first publishes; 10 content-piece unit tests |
| M09 D2 the counter row never made | KILLED | 31 tests |
| M10 D2 `resubmit` alone back to `upsert` | **SURVIVED** | T6 |
| M11 D3 the advisory lock removed | KILLED | thirty drafts at once; ten with one place left |
| M12 D3 the lock key differs on every call | KILLED | the same two |
| M13 D3 one lock for everyone | **SURVIVED** | T7 (equivalent in outcome) |
| M14 D3 the cap `>` (21 kept) | KILLED | the draft limit tests |
| M15 D4 the sentence names `used` not the allowance | KILLED | the unit spec (27 used of 25) |
| M16 D4 extras test inverted | KILLED | 8 tests |
| M17 D4 higher-tier test always true | KILLED | 5 tests |
| M18 D4 sentence not rewritten from the offers | KILLED | 3 tests |
| M19 D4 a tick holder is offered extras | KILLED | 3 tests |
| M20 the claim on `POST /content` one too generous | KILLED | 3 tests |
| T1 V05, T2 V08, T3 V10, T4 V11, T5 V13, V26, V27, R4 (round 1's eight) | all KILLED | named in item 5 |
| X1 a new file property named `images` | **SURVIVED** | T8 |
| X2 a new file property named `fileKey` | KILLED | the coverage spec |

Live scripts against a build with M01, M08 and M11 together: D1 failed in 9 of 9 rounds (5 to 6 x 204 on one piece, `slotsUsed` 3 to 0, 4 and 5 live on a 3-product tier), D2 failed 9 of 12 runs with `409 That record already exists.`, D3 left 24 and 30 drafts and 48 for two people; so the passes above are not blind. Total 30 mutants: 27 killed, 3 survived (M10, M13, X1), none a product defect.

**Late addendum (main moved twice while I worked; checked after the report above).** Backend main `5926f5c` (JOIN-03 round 3; adds `TierGrantService`, migrations `20261021100000_waitlist_claim_paid` and `20261021110000_waitlist_claim_result`) against the branch: **two conflicts, both add/add**, `src/plans/plans.module.ts` (imports, the doc comment, providers and exports: the branch adds `PublishingAllowanceService`, `PublishingGate` and `PublishingOffersInterceptor`, main adds `TierGrantService`) and `docs/contract/PLANS.md` (both sides add sections); keeping both sides compiles: `tsc` 0, a fresh database takes all 123 migration folders in order (the TIER folder `20261021030000` sorts before main's later ones and applies in its place), and `src/plans`, `src/content-piece` and `src/creator-state` pass, 20 suites, 375 of 375 (this includes `tier-grant.spec.ts`). The merged doc comment in `plans.module.ts` then carries both paragraphs and wants one tidy sentence. Mobile main `21085a2` against the branch: **three conflicts**, `BACKEND_GAPS.md` (rows from both sides, keep both), `contract/SOURCE_COMMIT` (one line; after the backend merges, run `python3 scripts/api/sync_contract.py` against the merged backend so the contract and the pointer are one commit) and the generated `docs/PROGRESS.md` (regenerate with `python3 scripts/tasks/check_tasks.py --write`); `contract/openapi.json` auto-merges but must be re-synced, because JOIN-03 changed the backend contract too. Not re-run on these two mains: eslint, gates, protected suite, `contract:build` (done on `0d5836e` and `4f2549b` above; the merged files that moved are the plans module, PLANS.md, the schema and the contract).

**Capability checks, as written:** all six pass, including 3 ("a draft does not count; unpublishing frees a place") now under concurrency.

**Checks run:** see V1, V2 and items 6 to 8. Selected specs on the branch's build: the gate contract spec, the message spec, the coverage spec and the upload-allowance spec, 82 of 82, then the seven-spec set 114 of 114 per mutant run.

**NOT RUN**
- The real wawu-id for the live seam (the Hub repo's stand-in was used), and the website (R-49).
- The whole backend suite (the builder ran it in six shards; I ran the 29 suites the brief names on the merge, plus the protected suite).
- The mobile full check (typecheck, lint, jest): the mobile branch changes only the generated contract types and docs; `npm run gates` and `npm run tasks` are below.
- The `relock-approved` label and the relock decision: the owner's.
- A fix for D5 or D6: the verifier changes no product code.

## Builder report, round 3

Builder, 11 Oct 2026. wawu-backend `wmt/TIER-02` `5047cad`; mobile `wmt/TIER-02` (this branch, this file). Backend main merged in twice: `5926f5c` (JOIN-03; the two add/add conflicts the verifier named, `src/plans/plans.module.ts` and `docs/contract/PLANS.md`, kept both sides: the module's doc comment is one paragraph again and main's section is now `## 7. Granting a tier (JOIN-03)` beside TIER-02's `## 6.`) and then `f11d307` (MONEY-19; no conflict). Mobile main `9a4f97f` (which contains `21085a2` and `492615d`): conflicts only in `BACKEND_GAPS.md` (both kept), `contract/SOURCE_COMMIT` and the generated `docs/PROGRESS.md` (regenerated).
**Migration renamed again (brief, 11 Oct):** `20261021030000_product_drafts` is now `20261021120000_product_drafts`, because main's newest folder is `20261021110000_waitlist_claim_result`. Contents unchanged except the rollback line, which names the new folder; nothing was deployed under any earlier name. A fresh database takes all 123 folders in order. SHARED-CHANGES TIER-02 #1 says so.

Before and after were run on two Hub processes (:6182 and :6183) on one database, with the Hub repo's stand-in WAWU ID on :6181: the "before" on a build of the merged tree before any round 3 change, the "after" on a build of the final tree. The scripts are the verifier's own (`d1b.js`, `d234.js`, `lib.js`), plus `d6.js` for D6. Transcripts are in the lead's scratchpad `tier02r3/` (`before-d5.txt`, `after-d5.txt`, `after-d5-20.txt`, `before-d6.txt`, `after-d6.txt`, `after-d4.txt`).

**Each ruling as built**
1. **D5 (admin take-down and reject could return a place twice or never).** `AdminContentReviewService.takeDown` now reads the piece INSIDE its transaction and flips it with `updateMany where { id, status: <the status read> }` (that status is never `removed`, so a removed piece never matches), the compare-and-swap `DELETE` has. A place goes back only when its write changed the row and the status it changed from was not `rejected`; a write that changed nothing reads again (3 passes, then `409 "This piece changed while you were taking it down. Try again."`). The audit row's `previousStatus` is the status it really changed from. `reject` and `approve` (`decide`) read inside the transaction too; their flip was already conditional on `pending`, so they could not return a place twice, and `approve` never touches the count, so the only unconditional read that moved `slotsUsed` was take-down's. *Before* (the verifier's `d1b.js`, build of the merged tree): reject then take-down on one waiting piece, `slotsUsed` 3 to 1 with 2 live (a place returned twice): 2 of 2 ordered runs, 5 of 6 at once; take-down then reject at once, 1 of 6; take-down racing a resubmit (a place lost, 2 to 3 with 2 live): 2 of 6 at once; resubmit then take-down, 2 of 2 ordered and 4 of 6 at once. *After* (final tree): all 16 pair cases of `d1b.js`, each both ways round (2 ordered runs and 6 at once): **32 of 32 checks, 0 drift**; the four cases that failed, 20 rounds each at once: **0 drift in 80 runs**, and both orders really happened (reject against take-down answered 200/200 15 times and 400/200 5 times). A new real-database spec, `src/admin/content-review/tests/status-race.contract.spec.ts` (9 tests), makes each interleaving on purpose: a second transaction holds the piece's row lock, the admin request starts and the spec waits until the database says it is blocked on that lock (so it has already read the piece), and only then the competing change is written and committed. Cases: take-down against a reject, against a creator's resubmit, against an approve, against the creator's own removal; reject and approve against a take-down and a removal; six take-downs at once (one wins, one audit row, one place); two rejects at once; a reject and a take-down at once, 20 rounds, `slotsUsed` equal to the held pieces every time. The existing take-down unit double gained a transaction read (its four tests are unchanged).
2. **D6 (a person above their allowance was told "25 of 3" and offered what would not help).** `product_limit_reached` now carries only offers that would let another product go up: a new pure function, `limitOffers` (`src/plans/limit-offers.ts`), counts a tier when its products plus the extras already bought are MORE than the products published, and the extras pack when the person has a running tier and tier plus extras plus the pack is more than published. At the limit that is what it was (the tiers above the one held, extras carried over, and the pack); above the allowance it is only what is big enough for everything published, often nothing. The sentence (`productLimitMessage`) for published > allowed is "You have 25 products and your plan allows 3. To publish another, remove some." and adds " or add more places" only while an offer in the body would really help (numbers from the data, "1 product" in the singular, no em-dash). Exactly at the limit nothing changed. `tier_required` is untouched. *Before:* `GET /me/tier` read 25 of 3 and publishing answered "You have used 25 of 3 products. Add more products or move up a tier to publish another." with Plus, Founding and the 5-pack; 9 up on Verify the same; a tick holder at 27 of 25 "You've used all 25 of your product places." *After* (`d6.js`, 10 of 10): tick ended, 25 up, Verify bought: the sentence above, `tiers: []`, `extraProducts: null`, and the same sentence from a content presign; 9 up on Verify: only Founding (10), no pack (3 + 5 = 8 would not help), "remove some or add more places."; 5 up: Plus, Founding and the pack; 3 of 3 (control): the round 2 sentence and offers; a tick holder at 27 of 25: "You have 27 products and your plan allows 25. To publish another, remove some."; and "remove some" is true: removing pieces down to the allowance lets the next publish go up (204s then 201). `d234.js D4` (the round 2 sentences): 8 of 8 still pass. Specs: the tick-ended-then-Verify case and two more in `publishing-gate.contract.spec.ts` (HTTP, real database), `limit-offers.spec.ts` (every case of the rule), `tier-gate-message.spec.ts`. **I changed one assertion I did not write:** `tier-gate-message.spec.ts` pinned "You've used all 25 of your product places." for 27 used of 25 allowed with no offers; ruling 2 replaces that sentence, so it now pins the two-number one (the same file also pins the unchanged "used all" sentence at exactly the limit). The contract text of `reason.tiers` and `reason.extraProducts` changed (descriptions only; no field added or retyped).
3. **T8 (a new `images` property slipped past the coverage spec).** `publishing-gate-coverage.spec.ts` finds file-carrying body properties three ways: by name (`folder`; names ending `Asset`, `Url` or `Key`, also plural; and a word list, `image(s)`, `file(s)`, `media`, `attachment(s)`, `document(s)`, `frame(s)`, `photo(s)`, `picture(s)`, `video(s)`, `audio`, `gallery`, `thumbnail(s)`, `logo`, `upload(s)`, as a whole name or the end of one), by type (a property whose type, also as the item type of an array, is a class named for a Presign, Upload, Asset or Attachment) and inside nested classes (reported with a path, `attachment.key`). That sees 44 mounted routes: 4 gated and 40 listed in `NOT_GATED` (21 before), 19 of them new (the application and request documents, the featured works' `media`, the photo set's `frames`, chat attachments, the identity selfie, admin shop and ads, school logos, staff file lists), each with a reason. Each entry now also lists its file properties and the spec holds the list EXACTLY, so a route that gains one fails until someone says what it is (this is what kills the verifier's X1: `frames` was already on that route). *Mutants, all KILLED:* X1 an `images` array on `PUT /content/:id/media` (the verifier's); X2 `fileKey` there; X3 `files` and X4 `attachments` on `PUT /content/:id/preview`; X6 a nested class holding a `document`; X7 a property under a plain name whose type is an upload class; X8 `frames` renamed (a listed property no longer found).
4. **T6 and T7: recorded, no change.** T6 (resubmit alone put back to `upsert` survives: unreachable, since a turned-down piece means an earlier publish made the row) and T7 (one advisory lock for everyone instead of one per person: same outcomes, only throughput differs; per person was shown live in round 2, D3).
5. **The PR and the label: not this round.** The protected suite grant is as round 2 built it (253 of 253 below).

**Mutants of this round** (each applied to the final tree, the five specs that hold the rules run in order, the file restored; the tree was clean after each)

| Mutant | Result |
|---|---|
| D5-0 `takeDown` as it was (read before the transaction, flip on "not removed") | KILLED, 4 of 9 race tests |
| D5-1 flip on "not removed" again (read inside) | KILLED |
| D5-2 a rejected piece also gives a place back | KILLED |
| D5-3 take-down never gives a place back | KILLED |
| D5-4 one attempt only (no read again) | KILLED |
| D5-5 a write that changed no row still returns the place | KILLED |
| D5-6 reject and approve flip no longer conditional on waiting | KILLED |
| D5-7 the audit row names the wrong previous status | KILLED |
| D6-1 every tier above the one held (the old rule) | KILLED |
| D6-2 a tier that leaves exactly as many places as products counts | KILLED |
| D6-3 the pack offered to any running tier | KILLED |
| D6-4 the pack judged without the extras bought | KILLED |
| D6-5 the pack offered without a running tier | KILLED |
| D6-6 extras dropped when judging a higher tier | KILLED |
| D6-7 above the allowance, the old "used all" sentence | KILLED |
| D6-8 "add more places" said even when nothing is on offer | KILLED |
| D6-9 the two numbers swapped | KILLED |
| D6-10 the route stops using `limitOffers` | KILLED |

One mutant survived and is gone: ignoring a held tick's cap inside `limitOffers` changed nothing, because the rule only runs for a person who has used every place they have, so they have at least as many published as the tick allows and the cap can never decide an offer. It was an equivalent mutant; I took the term out (and its comment says why) instead of keeping dead code.

**Checks.** On the head named above unless said.
- `npx tsc --noEmit` 0. eslint (no `--fix`) 0 problems on every file round 3 changed or added (12 `.ts` files); over all 57 `.ts` files the branch changes against main it reports 524 problems, every one in the same 11 older files (525 on main; none new). Prettier clean on the files I wrote.
- Specs in a private network namespace (`unshare -n`, its own Postgres 16, UTF8, on 127.0.0.1:5432), a fresh database migrated with all 123 folders and seeded, the stand-in WAWU ID inside it, one jest worker: `src/content-piece`, `src/creator-state`, `src/storage`, `src/plans`, `src/admin/content-review`, `src/admin/creators`, `src/admin/kyc-review`, `src/account-purge`, `src/data-export-request`: **36 suites, 671 tests passed, EXIT 0**.
- Protected suite, `run.sh --fresh HEAD` with the branch's own suite and lock (`PROTECTED_LOCK_REF=HEAD`), same namespace: **253 of 253, "all 244 required tests passed", EXIT 0, 0 `MakerTier` rows left**.
- Gates: 16 FAIL, the same 16 FAIL lines as main `f11d307` (one line number moved, `content-piece.service.ts:46` to `:48`, as in round 2), warnings 96 against 95 (the one new is `PROVISIONAL(PRODUCT-DRAFTS-MAX)`), 76 accepted; `check_baseline` ok, 108 entries.
- `npm run contract:build` twice: byte-identical (sha256 `2c17a636...`). The merge had put the `/me/points` block in a different place than the build writes it, so the file changed by position (the same text moved) and by the two description edits; committed as `5047cad`. Synced to mobile: the file copied from the backend branch, `SOURCE_COMMIT` `wmt/TIER-02@5047cad`, `python3 scripts/api/sync_contract.py` (against the merged index the generated client changes by the moved block and the two descriptions only).
- Mobile (after main `9a4f97f` was merged in): `npm run gates` EXIT 0 (0 fail, 5 warn, 565 files, baseline 0), `npm run tasks` EXIT 0 (275 tasks, 279 artboards); `python3 scripts/api/sync_contract.py` run again changes nothing. No app code changed by this task, so the full check was not run (the app files in the merge are main's).

**NOT RUN**
- The real wawu-id for the live seam (the stand-in was used), and the website (R-49).
- The whole backend suite (the 36 suites above and the protected suite were run; the whole suite was run in round 2 and this round changes only the files named).
- The relock label: the owner's.
- The mobile full check (typecheck, lint, jest): no app code changed.

**Observations (not changed, for the lead)**
- `tier_required` still offers every tier. A person whose tick ended with 25 pieces up and who has bought nothing is told "Pick one to carry on" with Verify (3) among the offers, which would then say "You have 25 products and your plan allows 3". The ruling is about a person who holds a plan; I left `tier_required` alone because its contract says "every tier" and the app's picker reads it. Filtering it the same way is a small change if wanted.


## Verifier report, round 3

Verifier, 11 Oct 2026 (independent; wrote none of this). Backend `wmt/TIER-02` `5047cad` in the detached worktree `/home/user/wt/vb-TIER-02r3`, built and run as two Hub processes (:6182 and :6183) on one database with the Hub repo's stand-in WAWU ID on :6181; mobile `wmt/TIER-02` `980ba10` in `/home/user/wt/v-TIER-02r3`. Trial merge (throwaway copy, never pushed): backend main `b71c551` (BILLS-01 round 3; main was `f11d307` when I started and moved while I worked) in `/home/user/wt/vbm-TIER-02r3`, merge commit `1f6ef30`. Mobile main `cdb528c` and backend main `f11d307` are already inside the branches. Evidence (scripts, logs, JSON): the lead's scratchpad `vtier02r3/`. No Fintava, Nuvion, Flutterwave, wawuafrica.com or AI host was called. People signed in through the stand-in's real `/auth/register` and `/auth/login`. I changed no product code, test, lock or harness (the branch worktrees are clean; the one merge commit is in the throwaway copy).

**Verdict: `review`. No blocker.** D5 is closed and holds under every attack I could build; D6 is closed and every offer was proved by buying it; T8's named mutants are killed. One new low defect (D7, the lead's `tier_required` note, reproduced and rated, not fixed) and four test and wording notes (T9 to T12). Nothing a creator, an admin or both together can do moves the allowance: 352 pair runs, 40 rounds of 11 requests at once and 25 rounds of 6 take-downs under a status storm left `slotsUsed` equal to the live pieces every time.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed | `tsc --noEmit` 0 on the branch and on the trial merge. Gates: 16 FAIL, the same 16 FAIL lines as main on the branch and on the merge (one line number moved, `content-piece.service.ts:46` to `:48`, the `FlutterwaveConfigResponse` fork), warnings 96 against 95 (the one new is `PROVISIONAL(PRODUCT-DRAFTS-MAX)`), 76 accepted; `check_baseline` ok, 108 entries. eslint (no `--fix`) on the 57 changed `.ts` files, branch and merge alike: 524 problems, all in the same 11 older files that have 525 on main; the files round 3 wrote or changed have 0. |
| V2 Contract | passed | `contract:build` (build, emit, enrich) on the merge twice: byte-identical (sha256 `2c17a636...`), equal to the committed file and to mobile `contract/openapi.json`; `SOURCE_COMMIT` is `wmt/TIER-02@5047cad`. |
| V3 Regression | passed under the grant; fails as designed without it | Item 7. |
| V4 Field trace | passed | `slotsUsed` writers unchanged from round 2 (`POST /content` +1, resubmit +1, delete -1 once, admin reject -1, admin take-down -1, the insert-or-nothing row); the two admin writers now read the status inside their transaction. Attacked in pairs, triples and quads below. |
| V9 Live seam | passed (stand-in WAWU ID); NOT RUN (real wawu-id) | D5 and D6 were run live on two Hubs; the live scripts were also run against builds with the old take-down and with the extras wiring broken, and failed as they should. |

**The brief's items**

1. **D5, a place is returned once: CONFIRMED.** The 16 pair cases of `d1b.js` (delete, reject, take-down, resubmit, approve, every pair that can meet), each both ways round, 2 ordered runs (the piece's row lock held so the second request queues behind the first) and 8 sent at once over two Hubs: 32 of 32 checks, 0 drift. My `d5.js` runs 16 cases, 2 ordered and 10 at once each, with a triple (reject, take-down, resubmit), a triple of two take-downs and a reject, and a quad (reject, approve, take-down, delete): 32 of 32, 0 drift, 0 5xx. On top of `slotsUsed == live pieces` it checks the audit trail: each row's `slotReturned` fits its decision (a reject returns a place, an approve none, a take-down returns one unless the piece was already rejected), and some order of the rows is a true history, each row's `previousStatus` being the status the piece held when that row's write changed it (a resubmit may sit between a reject and the next row only in the cases that send one): 0 problems. Publish: chaos at the limit, 40 rounds of 11 requests at once over two Hubs on a person at 3 of 3 (3 publishes, 2 resubmits, 2 take-downs, a reject, an approve, 2 deletes, shuffled): never above 3 live, `slotsUsed` equal to the live pieces every round, no 5xx, no 409, audit rows consistent. **The old code is caught:** the 0d9d3df take-down put back in a throwaway build on :6184, `d5.js` fails reject then take-down 1 of 2 ordered and 7 of 8 at once (slotsUsed 1 with 2 live, a place returned twice) with the audit trail flagged (`previousStatus` pending on a piece that was rejected), take-down against resubmit 3 of 8 and resubmit against take-down 4 of 8 (slotsUsed 3 with 2 live, a place lost). So the 0 above is not blind.
   **The 409 after three passes.** Staff see `409 "This piece changed while you were taking it down. Try again."` in plain words, no em-dash, and the request writes nothing: no audit row, the piece not removed, the counter untouched. It is reachable only under a storm: a database loop flipping a piece between pending and rejected (every flip its own commit) while 6 take-downs of the same piece are sent at once, 25 rounds: 150 requests answered 25 x 200 (exactly one per round, exactly one audit row per round), 109 x 400 (already removed) and 16 x 409. **A request cannot starve forever.** (a) A race lost INSIDE the write statement leaves the request holding the piece's row lock (Postgres keeps the lock it took to re-check the row): `d5c2.js` shows a second session's `FOR UPDATE NOWAIT` on the piece failing while pass 2 waits, so nobody can change the status again until the request's transaction ends, and pass 2 succeeds (200, audit row `rejected > removed`, no place returned). Only a change that lands in the millisecond between the read and the write statement leaves no lock, and three of those in a row are needed. (b) The only moves the application makes on a piece are reject and approve (staff), resubmit (rejected to pending) and removal (which ends the loop with a 400), so a creator alone can change the status once, not repeatedly: staff against staff against creator inside a few milliseconds is the whole cause. T9: no test reaches this path.
2. **D6, the sentence and the offers: CONFIRMED, every offer proved by buying it.** `d6m.js` builds 48 situations: tier none, Verify (3), Plus (6), Founding (10), Verify ended, Founding ended; extras 0, 5 and 10 on a tier row; tick none, held, ended; with `slotsUsed` one below the allowance, at it, one, two and seven above, 25 and 27 (or 0, 12 and 25 with no allowance): 246 states. Below the allowance (34 states) publishing answers 201. At the allowance (34), above it (136) and with no allowance (42) it answers 402 with the right code. For each 402 the script BUYS every offer (writes the row a purchase would write: the tier with its products and the extras kept, or the extras pack added) and publishes: **108 listed offers, all 108 let the next publish through; 544 omitted offers (every tier and the pack that is not listed), none of the 544 would have.** The sentence is compared with one I compute from the numbers and the offers actually listed (allowed = `max(tier + extras, 25 if the tick is held)`, my own formula): 0 mismatches; `reason.productsUsed` and `productsAllowed` equal my numbers; `reason.message` equals `message`; no em-dash or en-dash in any of the 246 bodies. Samples: Verify, tick ended, 25 up: "You have 25 products and your plan allows 3. To publish another, remove some." with `tiers: []` and `extraProducts: null`; Verify with 4 up: Plus, Founding and the pack, "...remove some or add more places."; Verify with 10 up: nothing, "remove some."; Verify with 5 extras at 8 of 8: Plus, Founding and the pack. `d6r.js`: at 3 of 3 and at 5 of 3, `POST /content`, both presigns, resubmit and the draft publish give the same status, code, sentence, offers and numbers. The pack is listed only with a running tier (never to a tick holder or an ended tier). Assumption stated: extras carry over a move to a higher tier (U5, still open); see N10.
3. **`tier-gate-message.spec.ts`: one reason, nothing loosened. CONFIRMED.** `git show 896a57d` on the file shows two hunks that remove or change a line: the assertion for 27 used of 25 allowed ("You've used all 25 of your product places.", with its comment) is replaced by tests of the two-number sentence, and the em-dash test is widened (it now also runs at 25 of 3). Everything else in the file is added, and the unchanged "used all" sentence at exactly the limit is still pinned. The one other test file whose double changed, `take-down.spec.ts`, only gained a transaction read and a `status` equality in its `updateMany` double; its four tests' assertions are untouched.
4. **The builder's note, `tier_required` still offers every tier: REPRODUCED, rated low (D7).**
5. **T8, the coverage spec: CONFIRMED.** I dumped the walk: 487 mounted routes, 44 with file-carrying properties, 5 gated (4 of them with such a property), **40 not gated, each with its property list held exactly**. Nine reasons checked against the routes, seven true as written, two overstated (T12): `POST` and `PATCH users/me/featured-works` (`media`: keys under `profile/work/<own id>`, a 100 MB cap, `WawuAuthGuard` only, no tier; U2 asks the owner) true; `POST chats/:chatId/messages` (`attachment`: the key must be a chat key under the sender's own prefix with a `StorageObject` row of theirs) true; `POST money/identity/selfie` (a selfie matched against the BVN photo) true; `POST` and `PUT admin/shop/products` (`AdminAuthGuard` and `AdminRolesGuard`, roles superadmin and reviewer; `ShopController` has only buyer routes, R-2) true; `POST legal/ops/requests/:id/deliverables` (admin guards, roles superadmin and support) true; `POST kyc` (`idDocumentUrl`; PAYMENTS-PLAN question 1: the wallet's identity check comes before the first payment) true; `POST` and `PATCH events` (banner and speaker pictures; hosting by tier is E21, not in this task) true; `PUT content/:id/media` (`frames` must be the person's own `content/` uploads, so the files did pass the gated presign) true in substance, but the reason says "on a piece that has its place" and a person with NO tier sets frames on a REJECTED piece (200, `d8.js`), T12; `POST verification/submissions` and `/resubmit` ("needed before a tier can be bought": the plan puts the wallet check first) overstated, T12. **The seven named mutants** (X1 `images` on `PUT /content/:id/media`, X2 `fileKey`, X3 `files` and X4 `attachments` on `PUT /content/:id/preview`, X6 a nested class holding `document`, X7 a property of an upload-class type under the plain name `thing`, X8 the listed `frames` renamed): all 7 KILLED, each by a failing assertion in the coverage spec. **Two more shapes of my own** (V1 to V10 in the table): the camel-case file word (`coverImage`, `imageUrls`), an array of an upload-class type under a plain name (`slots`) and a file two classes down (`outer.inner.photo`) are KILLED. Two shapes slip through (T11): a bare lower-case name (`url`, `key`, `src`, `mediaUri`, `data`; the suffix test is case-sensitive, so `key` is not `Key`) and an array of a nested class whose property has an unlisted name (`sections[].thumb`). A multipart route has no body property at all: `POST /money/identity/documents` takes `@UploadedFiles()` (up to 10 MB, no tier); it forwards an identity document to Nuvion and keeps no copy, so free is right, but the spec could not see a product route built the same way.
6. **The migration: CONFIRMED.** Backend main's 122 folders applied first (the newest is `20261021110000_waitlist_claim_result`); `prisma migrate deploy` from the branch then applied exactly one folder, `20261021120000_product_drafts` (123 in `_prisma_migrations`), which sorts after every folder on main (`LC_ALL=C sort` agrees); `ProductDraft` has its primary key, the index and both CHECK constraints; the rollback lines run (table dropped, history row deleted, 122 left) and the folder applies again; `prisma migrate status` up to date; `prisma migrate diff` against `schema.prisma` shows only the `ContentPiece_specializations_idx` drop that main shows too (not this task). The folder differs from the round 2 one by its rollback line only. A fresh database takes all 123.
7. **The protected suite: CONFIRMED.** With the grant (`run.sh --fresh HEAD`, `PROTECTED_LOCK_REF=HEAD`, a private namespace, a fresh database): 253 of 253, "all 244 required tests passed", EXIT 0, 0 `MakerTier` rows left, on the branch and on the trial merge. Without it (the branch's code against main's suite and lock): 9 passed, 244 failed, "0 of 244 required tests passed", and all 244 are the one setup error `setup step POST /content as creator2 failed: 402 ... tier_required`, so the 402 is real and the grant is what lets the suite run. `.pipeline`, `scripts`, `.github` and both package files are byte-identical to main; the grant files are unchanged since round 2.
8. **Trial merges.** Backend main `b71c551` into the branch: **no conflicts** (the nine files it touches are bills and fintava files the branch does not change; the contract file is untouched, same sha). Mobile main `cdb528c`: already inside the branch (`Already up to date`), 0 conflicts; mobile `contract/openapi.json` equals the backend branch's byte for byte. Merged backend, in a private network namespace (own Postgres 16, a fresh migrated and seeded database of 123 folders, the stand-in on :6181 inside it, one jest worker): `src/content-piece`, `creator-state`, `storage`, `plans`, `admin/content-review`, `admin/creators`, `admin/kyc-review`, `account-purge` and `data-export-request`: **36 suites, 671 of 671 tests**, EXIT 0, on the branch and again on the merge (the builder's numbers); `tsc` 0; eslint, gates, `check_baseline` and `contract:build` as in V1 and V2.

**Defects**
- **D7 (low): `tier_required` offers tiers that would not let the person publish.** Reproduced with real pieces (`d7.js`, nothing set by hand): a person whose tick ended with N pieces up and who holds no tier is told "Publishing and uploading files need a tier. Pick one to carry on." with Verify (3), Plus (6) and Founding (10), and no pack. N = 9: buying Verify or Plus is refused ("You have 9 products and your plan allows 3 (or 6). To publish another, remove some or add more places."), Founding lets the 10th through. N = 12: all three are refused (after Founding: "remove some or add more places", because the pack would then help). N = 25: all three refused ("remove some."). The matrix saw the same in 24 of its 42 no-allowance states. **Severity low:** nothing is counted or charged wrongly, the very next answer tells the person the truth, and a tier still carries points and an event pass; but it is the D6 class one step earlier, at the step just before a payment, and reachable at launch (every tick that ends with pieces up), so worth closing before TIER-03 sells tiers. Not fixed here. The change would filter `tier_required`'s tiers to those with more products than `productsUsed` and say "remove some" when none is left; the builder's note is right that the contract promises "every tier" and the app's picker reads it, so the contract text moves with it. My mutant N18 is exactly that filter and no test fails, so no test pins today's offers either.

**Test and wording notes** (survivors of my own mutants and things read; none a product defect)
- **T9 (info): the take-down's give-up path is untested.** N6 (409 becomes 400), N7 (an em-dash in the 409 sentence) and N8 (100 passes instead of 3) survive every spec group. The status, the sentence and the cap are covered only by my live scripts (`d5s.js`, `d5c2.js`). A real-database test can reach it without luck: a second transaction holds the piece's row and changes the status before it lets go, three times in a row; or a unit double whose `updateMany` answers 0 three times.
- **T10 (info): the offers' use of `extraProducts` is not pinned through the service.** N23 (`PublishingAllowance.extraProducts` always 0) survives every spec: `limit-offers.spec.ts` feeds hand-made allowances and no HTTP test has extras on a person who is offered a tier. My live matrix kills it at once (Verify with 5 extras at 8 of 8 loses Plus and the pack). N22 (the extras of an ENDED tier count in the offers) also survives; the code ignores them, the safe side, and whether a later grant keeps stale extras is TIER-03's decision (`TierGrantService` leaves the column alone on a new tier), so no test should pin it yet.
- **T11 (info): the coverage spec is still a name and type guard.** V2 `url`, V3 `key`, V4 `mediaUri`, V5 `src`, V6 `sections[].thumb` and V9 `data` survive, and a multipart route is invisible (item 5). Cheap closes: make the suffix test case-insensitive and add `src`, `uri`, `link`; list routes whose handler has `@UploadedFile(s)` or `@ApiConsumes('multipart/form-data')`. Nothing today is missed: the routes with such names are the known ones.
- **T12 (info): two `NOT_GATED` reasons say more than the code does** (item 5): `PUT content/:id/media` ("a piece that has its place") and the two `verification/submissions` entries ("needed before a tier can be bought"). The classification (not a product, no tier) is right for both; the sentences should say "a piece of the person's own" and "the verification tick's documents".

**Notes (not defects)**
- N9: unchanged and out of scope: `AccountService` removes all of a deleted account's pieces in one bulk write without touching the counter. The person is gone; a take-down racing it answers 400 and returns nothing.
- N10: D6's offers rest on U5 (extras carry over an upgrade). TIER-03 and TIER-04 must keep it, or `limitOffers` must be revisited: "Plus at 8 of 8 on Verify with 5 extras" lets a publish through only if the 5 extras are kept.
- N11: for a tick holder the sentence says "your plan allows 25"; it is a tick, not a plan. Wording only (U6 stands).
- N12: the 402 offers are computed from a second read of the allowance made after the gate refused, the numbers from the first; only a change in between (a delete, a purchase) makes the two disagree, for one answer.
- N13: PR order unchanged from rounds 1 and 2: the gate, the grant and the migration go together; the relock label is the owner's; web publishing stays closed until TIER-03 sells a tier (G-663).

**Mutants** (34 of my own on round 3's code plus the builder's seven re-run, each applied to a throwaway copy `/home/user/wt/vbmut-TIER-02r3`, the specs that hold the rule run in order (four unit specs, then the race and admin contract specs, then the 54-test gate spec on a migrated database; the coverage spec alone for the T8 ones), the file restored and the tree clean after each)

| Mutant | Result | Killed by |
|---|---|---|
| N1 take-down flips on "any live status" instead of the status read | KILLED | the race spec (4) |
| N2 only a live piece gives a place back | KILLED | the race spec (2) |
| N3 the `slotsUsed > 0` guard removed | KILLED | the take-down unit spec |
| N4 the audit row always says a place was returned | KILLED | the race spec (2) |
| N5 three passes cut to one | KILLED | the race spec (5) |
| N6 giving up answers 400 instead of 409 | **SURVIVED** | T9 |
| N7 the 409 sentence carries an em-dash | **SURVIVED** | T9 |
| N8 100 passes instead of 3 | **SURVIVED** | T9 |
| N9 reject and approve: the pending check removed | KILLED | the admin contract spec |
| N10 reject returns no place | KILLED | the admin contract spec (5) |
| N11 approve also returns a place | KILLED | the admin contract spec (2) |
| N12 reject and approve audit row names the wrong previous status | KILLED | the admin contract spec (2) |
| N13 tiers judged without the extras bought | KILLED | `limit-offers.spec.ts` (2) |
| N14 the pack judged without its own count | KILLED | `limit-offers.spec.ts` (6) |
| N15 the pack offered to a tick holder | SURVIVED | equivalent: a tick holder at the limit has 25 or more up and 5 never exceeds that |
| N16 tiers judged against the smaller of used and allowed | KILLED | `limit-offers.spec.ts` (7) |
| N17 `tier_required` also offers the pack | KILLED | the gate spec |
| N18 `tier_required` offers only tiers above what is published (the D7 fix) | **SURVIVED** | D7: no test pins today's offers for a person with pieces |
| N19 "above" starts at the limit | KILLED | the message spec (7) |
| N20 "remove some" reads "remove them" | KILLED | the message spec (2) |
| N21 singular and plural swapped | KILLED | the message spec (2) |
| N22 the extras of an ended tier count | **SURVIVED** | T10 |
| N23 `PublishingAllowance.extraProducts` always 0 | **SURVIVED** the specs, KILLED by the live matrix | T10 |
| N24 the allowed number in the sentence is off by one | KILLED | the message spec (2) |
| X1 to X4, X6 to X8 (the builder's seven, rebuilt and run by me) | all 7 KILLED | the coverage spec |
| V1 `coverImage`, V7 an array of `UploadSlotDto` under `slots`, V8 `outer.inner.photo`, V10 `imageUrls` | all 4 KILLED | the coverage spec |
| V2 bare `url`, V3 bare `key`, V4 `mediaUri`, V5 `src`, V6 `sections[].thumb`, V9 `data` | all 6 **SURVIVED** | T11 |
| Live: the 0d9d3df take-down put back, built, `d5.js` against it | caught | reject then take-down drift 1 of 2 and 7 of 8 with a false audit trail; take-down with resubmit 3 of 8 and 4 of 8 |
| Live: N23 built, `d6m.js` against it | caught | omitted offers that work in the Verify-with-5-extras states |

Of my 34 (24 N and 10 V): 21 killed by the specs, 13 survived them (N6, N7, N8, N15, N18, N22, N23, V2, V3, V4, V5, V6, V9). N15 is equivalent, N18 is the D7 fix, N23 is killed by the live matrix, and the rest are the notes T9 to T11. The builder's seven: 7 of 7 killed.

**Capability checks, as written:** all six still pass (the gate spec holds each; the live runs above exercise 1 to 4 under concurrency and 5 and 6 through the tick states of the matrix).

**Checks run:** see V1, V2 and items 1 to 8. Spec runs: the 36 suites (671 tests) twice; before mutating, the fast set 43 of 43 and the race, admin contract and gate specs 90 of 90 on a clean tree.

**NOT RUN**
- The real wawu-id for the live seam (the Hub repo's stand-in was used), and the website (R-49).
- The whole backend suite (the 36 suites the brief names and the protected suite were run; the builder ran the whole suite in round 2 and round 3 changes only the files named).
- The mobile full check (typecheck, lint, jest): the mobile branch changes only the generated contract types and docs; `npm run gates` and `npm run tasks` are below.
- The `relock-approved` label and the relock decision: the owner's.
- A fix for D7: the verifier changes no product code.

## Builder report, round 4

Builder, 11 Oct 2026. wawu-backend `wmt/TIER-02` `8c90db5`; mobile `wmt/TIER-02` (this branch, this file). Backend main merged twice, no conflict: `b71c551` (BILLS-01 round 3) and then `74b501b` (WALLET-06 round 3, which moved while I worked and changed `contract/openapi.json` by descriptions). Newest migration folder on main is still `20261021110000_waitlist_claim_result`, so `20261021120000_product_drafts` still sorts after it and was not renamed. Mobile main `3df3b0a` merged: conflicts only in `SHARED-CHANGES.md` (both rows kept), `contract/SOURCE_COMMIT` and the generated `docs/PROGRESS.md` (regenerated).

Before and after on two Hub processes on one database (:6182 the merged tree before any round 4 change, :6184 the final tree) with a stand-in WAWU ID of my own on :6183 (:6181 is held by a leftover stand-in from the round 3 verifier, pid 1089, whose folder is deleted; I did not touch it). Scripts: the verifier's `d7.js` and `lib.js`, plus my `d7m.js` (the D7 matrix). Transcripts in the lead's scratchpad `tier02r4/`: `d7-before.txt`, `d7-after.txt`, `d7m-before.txt`, `d7m-after.txt`.

**Each ruling as built**
1. **D7 (`tier_required` offered tiers that would not let the person publish).** `tier_required` now offers only the tiers that, once bought, leave more places than the person has products published (the extras they would carry over count; a person with no running tier has none). New `tierRequiredOffers` in `src/plans/limit-offers.ts` shares one filter with `limitOffers`, and the route's interceptor uses it. When no tier would, the list is empty and the sentence (written again in `TierGateError.withOffers`, as the limit's already is) says what to do: "You have 12 products up and no plan has room for another. Remove some to publish." ("Your tier has ended. " in front when it has, "1 product" in the singular, no em-dash). With nothing published, or while a tier would leave a place, the sentences are exactly what they were. The pack is never offered with `tier_required` (it needs a running tier). The contract description of `reason.tiers` and `docs/contract/PLANS.md` section 6 say the rule instead of "every tier". *Before* (`d7.js`, the verifier's cases, real pieces, tick ended, no tier): 9 up: offers Verify, Plus, Founding; buying Verify or Plus is refused ("remove some or add more places"), Founding lets the 10th through; 12 up: all three refused; 25 up: all three refused. *After:* 9 up: "Publishing and uploading files need a tier. Pick one to carry on. Drafts stay free." with Founding only, and buying it answers 201; 12 up and 25 up: the "no plan has room" sentence above and `tiers: []`. *Matrix* (`d7m.js`: tick none or ended, an ended tier of none, Verify, Plus or Founding, and 0, 1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12 or 25 up = 104 situations; every tier is then bought, by writing the row a purchase writes, and the next publish tried): before, 248 mismatches (every tier offered, and 168 of the 312 tiers bought were then refused); after, **0 mismatches: 144 offered tiers all let the next publish through, 168 omitted tiers none would**, the sentence compared with one computed from the numbers in all 104, no dash in any body, `reason.message` equal to `message`.
2. **T9 (the take-down's give-up path was untested).** `take-down.spec.ts` gains three tests on the unit double, which can now lose the take-down's write a told number of times (a lost write moves the piece to the other of pending and rejected and changes no row): three lost writes answer a `ConflictException`, status 409, the exact sentence, no dash, exactly 3 reads and 3 writes, no audit row, the counter untouched, the piece not removed; two lost writes still succeed on the third pass (audit row names the status the winning pass changed, one place back); one lost write that leaves the piece rejected returns no place.
3. **T10 (`extraProducts` not pinned through the real allowance service).** `publishing-allowance.spec.ts` gains a block on the REAL `PublishingAllowanceService`: the allowance reports the running tier's extras (also while ending) and 0 for none, an ended tier and a tick alone; Verify with 5 extras at 8 of 8 is offered Plus, Founding and the pack by `limitOffers` fed from that allowance; and the D7 cases through it. `publishing-gate.contract.spec.ts` adds the same over HTTP on the real database (Verify with the pack bought, all places used: the tiers that count only WITH the extras are offered, and the test fails if they are not more than without them). N23 (extras always 0) is killed by both.
4. **T12 (two overstated `NOT_GATED` reasons).** `PUT content/:id/media` now says what the code allows: links to the person's own earlier `content/` uploads set as the frames of one of their own pieces that is not removed (waiting, live or turned down), creator accounts only, no tier asked. The two `verification/submissions` entries say they are the verification tick's documents, any signed-in account may send them for staff to review (one pending at a time), the verification levels are not maker tiers, and nothing is published. (No longer "needed before a tier can be bought".)
5. **T11 (the coverage spec was a name and type guard).** Done, in a few lines: the suffix test is case-insensitive and gains `uri`, `src` and `link` (so the bare `url`, `key`, `src` and `mediaUri` are seen), FILE_WORDS gains `thumb(s)`, `cover`, `poster`, `banner`, `avatar`, `icon`, `blob` and `data`, and a multipart route (an `@UploadedFile(s)` parameter or `multipart/form-data` on the handler) is found from the handler and listed in `MULTIPART_NOT_GATED` (today one: `POST money/identity/documents`, an identity document forwarded to the wallet provider, no copy kept). Four routes' lists gained a property under the wider names, each read in the code first: the featured works' `link` (two routes), a chat message's `attachment.key`, a legal deliverable's `files.url`. A new block holds the rules themselves on made-up bodies (bare names, suffixes, the file words, a file in a class nested in an array, two classes down, and the plain fields of a product left alone), so a weakened rule fails there and not only when a real route needs it. `sections[].thumb` is the same gap as any unlisted name inside a nested class; `thumb` is now a listed word and the nested array is read.
6. **Nothing else changed.** The protected suite grant is as round 2 built it.

**Mutants of this round** (each applied to the final tree, the specs that hold the rule run, the file restored from a copy; the tree was clean after each)

| Mutant | Result |
|---|---|
| T9 N6 giving up answers 400 | KILLED |
| T9 N7 an em-dash in the 409 sentence | KILLED |
| T9 N8 100 passes instead of 3 | KILLED |
| T9 one pass, two passes | KILLED, KILLED |
| T10 N23 allowance extras always 0 | KILLED by the unit spec (2) and by the HTTP spec (1), each alone |
| D7 N18 `tier_required` offers every tier again (the old behaviour) | KILLED (3) |
| D7 the filter uses `>=`; the filter ignores the extras; the pack offered with `tier_required` | KILLED, KILLED, KILLED |
| D7 the "remove some" sentence also when nothing is up | KILLED |
| D7 `withOffers` keeps the old sentence; the sentence loses "Your tier has ended."; an em-dash in the sentence | KILLED, KILLED, KILLED |
| T11 suffix test case-sensitive again; `thumb` words dropped; `data` dropped; nested arrays not read | KILLED x4 |
| T11 multipart: neither detection | KILLED |
| T11 multipart: the parameter test alone removed; the swagger test alone removed | SURVIVED, SURVIVED: equivalent, the only multipart route has both, so either alone sees it |
| Verifier's V2 `url`, V3 `key`, V4 `mediaUri`, V5 `src`, V9 `data`, each added to a profile body | all KILLED |

**Checks.** On backend `8c90db5` unless said.
- `npx tsc --noEmit` 0. eslint (no `--fix`) 0 problems on the 19 `.ts` files changed this round (my 10 and main's merged files). Prettier clean on the files I wrote.
- Specs in a private network namespace (`unshare -n`, its own Postgres 16, UTF8), a fresh database migrated with all 123 folders and seeded, the stand-in inside it, one jest worker: `src/content-piece`, `src/creator-state`, `src/storage`, `src/plans`, **all of `src/admin`** (wider than the verifier's three admin folders), `src/account-purge`, `src/data-export-request`: **48 suites, 1281 tests; 1255 passed in the first run and the other 26 are one suite, `src/admin/payments/tests/admin-payments.contract.spec.ts`**, which failed in the namespace only because Node's `fetch` could not reach `localhost` there (`fetch failed` at its login helper). The same suite in the same kind of namespace with the stand-in addressed as `127.0.0.1`: 26 of 26; and outside the namespace on a shared database: 26 of 26. So 1281 of 1281 with that one address difference.
- Protected suite, `run.sh --fresh HEAD` with the branch's own suite and lock (`PROTECTED_LOCK_REF=HEAD`), same namespace: **253 of 253, "all 244 required tests passed", EXIT 0, 0 `MakerTier` rows left**.
- Gates: 16 FAIL, the same 16 FAIL lines as main `74b501b` (one line number moved, `content-piece.service.ts:46` to `:48`, as in rounds 2 and 3), warnings 96 against 95 (the same one new warning as in round 3, `PROVISIONAL(PRODUCT-DRAFTS-MAX)`), 76 accepted; `check_baseline` ok, 108 entries.
- `npm run contract:build` twice after the last merge: byte-identical (sha256 `efc4fcd1...`) and equal to the committed file. Only descriptions differ from main: this task's `reason.tiers` text, and main's WALLET-06 text. Synced to mobile: file copied from the backend branch, `SOURCE_COMMIT` `wmt/TIER-02@8c90db5`, `python3 scripts/api/sync_contract.py` (the generated client changes by those descriptions only).
- Mobile: `npm run gates` EXIT 0 (0 fail, 5 warn, 568 files, baseline 0); `npm run tasks` EXIT 0 (below). No app code changed by this task, so the full check was not run.

**NOT RUN**
- The real wawu-id for the live seam (the stand-in was used), and the website (R-49).
- The whole backend suite (48 suites of the areas this task touches and the protected suite were run).
- The verifier's D5 and D6 live matrices (`d1b.js`, `d5.js`, `d6m.js`): the code they exercise did not change this round, only the take-down's spec; `d6m.js` also asserts the old `tier_required` offers, so it would now report them.
- The relock label: the owner's.
- The mobile full check (typecheck, lint, jest): no app code changed.

**Observations (not changed, for the lead)**
- The `tier_required` sentence for an ended tier still says "Renew it" while the tier that ended may not be on offer: an ended Verify (3) with 5 up is offered Plus and Founding but not Verify. The ruling kept the sentence while any tier is on offer, so I left it; a shorter "Pick a plan" would always be true.
- Tiers are judged one purchase at a time, as in round 3: a person with no tier and 12 up is told to remove some, though Founding plus the pack (15 places) would let a publish through. The pack can only be bought on a running tier, and the rule is the lead's.
- A leftover stand-in WAWU ID of the round 3 verifier (pid 1089, folder deleted) still listens on :6181.

## Verifier report, round 4

Verifier, 11 Oct 2026 (independent; wrote none of this). Backend `wmt/TIER-02` `8c90db5` (round 4 code is `6d9bfa2`) in the detached worktree `/home/user/wt/vb-TIER-02r4`, built and run as two Hub processes (:6182 and :6183) on one database with the Hub repo's stand-in WAWU ID on :6181; mobile `wmt/TIER-02` `dcd57ed` in `/home/user/wt/v-TIER-02r4`. Trial merges (throwaway copies, never pushed): backend main is now `020f055` (MONEY-18 rounds 2 to 4, #117; the branch has `74b501b`) in `/home/user/wt/vbm-TIER-02r4`, merge commit `b7de957`; mobile main `94b8f7c` in `/home/user/wt/vm-TIER-02r4`. Evidence (scripts, logs): the lead's scratchpad `vtier02r4/`. No Fintava, Nuvion, Flutterwave, wawuafrica.com or AI host was called. People signed in through the stand-in's real `/auth/register` and `/auth/login`. I changed no product code, test, lock or harness.

**Verdict: `review`. No blocker.** D7 is closed: on 1767 situations of my own and 330 of the round 3 matrix every tier the answer offers lets the next publish through, and no tier it leaves out would. T9 to T12 hold: every named mutant is killed (33 of 33 that can be; the 2 survivors are equivalent), and so are 15 of my 17 on round 4's code. Three low wording points and one test gap, none a blocker: D8 and D9 are the builder's two observations (both reproduced, both mislead a person a little), D10 is a shape the filter did not consider (the file-edit entrance), T13 is six file words nothing pins.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed | `tsc --noEmit` 0 on the branch and on the merge. Gates: 16 FAIL, the same 16 FAIL lines as main `020f055` on the merge (one line number moved, `content-piece.service.ts:46` to `:48`, as in rounds 2 and 3), warnings 96 against 95 (the one new is `PROVISIONAL(PRODUCT-DRAFTS-MAX)`), 76 accepted; `check_baseline` ok, 108 entries. eslint (no `--fix`) on the 91 changed `.ts` files of the merge: 524 problems, all in the same 11 older files that have 525 on main; the files round 4 wrote or changed have 0. |
| V2 Contract | passed | `contract:build` twice on the merge: byte-identical (sha256 `efc4fcd1...`), equal to the committed file (the tree stays clean) and to mobile `contract/openapi.json` on the branch and on the merge; `SOURCE_COMMIT` is `wmt/TIER-02@8c90db5`. Regenerating the client from the merged mobile contract changes nothing. |
| V3 Regression | passed under the grant | `run.sh --fresh HEAD`, `PROTECTED_LOCK_REF=HEAD`, private namespace, fresh database: **253 of 253, "all 244 required tests passed", EXIT 0, 0 `MakerTier` rows left**, on the branch and on the merge. |
| V4 Field trace | passed | Round 4 touches no writer of `slotsUsed`; D5 re-run below. |
| V9 Live seam | passed (stand-in WAWU ID); NOT RUN (real wawu-id) | D5, D6 and D7 live on two Hubs. |

**The brief's items**

1. **D7, `tier_required` offers only tiers that would let the person publish: CONFIRMED.**
   - *My `d7.js` (round 3, nothing changed in it), real pieces, tick ended, no tier:* 9 up: "Publishing and uploading files need a tier. Pick one to carry on. Drafts stay free." with Founding only, and buying it answers 201 (before: Verify, Plus, Founding, two of them refused); 12 up and 25 up: "You have 12 products up and no plan has room for another. Remove some to publish." (25 likewise), `tiers: []`, no pack.
   - *My own matrix, `d7v.js`:* tick none, ended or held x no tier, or an ended or running Verify, Plus or Founding with 0, 5 or 10 extras x 0 to 30 live products = 3 x 589 = **1767 situations**. For every refusal the script BUYS each tier (writes the row a purchase writes; the extras left on an ended tier's row stay, as `TierGrantService` leaves them) and publishes again, and BUYS the pack on a running tier. Result: **0 mismatches.** 620 `tier_required` and 468 `product_limit_reached` refusals (679 states were below the allowance and published). **464 offered tiers, all 464 let the next publish through; 2800 omitted tiers, none would** except 270 that work only through the stale extras of an ended tier's row (the safe side: the offers ignore those extras on purpose, see N14). The pack: 90 listed, all 90 work; 318 omitted, none would. The pack is never on a `tier_required` answer (620 of 620). The sentence is compared with one I write from the numbers (1088 answers): 0 mismatches; `reason.message` equals `message`, `productsUsed` and `productsAllowed` equal my numbers, no em-dash or en-dash in any body. Held tick: never `tier_required` (a tick holder is at 25 or more before a limit), 114 limit refusals, none offers a tier. The sentences, in plain words: nothing up or a tier would fit, the old two ("Publishing and uploading files need a tier. Pick one to carry on. Drafts stay free." and, for an ended tier, "Your tier has ended. Renew it to publish or upload files. Everything you published stays up."); otherwise "[Your tier has ended. ]You have N product(s) up and no plan has room for another. Remove some to publish." with "1 product" in the singular.
   - *Entrances:* `d7x.js`: at 8 up, 11 up and an ended Plus with 4 up, the create, both presigns, resubmit and draft publish give the same sentence and offers (3 of 3). The file-edit entrance is D10.
   - *`d6m.js`, expectations updated before I read its result.* The script judged `tier_required` as "all three tiers offered, no pack". I changed three things: (a) the expected offers for no-allowance states are the tiers whose products exceed the products up, and never the pack; (b) a sentence check there (the script had none for those states): the two plain sentences, or the "no plan has room" one with the numbers; (c) the states: used 0, 2, 3, 5, 6, 9, 10, 12 and 25 for no-allowance cases (it had 0, 12, 25), and for each, every tier bought and tried, listed ones must work and omitted ones must not (extras left on an ended tier's row counted apart). Result on this tree: 330 states (34 below, 34 at the limit, 136 above, 126 `tier_required`), **0 mismatches**; limit states as in round 3: 108 listed offers all work, 544 omitted none would; 80 omitted tiers in `tier_required` states work only through stale extras.
2. **The builder's two observations.** Both reproduced on real pieces (`d7r.js`).
   - **D8 (low): "Renew it" when the ended tier is not on offer.** Ended Verify (3), 5 pieces up: "Your tier has ended. Renew it to publish or upload files. Everything you published stays up." with Plus and Founding offered. A person who does what the sentence says (renews Verify) is refused: `product_limit_reached`, "You have 5 products and your plan allows 3. To publish another, remove some or add more places.", Plus and the pack offered; Plus bought instead answers 201. **It misleads**, narrowly: the sentence promises something false for a person whose ended tier holds no more than the products they have up, and it could cost them a renewal that unlocks nothing. Softened because the same body lists the tiers that work and nothing is charged by this task (TIER-03 sells tiers). A sentence that never says "Renew it" while that tier is not in `tiers` ("Pick a plan to carry on.") would always be true.
   - **D9 (low): one purchase at a time.** No tier, 12 up: "You have 12 products up and no plan has room for another. Remove some to publish.", `tiers: []`. Founding bought: `product_limit_reached`, "...remove some or add more places.", the pack offered (5 more); the pack bought as well: 201 (15 places). **It misleads a little:** "no plan has room" is true of plans, but the pack is one more purchase away and the sentence points only to deleting; someone may remove up to 3 products they could have kept. Softened because the next answer names the pack. With one pack 15 places is the most, so at 16 up and more "remove some" is the whole truth. The lead's rule stands as written; widening it means judging a tier with the pack on top, and the sentence then needs ", or add more places".
3. **T9, the take-down's give-up path: CONFIRMED.** N6 (409 becomes 400), N7 (an em-dash in the sentence), N8 (100 passes), one pass, two passes: all 5 KILLED, each by `take-down.spec.ts`. The three tests read right against the service: three lost writes give a 409 with the exact sentence, exactly 3 reads and 3 writes, no audit row, the counter untouched, the piece not removed; two lost writes still succeed on the third pass with the audit row naming the status the winning pass changed; one lost write leaving the piece rejected returns no place. My own: the loop stopping at the first lost write (`continue` becomes `break`) KILLED (3); the rejected piece returning a place (test inverted) KILLED (4). The live side still holds: `d5s.js` (25 rounds of 6 take-downs under a status storm): 150 requests, 25 x 200, 110 x 400, 15 x 409, the body is the sentence, a 409 leaves no audit row and no removed piece; `d5c2.js`: 3 of 3.
4. **T10, `extraProducts` through the real allowance service: CONFIRMED.** N23 (extras always 0) KILLED by the unit specs (2) and by the HTTP spec (1), each alone. My own: an ended tier's extras counted (N22) KILLED (1), so the new block now pins that too; an `ending` tier not counted as running KILLED (3); the offers filter ignoring the extras KILLED (5).
5. **T11, the coverage spec: CONFIRMED.** The builder's V2 `url`, V3 `key`, V4 `mediaUri`, V5 `src`, V9 `data` and **V6 `sections[].thumb`** (an array of a nested class): all 6 KILLED; so are bare `poster`, `banner`, `icon`, `avatar`, `blob` and `cover` added to a profile body (6 of 6). The rules block holds: suffix test case-sensitive again, `thumb` words dropped, `data` dropped, nested arrays not read, `uri` dropped, `src` dropped: 6 of 6 KILLED (and `link` dropped, my K, KILLED). **Multipart:** the walk finds `POST money/identity/documents` (the spec asserts the found keys equal `MULTIPART_NOT_GATED`'s, and renaming that key KILLS it); both detections removed KILLED; either alone SURVIVES, equivalent (the one multipart route, `FileFieldsInterceptor` and `@UploadedFiles()` in `src/nuvion/documents/documents.controller.ts`, has both; I searched `src` for other `FileInterceptor`, `UploadedFile`, `multipart/form-data`, `multer`, `busboy` and raw-body uploads and found no second route). T13 is the one gap.
6. **T12, the `NOT_GATED` reasons and the four routes whose lists grew: CONFIRMED, with one clarification.** Read against the code: `PUT content/:id/media` ("the person's own earlier content/ uploads set as the frames of one of their own pieces that is not removed, waiting, live or turned down; creator accounts only, no tier asked") is exact: `ContentMediaService.set` refuses only `removed` (and a piece that is not a photo set for frames), `CreatorAccountGuard`, `ownedFrameKeys` = the person's own `content/` keys with a `StorageObject` row; `d8.js` still shows a rejected piece taking frames with no tier (200). The two `verification/submissions` reasons are exact (`WawuAuthGuard` only, one pending at a time, resubmit only after a turn-down, the levels are `VERIFICATION_TIER_VALUES`, not maker tiers). The new properties: `chats/:chatId/messages` `attachment.key` is a chat storage key (real file); `legal/ops/requests/:id/deliverables` `files.url` is a `legal/document/` storage key or link (real file, admin guards); **`users/me/featured-works` (POST and PATCH) `link` is NOT a file**: it is a web address (or a `wawu/...` hint), stored and shown, never fetched (`cleanLink`). The list is a name guard and the reason says "a link to the work", so nothing is false; info only. Dropping each of the three properties from its list: 3 of 3 KILLED (the lists are held exactly).
7. **D5 and D6 re-run once on this tree: no regression.** `d1b.js` 32 of 32 (16 pair cases both ways round), `d5.js` 32 of 32 (pairs, triple, quad, ordered and 10 at once; slotsUsed equals the live pieces, audit chain true, no 5xx), `d6r.js` 2 of 2 (every gated entrance gives one sentence and one set of offers at and above the limit), `d8.js` 1 of 1, `d5s.js` and `d5c2.js` as in item 3, `d6m.js` as in item 1.
8. **The protected suite with the grant:** 253 of 253, 0 tier rows after (V3).
9. **Trial merges.**
   - **Backend** `origin/main` `020f055` (the branch has `74b501b`): **0 conflicts** (merge commit `b7de957`, 23 files of MONEY-18 and the wallet provider, none this task changes; `contract/openapi.json` untouched). Main's newest migration is now `20261021115000_wallet_hold_outcome_check`, which sorts before `20261021120000_product_drafts` (`LC_ALL=C sort` agrees), so the branch's folder still sorts last and needs no rename; a fresh database takes all 124 folders. Merged tree in a private network namespace (own Postgres 16, a fresh migrated and seeded database, the stand-in addressed as 127.0.0.1, one jest worker): `src/content-piece`, `creator-state`, `storage`, `plans`, all of `src/admin`, `account-purge`, `data-export-request`: **48 suites, 1281 of 1281 tests**, EXIT 0, including `admin-payments.contract.spec.ts` (26 of 26) with the stand-in at 127.0.0.1.
   - **Mobile** `origin/main` `94b8f7c` into `dcd57ed`: **2 conflicts, both generated files**: `contract/SOURCE_COMMIT` (`wmt/TIER-02@8c90db5` on the branch, `74b501b` on main: keep the branch's) and `docs/PROGRESS.md` (regenerate with `python3 scripts/tasks/check_tasks.py --write`). Everything else merges clean (`SHARED-CHANGES.md`, `docs/LOG.md` and the contract files by text). Resolved in the throwaway: `npm run gates` EXIT 0, `npm run tasks` EXIT 0.

**Defects and notes**
- **D8 (low)**, **D9 (low):** items 2 above. Both are the wording of the answer, not the counting; neither blocks.
- **D10 (info): the file-edit entrance shares the filtered offers.** `PATCH /content/:id` with `previewAsset` or `fullAsset` asks only whether the person may publish at all (`assertMayUpload`, no room), so ANY tier lets it through. With 12 pieces up and no tier it answers `tier_required`, `tiers: []`, "...Remove some to publish."; after buying Verify, Plus or Founding the same edit answers 200 (`d7e.js`); with 4 up it offers Plus and Founding and omits Verify, which would also work. The round 3 table in `PLANS.md` section 6 already says this route asks no room. Info, not low: a new file still needs a presign, which does ask for room, so only a key uploaded earlier reaches this edit; nobody loses anything. Closing it means the refusal carrying whether the entrance asks for room.
- **T13 (info): the file words added this round are not pinned.** FILE_WORDS gained `cover`, `poster`, `banner`, `avatar`, `icon`, `blob`; the rules block names `thumb`, `coverImage`, `frames`, `video` and `folder`, and no real route lists a property that only those words catch. Removing `poster`, `banner` and `icon` from the list (my mutant I) leaves all 12 coverage tests green. Adding such a property to a body is still caught (6 of 6), so today's walk is right; a later edit of the list would not be noticed.
- N14: stale extras of an ended tier. `TierGrantService` leaves `extraProducts` alone on a new tier (as in round 3, N22), and the offers ignore an ended tier's extras (the safe side, and now pinned by a test). If TIER-03 keeps them, "no plan has room for another" can be false for a person whose ended tier carried extras (270 omitted tiers in my matrix would work); if TIER-03 clears them on a re-grant, the rule is exact. Whichever it decides, the grant and the rule must agree.
- N15: downstream readers. The app does not read the 402 yet (only the generated types mention it). WEBPAY-04 says the web "opens Make it official on `tier_required`", and TIER-03 and TIER-04 build pickers: they must treat `tiers: []` on `tier_required` as "show `message`", not open a picker with all three tiers, or the person buys a tier that does not let them publish.
- N16: `tierRequiredOffers` is `limitOffers` for a person with no running tier (my mutant L, the interceptor using `limitOffers` for both, survives all specs: equivalent). Harmless duplication, named so nobody removes one thinking it differs.
- N17: backend main moved to `020f055` after the builder's merge of `74b501b`; merge it before the PR (0 conflicts today).
- N10 and N11 from round 3 stand (extras carry over an upgrade, U5; "your plan allows 25" for a tick holder).

**Mutants** (applied to a throwaway copy `/home/user/wt/vbmut-TIER-02r4`, the specs that hold the rule run, the file restored and the tree clean after each; unit specs 75 tests and the 59-test gate spec on a migrated database)

| Mutant | Result | Killed by |
|---|---|---|
| T9 N6 giving up answers 400; N7 an em-dash in the sentence; N8 100 passes; one pass; two passes | all 5 KILLED | `take-down.spec.ts` (1, 1, 1, 3, 2) |
| T10 N23 extras always 0 | KILLED | the unit specs (2), the HTTP spec (1), each alone |
| D7 N18 `tier_required` offers every tier again | KILLED | the gate spec (3) |
| D7 "remove some" also when nothing is up; `withOffers` keeps the old sentence | KILLED, KILLED | message spec (1); message and gate specs (3) |
| T11 V2 `url`, V3 `key`, V4 `mediaUri`, V5 `src`, V9 `data`, V6 `sections[].thumb` | all 6 KILLED | coverage spec |
| T11 bare `poster`, `banner`, `icon`, `avatar`, `blob`, `cover` | all 6 KILLED | coverage spec |
| T11 suffix case-sensitive; `thumb` words dropped; `data` dropped; nested arrays not read; `uri` dropped; `src` dropped | all 6 KILLED | coverage spec |
| T11 multipart: neither detection; the one route's key renamed in the list | KILLED, KILLED | coverage spec |
| T11 multipart: the parameter test alone removed; the swagger test alone removed | SURVIVED, SURVIVED | equivalent: the one multipart route has both |
| T12 `link` / `attachment.key` / `files.url` dropped from their route's list | all 3 KILLED | coverage spec |
| A the filter uses `>=` | KILLED | limit-offers, allowance and gate specs (15) |
| B `tierRequiredOffers` offers the pack | KILLED | the same three (7) |
| C singular and plural swapped in the new sentence | KILLED | message and gate specs (4) |
| D "Your tier has ended." for a person with no tier | KILLED | message and gate specs (4) |
| E "no tier" means fewer than two tiers | KILLED | message and gate specs (3) |
| F take-down: a lost write stops the loop (`continue` to `break`) | KILLED | take-down spec (3) |
| G take-down: a rejected piece returns a place | KILLED | take-down spec (4) |
| H the extras of an ENDED tier count (N22) | KILLED | allowance spec (1) |
| I FILE_WORDS loses `poster`, `banner`, `icon` | **SURVIVED** | T13 |
| K `link` dropped from the coverage suffix test | KILLED | coverage spec (3) |
| L the interceptor uses `limitOffers` for `tier_required` | SURVIVED | equivalent (N16) |
| M `withOffers` passes the allowed number as the number up | KILLED | message and gate specs (3) |
| N the sentence loses "no plan has room for another" | KILLED | message and gate specs (4) |
| O the filter compares with 0 instead of the products up | KILLED | 31 tests in the three plan specs |
| P the limit filter ignores the extras | KILLED | limit-offers, allowance and gate specs (4) |
| Q an `ending` tier does not run | KILLED | allowance and gate specs (3) |
| R the offers filter ignores the extras | KILLED | limit-offers, allowance and gate specs (5) |

Of the builder's named mutants and the variants of them (33): 33 killed, 2 survive and are equivalent. Of my 17 (A to R, no J): 15 killed, 2 survived (I is T13, L is equivalent). The assertion-deleting mutants (a check changed to `[]`) survive trivially and are not counted.

**Checks run:** see V1 to V9 and items 1 to 9. Spec runs: the unit group (5 suites, 75 tests) and the gate spec (59 tests) clean before mutating; the 48-suite group on the merge once; the protected suite twice.

**NOT RUN**
- The real wawu-id for the live seam (the stand-in was used), and the website (R-49).
- The whole backend suite (the 48 suites of the areas this task touches and the protected suite were run; main's own unrelated suites were not).
- The mobile full check (typecheck, lint, jest): the mobile branch changes only the generated contract types, docs and the task file; `npm run gates` and `npm run tasks` are below.
- The `src/*` areas above on the branch alone: they ran on the merge, which contains the branch (the builder ran them on the branch); only the protected suite ran on both.
- A real purchase: TIER-03 sells tiers, so "once bought" is the row a grant writes, as in rounds 2 and 3.
- The `relock-approved` label and the relock decision: the owner's.

## Builder report, round 5

Builder (Sonnet agent), 11 Oct 2026. wawu-backend `wmt/TIER-02` `3a8b57d` (round 5 code; the merge of main is `c425fd0`); mobile `wmt/TIER-02` (this branch, this file). Backend main `020f055` merged with 0 conflicts. Its newest migration folder is `20261021115000_wallet_hold_outcome_check`, which sorts before `20261021120000_product_drafts` (`LC_ALL=C sort`), so nothing was renamed; a fresh database takes all 124 folders. Mobile main `3b35731` merged with three conflicts: `contract/SOURCE_COMMIT` (kept the branch's, now `wmt/TIER-02@3a8b57d`), `docs/PROGRESS.md` (regenerated) and `BACKEND_GAPS.md` (both sides' rows kept: this task's G-660 to G-664 and main's G-461 to G-465).

**Each ruling as built** (the lead's rulings for round 5, Default (lead), owner may override)
1. **D8 ("Renew it" when the ended tier is not on offer).** Reproduced first, on the merged tree before any change, as a new HTTP spec on the real database and the real modules (supertest, the real interceptor, a tier row written as a purchase writes it): an ended Verify (3) with 5 up answered 402 `tier_required` with Plus and Founding offered and the sentence "Your tier has ended. Renew it to publish or upload files. Everything you published stays up." Verify is not among the tiers offered (3 is not more than 5), and renewing it is still refused (402; the verifier saw `product_limit_reached`, "You have 5 products and your plan allows 3..."), while Plus bought instead answers 201 (both asserted in the same spec). A second spec over every tier and 0, 3, 6, 10 and 12 up failed at the first situation where the ended tier is not on offer (ended Verify with 3 up). *After:* the sentence says "Renew it" only when the ended tier is among the offered `tiers`. Otherwise: "Your Verify plan has ended. You have 5 products up, and a bigger plan has room for them." (the tier's name from the plan, the number from `productsUsed`, "1 product ... for it" in the singular, no dash). The offers, the body and the status are unchanged. Built as: `PublishingAllowance` gains `endedTierId` (null unless the stored tier has ended); the route's interceptor names that tier from the plan and passes it to `TierGateError.withOffers(offers, endedTier)`; `tierRequiredMessage(tierState, used, offers, endedTier)` decides. The ended tier is used for the wording only and is not in the body, so the contract is unchanged. Where the tier cannot be judged the old sentence stays: the bare refusal before the offers are added (or when they cannot be built), and a call with no ended tier. A tier the config no longer names reads "Your plan has ended. You have 5 products up, and another plan has room for them." (or "Pick a plan to carry on." with nothing up). With no tier on offer and products up, the round 4 sentence ("... no plan has room for another. Remove some to publish.") stands. `docs/contract/PLANS.md` section 6 says the rule. *Matrix* (HTTP spec, real database): 3 ended tiers x 0, 3, 6, 10 and 12 up = 15 situations; "Renew it" appears in exactly the 6 where the ended tier is on offer, and in those 6 renewing it lets the next publish through (201); in the 9 where it does not, renewing is refused (402) and the sentence is the new one (3 of them: Verify at 3 and at 6 up, Plus at 6 up) or the round 4 "remove some" one (6: no tier leaves a place at 10 or 12 up); the presign answers in the same words in all 15.
2. **T13 (six file words not pinned).** `publishing-gate-coverage.spec.ts` gains one test per word for `cover`, `poster`, `banner`, `avatar`, `icon` and `blob`, each bare and at the end of a longer name (`sectionCover`, `videoPoster`, `eventBanner`, `userAvatar`, `appIcon`, `rawBlob`). Taking any one word out of FILE_WORDS fails the test of that word and no other (all 6 killed, each by its own test; the verifier's mutant I, `poster`, `banner` and `icon` together, is covered by three of them). No product code changed for this.
3. **D9, D10, N14, N15: recorded, no change.** D9 (a tier plus the pack together) is an owner question: it is item 7 under "For the owner". D10 (the file-edit entrance, `PATCH /content/:id` with `previewAsset` or `fullAsset`, asks only whether the person may publish at all, so with 12 up and no tier it answers `tier_required` with `tiers: []` though any tier would let that edit through): info, nobody loses anything because a new file needs a presign that does ask for room; closing it means the refusal carrying whether the entrance asks for room. N14 (an ended tier's `extraProducts` stay on its row, the offers ignore them, the safe side): TIER-03's grant and this rule must agree on whether a re-grant keeps or clears them. N15 (the app does not read the 402 yet): TIER-03, TIER-04 and WEBPAY-04 must treat `tiers: []` on `tier_required` as "show `message`", never open a picker with all three tiers.
4. **Nothing else changed.** The offers, the counting, the gate, the grant and the contract text are as round 4 left them.

**Mutants of this round** (each applied to the final tree one at a time, the specs that hold the rule run, the file restored from memory; the tree was clean after each; script `tier02r5/mutate5.py` in the lead's scratchpad)

| Mutant | Result |
|---|---|
| T13 FILE_WORDS loses `cover`; `poster`; `banner`; `avatar`; `icon`; `blob` (each alone) | all 6 KILLED, each by the test of its own word |
| D8 the interceptor never passes the ended tier | KILLED (2) |
| D8 the "is it on offer" test inverted | KILLED (7) |
| D8 the tier's name always empty; a constant name | KILLED (2), KILLED (2) |
| D8 `endedTierId` always null | KILLED (2) |
| D8 the number up replaced by a constant | KILLED (2) |
| D8 "it" and "them" swapped | KILLED (6) |
| D8 an em-dash in the new sentence | KILLED (7) |
| D8 the new sentence decided before the round 4 "remove some" one | KILLED (1) |
| D8 a person with no tier gets the ended wording | KILLED (3) |
| D8 the new sentence never used (the round 4 behaviour back) | KILLED (3) |

**Checks.** On backend `3a8b57d`.
- `npx tsc --noEmit` 0. eslint (no `--fix`) 0 problems on the 6 changed `.ts` files. Prettier clean.
- Specs in a private network namespace (`unshare -n`, its own Postgres 16, a fresh database migrated with all 124 folders and seeded, the stand-in WAWU ID inside it addressed as 127.0.0.1, one jest worker): `src/content-piece`, `src/creator-state`, `src/storage`, `src/plans`, all of `src/admin`, `src/account-purge`, `src/data-export-request`: **48 suites, 1297 of 1297 tests, EXIT 0** (round 4 had 1281; this round adds 16: 2 HTTP, 8 message, 6 coverage).
- Protected suite, `run.sh --fresh HEAD` with the branch's own suite and lock (`PROTECTED_LOCK_REF=HEAD`), same namespace: **253 of 253, "all 244 required tests passed", EXIT 0, 0 `MakerTier` rows left**.
- Gates: 16 FAIL, the same 16 FAIL lines as main `020f055` (one line number moved, `content-piece.service.ts:46` to `:48`, as in rounds 2 to 4), warnings 96 against 95 (the one new is `PROVISIONAL(PRODUCT-DRAFTS-MAX)`), 76 accepted; `check_baseline` ok, 108 entries.
- `npm run contract:build` twice: byte-identical (sha256 `efc4fcd1...`), equal to the committed file (the tree stays clean) and to mobile `contract/openapi.json`. This round changes no contract text (the sentence is a string; the ended tier is not in the body). `SOURCE_COMMIT` is `wmt/TIER-02@3a8b57d`; `python3 scripts/api/sync_contract.py` regenerates the client with no change.
- Mobile: `npm run gates` EXIT 0 (0 fail, 5 warn, 569 files, baseline 0); `npm run tasks` EXIT 0 (below). No app code changed by this task, so the full check was not run.

**NOT RUN**
- A live Hub process: the verifier's `d7r.js` was not run on a built Hub. The HTTP spec (real modules, real database, the route's real interceptor) is the before and after.
- The real wawu-id for the live seam (the stand-in was used), and the website (R-49).
- The whole backend suite (the 48 suites of the areas this task touches and the protected suite were run).
- The verifier's live matrices (`d1b.js`, `d5.js`, `d6m.js`, `d7v.js`): the counting did not change; `d7v.js` judges the sentence against one the verifier writes from the numbers, so it would report the new ended-tier wording.
- The mobile full check (typecheck, lint, jest): no app code changed.
- The relock label: the owner's.

## For the owner

Seven questions the verifier raised (the seventh, D9, in round 4). Each says what is built (Default (agent), owner may override).
1. **Perpetual ticks (U1).** Any tick `holdsTick` accepts keeps 25 products, including a perpetual one (`verifiedUntil` empty, given to accounts moved off the old ladder, or granted by an admin). PAYMENTS-PLAN question 3 says people who paid keep publishing until the tick ends; a perpetual tick never ends, so those accounts publish 25 products for ever with no tier. The code cannot tell a bought tick from a granted one. How many accounts is a read-only query on production before launch.
2. **Featured video (U2).** Featured works (`profile/work`) take photos and `video/mp4` up to 100 MB on any signed-in account with no tier, are not counted in content storage, and show publicly on the profile. R-43 says "uploading any file"; built as "build a profile free". Does a showreel video need a tier?
3. **Media frames (U3).** `PUT /content/:id/media` accepts links to files the person already uploaded (the earlier gated presign), on a waiting or live piece, with no tier. It only re-orders files already paid for; documented in `PLANS.md` section 6. Keep it free?
4. **The `slotsUsed` audit (U4).** `productsUsed` is a counter, not a count of pieces. Pieces removed or turned down before the decrements existed may have left it too high, so a creator could be told "3 of 3" with fewer live pieces. Run before launch (read-only): `SELECT cs."wawuUserId", cs."slotsUsed", count(cp.id) FILTER (WHERE cp.status NOT IN ('rejected','removed')) FROM "CreatorState" cs LEFT JOIN "ContentPiece" cp ON cp."creatorWawuId"=cs."wawuUserId" GROUP BY 1,2 HAVING cs."slotsUsed" <> count(cp.id) FILTER (WHERE cp.status NOT IN ('rejected','removed'));` (no rows on the test database).
5. **Extras across an upgrade (U5).** At the limit the offers list every tier with more products than the one held, extras ignored, so a person on Verify with 5 extras (8 products) is offered Plus (6). That is right only if extras carry over an upgrade; TIER-03 and TIER-04 must keep them.
6. **`GET /me/tier` `productsAllowed` for a tick holder (N1).** It is the tier's figure (plus extras) while `productsUsed` is the gate's count, so a tick holder with no tier reads "6 of 0" there while `GET /creator/state` says 25. The meter on VF12 and VF14 should read `slotsTotal`, or `productsAllowed` should become the gate's figure.
7. **A tier and the pack together (D9, round 4 verifier).** A person with no tier and 12 products up is told "You have 12 products up and no plan has room for another. Remove some to publish." with no tier offered, because each offer is judged as ONE purchase and the pack can only be bought on a running tier. Founding (10 places) plus one pack (5 more) is 15 places, so two purchases would let them publish, and the sentence points only to removing products: someone may take down up to 3 products they could have kept. With one pack 15 places is the most, so at 16 up and more "remove some" is the whole truth. Built: one purchase at a time (the lead's round 5 ruling: record, no change). If the owner wants "a tier plus the pack" judged, the offers filter counts a tier with the pack on top and the sentence gains ", or add more places"; the pack stays off `tier_required` until a tier is bought, so the answer to the second purchase is the limit answer that already names the pack.

## Owner sign-off
