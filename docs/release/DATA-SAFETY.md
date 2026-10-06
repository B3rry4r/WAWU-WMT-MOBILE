# Google Play data safety: Who Made This

Prepared by the RELEASE-01 builder on 4 Oct 2026. The owner fills the form in Play Console (Policy, App content, Data
safety) and is the one who signs that it is accurate. Where I could not confirm an answer from code or docs it says
**LEAD CHECK** (or **OWNER DECISION** where it is a real owner call) and what to check. Evidence paths are in this repo unless they start `hub:` (wawu-backend
`origin/main` 38bbe4c) or `id:` (wawu-id `origin/main` 4715d17), both read only. The web repo is `web:`.

**Wallet provider is changing (6 Oct 2026).** The money rail moves from Fintava† (account held at Loma Bank†) to **Nuvion**.
Every Fintava† or Loma Bank† mention below carries a dagger (†) and is **to be replaced when the Nuvion switch lands**;
none was deleted. Nothing about Nuvion is in this repository, so every row that names the provider (who receives the
BVN, NIN, selfie, name, address, phone, email, account and transaction data, and whether it is "shared") must be
redone from Nuvion's own documents once the switch is built. † = to be replaced when the Nuvion switch lands.

**Labels in this file.** **OWNER DECISION** is a real owner call (sharing declarations D-1, retention D-2, the legal text
D-3, age). **LEAD CHECK** is a fact the lead or a verifier looks up or runs; it is not a question for the owner.

Form categories and wording are Google's, read from the Play help pages on 4 Oct 2026. Under Google's definitions,
"sharing" is a transfer to a third party, except transfers to a **service provider processing data on your behalf**,
transfers required by law, transfers the user starts with prominent disclosure and consent, and anonymised data.
Whether Fintava† and Loma Bank† are "service providers" or "third parties" in Google's sense is a legal reading; I have
declared them as shared, the cautious answer (see D-1).

**Which build this describes:** the launch build, i.e. every launch-priority task done. Today's main build contains
less (section 4 says which rows are live in the phone build now). Re-answer the form if the shipped build differs
from this file; Google compares the form with the app's behaviour and the manifest.

---

## 1. Overview answers

| Form question | Answer | Evidence |
|---|---|---|
| Does the app collect or share any of the required data types? | Yes | below |
| Is all collected data encrypted in transit? | **Yes** | The app only calls `https://api.wawuafrica.com` and `https://id.wawuafrica.com` (`src/api/env.ts`, `eas.json`, all three profiles). On 4 Oct 2026 the live host answered over HTTPS with a certificate that verified against the system trust store, and plain HTTP answered `301` (nginx 1.24). TLS is Let's Encrypt via certbot (`hub:deploy/README.md`, steps 5 and "Live as of"). The database connection is `sslmode=verify-full` (same file). Uploads go to a presigned `https://` Spaces address (`hub:src/storage/storage.service.ts`, `S3_ENDPOINT=https://...`; app side `src/features/profile-edit/upload.ts`). The Hub refuses any Fintava† host except Fintava†'s own (`hub:deploy/README.md`, "A value that IS set is checked at boot"). **LEAD CHECK** the TLS version and cipher grade with an SSL test on both hosts, and that the Expo update and push endpoints (below) count as encrypted too (they are HTTPS). |
| Do you provide a way for users to request that their data is deleted? | **Yes, once B1 in `PLAY-LISTING.md` is cleared.** Do not tick Yes until SETTINGS-05, 06 and 08 are built and the web deletion page is live. | R-17; `hub:src/account/account.service.ts`; `hub:src/account-purge/account-data-map.ts`. Today: a 48-hour grace and no cancel, not the 30 days R-17 rules, and no caller for the hard purge. |
| Data deletion URL (Console asks for it when the answer is Yes) | `<OWNER TO FILL>` | `PLAY-LISTING.md`, section 2 |
| Independent security review (optional badge) | No | none done |
| Committed to Play Families policy | No | audience is 18 and over |

---

## 2. Data types, one by one

Column "Optional?" follows Google's meaning: **optional** if a person can use the app without the app collecting it.
Opening a wallet is a choice (R-6), so wallet data is optional at app level; it is required for the wallet feature.
**LEAD CHECK** that reading with Console's help text.

