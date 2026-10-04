# Google Play listing: Who Made This

Prepared by the RELEASE-01 builder on 4 Oct 2026 from `origin/main` 794b3ed, `DECISIONS.md`, the code, and the
backends' main branches (read only). **Submission is the owner's alone**, from the owner's own machine, with the store
keys kept off Expo (`docs/BUILDS.md`). Nothing in this folder has been sent to Google or Expo.

Companion files: `docs/release/DATA-SAFETY.md` (the data-safety form, item by item) and `docs/release/SCREENSHOTS.md`
(the screenshot plan and what can be shot today).

Play's current limits, read from Google's help pages on 4 Oct 2026 (Console wording moves; check it on the day):
short description 80 characters; screenshots 2 to 8 per device type, JPEG or 24-bit PNG without alpha, each side 320
to 3,840 px, the long side at most twice the short side; feature graphic 1,024 x 500; app icon 512 x 512 32-bit PNG up to
1,024 KB. The 30-character app name and 4,000-character full description limits are Play's long-standing limits, not
stated on the page I read.

---

## 0. Read this first: what stops a submission today

The listing text below is ready. The app is not. On main today the five tabs (Home, Explore, Inbox, Wallet, Me) are
title-only placeholders (`src/features/shell/TabScreen.tsx`); what is built is sign-up and sign-in, Open your wallet
(BVN and NIN, details, selfie, account, PIN), Edit profile with social links, and the payout bank account. 142 of 207
tasks are `todo`. This is expected (RELEASE-01 depends on SHELL-03 and KYC-04 only; RELEASE-02 submits after
CHECK-3), but these items are **Google policy requirements that a feature task must meet first**, so the owner should
know the list now:

