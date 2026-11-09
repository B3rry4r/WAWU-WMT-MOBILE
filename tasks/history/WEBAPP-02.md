# WEBAPP-02 · round history

Moved out of [tasks/WEBAPP-02.md](../WEBAPP-02.md) word for word, oldest first. The current state is in that file.

## Builder report

Files: src/lib/{WebFrame,FrameModal,useFrameWidth}.tsx/ts, src/app/_layout.tsx (wrapper only), 7 Modal users, 10 width readers, SHARED-CHANGES.md.
Checks: specs src/__tests__/webFrame.test.tsx (9: width rule, web 1440 column, Platform android and 390/430 no wrapper, resize follows via Dimensions events, FrameModal). 88 related suites, 1903 tests passed. tsc EXIT 0, eslint EXIT 0.
Pictures (stack, Chromium, /tmp/wmt-shots/webapp02/): home, explore, inbox, wallet, me, settings, abroad-new, comments modal at 1440 and 390 light and dark (32), plus artboards H1 X1 I1 H21 H22 (10). Looked at: Home and comments at 1440 dark are a centred 390 column; 390 pictures match the phone layout. Wallet, Me, Inbox 1440 taken, not individually inspected.
Default taken: column 390 (not 430) from windows over 600, matching BottomSheet's own cap. A BottomSheet scrim covers the whole window (fenced component), its sheet sits in the column.
Not proven: 390 before-and-after pixel equality (no before build); Safari and Firefox NOT RUN.

## Verifier report

