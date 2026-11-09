# WEBAPP-03 · round history

Moved out of [tasks/WEBAPP-03.md](../WEBAPP-03.md) word for word, oldest first. The current state is in that file.

## Builder report

Files: see commits d1c6881 (mobile), aae111a (Hub, src/hub-app-config.ts + spec).
Tests: webShare, returnPath, offerStepWeb, abroadFlow (+2), settingsScreens (+1), Hub hub-cors-exposed-headers spec (2 passed). Related run: 118 suites; 6 failed at first because shareOut passed an extra undefined arg, fixed; remaining failures are walletSettingsFlow (4), date-dependent "Changed 3 months ago", fails identically on the lead's clone without my changes.
V7/V9 on stack (real sign-in, desktop Chromium): signed-out /content/<id> kept, after sign-in and the tier offer lands on the piece; /send/abroad/new for a wallet-less user lands on Open your wallet; tier offer shown first start, not on 2 refreshes, shown in a new tab; Share on profile, piece and invite card copies the text and shows "Link copied" (clipboard read back); with navigator.share present it is used and no note; Settings has no Alert sound, Music stays; invite-card draws Share and no Save.
Defaults taken: Notifications row kept (Hub preferences that also apply on the phone); subtitles row and invite Save were already not drawn on web (code and stack).
NOT RUN: receipt Share on stack (same helper, unit-tested); safari/firefox; Retry-After read in a browser on a real 429.
PHONE CHECK: phone browser Share opens the system sheet.

## Verifier report

Lean verifier, 9 Nov 2026. Verdict FIX (finding 1 of WEBAPP-02 touches the share note built here).
| Pass | Result | Evidence |
|---|---|---|
| V1 | passed | affected specs pass (302 in the directly affected dirs; webShare, returnPath, offerStepWeb, abroadFlow, settingsScreens pass). Hub: tsc EXIT 0 after `prisma generate` (the voice-intro errors were the missing generated client in a fresh worktree, 0 errors after); `test:contract hub-cors-exposed` 2 passed. Hub eslint on changed line FAILS prettier (finding 3). |
| V6 | passed with notes | piece Share sheet: Copy link and More put the link in the clipboard, "Link copied" shown, no false failure; Me share copies text + link; invite card draws Share, no Save. Receipt share NOT RUN live (no wallet); call site read, same `shareOut`. No `Share.share` left outside `share.ts` (21 files use shareOut). |
| V7 | passed | signed-out /content/<id> -> welcome -> sign in -> tier offer -> close -> lands on the piece. /send/abroad/new for a wallet-less user -> open-wallet step "Complete your account 1 of 4", not blank. Tier offer: shown at first start, not on 2 refreshes, shown again in a new tab. |
| V9 | passed | real sign-in through the mock ID: Hub-only values seen: "Chidi Umeh", creator-basic@test.wawu.dev, 0800 ••• 0002 on Settings, "SEEDED: 10-Minute Owambe Makeup" with 1,893 views. |
Hub diff: 2 files only (src/hub-app-config.ts exposedHeaders ['Retry-After'], its spec). Header proved by supertest; a real 429 read in a browser NOT RUN.
No dead control: walked every row in Settings and Me at 1440; each opens something or toggles (TGIF and Music switches repaint). Avatar, handle chip and counts on Me do nothing visible (same as the phone, not judged dead).
Findings:
3. low: Hub `src/hub-app-config.ts` line 47 fails prettier (eslint error); spec has 2 no-unsafe-argument warnings.
4. low/unclear: where `navigator.share` exists (Chrome on Windows or ChromeOS) a desktop user gets the OS sheet, not copy, against the check's wording.
5. low/unclear: copied links read wawuafrica.com/..., not usewmt.com.
