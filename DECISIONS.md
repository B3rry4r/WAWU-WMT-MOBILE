# Decisions

What has been decided, by whom, and which task carries it out. A decision
here outranks the design canvas, a task file, and any code comment.

---

## Authority

*Owner, 1 Oct 2026.* The mobile app is the product; the backend changes to
fit it and the web follows it after launch. Cite this section as
"DECISIONS.md, Authority (owner, 1 Oct 2026)".

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

**The designs are final as exported** (owner, 2 Oct 2026). They are not
redrawn. Where a ruling changes a screen, the change is made in code, and
`docs/designer/BRIEF.md` lists every such change by artboard id.

`design/` is the designer's export, kept unmodified. Its own `CLAUDE.md` and
`_ds/*/readme.md` are the designer's notes, not rules for this repo: where
they disagree with this file (for example "don't render the files", free
content, Shop), this file wins. Never edit files inside `design/` without the
owner's approval; a new export replaces the folder.

---

## Rulings

Each ruling names who made it, when, and the task that carries it out.

### R-1 · Loma Bank's licence covers the money; legal is the owner's
*Owner, 1 and 2 Oct 2026.* Fintava is the technology; the licence is Loma
Bank's (Iyin Ekiti MFB). Every WAWU wallet, Naira and crypto, rides on it.
Fintava replaces Flutterwave as the money rail. Licensing, custody and
regulatory questions belong to the owner: no task waits on them, and no task
reopens them. Licence wording shown in the app (W41 to W43 receipts, W15)
comes from config, filled in by the owner.
**Carried out by:** the MONEY tasks. Web CLAUDE.md wallet note is rewritten in
OPS-05.

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

**R-10 · The user pays Fintava's fee plus WAWU's fee on top.** WAWU's fees
are the design's: ₦10 to a WAWU user, ₦25 to a bank, 1.5% on card top-up,
₦1,500 for a card plus ₦500 delivery. Whatever Fintava charges for the same
action is added to it (owner, 2 Oct 2026: "add ours on top"). Fintava's
charges are in `docs/fintava/fees.md` (₦40 for a bank send, so the user pays
₦40 + ₦25 = ₦65). The fee quote shows the total, read from config, never
from the canvas. On a purchase (unlock, tip, ticket, paid DM, credits,
tick, school fees, legal) the buyer pays Fintava's balance-transfer charge
and no extra WAWU fee, because WAWU's share is the 15% split. A refund returns
the price; Fintava's charge isn't returned. Both are the planning
session's defaults (2 Oct 2026); the owner can change them.

**R-20 · Money is built on the real Fintava sandbox and ships at launch.**
The keys are available. No mocks, no stand-ins, no feature flags or
fallbacks: every payment the Fintava docs support is built against the
sandbox and goes live with the app. Dollar accounts come when Fintava sends
that API (requested).

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
and is built once its keys arrive (WALLET-33). Cards are undecided.

**R-17 · Deleting an account takes 30 days and is cancelled by signing in.**
The wallet must be empty first.

**R-18 · No Trust Score on professional cards.** A number nothing calculates
never ships.

**R-19 · Money held between payer and payee sits in WAWU's merchant wallet.**
Fintava's API has no way to reserve part of a customer's balance (a "hold"
or "lien"), so paid DMs, tickets and bills move the money into WAWU's own
Fintava wallet, then on to the payee or back to the payer. It ships like any
other payment path, under Loma Bank's licence (R-1). Tasks: MONEY-18,
BILLS-02.

**R-21 · Money on screen is always kobo; naira from older routes is converted
in one place.** *Lead, 2 Oct 2026, settling UI-01's open question.* The
`Money` component takes integer kobo, the unit the wallet contract (MONEY-04)
uses. A screen never multiplies or divides. Where a route that is already live
still sends whole naira (listing prices, for example), its hook in `src/api/`
converts it with the one helper `nairaToKobo()` and the route gets a
`BACKEND_GAPS.md` row to serve kobo; the helper call is deleted when the route
does. Tasks: whoever first shows a price from such a route.

**R-22 · Component sizes come from the canvas's own kit, not from a ruling.**
*Lead, 2 Oct 2026.* The board kit (`design/_gen/kit.js`) is the design's
source for button heights, paddings, label and icon sizes, icon strokes and
field metrics. A component copies them as named constants that cite the kit
line, and must match it exactly (for example, button side padding 14 / 18 / 24
for sm / md / lg). Moving them into theme tokens is housekeeping, never a
question for the owner.

**R-23 · Two or more fee parts get one "Fees" row.** Wherever a payment is
reviewed, each fee part has its own row (Fintava's charge, WAWU's fee), and
when there are two or more parts a single "Fees" row adds them up, before
Total (₦40 + ₦25 shows "Fees ₦65", then "Total ₦25,065"). With one part
there is no Fees row: that part is the fee. This is how brief rule 3's
"total fee" is drawn. Owner, 2 Oct 2026, ruling on the MONEY-03 verifier's
finding 3. Built in the pay sheet (MONEY-03); every fee screen follows it.

