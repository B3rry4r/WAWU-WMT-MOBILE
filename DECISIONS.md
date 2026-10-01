# Decisions

What has been decided, by whom, and which task carries it out. A decision
here outranks the design canvas, a task file, and any code comment.

---

## Authority

**The canvas in `design/` is authoritative for the UI**: structure, layout,
flow, copy tone and interaction. A screen is built as designed. It is never
reshaped to fit what the API returns today. A shortfall is a backend task,
written to `BACKEND_GAPS.md` with the artboard id.

**The canvas is not authoritative for facts**: money amounts, fees, rates,
limits, FX, hold periods, legal and KYC requirements, statutory text, provider
or bank names, licence claims, and claims about what the system does (holds,
refunds, notifications, settlement times). The design bundle marks many of
these itself with ⚠ ("Final numbers from Fintava"). Where the canvas asserts
one and the system disagrees, work stops and the owner rules. Neither side is
adopted silently.

**The mobile app is the product.** The backend changes to fit it; the web
follows it later (Stage 9).

Artboard ids come from `design/canvas-inventory.json` and task files, never
from a code comment.

`design/` is the designer's export, kept unmodified. Its own `CLAUDE.md` and
`_ds/*/readme.md` are the designer's notes, not rules for this repo: where
they disagree with this file (for example "don't render the files", free
content, Shop), this file wins. Never edit files inside `design/` without the
owner's approval; a new export replaces the folder.

---

## Rulings

Each ruling names who made it, when, and the task that carries it out.

### R-1 · Fintava holds wallet money
*Owner, 1 Oct 2026.* Fintava MFB's banking licence covers custody, so every
user can have a wallet and pay from it. Fintava replaces Flutterwave as the
money rail. Still to confirm with Fintava (task Y-02): whether dollar accounts,
crypto through their custody partner, and the Verve card fall under their
licence and the contract.
**Carried out by:** M-04 onward (lane DEV1-MONEY). Web CLAUDE.md wallet note
is rewritten in Y-24.

### R-2 · Shop is retired; Schools takes its place
*Owner, 1 Oct 2026.* The canvas still draws Shop (flow SH1–SH15, the fourth
Home tile, "My purchases → orders" in the Me menu). Those artboards are not
built. The designer swaps the Home tile and Me menu entry to Schools.
**Carried out by:** Y-05 (designer), Y-06 (backend removal). The creator's
own "Shop" tab on a profile (M3) is a separate question: D4.

### R-3 · The mobile app is Expo (React Native)
*Owner, 1 Oct 2026* ("Expo is good, let's stick to Expo"). Expo SDK 57, the
current `latest` stable on npm at setup (57.0.26, published 29 Sep 2026; SDK 58
was only on the `next` tag). Upgrades follow `npx expo install --fix` and
`npx expo-doctor`, never hand-picked versions.
**Carried out by:** S-01.

### R-4 · Setup choices (made by the setup session; the owner can overrule any)
*Setup session, 1 Oct 2026.*
- Routing: Expo Router, routes in `src/app/`.
- Server state: TanStack Query. API types: generated from the backend
  contract with `openapi-typescript`, called through `openapi-fetch`
  (`src/api/`). No hand-written response types.
- Theme: generated from `design/_ds/wawu/tokens/*.css` into
  `src/theme/tokens.generated.ts` (`npm run tokens`). Dark is the default theme.
- Font: Alan Sans, cut into static weights from the OFL variable font
  (`assets/fonts`), so each weight renders reliably on Android and iOS.
- Gates: `scripts/gates` (verification harness), extended to read JSX text.
- Design renders: `scripts/design/render_design.py`, adapted to this export
  (artboards live in `*.sections.json`, loaded lazily).
**Carried out by:** S-01 (verified by an independent session).

### R-5 · Credits, splits and naming (carried over from the web product)
*Owner, 21 Sep 2026.* One revenue split, 85/15, on every stream. "WAWU
Credits" is the name, shown as a count, never a naira value, never cashable.
No free trial. No em-dashes in anything a user reads (1 Sep 2026).
**Carried out by:** the gates (`scripts/gates/gates.config.json`) and every
task.

---

## Open decisions

Nothing in a task that depends on one of these is built until it is ruled.
Rule by replacing the row with an R-entry above. `tasks/INDEX.md` lists the
tasks each open decision blocks (generated from the task files).

| # | Question | Design says | Today |
|---|----------|-------------|-------|
| D1 | BVN and a liveness selfie at sign-up for everyone? Can people outside Nigeria join without a wallet? | BVN mandatory, NIBSS check, face match (A3–A7) | Email and password; manual KYC only to earn; product rule "no liveness" |
| D2 | Do ticks unlock more uploads, storage and reach? What are the real numbers? | 5 uploads and 1 GB free; 25 and 10 GB ticked (M11, "⚠ Limits are placeholders") | Flat 5 items, 2 GB |
| D3 | Does free content come back? | Paid/Free toggle (M24, M37); ₦0 events (E15) | Every listing has a price |
| D4 | The creator's own "Shop" tab on a profile (M3): keep, rename "Products", or cut? Do the WAWUBasket and WAWUBeauty links go with Shop? | Shop tab lists the creator's products | Products count toward the 5-item cap |
| D5 | Which fees exist, and who keeps them? | ₦10 to a WAWU user, ₦25 to a bank, 1.5% card top-up, ₦1,500 card + ₦500 delivery | None |
| D6 | Do earnings sit apart until the creator taps "Move to wallet"? | Yes (W39, W40), KYC gates the move | Automatic sweep |
| D7 | Schools: who receives the money, at what split, what commission, and how a school is verified | "Fee: No fee"; money "to Greenfield"; school pays commission on tracked link | One split: 85/15 |
| D8 | Free chat between any two users, with send and request money? Paid-message penalty thresholds? | Yes; warn at 20%, switch off at 30% | No free chat; spec says 10/30/50 |
| D9 | Legal: free assistant chat before paying? Consultation fees? | Chat first, free (S14); video ₦15,000, phone ₦10,000, CAC ₦35,000 (placeholders) | Chat after payment; CAC ₦25,000 in code |
| D10 | How are ads sold and paid for? | Sponsored card on TGIF and Today | No ad product |
| D11 | Dollar accounts, crypto and the card in the first release? | All three, marked placeholder | Naira only |
| D12 | Account deletion: 30 days, cancellable? | 30 days, cancel by signing in (Z6–Z8) | 48 hours, not cancellable |
| D13 | "Trust Score" on the professional card (H10)? | "91 Trust Score" | No such thing exists |
| D14 | 89 web features not on the canvas (WAWU Learn, health plans, NEPC, partner services, mentors, EVG score, profile stats, community host tools, notifications page, DM reporting, and more) | Absent | Live on the web |
| D15 | Alan Sans has no ₦ glyph (U+20A6). Every naira sign, in the canvas too, is drawn by a fallback font. Ship a face that has it? | Draws ₦ everywhere | Platform font draws it |

The full list of what the canvas contradicts, with both sides quoted, is in
`docs/analysis/ANALYSIS-EVIDENCE.md` ("Conflicts with the current product").
