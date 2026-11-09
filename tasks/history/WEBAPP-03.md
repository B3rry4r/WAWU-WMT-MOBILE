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