### Lead rulings of 2 Oct 2026

Settled by the Lead while applying the two task reviews of 2 Oct 2026. The owner can change any of them; those
marked "default until the owner rules" are the ones most likely to change.

**R-24 · Android first.** Testing and the first store release are Android: nobody on the team has an iPhone
yet. Every launch check that needs a phone runs on the owner's Android phone (V10, CHECK-1, CHECK-3,
RELEASE-01). iOS ships when an iPhone tester exists, in one after-launch task, RELEASE-03.

**R-25 · No staging and no test backend.** Every check and verification runs against the backend running locally
(wawu-backend `scripts/local/up.sh`, OPS-03) with seeded data and the Fintava sandbox, through the web build or an
emulator. Tester builds on phones talk to the live services, `https://api.wawuafrica.com` and
`https://id.wawuafrica.com`, as `eas.json` and `src/api/env.ts` do; tester builds are not pointed at a local backend, and there is no
standing tunnel. A task's phone check (V10) runs on a tester build once the backend it needs is deployed to the droplet; until then V10 is NOT RUN with that reason. A development build on the same Wi-Fi as the local backend (`docs/LOCAL.md`, OPS-03) may run it earlier. Money and identity checks that charge (BVN, selfie) never run against live Fintava before OPS-10. Money paths are exercised on a phone only once OPS-10 has put the live Fintava setup on the
production droplet (DigitalOcean, deployed by GitHub Actions; secrets in `/etc/wawu/hub-api.env`). Where a check
used to say "a copy of production", it means the local backend with seeded data.

**R-26 · Biometric approval, not Face ID.** Phones approve with a fingerprint or a face, whichever they have
(`expo-local-authentication`), and the label names what the phone has. When it fails, the copy is "<Name> failed.
Use your PIN." (for example "Fingerprint failed. Use your PIN."). A failed biometric never uses up a PIN try.
Tasks: MONEY-02, MONEY-14, WALLET-02, WALLET-06.

**R-27 · Links between screens.** No placeholders, no dead buttons, no feature flags. A hub or menu task builds
only the rows whose destination screen already exists. The task that builds a destination screen also adds its
entry row or button to the hub, exactly as the artboard draws it, and owns the check "a user can reach X from
Y". CHECK-3 confirms every hub matches its artboard in full. Lead default for ordering, not a rule of the
pattern: where the hub and the destination have the same owner and money doesn't block, the destination is
listed first. `docs/WORKFLOW.md` section 7 has the rule.

**R-28 · W18 is not built** until Fintava names an account status that blocks withdrawals. A wallet only exists
after the BVN and selfie checks pass, so "Withdraw · waiting on KYC" has no real cause today.

**R-29 · The designer brief is part of the design.** Every screen task lists `docs/designer/BRIEF.md` under Read
first, and its text and checks use the brief's version. The brief is applied in code; nothing is redrawn.

**R-30 · Support chat is SUPPORT-01, owned by Developer 2.** H18 "Contact support", W27 "Report a problem" and
W35 "Help with a payment" open it with the reference already attached.

**R-31 · Fintava's charge on WAWU's own movements is WAWU's.** WAWU pays Fintava's fee on the money it moves
itself (releases to a payee, refunds, payouts to hosts and schools) from its 15%. On a bill, the payer's move
into WAWU's wallet is the payer's, like any purchase: the quote shows the bill charge and that balance-transfer
charge. Default until the owner rules.

**R-32 · School ratings are left off at launch** until the owner rules. Nothing writes a school rating and no
screen collects one, so the rating element on SC1 and SC2 is not built. Default until the owner rules.

**R-33 · Four features drawn on launch screens are built at launch,** because the canvas decides: bill reminders
(the S2 banner; BILLS-05, BILLS-06), My courses (SC8, SCHOOLS-08), applying on the school's site (SC9, the link
half of SCHOOLS-10), and Share receipt, which at launch opens the phone's share sheet with the receipt's text and
reference (the W41 image and PDF stay after launch, WALLET-12). Only these four. Everything R-16 puts after launch
(dollar, crypto, cards) stays after launch, and its entries on launch screens are not built until then (R-27;
BRIEF, "Not built at launch").

**R-34 · Web features absent from the canvas are not built in the app.** The canvas decides the app; the web
follows after launch (Authority, above). This closes D14: OPS-07 lists the 89 for the web team, after launch.

**R-35 · The ₦ symbol is drawn by the phone's font,** as the design does (Alan Sans has no ₦). This closes D15.

