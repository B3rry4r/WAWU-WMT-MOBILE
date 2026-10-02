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
licence and the contract. Fintava's published examples (2 Oct 2026) put
customer accounts at Loma Bank (Iyin Ekiti MFB), so the bank name and licence
wording in the app wait on Fintava's answer (`docs/fintava/naira-api.md`,
question 5).
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

### Owner rulings of 2 Oct 2026

Answered by the owner in the planning session. Each names the tasks that carry
it out; `tasks/INDEX.md` shows where they sit.

**R-6 · Identity checks happen when someone opens a wallet, not at sign-up.**
Sign-up is email and phone only. The BVN, details, selfie, account opening and
PIN screens (A5 to A10, A14, A16) form "Open your wallet", which starts the
first time anyone taps Wallet or anything that moves money. People without a
Nigerian BVN can't open a Naira wallet; dollar and crypto accounts are for
them, after launch (R-16). Tasks: KYC-01 to KYC-04, AUTH-03 to AUTH-05,
MONEY-12, MONEY-13.

**R-7 · Ticks unlock more, with the design's numbers.** Free accounts: 5
uploads and 1 GB. With a tick: 25 uploads, 10 GB and more reach. Confirmed by
the owner, so not provisional.

**R-8 · Free content is allowed.** A Paid/Free switch on uploads, and ₦0
events. Free pieces count toward the upload limit; fans can still tip.

**R-9 · No Shop tab on profiles.** Creators don't sell physical products yet.
Profile tabs are Content, Services and About; M3 is not built.

**R-10 · Fees are the design's, and WAWU keeps the margin.** ₦10 to a WAWU
user, ₦25 to a bank, 1.5% on card top-up, ₦1,500 for a card plus ₦500
delivery. WAWU pays Fintava's cost out of these. The fee quote reads them from
config.

**R-11 · Earnings land in the wallet automatically.** No "Move to wallet": W39
is built without that button, and W40 is not built. A creator without a wallet
keeps earning; the money waits and lands the moment they open one.

**R-12 · School fees split 85/15**, like everything else.

**R-13 · Free chat between any two users,** with send and request money in
chat. Creators are warned at 20% unanswered paid questions and paid messages
pause for 7 days at 30%.

**R-14 · Legal prices are set by WAWU** in admin, never in the app or in code.
The chat-first flow is built as designed.

**R-15 · Ads at launch, booked by the WAWU team and invoiced by hand.**
Self-serve buying comes later.

**R-16 · Dollar, crypto and cards come after launch.** No dollar account yet.
Crypto runs through Cardex (Fintava's crypto partner, `docs/fintava/cardex.md`)
once its keys arrive, and needs the custody question in that file answered
first. Cards are undecided.

**R-17 · Deleting an account takes 30 days and is cancelled by signing in.**
The wallet must be empty first.

**R-18 · No Trust Score on professional cards.** A number nothing calculates
never ships.

## Artboards that are not built

`scripts/tasks/check_tasks.py` reads this list. Every other artboard must be in
exactly one screen task.

<!-- not-built: SH M3 W40 -->
- `SH1` to `SH15`: WAWU Shop, retired (R-2)
- `M3`: the profile Shop tab (R-9)
- `W40`: move earnings to wallet (R-11)

## Still open

Nothing waits on these.

**D16 · Holding money between payer and payee.** Fintava has no hold or lien
(`docs/fintava/naira-api.md`). Paid DMs, tickets and the bill reversal step
can only hold money in WAWU's merchant wallet, which means WAWU holding
customer money. Until Fintava says whether that's allowed under their
licence (question 2), the hold is built behind a flag that stays off in live
(MONEY-18), and nothing else waits.

**D14 · Web features missing from the canvas.** 89 things on the web don't
appear in the design (WAWU Learn, health plans, mentors, the EVG score,
community host tools and more). Until ruled, nothing changes on the web. Rule
each one in OPS-07.

**D15 · The ₦ symbol.** Alan Sans has no ₦ glyph, so the phone's own font
draws it, in the design too. Until the designer answers (OPS-04), the
fallback stays.

The full list of what the canvas contradicts, with both sides quoted, is in
`docs/analysis/ANALYSIS-EVIDENCE.md` ("Conflicts with the current product").
