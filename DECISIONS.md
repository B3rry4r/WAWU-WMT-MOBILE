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
*Updated by R-62 (owner, 16 Oct 2026): community messages cost credits by kind (text and emoji free, a photo 1, a video or voice note 3), replacing "every metered message costs a credit".*

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
*Updated by R-59 (owner, 16 Oct 2026): Home always shows the ad card; the Explore slider alternates events and adverts; a campaign needs artwork.*
*Updated by R-92 (owner, 26 Oct 2026): an ad opens the advertiser's web link, or does nothing; ads are not tied to events.*

**R-16 · Dollar, crypto and cards come after launch.** No dollar account yet.
Crypto runs through Cardex (Fintava's crypto partner, `docs/fintava/cardex.md`)
and is built once its keys arrive (WALLET-33). Cards are undecided.
*See R-64 (owner, 16 Oct 2026): tips and prices stay Naira only; the Dollar and USDT picker waits for dollar accounts.*

**R-17 · Deleting an account takes 30 days and is cancelled by signing in.**
The wallet must be empty first.
*Updated by R-50 (owner, 16 Oct 2026): buyers keep the paid content they bought.*

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

**R-27 · Links between screens.** *In force again by R-47 (9 Oct 2026); R-46's change to it is withdrawn.* No placeholders,
no dead buttons, no feature flags. A hub or menu task builds
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

*Updated by R-69 (owner, 16 Oct 2026): where the app names itself, the copy is "Who Made This?" with the question mark. The logos and the mapping above are unchanged.*

### R-38 · The bottom bar does not get a Studio tab
*Owner, 6 Oct 2026 ("bugs like this would not be condoned", about the boss brief v2.0's centre "Create ✨" Studio tab).*
The bottom bar stays as the canvas and SHELL-01 draw it, **Home · Explore · Inbox · Wallet · Me**, and Create stays the floating button for creator accounts. (Corrected 7 Oct 2026 after the CHECK-1 audit, F-2: this line first quoted the old web app's bar by mistake; the ruling itself, no Studio tab, is unchanged.) This holds even if Claude Design is updated to draw a Studio tab: a canvas that puts Create or a Studio tab in the bar is a design defect to report, not a ruling to build. If AI tools ship, they sit behind the Create button.

**Carried out by:** every navigation and AI-tools task; a verifier treats a bar with a sixth or swapped slot as a defect.
*Updated by R-61 (owner, 16 Oct 2026): AI tools are also a Home tile (Studio). The bar is unchanged.*

### R-39 · The wallet provider moves from Fintava to Nuvion, reversibly
*Owner, 6 Oct 2026.*
- **Provider:** Nuvion replaces Fintava. Nuvion is licensed in Nigeria (owner, from Nuvion directly); do not re-raise it.
- **Reversible:** Fintava is switched off, not deleted. One setting (`WALLET_PROVIDER`) picks the provider, and rollback is changing it and restarting (MONEY-20).
- **No SMS:** codes go by email, as before. Sign-up verification moves to the email code (AUTH-07); forgot-PIN codes move to email in the wallet rebuild.
- **Selfie:** use Nuvion's hosted selfie check if its API can start one for our users; if Nuvion's KYC has none, the selfie step is dropped.
- **Facts from Nuvion's own dashboard code:** `POST /counterparty-lookups` returns the account holder's name for a NIP account; `/kyc/liveness/sessions` starts the hosted selfie check; `/fee-simulations` previews a fee.
- **Bills:** Nuvion has no bill payments. Bills stay off until the owner drops them or picks a separate bills provider.
- **Waiting on:** Nuvion's NGN fees and limits (the owner is asking).

**Carried out by:** MONEY-20 (the provider seam), AUTH-07 (email sign-up codes), then a Nuvion adapter task once fees and limits are in. R-1's Loma Bank licence line is superseded by this ruling.
*Updated by R-72 (owner, 19 Oct 2026): the sign-up code and the wallet PIN reset code both go by email at launch (`SIGNUP_VERIFY_CHANNEL=email`); a text-message provider comes later, only if the owner names one.*

### R-44 · Payments on the web are the same as the app
*Owner, 8 Oct 2026 ("Same as the app"; payments are the priority now).*
- On the website (wawuafrica.com) people can buy a tier, buy points, add money by bank transfer and pay from their wallet, through the same Hub routes as the app. The website is not a checkout that the app sends people to, and there is no card payment for now.
- The money freeze is lifted for all payment work, not only the Nuvion adapter (R-42). Builders build against the provider seam (MONEY-20) with Nuvion stood in until its sandbox key works.

**Carried out by:** the payment plan (`docs/PAYMENTS-PLAN.md` and its tasks: the Nuvion adapter, tiers and points, then the web payment screens).

### R-45 · Nuvion is the wallet provider; Fintava stays only for bills
*Owner, 8 Oct 2026 ("Nuvion is the go-to"; "the only thing we are keeping from them" is bills payments).*
- Every wallet is opened and run on Nuvion. Production moves to `WALLET_PROVIDER=nuvion` once wallet opening on Nuvion is built, checked and set up live (NUV-02, NUV-03, NUV-04, the opening part of NUV-10).
- Fintava stays for bills payments only (BILLS tasks). Its wallet code stays in the repo behind the provider seam, unused, in case it is needed; nothing is deleted.
- The website opens wallets first (WEBPAY-01). Naira first: dollar wallets (NUV-09) are not needed for the website's opening. Until the app's open-wallet screens ask for what Nuvion needs (G-460), the app sends a person with no wallet to the website to open it (lead default).
- Every agent runs on Sonnet, and every screen shows its full designed UI with unbuilt parts present but inert (owner, 8 Oct 2026).

**Carried out by:** NUV-02, NUV-03, NUV-04, WEBPAY-01, NUV-10 (opening part), then the app fixes in BRAND-01.

### R-46 · The UI is always complete (withdrawn by R-47, 9 Oct 2026)
*Owner, 8 Oct 2026 ("if the screens are not ready ... it doesn't mean the UI should be incomplete"; "you are still going to show what is exact what is here only that when it is clicked it's not going to open anything because it has not been built").*
This replaces the hiding half of R-27 and the "left out" line of R-41.
- Every built screen draws its whole artboard (the brief's version, R-29): every row, tile, tab, button, icon and section, light and dark.
- An entry whose screen is not built yet is drawn exactly as designed and does nothing when tapped. In code its handler is `unbuilt('<TASK-ID>')`, naming the task that builds where it leads. The gate fails when that task does not exist or is already built (`review` or `done`), so the task that builds a screen still wires its entry, as R-27 says.
- A section with nothing to show (the Hub serves none, or its task is not built) draws its designed empty state. Where the canvas draws none, it draws the section's heading and frame with a neutral placeholder picture. Never an invented name, figure or price (rule 7; the fake-data gate still applies).
- After-launch entries (the `docs/designer/BRIEF.md` list "Not built at launch") are drawn and inert too.
- Still never: a "coming soon" label, a toast or alert saying a feature is missing, a feature flag, or a section left out. An entry drawn with `unbuilt` is not a dead button under V1; an entry left out is a defect. A screen with no way in (Settings was one) is a defect.
- Lead default, owner may override: an inert entry looks exactly as drawn, with no greying and no message.

**Carried out by:** COMPLETE-01 (the `unbuilt` helper and its gate), then COMPLETE-02 Explore, COMPLETE-03 Home, COMPLETE-04 Me, COMPLETE-05 Wallet and COMPLETE-06 (Inbox, Settings, the pay sheet, sign-up and profile edit). BRAND-01 adds the Settings entry. Every later screen task follows this.

### R-47 · Show only what is built (reverses R-46)
*Owner, 9 Oct 2026: "UI isn't even necessary to be there if the tasks are not complete", and the website wallet comes first.*
- R-46 is withdrawn; R-27 and R-41 are in force again. A part of a screen whose task is not complete is not drawn: no inert entries, no placeholder rows or tiles for unbuilt screens. The task that builds a screen adds its entry, exactly as drawn, and owns "a user can reach X from Y".
- A section whose own task is complete stays drawn, with its designed empty state when the Hub serves nothing.
- FIX-29 removes the inert entries R-46 added (every `unbuilt('<ID>')` site and BRAND-01's seven do-nothing menu rows). COMPLETE-03, COMPLETE-04 and COMPLETE-06 are cancelled. The `unbuilt` helper and its gate stay in the repo, unused.
- Order of work: the website wallet (WEBPAY-01 and the Nuvion opening tasks it needs) takes agent slots first; app UI work never goes ahead of it.

**Carried out by:** FIX-29.

### R-48 · Event registration link: register and pay on the website, finish in the app
*Owner, 10 Oct 2026 ("a registration page on the web where they also pay a 2k fee for the 1k subscription"; "It's a
registration link, like a wait list .... dont mess with the sign up page").*
- People at a WAWU event register on wawuafrica.com/join (name, phone, email) and pay the event fee, ₦2,000 today,
  for the ₦1,000 tier (Verify). It is a waiting list, not an account: no WAWU ID account, password or OTP; the
  website's sign-up page is not touched. The rest happens in the app: signing up there with the same phone or email
  turns the paid registration into the tier (JOIN-03).
- The fee is a config value (`event_offers` in the price file), never a literal. It is paid by Flutterwave checkout
  (card, bank transfer, USSD), the rail that is live in production today; this is an exception to R-44's "no card" for
  this fee only, because the Nuvion wallet is not live yet. WAWU is the merchant of its own fee, so no creator money is
  held (the wallet note is unaffected).
- Owner answers, 10 Oct 2026: the ₦2,000 buys whatever the ₦1,000 Verify tier gives ("whatever the 1k own says");
  the plan's days start when the person joins the app (the claim, JOIN-03); the link stays open until the owner says
  (no `open_until`; closing is a config change). The page shows no offer card, no plan length and no start date
  ("Don't write the plans time there"); the price appears only on the Pay button.
- Owner, 12 Oct 2026: the landing page at wawuafrica.com shows too; its sign-up buttons go to /join and nothing on it leads into the closed parts of the site.
- Owner, 12 Oct 2026: the ₦2,000 event offer gives a full year of verification (365 days); the page says so.
- Owner, 14 Oct 2026: /join takes referral codes. Each code names a community and sets the price its users pay (₦0 to the standard price) with an optional limit; past the limit, or when switched off, a person pays the standard price and is not counted under the code. LOGOART: ₦1,200 for the first 4,000.

**Carried out by:** JOIN-01 (backend routes and payment), JOIN-02 (the website page), JOIN-03 (claim in the app, filed
next).

### R-49 · The app comes first; the developers' tasks are the lead's; Sonnet agents only
*Owner, 10 Oct 2026 ("proceed to building the app ... leave the web, the registration link is enough for now ...
leave the web tasks and proceed with all app full integrations ... claim all other dev tasks as their subscriptions
are up ... never use opus agents again to do tasks").*
- The app and the backend it needs are the work. Website tasks are paused: WEBPAY-01 to WEBPAY-05, FIX-23, the web
  half of FIX-25 and of FIX-16. The website serves only the registration link and the landing page (R-48, owner, 12 Oct 2026), and stays that way until the
  owner says otherwise. This reverses the 9 Oct "the website wallet comes first".
- Every open task owned by Developer 2 or Developer 3 is taken over by the lead's agents (owner `YOU`, with a
  "Taken over" line). Their half-built branches are continued, never restarted.
- Every builder and verifier is a Sonnet agent. The lead orchestrates, rules and merges; it builds nothing itself.
- The order of work is the dependency order in `tasks/INDEX.md`: the money core (MONEY-17, then MONEY-18, MONEY-19,
  MONEY-16 and the Nuvion tasks) first, because most of the app's remaining screens pay from the wallet.

**Carried out by:** the lead's queue, one task per agent. The cap was four agents at a time until the owner raised it on 10 Oct 2026 ("Spawn more agents and carry more work"): now up to nine Sonnet agents at once, bounded by the machine's memory (a heavy run starts only with 5 GB free).

## Artboards that are not built

`scripts/tasks/check_tasks.py` reads this list. Every other artboard must be in
exactly one screen task.

<!-- not-built: SH M3 W40 W18 W16 M11 M12 M13 M14 M27 VF5a VF13a PT4a W30 W33 W34 -->
- `SH1` to `SH15`: WAWU Shop, retired (R-2); the 16 Oct 2026 export no longer draws them
- `W16`: add money by card, "Removed: transfer only" on the 16 Oct 2026 canvas (R-16, R-42); WALLET-36 is cancelled
- `VF5a`, `VF13a`, `PT4a`: the dollar variants of the tier cards, the all-products-used sheet and the points packs. Dollar prices wait for dollar accounts (R-16, R-65). Unblocked when a person can be billed in dollars (dollar accounts, WALLET-32).
- `M11` to `M14`: the verification tick, "Replaced by VF5 to VF7" on the 16 Oct 2026 canvas (R-43); ME-12 is re-cut to VF5 to VF7
- `M3`: the profile Shop tab (R-9)
- `M27`: "5 free uploads used" (Lead ruling, 25 Oct 2026, R2-AUTHME3, CHECK-3 D-p3-4). Under R-43 uploading needs a paid tier, so a person with no tier has no free uploads and the Hub serves `uploads.allowed 0`: the state the board draws cannot occur. The Hub's `FREE_UPLOADS` constant is left as it is. The meter and its note for a person with a tier are M19 and M21.
- `W40`: move earnings to wallet (R-11)
- `W18`: withdraw waiting on KYC (R-28). Unblocked when Fintava names an account status that blocks withdrawals.
- `W30`, `W33`, `W34`: the physical card's delivery form, the card's limits and channel switches, and the card PIN. Nuvion issues no physical card and serves no limits, channel switches or card PIN, so the WAWU card is what Nuvion serves (R-84, R-47). WALLET-22 records the three as not built (CHECK-3 money third pass; R2-MONEY2). Unblocked when Nuvion serves them.

Elements, not whole artboards, also left out at launch:
- The school rating on `SC1` and `SC2` (R-32). Unblocked when the owner rules where a school's rating comes from.

## Still open

Nothing is open. D14 (web features missing from the canvas) was closed by R-34 and D15 (the ₦ symbol) by R-35,
both 2 Oct 2026.

The full list of what the canvas contradicts, with both sides quoted, is in
`docs/analysis/ANALYSIS-EVIDENCE.md` ("Conflicts with the current product").

### R-40 · Changing ticket prices needs a current verification and goes back to review
*Owner, 7 Oct 2026 ("yes then add it", on event price edits).*
`PUT /events/:id/tickets`, the web's route for a host's ticket tiers and prices, follows the same rules as creating or editing an event: the host must hold a current verification (B3, hosting is verified-only), and a change to an approved event sends it back to review. Once a ticket is sold, tiers stay locked as they are today (409). This is a deliberate change to a protected route.

**Carried out by:** EVENTS-11.

### R-41 · Every tab is built now, with what exists
*Owner, 7 Oct 2026 ("I want all tabs to be built").*
The four hubs that were waiting on long chains (HOME-01, ME-01, EXPLORE-01, WALLET-01) are built now, so every screen already built can be reached from the tabs. On a hub, an entry that leads to a screen not built yet is left out (never a dead button, never a "coming soon"), and the task that builds that screen adds the entry exactly as drawn (R-27). A verifier treats a hub entry that opens nothing as a defect. *In force again by R-47 (9 Oct 2026).*

**Carried out by:** HOME-01, ME-01, EXPLORE-01, WALLET-01 now; each later task named in their "Lead note (7 Oct 2026)" adds its own entry.

### R-42 · The owner's answers of 7 Oct 2026 (decisions page)
*Owner, 7 Oct 2026, on the "Fintava to Nuvion: approve and go" page.*
- **Nuvion: start now.** The Nuvion build starts without waiting for Nuvion's NGN fees and limits; they are settings filled in when Nuvion answers, and nothing moves real money before they are set. The sandbox key is coming from the owner. This lifts the money freeze for the Nuvion work.
- **Bills: off at launch,** switched off and not deleted ("Leave them switched off, don't delete for now"). *See R-52 (owner, 16 Oct 2026).*
- **Opening a wallet** adds an ID document and a proof of address, as Nuvion requires.
- **Adding money is by bank transfer only** at launch.
- **Held money** (paid questions, tickets) moves through a WAWU operational account on Nuvion.
- **Legal consultation prices confirmed:** chat ₦25,000 for 60 minutes, video ₦45,000 for 60 minutes, in person on request (LEGAL-03 F8 closed).
- **Phone numbers:** yes to the fix for someone signing up with another person's phone (AUTH-07). The owner adds: "phone number should be verified with the BVN. Check if Nuvion's response makes this possible, else we have to figure out a fix." Carried out by AUTH-07 and the Nuvion identity work.
- **Events:** reviewers see ticket types and prices in the dashboard; the ticket types of an event that is not approved are hidden from the public (EVENTS-02 F2 and F3).
- **TGIF:** the second count beside Amen is readers that day (G-160).
- **PR #26** (retire the Shop routes): the owner adds the relock-approved label.

### R-43 · The 5 Oct plan is adopted (Verify, Create, Earn)
*Owner, 7 Oct 2026 ("Adopt it: I'll send prices and rules").*
The plan in the owner's "Verify, Create, Earn" document of 5 Oct and its Developer Brief v2.0 is adopted: free sign-up and drafts; publishing or uploading a file needs a paid tier (Verify, Verify Plus, Founding Maker, with 3, 6 or 10 products); points for AI tools with lots that expire and a cash-out rate; dollar prices outside Nigeria; Voice Intro in the person's own voice; referral points. This reverses the "no subscription, no tier" rule, the 5-item cap and naira-only for those features. **The owner sends the final prices and rules;** until then the plan's figures are config values, never facts. Still open and not to be assumed: whether points replace WAWU Credits, the commission ("WAWU keeps up to 10%" against the 85/15 split, R-5), the tier-expiry rule, and the Christmas event date. R-38 stands: no Studio tab; AI tools open from the Create button.

**Carried out by:** the design round 2 brief (`docs/designer/CLAUDE-DESIGN-ROUND-2.md`), then tasks cut from the new boards.
*Updated by R-65 (owner, 16 Oct 2026): the open figures are launch settings in admin settings.*
*Updated by R-89 (owner, 26 Oct 2026): the tier prices and lengths are set.*

### R-50 · Deleting an account keeps what buyers paid for
*Owner, 16 Oct 2026 ("buyers KEEP the paid content they bought").* When a creator deletes their account (R-17), what buyers already paid for stays available to those buyers: content they unlocked, tickets they hold and services they booked. The creator's profile and unsold listings go. Updates R-17.
**Carried out by:** SETTINGS-06 round 7. SETTINGS-06 is building, so its file is not edited here: the lead hands the builder this row.

### R-51 · Withdrawals go only to an account in the person's own name; name checks are 30 an hour
*Owner, 16 Oct 2026 (G-765, G-764).* A payout account must be in the same name as the person's verified identity, and a withdrawal to any other account is refused before the PIN. A person can run at most 30 bank name checks an hour (the number is a setting). Sends to other people's accounts are unchanged.
**Carried out by:** WALLET-37 (new, the WALLET-09 follow-up).

### R-52 · Bills: WAWU covers a failed bill's fees, and bills are switched off at the Nuvion move
*Owner, 16 Oct 2026 (G-462, G-648).* When a bill fails, WAWU pays the provider's fee and the refund fee, and the person gets every naira back. Bills are turned off when wallets move to Nuvion (R-42: switched off, not deleted). The app draws no bill entry anywhere: no Bills button on the balance card, no bill tiles on the Wallet, no Bills filter in history.
**Carried out by:** BILLS-04 round 2 (done, recorded here); DV2-RM for the app entries (its own removals pass). The Hub already answers `409 target_not_payable` on every bill route.

### R-53 · Send quick amounts are as designed; the provider's part of a fee is labelled "Bank charge"
*Owner, 16 Oct 2026.* The send screen's quick amounts are ₦5,000, ₦10,000, ₦25,000 and ₦50,000, as W9 draws them. Wherever a fee breakdown names the provider's part, the label is "Bank charge" (never "Fintava's charge" or "Nuvion's charge"); WAWU's part keeps its own label (R-10).
**Carried out by:** WALLET-02 (quick amounts, as designed, no change); DV2-COPY for the built screens that print the old label; each todo task that draws a fee line carries a dated line in its Current state.

### R-54 · A notice for all money in
*Owner, 16 Oct 2026.* Every credit to a wallet sends a notice: money from a Who Made This? user, earnings that land, refunds, and bank transfers in.
**Carried out by:** WALLET-39 (new).

### R-55 · Earnings: refused earnings go to review 72 hours after the first refusal; one daily move per creator
*Owner, 16 Oct 2026 (G-703).* Earnings the wallet refuses are put in front of a person 72 hours after the FIRST refusal. A creator's earnings go to their wallet once a day, in one transfer per creator; a day's total under ₦200 waits for the next day. The 85/15 split is unchanged (R-5).
**Carried out by:** WALLET-16 (its task file is updated with both rules).

### R-56 · A payment Nuvion takes back after the buyer got the item: the buyer keeps it and a person reviews
*Owner, 16 Oct 2026 (G-482, G-483).* Today's default is the ruling. What was delivered stays delivered, nothing is taken back from the buyer or the payee automatically, and the case is flagged on the nightly money check for a person to review.
**Carried out by:** NUV-08 (the nightly check flags it). No new task.

### R-57 · Popular communities count at 10 members or more
*Owner, 16 Oct 2026.* A community is listed under "popular" only once it has 10 or more members (a setting).
**Carried out by:** EXPLORE-06 (new, the EXPLORE-05 follow-up).

### R-58 · Settled with no new build: TGIF share, search figures, the test key
*Owner, 16 Oct 2026.* (a) The TGIF reader's Share opens the phone's share sheet (R-33), with no custom card. (b) The search figures stay exactly as EXPLORE-05 built them (the newest 20 recent searches kept, a search is popular with 3 different people in 30 days, and the other limits G-340 lists). (c) A rotating Gemini test key may be used for minimal live checks, by the lead only, and is never committed; builders and verifiers still make no AI provider call.
**Carried out by:** (a) DV2-01 checks the reader's Share on built HOME-09; (b) none, EXPLORE-05 stands; (c) the lead, no task.

### R-59 · TGIF and adverts take turns
*Owner, 16 Oct 2026 ("FOLLOW THE DESIGN, TAKE TURNS"; G-760, G-761).* Home always shows the ad card in TGIF's old place. TGIF moves to Explore and to a daily notification (turn it off in Settings, Z2 "TGIF each morning"). The Explore slider alternates events and adverts: "take turns" wins over "adverts only when no events", so slide 1 is an advert, then event, advert, event; with no event running, adverts only (X17). The line "Ads keep TGIF free" is left out. A campaign must have artwork: the dashboard refuses a campaign without it. The Home TGIF card and its Home toggle go. Updates R-15.
**Carried out by:** DV2-01 (Home ad card, H36), EXPLORE-07 (slider X1, X16, X17 and the TGIF card on Explore), HOME-16 (the daily notification), ADS-07 (artwork required), DV2-06 (Settings Z2 wording), DV2-RM (the Home TGIF card and its toggle, after those land).

### R-60 · The five gate lines are recorded now
*Owner, 16 Oct 2026.* The gate findings the lead listed (five entries) are recorded in the backend baseline with an owner and a reason each.
**Carried out by:** GATES-02 (new).

### R-61 · Home's services row is Studio, Learn, Monetize, Legal; AI tools open from Home and from Create
*Owner, 16 Oct 2026 ("FOLLOW THE DESIGN").* Updates R-38's "AI tools only behind Create": Studio (the AI tools) is a Home tile and is also reachable from Create. The bottom bar is unchanged and has no Studio tab. The Events tile leaves Home (events stay in Explore). Schools is renamed Learn in this row. Studio opens PT1, Learn opens Schools, Monetize opens the Create hub (M19), Legal opens Legal. Under R-47 each tile is drawn only when its screen is built.
**Carried out by:** DV2-01 (the row, with Learn, Legal and Monetize), POINTS-07 (adds Studio, as drawn), DV2-RM (removes the Events tile).

### R-62 · Community credits are by kind of message: text and emoji free, a photo 1 credit, a video or voice note 3
*Owner, 16 Oct 2026 ("FOLLOW THE DESIGN").* Replaces "every metered message costs a credit" (R-5, INBOX-05 as built). Costs are settings. Credits stay a count, never naira. This changes the charge on `POST /communities/{id}/messages`, which the web also calls: a deliberate protected-route change (SHARED-CHANGES, INBOX-22 #1).
**Carried out by:** INBOX-22 (backend, new), INBOX-23 (the app: I24 to I26 and I38), INBOX-13 (I27, I28 copy).

### R-63 · Private communities: a monthly pass, renewed by a tap
*Owner, 16 Oct 2026.* A person pays for 30 days from the wallet (the PIN, as every wallet payment). A reminder comes 3 days before the pass ends and one tap renews it. The host sets the price; the split is 85/15. There is no automatic monthly debit at launch and no host approval step to join.
**Carried out by:** INBOX-24 (backend, new), INBOX-14 (screens I30 to I34 and I37, re-cut).
*Updated by R-71 (owner, 19 Oct 2026): a host who removes a member pays back the unused days, worked out from the price paid. Leaving on one's own still pays nothing back.*

### R-64 · Tips and prices are Naira only at launch
*Owner, 16 Oct 2026 (R-16 stands).* The Dollar and USDT picker drawn on H26 and M24 is not shown until dollar and crypto accounts exist.
**Carried out by:** HOME-13 and ME-08 (their files are updated).
*Updated by R-91 (owner, 26 Oct 2026): prices stay naira for every buyer; a buyer in another currency pays by conversion at payment.*

### R-65 · The new money figures are launch settings in admin settings
*Owner, 16 Oct 2026 ("USE THE DESIGN'S FIGURES AS LAUNCH SETTINGS, changeable at any time").* Launch values: tiers ₦1,000, ₦3,000 and ₦5,000 (dollar prices wait for dollar accounts); add 5 products ₦1,500 (this also answers the 5-place pack price and TIER-02's D9); 1,000 points = ₦500; points last 12 months; a cap of 5,000 points a day; referral multipliers ×1 to ×3 and +500 points at 5 verified; a 7-day referral hold. 85/15 stays the one split (R-5). Any other figure drawn on a VF, PT or RF board loads as a PROVISIONAL setting with the board's value and is listed for the owner in the task's report. Updates R-43's open figures; points and WAWU Credits stay two balances.
*Updated by R-89 (owner, 26 Oct 2026): the three tiers are ₦2,999, ₦5,999 and ₦9,999, each for one year.*
**Carried out by:** TIER-06 (admin settings, new), which also names where each figure is used.

### R-66 · The Voice Intro player says "Bio" and carries an "AI voice" tag
*Owner, 16 Oct 2026.* The label is "Bio" as drawn (VF11, M1), plus a small "AI voice" tag on the player so listeners know. This overrides design/CLAUDE.md ("never AI voice") and keeps the round-2 brief's requirement.
**Carried out by:** DV2-COMP (the player), VERIFY-03 (VF11), DV2-03 (M1), VOICE-01 (the Hub marks the audio as AI voice).

### R-67 · Provider and legal wording: show "Banking by Nuvion" and the terms line, hide licence lines
*Owner, 16 Oct 2026.* Shown now: "Banking by Nuvion" (Z9) and the sign-up line "I agree to the terms and privacy policy" (A3). The licence and CBN lines ("licensed by the CBN", "Limits set by the CBN", "held at Nuvion", "Tier 1 · Nuvion") come from settings and stay hidden (not drawn) until the owner confirms the exact words. The Hub already serves `licenceLine` and `depositInsuranceLine` on the wallet account; they stay empty.
**Carried out by:** DV2-COPY (Z9, A3, and the hidden lines on W41 to W43, A17, A19, Z10); WALLET-12 and WALLET-19 carry the same line.

### R-68 · No outside brand names
*Owner, 16 Oct 2026.* No third-party name in the app: "AI voice tools" instead of ElevenLabs; sharing uses the phone's share sheet instead of an Instagram card; real adverts replace the sample "Kora Foods" (and every other sample advertiser).
**Carried out by:** DV2-COPY (built screens), POINTS-07 (PT1 line), REF-03 (RF2 share), DV2-01 and EXPLORE-07 (ad cards show only real campaigns).

### R-69 · The app's name in copy is "Who Made This?" with the question mark
*Owner, 16 Oct 2026.* Updates R-37's copy rule: where the app names itself the text is "Who Made This?" with the question mark, on every screen and string. The logos are unchanged (R-37's mapping stays).
**Carried out by:** DV2-COPY for built screens; every todo task that prints the name carries a dated line in its Current state.

### R-70 · Three old tests on the Fintava double may be updated by an agent, test files only
*Owner, 19 Oct 2026 (Q-42).* An agent may update three old backend tests that run on the Fintava double: `src/fintava/tests/fintava-stall.spec.ts` (its timing), the T6b cases of `src/account/tests/account-deletion-round4.contract.spec.ts` (their timing) and `src/money/earnings/tests/earning-settlement.contract.spec.ts` (it pins the earning rules from before R-55). Test files only: never the Fintava double, the Fintava adapter or any other Fintava code. This is the owner's exception to "never edit an assertion in a test you did not write" for these three files and no others. The earlier one-argument change at `src/account/tests/account-deletion.contract.spec.ts:539` stays as it is.
**Carried out by:** FIX-88.

### R-71 · A host who removes a member from a private community pays back the unused days
*Owner, 19 Oct 2026 (Q-43).* When a host removes a member who still has paid days left on a private community's monthly pass (R-63), the member gets the unused days back, worked out from the price they paid. A member who leaves on their own still gets nothing back. Only the removal is ruled: a pass is still not refunded when the host stops being a creator (G-INBOX-24-3), and a removed member still cannot re-join without the host's approval (G-INBOX-24-6). Updates R-63.
**Carried out by:** INBOX-25.

### R-72 · Sign-up codes and wallet PIN reset codes go by email at launch
*Owner, 19 Oct 2026 (Q-44).* At launch the sign-up code and the wallet PIN reset code are both sent by email. WAWU ID's setting is `SIGNUP_VERIFY_CHANNEL=email`. A text-message provider comes later, and only if the owner names one: no task builds or picks one before then. Confirms R-39's "No SMS" for both codes.
**Carried out by:** AUTH-07's release step 5 (set the value and restart WAWU ID); the PIN reset code's email route in WAWU ID is G-400, which has no task yet (the lead assigns it).

### R-73 · A deleted account's ID documents are kept hidden for 5 years, then deleted
*Owner, 19 Oct 2026 (Q-45).* When an account is deleted, its ID documents (ID card photos, and the documents of service and professional applications) are kept for 5 years after the deletion, hidden from everyone, and then deleted. The files meant are those FIX-65 refiles under `deleted-account` (G-FIX-65-1). This replaces FIX-65's lead default ("kept and refiled, never deleted"). Everything else the purge deletes stays as FIX-65 built it.
**Carried out by:** SETTINGS-09.

### R-74 · Flix movies: the Flixora catalog in the app, watched on Flixora
*Owner, 22 Oct 2026.* Who Made This? partners with Flixora. The app shows Flixora's catalog as drawn in Flow MV (MV1 to MV12): a rail on Home below "Creators and professionals" and on Explore below "Who Made This?", browsing, search, filters and trailers in the app. Watching happens on Flixora's website, signed in, from "Watch on Flixora" (MV4, MV5). Flixora is named as drawn, because the person is sent to Flixora's site: this is the owner's exception to R-68, for Flixora only. The catalog reaches the app only through the Hub; the app never calls Flixora and holds no Flixora key. Titles, posters, ratings and dates come from Flixora, never from the design's samples.
**Carried out by:** FLIX-01 (Hub), FLIX-02 (Flixora adapter), FLIX-03 (app).

### R-75 · A person's Flixora account opens on their first "Watch on Flixora", and Flixora unplugs with one setting
*Owner, 22 Oct 2026.* The owner asked for every person to have a Flixora account with no second sign-up. Flixora's partner API has no call that opens or closes an account: the first signed-in link creates the person's Flixora account from the name and email the Hub sends, and later links reuse it (`docs/flixora/PARTNER-API.md`). So the account opens on the person's first "Watch on Flixora". Agreement: the owner updates the terms to name Flixora; sign-up's existing box (A3, R-67) is the agreement for anyone who signed up on or after the setting `FLIXORA_TERMS_FROM` (when the updated terms went live). Anyone else, and everyone while that setting is empty, ticks A3's shared ConsentBox on MV4 before "Open Flixora" (not drawn: lead default, BACKEND_GAPS G-FLIX-1); the Hub stores that agreement with its time. The Hub sends only the person's permanent WAWU id (`sub`), email, first and last name, and whether WAWU verified the email; never phone, BVN, NIN, ID documents or wallet data. Flixora sits behind one seam, as R-39 does for wallets: code outside the adapter reaches it only through `MOVIE_PARTNER`, and never imports `src/flixora/`. `MOVIE_PARTNER=off` (the default; empty is off) hides every rail and screen (the Hub answers `enabled: false`), stops every call and every link, and changes nothing else; the stored rows stay. Deleting a WAWU account stops every further link for that person; closing their Flixora account goes to Flixora by hand (G-FLIX-2), because the API has no call for it.
**Carried out by:** FLIX-01, FLIX-02, FLIX-03. The terms text is the owner's.

### R-76 · Emails say Who Made This?
*Owner, 23 Oct 2026 ("who made this please").* Emails a person receives name the product "Who Made This?" (with the question mark, R-69), not "WAWUAfrica" or "WAWU Africa" (R-37). Only the name changes: the sender address, every domain and every link stay as they are.
**Carried out by:** BRAND-MAIL.

### R-77 · Flix movies show "not live yet" (replaced by R-80)
*Owner, 23 Oct 2026.* Until business talks with Flixora finish, Flix movies stays visible but does nothing: no titles, no Flixora calls, no accounts, no links. The rails on Home and Explore and the movies screen show S13's "not live yet" state with "Flix movies aren't switched on yet" and "You'll be able to watch movies here soon." (the rail as its title and one card that opens the screen), set by `MOVIE_PARTNER=soon`; `off` still hides everything. This sits beside R-74 and R-75, which stand for when it goes live.
**Carried out by:** FLIX-04.

### R-78 · Every Studio tool the design draws is built for launch
*Owner, 23 Oct 2026 ("build this thing").* Studio (PT1) draws eight AI tools: VoiceOver, Quick voice, Captions, Clean audio, Music track, Sound effect, Dubbing and Receptionist. All eight are built for launch, not only VoiceOver (exception, R-79: the Receptionist is left out for now and built after launch, so seven at launch). Each runs on the one job pipeline and the points rules of AITOOLS-01 and POINTS-03 (hold, then keep on success or give back on failure), through the one AI voice provider seam. Every points cost is an admin setting with the board's figure as its PROVISIONAL launch value (R-65). Under R-47 a tool's tile is drawn only when the Hub lists it and the app has its screen. Where a tool's own screen is not on any board, it is built from the VoiceOver screens' shared parts and the gap is filed for the designer (R-29).
**Carried out by:** AITOOLS-02 (the pipeline, the job list, Quick voice), AITOOLS-03 (Sound effect, Music track), AITOOLS-04 (Captions, Clean audio, and a person's file going in), AITOOLS-05 (Dubbing), AITOOLS-06 (Receptionist, after launch under R-79); the app side POINTS-09 (Quick voice, Sound effect, Music track), POINTS-10 (Captions, Clean audio), POINTS-11 (Dubbing), POINTS-12 (Receptionist, after launch under R-79). The provider's routes and limits are in `docs/elevenlabs/API-FACTS.md`.
*Updated by R-79 (owner, 23 Oct 2026): the Receptionist is left out for now and built after launch; Quick voice is defined there.*

### R-79 · Four answers of 23 Oct 2026: Receptionist after launch, what Quick voice is, editing a sent event, the designer's extra wallet list
*Owner, 23 Oct 2026.* Four answers, each with the task that carries it out.
**(a) Studio's Receptionist is left out for now and built after launch.** Of R-78's eight tools, seven are built for launch; the Receptionist tile is not drawn until its tasks are built (R-47). AITOOLS-06 and POINTS-12 move to priority after-launch, status todo, and no builder starts on them before the owner brings them back.
**(b) Quick voice is a fast, cheaper read-aloud: the same voices as VoiceOver on the provider's faster model, 125 points a minute.** The figure is the PT1 tile's, PROVISIONAL under R-65. Closes G-AITOOLS-02-1.
**(c) Editing an event after it is sent: the edit goes back to review, and ticket price and places cannot change once a ticket is sold.** This is today's Hub behaviour, confirmed: `PATCH /events/{id}` puts every edit back to `pending`, so the event leaves the calendar until a person approves it again, and `PUT /events/{id}/tickets` is refused with 409 as soon as any tier has sold. Closes G-833 as ruled. A creator cannot edit a sent event in the app today (E18's "Edit event" and "Ticket types" rows are not drawn, R-47), so one task builds them on these two rules.
**(d) The designer's extra list waits until after launch:** Scan to pay and My QR (W24, W25), Account limits (A17 to A20), adding money by debit card and by USSD.
**Carried out by:** (a) AITOOLS-06 and POINTS-12 (priority after-launch); (b) AITOOLS-02 and POINTS-09 (their text says exactly this); (c) EVENTS-14 (new: the Hub keeps both rules, the app's E18 rows open the wizard's steps in edit mode); (d) WALLET-20, WALLET-19, WALLET-25 and WALLET-26 (priority after-launch).

### R-80 · Flix movies is hidden until it goes live
*Owner, 24 Oct 2026 ("that's not the language in our docs ... if you cant find hide flix movies on those screens").* R-77's two lines ("Flix movies aren't switched on yet", "You'll be able to watch movies here soon.") are not in the docs or the design: S13 draws that "not live yet" state for Bill payments only, and the Flix lines were made up by analogy. So Flix movies is not drawn at all until it goes live: no rail on Home or Explore, no Flix screen, no Flixora call. This is `MOVIE_PARTNER=off`, whose answer the app already hides everything on (`FlixRail`, `MoviesGate`). The `soon` setting stays in the code and is not used. R-74 and R-75 still stand for when it goes live.
**Carried out by:** the server setting `MOVIE_PARTNER=off` (console step 5, owner, 24 Oct 2026); FIX-106 (the app treats a `soon` answer exactly like off, so it draws nothing even while the server still says `soon`; the note and card are removed).
*Replaces R-77.*

### R-81 · A person is told when a community they joined has new messages, grouped
*Owner, 24 Oct 2026 (answer to "When should someone get a notification from a community they joined?": "New messages, grouped").* When someone else posts in a community a person has joined, that person gets a notice. Several new messages in the same community are ONE notice, updated (its count and its time) rather than added, until the person opens that community; the next message after that starts a new notice. Never for a person's own messages. The Z3 "Community messages" switch (`communityMessages`) turns it off. It reaches the phone as a push like the other kinds. Closes G-21. Agent defaults, owner may override: the host of a room is told too (they are in it); a member whose pass for a paid room has ended, and anyone across a block, are not; the phone is buzzed once per notice (when it is first written), and later messages update the notice without buzzing again until the person has opened the room.
**Carried out by:** FIX-105.

### R-82 · Sign-up asks for a first name, a last name and a username; names are not wallet-only
*Owner, 24 Oct 2026 ("Sign up should involve first name last name and username ... Names are not wallet only.").* This adds to R-6, which made sign-up email and phone only: sign-up now also asks for a first name, a last name and a username, and the account is made with them. Identity checks (BVN, details, selfie) still happen when a wallet is opened, not at sign-up (R-6 stands). (1) A3 takes first name, last name, username, email, phone number and password, in that order; the three new fields are built from the same fields Edit profile uses and are filed for the designer (R-29). The username shows whether it is free while the person types and is refused on Continue if taken, in the Hub's words. (2) The username is the profile's handle, the @handle the app already shows: one home, one set of rules (letters, numbers, dots and underscores, at most 30, unique ignoring case, a short list of words held back, PROVISIONAL). (3) An account that is signed in and lacks a first name, a last name or a username is asked for the missing ones once, on the next open, before the tabs, in a one-screen step that cannot be skipped. (4) Opening a wallet ("Confirm your details") starts with the account's first and last name; the person can still correct them to match the BVN.
**Carried out by:** SIGNUP-NAMES.

### R-83 · Dollar and crypto accounts are built now, on Nuvion
*Owner, 24 Oct 2026 ("We left fintava and were on Nuvion that offers alot more").* R-16 put dollar and crypto after launch because Fintava had no dollar account and its crypto ran through Cardex. Nuvion serves both, so they are built now: a USD account with its own US account details, USDT and USDC (Nuvion's chains: Ethereum, Base, Polygon, Solana), receive and send, and swap between naira, dollars and the two coins (W2, W3, W20 to W23 and the Dollar and Crypto tabs on W1). What a network, a fee or a quote's hold is comes from Nuvion's docs and dev answers, never from the board's Cardex samples (TRC-20, BEP-20, 90 seconds). Cards (WALLET-22) stay undecided. Tips and prices stay naira only (R-64) until the owner says otherwise.
**Carried out by:** WALLET-21 (Hub routes on the Nuvion adapter, and the screens). WALLET-33 (Cardex) is retired by this ruling.
*Replaces R-16 for dollar and crypto accounts.*

### R-84 · Everything Nuvion serves for people is built now
*Owner, 24 Oct 2026 ("It's much more than dollars and crypto... What does nuvion offer", then chose all four: other currency accounts, virtual dollar card, add money by card and USSD, send abroad and Capital savings).* On top of R-83: (1) accounts in every currency Nuvion gives account details for (USD, EUR, GBP, CAD, AED, GHS), each with its own receiving details, and swap between them; (2) the WAWU card as Nuvion issues it today: virtual and single-use dollar cards (no physical card: Nuvion does not issue one, so W29's Physical choice is not drawn, R-47), card controls only where Nuvion serves them; this settles R-16's "cards are undecided"; (3) add money by card and by USSD (and open banking) through Nuvion, preferring Nuvion's hosted checkout so card numbers never reach WAWU's servers; (4) send abroad: foreign bank and mobile money payouts with conversion; (5) Capital: Nuvion's fixed-return and share-offering products. Items (4) and (5) have no board: built from the app's existing parts with gap rows (R-29). Facts come from Nuvion's docs and dev answers; where dev refuses, the screen says so plainly and a gap row names what Nuvion must switch on.
**Carried out by:** WALLET-21 (all currencies, swap), WALLET-31 and WALLET-22 (card), WALLET-25 and WALLET-26 (add money), NUV-11 (send abroad), NUV-12 (Capital).
*Capital (fixed returns and shares) is switched off by R-97: WAWU offers no investments.*

### R-85 · WAWU is for every country: phone with its country code, and a country, region and city on every account
*Owner, 24 Oct 2026 ("there has to be country code drop down ... how do we tell who is from what country, who's from what state? This is not a Nigeria only platform ... How do we categorize data?").* A phone number can be from any country: the field has a country dropdown with every country and its code, as the website has, and the number is stored in full international form (E.164). A Nigerian number typed with a leading 0 still works when Nigeria is chosen. Every account has a country of residence, asked at sign-up and defaulting to the phone's country, and in its profile a region (the country's official states, provinces or counties, ISO 3166-2) and a city. The Hub serves the country and region lists, so the app never carries a fixed list. Admin screens and counts filter and group by country and region. Existing accounts get their country from their phone (+234 is Nigeria). The naira wallet stays Nigeria-only (BVN, R-6); what a person outside Nigeria can open is a separate ruling.
**Carried out by:** GEO-01 (WAWU ID), GEO-02 (Hub), GEO-03 (app).

### R-86 · Points and subscriptions are bought through the app stores
*Owner, 24 Oct 2026 ("points and subscriptions has to be routed to app stores and not wallets because of app store rules").* In the app, points packs, verification ticks and tiers, and community passes (recurring access) are bought with Google Play Billing and Apple In-App Purchase, at the store's price in the person's own currency; WAWU Credits packs follow the same rule because they are an in-app currency (Default (lead), owner may override). The app draws no wallet path for these. The Hub checks every store purchase with the store's own server and grants it once; a store refund or a lapsed subscription takes back what it granted. The website keeps its own payments. Where a creator earns from credits or passes, the 85/15 split is worked out on what WAWU actually receives after the store's cut (Default (lead), owner may override). Paid content, tips, paid questions, event tickets, school and legal fees keep the wallet until the owner rules on them.
**Carried out by:** IAP-01 (Hub), IAP-02 (app; a new native module, so it ships in the next store build, not over the air).

### R-87 · A person outside Nigeria opens a wallet in their own currency, and may add others
*Owner, 24 Oct 2026 ("Yes ... that's a duh!!! Infact it should work based on region or something and also choice too").* Answers R-85's open question. A person whose country of residence is not Nigeria opens a wallet without a BVN: Nuvion checks their identity with their own country's ID document and a liveness check, as Nuvion requires for that country. Their first account is their country's currency where Nuvion serves it (USD for the United States, GBP for the United Kingdom, EUR for the euro countries, CAD for Canada, AED for the United Arab Emirates, GHS for Ghana), otherwise USD; they can choose a different first currency and add any other currency or coin afterwards (R-84). A person in Nigeria keeps the BVN naira wallet (R-6) and may add the others. Facts about which IDs Nuvion accepts per country come from Nuvion's docs and dev answers.
**Carried out by:** WALLET-41 (Hub and app).

### R-88 · One agreement box at sign-up covers all nine legal documents, each readable on its own
*Owner, 26 Oct 2026 ("users signing up agrees to all these in one button and a simple language then when they click to read they now see and can read them all individually").* Sign-up shows one box in plain words: "I agree to the Terms of Service, Privacy Policy and our other policies.", with "Read them" opening the list of the nine documents (privacy, terms, cookies, creator monetization, verification and refund, acceptable use, partner data processing, community guidelines, disclaimer). Each document opens on its own and is also reachable from Settings, Legal. The text is the owner's, word for word (only the fixes the owner allowed: section numbers, no em-dash, "#1000" as "₦1,000", and the 26 Oct tier prices); it is changed only from the dashboard. The Hub records which documents and dates a person agreed to.
**Carried out by:** LEGAL-DOCS (Hub, app, website, dashboard).

### R-89 · The three tiers last one year each, at ₦2,999, ₦5,999 and ₦9,999
*Owner, 26 Oct 2026 ("All yearly").* Verify costs ₦2,999, Verify Plus ₦5,999 and Founding Maker ₦9,999, and each lasts one year (365 days). R-65's launch values were ₦1,000 for 30 days, ₦3,000 for 180 days and ₦5,000 for 365 days. They are still launch settings an admin can change (R-65); dollar prices still wait for dollar accounts. The Hub's seed and its admin settings defaults carry the new figures, and a migration moves any saved admin figure for the six settings (price and length of each tier) to them. A person who holds a tier keeps the length they bought. The app draws the store's price (R-86) and the Hub's length, so it holds no tier figure of its own. In the stores each tier is a 1-year subscription, and a tier product's store period must equal the tier's days (365): `wawu.tier.verify`, `wawu.tier.plus` and `wawu.tier.founding` are all 1-year subscriptions, at ₦2,999, ₦5,999 and ₦9,999 before tax. VAT, taxes and the store's own price steps can make the final store price differ from the naira figure, and nobody can know it exactly in advance; the person is always shown the store's price. The event registration offer (R-48) is its own figure and does not change.
**Carried out by:** TIER-YEARLY (Hub and app).

### R-90 · Welcome screen: the vertical mark centred with a purple glow; no horizontal logo, no photo
*Owner, 26 Oct 2026 ("remove the long lying logo and those people image and put this in the middle with the glow on it, that's it").* The first screen a signed-out person sees (A1) shows the app's vertical mark (`assets/brand/vertical-white.png`, source `assets/brand/source/vertical-white.svg`: the P holding WHO MADE THIS, with the purple drop) centred in the room between the top safe area and the headline (equal space above and below it; on a phone too short for that, at least 16 below it) on the dark page, with a soft purple glow around it, like neon, in the accent colour. The horizontal logo above the headline and the people photo (`welcome-cover.jpg`, with the shade laid over it) are gone. The headline, the line under it and both buttons stay as they were. The glow is drawn into pictures ahead of time (`scripts/design/make_welcome_mark.py` makes `assets/images/welcome-mark.png`, `@2x` and `@3x` from the SVG, colour from the accent token), so iOS, Android and the web show the same light and no native module is added. **This overrides the A1 board (the canvas's cover photo and the horizontal logo above the title) for that screen only**; the board's words and buttons still apply, and R-37 still holds (the mark is the app's own logo).
**Carried out by:** ONBOARD-LOGO.
*Replaces the BRAND-01 cover picture (8 Oct 2026) and BACKEND_GAPS G-35's open question about the owner's own cover.*
### R-91 · Convert at payment: a price stays naira, a buyer in another currency pays from their own account
*Owner, 26 Oct 2026 (answer to "a person in the US finds Nigerian content they want to buy": "Convert at payment").* Every price stays one naira price. A buyer whose money is in another currency sees the price in that currency and pays from their own account; WAWU converts at Nuvion's rate at the moment of payment (a firm quote for the exact naira price, held for as long as Nuvion holds it); the payee receives naira exactly as today (85/15, delivery, receipts, deliver or refund unchanged). Updates R-64 for buyers: prices and tips stay naira, and a non-naira buyer pays by this conversion, not by a price in their currency. Fees follow R-10: the provider's charge and WAWU's conversion fee come from config; WAWU's conversion fee defaults to 0 and Nuvion's own spread is inside the rate it quotes, shown as it is (Default (lead), owner may override). A refund goes back to the account the money came from, in that currency, by a reverse conversion WAWU pays for (Default (lead), owner may override). **The refund follows the naira rule of R-10** (lead ruling, 26 Oct 2026, owner may override): a refund WAWU or the seller causes (a called-off event, a question that lapsed, an order that failed) returns everything taken, WAWU's conversion fee and the provider's charge included; a refund the payer causes returns the amount for the price and keeps WAWU's conversion fee. With the fee at 0 (the default) both return the full amount. **Amounts in the buyer's currency are written with the currency's own sign** (owner, 26 Oct 2026): "$1.90", "£1.50", "€1.75", never "1.90 USD", on the pay sheet, its button, and the PIN sheet, which says what will leave the buyer's account in their currency ("Approve $1.90 to Chidi"), not the naira price. The pay sheet shows which account pays, the naira price, and the firm amount in that currency with its fee; a quote that runs out asks again (`quote_changed`).
**Carried out by:** PAY-FX (Hub: `sourceCurrency` on the payment quote and the payment, the reverse refund; app: the pay sheet's source). The callers of the pay sheet are wired to it one by one (see PAY-FX).

### R-92 · An ad opens the advertiser's web link, or does nothing; ads are not tied to events
*Owner, 26 Oct 2026 ("if you're uploading on the dashboard, you can upload with a link ... if you click on the ad, it's going to open up the link. If you don't add the link ... if you click on it, it's not going to do anything"; "ITS NOT AN EVENT AD FUNCTIONALITY"; "the home today's strip should be increased to the explore card size").* An ad opens the advertiser's web link, or does nothing; ads are not tied to events. **A link ad:** the dashboard takes an https address (a public site, no password, at most 500 characters, kept in one normal form; http, `javascript:`, `data:` and a bare host are refused), and a tap on the card or on its button opens that address in the phone's browser; the tap is counted as before. **An ad with no link:** the card is shown and nothing on it is pressable, no button is drawn (no do-nothing buttons), no tap is counted, and a screen reader reads it as an ad, not as a button. The dashboard form asks "When tapped" with two choices, "Opens a web link" (the address and the button's words) and "Does nothing" (no button words are asked for); it has no event picker. The Hub keeps `event` as a third kind so every campaign already booked is stored and served exactly as before and what the dashboard sent until now still works; builds already on phones draw only `event` cards and drop the other two without failing. **The Today strip is the Explore slide:** the Today ad card is the same card at the same size and look as an Explore advert slide (full width inside the gutters, 196 high, corner 24, the picture under the same fade, SPONSORED at the top left, the headline and the line at the bottom), with the campaign's button word on a white pill at the bottom right when the ad has a button; the board's 104-high row (H1 and H36) and its AD chip are replaced by this. **Pictures are uploaded from the dashboard** (JPEG, PNG or WebP, up to 5 MB, stored by the Hub; a typed https link still works), and the form shows the size to make for each of the two shapes below: landscape 1920 x 1080 (16:9), the subject in the middle, the bottom 40% plain (the headline goes there) and the top left clear (SPONSORED); portrait 1080 x 2340 (phone screen shape), the subject between 15% and 65% of the height. A picture whose shape is far from its shape's gets a warning, never a refusal. The dashboard preview draws the app's shapes.
**Two shapes, not three places** *(owner, 26 Oct 2026, added the same day)*. An ad has two shapes, and the places follow from them. A **landscape** picture (16:9, 1920 x 1080) shows in BOTH the Explore slider and the Today strip (the same card); a **portrait** picture (1080 x 2340, the shape of a phone screen) shows in the TGIF full screen. One booking takes one picture per shape, each optional, at least one required (the Hub refuses a booking with none: 422): only a landscape picture means the ad shows in Explore and Today and never in TGIF; only a portrait picture means it shows only in TGIF; both mean all three places. **The placement choice is gone from the dashboard form**; where an ad shows follows from the pictures it has. The form has two uploaders, "Landscape picture (Explore and Today)" and "Portrait picture (TGIF full screen)", each with its size hint, its shape warning and its preview in the app's shape, and one line that says where the ad will show given what is uploaded ("Shows in: Explore, Today", "Shows in: TGIF" or all three); the list and the detail show the shapes a booking holds and where it shows. Each place still serves by its own rule (TGIF and Today the one heaviest booking, Explore the list) and views and taps are counted as before; each served card carries the picture for its place. A booking saved before the two shapes keeps its single picture and its place and is served exactly as it was, in that one place only (an old Explore or Today booking counts as landscape for its own place, an old TGIF booking as portrait); giving it a picture of a shape moves it to the two shapes and keeps its own picture where it showed. The app changes nothing: it draws the picture the Hub serves for its place.
**Carried out by:** ADS-LINK (Hub, app, dashboard).
*Changes R-15 (the button no longer has to open an event), R-59 (the Today card's size) and ADS-01's H36 row.*

### R-93 · People learn they can hold other currencies from four places, not only the wallet's "+ Add"
*Owner, 26 Oct 2026 (FX-POLISH, after the other-currency screens were walked on Nuvion dev).* R-83, R-84 and R-87 built accounts in other currencies and coins; this says where a person is told so. (1) The Wallet's tab strip scrolls with a fade at the edge while more is hidden, brings the tab in front into view, and ends in a plain "+ Add" that opens the add-a-currency choice. (2) Home's money card shows the other balances the person holds, each the provider's own figure in its own currency with its sign (never added into one), and an "Add a currency" button; a person with no wallet sees today's card. (3) Once, right after a wallet opens (naira or world), a note says "You can also hold ..." with the currencies and coins the Hub offers that person, an "Add a currency" button and Dismiss; it is never drawn again after either. Agent default (lead, owner may override): it is remembered on the phone under the person's id, not at the Hub, because it is a hint about the app and a Hub flag would be a table and a route for something that costs nothing if it shows twice on a second phone. (4) Wallet settings and the main Settings screen each have an "Accounts and currencies" row (owner's choice, 26 Oct 2026; both hidden with no wallet) that opens `/accounts`, which lists the person's accounts, each with its own figure (the Naira wallet's too), and opens the same add-a-currency choice. A currency picked there is shown as opening at once (its tab in front, or its row in Accounts, saying Opening) and cannot be picked again until the Hub has answered. The choice lists what the Hub offers and the person does not hold, currencies and coins in the Hub's own order and words, never a fixed list; a coin leads to its network picker (W22), a currency opens at once. A person outside Nigeria has the same coins as the naira wallet's Crypto tab (R-87). Send abroad offers only the accounts the Hub can price for that recipient, and says so before an amount is typed.
**Carried out by:** FX-POLISH.

### R-94 · Right after sign-up a full screen offers the three tiers, once; it always has a way out
*Owner, 26 Oct 2026 ("subscriptions need to be in your face"; "for launch ... the close button should be there"; he wants to control it).* Right after a person finishes signing up, before they reach Home for the first time, a full screen ("Choose your tier") offers Verify, Verify Plus and Founding Maker (R-89) as VF5 draws them: each with what it gives and its own "Subscribe", which opens the existing tier checkout (VF5/VF6) with that tier. Prices are the Hub's, or the store's where a build has a store (R-86); none is written in the app. A person billed in dollars is led to the tiers sheet, which says what is open. **The way out:** a close "X" at the top right (a 44 point target, the full-contrast icon, "Close" to a screen reader), never hidden or faint; closing goes on to Home. The owner controls it: the admin setting "Show the close button on the tier offer" (Hub settings registry, group "Tier offer", key `tier_offer.close_button_on`, listed in the dashboard's Settings, default ON). When it is OFF the screen shows a "Not now" text button at the bottom instead. The screen is never without one of the two, in any state (loading, error included). People can always reach the tiers later from the places that already open VF5 (Create, the tier badge, Your tier, a publish refused for want of a tier).
**Lead defaults (owner may override):** (1) shown once per person, right after sign-up completes (after the access-code step and A11 to A13, before "Your bonus is waiting", VF1, which still comes next for a new creator and whose "Build my shop" is unchanged), and once to an existing person who has never seen it, the next time they open the app signed in; (2) only to accounts that can hold a tier: creator accounts (a professional is one); a fan or buyer account skips it, since tiers unlock selling; (3) a person who holds a running tier (active or ending) never sees it; a tier that has ended does not stop it; (4) "shown once" is kept on the Hub (`TierOfferSeen`, one row per person, written when the screen is drawn), so it is once across phones, and closing the app on it never brings it back; (5) the Hub is asked once per start, waiting at most 2.5 seconds; no answer means no offer this start, and nothing is marked, so the next start asks again.
**Carried out by:** TIER-OFFER (Hub: `GET /me/tier-offer`, `POST /me/tier-offer/seen`, the setting, the table; app: `/tier-offer`).

### R-95 · "Powered by Nuvion" on the money screens a person meets
*Owner, 26 Oct 2026 ("there should be a powered by Nuvion on the bank, the fintech aspect").* A small line, "Powered by Nuvion", in plain text (the repo holds no Nuvion logo, so there is none), caption size in the muted ink, from the tokens. One shared component (`PoweredByNuvion`), placed once on each of: the Wallet home (under the Naira balance card, under the card of a currency tab, under the first account card of a world wallet, at the foot of the Crypto tab), the account details sheets (Naira and other currencies), and the Open your wallet screens (BVN and NIN, confirm details (the BVN form and the typed-details form of the review opening, one line either way), ID document, country, secure selfie page, proof of address, Wallet open, and the world wallet's first-account screen, the one that gives the bank's words when it declined the first account (lead, 26 Oct 2026)). Never on a screen that is not about money. It is drawn only while the Hub says the wallets run on Nuvion: the app reads the running provider's bank name from the Hub's public `GET /about` (the same read as About's "Banking by", `NUVION_WALLET_BANK_NAME`, "Nuvion" in production) and draws the line when it names Nuvion; until that read answers, or when it fails or names another bank, nothing is drawn (R-47). Nothing was added to the Hub. Agent default (lead, owner may override): the PIN screens, loading and error states (the first-account screen above is the one exception, as it is where a person picks another currency), and Home's money card do not carry it.
**Carried out by:** POWERED-NUVION.

### R-96 · A person positions their profile picture and their cover the way Facebook and Instagram do
*Owner, 26 Oct 2026 (relayed from his boss; round 2 the same day: "I said profile photo ... and you did it with strange controls. On what app have you ever seen such analog things?").* After choosing a photo for the profile picture or the cover, the person drags it to move it and pinches to zoom, under the exact frame it will show in (a circle for the profile picture, the profile header's banner for the cover), then saves; later they can reposition the photo they already have without choosing a new one. The Hub keeps the uploaded original and one saved position per photo, and the app draws every avatar and header with it: header, lists, comments, chat, cards, the pay sheet's header, at every size. A photo with no saved position is centred, as before.
**How it works (lead default, owner may override).** The position is four numbers: where the photo's middle is (`x`, `y`, 0 to 1), the zoom (1 is the photo filling the frame, up to 4) and the photo's own shape (`ratio`, width over height, from 0.2 to 5). They are relative, so any frame of any size shows the same part of the photo. The photo cannot be dragged off its edge: the frame is always covered, and a photo smaller than the frame is first scaled up to fill it. A new photo starts centred; the person's position is theirs for that photo only. A photo more than five times longer one way than the other cannot be given a position and is kept centred.
**Where it is kept: on the picture's own link, not in new fields.** The Hub stores and serves it as a fragment on `UserProfile.avatarUrl` and `coverUrl`: `...#wmt-pos=0.52,0.41,1.8,1.3333`. Reason: those two links are read by about thirty Hub responses (comments, chat, direct messages, cards, search, events, money parties) and drawn at about sixty app sites. A field per response would be thirty contract changes and sixty edits, and every one is a place to forget it, so some avatar somewhere would ignore the position. A fragment is never sent to a storage host and is ignored by every browser and image loader, so the web keeps drawing the photo centred, exactly as before, until it reads the fragment too; and a profile that never positioned a photo is served byte for byte as it was (no new key on any response, no table, no column, no migration, no contract change). The Hub checks the position on `PATCH /users/me` (400 with a plain sentence when it is broken or out of range, canonical form when it is good), and signing a stored link again (the profile re-sign, `freshUrlFor`) keeps it. Choosing a new photo sends a link with no position, so it starts centred; sending the same link with no position puts a photo back to centred. The Hub cannot see the photo, so it cannot check the shape against it: it keeps the shape to 0.2 to 5 (a shape of 0.05 at zoom 4 once drew a 384 by 7680 avatar), and the app never believes a shape the loaded photo does not have: it draws by the photo's own shape, or centred when that is out of range. Never stretched.
**In the app, the editor.** One screen (`/photo-position`) built as Facebook's and Instagram's profile picture editor is: a full-screen dark stage with the photo filling it, a clear circle (the banner, for the cover) showing what the picture will be and everything outside it dimmed, and nothing else on the stage. One finger drags the photo and two fingers pinch it, from filling the frame to four times that, about the spot between the fingers; on the web the mouse drags it and the wheel or a trackpad pinch zooms about the pointer. The drag is live from the first touch. The bar holds "Cancel" on the left, the title ("Profile picture" or "Cover photo") in the middle and "Save" on the right, and no other control: there is no slider, no plus or minus, no arrow pad and no Centre button (round 1 had them; the owner removed them). Under the stage a one-line hint, "Drag to reposition", fades after the first move. Without visible buttons, the stage carries the same moves as screen reader actions (zoom in, zoom out, move up, down, left, right, reset) and a label and hint. Gestures use react-native-gesture-handler; no new native module (the Android fingerprint is unchanged).
**In the app, the flow.** Choosing a new profile picture or cover opens the editor straight away, from the photo on the phone; nothing is uploaded yet. "Save" there uploads it with its position (Edit profile shows it placed while it goes up, and "Save" on Edit profile stays off until it is up) and "Cancel" drops it and keeps the old picture. M8's own Save still sends the form. On Edit profile, tapping the current profile picture offers "Choose a new photo" and "Reposition" in a sheet (with no picture, it goes straight to choosing one); the cover keeps a small "Reposition" beside its camera. One shared picture component (`PositionedImage`) places the photo from the link; `Avatar`, the covers on Me, a visitor's profile, the feed's profile cards, Edit profile, and `MediaCard` (creator cards on Explore and Home, the pay sheet's header) use it. The editor is not on the design canvas: it is built from the app's own parts and listed in `docs/designer/BRIEF.md`.
**Carried out by:** PHOTO-POSITION (Hub and app), rounds 1 and 2.

### R-97 · WAWU offers no investments: Capital is off and out of sight; the Passes card is always on the wallet
*Owner, 26 Oct 2026, on seeing "Capital: Fixed returns and shares" on the wallet: "This is no investment territory. What the heck is that doing here?"* WAWU offers no investments. Nuvion's Capital (fixed returns and shares, NUV-12, the "Capital savings" of R-84) is switched off and not shown anywhere a person can see it. (1) The Hub's admin plan setting `capital.enabled` is OFF by default (the seed file `src/plan-settings/plan-settings.defaults.json` and the registry fallback in `src/plan-settings/plan-setting-registry.ts`; a switch that cannot be read counts as off), and the data migration `20261210090000_capital_off` sets any saved `capital.enabled` row to off. With Capital off the Hub opens no new orders; what a person already holds stays readable and withdrawable, so nobody is locked out of money they hold (today nobody real holds any). (2) The app draws the wallet's Capital row, and so every entry to `/capital`, only when `GET /capital/availability` says the person holds something; whether the Hub takes new orders no longer draws it. No Capital screen is deleted (a removal is its own task later). (3) The admin dashboard's Capital screen stays, read only. Nothing is deleted anywhere.
*Passes card (owner, 26 Oct 2026, on the wallet home: "something was beside where the points count lie ... something is missing"):* for a person with an open wallet the Passes card (W1, `design/_gen/wallet.js` line 47, WALLET-38) is always drawn beside Points, the same size and 10 apart. With an event pass it is the card it was, opening W44. With none, or when the read of `GET /me/tier` fails, it reads "Passes" / "No event pass yet" / "Comes with Founding Maker" and opens the tiers (VF5). This follows the standing rule that a section whose task is complete stays drawn with its designed empty state.
**Carried out by:** CAPITAL-OFF (Hub and app).
*Narrows R-84 (Capital savings) and the "drawn only when the person has a pass" line of WALLET-38.*
