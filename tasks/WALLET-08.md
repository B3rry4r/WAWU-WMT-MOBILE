---
id: WALLET-08
title: Find a recipient, and recent recipients
owner: YOU
area: WALLET
order: 134
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: [MONEY-10, MONEY-12, SETTINGS-04]
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# WALLET-08 · Find a recipient, and recent recipients

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)

## Goal

W7: search by name, @handle or phone, and show recent recipients.

## Scope

Recipient search across all accounts that have wallets, block-aware (SETTINGS-04: a blocked user never appears); recent recipients from the ledger.

## Capability checks

- [ ] Searching a phone written 080... finds the same person as +234...
- [ ] People the user blocked never appear.

## Builder report

Builder, 4 Oct 2026. Backend `wmt/WALLET-08` **6dab9c8** (main 38bbe4c is already in it; no conflicts). Mobile branch `wmt/WALLET-08`: this file, BACKEND_GAPS G-132 and G-133, the LOG line, and the contract copied from 6dab9c8 (byte-equal to the backend's `contract:build`).

**Built.** `GET /money/recipients?q=` and `GET /money/recipients/recent`, as declared by MONEY-04 (same path, same `RecipientView` array, same maximums 20 and 10), now served from `src/money/recipients/` behind MONEY-13's gate (`409 wallet_not_open` or `wallet_opening` first, before the text is read), `no-store`, no Fintava call. The declared handlers moved out of `MoneyTransferController`. The route's operationId changed from `MoneyTransferController_recipients` to `MoneyRecipientController_search` (nothing in the app uses it). `loadMoneyParties` (`src/money/money-party.ts`) is the shared "name, handle, avatar, tick" read: the beneficiaries list now calls it instead of its private copy, with the same output. Docs: `docs/contract/CONVENTIONS.md` section 13 and the WALLET.md rows.

**Rules, each with the test that proves it** (`money-recipient.contract.spec.ts`, 44 tests over HTTP: real MoneyModule, real database, real RS256 tokens; `recipient-throttle.contract.spec.ts`, 5 tests through the whole AppModule):
- **Open wallet only, never the caller.** A person with no wallet, an opening still in progress, a proved phone with no wallet, a wallet deleted since, and the caller by name, @handle or phone: never found.
- **Phone is exact.** `+2348..`, `234..`, `08..`, `8..`, with spaces, dashes and brackets, all give the same one person. Not found by a prefix, a suffix, one digit short, one too many, another network prefix with the same last 8, or the same first 9 (10 near-misses, plus a neighbour test). A handle written as a number does not stand in for the number. A phone is searched as a phone and as nothing else.
- **Name and @handle** are a case-insensitive beginning (of the handle, or of any word of the wallet name); `@x` is handle only; `%`, `_` and `\` are plain characters. Under 2 characters after trimming (and after an `@`): 400 in the one error shape (no `reason`, as CONVENTIONS section 3 says for a malformed field) for `a`, `   a   `, empty, spaces, `@a`, `@`, one digit; also a missing, repeated or over-60 `q` and any other query field.
- **A result is 5 fields** (`wawuUserId`, `displayName`, `handle`, `avatarUrl`, `tick`). Checked by key list, and by scanning every body for the person's phone in every form, account number, email, `4321`/`8765` (seeded BVN and NIN last 4) and the words bvn, nin, accountNumber, verifiedPhone.
- **Blocked either way** never appears in a name, handle or phone search, nor in recent; unblocking brings them back; a blocked phone answers byte-for-byte like an unknown one.
- **Page cap.** 25 people with one prefix: 20 answered, the first 20 in name order. 13 recent recipients: the newest 10.
- **Recent** counts completed outgoing ledger rows to a WAWU user (category transfer or purchase), one person once at their latest; excluded: pending, failed, reversed, incoming, bank, merchant, top-up, earning, someone else's rows, the merchant wallet's rows, the caller; people blocked either way or with no open wallet dropped, and the list still fills from the rest.
- **Throttle.** Search 20 a minute and 120 an hour per address: the 21st is 429 `{statusCode:429, data:null}` with no `reason`, `Retry-After`, and the limit headers; per-address buckets (a caller's own X-Forwarded-For entries count for nothing); recent shows the global 20/200 headers. Exact limits added to `src/tests/hub-rate-limits.contract.spec.ts` (the `@Throttle` file list, the override list, the exact figures, and the "only tightens" check).
- **Mutants:** 23 hand-made mutant runs of the SQL and the parser (drop each block filter, status, direction, kind, category, walletKind, the JOIN, self, the cap, the min length, the LIKE escape, a tail or head phone match). The first 18 left 5 alive: two equivalent (an `OR 1=0`, and a prefix LIKE on a full number), a LEFT JOIN, a last-8 phone match on the identity table, and a cap edit on the phone query (which can only ever hold one person). I added the near-miss phone test (same last 8, same first 9) and a named, deleted person to recent; the 5 reruns (LEFT JOIN, tail on both tables, head, text cap) all fail now.

**Gates and counts.** `tsc --noEmit` 0 errors; eslint on every changed file clean; prettier clean. Full suite on a fresh migrated and seeded DB in its own network namespace (mock WAWU ID on :4001 inside it, listener PID checked to be mine before and after): **152 suites, 3652 passed, 3 skipped (none in a file this task touches), 0 failed**. `hub-rate-limits` on the host network, 22/22. Money, wallet-gate, MONEY-04 contract and rate-limit specs inside those. Protected suite `run.sh --fresh HEAD`: **253/253**, lock unchanged (empty diff on the lock files, tripwire on added lines: no match). Gates: main **16 fail, 33 warn, 76 accepted**; branch **16 fail, 34 warn, 76 accepted**; the one new warn is `PROVISIONAL(RECIPIENT-SEARCH-RATE)`. Fintava key scan of the staged diff (58 eight-character windows): 0 hits. Mobile `npm run check` exit 0 (typecheck, lint, 36 suites and 666 tests, gates 0 fail 0 warn, tasks).

**Decisions (Default (agent), owner may override).**
- **Plain arrays, no cursor.** CONVENTIONS section 6 says "short lists (banks, recipients, beneficiaries) are plain arrays with a stated maximum and no paging", and the declared shape is that; a cursor envelope would change the declared shape non-additively. Cap 20 and 10 are the "page size". A search is narrowed by typing more.
- **Names are searched where the Hub has them** (G-132): the wallet name and the handle. Displayed name: WAWU ID, else wallet name, else handle; a person with none of the three is left out.
- **Phone compared with the phone the wallet was opened with** (`FintavaWalletOpening.phone`, indexed and unique, and `WalletIdentity.verifiedPhone`); the Hub holds no other phone.
- **`@` needs 2 characters after it** (`@a` is a 400). A phone-shaped text is searched as a phone only. Digits that are not a whole mobile are text.
- **Recent categories:** transfer and purchase only, to a `wawu_user` counterparty.
- **Limits** 20 a minute and 120 an hour per address, `PROVISIONAL(RECIPIENT-SEARCH-RATE)`; recent has no route limit.
- **No schema change, no migration.**

**Gaps filed:** G-132 (name search needs WAWU ID's names; the phone is the one the wallet opened with) and G-133 (limit is per address, not per person). No SHARED-CHANGES rows.

**NOT RUN.**
- A search or recent list from a real send: `POST /money/transfers/wawu` (WALLET-07) is declared only, so recent was tested on ledger rows written in the shape the ledger consumer writes. Unblocked by: WALLET-07 serving that route (then send, then `GET /money/recipients/recent` lists the person).
- V9 against the real WAWU ID: tokens were real RS256 signed with the mock WAWU ID's key and checked through its JWKS; names came from a stand-in lookup in the contract spec. Unblocked by: the backend running with a real `WAWU_ID_BASE_URL` (OPS-10 deploy), a real sign-in, then a search that shows WAWU ID's name.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
