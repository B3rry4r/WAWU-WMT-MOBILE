# KYC-06 verifier report (mobile wmt/KYC-06 b6629b4 on 7de785d; backend unchanged, main a5e48fc)

Verdict: fix (three medium findings).

Setup: stack kyc_06 (ports 7460-7467, down at the end), mobile web export of the branch, own Metro cache, baked ports checked (7460, 7467 only).
Fixture choice for V5/V6/V7: BROWSER-SIDE fixture for `/api/hub/money/*` only (Playwright route, shapes from the generated contract and the
backend's view types). Sign-in is the real login through the stack's mock WAWU ID, and every non-money call goes to the real stack Hub.
One un-fixtured probe against the real stack Hub (fintava opening): GET /money/wallet 200, GET /money/identity/documents 200 with
`required:false`, so A26 shows "Nothing to add here / Done" (value only the server gave). No Nuvion rows exist on the stack, so V9 against a
Nuvion-mode Hub is NOT RUN. Harness: scratchpad/kyc-06-v/{h.py,p2..p7.py}, logs in logs/, pictures in pics/.

| Pass | Result | Evidence |
|---|---|---|
| V1 | passed | logs/full-check.log EXIT 0: typecheck, lint 0 errors (6 old warnings), jest 185 suites / 3268 tests, gates 10 run, 693 files scanned, 0 fail, 5 warn (PROVISIONAL, on main), tasks ok |
| V4 | partly: documents and address trace passed; the open-call (details) trace NOT RUN in a browser (needs a kept BVN check, G-820) | FD log in logs/p2-*.log: `kind,file,file_back` then `kind,file`; unit tests cover the open call |
| V5 | passed (A26 A27 A28 A29, 390 px, light and dark, beside the boards) | pics/cmp-a26.png cmp-a27.png cmp-a28.png cmp-a29.png (board dark, built dark, board light, built light) |
| V6 | passed | pics/sheet-err-dark.png (503 on A26 docs, A26 wallet, A27, A28, A29; required:false), sheet-load-dark.png / sheet-load-light.png (held request: real skeletons), a27-busy, a27-fail, a27-needsdetails, a29-wait, a29-stopped, a26-held |
| V7 | passed for resume; first-time person NOT walkable | T1 in logs/p5.log: needs_documents -> A26, checking and approved(on_its_way) -> A28, rejected, stopped, expired -> A29, review null / flow check / flow null -> first step, open+active -> A8. No step before A26 links to it (G-460/G-820) |
| V9 | partly (see setup) | real login, real Hub for users/me and the money probe above |

Capability checks: (1) both sides + proof + address + Submit: passed on the needs_documents path (identity in ONE multipart request with
kind, file, file_back in that order, then the bill; no POST /wallet/open while needs_documents); a person with no opening cannot finish (G-820, known).
(2) A28 polls GET /money/wallet every 3 s (3 polls in 12 s), stays on `approved` + `on_its_way`, moves to A8 only on `active`: passed.
(3) A29 shows reasons and fixes, Upload again only when canResubmit (wait line and Done otherwise; stopped: Done): display passed; the resubmit itself fails, finding 1.
(4) resume by review.stage: passed. (5) pictures: passed. (6) values from Hub or user: passed, no literal. (7) states: passed.
Copy: no em-dashes, no WAWU/Fintava/Flutterwave/Nuvion/licence text in the new files; the Hub's reason and fix text is shown as sent.
Other attacks that held: double Submit with the first upload held -> 1 request, button busy (T3); identity ok then proof 503 then retry -> banner, no
/wallet/open, completes (T4); documents_closed on the first upload -> goes to A28 (T5); 10 MB+ PDF -> "That file is too big / under 10 MB", .txt -> "We couldn't read that file" (T6);
A28 on needs_documents or null review -> A26, on rejected -> A29 (T8).

## Findings

1. MEDIUM, defect. A rejected person cannot resubmit after the app was closed. Submit under `rejected`/`expired` needs the details from the kept BVN
   check, which is memory only (`keptCheck.ts`), so after any cold start `detailsFromKept` is null and A27 shows "We need your details again" with
   "Start again". `Start again` calls `way.restart()` (`src/app/open-wallet-address.tsx:16`, `leave.ts` restart -> `/open-wallet`), and
   `ReviewResume.tsx` (resumeTarget: rejected/stopped/expired -> 'rejected') sends the person straight back to A29. A loop, zero requests sent.
   Repro: rejected + canResubmit true, fresh load of /open-wallet-rejected -> Upload again -> choose proof -> address -> Submit -> Start again -> back on A29
   (logs/p6.log T2, pics/a27-needsdetails-dark.png). Breaks capability check 3. (Separate from G-820, which is the missing fields.)
2. MEDIUM, defect. Files are not dropped on every way out of the flow. `forgetDraft` runs only in `leave()` and `opened()` (`leave.ts:84,102`); Back from A26/A27
   (`router.back()` in `open-wallet-id.tsx:16`, `open-wallet-address.tsx:14`) and the browser or OS back keep the ID photos and the bill until the session ends.
   Repro: home -> A26, take both sides, Continue, choose a bill, back twice to home, reopen A26: Front and Back read "Done" (logs/p6.log T10). On a phone the
   app's cache copies stay too (`discard` runs only on drop). Brief says dropped on leaving the flow. Fix: forget on unmount of the flow's last screen / on blur out of the flow, not only in `leave()`.
3. MEDIUM, defect (the fix is the already-filed SHARED-CHANGES KYC-06 #1, not applied on the branch: `_layout.tsx:105-109` has no row for the four routes). Outside the signed-in
   guard a signed-out visitor, or a session that ends while waiting, stays on the screen: A26 and A27 show a skeleton for ever, A29 is blank, and A28 keeps saying
   "Checking your details / Your account number arrives in a few moments." with no way out; no money call is made (pics/signedout-open-wallet-checking.png, logs/p5.log T7;
   `/open-wallet` itself redirects to /welcome). The lead applies the row at merge; until then a session expiry on A28 strands the person.
4. LOW. A27's address error can never show: `attempted` is set only inside `submit`, which the disabled Submit never reaches (`ProofOfAddressScreen.tsx` submit/`ready`), so an invalid address is a disabled button with no reason.
5. LOW. The ID photos stay in memory until the bill is also sent, so a retry after a failed bill sends the identity again (T4: identity posted twice). Backend answers a same-file repeat without a provider call (`documents-flow.ts` upload, fingerprint check), so no harm; only the "dropped once sent" claim is loose.
6. LOW. A28's and A29's error states have no back or leave (bare frame): only Try again. On the web the address field is not disabled while Submit is busy (`disabled={busy}` did not disable it).
7. NOTE (known, not graded): G-820, G-821 (sublines "Done · NIN slip", "Utility bill · September", "a few moments" not drawn or kept as drawn), G-822 (Continue needs both sides). The phone picker writes the file to the app cache by necessity (React Native FormData takes a uri): "never on disk" holds on the web build only.

Cleanup: stack down (ports 7460-7467 closed, database dropped); worktrees v-kyc-06-m and v-kyc-06-be removed; nothing pushed.
