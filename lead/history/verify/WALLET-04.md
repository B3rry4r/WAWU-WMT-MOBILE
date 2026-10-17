# WALLET-04 round 2 verification (mobile wmt/WALLET-04 3117807)

Verdict: merge. Nothing medium or worse. D1 is fixed.

## D1: a grouped row on W1 opens the group list
- Stack wallet_04 (Hub from backend main 56f94d0, mobile web export of 3117807, own Metro cache, ports 7011/7018 only baked in).
  Seed: my own copy of the builder's, plus a second grouped piece so W1 shows two grouped rows and one plain row.
- Real flow at 390 px, light and dark, each row tapped, then Back:
  - "Unlock . Editing for rhythm, 3 buyers, +N10,000.00" -> /transactions?group=g2.<key B>, no search field, no "Reference" text,
    3 rows (N3,000 + N3,000 + N4,000 = the N10,000 on W1), Back -> /wallet.
  - "Unlock . Lighting night shoots, 3 buyers, +N7,500.00" -> /transactions?group=g2.<key A>, its own 3 rows (3 x N2,500), Back -> /wallet.
  - plain tip row -> /transactions/<id> receipt ("Reference" shown), Back -> /wallet.
  - Double tap on a grouped row and on a plain row: one screen each, one Back returns to /wallet.
- Hand-edited bad keys (g2.bad, 300 characters, nonsense) show the "Couldn't load your transactions" state with the Hub's message; not reachable by a tap, not a finding.
- Pictures (mine): scratchpad/vw4/pairs/{W1-two-groups,group-list-A,group-list-B}-{light,dark}.png (artboard left, built right); the builder's:
  scratchpad/w4r2/pairs/. Only built parts drawn on W1 (no Send, Airtime, card: R-47). The group list has no artboard of its own (accepted in round 1).
- Only consumer of recentRow/RecentTransactions is WalletScreen, which passes onOpenGroup; no other caller can reach an undefined handler.

## The two new tests
- On 376288e (the two test files copied from 3117807 into a scratch worktree): walletHomeModel "carries a grouped row's group key" FAILS
  (Expected "g2.test-key", Received undefined); historyFlow "a user on the Wallet tab taps a grouped row ..." FAILS (Unable to find "Tolu Test").
  A third failure there (the older "a user taps a grouped row ... then one as a receipt") was a 20 s timeout under load average 35-39, not a product failure; it passes on 3117807.
- On 3117807: historyFlow + walletHomeModel, 2 suites, 30 tests pass. WalletScreen.test.tsx 42 tests pass (unchanged by round 2).

## Other checks on 3117807
- eslint on the touched files: 0. tsc --noEmit: 0. npm run tasks: 283 tasks, 0 errors. npm run gates: 0 fail, 5 warn (the known five), 0 accepted.
- GitHub check-runs: not readable from this session (repo not attached), so the full suite is not confirmed here.

## Findings
None new. D2, D3, D4 (lows) are in tasks/SWEEP-MONEY.md and not re-reported.

## Cleanup
Stack wallet_04 down (hub, mock id, mobile pids stopped, database dropped); ports 7011-7018 closed; worktrees v-wallet-04-* removed; nothing pushed.