| # | What Google requires | State on main | What unblocks it |
|---|---|---|---|
| B1 | **Account deletion** (User Data policy): an in-app path to delete the account and its data, and a public web link where a person can request deletion. | No delete screen (SETTINGS-05 `todo`, SETTINGS-06 `todo`, SETTINGS-08 `todo`). The Hub today schedules a 48-hour grace and has no cancel route, while R-17 says 30 days cancelled by signing in. The hard-delete service (`AccountPurgeService`) has no caller. The web has `/settings/delete-account`, but it sits behind sign-in (the web's `RequireAuth` sends signed-out visitors to sign-in), so it is not a page a person who cannot sign in can use. No public deletion-request page exists that I could find. | SETTINGS-05, 06 and 08 built and verified; the owner publishes a web page (or form, or a mailbox) that names the app and says how to ask for deletion. Both go in Console, "App content", "Data safety". |
| B2 | **Privacy policy URL** that is public, loads without login, names the app or developer, and covers what the app collects. | `https://wawuafrica.com/terms` loads signed out (HTTP 200 on 4 Oct 2026) and `https://wawuafrica.com/privacy/policy` redirects to its privacy section. The text is the web's "Master Terms, Privacy and Platform Policy": generic, it does not name BVN, NIN, selfie, Fintava or Loma Bank, and it does not say "Who Made This". The in-app Terms and Privacy screens are SETTINGS-02 (`todo`) and take the owner's legal text. | The owner (with their lawyer) supplies privacy text that matches `DATA-SAFETY.md`; SETTINGS-02 serves it; the URL below points at it. |
| B3 | **Payments policy**: Play requires Google Play Billing for in-app purchases of digital goods and services, with listed exemptions. | The app sells digital items through the Naira wallet, not Play Billing: unlocking a creator's content, WAWU Credits, verification ticks. Tickets, school fees, bills, legal consultations and person-to-person transfers are plausibly services or transfers outside the exemption question, but I am not the one to rule on it. | **OWNER TO CONFIRM** (it is a business and legal call, so no task can settle it): read Play's Payments policy and the alternative-billing programmes open to Nigeria, decide which items are exempt or covered, and record the ruling in `DECISIONS.md`. A rejection on this ground would arrive after submission. |
| B4 | **User-generated content policy**: the app must let people report objectionable content and block abusive users. | Blocking is built on the backend (SETTINGS-04) and drawn (Z4, Z5, Z12; "Block someone from their profile menu"). The canvas draws no control to report a piece, comment, message or profile (the only "Report a problem" is for payments, W27, which opens support chat, SUPPORT-01). The backend has a DM-report table. Creator uploads go through review (ME-08 "in review"). | **OWNER TO CONFIRM** a decision: whether a "Report" action is added (a design change, so it needs a ruling in `DECISIONS.md`), or whether support chat plus block is judged enough for review. |
| B5 | **Camera and photos** declarations. | The selfie (A6) and profile pictures (M8) need `expo-camera`, `expo-image-manipulator` and `expo-image-picker`, which are not installed (SHARED-CHANGES row 8 and KYC-03 #1, both `open`). Today's phone build says "We can't open your camera". | The owner applies SHARED-CHANGES rows 8 and KYC-03 #1 and a new build is made. The permission list on the Play-built app must then match `DATA-SAFETY.md`, section "Permissions". |

None of these is something the builder may decide; each names the fact that unblocks it.

---

## 1. Owner checklist: Play Console, in order

**Have ready before you start**

- The Play developer account (an organisation account, verified), with the Payments profile set up.
- The company's legal name, a public support email you read daily, and a public website address.
- The public privacy policy URL and the public account-deletion URL (B1, B2 above).
- The review account (section 7) created in the **live** system, with its email and password.
- A finished production build (step 9) and the real screenshots from it (`SCREENSHOTS.md`).
- A 512 x 512 icon and a 1,024 x 500 feature graphic. The brand pack is in `assets/brand/` (R-37); the feature graphic
  is not in the repo and needs the owner or the designer.
- Your answers to B3 and B4.
- If the developer account is a **personal** account created after November 2023, Play also requires a closed test with
  at least 12 testers for 14 days before it allows production access. Organisation accounts are exempt. **OWNER TO
  CONFIRM** which kind you have, on the Console dashboard.

**Steps**

1. **Create the app.** Play Console, Create app. Name `Who Made This`. Default language English (United Kingdom or
   Nigeria; choose the one Console offers that fits). App (not game). Free. Accept the declarations. The package is
   `africa.wawu.wmt` (`app.json`). Do not change it after the first upload.
2. **Set up the store listing** (Grow, Store presence, Main store listing): paste the name, short description and full
   description from section 2; upload icon, feature graphic and 2 to 8 phone screenshots.
3. **Store settings:** category and tags (section 2), contact email, website, phone (optional).
4. **App content** (Policy, App content), one declaration at a time, using these files:
   - Privacy policy: the URL (B2).
   - Ads: section 5.
   - App access: section 7 (give Google the review account).
   - Content ratings: section 3.
   - Target audience and content: section 4.
   - Data safety: `DATA-SAFETY.md`.
   - Financial features: section 6.
   - Account deletion: B1's two paths.
   - Government apps, News, Health, COVID-19: not applicable (select the "No" options; section 6).
5. **Internal testing first.** Testing and release, Testing, Internal testing, create a release, add yourself and the
   developer as testers. This is where the first `eas submit` upload goes (`docs/BUILDS.md`, "Releasing").
6. **Build** from your machine or Expo's: `eas build -p android --profile production`. This makes a signed app bundle
   (`.aab`). Expo creates and keeps the upload key on the first Android build (`docs/BUILDS.md`, one-time setup 4).
7. **Create the Google service-account key** (Play Console, Setup, API access) and keep the JSON file on your own
   machine. **Do not upload it to Expo.** Give it to `eas submit` when it asks.
8. **Submit:** `eas submit -p android` from your machine. The first upload creates the release on the internal track.
9. **Install from internal testing** on your Android phone (the capability check in `tasks/RELEASE-01.md`): the app
   installs from Play, you can sign in with the review account, and it reaches `https://api.wawuafrica.com`.
10. **Run Google's pre-launch report and the Console's "Publishing overview" / policy status checks** (the second
    capability check). Fix whatever it flags.
11. **Production:** Testing and release, Production, create a release from the same bundle, add release notes, send
    for review. Review takes the store's time (usually one to three days; longer for a first app).
12. After launch, small fixes go out with `eas update --channel production`, owner only (`docs/BUILDS.md`).

---

## 2. Store listing text

| Field | Value |
|---|---|
| App name (30 max) | `Who Made This` (13) |
| Short description (80 max) | `Get paid for what you know. Sell your work and answer paid questions.` (69) |
| Category | **Business** is the closest fit (a marketplace where people sell their work and expertise). Alternatives: Social, Shopping. **Not Finance**: the app is not mainly a banking app, but the Financial features declaration (section 6) still applies. The owner's call; category is not a product fact. |
| Tags | Pick from Play's list: creator, marketplace, wallet or payments if offered. |
| Contact email | `<OWNER TO FILL: public support email>`. `support@wawuafrica.com` appears in the web's privacy text (privacy requests) and on canvas Z9; use it only if the owner confirms the mailbox is monitored. |
| Website | `<OWNER TO FILL: public website>` |
| Phone | optional; leave blank unless the owner wants one public |
| Privacy policy URL | `https://wawuafrica.com/privacy/policy` (redirects to the privacy section of `/terms`) **or** a new page the owner publishes (B2). **OWNER TO CONFIRM.** |
| Account deletion URL | `<OWNER TO FILL: page that explains how to request deletion>` (B1) |

### Full description (4,000 max; this text is 2,126 characters)

Every sentence is traced to a ruling or a task in section 8. Do not paste a paragraph whose tasks are not yet done
and verified.

```
Who Made This is where Nigerian creators and professionals get paid for what they know, and where everyone else finds them.

SELL YOUR WORK
Upload your work, set a price in Naira, and people unlock it from their wallet. You can also share a piece for free. Fans can tip you. Everything you list goes through review before it goes live. Earnings land in your wallet automatically.

ANSWER PAID QUESTIONS
Switch on paid questions and get paid to reply. People can also chat with you for free, and send or request money inside a chat.

DISCOVER CREATORS
Browse Home and Explore, search for creators and communities, follow the people you like, and preview a piece before you pay for it. A verification tick shows that an account is verified.

COMMUNITIES
Join communities, read and post in their rooms, or host your own. Messages in some communities cost WAWU Credits. Credits are a simple count that you buy and spend inside the app. They are never a cash balance.

EVENTS
Browse events, buy a ticket, and show your ticket as a QR code at the door. Verified accounts can host events and check people in.

SCHOOLS AND PROFESSIONALS
Find schools and courses, enrol and pay, and keep track of your courses. Find professionals, or get listed as one. Get legal help through a chat.

YOUR WALLET
Open a Naira wallet when you are ready to move money. Opening one asks for your BVN and NIN, a selfie that is matched to your BVN photo, your home address and a transaction PIN. Nobody has to do this to browse. Once it is open you can pay for things, send money to other users or to a bank account, add money by bank transfer, pay electricity, airtime, data and cable TV bills, see your transactions, and share receipts. You approve payments with your PIN, or with your fingerprint or face if your phone has one. You see the fees before you confirm any payment.

YOUR DATA
Block people, switch notifications on or off, download your data, and delete your account from Settings.

Who Made This works in Naira only. Wallet and identity checks are for people with a Nigerian BVN. Sign-up uses a Nigerian phone number. You must be 18 or over.
```

What the text deliberately leaves out, so nobody adds it back: any fee, rate, limit or price (R-10 and the canvas are not
facts for a listing); "banking for everyone" (the welcome screen drops "and bank it all in one app" because nothing backs
it, G-34); any licence or "regulated" claim (R-1: licence wording is the owner's, from config); dollar, crypto and card
features (R-16, after launch); a free trial (none exists); the Shop (R-2); a Trust Score (R-18); liveness or anti-spoof
claims (there is no liveness check, only a face match).

Optional extra line the owner may add after the wallet paragraph, **only after confirming the words with their lawyer**:
"Wallet accounts are provided through Fintava, with the account held at Loma Bank." (R-1 names both; the bank name and
licence line are config the owner fills in, `WALLET_BANK_NAME` and `WALLET_LICENCE_LINE`.) **OWNER TO CONFIRM.**

---

## 3. Content rating questionnaire (IARC, in Console)

Answers proposed from the code and rulings. Choose the questionnaire category that Console calls social, communication
or user-generated content (if Console words the categories differently, pick the closest and answer as below). The
owner reads each answer and submits it; Google issues the rating, I do not predict it.

| Question area | Proposed answer | Basis |
|---|---|---|
| Violence in the app's own content | No | The app has no violent content of its own. |
| Sexual content or nudity in the app's own content | No | None. |
| Profanity or crude humour in the app's own content | No | None. |
| Controlled substances (drugs, alcohol, tobacco) shown or promoted | No | None. |
| Gambling, real or simulated | No | None exists. |
| Fear or horror | No | None. |
| Users can interact or exchange content with each other | **Yes** | Free chat, community rooms, comments, paid questions (R-13, INBOX tasks). |
| Users can share their location with others | **No** | No location permission or feature. A profile "location" and an event city are typed text. |
| Shares personal information publicly | **Yes**, declare it | Profile name, handle, bio, location text and pictures are public (M8). |
| Lets users buy digital goods | **Yes** | Content unlocks, tickets, WAWU Credits, ticks, paid through the wallet. |
| Unrestricted access to the internet or a web browser | No | No in-app browser. "Apply on the school's site" and receipt links open the phone's own browser (R-33, SCHOOLS-08). |
| Moderation of user content | Describe: creator uploads are reviewed before they go live (ME-08 "in review"); blocking exists (SETTINGS-04); see B4 on reporting. | **OWNER TO CONFIRM** B4 first. |

---

## 4. Target audience and content

- **Age groups to select: 18 and over only.** Do not select any group under 18.
- The app is not designed for children and does not appeal to them. This keeps it out of Play's Families programme.
- Basis: opening a wallet needs a BVN (R-6); canvas Z10 draws "18 or over" in the Terms. **OWNER TO CONFIRM**: the
  canvas is not authoritative for legal text (DECISIONS, Authority), so the minimum age is the owner's to confirm, and
  the Terms text (SETTINGS-02) must say the same.
- Sign-up does not ask for a date of birth. Age is only checked against the BVN record when a wallet is opened.

---

## 5. Ads declaration

- **"Does your app contain ads": Yes**, if the TGIF sponsored card ships (ADS-01, `todo`). Ads are booked by the WAWU
  team and invoiced by hand (R-15); the app shows a sponsored card on Today and counts views and taps (ADS-04, ADS-05).
  Google counts this as ads even though it is not an ad network.
- If the owner decides not to ship the sponsored card at launch, the answer is **No**. The answer must match the build
  that is reviewed.
- The app includes no third-party ad SDK (checked: `package.json` has none).

---

## 6. Other Console declarations

| Declaration | Proposed answer | Note |
|---|---|---|
| Financial features | **Mobile payments and digital wallets**; also **Money transfer and wire services** (sends to bank accounts, WALLET-03). Not loans, not banking products, not crypto (crypto is after launch, R-16). | Google's options as read on 4 Oct 2026: under "Payments and transfers", "Mobile payments and digital wallets" and "Money transfer and wire services". **OWNER TO CONFIRM** the list on the day, and whether paying bills needs "Other". No licence documents are asked for these options on the page I read; the owner holds the Loma Bank and Fintava paperwork (R-1). |
| Government app | No | |
| News app | No | |
| Health apps | No health features in the app | The Hub has a `health-plan` module, but it is a web-only feature (`docs/WEB-ONLY-FEATURES.md` row 75, "Not in the app", R-34). **OWNER TO CONFIRM** it is not offered in the app. |
| COVID-19 tracing or status | No | |
| Advertising ID | No use. Declare "does not use". | No analytics or ad SDK in `package.json`. Re-check after the native module batch (SHARED-CHANGES row 8). |
| Data safety | See `DATA-SAFETY.md` | |
| Account deletion | See B1 | |
| Photo and video permissions | Declare the camera (selfie) and the photo picker (profile and content) uses only if the final manifest has READ_MEDIA permissions | `expo-image-picker` uses the system photo picker on current Android and should need no broad media permission. **OWNER TO CONFIRM** from the built bundle's manifest. |

---

## 7. App access (instructions Google's reviewer needs)

Most of the app is behind sign-in, so Google requires login instructions. A reviewer cannot sign themselves up:
sign-up needs a Nigerian phone number that receives a text code and an email code (AUTH-03, AUTH-05; R-36: +234 numbers
only), and opening a wallet needs a real Nigerian BVN, NIN and a face that matches the BVN photo (R-6). So the owner must
create a **review account** in the live system before submission, and keep it working through review.

**What the owner does**

1. Sign up a new account in the production app with an email and a +234 phone number the owner controls. Finish the
   phone and email codes. Choose the account type that shows the most features (the "earn" type, which sends
   `accountType: creator`).
2. Decide how far to take it, and write that into the instructions:
   - **Recommended:** open a wallet on this account with the owner's own BVN, so a reviewer sees the wallet screens, and
     put a small balance in it. This is the only way a reviewer can see money screens, because they have no BVN.
   - **Minimum:** leave the wallet unopened. Then the instructions must say that wallet screens lead to "Open your
     wallet", which asks for a Nigerian BVN that a reviewer will not have.
3. Make some content, an event and a community available on the account so the screens are not empty.

**Text to paste into Console, "App access"** (fill the angle-bracket parts; never write real credentials in this
repository):

```
Most of the app needs an account. Sign in with email and password:
1. Open the app, tap "Sign in".
2. Email: <OWNER TO FILL: review account email>
3. Password: <OWNER TO FILL: review account password>
Do not create a new account: sign-up needs a Nigerian (+234) phone number that receives a text code.
This account <has / does not have> an open wallet. <If it does: its wallet holds a small test balance.>
Opening a new wallet asks for a Nigerian BVN and NIN and a selfie that matches the BVN photo, so it cannot be
completed with a test identity; please use the account above to review the wallet screens.
No other login steps, no two-step codes, no region restriction on sign-in.
```

Keep the review account's password in the owner's own password manager, not in `DECISIONS.md`, the task file or any
branch. If the password changes, update "App access" in Console before the next review.

---

## 8. Claims table: where each part of the description comes from

"Status" is what `tasks/*.md` says on main 794b3ed. A paragraph may go into Console only when every task in its row is
`done` (or `review`) and CHECK-3 has passed.

| Description paragraph | Source | Tasks (status on main 794b3ed) |
|---|---|---|
| Set a price in Naira; free pieces; unlock from wallet; tips | R-8 (free allowed), R-5 (Naira), R-10 (purchase pays Fintava's charge) | ME-04 `todo`, ME-08 `todo`, HOME-12 `todo`, HOME-13 `todo`, HOME-15 `todo` |
| Listings go through review | ME-08 title "in review"; ME-09 `done` (backend rejection reason) | ME-08 `todo` |
| Earnings land in the wallet automatically | R-11 | WALLET-16 `todo` |
| Paid questions; free chat; send and request money in chat | R-13 | INBOX-10 `todo`, INBOX-12 `todo`, INBOX-19 `todo`, INBOX-20 `todo`; backend INBOX-06, 08, 09 `done` |
| Home, Explore, search, follow, preview, ticks | R-7, R-8; HOME and EXPLORE tasks | HOME-01 to HOME-03 `todo`, EXPLORE-01 to 04 `todo`, ME-12 `todo`; backend HOME-04 to 06 `done` |
| Communities, Credits as a count | R-5; "WAWU Credits" name ruling | INBOX-05 `todo`, INBOX-13 `todo`, INBOX-14 `todo`; backend INBOX-01 `done` |
| Events, QR ticket, verified hosts, check-in | CLAUDE.md of the web (hosting is verified-only, B3); EVENTS tasks | EVENTS-01, 03, 04, 06, 08, 09 `todo` |
| Schools and courses, enrol and pay | R-2, R-12, R-33 | SCHOOLS-03, 06, 08 `todo`; backend SCHOOLS-01 `done` |
| Professionals; legal help through a chat | R-14, R-18 | PROS-01, PROS-03 `todo`, LEGAL-02, 04, 06 `todo` |
| Wallet: BVN, NIN, selfie, address, PIN | R-6; KYC-01 to KYC-05 | **built**: KYC-03, 04, 05 `done` (selfie needs the camera module, B5) |
| Pay, send to users and banks, add money by bank transfer, bills, transactions, receipts | R-19, R-33; MONEY, WALLET, BILLS | MONEY-17 `todo`, WALLET-02, 03, 05 `todo`, BILLS-01 to 03 `todo`; MONEY-15, WALLET-18 `done` |
| PIN, or fingerprint or face | R-26, MONEY-09, MONEY-14 | `done` (biometric needs `expo-local-authentication`, in `package.json`) |
| Fees shown before you confirm | R-10, R-23 | MONEY-03 `done` (pay sheet); WALLET-15 `done` |
| Block, notifications, download data, delete account | SETTINGS tasks, R-17 | SETTINGS-01 `todo`, SETTINGS-05 `todo`; backend SETTINGS-04, 07 `done` |
| Naira only; Nigerian BVN; Nigerian phone number | R-5, R-6, R-36 (R-36 is "default until the owner rules") | `done` where built |
| 18 or over | canvas Z10 (not authoritative) | **OWNER TO CONFIRM** (section 4) |

---

## 9. Release notes for the first release

`First release of Who Made This.` Nothing else: do not list features in the notes either.
