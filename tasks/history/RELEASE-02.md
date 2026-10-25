# RELEASE-02 · task records

## R2-MONEY2 (25 Oct 2026, Sonnet builder, T2; CHECK-3 money third pass `audits/CHECK-3/money-work-p3.md`)

Mobile `wmt/R2-MONEY2` from origin/main `1fcf0fd7`; backend `wmt/R2-MONEY2` `8e1f5ab` from origin/main `44e9540` (additive: two notification kinds, one purchase kind, no route, no migration). Stack: Hub on the Nuvion stand-in, mock WAWU ID, ports 9550 to 9555, no Fintava, no live host.

### Re-check on main (real walk)
| Finding | Result | Evidence |
|---|---|---|
| H-01 paid Legal matter cannot be found again | fixed-on-main for every stage before delivery; delivered is by design | walk on the Hub with the app's own `resolveThread` rules: sent, consultant joined, booked (unpaid hold), consultation paid, quote waiting, signed, paid to start each give "open matter"; after delivery Legal opens a new conversation and the documents are reached from the notification (R2-LEGAL2). Still missing on main and built here: no list row for consultant joined or consultation booked, and My purchases listed no legal fee |
| M-01 raw option ids in chips | NOT re-walked (the stack reaches no model); R2-LEGAL3 put the bank's labels on quick replies | not verified here |
| M-02 S24 and S26 unreachable | NOT re-walked | not verified here |

### Fixed
| Item | Before | After |
|---|---|---|
| M-03 W19 withdraw receipt | stored reference `wawu-bank-<uuid>` | `WAW-XXXX-XXXX` by the rule the send receipt uses (`shortReference`) |
| M-03 W21 swap receipt and crypto send receipt | bare UUID | `WAW-XXXX-XXXX` from the id (`wawu-fx-<id>`, `fxReference`). Gap: the Hub's admin lookup finds sends only, not swaps (G-R2M2-1) |
| In-app rows | quote ready only | consultant joined (first consultant line) and consultation booked (once, when the fee is applied) join it; matter-only, assistant matters only, held from push like `legal_quote_ready`; the app lists, icons and routes both |
| My purchases | no legal fees | `legal_fee` rows (paid or refunded), opening the matter |
| Records | W30, W33, W34 missing | added to "Artboards that are not built" (WALLET-22, R-84) |

### Round 2 (25 Oct 2026, Sonnet builder, T2; same branches, merge commits only)
Live proof on the branch's Hub (stack `r2m2b`, ports 9550 to 9555, Nuvion stand-in, mock WAWU ID; Gemini only through a Hub restarted with one allowed host, key from `gemini.env`, never printed):

