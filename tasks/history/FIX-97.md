# FIX-97 · round history

Moved out of [tasks/FIX-97.md](../FIX-97.md) word for word, oldest first. The current state is in that file.

## Builder report

- **Files (backend):** as in Scope. 4 files in round 1 (one new), 3 more in round 2.
- **Setup.** Database `fix97_hub_test` (migrated, seeded), dropped at the end; a Hub on 7860 and the mock WAWU ID on 7867 for the dev name check (a net guard that allows only this machine and api.nuvion.dev), stopped; the worktrees removed. Nothing Fintava was run; no key in any file, log or commit.
- **Gate counts.** Backend gates after: 0 fail, 133 warn, 88 accepted (same as main, 1 more file scanned). Mobile: 0 fail, 18 warn, 0 accepted; this task changes no mobile code, only its records.
- **Gaps / decisions.** The sender's email is the one on its Nuvion entity (the email WAWU sent when the wallet was opened). A dev transfer needs `narration`; `bankTransfer` only sends one when its caller gives one, and the Hub always does. Not changed.

## Verifier report

Verifier: a Sonnet agent that built none of it. Heads under check: backend `origin/wmt/FIX-97` `e678f35` (merge base is `origin/main` `62876ea6`, 7 files, the same 7 the builder lists), mobile `853a0361`. Worktrees and the Hub were the verifier's own; logs under the verifier's scratchpad `fix97-v/logs/`.

**Part A (the code): PASS.** No blocker, high or medium. Part B (the funded dev run): **blocked by Nuvion**, not by our code (see the card route below).

