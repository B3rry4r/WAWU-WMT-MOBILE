# WEBAPP-02 · round history

Moved out of [tasks/WEBAPP-02.md](../WEBAPP-02.md) word for word, oldest first. The current state is in that file.

## Builder report

Files: src/lib/{WebFrame,FrameModal,useFrameWidth}.tsx/ts, src/app/_layout.tsx (wrapper only), 7 Modal users, 10 width readers, SHARED-CHANGES.md.
Checks: specs src/__tests__/webFrame.test.tsx (9: width rule, web 1440 column, Platform android and 390/430 no wrapper, resize follows via Dimensions events, FrameModal). 88 related suites, 1903 tests passed. tsc EXIT 0, eslint EXIT 0.
Pictures (stack, Chromium, /tmp/wmt-shots/webapp02/): home, explore, inbox, wallet, me, settings, abroad-new, comments modal at 1440 and 390 light and dark (32), plus artboards H1 X1 I1 H21 H22 (10). Looked at: Home and comments at 1440 dark are a centred 390 column; 390 pictures match the phone layout. Wallet, Me, Inbox 1440 taken, not individually inspected.
Default taken: column 390 (not 430) from windows over 600, matching BottomSheet's own cap. A BottomSheet scrim covers the whole window (fenced component), its sheet sits in the column.
Not proven: 390 before-and-after pixel equality (no before build); Safari and Firefox NOT RUN.

## Verifier report

Lean verifier, 9 Nov 2026, mobile ef7bb9c. Verdict FIX.
| Pass | Result | Evidence |
|---|---|---|
| V1 | passed (mobile) | tsc EXIT 0, eslint on 60 changed files EXIT 0, 144 related suites: 143 pass, 4 tests fail in walletSettingsFlow, same 4 fail on main (fixture text "Changed 3 months ago", date-dependent; clock not changed to prove it). Gates and full check are the merge agent's. |
| V5 | FAIL | 52 builder shots + my 28 (home, explore, inbox, wallet, me, settings, abroad-new, 1440 and 390, light and dark) + 28 baseline from WEBAPP-PLAN base 18f86cd, looked at all; /tmp/wmt-shots/v-webapp02/. 1440: every tab is a centred 390 column. 390 equals the base except the Alert sound row (removed on web, intended) and the tier offer (base shows it every load). |
| V6 | partly | Share toast outside column (finding 1). Wallet tab with a wallet NOT RUN (no wallet on the stack; wallet-less users get the open-wallet step in every Wallet and abroad-new picture, as the builder's did). Resize without reload covered by jest only. Safari, Firefox NOT RUN. |
Findings:
1. medium defect: the "Link copied" note (`src/lib/shareNote.tsx`) sits in its own Modal, so at 1440 it is a bar across the whole window, over the sheet, outside the column (v6-piece-More.png, builder's share-note-*.png). The task says toasts stay in the column.
2. low: BottomSheet scrim greys the whole window at 1440 (known default); sheet itself sits in the column.
3. low: the column draws hairline side borders (no artboard draws them); harmless.
