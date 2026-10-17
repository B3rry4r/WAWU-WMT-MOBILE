# WALLET-09 verification, round 2 (Sonnet verifier, 16 Oct 2026)

Backend wmt/WALLET-09 b113e63 (on 6040fba), mobile bd0aaa3. Fintava double only; nothing real called. The round 1 report is
replaced by this file (its findings are listed under "Round 1 closed"). Specs kept, not pushed:
scratchpad/wallet-09-v2/v09r2.contract.spec.ts (13 tests), v09-attack.contract.spec.ts (round 1, 21 tests, unchanged),
v09-live.contract.spec.ts (stack Hub on 7300). Logs: scratchpad/wallet-09-v2/logs/ (obs2.log, obs-live.log, final.log).

VERDICT: merge (nothing medium or worse). Four low findings, one of them a recommendation to harden before the app is built on it.

## Findings
1. LOW. A refusal treated as "no transfer" can still be followed by a transfer that completes, and then nothing repairs it.
   Reproduce (R1): refuse a bank send with "Unable to find customers" / "Insufficient balance" / "Kindly confirm both customer accounts
   are active", then deliver a signed `customer_bank_transfer` SUCCESS for that reference, then sweep +3 h, then retry with the same
   key. Result for all three kinds: the send stays `failed` (timeline requested, failed), no `reviewSince`, no transfer discrepancy,
   the ledger row stays `failed` with discrepancy "webhook sighting: status failed vs completed"; the key was released so the retry
   is a new send that also completes (two transfers out, the app shows one failed, one completed). There is no refund in this design,
   so "refunded and paid" is "told failed, then paid", and a retry pays twice. Caught: only by the nightly money check, which
   reported all 3 rows as `ledger_discrepancy` (mismatch) in my run. Nothing flags the send itself or the person. The sweep never
   asks the provider about a failed bank send (settle() only follows a reversal), so only a webhook can reach it. This is the
   inherited SWEEP-MONEY F8 gap, but round 2 makes it reachable from three new kinds that used to stay pending (where a late
   success completed correctly). The exposure rests on the sandbox evidence: sandbox/14- shows a refused bank send leaves an orphan
   PENDING record (inert for 37 minutes); sandbox/13- (insufficient) and 15- (frozen) are WALLET-TO-WALLET answers, so no sandbox
   run exists for a bank send refused for balance or a frozen wallet (G-767 says so). Suggest: a SUCCESS sighting on a `failed` bank
   send sets reviewSince and the transfer's discrepancy (do F8 soon), so the app and support see it before the nightly report.
2. LOW. `payouts_blocked` keeps recordMayExist=true in fintava-client (the other test requires it) while
   wallet-transfer.service.ts `afterRefusal` (NO_TRANSFER_REFUSALS, ~line 139 and 556) fails it. Consistent in effect: the three
   kinds go failed, the pending ledger row is voided (ledger `failed`), the key is released (same key retried goes), and the answers
   are 402 (figures), 423 wallet_frozen, 503 provider_unreachable; the flag is simply ignored for these kinds. It is safe only
   because of the evidence in finding 1. Not a Nuvion change: Nuvion's same kinds have recordMayExist false and behaved this way
   before. One looseness: the classifier tests the words anywhere in the 400's messages, so ANY 400 whose text contains "insufficient
   balance" is failed at once (R2: "Transfer failed at partner: Insufficient balance in settlement" -> 402, failed). A 5xx with the
   same words, "Transfer could not be processed", "CustomerReference Already Exists" and a 502 "Unable to find customers" all stay
   pending (201). Worth tightening to the exact Fintava sentences when G-767 is answered.
3. LOW (recommendation). A send with no `nameToken` to an unsaved account is allowed and goes to whatever name the bank gives now
   (N3: holder changed ALICE to MALLORY after the check, tokenless send -> 201 to MALLORY; with the token -> 409
   account_name_changed, nothing sent). Not a hole an outsider can use (the person types the number and the app always sends the
   token) but the binding is advisory. The "shared body" reason does not hold: the guard already knows `resolved.place`; requiring
   the token when `place === null` leaves saved and withdrawal sends untouched. The contract text says plainly "A send with no
   token goes to the name the bank gives", so this is a decision, not a defect.
4. LOW. Same key, new `nameToken` (a re-run name check) is a different body fingerprint: if the first try was kept (pending or
   in progress) it is `idempotency_key_reused`. A refused try (409 account_name_changed, 400) gives the key back, so the normal
   re-check flow is fine; the app must resend the SAME body on a retry of a kept send. Same property the quote token already has.