Purposes use Google's list: App functionality (AF), Account management (AM), Fraud prevention, security and compliance
(FSC), Developer communications (DC), Personalisation (P), Analytics (AN), Advertising or marketing (AD).

### Personal info

| Type | Collected | Shared | Purpose | Optional? | Evidence and notes |
|---|---|---|---|---|---|
| **Name** | Yes | Yes, with Fintava† when a wallet is opened | AF, AM, FSC | Optional | Profile name is entered in Edit profile (`src/features/profile-edit/form.ts`, `splitName`) and is shown on the public profile. WAWU ID stores first, middle and last name (`id:prisma/schema.prisma`, `WawuUser`). At wallet opening the name from the BVN record is sent to Fintava† and not kept by the Hub (`hub:src/money/opening/wallet-opening.service.ts` header: "Never stored or logged: the BVN, the NIN, the name, the date of birth, the address"). |
| **Email address** | Yes | Yes, with Fintava† at wallet opening; mail goes out through Resend | AF, AM, FSC, DC | Required (sign-up asks for it and confirms it by a code) | `src/features/auth/SignUpScreen.tsx` ("Email"); `id:deploy/ENV.md` (`RESEND_API_KEY`); `hub:src/money/opening/wallet-opening.service.ts` sends `email: mail` to Fintava†. Resend is a service provider sending on WAWU's behalf: **OWNER DECISION** D-1: count it as sharing or not. |
| **User IDs** (account id, handle) | Yes | No (visible to other users inside the app only) | AF, AM, P | Required | `WawuUser.id`; `handle` in `src/features/profile-edit/form.ts`. |
| **Password** | Yes | No | AM, FSC | Required | Sign-up asks for it (`src/features/auth/SignUpScreen.tsx`, "Password", "At least 8 characters") and sign-in sends it (`src/api/identity.ts`, `loginRequest`). WAWU ID keeps only a hash (`id:prisma/schema.prisma`, `WawuUser.passwordHash`). Google's list has **no password item** and its help page does not mention credentials. **LEAD CHECK** the category: the closest are "User IDs" (account credentials identify the person) or leaving it out because it is never readable by WAWU; declare it under whichever Console's current help text names, consistently with the privacy text. |
| **Account type** (discover or earn, sent as `user` or `creator`) | Yes | No | AF, P | Required for sign-up (the answer on A2) | `src/features/auth/accountType.ts` (`wireAccountType`: sent to WAWU ID, never to the Hub); `id:prisma/migrations/20261002120000_add_phone_verification` adds `account_type`. Declared under "Other info" (it describes what the person uses the app for). |
| **Address** (home address) | Yes | Yes, with Fintava† | FSC, AM | Optional (only to open a wallet) | Typed on A5 (street, city or town, state; `src/features/open-wallet/ConfirmDetailsScreen.tsx`), kept in app memory only (`keptCheck.ts`, KYC-03 report), sent once to Fintava†, **not stored by the Hub** (`hub:src/money/opening/dto/open-wallet.dto.ts` header: "None of it is stored: it goes to Fintava† once and is dropped"). Fintava† keeps it on the account they open. |
| **Phone number** | Yes | Yes, with Fintava† (sign-up text codes go through Fintava†'s SMS; the phone is also the wallet's verified phone) | AF, AM, FSC | Required | `SignUpScreen.tsx` ("Phone number"); `id:deploy/ENV.md` (codes "texted through Fintava†'s `POST /sms/send`"); `hub:prisma/migrations/20261002200000_wallet_identity` (`verifiedPhone`). R-36: Nigerian +234 numbers only. |
| Race and ethnicity | No | n/a | n/a | n/a | not asked anywhere |
| Political or religious beliefs | No | n/a | n/a | n/a | not asked. (The web terms describe a Christocentric positioning; the app asks nothing about belief.) |
| Sexual orientation | No | n/a | n/a | n/a | not asked |
| **Other info**: date of birth, gender, occupation, bio, location text, social handles | Yes | Date of birth and gender: with Fintava† (they come from the BVN record and go back in the account opening). Occupation, bio, location, handles: No (public profile) | AF, AM, FSC | Optional | Date of birth and gender are read-only on A5 from the BVN check (`ConfirmDetailsScreen.tsx`). Occupation is stored (`hub:...wallet_identity`, `occupation`). Bio, location and social handles are profile fields (`form.ts`). |
| **Other info**: BVN and NIN (government identity numbers) | Yes | Yes, with Fintava† (the BVN check and the account opening) | FSC, AM | Optional (only to open a wallet) | KYC-05, KYC-03; `hub:prisma/migrations/20261002200000_wallet_identity`: "No full BVN or NIN is ever written here: a keyed hash (HMAC-SHA256 under IDENTITY_HASH_KEY) and the last 4 digits of each". The app sends them over TLS to the Hub, which forwards them to Fintava† and drops them; they pass through a 30-minute sealed handle that holds them encrypted (`hub:src/money/identity/check-handle.ts`, KYC-03 round 2). Not logged (KYC-03 builder and verifier privacy scans: 0 hits in database dumps and logs). **LEAD CHECK** where Google's current form puts government ID numbers (its list has no "government ID" item; "Other info" is the closest, and "User IDs" is the alternative). Declare under the one Console's help text names. |

