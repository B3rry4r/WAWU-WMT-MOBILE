# FIX-41 verification (Sonnet verifier, 16 Oct 2026)

Backend wmt/FIX-41 cefbd0a (on wmt/WALLET-09 b113e63), mobile 33edd61. Fintava double only; nothing real called.
Specs kept (not pushed): scratchpad/fix-41-v/specs/ (v41.contract.spec.ts 12 tests, v09-attack and v09r2 with the send helper
asking the name check and sending its token). Logs: scratchpad/fix-41-v/logs/.

VERDICT: merge (nothing medium or worse). Two low findings.

## Checks
- R1, all three refusal kinds (payouts_blocked 503, frozen 423, insufficient 402): signed SUCCESS webhook -> transfer stays failed,
  reviewSince + discrepancy set, ONE log line, no balance moved (Fintava balance and ledger rows equal), 0 further /bank/credit calls,
  0 provider reads. Replay of the same delivery, a fresh delivery of the same SUCCESS, 10 parallel settle(), sweeps at +3 h and +50 h,
  a GET of the transfer: flag time, discrepancy and log count unchanged (A1). FAILURE webhook and a SUCCESS on a completed send: no
  flag (A2). SUCCESS then reversal: ends reversed with the flag kept; reversal then SUCCESS: reversed, no flag, ledger notes it (A3).
- Sweep window (B1): failed 0.5 h and 0.95 h ago not asked; 1.02 h, 47 h, 47.9 h asked once each and flagged once with one log line;
  48.05 h and 120 h never asked. Three sweeps in a row ask each send once.
- No record at the provider (B2): asked once (checks=1), never flagged, not asked on the next sweep. Unreachable (500, 503, 429, 401,
  hang-up, unreadable body): the counter is put back and the send is asked on every sweep; then answered SUCCESS -> flagged once.
- Other provider (B3): a send of provider nuvion, and a send whose wallet row is nuvion, are never asked (0 reads). Source: only
  this.provider (WALLET_PROVIDER seam); no src/fintava import in the changed files.
- Two replicas sweeping at once (B4): 6 failed sends, 3 concurrent lookForLateSuccess: each asked exactly once, each flagged once.
- Lock rule (C1, in process): 20 failed sends in the window, 3 s provider read each; another person's GET /money/pin and
  /money/transactions, 16 probes during the sweep: max 11 ms. L1 on a real second Hub (dist, port 7382, its own cron, Fintava
  double answering after 3 s): 200 probes of another person's GET /users/me during the sweep, all 200, max 37 ms, 0 over 1 s;
  the sweep read each send once (20 of 20 flagged by the end, checks 1).
- N3 (N1, N2): unsaved account with no token: 400 "Check the name on this account first, then send again." before the PIN for
  wrong PIN, no PIN, right PIN and no key; nothing sent, PIN tries unchanged, no transfer row. For the plain send and for each refusal
  kind, the SAME key then works with a token (201 / 402 / 423 / 503). Absent token 400; nameToken null 400 (pipe, "must be a string");
  "" and " " 409 account_name_changed (as before); 6 parallel tokenless: all 400. A number saved only by someone else: 400 for me.
  Saved account: 201 tokenless. After I remove the saved account: 400 again. Same number at another bank code: 400. Payout account
  (withdrawal, same route): 201 tokenless (builder's case; the only route with the guard is POST /money/transfers/bank).
- Replay of a COMPLETED send under the same key and body 4 and 16 minutes later (token expired): 201, replayed header, no second
  send (E1). So making the token mandatory does not break a replay.
- Red on b113e63: my A1, B1, N1 fail there (no flag, no read, 403/201 instead of 400); green on cefbd0a.
- WALLET-09 not changed: builder's bank-transfer.contract.spec.ts 25/25; my v09-attack 21/21 (X2 needed one token fixed in the
  spec copy: six parallel sends each fetched their own token, so the replay fingerprint differed; a spec artifact, not the code);
  v09r2 13/13; on b113e63 the unmodified v09-attack 21/21 and v09r2 13/13. Obs logs differ only in the R1 rows (now flagged) and
  timings. The edited helper still tests what it tested: only the case that sent no token and expected 201 was rewritten.
- tsc --noEmit EXIT 0; eslint --no-fix on the touched files EXIT 0. Contract diff vs b113e63: one description. CI on cefbd0a: all
  green except "Executable gates", which fails the same 5 findings (admin-notifications.controller:40, compose-campaign.dto:44,
  content-piece.service:48, notification-event:496, flutterwave-wallet.gateway:72) on b113e63 too: pre-existing, not FIX-41.

## Findings
1. LOW. wallet-transfer.service.ts sweep() (line ~850) runs lookForLateSuccess inside the `sweeping` flag, one send at a time, up to
   50 per minute. No transaction, connection or lock is held (measured), but the in-process flag is: 20 sends x 3 s kept the sweep busy
   60.6 s (C1), so the next cron tick's pending-send settlement is skipped meanwhile; with a hung provider (30 s check timeout) 50 sends
   is about 25 minutes. An unreachable provider also puts every send back to checks 0, so the same 50 oldest are tried first every
   minute for up to 48 h. Reproduce: C1 (sweepMs 60588). Suggest a time budget per sweep, or run the failed-send lookups after the
   flag is released.
2. LOW. Nothing outside the service reads WalletTransfer.reviewSince for a failed send (grep), so "put in front of a person" today is
   the log line, the discrepancy column and the nightly money check (which already reported the ledger row). Fine for the ruling as
   written; a dashboard list for it is a later task.

Pre-existing (also on b113e63, not FIX-41): the 5 gate findings above; receipt-units.spec.ts 4 cases (builder: Node 22.22); the
mobile copy of contract/openapi.json is behind the backend branch (no bank-send route yet, WALLET-09's mobile sync).

Cleanup: stack fix_41 down (database dropped), worktrees v-fix-41-be and v-fix-41-base removed, ports 7380-7387 closed, Hub 7382
child killed by PID. The verifier ran my first spec copy once with its observation file pointing at
scratchpad/wallet-09-v2/logs/obs2.log; I restored that file to its 26 original lines.
