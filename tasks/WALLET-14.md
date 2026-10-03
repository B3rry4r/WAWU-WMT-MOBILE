---
id: WALLET-14
title: Saved recipients and payout account
owner: YOU
area: WALLET
order: 116
priority: launch
repo: wawu-backend
type: backend-endpoint
status: building
depends_on: [MONEY-06, KYC-01]
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# WALLET-14 · Saved recipients and payout account

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)

## Goal

A21, W17: a saved payout bank with a real bank code, checked against the BVN name.

## Scope

Beneficiaries; payout account with bank code and resolved name (through the Fintava client, MONEY-06), checked against the BVN name (KYC-01).

## Capability checks

- [ ] A payout account whose name doesn't match the BVN name is flagged.
- [ ] A saved recipient can be removed.

## Builder report

Builder, 3 Oct 2026. Backend `wmt/WALLET-14` `514d3ad` (main `6d48c97`, unmoved, plus `wmt/MONEY-13` `35b68af` merged in `bd35548`, as the lead asked); mobile `wmt/WALLET-14` (on main `12aa3c9`, unmoved).
- **Built (backend, additive):** serves the five routes MONEY-04 declared: `GET`/`POST /money/beneficiaries`, `DELETE /money/beneficiaries/{id}`, `GET`/`PUT /money/payout-account` (`src/money/saved-accounts/`: controller, `BeneficiaryService`, `PayoutAccountService`, `BankAccountCheckService`, spec), each route behind MONEY-13's gate (`@RequireOpenWallet()`, `@CurrentWallet()`; my stand-in `open-wallet-gate.ts` deleted, G-47 handled), declarations removed from `money-transfer.controller.ts`. Migration `20261003160000_saved_beneficiaries_payout_account` (`MoneyBeneficiary`, `MoneyPayoutAccount`, nullable `WalletIdentity.bvnNameKeys`), purge map, one new code `beneficiary_limit_reached` (409), contract regenerated, CONVENTIONS section 10, WALLET.md. Small edits in other tasks' files: KYC-01's `wallet-identity.service.ts` and `identity-config.ts` (the name keys), MONEY-12's `wallet-opening.service.ts` (`beneficiaryCount` now counts), `money.module.ts` (one controller, three providers, `WawuAuthModule`; merged with MONEY-13's gate providers). MONEY-13's two route lists (`wallet-gate-coverage.spec.ts`, `wallet-gate.contract.spec.ts`) gain the five routes, nothing else in them changed.
- **Mobile:** `contract/` and `src/api/schema.generated.ts` from the branch (SHARED-CHANGES WALLET-14 #2); `docs/fintava/sandbox/37-wallet14-recipients.md`; G-46, G-47. No screen (A21 is WALLET-11's).
- **The BVN name:** KYC-01 kept no name, so the BVN check now stores, with every passed check, the keyed hash (`IDENTITY_HASH_KEY`) of each word of the BVN record's first and last name; never the name. A bank account is saved only with a bank code in Fintava's list and a name check that confirms it (`00`, a name, the same number); the name is the bank's, a body carrying one is 400.
- **Check 1, a payout account whose name doesn't match the BVN name is flagged:** passed. Through the real `POST /money/identity/bvn` (Fintava's documented BVN body, Ada B Sandbox) then `PUT /money/payout-account`: bank name `SANDBOX ADA` gives `matchesBvnName: true`, `SIMI MICHELLE` is saved and answers `false` (also on GET); `null` with no check, no name kept, or a wallet opened under another BVN check. Unit spec: order, case, accents, missing middle name match; an initial or one name only is flagged.
- **Check 2, a saved recipient can be removed:** passed. DELETE answers 200 and the list and `WalletView.beneficiaryCount` drop it; again, or someone else's id, is 200 and removes nothing; on the built Hub too (below).
- **Also proved (spec, 27 tests + 17 unit):** name check refusals 422 and nothing changes; Fintava 500, hang-up, refused key, 1.5 s timeout and bank list 502 are 503 with nothing saved; old CBN code `044` refused before Fintava; WAWU user saved only with a wallet (409/404/400 self); same place saved 4 at once is one row; 49 saved + 3 at once gives 201, 409, 409 (cap 50 under a per-person lock); 401 without token, 409 `wallet_not_open`/`wallet_opening` with nothing sent; no account number, name, BVN or NIN in any log line; no name word in any column. Mutation-checked (12): always-match, delete any owner's, no lock, ignore `matched`, ignore the number, any bank code, self allowed, mixed body, no keys stored, no wallet gate (before and after the merge: one `@RequireOpenWallet()` removed fails 11 tests), no opening tie: all killed.
- **Sandbox (V9 seam):** built Hub :4951, stand-in WAWU ID :4952, real login, 3 free GETs (`/banks`, `/name/enquiry` x2, stub `0123456789`/`000013`): saved and read back `GTBANK PLC`, `SIMI MICHELLE`; B saw nothing of A's. 0 key windows in log and output.
- **Runs (after the MONEY-13 merge, `514d3ad`):** tsc 0; eslint 0 on all 27 `.ts` files changed against main; the 6 suites that hard-code :4001 (kyc-submission, notification, blocked-account, privacy-settings, saved-item, credits-state) 6/6 suites, 62/62 tests (my mock on :4001 once `lsof` showed it free, stopped after); full suite on fresh `w14_full_test`: 126 suites, 3,065 passed, 3 skipped, 0 failed (gate specs 45/45, mine 27/27); protected `--fresh HEAD` 253/253, lock `6d48c97` unchanged; tripwire 0 added lines; `hub-rate-limits` 10/10 (no `@Throttle` added); gates main 16 fail / 10 warn, branch 16 / 11 (the added warn is `PROVISIONAL(BENEFICIARIES-MAX)`), same 16 fails, baseline OK; `contract:build` unchanged by the merge (mobile copy byte-identical). Mobile `npm run check`: main exit 1 (PROGRESS.md out of date on main; 20 suites 371 tests, gates 0 on 96 files), branch exit 0 (typecheck, lint, 20 suites 371 tests, gates 0 fail / 0 warn on 96 files, 203 tasks). Before the merge (`a53fe14`) the same checks passed, except that :4001 was held by another session.
- **NOT RUN:** `matchesBvnName` against a real sandbox BVN record (no sandbox BVN passes, question 11). The sandbox seam (3 calls, above) ran before the MONEY-13 merge; the gate reads only our database, and its HTTP spec covers the five routes.
- **Defaults (agent), owner may override:** flag, not refuse, a payout account in another name (G-46); match rule (every word of first and last name, any order, middle name not needed); at most 50 beneficiaries, PROVISIONAL; a person holding both ticks shows the creator tick (`MoneyPartyView` has one); bank list kept an hour; a saved WAWU user shows only while they have a wallet; `POST` answers 201 for an existing one too; "Creators only" on A21 not enforced (listed as not a fact).
- **Findings for other tasks:** WALLET-09's `name-check` and these saves both reveal an account holder's name for any number (Fintava's free check, global throttle only); a per-person limit there would cover both.

### Builder round 2 (3 Oct 2026)

Backend `wmt/WALLET-14` `377ea31`: round 2 fixes on `origin/main` `48b9043` (MONEY-14, on MONEY-13 `c1d23b5`), merged in `4738953` (conflicts in `money.module.ts`, the served-route list, both gate specs' route lists and CONVENTIONS section 0, kept from both sides). Mobile `wmt/WALLET-14` with main `85a4e57` merged (gap, shared-change and sandbox rows kept from both sides; contract and types regenerated from `377ea31`).
- **Defect 1, the BVN name could be read back without the key: fixed.** Each word is now `HMAC(IDENTITY_HASH_KEY, "name:" + wawuUserId + ":" + bvnVerifiedAt + ":" + WORD)`, stored as `{ v: 2, check, first, last }`; `check` is the same HMAC over `name:check:<wawuUserId>:<bvnVerifiedAt>`. So the same word differs for every person and every check, and a stored hash can no longer be matched to a plain name in another table. Old-scheme keys, keys from another check, and keys under a changed `IDENTITY_HASH_KEY` read as `null`, never `false` (this also covers the verifier's note 4). Migration `20261003170000_bvn_name_keys_bound` clears any old-scheme values at rest.
  - Proved over HTTP: three people named Ada (one with nothing saved) get three different `ADA` keys, and no key appears in two rows. The verifier's keyless join (each stored key and the people holding it) finds every key held by exactly one person, and no key equals a word hashed on its own. An old-scheme value and a rotated-key value each read as `null`. Unit tests cover the same for two people and two checks of one person.
  - Mutations, each killed: the binding dropped (5 tests fail), and the `check` comparison dropped (2 fail).
  - The migration was applied to a database holding one old-shape row and one new-shape row: only the old one was cleared.
- **Defect 2, a hidden row held one of the 50 places: fixed.** The cap counts exactly the rows the list shows, under the same per-person lock, and `beneficiaryCount` counts them too (`visibleBeneficiaries`).
  - Test: 49 bank accounts plus one saved person is full (409). That person's wallet then goes, as the purge removes it: the list shows 49, two saves at once give one 201 and one 409, and the list and count are 50. Every visible row can still be removed.
  - Mutation, killed: going back to counting all rows (1 test fails).
- **Bank list:** fetched once for saves that arrive together (single flight). Test: 10 parallel first saves make 1 `GET /banks`. A test now pins the hour: just inside it, the list is not fetched again; past it, it is fetched once. The verifier's surviving mutant (expiry ignored) is now killed, and so is "no single flight".
- **Runs (on `377ea31`):**
  - tsc 0; eslint 0 on all 19 `.ts` files changed against main.
  - Money, Fintava, identity, purge, gate and rate-limit specs: 37 suites, 1,413/1,413.
  - Full suite on a fresh `w14_full_test`, my mock on :4001 (`lsof` empty before, stopped after): 130 suites, 3,147 passed, 3 skipped, 0 failed. This includes the 6 suites wired to :4001 and the specs above: WALLET-14's 31, `bvn-name` 19, gate 45, `hub-rate-limits` 10.
  - Protected suite `--fresh HEAD`: 253/253, lock `48b9043` unchanged. Tripwire: 0 added lines.
  - Gates: main `48b9043` 16 fail / 12 warn, branch 16 / 13, the same 16 fails; the one added warning is `PROVISIONAL(BENEFICIARIES-MAX)`. Baseline OK.
  - `contract:build` is byte-stable, and the contract has the same 280 paths as main; only the five routes and `MoneyErrorReason` differ.
  - Mobile `npm run check` with main `85a4e57` merged: exit 0 (typecheck, lint, 20 suites, 371 tests, gates 0 fail / 0 warn on 96 files, 203 tasks).
- **Not re-run:** the sandbox seam. Round 2 changes no Fintava call, and the verifier's V9 (3 calls) stands. NOT RUN, as in round 1: `matchesBvnName` on a real sandbox BVN record (question 11).

### Owner questions (the match rule, G-46; the rule is unchanged)
1. Extra words match: `OKORO ADA CHIDI ENTERPRISES` and `ADA OKORO-BELLO` match Ada Okoro, as does a different Ada Okoro with a middle name. Should a business or joint account naming the person count as their own?
2. An apostrophe name gives a one-letter word (`O'Brien` is `O` + `BRIEN`), and any initial O satisfies it. Should one-letter words be ignored, or joined to the next word?
3. Letters with no accent to strip (`Ø`, `Ł`) are dropped, so `Øyvind` reads `YVIND`. That gives a false flag, which is the safe side. Should they be transliterated (`O`, `L`)?

## Verifier report

Verifier, 3 Oct 2026, a fresh session that wrote none of this task's code. Checked wawu-backend `wmt/WALLET-14` `514d3ad` (on main `6d48c97`, with `wmt/MONEY-13` `35b68af` merged in `bd35548`) and mobile `wmt/WALLET-14` `4fdc0b5`, each in a fresh detached worktree (`/home/user/wt/vw14b`, `/home/user/wt/vw14m`). Neither main moved. WALLET-14's own work judged on `git diff 35b68af...514d3ad` plus the merge resolution (`money.module.ts` and `CONVENTIONS.md` only: both notes kept, MONEY-13's gate providers beside WALLET-14's controller and services, nothing dropped). My own databases `vw14_*` (all containing `test`, dropped afterwards), ports 4953 (built Hub) and 4954 (stand-in WAWU ID), and :4001 once, for the full suite, only after `lsof` showed it free (my mock, stopped right after). Fintava was a local stand-in serving the sandbox's recorded shapes, except the V9 run and one slip (note 6). Evidence: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vw14/` (below, `vw14/`). **Verdict: 2 open defects, status back to building.**

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed | Backend: `tsc --noEmit` 0; eslint (no `--fix`) on all 27 `.ts` files changed against main: 0; gates 9 run / 630 files scanned / 16 fail / 11 warn / 76 accepted against main `6d48c97` 16 / 10 / 76 on 619 files: the 16 FAIL entries are main's, file, line and message identical, and the one new warning is `PROVISIONAL(BENEFICIARIES-MAX)`; `check_baseline.py` passes (108 entries); no gate, baseline or `.pipeline` file changed. Mobile `npm run check` exit 0 before and after this report: typecheck, lint, 20 suites / 371 tests, gates 9 run / 96 files scanned / 0 fail / 0 warn, 203 tasks. Key scan: all 58 eight-character windows of the Fintava sandbox key (65 characters, read with `sed` into the scanner's environment, never printed) against both branch diffs from main, both branches' full `git log -p`, and every Hub log and output of mine: 0 hits. `vw14/tsc.txt`, `eslint.txt`, `gates-branch.txt`, `gates-main.txt`, `mobile-check-*.txt`, `secret-scan.txt` |
| V2 Contract | passed, with the defects below | Full suite the way `deploy.yml` runs it: fresh migrated and seeded `vw14_deploy_test`, my mock WAWU ID from `mock-wawu-id/server.js` on :4001 with a keypair made as `deploy.yml` makes it, the CI admin secrets, `npx jest --runInBand --forceExit`: **126 of 126 suites, 3,065 passed, 3 skipped, 0 failed**, every one of the 126 suites `jest --listTests` lists, the 6 wired to :4001 among them (`kyc-submission`, `notification`, `blocked-account`, `privacy-settings`, `saved-item`, `credits-state`). Money, Fintava and identity specs alone: 31 suites, 1,317 passed (KYC-01's identity and throttle specs, KYC-02's selfie specs, MONEY-12's opening specs, MONEY-13's gate specs, MONEY-06's client specs). On the built Hub with the real login: all five routes 409 `wallet_not_open` with no wallet and 401 with no token; a body carrying `accountName` or `bankName` 400 ("property accountName should not exist"); bank codes `044`, `058`, `000999` (not in Fintava's list) 422 `name_check_failed` with 0 name checks sent; a name check answering `status: false`, `responseCode` `25`, another account number, a blank name, or no account: 422 and the saved payout account unchanged; a mixed body or a missing field 400; a non-UUID id 400; `self_transfer` 400; unknown person 404. Unexpected format: the old CBN code `044`. `npm run contract:build` on the branch reproduces `contract/openapi.json` byte for byte, and it equals the mobile copy; the mobile subset and `schema.generated.ts` regenerate byte for byte from it (`sync_contract.py` on the branch's contract, `git status` clean). Against main: same 277 paths, only the five routes' `x-wawu-served`, operation ids, tags and texts and `MoneyErrorReason` changed. `vw14/full-suite-4001.txt`, `targeted-money-fintava.txt`, `probe1-out.txt` |
| V3 Regression | passed | `scripts/protected-routes/run.sh --fresh HEAD` (code `514d3ad`, lock `origin/main` `6d48c97`): **253/253, all 244 required**; `lock-diff.py`: no change; `.pipeline`, `src/protected-routes`, `test/protected-routes` untouched. CI tripwire over the 4,250 added lines outside the checker's own files: 0 matches. `src/tests/hub-rate-limits.contract.spec.ts` 10/10, no `@Throttle` or `@SkipThrottle` added. Migration `20261003160000_saved_beneficiaries_payout_account` on a database at main `6d48c97`: schema dumps differ only by the two tables, their keys and indexes and the new nullable `bvnNameKeys` (the one "removed" line is `updatedAt` gaining a comma); the header's rollback gives main's schema back exactly; `prisma migrate diff` shows only main's existing `ContentPiece_specializations_idx` drift. `vw14/protected.txt`, `tripwire.txt`, `rate-limits.txt`, `migration-diff.txt` |
| V4 Field trace | passed | `MoneyBeneficiary`: written by `POST /money/beneficiaries`, read by `GET /money/beneficiaries` and `WalletView.beneficiaryCount` (`GET /money/wallet`), removed by `DELETE` and the purge (OWNED by `ownerWawuId`, COUNTERPARTY on `recipientWawuId`). Across people: A's saved B showed B's WAWU ID name, then B's new handle, avatar and creator tick, then the tick gone once it lapsed, each on A's next read. `MoneyPayoutAccount`: written by `PUT`, read by `GET`, OWNED. `WalletIdentity.bvnNameKeys`: written by the BVN check on a pass, read only by the payout account's `matchesBvnName`; every other `WalletIdentity` read selects its fields, so no route answers it. No screen reads any of it yet (WALLET-11, WALLET-03, WALLET-02, WALLET-06). `vw14/v4-field-trace.txt` |
| V9 Live seam | passed | Built Hub on :4953 against `https://dev.fintavapay.com/api/dev`, two people registered on the stand-in WAWU ID and signed in through its `/auth/login` (no minted token): `PUT /money/payout-account` `000013`/`0123456789` saved `GTBANK PLC`, `SIMI MICHELLE` (the bank's name), `matchesBvnName: null`; `POST /money/beneficiaries` the same account 201; both read back; B saw `[]` and `null`. 3 free GETs (`/banks`, `/name/enquiry` x2), 11:35:39 UTC. `vw14/v9-seam.txt` |

**Capability checks**
- A payout account whose name doesn't match the BVN name is flagged: **passed against the documented BVN shape; NOT RUN against a real sandbox record** (no BVN the sandbox accepts is known, `docs/fintava/sandbox/README.md` question 11; unblocked when Fintava names one). Built Hub, real `POST /money/identity/bvn` (record Ada B Sandbox), then `PUT /money/payout-account`: `SANDBOX ADA` true, `SIMI MICHELLE` false, `ADAM SANDBOX` false, and GET says false; no check, or no key: null.
- A saved recipient can be removed: **passed.** `DELETE` 200 `data: null`; the list and `beneficiaryCount` drop it (2 to 1); B deleting A's id: 200 and A's row still there.

**Focus results**
- Privacy: no BVN, NIN, phone, name or account number in any log line of the Hub runs (0 hits); `bvnNameKeys` is HMAC-SHA256 under `IDENTITY_HASH_KEY` over `name:<WORD>` (recomputed; a plain SHA-256 mutant fails 3 tests). No key: the boot warns, the BVN check answers 503 `provider_unreachable` so no keys are written, and the payout account answers `matchesBvnName: null` (`vw14/no-key.txt`). Both tables purge with the account. But see defect 1.
- Money safety: a name the bank did not return, or a code not in the list, is never saved (above). Another person's list, payout account and ids: nothing read, changed or removed. Cap: 49 held plus 20 parallel POSTs, 3 rounds, and a 10 people plus 10 accounts mix: exactly one 201 and 19 `409 beneficiary_limit_reached` each time, 50 rows. Duplicates: 20 parallel saves of one account and 20 of one person, 3 rounds: one row each, all 20 answers the same id. 20 parallel first `PUT`s of the payout account, 3 rounds: 20 x 200, one row, GET agrees (`vw14/probe3-concurrency.txt`, `probe4-put-race.txt`; distinct client addresses so the global throttle does not hide the database).
- Name match (`vw14/name-edge-cases.txt`, 27 cases): case and extra spaces match; ADA vs ADAM, OKORO vs OKOROAFOR, `ADAOKORO`, a single-word bank name, `A OKORO` for Ada: all false (whole words only, no substring match). Hyphen and apostrophe split into words (`MARY JANE OKORO` true for Mary-Jane; `MARYJANE` and `OBRIEN` false, the safe side). No false `true` for another name; see note 1 for extra words.
- Shared files: KYC-01's `identity-config.ts` changes only the `hash()` kind union and its comment; `wallet-identity.service.ts` only adds the name keys to the fields it already upserts (the key is checked before any of it runs); MONEY-12's `wallet-opening.service.ts` only counts `beneficiaryCount` (its state line is MONEY-13's merged `walletStateOf`). The KYC, identity, Fintava and opening specs pass unchanged (above). MONEY-13's two spec files gain exactly the five route entries and a reworded test title.
- Mutations (my own 14, none of the builder's 12, against the WALLET-14, `bvn-name`, purge-map and opening specs, baseline 123/123): **13 killed**: any one name word enough, last name not compared, accents kept, a blank bank name accepted, cap off by one, oldest first, wallet-less saved people still listed, payout account not purged, payout GET cacheable, bank list outage read as `name_check_failed`, `beneficiaryCount` 0, unkeyed SHA-256, a person without a profile answered "no wallet". **1 survived**: the bank list kept forever (`BANK_LIST_TTL_MS` ignored) fails no test. The worktree was clean afterwards. `vw14/mut/mutations.txt`

**Findings**
1. **defect (privacy): the BVN name can be read back from `bvnNameKeys` without `IDENTITY_HASH_KEY`.** Each word is hashed as `HMAC(key, "name:" + WORD)` with nothing of the person in it, so the same word gives the same hash for everyone, and the same database holds names in plain text beside it (`MoneyPayoutAccount.accountName`, `MoneyBeneficiary.accountName`, MONEY-12's `FintavaWallet.accountName`). Anyone reading the database (a dump, a backup, a support query) can match hashes to words without the key. Reproduction (`vw14/probe/probe2*.js`, output `vw14/probe2-name-linkage.txt`): 7 people pass the real BVN check on the built Hub; 6 save a payout account; a query using only the tables (no key) assigns each hash the word it co-occurs with most. It reads back the first name `ADA` of "Ada Bello", who passed the check but has no wallet and no payout account (before this branch, nothing of her name was in the Hub's database), and `ADA` for Ada Sandbox, whose payout account is in another name (`ADAM SANDBOX`). The same `ADA` hash (`bc3f9612...`) sits in three people's rows. With real numbers of users almost every common name word is recoverable this way. CONVENTIONS section 10 says the keys are kept "never the name"; in practice the name is recoverable. Only the same person's keys are ever compared, so nothing needs the hash to be equal across people.
2. **defect (minor): a saved person whose account is deleted still takes one of the 50 places, invisibly.** The purge keeps `MoneyBeneficiary.recipientWawuId` (COUNTERPARTY) and the list hides it, but the cap counts every row. Reproduction (`vw14/probe3-concurrency.txt`, last line): 49 saved accounts plus one saved person; that person's wallet removed as the purge removes it; the list shows 49 and `beneficiaryCount` 49, and the next save answers `409 beneficiary_limit_reached` "You can save up to 50 beneficiaries. Remove one to add another." The hidden row's id is never shown again, so it can never be removed: the person is held at 49 for good.
3. unclear (owner, G-46's rule): the match accepts any number of extra words, so a business or joint account naming the person matches: `OKORO ADA CHIDI ENTERPRISES` and `ADA OKORO-BELLO` are true for Ada Okoro, as is a different Ada Okoro with a middle name. An apostrophe name gives a one-letter word (`O'Brien` is `O` + `BRIEN`), which any initial O satisfies. Letters with no accent to strip (`Ø`, `Ł`) are dropped (`Øyvind` reads `YVIND`): a false flag, the safe side.
4. Note: changing `IDENTITY_HASH_KEY` turns every stored match into `false` (flagged), not `null`: Ada Sandbox's `SANDBOX ADA` read false under a new key (`vw14/no-key.txt`). The BVN hashes would break with it too, so key rotation needs its own plan whatever happens here.
5. Note: the bank list has no single flight: 20 saves at once on a cold cache made 20 `GET /banks` calls (free). And no test pins the one-hour expiry (mutation survivor above).
6. Note, my own slip, disclosed: at 11:50:11 to 11:50:13 UTC one probe meant for the local stand-in reached the sandbox Hub I had left running on :4953 (its process outlived a `kill` of the wrong PID). It sent one extra free `GET /name/enquiry` (the stub `0123456789`/`000013`) and one `GET /compliance/verify/bvn` with a made-up BVN (`...2233`), answered 400 "Invalid BVN or BVN does not exist"; the sandbox charges ₦5 for that (`docs/fintava/sandbox/25-compliance-charges.md`). No live host was called; the key appears 0 times in that log. So 5 sandbox calls in all, not 3.

Files checked against the report: the backend's 32 files against main (24 of them WALLET-14's own against `35b68af`) and the mobile's 11 match the builder's list (the report names `bvn-name.ts`, its spec, the DTO, enum and error-status edits by what they do); nothing missing or extra. No stand-in remains: `open-wallet-gate.ts` is gone and the routes use MONEY-13's gate.

**To close:** defect 1 (put something of the person into each word's hash, or otherwise stop a key-less reader matching words across people), defect 2 (count what the list shows, or let such rows go), and a test that pins the bank list's hour.

### Verifier report, round 2

Verifier, 3 Oct 2026, a fresh session that wrote none of this task's code. Checked wawu-backend `wmt/WALLET-14` `377ea31` (main `48b9043` merged in `4738953`; WALLET-14's own work judged on `git diff 48b9043...377ea31`, 25 files) and mobile `wmt/WALLET-14` `7755de8`, in fresh detached worktrees `/home/user/wt/vw14b2` and `/home/user/wt/vw14m2`. Backend main did not move. Mobile main moved during this check (`85a4e57` to `331a6fa`, the AUTH-05 merge); merging it in conflicts only in `SHARED-CHANGES.md` and the generated `docs/PROGRESS.md`, nothing of this task. My databases `vw14r2_*` (all containing `test`, all dropped), built Hub on :4955, stand-in WAWU ID on :4956, and :4001 once for the full suite after `lsof` showed it free (my mock, stopped right after). Fintava was a local stand-in with no Fintava key in its environment (the Hub had a dummy key pointed at it): **0 sandbox calls, 0 live calls**. Evidence: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vw14r2/` (below, `vw14r2/`). **Verdict: round 1's two defects are closed; 1 new minor defect, status back to building.**

| Pass | Result | Evidence |
|------|--------|----------|
| Migration order | passed | WALLET-14's `20261003160000_saved_beneficiaries_payout_account` shares MONEY-14's timestamp. (a) Production case: a database with main `48b9043`'s 80 migrations applied (plus a `WalletIdentity` row), then the branch's `npx prisma migrate deploy`: exit 0, applies exactly the two WALLET-14 migrations, MONEY-14's row and checksum untouched, the existing row reads `bvnNameKeys` null. (b) Fresh database: all 82 apply, exit 0. `prisma migrate status` after each: "Database schema is up to date!", exit 0. The two schema dumps are identical; `migrate diff` against `schema.prisma` shows only main's existing `ContentPiece_specializations_idx` drift on both. The data migration clears `{first,last}`, `v:3`, arrays and JSON null, keeps `v:2`. No rename needed. | `vw14r2/mig-1..4*.txt`, `schema-prod-vs-fresh.diff` |
| V1 Gates | passed | `tsc --noEmit` 0. Gates 9 run, 638 files, **16 fail / 13 warn** / 76 accepted; main `48b9043` 16 / 12 on 631 files. The 16 FAIL entries are identical, and the one added warning is `PROVISIONAL(BENEFICIARIES-MAX)`. `check_baseline.py` OK (108). Mobile `npm run check` exit 0 before and after this report: typecheck, lint, 20 suites / 371 tests, gates 9 run / 96 files / 0 fail / 0 warn, 203 tasks. Key scan: the 58 eight-character windows of the Fintava key (read with `sed` into the scanner's environment) against both branch diffs, both branches' `git log -p` from main, and every Hub log and probe output of mine: **0 hits**. | `tsc.txt`, `gates-branch.txt`, `gates-main.txt`, `gates-warn-diff.txt`, `mobile-check-*.txt`, `secret-scan.txt` |
| V2 Contract | passed | Full suite the way `deploy.yml` runs it: fresh migrated and seeded `vw14r2_deploy_test`, my mock from `mock-wawu-id/server.js` on :4001 with a keypair made as `deploy.yml` makes it, the CI admin secrets, `npx jest --runInBand --forceExit`: **130 of 130 suites, 3,147 passed, 3 skipped, 0 failed** (`jest --listTests` lists 130). `npm run contract:build` leaves `contract/openapi.json` byte for byte, and it equals the mobile copy; `sync_contract.py` regenerates the mobile subset and `schema.generated.ts` with `git status` clean. Against main: the same 280 paths; only the five routes and `MoneyErrorReason` differ. | `full-suite-4001.txt`, `contract-vs-main.txt`, `mobile-api-regen.txt` |
| V3 Regression | passed | `scripts/protected-routes/run.sh --fresh HEAD` (code `377ea31`, lock `origin/main` `48b9043`): **253/253, all 244 required**; `lock-diff.py`: no change. CI tripwire over the 3,278 added lines outside the checker's files: 0 matches. `hub-rate-limits.contract.spec.ts` 10/10, the spec unchanged and no `@Throttle`/`@SkipThrottle` added. Merge with main: both gate specs' route lists are main's 12 plus WALLET-14's 5 (only additions and a longer test title, no assertion removed or loosened). All five routes are gated (409 `wallet_not_open` with no wallet, 401 with no token, 0 Fintava calls). MONEY-14's `src/money/pin` and the gate's source are unchanged. | `protected.txt`, `lock-diff.txt`, `tripwire.txt`, `rate-limits.txt`, `probe-spot.txt` |
| V4 Field trace | passed | `WalletIdentity.bvnNameKeys` is written only by the BVN check, in the same upsert as `bvnVerifiedAt`, and read only by `PayoutAccountService.matchesBvnName`; no route answers it. Nothing else writes `WalletIdentity.bvnVerifiedAt`; the selfie and opening rows have their own column of that name. Round 1's trace of `MoneyBeneficiary`/`MoneyPayoutAccount` stands. `beneficiaryCount` and the cap both read `visibleBeneficiaries`. | code read, `probe-link.txt` |
| V9 Live seam | NOT RUN this round | This brief allowed no Fintava calls, and round 2 changes no Fintava call (diff: `bank-account-check.service.ts` only adds single flight around the same `listBanks`). Round 1's V9 (3 sandbox GETs) stands. Unblocked by a round that permits sandbox calls. |

**Round 1 defect 1 (BVN name readable without the key): closed.** On the built Hub, 8 people passed the real `POST /money/identity/bvn` (five named Ada, one with no wallet and no payout account, one Ngozi Ngozi) and 7 saved payout accounts. Each stored value recomputes exactly as `HMAC(key, "name:" + wawuUserId + ":" + bvnVerifiedAt.toISOString() + ":" + WORD)`, with `check = HMAC(key, "name:check:" + wawuUserId + ":" + bvnVerifiedAt)` (8/8). Without the key:
- 23 distinct stored hashes, and none is held by more than one person.
- The five ADA keys are all different.
- 464 unkeyed candidates match no stored hash: SHA-256 of every word in any plain name column or handle, of `name:`+word, and of each row's own bound input.
- Round 1's voting attack recovers nothing (`?`) for Ada Bello.
- Every check marker is unique per row and keyed.

`bvnVerifiedAt` is stable: it is written once per passed check at millisecond precision into `TIMESTAMP(3)` and read back equal. It is also unique per check: a second check of the same person and name shares 0 of 3 hashes with the first. Linkage across a person's own checks is therefore impossible, and moot: the row is replaced, and a wallet holder cannot check again (409 `wallet_already_open`).

`matchesBvnName` on a fresh check behaves as in round 1:
- **true:** `ADA OKORO`, `OKORO ADA`, `ada  okoro`.
- **false:** `A OKORO`, `ADA OKOROAFOR`, `ADA`, `ADAM SANDBOX`.

It reads **null**, never false, in each of these cases:
- the round-1 `{first,last}` value;
- `v:2` with a forged marker;
- `bvnVerifiedAt` moved 1 ms (another check);
- another person's keys copied in;
- a wallet opened under another BVN;
- no keys;
- no check;
- the whole Hub restarted under another `IDENTITY_HASH_KEY` (6 of 6 null, including the earlier `false`; back to true/false under the original key).

No name, BVN or account number appears in any of the 4 Hub logs. Evidence: `probe-link.txt`, `probe-nulls.txt`, `log-privacy.txt`.

**Round 1 defect 2 (a hidden place in the 50): closed.** In each of 3 rounds, a person held 48 bank accounts and 2 saved people (list 50, count 50, a 51st save 409). One saved person was then purged through the real `AccountPurgeService`: their `FintavaWallet` and `UserProfile` were removed, and the `MoneyBeneficiary` row naming them was kept (COUNTERPARTY). After the purge, the list showed 49, the count 49, and there were 50 rows. 20 parallel saves then gave exactly **1 x 201 and 19 x `409 beneficiary_limit_reached`** every round, leaving list 50, count 50 and 51 rows. A mix of 10 people and 10 accounts in parallel, beside a purged person's hidden row, gave the same split. All 50 visible rows deleted: 50 x 200, list and count 0. Duplicates: 20 parallel saves of one account and of one person give one row each, with one id. Evidence: `probe-cap.txt`.

**Round 1 passes, spot-checked** (`probe-spot.txt`):
- **Isolation.** B sees none of A's rows. B's DELETE of A's id answers 200 and A keeps all 20.
- **The account name comes from the bank only.** A body carrying `accountName` or `bankName` is 400 on PUT and POST, and the saved name is the bank's.
- **Unknown bank codes.** `044`, `058` and `000999` give 422 `name_check_failed` on POST and PUT, with 0 name enquiries sent and the payout account unchanged.
- **Single flight.** 20 parallel saves on a cold cache made 1 `GET /banks`.

**Mutations** (my own 11, none of the builder's, against the WALLET-14, `bvn-name`, purge-map, opening and gate specs; baseline 174/174; the worktree was clean afterwards; `vw14r2/mut/`). **9 killed:**
- keys bound to the person only (4 tests fail);
- keys bound to the time only (5);
- check marker without the time (3);
- the BVN check keys written under a timestamp other than the stored one (6);
- the opening's BVN not compared (1);
- `beneficiaryCount` counting hidden rows (2);
- no early cap refusal before the bank is asked (1);
- the purge map's COUNTERPARTY rule removed (1);
- the stored version not checked (1).

**2 survived:**
- M8, `.slice(0, 50)` removed from `visibleBeneficiaries`. This is equivalent in practice: the visible rows cannot pass 50 under the lock, and a purged person cannot come back.
- M11, the existing-row shortcut in `addWawuUser` removed. No test re-saves a purged person; see the finding below.

**Findings**
1. **defect (minor): re-saving a saved person whose account was deleted answers 201 with a row the list never shows.** `BeneficiaryService.addWawuUser` returns any existing row before it checks that the person has a wallet. Reproduction (`vw14r2/probe/resave.js`, output `probe-resave.txt`):
   1. A saves person P (201).
   2. P is purged through `AccountPurgeService`, so their `FintavaWallet` and `UserProfile` go.
   3. A's list shows 0.
   4. A posts `{kind:"wawu_user", wawuUserId:P}` again: **201**, with P's row, id and name `Gone Person`. A's list and `beneficiaryCount` stay 0.
   5. B, who never saved P, posts the same body: **404 `recipient_not_found`** "We could not find that person."

   The app would show "saved" for someone who never appears, contrary to the service's own rule ("a WAWU user is saved only when they have an open wallet") and to the answer anyone else gets. The 409/404 rule is not applied to the existing-row shortcut, and no test pins it (M11 survives). This was already true in round 1. It holds no place in the cap (the cap counts visible rows), and the id it returns can be deleted.
2. Note: within one row, a word in both the first and the last name gets the same hash (`Ngozi Ngozi`: first[0] equals last[0]). Each part's word count is visible too. Neither says which word, and nothing links across rows or people.
3. Note: the round-2 data migration keeps `{"v":"2",...}` (a string), which the code reads as null. Only a hand-written value could have that shape.
4. Note: mobile main moved during this check (above). The branch needs main merged in again before its pull request (`SHARED-CHANGES.md` and `docs/PROGRESS.md` conflict).

**To close:** finding 1. In `addWawuUser`, answer the existing row only while the person has a wallet; otherwise answer as for anyone else (404/409). Add a test that re-saves a purged person. Owner questions 1 to 3 (G-46's rule) stay open and unchanged.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