| **Other info**: professional licence number and who issued it (**when PROS-03 ships**) | Yes, from professionals in a regulated field | No (the licence is checked with the issuing body; whether the number is shown on the profile is PROS-03's design, P6, P7) | AF, FSC | Optional (only for a professional listing) | `tasks/PROS-03.md` P6: "Licence number ICAN/2016/40921, Who issued it ICAN, uploaded ican-licence.pdf" and "We check your licence with the body that issued it". `todo`. The uploaded licence file is also a file or document (see "Files and docs" below). **LEAD CHECK** how the check is done and whether any third party receives the number. |
| **Address**: an event's street address (**when the events tasks ship**) | Yes, from people who host an event | No (it is shown publicly on the event) | AF | Optional (only for hosts) | `tasks/EVENTS-04.md` E14 ("street address", "Missing addresses are the top reason events get sent back"), E22. `todo`. Declare it under **Address** together with the home address row: it is typed public text, not the host's home unless they choose it. |

### Financial info

| Type | Collected | Shared | Purpose | Optional? | Evidence and notes |
|---|---|---|---|---|---|
| **User payment info** (a bank account to pay out to; saved recipients) | Yes | Yes, with Fintava† when money is sent | AF | Optional | Payout bank account (`src/features/wallet/PayoutAccountScreen.tsx`, WALLET-11 `done`; `hub:src/money/saved-accounts/payout-account.service.ts`) and saved recipients (`MoneyBeneficiary`, WALLET-14). Account numbers are never in a data export (`hub:src/data-export-request/data-export-sections.ts`, rule 3). |
| **Payment card details** | **No at launch** | n/a | n/a | n/a | Card top-up is after launch (WALLET-25 and WALLET-36 are `after-launch`; R-16). **Re-answer the form** if cards ship. |
| **Purchase history** | Yes | No (counterparties see their own side) | AF | Optional | Purchases, tickets, credits, ticks (`hub:src/account-purge/account-data-map.ts`: `Purchase`, `EventOrder`, `CreditPurchase`, `VerificationPurchase`). |
| **Other financial info** (wallet balance, transaction history, receipts, PIN-protected approvals) | Yes | Yes, with Fintava† (the account is theirs; WAWU only instructs) | AF, AM, FSC | Optional | Fintava†'s balance is authoritative (`CLAUDE.md` web note; MONEY-11); the Hub keeps a ledger (`FintavaLedgerEntry`, MONEY-10) and receipts (`MoneyReceipt`, WALLET-18). The transaction PIN is stored only as a hash (`TransactionPin`, `account-data-map.ts`). |
| Credit score | No | n/a | n/a | n/a | none |

### Messages

| Type | Collected | Shared | Purpose | Optional? | Evidence and notes |
|---|---|---|---|---|---|
| **Other in-app messages** (free chat, community messages, paid questions and replies, support chat, legal chat) | Yes | Legal chat text: with Google (Gemini), through the Hub. Other messages: No (the other person and the community see them) | AF | Optional | `account-data-map.ts` (`ChatMessage`, `CommunityMessage`, `DirectMessage`, `DmReply`); `hub:src/common/ai/` and `hub:deploy/README.md` ("the Legal AI intake", `GEMINI_API_KEY`). Google is a service provider here. **LEAD CHECK** that the legal chat (LEGAL-01, LEGAL-02) sends user text to Gemini at launch and that the privacy text says so; whether it counts as sharing is **OWNER DECISION** D-1. |
| Emails, SMS or MMS | No | n/a | n/a | n/a | The app does not read the phone's mail or texts. (It sends sign-up codes by SMS from the server; that is not the app collecting SMS.) |

### Photos, videos, audio, files

| Type | Collected | Shared | Purpose | Optional? | Evidence and notes |
|---|---|---|---|---|---|
| **Photos** (profile and cover pictures; photos in a creator's content; the selfie) | Yes | Selfie: with Fintava† (face match to the BVN photo). Pictures: No (public to other users) | AF, AM, FSC | Optional | Profile pictures upload to the Hub's storage (`src/features/profile-edit/upload.ts`, folders `avatars` and `profile/cover`; `hub:src/storage/storage.service.ts`, DigitalOcean Spaces). **Selfie**: sent once with the sealed handle (`src/features/open-wallet/api/opening.ts`), "lives only in the request that carries it: it goes to Fintava† and is dropped. It is never stored and never logged" (`hub:src/money/identity/selfie-match.service.ts` header). The Hub keeps only the outcome, time and confidence score of each match (`SelfieMatchAttempt`, "never the image"). There is **no liveness check**, only a face match (R-6 text, `docs/PLAN.md`). The phone build cannot take a selfie until `expo-camera` is installed (B5; `src/features/open-wallet/selfie/capture.ts`). |
| **Videos** (creator content: video lessons and previews) | Yes | No | AF | Optional | Content upload (ME-04 `todo`); storage folders `content/preview` and `content/full` (`hub:src/storage/storage.service.ts`). |
| **Voice or sound recordings**, **Music files**, **Other audio files** | Music and other audio files: Yes (audio content a creator uploads). Voice recordings: No | No | AF | Optional | HOME-02 lists an audio format. No microphone use is planned in any task or in SHARED-CHANGES row 8. **LEAD CHECK** when ME-04 is built. |
| **Files and docs** (books, templates, course material a creator uploads; documents a person picks) | Yes | No | AF | Optional | `expo-document-picker` is in SHARED-CHANGES row 8; formats in ME-04. **LEAD CHECK** when ME-04 and PROS-03 are built (PROS-03 may take credential documents). |

### Calendar, contacts, location, health

| Type | Collected | Notes and evidence |
|---|---|---|
| **Calendar events** | **No data leaves the phone.** | `expo-calendar` is planned (SHARED-CHANGES row 8; E7 "add to calendar"). Adding an event to the phone's calendar writes locally; the app sends no calendar data to a server. **LEAD CHECK** from the built manifest: the plugin's default permissions include read as well as write. If the app only writes, restrict the plugin to what it needs; a request to read the calendar needs a reason on the permission declaration. |
| **Contacts** | No | No contacts package is in `package.json`, no task lists one, recipients are found by name, handle or phone through the server (WALLET-08). |
| **Location** (approximate or precise) | No | No location package or permission. A profile "location" and an event city are typed text (declared as "Other info" above). |
| **Health and fitness** | No | none |

### App activity, web, device

| Type | Collected | Shared | Purpose | Optional? | Evidence and notes |
|---|---|---|---|---|---|
| **App interactions** (likes, views, shares, follows, ticks held, who viewed a profile) | Yes | No | AF, P | Required for the feature | `hub:src/account-purge/account-data-map.ts`: `ContentLike`, `ContentView`, `ContentShare`, `FollowRelationship`, `ProfileView`, `EventGoing`. Creator-facing counts are the product (HOME-04). |
| **In-app search history** | Yes (recent searches kept on the account) | No | AF, P | Optional (Clear removes it) | EXPLORE-05: "remembers a user's recent searches with Clear". `todo`. |
| **Other user-generated content** (comments, ratings, community posts, listings, event listings, reviews) | Yes | No | AF | Optional | `account-data-map.ts`: `Comment`, `ContentRating`, `ProfessionalReview`, `ContentPiece`, `Event`. Uploads are reviewed before they go live (ME-08). |
| **Other actions** (sponsored-card views and taps) | Yes, if ADS-01 ships | No | AD (measurement for invoicing advertisers), AN | Required if the card is shown | ADS-05 `todo`. R-15. **LEAD CHECK** purpose wording. |
| Installed apps, Web browsing history | No | n/a | n/a | n/a | none |
| **Device or other IDs** (push token) | Yes, when notifications are switched on | Yes, with Expo's push service (which forwards through Google's FCM) | AF | Optional (permission prompt; switches in Settings) | INBOX-03 (token registration), INBOX-21 (phone side), `expo-notifications` in SHARED-CHANGES row 8. Android push needs the owner's FCM credentials on Expo (`docs/PLAN.md`). Expo and Google are service providers: **OWNER DECISION** D-1, count as sharing or not. Also the advertising ID is **not** used. |
| **Approval device** (public key for fingerprint or face approval) | Yes | No | FSC | Optional | `hub:src/money/pin/approval-device.service.ts`; table `ApprovalDevice` ("a public key"). The fingerprint or face itself never reaches the app or the server: the phone's own lock screen checks it (`expo-local-authentication`, R-26). Do **not** declare biometric data as collected. **LEAD CHECK** that reading. |

### App info and performance

| Type | Collected | Notes and evidence |
|---|---|---|
| **Crash logs** | **No** | `package.json` has no crash or analytics SDK (no Sentry, Firebase, Crashlytics, Segment or similar; checked by reading every dependency). Play's own crash reporting through Android vitals is not the app collecting. |
| **Diagnostics**, **Other app performance data** | **No** from the app | Same. **LEAD CHECK** two server-side facts: the Hub and WAWU ID write request logs with the caller's IP address (journald; rate limits count by address, `hub:deploy/README.md`; WAWU ID has `rate_counters`), and **EAS Update** (`expo-updates`, `updates.url` in `app.json`) sends the platform, runtime version and channel to Expo when the app checks for an update. Check Expo's current privacy page, and say in the privacy policy that IP-based logs exist. Google's list has no IP-address item; if Console's help text puts IP logs under "Device or other IDs" or "Diagnostics", declare them there. |

---

## 3. How the data is kept, shared, and deleted

| Topic | Fact | Evidence |
|---|---|---|
| Who holds the money and the identity record | Fintava† (technology) and Loma Bank† (Iyin Ekiti MFB, the licence holder) hold the wallet account and the identity data they were sent. WAWU only instructs. Their retention follows their own and the law's rules. | R-1; `CLAUDE.md` web note |
| What WAWU keeps about identity | A keyed hash and last 4 digits of the BVN and NIN, the verified phone, occupation, the time the check passed, and a record of each check and selfie attempt (outcome, time, score). Not the BVN, NIN, name, date of birth, address, selfie or BVN photo. | `hub:prisma/migrations/20261002200000_wallet_identity`, `20261002210000_selfie_match`, `wallet-opening.service.ts` header |
| Tokens on the phone | Sign-in tokens live in the phone's secure store (Keystore-backed on Android). No other personal data is stored on the phone. | `src/api/tokenStore.ts` |
| Data export | A person can ask for a copy; it is emailed as a signed, expiring link. It never includes a PIN, hash, identity number, bank account, key or provider id. | SETTINGS-04 `done` (`hub:src/data-export-request/data-export-sections.ts`); the mail needs WAWU ID's route (BACKEND_GAPS G-131), the screen is in SETTINGS-01 `todo` |
| Account deletion | R-17: 30 days, cancelled by signing in, wallet empty first. Built today: a 48-hour grace, immediate removal of content, no cancel, no empty-wallet check. A hard purge (`AccountPurgeService`) exists with a classified map of every table, but nothing calls it. | `hub:src/account/account.service.ts`, `hub:src/account-purge/account-data-map.ts`, `tasks/SETTINGS-05.md` ("What the backend serves today"), SETTINGS-06 and 08 `todo` |
| What a deletion keeps | Other people's records that name the account (their purchases, chats with this person) stay with the name scrubbed; the admin audit trail stays on purpose. **Money records:** `account-data-map.ts` marks the ledger and payment rows as deleted with the account but says "how long money records are kept after an account is deleted is the owner's call". The account at Fintava† is Fintava†'s to close. | same file |
| Law and retention | Nigerian rules on keeping KYC and transaction records after an account closes are a legal question | **OWNER DECISION** D-2, with counsel; Play requires the retention practice to be stated in the privacy policy ("Data Retention Disclosure") |

### Decisions the owner must make (not mine)

- **D-1 (owner decision):** declare Fintava† and Loma Bank† (Nuvion after the switch) as "shared" (this file's answer) or as service providers (not shared). A
  bank-account provider is not obviously "processing on your behalf". Ask counsel; declare consistently with the
  privacy policy.
- **D-2 (owner decision):** how long money and identity-check records are kept after deletion (above).
- **D-3 (owner decision):** the privacy text must be written to match this file, entered through the admin route so the app shows it
  (`PUT /admin/policies/{slug}`, BACKEND_GAPS G-140; SETTINGS-02 is `done` and shows "not available" until then), and
  published as the same text on a public web page for Play (B2 in `PLAY-LISTING.md`). It must name BVN, NIN, the selfie,
  Fintava†, Loma Bank†, Gemini if the legal chat ships, push, update checks, IP logs and the hosting outside Nigeria
  (DigitalOcean NYC and SFO regions). The wallet provider named in it changes to Nuvion when the switch lands. The web's current text says "identification information and verification data",
  "payment providers" and "analytics" but names none of these, and "conduct analytics" is untrue of the app today (no
  analytics SDK).
- **D-4 (prominent disclosure and consent):** see `PLAY-LISTING.md`, section 8b. Today no screen before BVN entry
  names what is collected, and the consent box on A5 comes after the BVN and NIN were already sent for the check.
- **D-5 (Flutterwave):** not declared here. Correct only if no launch mobile flow calls a Flutterwave route; see
  `PLAY-LISTING.md`, section 8b.

---

## 4. What is live in the phone build today versus launch

Today's build (main 794b3ed) collects: email, phone and password at sign-up; profile fields (Edit profile, ME-06 `done`,
but the phone build cannot choose a picture until `expo-image-picker`); BVN, NIN, address, occupation (KYC-05 and
KYC-03 `done`); selfie (the screen is built; no camera module); transaction PIN (KYC-04 `done`); a payout bank account
(WALLET-11 `done`). Everything else in section 2 arrives with its task. The form must describe the **launch** build, so
re-check each "Collected" cell against the build that is actually submitted.

## 5. Permissions (Android manifest), to compare against this form

Declared today in `app.json`: none by hand. What the installed packages add, read from their `AndroidManifest.xml`
in `node_modules` on 6 Oct 2026:

| Package | Permissions it adds | Play declaration? |
|---|---|---|
| `expo-local-authentication` | `USE_BIOMETRIC`, `USE_FINGERPRINT` | No (normal permissions) |
| `expo-updates` | `ACCESS_NETWORK_STATE` | No (normal) |
| `expo-image` | `INTERNET`, `ACCESS_NETWORK_STATE` | No (normal) |
| `expo-secure-store`, `expo-system-ui`, `expo-linking`, `expo-constants` | none | |
| `expo-dev-client` | development builds only | not in the store build |

`INTERNET` and `ACCESS_NETWORK_STATE` are normal permissions: they need no Play declaration and change no answer in
this form. This table is today's installed set, not the final one: React Native and the Expo modules add more, so read
the real manifest after the build (below).

Planned (SHARED-CHANGES row 8 and KYC-03 #1, `open`): `expo-camera` (CAMERA; selfie, QR scanning), `expo-notifications`
(POST_NOTIFICATIONS), `expo-image-picker`, `expo-calendar` (default plugin permissions read and write the calendar),
`expo-brightness` (raising screen brightness for a ticket QR; **LEAD CHECK** which permission its plugin adds),
`expo-document-picker`, `expo-clipboard`, a QR renderer.

**NOT VERIFIED:** I have not built a bundle, so I have not read a real manifest. After the production build, list its
permissions (Play Console, Test and release, App bundle explorer; or `bundletool dump manifest`) and make each one match
a row above. Remove any permission that has no row, and any row whose permission is missing.