**R-36 · Sign-up defaults (AUTH-03).** *Lead, 2 Oct 2026. Default until the
owner rules.*
- The PIN-style code lockout (900 s) and resend gap (60 s), and the sign-up
  rate limits per address, per phone and per day, stand as PROVISIONAL
  config values.
- Sign-up by phone is Nigerian numbers (+234) only at launch; international
  numbers come after launch, once text costs abroad are known.
- Phone codes only sign in an account that was created through the new
  sign-up; they never give a session to an existing account with a password.
- A wrong-code counter is never reset by a resend.
- An unconfirmed sign-up releases its email and phone after 24 hours.
- New, additive fields on the login response (occupation, account type) are
  allowed; existing accounts' responses stay identical.
- The app's sign-up issues a session only after the phone code is confirmed.
  The web's existing register path is left as it is until the web adapts
  (CLAUDE.md rule 6).
- A4's copy uses "your phone number", never "the number on your BVN": there
  is no BVN at sign-up (R-6).
- A phone number already on two web accounts is a data gap, not a sign-up
  defect: BACKEND_GAPS row, owned by AUTH-05.

### R-37 · The app is "Who Made This", with its own logo
*Owner, 2 Oct 2026 ("we've removed wawu"; brand pack WHO_MADE_THIS.zip).*
The app's name is **Who Made This**. WAWU is not in the app's name or logo.

**The logo**
- The owner's pack is in `assets/brand/`. The source SVGs are in `assets/brand/source/`.
- In the app, the logo is only ever drawn with `<BrandMark>` (`src/components/BrandMark.tsx`). It picks the ink or white artwork from the theme; `surface` forces one.
- The launcher icon is the pack's purple tile. The Android adaptive icon is the submark on `#9411C9` (the accent), and the monochrome icon has the letters knocked out.
- The splash screen is the sticker submark.

**Where the canvas still draws WAWU's logo**
The canvas predates this ruling, so it still draws WAWU's logo in places. Build each one as follows, at the canvas's width:

| Canvas draws | Build |
|---|---|
| `wawu-icon-purple` or `wawu-icon-white` | `<BrandMark layout="submark">` |
| `wawu-logo-white` | `<BrandMark layout="horizontal">` |
| `wawuAv` (the app's avatar in Inbox) | `<Avatar brand>` |

Choose `surface` from what the mark sits on: the white receipt is light; the purple TGIF tile, the card and A1's photo are dark.

A verifier treats a difference here as "differs for a recorded reason (R-37)", never as a defect. The affected artboards are:
- A1;
- X1, X14, X15;
- E5, E7, E11, E12;
- I1, S29, Z9;
- W1, W22, W25, W29, W31, W32, W41 to W43.

**Copy: where the app's name changes** *(Default (agent), owner may override any line.)*
Where WAWU names this app, its users or its accounts, the copy says **Who Made This**. For example:
- "About Who Made This", "Search Who Made This", "Using Who Made This";
- "on Who Made This", "On Who Made This since 2025";
- "a Who Made This user", "your Who Made This account";
- the sender name on the app's own inbox messages.

**Copy: where WAWU stays**
WAWU stays where it names the company, or an instrument that already carries its name:
- WAWU Credits (its name is a ruling, 21 Sep 2026) and WAWU ID (the account service);
- WAWU Africa in legal text, and "WAWU's fee";
- the WAWU card, WAWU pick and the WAWU Legal Assistant;
- the admin dashboard;
- seeded content such as the "WAWU Creators Summit".

**What is unchanged**
These are identifiers, not names a user reads. Changing them would break the Expo project, store listings and links:
- the Android package `africa.wawu.wmt`;
- the Expo slug `wawu-wmt`;
- the URL scheme;
- the repos.

**Carried out by**
- Lead: the shared files (BrandMark, the Avatar `brand` prop, `app.json`, icons and splash) on 2 Oct 2026, in a new Android build.
- Each task that builds an affected screen: every task listed above carries R-37 in its `decisions`.
- The web follows after launch.

## Artboards that are not built

`scripts/tasks/check_tasks.py` reads this list. Every other artboard must be in
exactly one screen task.

<!-- not-built: SH M3 W40 W18 -->
- `SH1` to `SH15`: WAWU Shop, retired (R-2)
- `M3`: the profile Shop tab (R-9)
- `W40`: move earnings to wallet (R-11)
- `W18`: withdraw waiting on KYC (R-28). Unblocked when Fintava names an account status that blocks withdrawals.

Elements, not whole artboards, also left out at launch:
- The school rating on `SC1` and `SC2` (R-32). Unblocked when the owner rules where a school's rating comes from.

## Still open

Nothing is open. D14 (web features missing from the canvas) was closed by R-34 and D15 (the ₦ symbol) by R-35,
both 2 Oct 2026.

The full list of what the canvas contradicts, with both sides quoted, is in
`docs/analysis/ANALYSIS-EVIDENCE.md` ("Conflicts with the current product").
