# WALLET-37 verifier report, ROUND 5 (backend wmt/WALLET-37 516a6bc on ff2b81f; mobile ec6d37b on 0680e18)

Verdict: MERGE (nothing medium or worse). Round 4's medium is closed. Round 4 report is superseded by this one;
its low findings 2 and 3 stand as noted below (2 accepted by the lead, 3 now fixed).

## Findings
1. LOW (informational, not new in round 5). A valid name token (this person, this bank and account, under 15 min)
   makes the send's bank enquiry uncounted, so repeating the send with no PIN header asks the bank about that one
   account as often as the caller likes (15 sends = 15 enquiries, all 403 PIN required). It only re-asks an account
   the person already checked, so no new name can leak; bounded by the global per-address throttle. The guard
   always asked the bank on every send, so this is the same on main.
2. LOW. Stale comment: src/money/saved-accounts/name-check-budget.ts class doc still says "A bank send's own check just
   before the money goes is not counted: sends to other people are unchanged". Round 5 made an unsaved,
   untokened send a counted check. CONVENTIONS.md and openapi were updated, the code comment was not.
3. LOW (carried from round 4, accepted by the lead). Name rule accepts two given names without the surname.

## Checks (all against the branch; Fintava double only; nothing real called)
(1) Backend, my own spec v37r5-attack (11 cases, all pass; scratch copy in wallet-37-v/specs/):
- B3 re-run: person at the 30 limit, 40 parallel POST /transfers/bank, nameToken 'x', 40 different accounts, WRONG
  PIN header: 40 x 429 name_check_rate_limited, Retry-After set, body has no accountName/bankName/holder text,
  provider /name/enquiry count unchanged, triesLeft unchanged, 0 MoneyIdempotencyKey rows (key given back), no send.
  Same at the limit with no token, empty token, 'a.b', a 5000 char token, no PIN: all 429. PASS
- Below the limit: mismatched-token send = 409 account_name_changed and exactly one check (29 more checks pass, the
  31st total is 429). Send with no nameToken to an unsaved account = 400, no name, counted as one (judged right:
  the bank is asked, it tells whether the account exists, so it is an enquiry; the app always sends a token). An
  unknown account (422 name_check_failed) is counted and not given back. PASS
- Uncounted at the limit: saved beneficiary 201; valid token 201 (twice, and a 14 minute old token 201); saved
  payout account withdrawal 201. After the beneficiary is deleted the same send is 429 again. PASS
- Token reuse at the limit, each 429 with no enquiry: token of account A for account B; GTB token with the ACCESS
  code on the same number; ACCESS token with the GTB code; another person's token; a 16 minute old token (made with
  NameCheckTokenService.issue at -16 min); a token for another account. The other person using my token gets 409 and
  spends one of their own, never 201. PASS
- Race: 29 used, 12 parallel mismatched sends: exactly 1 passes the limiter (1 enquiry), 11 are 429. PASS
- 503 gives the place back: 35 sends with the enquiry failing = 35 x 503, 0 key rows, then 30 checks pass and the
  31st is 429; and the real built Hub with its provider port closed: 35 sends = 35 x 503 provider_unreachable, no
  429, a name check after is 503. PASS
- Own wallet account at the limit: 400 self_transfer, no 429, no enquiry. Unsigned and forged-token sends: 401.
- Mixed at the limit: 20 valid-token sends + 20 token-x sends in parallel: 20 x 201, 20 x 429, exactly 20 enquiries
  (the valid-token ones); replay of a done send with the same key: 201 with Idempotent-Replayed. PASS
(2) App A21, builder's spec 20/20 and my own 7 cases (v37r5.test.tsx, all pass): the form asks again after the
  server's wait without editing the number; 429 with no figure arms 60000 ms; header-only Retry-After 2 arms 2000
  ms; two 429s in a row re-arm and then the name shows with Save open; still limited = one request per wait (4 in
  3.3 s at a 1 s wait), Save stays shut; editing the number during the wait asks the new number and never the old
  one again; unmount during the wait makes no call; no em-dash. PASS. Mobile tsc --noEmit EXIT 0.
(3) Nothing held across the provider call: full AppModule, 3 s provider, 40 mixed name checks and sends by one
  person (18, 18, 4 in waves 1.1 s apart because of the global 20 a second throttle): 30 passed the limiter and
  reached the provider (30 enquiries), 10 x 429; another person's GET /users/me answered in 13, 8 and 7 ms. PASS
- Contract: openapi diff vs ff2b81f = one 429 response on POST /money/transfers/bank (+ summary text). No
  migration. No em-dash in any added string (backend and app diffs).
- CI on 516a6bc: 3 suite shards, contract, netns, deploy-test-in-sync, protected route suite, baseline: success.
  Executable gates: failure, the same 5 FAIL lines as round 4 and main a5e48fc (none in this task's files). Mobile
  CI cannot run (billing, per the builder; proxy refuses the mobile repo's check-runs).
- Backend tsc --noEmit EXIT 0; name-check-token, name-check-budget, bank-transfer.contract and
  name-check-concurrency specs 49/49 on a local stack.
- NOT RUN: pictures of A21 at 390 px. Round 5 changed behaviour only (timers), not the drawing, and the stack Hub's
  provider is a closed port so a real 429 cannot be produced in a real flow; the states are covered by the jest cases.
- Cleanup: stack wallet_37 down (ports 7480-7487 closed, database dropped), worktrees removed, nothing pushed.
