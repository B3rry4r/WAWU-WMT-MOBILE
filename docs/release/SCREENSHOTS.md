# Play screenshot plan: Who Made This

Prepared by the RELEASE-01 builder on 4 Oct 2026 and revised on 6 Oct 2026 against mobile `origin/main` 8484195.

**Short answer: no listing-quality screenshot can be taken today.** The five tabs are title-only placeholders, and
every feature screen a store visitor should see (Home, Explore, a profile, Communities, Wallet home, Events, Schools) is
`todo`. The only screens that exist are the signed-out ones and Open your wallet, Edit profile and Payout account, and
none of the signed-in ones can be reached from the tabs yet (no hub links to them; DECISIONS R-27 says the task that
builds the destination adds the link). Real screenshots come from the **production build on a device**, after the
tasks below are done.

## What Google requires (read from Play's help page on 4 Oct 2026)

- 2 to 8 screenshots per device type; at least 2 in all to publish.
- JPEG or 24-bit PNG, no alpha. Each side 320 to 3,840 px; the long side at most twice the short side.
- Phone portrait, recommended 9:16 at least 1,080 x 1,920. The app is portrait only (`app.json` `orientation`).
- Feature graphic 1,024 x 500 (JPEG or 24-bit PNG, no alpha): the owner supplies it, the only owner asset. The 512 x 512
  icon is made by the lead (`docs/release/assets/play-icon-512.png`). Neither is a screenshot; see `PLAY-LISTING.md`.
- Tablet and Chromebook screenshots are optional. The app is a phone app; skip them.

## The plan: 8 phone screenshots, light theme, 1,080 x 1,920

The app follows the phone's theme (`userInterfaceStyle: automatic`). Set the phone to **light** for every shot, and
use a test account whose screens are full of real-looking content (no empty states, no "Loading", no error banners).
Use no real person's face, name or balance: the review and shoot accounts are the owner's own, or made-up ones.
Money figures on screen must be the shoot account's own, never a promise (no fee or rate may be visible unless it is
the real one the app shows). Hide the notification shade and use the phone's 100% battery, full signal.

| # | Shot | Artboard | Why it sells | Built on main today? | Needs before it can be shot |
|---|---|---|---|---|---|
| 1 | Home, Today | H1 | The first thing a visitor sees | **No** (`Home` tab is a title) | HOME-01, and its depends_on list (HOME-02, HOME-07, HOME-09, HOME-10, HOME-11, EXPLORE-02, ME-02, ME-04, ME-14, WALLET-02, WALLET-05, BILLS-01, EVENTS-01, LEGAL-02, SCHOOLS-03) |
| 2 | For you feed with a video and a locked piece | H2, H3 | "Preview before you pay" | **No** | HOME-02, HOME-07 (backend HOME-04 to 06 are done) |
| 3 | Explore: categories and featured creators | X1, X2 | Discovery | **No** | EXPLORE-01 (and EXPLORE-03 backend, EXPLORE-02) |
| 4 | A creator's profile: content, services, about | M1, M2 | "Get paid for what you know" | **No** | ME-01 (needs ME-04, ME-11, ME-12 and more) |
| 5 | Content detail with the Unlock sheet | H19, H14 | Naira pricing, fees shown before paying | **Partly**: the pay sheet (MONEY-03 `done`) exists but is a dev preview route that redirects home in a release build | HOME-03, HOME-12, WALLET-15 is done |
| 6 | Communities or a paid-question thread | I24 or I2 | Chat and paid questions | **No** | INBOX-05, or INBOX-10 |
| 7 | Wallet home | W1 | The Naira wallet | **No** (`Wallet` tab is a title) | WALLET-01 (and WALLET-02, 05, 06, 04, BILLS-01) |
| 8 | Events list or a ticket with its QR | E1 or E7 | Events and tickets | **No** | EVENTS-01, or EVENTS-03 |

Optional swaps if a later task finishes first: Schools (SC1, SCHOOLS-03), Professionals (P1, PROS-01), Pay a bill
(S2, BILLS-01).

**Screens that are built and could stand in only for a "how it works" strip, not for the listing's first three shots:**

| Screen | Artboard | Task (status) | Reachable on main today? |
|---|---|---|---|
| Welcome | A1 | AUTH-02 `done` | Yes, signed out, first screen |
| Why are you here | A2 | AUTH-02 `done` | Yes |
| Create your account | A3 | AUTH-04 `done` | Yes |
| Sign in, forgot password | A22, A23 | AUTH-01 `done` | Yes |
| Enter your BVN and NIN | A14 | KYC-05 `done` | Only by route `/open-wallet` (no link from the Wallet tab yet; WALLET-01 adds it) |
| Confirm details, selfie, matched, no match | A5, A6, A7, A16 | KYC-03 `done` | Only by route; the selfie needs `expo-camera`, which is not installed (B5, SHARED-CHANGES KYC-03 #1) |
| Wallet open, create PIN | A8, A9, A10 | KYC-04 `done` | Only by route |
| Edit profile, social links | M8, M9 | ME-06 `done` | Only by route; no picture can be chosen on a phone until `expo-image-picker` is installed |
| Payout bank account | A21 | WALLET-11 `done` | Only by route |

Open your wallet screens are **not** good listing shots: they show identity entry, and Google reviewers and users read
a sensitive-data screen in a store listing badly. Keep them out of the 8 unless the owner decides otherwise.

## Draft screenshots (not committed, not for the store)

The web export renders the built signed-out screens in Chromium. These five are **drafts** to show the format and check
sizing: 1,080 x 1,920 JPEG, light theme, 390 x 693 CSS px at 3x then resized to 1,080 x 1,920, no network allowed
(every request outside localhost was blocked during capture). They come from the **web export**, not a device build, so
fonts, safe areas and the status bar differ from the phone. They are not for upload.

Folder: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/release01/shots/`

| File | Screen | Artboard |
|---|---|---|
| `welcome-light.jpg` | Welcome ("Get paid for what you know") | A1 |
| `account-type-light.jpg` | Why you're here | A2 |
| `sign-up-light.jpg` | Create your account | A3 |
| `sign-in-light.jpg` | Sign in | A22 |
| `forgot-password-light.jpg` | Forgot password | A23 |

No draft of any signed-in screen was made: the tabs are placeholders, and the built signed-in screens need a signed-in
session against a backend (`docs/LOCAL.md`, OPS-03), which this task does not start. The dev preview routes
(`/preview/pay-sheet`, `/preview/pin-sheet`) redirect home in an exported build by design.

## How the owner takes the real ones

1. After CHECK-3, install the production build from Play internal testing on the owner's Android phone (the first
   capability check in `tasks/RELEASE-01.md`).
2. Switch the phone to light theme, 100% battery, full signal, notifications off.
3. Sign in as the shoot account (not the review account, which should stay plain) and walk to each screen in the table.
4. Capture with the phone's screenshot button. Most phones save a 1,080 x 2,400 image (2.22:1), which is **over**
   Play's 2:1 limit. Crop to 1,080 x 2,160 or 1,080 x 1,920, or change the phone's display size to a 16:9 or 18:9
   shape before capturing.
5. Check each file: JPEG or 24-bit PNG, no alpha, both sides 320 to 3,840 px, ratio at most 2:1. Drop any with a
   real person's private data, a notification, an error, or a loading spinner.
6. Order them as in the table; upload under Main store listing, Phone screenshots.