## Round 1 closed (reran v09-attack and v09-live)
- Medium 1 (malformed account number or bank code answered 500): closed. v09-attack X12 now passes (was the only failure); 14 odd
  bodies plus 12 new forms (number, object, array, null, missing, unicode digits, trailing newline, padded space, raw "abc", [],
  null, 12, broken JSON, no body, wrong PIN with a malformed body) all 400, none 5xx; the sentences equal the pipe's and the
  envelope equals a pipe 400 (S1); nothing sent, no PIN try used, the key is free (same key with the good body -> 201), zero
  "@CurrentBankTarget" lines in the log. Live Hub on 7300: 400 for 9 digits, 11 digits, letters, empty and injected bank code,
  numeric account number, empty body; Hub log has 0 ERROR lines.
- Medium 2 (provider refusals left the send pending): closed for the three kinds (R1, C1, D1, D2). 402 carries balanceKobo and
  totalKobo ("Your balance changed" when the wallet in fact covers it), 423 wallet_frozen, 503 with retryAfterSeconds 30; no
  provider text; a refused send does not use the daily limit (D1); six parallel sends with balance for one -> 1 completed, 5
  failed 402, 1 provider debit, ledger 1 completed + 5 failed (D2). Anything else stays pending.
- Low 6 (failed or reversed send showed sent_to_bank): closed (T1: completed has it; failed and reversed show requested then the
  outcome). Low 7 (unsaved account not bound): closed with the optional-token caveat in finding 3. Low 4 and 5 (test edit, G-762
  text): closed (toBe(0); G-762 now says the PUT takes no flag; G-764 and G-767 are in BACKEND_GAPS; F8 in SWEEP-MONEY).
  Low 3 (name-check limit, G-764) and low 8 (late SUCCESS, F8): open for the owner and the sweep as ruled; see finding 1.

## nameToken attacks (N1 to N5)
15 bad tokens, each a 409 account_name_changed with nothing sent: empty, garbage, "...", payload only, signature only, extra part,
tampered name claim, tampered expiry, another person's token for the same account, a token for another account, a FEE QUOTE token,
a token signed with the quote key but without the context string, v:2, 2,000 characters, a correctly signed token with another
person's id. A token 16 minutes old -> 409, 14 minutes old -> sent (NAME_CHECK_TOKEN_MS 15 minutes). A bank-only change under the same
holder name is caught by the bank-name claim. A token for a saved account is ignored (a junk token still sends; a fresh token for a
new holder does NOT override the kept name: 409). The token is not single use (a second send within 15 minutes with the same token
goes; the name is re-checked each time). Wrong types (number, array, null) -> 400. The token appears in no log line, no error body
and no stored row (N5). The payload is readable base64 (user id, account number, normalised holder name); it only travels back
from the person's own check.

## Checks (what held)
- Round 1 attack spec on b113e63: 21 of 21 pass (double send 8 parallel same key -> 1 call; 6 keys -> 6 sends; key reuse with other
  body -> 409; daily limit races; lost answer plus replays; reversal mid-send; failure then reversal replayed -> reversed once;
  fees 25,000 + configured charges; quote token forms; PIN lock; no wallet; names; self_transfer; masking in 164 log lines and 51
  error bodies; purge).
- Concurrency (the 16 Oct rule): 20 parallel sends for one person with a 3 s name check and a 3 s send all 201 in 10.4 s; another
  person's GET /money/pin and /money/transactions answered in 5 to 17 ms during the burst (limit 1000 ms). No connection or lock
  held across the provider call.
- Existing suites: bank-send-target, bank-transfer contract (builder's 24 plus round 2 additions), nuvion-bank-reconcile-seam,
  wallet-provider-seam (R-39), money-contract, wallet-gate-coverage, wallet-gate contract, money-moving-coverage, fintava-client:
  8 suites, 347 tests in one run, and the Nuvion seam spec with wallet-provider-seam again, 2 suites, 22 tests; all pass. My specs: 34 tests pass (v09r2 13 + v09-attack 21).
- Branch CI b113e63: suite shards 1 to 3, netns, contract (openapi), baseline, protected route suite, deploy-test-in-sync all
  success. Executable gates failure: the same 5 FAIL lines as 6040fba and base 649187a (admin-notifications.controller:40,
  compose-campaign.dto:44, notification-event:496, flutterwave-wallet.gateway:72, content-piece.service:48), none in this branch.
- No em-dash added in the diff; no new import of src/fintava from src/money; migration unchanged since round 1; no lockfile change.
- NOT RUN: real Fintava or Nuvion payouts (sandbox blocker), mobile screens (none in this task).
- Left running: nothing. Stack wallet_09 down (hub 6310, mock-id 6297 stopped, database dropped), ports 7300 to 7307 closed,
  worktree /home/user/wt/v-wallet-09-be removed.
