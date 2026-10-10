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

Builder, 10 Oct 2026. wawu-backend `wmt/TIER-02` 389ffba (backend main `8e57981` merged in); mobile `wmt/TIER-02`
(this branch) (this file, mobile main `b04cbe6`). depends_on TIER-01 and ME-17 are `done`. No screens: `artboards: []`, so
no pictures; the app change is the regenerated contract and types. This task moves no money and calls no provider.

**Headline for the lead: the protected suite cannot be 253/253 on the main lock, by design.** The suite's own setup
publishes a piece with a brand-new creator (`POST /content as creator2`), and R-43 says a new person with no tier is
refused. Run A (code `f48c3e4`, lock origin/main `8e57981`, fresh database; `389ffba` adds only specs and a type-only change): setup step 402, 244 of 244 required tests
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
- Drafts (new, free, no tier asked): `ProductDraft` table (migration `20261020150000_product_drafts`, additive, rollback
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
- Mobile: `contract/openapi.json` copied from the backend branch (`SOURCE_COMMIT` `wmt/TIER-02@389ffba`) and
  `python3 scripts/api/sync_contract.py` (without `--backend`, which copies backend main): `ProductDraftView`,
  `TierGateErrorEnvelope`, `MyTierView.productsUsed` are in `schema.generated.ts`. `npm run check` @@MOBILE_CHECK@@.

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

## Owner sign-off
