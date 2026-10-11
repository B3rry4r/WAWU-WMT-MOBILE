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
- Drafts (new, free, no tier asked): `ProductDraft` table (migration `20261021030000_product_drafts`, additive, rollback
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

Builder, 11 Oct 2026. wawu-backend `wmt/TIER-02` `0d9d3df`; mobile `wmt/TIER-02` (this branch, this file). Backend main `6976aad` merged in (MONEY-18, WALLET-06, the BILLS-01 hotfix, INBOX-05): one conflict, `docs/contract/CONVENTIONS.md`, both sections kept, TIER-02's is now `## 19.` (ruling 7). Mobile main `2d5f648` merged in: conflicts only in `BACKEND_GAPS.md` and `SHARED-CHANGES.md` (both sides kept), the generated `docs/PROGRESS.md` (regenerated) and `contract/SOURCE_COMMIT`.
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

## For the owner

Six questions the verifier raised. Each says what is built (Default (agent), owner may override).
1. **Perpetual ticks (U1).** Any tick `holdsTick` accepts keeps 25 products, including a perpetual one (`verifiedUntil` empty, given to accounts moved off the old ladder, or granted by an admin). PAYMENTS-PLAN question 3 says people who paid keep publishing until the tick ends; a perpetual tick never ends, so those accounts publish 25 products for ever with no tier. The code cannot tell a bought tick from a granted one. How many accounts is a read-only query on production before launch.
2. **Featured video (U2).** Featured works (`profile/work`) take photos and `video/mp4` up to 100 MB on any signed-in account with no tier, are not counted in content storage, and show publicly on the profile. R-43 says "uploading any file"; built as "build a profile free". Does a showreel video need a tier?
3. **Media frames (U3).** `PUT /content/:id/media` accepts links to files the person already uploaded (the earlier gated presign), on a waiting or live piece, with no tier. It only re-orders files already paid for; documented in `PLANS.md` section 6. Keep it free?
4. **The `slotsUsed` audit (U4).** `productsUsed` is a counter, not a count of pieces. Pieces removed or turned down before the decrements existed may have left it too high, so a creator could be told "3 of 3" with fewer live pieces. Run before launch (read-only): `SELECT cs."wawuUserId", cs."slotsUsed", count(cp.id) FILTER (WHERE cp.status NOT IN ('rejected','removed')) FROM "CreatorState" cs LEFT JOIN "ContentPiece" cp ON cp."creatorWawuId"=cs."wawuUserId" GROUP BY 1,2 HAVING cs."slotsUsed" <> count(cp.id) FILTER (WHERE cp.status NOT IN ('rejected','removed'));` (no rows on the test database).
5. **Extras across an upgrade (U5).** At the limit the offers list every tier with more products than the one held, extras ignored, so a person on Verify with 5 extras (8 products) is offered Plus (6). That is right only if extras carry over an upgrade; TIER-03 and TIER-04 must keep them.
6. **`GET /me/tier` `productsAllowed` for a tick holder (N1).** It is the tier's figure (plus extras) while `productsUsed` is the gate's count, so a tick holder with no tier reads "6 of 0" there while `GET /creator/state` says 25. The meter on VF12 and VF14 should read `slotsTotal`, or `productsAllowed` should become the gate's figure.

## Owner sign-off
