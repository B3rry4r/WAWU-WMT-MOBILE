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

### Not done (step budget)
S20 title wrap and the email line, PT7 thousands separator and wording, SC11 empty cover fallback, S19 own hold shown as the person's choice, S16 (the Hub serves "Nothing is charged yet." as `brief.note` and the app draws it: fixed-on-main by R2-LEGAL2, not seen again here), the 390 px pictures.

### Checks
Backend: tsc EXIT 0; `legal-matter-notice`, `me-paid-purchases-legal` (red first: 2 failed, then green), `legal-chat-joined`, `push-policy`, `legal-quote-notice` pass; eslint EXIT 0; contract:build EXIT 0 (committed). `push-policy.spec.ts` held list gained the two new kinds. FIX-59's own spec needs the seeded database and was red before this change on this stack. Mobile: tsc EXIT 0; jest 17 suites, 271 tests pass (reference, withdraw, fx model, notifications, push, purchases).