| Item | Result | Evidence |
|---|---|---|
| Consultant joined and booked rows | proved live | the Legal walk (sent, consultant joined, booked, paid, quote, signed, paid, delivered) wrote `legal_consultant_joined`, `legal_consultation_booked` (once each) and `legal_quote_ready`; in the app (Chromium 390 px) the Notifications list shows all three and a tap on either opens `/legal-matter?id=<the matter>` (`p1-notifications-dark.png`, `p1-booked-opens-matter-dark.png`) |
| My purchases | proved live | two "Legal fee" rows (the consultation and the work, N45,000 each); tapping one opens the matter (`p1-purchases-dark.png`) |
| W19 and the swap receipt | proved live | a bank send of N3,000 on the stand-in shows `WAW-739D-0C6F`; the swap receipt (the stand-in serves no FX, so one completed `FxOperation` row was written to the stack database, read back by the Hub's own `GET /money/fx/swaps/{id}`) shows `WAW-167F-46E6`; no `wawu-bank-` or UUID text on either (`p2-w19-receipt-dark.png`, `p2-swap-receipt-dark.png`). The swap's rate line reads "$1 = N0.00" because the written row's rate text is not the Hub's format: the fixture, not the app |
| "Booked" hook spec | added | `legal-fee-booked-notice.contract.spec.ts` (4 tests: one row for an assistant matter, once, none for a web matter, none for the work fee). Not red first: round 1 had already read the hook, and a mutation check was not run (brief: disable nothing) |
| `me-paid-purchases.contract.spec.ts` | green on a seeded database | `r2m2b_spec_test` migrated and seeded (`db:seed`): 5 suites, 74 tests pass, with `me-paid-purchases-legal`, `legal-matter-notice`, `legal-chat-joined` and `push-policy` |

M-01 and M-02 (the real assistant): the key's free-tier quota answered HTTP 429 on the Hub's default model, `gemini-3.5-flash` and `gemini-2.5-flash` (through the Hub), and `gemini-2.5-flash-lite` (one direct probe); `gemini-3-flash` is 404. So no model turn was walked. What was checked without a model call:
- M-01: not re-walked on a live model. R2-LEGAL3's `readableOption` (`src/legal-intake/ai-text.ts`) turns an option id into the bank's label or a capitalised phrase before the Hub serves a chip; nothing in this round changed it. Status: fixed on main by that code, not seen live here.
- M-02: fixed on main, shown on the Hub. With WAWU's price on `cac-registration` (N35,000, set in the stack database), a conversation whose matter is `business_registration` serves `fixedPrice` (code, name, N35,000, "5 to 7 working days", needs ID, 2 name options, address); `POST /legal/assistant/{id}/start` with a first name choice makes a `quoted` request with no documents; the chat's upload route then signs a PDF upload on that sent matter (the upload itself needs storage, which this stack refuses, so no file was sent). The app draws S24 from `thread.fixedPrice` (not from the catalogue's `requiresDocuments`), so G-LEGAL-06-1 and G-LEGAL-06-2 are closed by R2-LEGAL2 and R2-LEGAL3. The S24 card appears after the assistant's first reply; the model's 429 stopped that here, so `s24-*.png` shows the saved message and the retry line, not the card.

Fixed in round 2 (the lows):
| Item | Before | After |
|---|---|---|
| S20 title | the service name cut to two lines with an ellipsis (`titleLines={2}` in `LegalFrame`) | wraps whole; "Details are in your email." stays off: the Hub sends no email on a booking (no mail transport on that path), so the line would be a promise nothing keeps |
| PT7 | the Hub's sentence, "5000", "Your points are safe." | "You've used 5,000 points on AI tools today. It resets at midnight." from `usedPoints` (the limit when none), and a per-job limit keeps the Hub's sentence with its figures grouped. Four existing assertions pinned the Hub's sentence (`studioFlow`, `dubbingFlow`, `fileToolsFlow`, a per-job one): updated, as the sweep rule says |
| SC11 | an empty sunken cover block on the course page | no block: the Hub serves no course picture (G-624), so none holds its place; the loading shape lost its cover bar too. The school pages' cover blocks are unchanged |
| S19 | the person's own unpaid hold read as taken after backing out of the pay sheet | `dayChips(view, ownHold)`: the hour the matter holds for them (status `awaiting_consultation_payment`, same medium) is drawn free and chosen again; checked in the browser (`s19-*.png`: 09:00 purple, "Mon 26 Oct, 09:00 (Lagos time)") |
| S16 | line "Nothing is charged yet." | fixed-on-main (R2-LEGAL2); the chat shows "Nothing is charged, and no price is quoted until a consultant has read it." |

Pictures (390 px, dark and light, app beside the board): `audits/R2-MONEY2/` has `s19-*`, `s20-*`, `s24-*` (board left, app right) and the five round 1 proof pictures. Not made: PT7 and SC11 (no seeded school, and the points daily limit needs ledger rows the stack lacks; both are covered by tests), the per-theme proof pictures of W19 and the swap receipt.

### Not done
PT7 and SC11 pictures; a live model walk of M-01 and a sent document in the Legal chat (quota and storage); a component test of the S19 pre-selection (the model test covers `dayChips`).

### Checks
Backend: tsc EXIT 0; `legal-matter-notice`, `me-paid-purchases-legal` (red first: 2 failed, then green), `legal-chat-joined`, `push-policy`, `legal-quote-notice` pass; eslint EXIT 0; contract:build EXIT 0 (committed). `push-policy.spec.ts` held list gained the two new kinds. FIX-59's own spec needs the seeded database and was red before this change on this stack. Mobile: tsc EXIT 0; jest 17 suites, 271 tests pass (reference, withdraw, fx model, notifications, push, purchases).
Round 2 checks (logs in the scratchpad `r2m2b-b/logs/`, each with its EXIT line): backend `tsc --noEmit` EXIT 0; eslint on the new spec EXIT 0; `contract:build` EXIT 0 (no change: round 2 touched no route, so the mobile contract is identical to the backend branch's); gates EXIT 0; `check_baseline` EXIT 0; specs (seeded database, by name, none mentions Fintava): `legal-fee-booked-notice` 4 tests, `me-paid-purchases`, `me-paid-purchases-legal`, `legal-matter-notice`, `legal-chat-joined`, `push-policy` 74 tests in 5 suites, EXIT 0. Mobile: `tsc --noEmit` EXIT 0; eslint on the 13 changed files EXIT 0; jest (`--maxWorkers=2`) legal, schools and `route-guard` 13 suites, 615 tests EXIT 0; points `studioFlow`, `dubbingFlow`, `fileToolsFlow`, `capMessage` 4 suites, 82 tests EXIT 0; earlier run of notifications, purchases, withdraw and wallet fx with them: 509 tests pass; gates EXIT 0; `check_baseline` EXIT 0; `check_tasks` EXIT 0. Android fingerprint `17ffb13d520882bf144982b61d03f3994c6e40e4` (unchanged), EXIT 0.