| Check | Result | Evidence |
|-------|--------|----------|
| Scope | passed | `git diff --stat origin/main...e678f35`: `src/nuvion/areas/payouts.ts`, three specs, `test/nuvion/payouts-standin.ts` (the payouts specs' stand-in, in the task Scope), and the two approved scripts. Nothing else; no schema, route or contract file |
| Fix 1, 2, 3 against dev's real answers | passed | read the diff, then called dev live: a `bank_code` body 422 "issuer" (01M5MFMZGZGG4DRDTCP56PH5GW); `issuer: {code}` bank 044, number ending 0031: 200 "Forrest Green" at `details.name` (01M5MFN0NXJ7DBJ85EYHFSRNG7); made-up number 404 `error_resource_not_found` (01M5MFN2X92M0XBCP16BWN8NS9); a counterparty with no contact 422 naming `address` then `email` (01M5MFN4Z2300CTP158Q07XZ26); the entity answers carry `person.email` or `business.email`, `address` and `addresses`. The stand-ins repeat these answers word for word (message text and field order included) |
| New spec fails on main, passes built | passed | `nuvion-payouts-dev-answers.spec.ts` copied (uncommitted) into a worktree of `origin/main`: 10 of 10 failed, EXIT 1 (`base-newspec.log`); on `e678f35`: passes inside the 11-suite run, 659 tests, EXIT 0 (`built-nuvion-unit.log`) |
| Changed assertions in `nuvion-payouts.spec.ts` | passed | four hunks: lookup body, the "no name" bodies (same cases, now in dev's shape, plus `status: failed`), the name-field test (the three guessed fields now assert `bad_response`, so stricter), the counterparty body. Each follows a dev answer; none removed or loosened |
| Round 2: `nuvion-standin-statements.spec.ts` | passed | one hunk: the counterparty's `profile` gains an email and an address. No assertion touched. Needed: main's copy of that spec run against the built stand-in fails 9 of 9 (the stand-in refuses a counterparty without contact, as dev does) |
| Nothing invented | passed | no email, address or name literal in `payouts.ts`; the only fixtures are in specs and stand-ins (`@example.test`, `@standin.example.test`). The refusal is "payouts (NUV-06): the sending side has no email on file; no counterparty was made" (or "address"): plain, no em-dash; no em-dash anywhere in the diff |
| Missing contact stops before money | passed | spec: kind `validation`, `recordMayExist` false, no counterparty, payment detail or transfer posted; an unreadable entity is `requestNotSent`; a second send to the same payee reads no entity. In the Hub (code read, not run) such a refusal has `recordMayExist` false, so `afterRefusal` marks the send failed and nothing is pending |
| tsc | passed | EXIT 0 (`v-tsc.log`) |
| eslint, no `--fix` | passed | 6 changed `.ts` files EXIT 0. `scripts/dev/nuvion-standin.cjs` cannot be linted by the project config (not in the tsconfig); main's copy gives the same error; `node --check` passes |
| Nuvion specs, in band | passed | 11 suites, 659 tests, EXIT 0 (never `nuvion-adapter` or `nuvion-rollback`; only those two import the Fintava double) |
| Contract specs that use the changed stand-ins | passed | `nuvion-payouts.contract`, `nuvion-dispatch-burst.contract`, `wallet-transfer-bank-nuvion.contract`, `school-settlement-failed-payout-nuvion.contract`: 4 suites, 62 tests, EXIT 0. These are all the specs that import `payouts-standin` |
| `db:seed`, `test:protected` | passed | 2 suites, 253 tests, EXIT 0 (base lock; `package-lock.json` equal to main's) |
| Gates, baseline (backend) | passed | `gates/run.py` EXIT 0, 1738 files, 0 fail, 133 warn, 88 accepted (identical on main); `check_baseline.py` EXIT 0 (124 entries) |
| Stack walk (the local Nuvion stand-in) | passed | `stack.sh up --name fix97v --ports 7860-7867`, a seeded funded wallet (5,000,000 kobo): name check 200, made-up 422; fee quote 2,500 + 2,500 = 5,000 kobo; bank send of 100,000 kobo answered 201 pending then completed; balance 4,895,000; the same Idempotency-Key gave the same transfer. Stand-in log: entity read 200, counterparty 201, payment detail 201, transfer 201. Direct: a `bank_code` lookup is the `issuer` 422, a bare counterparty the `address` and `email` 422 |
| Mobile gates | see Current state | `check_tasks` and `gates/run.py` on the new head |

**Part B, dev only (api.nuvion.dev), key and PEM from the agent-keys files, nothing printed.** A local Hub on this branch (`WALLET_PROVIDER=nuvion`, a net guard allowing only this machine and api.nuvion.dev, the mock WAWU ID) opened one wallet through its own routes (sign-up, `POST /money/wallet/open`, two uploads, locally signed `entities.updated` and `accounts.created` deliveries; the Hub re-read the real entity and account). Then, as the docs say:

| Step | Result | Evidence |
|------|--------|----------|
| NGN payment intent into that wallet's account | created, 201, `requires_action`, 1,000,000 kobo | 01M5MFJ0T5RM704R23FPFBH9ZB |
| Confirm with the docs' test card (4111...1111, 12/2030, 123), RSA-OAEP SHA-256 with the PEM | **refused by Nuvion: 400 `error_acquiring_currency_not_supported`, "The currency for this payment is currently not supported"** | 3DS required 01M5MFJ27N2A540T974Z3P6CMX; 3DS disabled 01M5MFJG9HFJE1MAW6TCCHD93X; create-and-confirm in one request 01M5MFKQGPAXHDB5PE945M49B8 |
| Was the PEM refused | no | no `error_acquiring_decryption_failed`; a made-up value (random bytes of the key's length) answers `error_validation_invalid_format` (01M5MFK1QRJMF2X2E9VZ5J2H6R), the real ciphertext passed that and reached the currency check |
| 3DS step, `applicable_fee` on the inflow | none reached | no redirect and no fee came back |
| Cleanup | intents cancelled | PATCH, 200 (01M5MFKS18NTHE1B3E02XP2QF7, 01M5MFKT97AHTRWR1MEPNS376K) |

Stopped there, as the brief says. So not run: the funded bank send, the move into WAWU's operational account, the limit refusal, the month's statement against transfers. Still done, unfunded, through the Hub or the built code: name check (200 "Forrest Green" for the number ending 0031, 422 `name_check_failed` for a made-up number), the fee quote (Hub config: 2,500 + 2,500 kobo for a bank send of 100,000), balance 0 (Nuvion's), `npm run money:check` (`clean`, 1 of 1 wallets, 0 mismatches, EXIT 0); and the built bankTransfer against dev: a Hub-opened person to bank 044 ending 0031: sender entity read 200, counterparty 201 (01M5MFP03CFG6J6EPRRYS6ZNY6), payment detail 201 (01M5MFP27DT2V66R4SPDBJHZKE), transfer 400 `error_transfer_insufficient_funds` (01M5MFP38R0VCXEG2G0WG74B8Q); WAWU's operational account to a new payee (bank 058): operational account read 200, sender entity read 200, counterparty 201 (01M5MFPS2RH823SSYAQ2Y4TM2E), payment detail 201 (01M5MFPV1V52ZS31ZSPE1GEGF0), transfer 400 `error_transfer_insufficient_funds` (01M5MFPW37H0PV3ZMC5CMG6GR8). Dev fees in kobo: inflow, book transfer, bank payout all not measured (nothing could move). Results are written into `docs/nuvion/DEV-RESULTS.md` (NUV-04 inflow, NUV-05, NUV-06 re-runs, NUV-07, NUV-08, the facts list).

Findings (none blocks the merge):
- **Low (test gap)** `src/nuvion/areas/payouts.ts` `readLookup`: an answer with `details.name` and no `status` is accepted (only a `status` other than `successful` is refused); the code comment and the builder report say "status must be successful". Repro: a lookup answer `{details: {name, account_number, issuer: {code}}}` reads as matched. Dev always sends `status: successful`, so nothing is wrong on dev. Goes to the NUV sweep.
- **Low (test gap)** `readSenderContact`: no spec pins the email pattern (`EMAIL`): an entity email such as `not-an-email` is refused today, but removing the test would not fail any spec.
- **Not findings**: `createCounterparty` still gives a one-word holder name the same first and last name (unchanged from main, dev needs both); the DEV-RESULTS counts line still says "2 failed" (the two rows say PASSED after FIX-97).
- **Owner/lead question, not ours**: dev takes no card in NGN (`error_acquiring_currency_not_supported`); funding a dev wallet needs Nuvion to enable it, or to name another way. Until then NUV-04 inflow, NUV-05, NUV-07 and NUV-08 stay NOT RUN.
