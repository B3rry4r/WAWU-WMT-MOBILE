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
follows it after launch.

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
money rail. Still to confirm with Fintava (task OPS-02): whether dollar accounts,
crypto through their custody partner, and the Verve card fall under their
licence and the contract.
**Carried out by:** the MONEY tasks. Web CLAUDE.md wallet note
is rewritten in OPS-05.

### R-2 · Shop is retired; Schools takes its place
*Owner, 1 Oct 2026.* The canvas still draws Shop (flow SH1–SH15, the fourth
Home tile, "My purchases → orders" in the Me menu). Those artboards are not
built. The designer swaps the Home tile and Me menu entry to Schools.
**Carried out by:** OPS-04 (designer), OPS-08 (backend removal). The creator's
own "Shop" tab on a profile (M3) is a separate question: D4.

### R-3 · The mobile app is Expo (React Native)
*Owner, 1 Oct 2026* ("Expo is good, let's stick to Expo"). Expo SDK 57, the
current `latest` stable on npm at setup (57.0.26, published 29 Sep 2026; SDK 58
was only on the `next` tag). Upgrades follow `npx expo install --fix` and
`npx expo-doctor`, never hand-picked versions.
**Carried out by:** SETUP-01.

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
**Carried out by:** SETUP-01 (verified by an independent session).

### R-5 · Credits, splits and naming (carried over from the web product)
*Owner, 21 Sep 2026.* One revenue split, 85/15, on every stream. "WAWU
Credits" is the name, shown as a count, never a naira value, never cashable.
No free trial. No em-dashes in anything a user reads (1 Sep 2026).
**Carried out by:** the gates (`scripts/gates/gates.config.json`) and every
task.

---

## Open decisions, and what to build until you rule

Nothing waits on these. Each one has a default that work follows now. Any
number a default needs (a fee, a limit, a split, a price) goes into config with
a `PROVISIONAL(...)` marker: the gates allow it while building and refuse it in
a release build, so nothing unconfirmed can ship. Changing a default later
changes config or a flag, not the screens. Confirm or change them in task
OPS-01.

**D1 · Sign-up identity checks**
- Design: BVN for everyone, checked with NIBSS, plus a face match (A3 to A7). Today: email and password; ID checks only to earn.
- Build now: the design's sign-up, behind a flag. People without a BVN can still join; they just can't open a wallet. ID checks go through Fintava, or a vendor if Fintava doesn't offer them.

**D2 · Ticks unlock more uploads**
- Design: 5 uploads and 1 GB free; 25 uploads and 10 GB with a tick (M11, marked placeholder). Today: a flat 5 and 2 GB.
- Build now: allowances read from config, set to the design's numbers and marked provisional.

**D3 · Free content**
- Design: a Paid/Free switch (M24, M37) and ₦0 events (E15). Today: every listing has a price.
- Build now: the switch, behind a flag that is off until you confirm.

**D4 · The creator's "Shop" tab (M3)**
- Design: a Shop tab listing the creator's own products. Today: products count toward the 5-item cap. WAWU Shop itself is retired (R-2).
- Build now: the tab, labelled "Products". The WAWUBasket and WAWUBeauty links stay as they are.

**D5 · Fees**
- Design: ₦10 to a WAWU user, ₦25 to a bank, 1.5% card top-up, ₦1,500 card plus ₦500 delivery.
- Build now: every fee comes from the server's fee quote, read from config. The design's numbers go in, marked provisional, until Fintava's schedule (OPS-02) and your ruling replace them.

**D6 · Earnings**
- Design: earnings sit apart; the creator taps "Move to wallet", and KYC gates that move (W39, W40). Today: automatic sweep.
- Build now: the design's version.

**D7 · School payments**
- Design: "No fee"; the money goes to the school; the school pays WAWU a commission on tracked-link sign-ups. Today: one split, 85/15, on everything.
- Build now: the split and the commission rate read from config, set to the current 85/15 and marked provisional.

**D8 · Free chat and the reply-rate penalty**
- Design: any two users can chat free and send or request money; creators warned at 20% unanswered paid messages and switched off at 30%. Today: no free chat; the spec says 10/30/50.
- Build now: the design's version; thresholds read from config, set to 20 and 30 and marked provisional.

**D9 · Legal**
- Design: free assistant chat before paying; video ₦15,000, phone ₦10,000, business-name registration ₦35,000 (placeholders). Today: chat after paying; ₦25,000 in code.
- Build now: the design's chat-first flow; every price read from config, marked provisional.

**D10 · Ads**
- Design: a sponsored card on TGIF that takes TGIF's place on Today when TGIF is off. Nothing about pricing.
- Build now: the placement, plus admin booking and reporting. Ads are sold and invoiced by hand.

**D11 · Cards, dollar and crypto accounts**
- Design: all three, marked placeholder until Fintava confirms.
- Build now: nothing. These need Fintava to confirm their contract and API first (OPS-02). They are in the list as after-launch tasks.

**D12 · Deleting an account**
- Design: 30 days, cancelled by signing in (Z6 to Z8). Today: 48 hours, can't be cancelled.
- Build now: the design's version, with a check that the wallet is empty first.

**D13 · "Trust Score" on professional cards (H10)**
- Design: "91 Trust Score". Today: no such score exists.
- Build now: the card without it. A number with nothing behind it never ships.

**D14 · Web features missing from the canvas**
- 89 things on the web don't appear in the design (WAWU Learn, health plans, mentors, the EVG score, community host tools and more).
- Build now: nothing changes on the web. Rule each one in OPS-07.

**D15 · The ₦ symbol**
- Alan Sans has no ₦ glyph, so the phone's own font draws it, in the design too.
- Build now: the fallback. The designer answers in OPS-04.

The full list of what the canvas contradicts, with both sides quoted, is in
`docs/analysis/ANALYSIS-EVIDENCE.md` ("Conflicts with the current product").
