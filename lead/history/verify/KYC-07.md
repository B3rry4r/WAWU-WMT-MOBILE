# KYC-07 verifier report (mobile wmt/KYC-07 8f360cd on wmt/KYC-06 96f92d7; backend main a5e48fc untouched)
Verdict: merge (nothing medium or worse). Five lows for the area sweep.

## Checks (evidence under scratchpad/kyc-07-v: logs/, pics/, chain*.py, attacks.py, heap.py, dto_check.js)
- Stack kyc_07 (Hub 7510, mobile export 7513, mock WAWU ID 7517); bundle grep: only localhost:7510 and :7517. Real sign-in through the mock ID; /api/hub/money/* fixtured in the browser only. Stack down, worktrees removed, ports closed.
- typecheck EXIT 0; jest (HomeScreen, OpenWalletScreen, reviewChain) 3 suites, 81 tests pass; gates 10 run, 702 files, 0 fail, 5 warn (as builder); no em-dash in new user copy.
- Chain A30 -> A31 -> A5 (typed) -> A26 -> A27 -> Submit, dark: no BVN check sent, no selfie step; ONE open call, body = firstName,lastName,dateOfBirth,gender,address,postalCode,idType,idNumber,proofOfAddressType,city,state,bvn,nin. Run through backend main's real ValidationPipe (whitelist, forbidNonWhitelisted, transform) on OpenNairaWalletDto: ACCEPTED; controls (checkHandle with bvn, extra key phone) refused.
- Numbers: localStorage/sessionStorage/cookie/URL/history.state/console scans 0 hits; no other request carries them; retries after 500, 400, connection reset send identical bodies, nothing leaks; double-click on A31, A5, A26 Continue = one push each; double-click Submit = one open call.
- Drop: Chromium heap snapshot after GC: plain digits present at A5/A27 (control), 0 after leaving to Home and 0 after Submit success. Jest probe (temp, deleted): adoptSession then signOut clears numbers and person, voids old tickets, other accounts read nothing, keepCheck wipes numbers. Cold deep link to /open-wallet-details lands on A31.
- Flag: not_open and opening show it; open, frozen and wallet read failure do not; no figure drawn (Wallet notice only, R-47). Old flow (no openingFlow) still runs POST /money/identity/bvn.
- Pictures A30, A31, A14 at 390 px light and dark beside the boards: pics/cmp-a30.png, cmp-a31.png, cmp-a14.png. Match except findings 1 and the recorded A30 difference (no hidden balance card, R-47).

## Findings (all low)
1. A14 BVN hint: board turns "Dial *565*0# to get it" red with a CircleAlert; built keeps the muted hint under the red ring. src/features/open-wallet/OpenWalletScreen.tsx, BVN AuthField (hint/invalid, about line 345-360). Repro: check flow, POST /money/identity/bvn 422 bvn_phone_mismatch, picture a14.
2. Review path keeps the typed BVN and NIN in A31's fields, so Back from A5 shows both in full (the check path clears them and shows last 4). OpenWalletScreen.tsx submit() review branch (about line 313-317). Repro: heap.py, pics/a31-after-back-dark.png.
3. Grouped copies of the typed numbers ("2219 0000 111", 2 each) stay in the page's JS heap after the flow closes (back-out and success) and a forced GC; the store's plain digits are gone. Retainer not found; not compared with main. Nothing on disk, in URL, console or network.
4. icons.generated.ts also drops `Hash` (disclosed in SHARED-CHANGES KYC-07 #2; unused in src on the branch and on main) though the brief says adds only; a batch-7 branch using Hash would fail typecheck at merge.
5. Test-gap: the account-switch tests in OpenWalletScreen.test.tsx now assert only that the BVN field appears (no account-specific value is drawn any more); nothing leaks, but the old phone-leak assertion is gone.

## Not run
Mobile CI check-runs (no GitHub access to the mobile repo from this session). Open call against a real Nuvion Hub (none on this machine; fixture only).
