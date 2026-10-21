# Data inventory: every item that holds data about a person, and the data-safety row that declares it

Prepared by the RELEASE-01 builder on 6 Oct 2026 (round 4). This file exists so the data-safety form is complete by construction instead of by spot-checks. It lists, from the sources and not from memory:

1. every model in the Hub schema (wawu-backend `origin/main` 872cf45, `prisma/schema.prisma`, 116 models), each listed by its real name, and the models launch tasks will add that are not in the schema yet;
2. every launch-priority task (`grep -l "priority: launch" tasks/*.md`) with each input a person types, picks, uploads or signs, and each thing logged about them;
3. WAWU ID's schema and sign-up fields (wawu-id `origin/main` 4715d17), and who receives what.

The last column of every table is the row of `docs/release/DATA-SAFETY.md` that declares the item (`[PI-01]` and so on). **The exit condition is zero unmapped items**, and the totals at the end are computed from this file by the check below. Items are tied to the form by reference, so a new model, field or screen is declared only when its line here points to a row.

Sources read on 6 Oct 2026: Hub schema 116 models at 872cf45 (the check below reads this pin: Hub schema pin: `872cf45`); WAWU ID schema 14 models; mobile `tasks/*.md` on `origin/main` 6df916d merged into this branch; the Hub `account-data-map.ts`, `data-export-sections.ts`, `legal-intake-questions.ts`, `service-application`, `legal` and `common/ai` sources; the dashboard (`wawu-dashboard` `origin/main` c1dfca6) for who works legal requests. Nothing was called live.

**How to re-check** (run in a worktree of this branch; it exits non-zero and names the line if any mapping is missing, or if a `model` in the pinned Hub schema is not listed in section 1 by its real name, or section 1 lists a name the schema does not have). The Hub repo is read with `git show <pin>:prisma/schema.prisma`; set `BACKEND` if it is not at `/home/user/wawu-backend`:

```
python3 - <<'EOF'
import re, os, subprocess
inv=open("docs/release/DATA-INVENTORY.md").read(); ds=open("docs/release/DATA-SAFETY.md").read()
rows=set(re.findall(r"^\| \[([A-Z]{2}-\d\d?)\]",ds,re.M)); bad=0
for l in inv.splitlines():
    m=re.match(r"^\| I-\d+ \|.*\| ([A-Z]{2}-\d\d?(?:, [A-Z]{2}-\d\d?)*) \|$",l)
    if l.startswith("| I-") and not m: print("unmapped:",l[:80]); bad+=1
    elif m and not set(m.group(1).split(", "))<=rows: print("unknown row:",l[:80]); bad+=1
ids=re.findall(r"^\| I-(\d+) \|",inv,re.M)
if len(ids)!=len(set(ids)): print("duplicate item id"); bad+=1
pin=re.search(r"Hub schema pin: `([0-9a-f]{7,})`",inv).group(1)
repo=os.environ.get("BACKEND","/home/user/wawu-backend")
schema=subprocess.check_output(["git","-C",repo,"show",pin+":prisma/schema.prisma"],text=True)
models=set(re.findall(r"^model (\w+) ",schema,re.M))
sec1=inv.split("\n## 1. ")[1].split("\n### 1b.")[0]
listed=set(re.findall(r"^\| I-\d+ \| `(\w+)` \|",sec1,re.M))
for m in sorted(models-listed): print("model missing from section 1:",m); bad+=1
for m in sorted(listed-models): print("section 1 names a model not in the schema:",m); bad+=1
print(len(models),"models in the schema at",pin,",",len(listed),"listed in section 1")
raise SystemExit(bad)
EOF
```


Legend for "Goes to": **WP†** is the wallet provider (Fintava† with Loma Bank†, to be replaced when the Nuvion switch lands); **Resend**, **Expo**, **Google Gemini** are the service providers named in `DATA-SAFETY.md`; "Nobody outside WAWU" means no third party receives it (other app users may see it only where the cell says so). Hosting at DigitalOcean holds everything and is listed once in section 4.

---

## 1. Hub models (116 in the schema at 872cf45)

| Item | Model | Personal data in it | Written by | Goes to | Declared in |
|---|---|---|---|---|---|
| I-001 | `UserProfile` | accountType, handle, bio, avatarUrl, coverUrl, interests, social handles (instagram, whatsapp, x, tiktok, youtube, facebook, linkedin), websiteUrl, headline, company, creator and professional tick dates | AUTH-06, ME-06, ME-05, ME-12, ME-18 | Nobody outside WAWU; profile fields are public to other users | PI-03, PI-05, PI-12, PI-16, AA-02, PF-01, FI-03 |
| I-002 | `ProfileDetails` | location, skills, openTo, threadsHandle, socialOrder | ME-05, ME-06 (done) | Public on the profile | PI-12, PI-16 |
| I-003 | `ProfileExperience` | title, company, location, start and end dates, description | ME-01, ME-16 | Public on the profile | PI-16 |
| I-004 | `CreatorState` | dmPrice, dmEnabled, dmResponseHours, slotsUsed, kycStatus (legacy) | INBOX-12, ME-17 | Nobody outside WAWU | AA-09 |
| I-005 | `VerificationSubmission` | documents (uploaded identity files), tier, rejectionReason | No launch task (R-6: no manual ID review; ME-12 sells a tick with no document) | Staff review in the dashboard | NX-04 |
| I-006 | `VerificationPurchase` | priceNgn, payment reference, grantedUntil | ME-12, ME-18 | Nobody outside WAWU (the payment itself: wallet provider) | FI-03 |
| I-007 | `KycSubmission` | bvn, nin, nationalIdEquivalent, idDocumentType, idDocumentUrl, payoutBankName, payoutAccountNumber (legacy web manual KYC) | No launch task (KYC-01 to 05 store hashes and last 4 digits in WalletIdentity instead) | Staff review in the dashboard | NX-04 |
| I-008 | `ContentPiece` | title, description, category, tags, price, preview and full file urls, status | ME-04, ME-08, ME-09 | Nobody outside WAWU; previews public | AA-04, PF-02, PF-03, PF-04, FI-03 |
| I-009 | `CourseLesson` | lesson titles | ME-04 | Nobody outside WAWU | AA-04 |
| I-010 | `Comment` | text, replyToId | HOME-03 | Public under the piece | AA-04 |
| I-011 | `CommentLike` | who liked a comment | HOME-03 | Nobody outside WAWU | AA-01 |
| I-012 | `Purchase` | buyer, creator, amount, payment reference, note | HOME-12, HOME-15 | Nobody outside WAWU (payment: wallet provider) | FI-03 |
| I-013 | `SavedItem` | who saved which piece | HOME-03, ME-10 | Nobody outside WAWU | AA-01 |
| I-014 | `ContentLike` | who liked which piece | HOME-02, HOME-04 | Nobody outside WAWU | AA-01 |
| I-015 | `ContentView` | who opened which piece, per day | HOME-04 | Nobody outside WAWU | AA-01 |
| I-016 | `ContentFrame` | photo-set frame urls | ME-04 | Nobody outside WAWU; public frames | PF-01 |
| I-017 | `ContentShare` | who shared which piece, per day | HOME-03, HOME-04 | Nobody outside WAWU | AA-01 |
| I-018 | `ContentRating` | stars by a buyer | HOME-03, HOME-06 | Public as an average | AA-04 |
| I-019 | `ContentDetail` | free-preview settings (no person) | ME-04 | Nobody outside WAWU | NX-03 |
| I-020 | `ProfileView` | who viewed which profile, per day | ME-02, HOME-05 | Nobody outside WAWU | AA-01 |
| I-021 | `FollowRelationship` | who follows whom | AUTH-06, ME-02, HOME-07 | Nobody outside WAWU; counts public | AA-01 |
| I-022 | `DirectMessage` | paid question text, amount, status, refund fields | INBOX-10, INBOX-17 | The creator asked | MS-01, FI-03 |
| I-023 | `DmReply` | creator reply text | INBOX-18 | The fan who asked | MS-01 |
| I-024 | `CreatorNoResponseTracker` | unanswered paid-question rate, pause date | INBOX-09 (done) | Nobody outside WAWU | AA-09 |
| I-025 | `DmReport` | reporter id, thread id | INBOX-08 (done) | Staff moderation | AA-01 |
| I-026 | `Community` | name, description, imageUrl, host | INBOX-14 | Public (open) or members (private) | AA-04, PF-01 |
| I-027 | `CommunityLink` | share slug (no person) | INBOX-01 (done), INBOX-14 | Nobody outside WAWU | NX-03 |
| I-028 | `CommunityReadMarker` | how far a person has read a community | INBOX-05 | Nobody outside WAWU | AA-01 |
| I-029 | `CommunityMembership` | membership status, requested and joined times | INBOX-14, INBOX-01 | Host sees the request (name, headline, city) | AA-12 |
| I-030 | `CommunityMessage` | text, imageUrl, credits spent | INBOX-05 | Community members | MS-01, PF-01 |
| I-031 | `CreditsState` | credit balance (a count), trial end (retired) | INBOX-13, INBOX-16 | Nobody outside WAWU | FI-03 |
| I-032 | `CreditPurchase` | pack, credits, amount, payment reference | INBOX-13, INBOX-16 | Nobody outside WAWU (payment: wallet provider) | FI-03 |
| I-033 | `CreditSpend` | credits spent per community | INBOX-05 | Nobody outside WAWU; the host earns a share | FI-03 |
| I-034 | `CreditLot` | credits granted and left, kobo allocation | INBOX-16 | Nobody outside WAWU | FI-03 |
| I-035 | `CreditSpendEarning` | host share and platform share per spend | INBOX-05, WALLET-17 | The host sees earnings | FI-03 |
| I-036 | `PendingCharge` | payment attempt context (kind, expected amount, json) | MONEY-17 and the money paths | Nobody outside WAWU (payment: wallet provider) | FI-04 |
| I-037 | `EvgScore` | derived creator score | No launch screen shows it (R-18); a derived row | Nobody outside WAWU | AA-09 |
| I-038 | `Notification` | title, body, amount, action link, read flag | Every sender (INBOX-03, WALLET-10, SETTINGS-07) | Phone push goes through Expo (AA-07) | AA-09, AA-07 |
| I-039 | `NotificationSettings` | per-account notification switches | SETTINGS-01, SETTINGS-07 (done) | Nobody outside WAWU | AA-09 |
| I-040 | `NotificationCampaign` | campaign title, body, audience, staff email | Staff only (dashboard) | Nobody outside WAWU | NX-01 |
| I-041 | `AdminNotificationAudit` | staff email, action, reason | Staff only (dashboard) | Nobody outside WAWU | NX-02 |
| I-042 | `PartnerService` | service catalogue text, partner label (no person) | Staff only | Nobody outside WAWU | NX-03 |
| I-043 | `ServiceApplication` | applicant, registration type, proposed names, nature, documents, reference, timeline, rejection note | LEGAL-06 (business-name registration, S26); web CAC flow | Whoever files at CAC (LEAD CHECK PI-20) | PI-20, PF-04, PF-01 |
| I-044 | `Mentor` | mentor name, handle, bio, field (a public person, no launch task) | No launch task | Nobody outside WAWU | NX-04 |
| I-045 | `MentorRequest` | requester id, topics, note, slot | No launch task | Nobody outside WAWU | NX-04 |
| I-046 | `LearnCourse` | catalogue (no person) | Staff only | Nobody outside WAWU | NX-03 |
| I-047 | `CourseEnrollment` | user, course, progress (old learn-course enrolment) | No launch task (SCHOOLS-07 and SCHOOLS-08 never read it) | Nobody outside WAWU | NX-04 |
| I-048 | `Playbook` | title, author name, chapters (catalogue) | Staff only | Nobody outside WAWU | NX-03 |
| I-049 | `LearnGuide` | guide text (catalogue) | Staff only | Nobody outside WAWU | NX-03 |
| I-050 | `MarketplaceSave` | user, product, shop (Shop retired, R-2) | No launch task | Nobody outside WAWU | NX-04 |
| I-051 | `PrivacySettings` | privacy switches | SETTINGS-01, SETTINGS-04 (done) | Nobody outside WAWU | AA-09 |
| I-052 | `BlockedAccount` | who blocked whom | ME-02, SETTINGS-01, SETTINGS-04 (done) | Nobody outside WAWU | AA-01 |
| I-053 | `DataExportRequest` | user, status, time | SETTINGS-01, SETTINGS-04 (done) | The export is emailed (Resend) | HK-04, PI-02 |
| I-054 | `BillPayment` | biller, customer reference (meter, smartcard, phone), amount, fee, provider reference | BILLS-04 (on hold) | Wallet provider and the biller, only if bills ship | FI-05 |
| I-055 | `HealthSubscription` | first and last name, phone, gender, date of birth, email, policy number (web health plans) | No launch task | Nobody outside WAWU | NX-04 |
| I-056 | `LegalRequest` | service, details (json), documents, medium, date and time booked, consultation notes, quote, contract text, typed signature name, signed time and IP, deliverable url, cancellation reason | LEGAL-02, 03, 04, 05, 06 | WAWU Legal consultant (LEAD CHECK PI-17); filer for CAC (PI-20) | PI-17, PI-18, PI-19, PI-20, PF-04, AA-13, FI-03 |
| I-057 | `AdminUser` | staff email, name, password hash, role | Staff only | Nobody outside WAWU | NX-01 |
| I-058 | `AdminContentReview` | creator id, decision, reason, staff email | Staff only | Nobody outside WAWU | NX-02 |
| I-059 | `AdminKycAudit` | subject id, action, reason, staff email | Staff only | Nobody outside WAWU | NX-02 |
| I-060 | `AdminVerificationAudit` | subject id, tier, action, reason, staff email | Staff only | Nobody outside WAWU | NX-02 |
| I-061 | `PaymentWebhookReceipt` | Flutterwave webhook payload (web payments) | No launch task (web Flutterwave flows; D-5) | Nobody outside WAWU | NX-04 |
| I-062 | `AdminOpsAudit` | subject id, action, detail, staff email | Staff only | Nobody outside WAWU | NX-02 |
| I-063 | `Event` | name, description, host organisation, format, times, location, street address, venue, external url, banner, contactEmail, contactPhone, cancel reason | EVENTS-04, EVENTS-08 | Public on the event | PI-15, AA-04, PF-01 |
| I-064 | `EventSpeaker` | speaker name, title, photo | No launch artboard draws speakers (E13 to E16) | Nobody outside WAWU | NX-04 |
| I-065 | `EventGoing` | who is going | EVENTS-01 | Nobody outside WAWU | AA-01 |
| I-066 | `EventSave` | who saved an event | ME-10 | Nobody outside WAWU | AA-01 |
| I-067 | `AdminEventReview` | host id, action, reason, staff email | Staff only | Nobody outside WAWU | NX-02 |
| I-068 | `ProfessionalProfile` | category, headline, about, services, credential kind, licence number, issuing body, documents, review status | PROS-03 | The issuing body checks the licence (LEAD CHECK PI-14); public once listed | PI-14, PF-04, AA-04 |
| I-069 | `ProfessionalReview` | stars, review text | PROS-01 (done, backend) | Public on the profile | AA-04 |
| I-070 | `LegalIntake` | matter, answers (json), documents, brief (json) | LEGAL-01, LEGAL-02 | Google Gemini (text only) and the consultant | PI-17, PF-04 |
| I-071 | `LegalChatMessage` | chat text with the assistant and the consultant | LEGAL-01, LEGAL-02 | Google Gemini (assistant replies) and the consultant | MS-01, PI-17 |
| I-072 | `EventTicketType` | tier, name, price, quantity (no person) | EVENTS-04 | Nobody outside WAWU | NX-03 |
| I-073 | `EventOrder` | buyer, quantity, amount, payment reference, referral code, refund fields | EVENTS-06, EVENTS-07 | Nobody outside WAWU (payment: wallet provider) | FI-03 |
| I-074 | `EventTicket` | code, status, check-in time and who checked in (holder name is the buyer) | EVENTS-06, EVENTS-09 | Door staff see the holder name at check-in | AA-01, PI-01 |
| I-075 | `EventReferral` | referral code, label, owner | EVENTS-08 | Nobody outside WAWU | AA-04 |
| I-076 | `Product` | shop product (Shop retired) | No launch task | Nobody outside WAWU | NX-03 |
| I-077 | `CartItem` | user, product, quantity (Shop retired) | No launch task | Nobody outside WAWU | NX-04 |
| I-078 | `ShopOrder` | delivery name, phone, address, city, state, note (Shop retired, past orders stay readable) | No launch task (OPS-08 retires it) | Nobody outside WAWU | NX-04 |
| I-079 | `ShopOrderItem` | items of a past order | No launch task | Nobody outside WAWU | NX-04 |
| I-080 | `StorageObject` | upload key, size, content type, folder, status per user | Every upload (ME-04, ME-06, INBOX-19, LEGAL, PROS-03) | Hosted at DigitalOcean Spaces | PF-01, PF-02, PF-03, PF-04 |
| I-081 | `DittoOptIn` | user, opt-in time (a partner flag) | No launch task | Nobody outside WAWU | NX-04 |
| I-082 | `PlatformSettings` | prices and flags (no person) | Staff only | Nobody outside WAWU | NX-03 |
| I-083 | `CreatorWallet` | web wallet pointer (Flutterwave era) | No launch task (R-6: wallets open through KYC-05 and MONEY-12) | Nobody outside WAWU | NX-04 |
| I-084 | `WalletLedgerEntry` | web wallet ledger (Flutterwave era) | No launch task | Nobody outside WAWU | NX-04 |
| I-085 | `WalletWithdrawal` | bank code, account number, account name (web withdrawals) | No launch task | Nobody outside WAWU | NX-04 |
| I-086 | `TransactionPin` | PIN hash, failed tries, lock time | KYC-04, WALLET-06 | Nobody outside WAWU | FI-04 |
| I-087 | `TransactionPinReset` | phone, code hash, tries, times | WALLET-06 (MONEY-14 done) | Until the wallet rebuild moves PIN-reset codes to email (R-39): the code is texted through the wallet provider† | FI-04, PI-07 |
| I-088 | `ApprovalDevice` | deviceId, publicKey, biometric label, last used | WALLET-06 (MONEY-14 done) | Nobody outside WAWU | AA-08 |
| I-089 | `ApprovalChallenge` | deviceId, one-time challenge | MONEY-02, MONEY-14 | Nobody outside WAWU | AA-08 |
| I-090 | `FintavaWallet` | customerId, walletId, account number, account name | KYC-04, MONEY-12 | Held by the wallet provider | FI-04 |
| I-091 | `FintavaWalletOpening` | state, BVN keyed hash, verified phone, attempts | KYC-05, MONEY-12 | Wallet provider (the opening) | PI-13, PI-07 |
| I-092 | `FintavaWebhookEvent` | provider webhook payload and raw body (names, account numbers, amounts); a handled delivery's body is cleared after 90 days (FIX-20) | MONEY-07 (done) | Received from the wallet provider | FI-04 |
| I-093 | `WalletIdentity` | BVN and NIN keyed hashes and last 4, verified phone, occupation, BVN name keys | KYC-01, KYC-05 | Nobody outside WAWU (the numbers themselves go to the wallet provider and are not kept) | PI-13, PI-12, PI-07 |
| I-094 | `BvnCheckAttempt` | outcome and time of each BVN check | KYC-05 | Nobody outside WAWU | PI-13 |
| I-095 | `SelfieMatchAttempt` | outcome, confidence, time (never the image) | KYC-02 (done) | Nobody outside WAWU (the selfie itself goes to the wallet provider) | PF-01 |
| I-096 | `ChatConversation` | the two participants | INBOX-06 (done) | Nobody outside WAWU | MS-01 |
| I-097 | `ChatParticipant` | read position per chat | INBOX-06, INBOX-04 | Nobody outside WAWU | MS-01, AA-01 |
| I-098 | `ChatMessage` | text, attachment key, type, size, name | INBOX-06, INBOX-19 | The other person in the chat | MS-01, PF-01, PF-02, PF-04 |
| I-099 | `FintavaLedgerEntry` | amounts, counterparty name, bank, account number, notes, narration, references | MONEY-10, WALLET-02, 03, 09 | Wallet provider for the movement itself (note text: LEAD CHECK FI-04) | FI-04 |
| I-100 | `FintavaLedgerReference` | reference values for a ledger row | MONEY-10 | Nobody outside WAWU | FI-04 |
| I-101 | `MoneyReceipt` | receipt share code per ledger row | WALLET-04 (WALLET-18 done) | Anyone the person shares the code with | FI-04 |
| I-102 | `MoneyBeneficiary` | saved recipient: kind, bank, account number, account name, recipient id | WALLET-02, 09, 14 (done) | Nobody outside WAWU | FI-01 |
| I-103 | `MoneyPayoutAccount` | bank, account number, account name | WALLET-11 (done) | Nobody outside WAWU (name lookup: wallet provider) | FI-01 |
| I-104 | `School` | name, city, about, applyUrl, reportEmail (a school, not an app user) | SCHOOLS-02 (staff) | Nobody outside WAWU | NX-03 |
| I-105 | `SchoolCourse` | title, weeks, mode, syllabus, price (catalogue) | SCHOOLS-02 (staff) | Nobody outside WAWU | NX-03 |
| I-106 | `CourseIntake` | start date, capacity, seats taken (no person) | SCHOOLS-02, SCHOOLS-07 | Nobody outside WAWU | NX-03 |
| I-107 | `LegalDocument` | terms and privacy text (no person) | Staff only (admin route) | Nobody outside WAWU | NX-03 |
| I-111 | `AdCampaign` | advertiser (a business name as the card shows it; advertisers have no accounts, R-15), placement, status, window, weight | ADS-02, 03, 06 (staff) | Nobody outside WAWU | NX-03 |
| I-412 | `AdCreative` | headline, subline, button label, destination (an event id), artwork url: the card's copy, no person | ADS-02, 03, 04, 06 (staff) | Nobody outside WAWU; shown to everyone as the sponsored card | NX-03 |
| I-112 | `TgifReaction` | userWawuId, day, card, kind (an Amen), one per person per card per day | HOME-09, 10 | Nobody outside WAWU | AA-11 |
| I-413 | `TgifRead` | userWawuId, day (a read), one per person per day | HOME-09, 10 | Nobody outside WAWU | AA-11 |
| I-414 | `TgifShare` | userWawuId, day (a share tap), one per person per day | HOME-09, 10 | Nobody outside WAWU | AA-11 |
| I-113 | `TgifPreference` | userWawuId, show (the TGIF each morning switch, Z2) | HOME-11, SETTINGS-01 | Nobody outside WAWU | AA-09 |
| I-119 | `ProfileWork` | featured work: title, role, client, year, link, category, description, media, position | ME-11, ME-16 | Public on the profile | PI-16, PF-01, PF-02 |
| I-415 | `ProfileEducation` | school, field, start and end year | ME-02, ME-16 | Public on the profile | PI-16 |
| I-416 | `FeaturedCreator` | the featured creator's account id, position in Explore, and `featuredByAdminId` (the staff member who chose them): a staff placement about a person, deleted with the creator's account (`OWNED` in `account-data-map.ts`) and left out of the data export (`EXPORT_EXCLUDED`) | EXPLORE-03 (staff, from the dashboard) | Nobody outside WAWU; the creator appears in Explore, where the profile is public anyway | NX-02 |

Rows I-111, I-112, I-113, I-119 and I-412 to I-416 are the nine models train 1 added to the schema (merge train 1, backend PR #71, 872cf45: ADS-03, HOME-10, HOME-11, ME-16, EXPLORE-03). Four of them were listed as planned in an earlier round under approximate names and keep their item ids; the new item ids are numbered after the last one in the file. `ChatParticipant` also gained `readAt` (INBOX-02, the read mark): it is the read position already declared at I-097.

"No launch task" means no launch-priority task or artboard writes the model: it is accounted for at NX-04 or NX-03 rather than declared as collected by the app. The **LEAD CHECK** that keeps NX-04 honest is on that row: after the build, search `src/` for the routes that write these tables.

### 1b. Models launch tasks will add (checked against the 872cf45 schema: none of these is in it)

| Item | Model or field set | Personal data in it | Written by | Goes to | Declared in |
|---|---|---|---|---|---|
| I-108 | SchoolEnrollment (SCHOOLS-07, SCHOOLS-09) | user, course, intake, fee, consent time; the school is emailed name, email, phone, course, intake | SCHOOLS-06, 07, 09 | The school (by email through Resend) | PI-08, FI-03 |
| I-109 | SchoolLinkClick (SCHOOLS-10) | user, course, time of a click on the school link | SCHOOLS-08, 10 | The school sees only a per-school code | AA-10 |
| I-110 | AdEvent (ADS-05) | user, placement, day of a sponsored-card view, tap or skip | ADS-01, ADS-05 | Advertisers get daily totals only | AA-05 |
| I-114 | MoneyRequest (INBOX-15) | requester, payer, amount, note, status | INBOX-15, INBOX-20 | The other person in the chat | FI-04, MS-01 |
| I-115 | BillReminder (BILLS-06) | bill name, meter or customer number, usual amount, due day, remind offset, paid mark | BILLS-05, 06 (on hold) | Nobody outside WAWU; push through Expo | FI-08, AA-07 |
| I-116 | Recent searches and popular searches (EXPLORE-05) | typed search text per user, counted queries from everyone | EXPLORE-02, 04, 05, SCHOOLS-04 | Nobody outside WAWU | AA-03 |
| I-117 | Device push token (INBOX-03) | Expo push token per phone | INBOX-03, INBOX-21 | Expo push service and Google FCM | AA-07 |
| I-118 | Support thread (SUPPORT-01) | typed messages with WAWU plus a payment or piece reference | SUPPORT-01 | WAWU staff | MS-01 |
| I-120 | Door staff list (EVENTS-05) | other accounts a host picks to check tickets | EVENTS-05, EVENTS-09 | Door staff see holder names at check-in | PI-03, PI-01 |
| I-121 | Account deletion record and reason (SETTINGS-05, 06, 08) | deletion time, freeze, optional reason | SETTINGS-05, 06, 08 | The wallet provider is told to freeze the wallet | PI-21, HK-05 |

---

## 2. Launch tasks: what the person types, picks, uploads or signs, and what is logged

183 files carry `priority: launch`: 182 tasks and `TEMPLATE.md`, the template. Status on mobile `origin/main` 6df916d merged, 6 Oct 2026: of the 182 tasks, 71 `done` (RELEASE-01 included) and 111 `todo`. Each task appears at least once; a task with no input of its own says why. Kinds: typed, picked, uploaded, signed, captured (camera), device (stays on the phone), received (comes back to the person), logged, none.

| Item | Task | Artboards | Kind | What | Goes to | Declared in |
|---|---|---|---|---|---|---|
| I-122 | ADS-01 | H33 | logged | A view, tap or skip of the TGIF sponsored card (user, card, day) | Advertisers get daily totals only | AA-05 |
| I-123 | ADS-02 | none | none | Staff screens that book and report ads (advertiser data, no app user) | Nobody outside WAWU | NX-03 |
| I-124 | ADS-03 | none | none | Campaign and creative tables: advertiser name and copy, no person | Nobody outside WAWU | NX-03 |
| I-125 | ADS-04 | none | none | Serves the live card for a placement; reads only | Nobody outside WAWU | NX-03 |
| I-126 | ADS-05 | none | logged | POST impression, tap, skip: user, placement and day, one view per person per day | Advertisers get daily totals only | AA-05 |
| I-127 | ADS-06 | none | none | Admin endpoints for campaigns (staff) | Nobody outside WAWU | NX-01 |
| I-128 | AUTH-01 | A22 A23 A24 A25 | typed | A22 email or phone and password | Hashed at WAWU ID; the reset email goes through Resend | PI-02, PI-04 |
| I-129 | AUTH-01 | A22 A23 A24 A25 | typed | A23 email for a reset link (A24 shows it) | Resend sends the link | PI-02 |
| I-130 | AUTH-01 | A22 A23 A24 A25 | logged | Refresh token (hash) and the request IP in rate-limit counters | WAWU ID | PI-04, AP-02 |
| I-131 | AUTH-02 | A1 A2 | picked | A2 discover or earn (account type) | Nobody outside WAWU | PI-05 |
| I-132 | AUTH-03 | none | typed | A4 six-digit phone code, and the phone it was sent to | Until AUTH-07 ships (R-39): the code is texted through the wallet provider†; after it the sign-up code goes by email | PI-07 |
| I-133 | AUTH-03 | none | logged | Phone verified time, wrong-try counters per phone | WAWU ID | PI-07, AP-02 |
| I-134 | AUTH-04 | A3 A4 A15 | typed | A3 email, phone number, password | Phone: until AUTH-07 ships (R-39) a text code through the wallet provider†; email: Resend | PI-02, PI-07, PI-04 |
| I-135 | AUTH-04 | A3 A4 A15 | typed | A4 and A15 the code, resent on request | Until AUTH-07 ships (R-39): wallet provider† (SMS); after it, Resend (email code) | PI-07, PI-02 |
| I-417 | AUTH-04 | A3 A4 A15 | device | The sign-up waiting for its code, kept in the phone's secure store under `wawu.signup.phone` (the phone number being verified) and `wawu.signup.attempt` (the attempt secret `POST /auth/signup` returned) so quitting between A3 and A4 does not lose it; cleared on confirm, on a new sign-up and on sign-in (`src/features/auth/signupStore.ts`). The browser build keeps both in `sessionStorage`, for the tab only | Nobody outside WAWU | HK-03, PI-07, NX-05 |
| I-136 | AUTH-05 | none | typed | The email code that proves the email (or skip) | Resend sends the code | PI-02 |
| I-137 | AUTH-05 | none | logged | Sign-up steps done and when (email, creator setup, interests, follows) | WAWU ID | AA-09 |
| I-138 | AUTH-06 | A11 A12 A13 | picked | A11 checklist taps (open paid messages, profile, first piece, wallet) | Nobody outside WAWU | AA-09 |
| I-139 | AUTH-06 | A11 A12 A13 | picked | A12 three or more of 12 interests | Nobody outside WAWU; shown on the profile | AA-02 |
| I-140 | AUTH-06 | A11 A12 A13 | picked | A13 follow and unfollow suggested creators | Nobody outside WAWU | AA-01 |
| I-141 | BILLS-01 | S2 S3 S4 S10 S13 | picked | S3 a biller; S2 a recent bill | Biller via the wallet provider† (only if bills ship) | FI-05 |
| I-142 | BILLS-01 | S2 S3 S4 S10 S13 | typed | S4 meter number and amount; the holder name and address returned and shown back | Wallet provider† and the biller (only if bills ship) | FI-05 |
| I-143 | BILLS-01 | S2 S3 S4 S10 S13 | logged | BillPayment: biller, meter or customer reference, amount | Hub (only if bills ship) | FI-05 |
| I-144 | BILLS-02 | S5 S6 S7 S11 S12 | typed | S6 PIN to approve (hash compared at the Hub) | Nobody outside WAWU | FI-04 |
| I-145 | BILLS-02 | S5 S6 S7 S11 S12 | received | S7 the prepaid token and units; Copy token to the clipboard; Share receipt | The phone (clipboard, share sheet) | FI-05, NX-05 |
| I-146 | BILLS-03 | S8 S9 | typed | S8 phone number (may be another person's) and amount; picked network, data bundle | Wallet provider† and the network (only if bills ship) | FI-05, PI-07 |
| I-147 | BILLS-03 | S8 S9 | typed | S9 cable smartcard number; picked package | Wallet provider† and the cable company (only if bills ship) | FI-05 |
| I-148 | BILLS-04 | none | logged | BillPayment rows, the two-step debit, a failure reversal | Wallet provider† (only if bills ship) | FI-05 |
| I-149 | BILLS-05 | S27 S28 S29 S30 S31 S32 | typed | S28 bill name, usual amount, due day; S31 an off-WAWU bill (name, amount, due date); picked remind offset; Mark as paid | Nobody outside WAWU | FI-08 |
| I-150 | BILLS-05 | S27 S28 S29 S30 S31 S32 | logged | S29 reminder push 3 days before | Expo push | FI-08, AA-07 |
| I-151 | BILLS-06 | none | logged | BillReminder rows and a daily reminder job | Expo push | FI-08, AA-07 |
| I-152 | CHECK-0 | none | none | A checkpoint: an audit, no screen or field of its own (CHECK-2 makes small real payments with staff accounts) | Nobody outside WAWU | NX-01 |
| I-153 | CHECK-1 | none | none | A checkpoint: an audit, no screen or field of its own (CHECK-2 makes small real payments with staff accounts) | Nobody outside WAWU | NX-01 |
| I-154 | CHECK-2 | none | none | A checkpoint: an audit, no screen or field of its own (CHECK-2 makes small real payments with staff accounts) | Nobody outside WAWU | NX-01 |
| I-155 | CHECK-3 | none | none | A checkpoint: an audit, no screen or field of its own (CHECK-2 makes small real payments with staff accounts) | Nobody outside WAWU | NX-01 |
| I-156 | EVENTS-01 | E1 E2 E8 E9 | picked | E8 filters; E2 ticket tier and quantity | Nobody outside WAWU | AA-01 |
| I-157 | EVENTS-01 | E1 E2 E8 E9 | picked | E1 and E2 Going toggle | Nobody outside WAWU | AA-01 |
| I-158 | EVENTS-02 | none | none | Backend: hybrid format, kinds, ticket types in one submit, no new person field | Nobody outside WAWU | AA-04 |
| I-159 | EVENTS-03 | E6 E7 E12 | device | E7 ticket QR and code on screen; brightness raised while it shows | Nobody outside WAWU | AA-01, NX-05 |
| I-160 | EVENTS-03 | E6 E7 E12 | logged | E12 check-in time shown to the holder | Hub | AA-01 |
| I-161 | EVENTS-04 | E13 E14 E15 E16 E21 E22 | typed | E13 event name, description, who is running it; picked format | Public on the event; staff review it before it goes live | AA-04 |
| I-162 | EVENTS-04 | E13 E14 E15 E16 E21 E22 | typed | E14 start and end, street address; picked category | Public on the event | PI-15, AA-04 |
| I-163 | EVENTS-04 | E13 E14 E15 E16 E21 E22 | uploaded | E14 banner image | Hosted at DigitalOcean; public on the event | PF-01 |
| I-164 | EVENTS-04 | E13 E14 E15 E16 E21 E22 | typed | E15 ticket types (name, price, quantity) | Public on the event | AA-04 |
| I-165 | EVENTS-05 | none | picked | Door staff a host adds; check-in returns the holder name | Door staff | PI-03, PI-01 |
| I-166 | EVENTS-05 | none | logged | Check-in time and who checked in; referral counts | Hub | AA-01 |
| I-167 | EVENTS-06 | E3 E4 E5 E10 | typed | E4 PIN to approve a ticket purchase | Nobody outside WAWU | FI-04 |
| I-168 | EVENTS-06 | E3 E4 E5 E10 | logged | EventOrder and tickets with the buyer name as holder | Hub | FI-03, PI-01 |
| I-169 | EVENTS-06 | E3 E4 E5 E10 | device | E5 Add to calendar writes locally | Nobody outside WAWU | CL-01 |
| I-170 | EVENTS-07 | none | logged | Backend: orders, basket lines, a zero-naira ticket needs no debit | Hub | FI-03 |
| I-171 | EVENTS-08 | E17 E18 E25 E11 | typed | E25 the reason an event is called off | Shown to ticket buyers | AA-04 |
| I-172 | EVENTS-08 | E17 E18 E25 E11 | logged | Refunds to every buyer | Wallet provider† | FI-03 |
| I-173 | EVENTS-09 | E19 E20 E23 E24 | captured | E19 camera scans a ticket QR (no image kept); or types the code instead | Hub checks the code | AA-01, NX-05 |
| I-174 | EVENTS-09 | E19 E20 E23 E24 | logged | Check-in time and door | Hub | AA-01 |
| I-175 | EVENTS-10 | none | logged | Refund of each ticket price to the buyer's wallet | Wallet provider† | FI-03, FI-04 |
| I-176 | EXPLORE-01 | X1 X15 X2 X3 X13 X14 | picked | X1 to X3 category chips and Follow taps | Nobody outside WAWU | AA-01 |
| I-177 | EXPLORE-02 | X4 X5 X6 X7 | typed | X5 and X6 search text; recent searches kept, Clear removes them | Nobody outside WAWU | AA-03 |
| I-178 | EXPLORE-03 | none | none | Backend: taxonomy filter and the staff-set featured list (`FeaturedCreator`: creator, position, the featuring admin's id; I-416) | Nobody outside WAWU | NX-02, NX-03 |
| I-179 | EXPLORE-04 | X8 X9 X10 X11 X12 | typed | X6 to X12 search text across creators, communities, content | Nobody outside WAWU | AA-03 |
| I-180 | EXPLORE-04 | X8 X9 X10 X11 X12 | picked | Follow and Join taps | Nobody outside WAWU | AA-01, AA-12 |
| I-181 | EXPLORE-05 | none | logged | Recent searches saved per account; real queries counted for popular searches | Nobody outside WAWU | AA-03 |
| I-182 | FIX-01 | none | none | A backend or test fix with no new person data | Nobody outside WAWU | NX-03 |
| I-183 | FIX-02 | none | none | A backend or test fix with no new person data | Nobody outside WAWU | NX-03 |
| I-184 | FIX-03 | none | none | A backend or test fix with no new person data | Nobody outside WAWU | NX-03 |
| I-185 | FIX-04 | none | device | App query cache cleared when the session changes (no data leaves the phone) | Nobody outside WAWU | NX-05 |
| I-186 | FIX-05 | none | none | A backend or test fix with no new person data | Nobody outside WAWU | NX-03 |
| I-187 | HOME-01 | H1 H11 H36 | picked | H1 Follow taps; H36 TGIF off | Nobody outside WAWU | AA-01, AA-09 |
| I-188 | HOME-02 | H2 H3 H4 H5 H6 | logged | H2 to H6 a piece opened (one view per day), liked | Nobody outside WAWU | AA-01 |
| I-189 | HOME-03 | H19 H20 H21 H22 H23 | typed | H21 a comment or reply | Nobody outside WAWU; public under the piece | AA-04 |
| I-190 | HOME-03 | H19 H20 H21 H22 H23 | picked | H23 a star rating (buyers only); Save, Share, Follow | Nobody outside WAWU | AA-04, AA-01 |
| I-191 | HOME-03 | H19 H20 H21 H22 H23 | device | H22 share sheet (link wawu/c/...) | The app the person picks | NX-05 |
| I-192 | HOME-04 | none | logged | Likes, views, shares recorded per viewer; liked and saved flags | Nobody outside WAWU | AA-01 |
| I-193 | HOME-05 | none | none | Backend: feed cards and media details, no new person field | Nobody outside WAWU | AA-01 |
| I-194 | HOME-06 | none | logged | Ratings only from buyers, once each; counts | Nobody outside WAWU | AA-04 |
| I-195 | HOME-07 | H7 H8 H9 H10 H12 H13 | picked | H9, H10, H12 Follow and Message taps | Nobody outside WAWU | AA-01 |
| I-196 | HOME-08 | H24 H25 | picked | H24 and H25 open, Follow, Unlock | Nobody outside WAWU | AA-01 |
| I-197 | HOME-09 | H29 H30 H31 H32 H34 H35 | picked | H29 to H34 Amen, Tap to continue, Share, Done | Nobody outside WAWU | AA-11 |
| I-198 | HOME-09 | H29 H30 H31 H32 H34 H35 | device | H35 share the verse image (share sheet, Save) | The app the person picks | AA-11, NX-05 |
| I-199 | HOME-10 | none | logged | TgifReaction, TgifRead and share counts per day | Nobody outside WAWU | AA-11 |
| I-200 | HOME-11 | none | picked | TGIF each morning switch kept on the account | Nobody outside WAWU | AA-09 |
| I-201 | HOME-12 | H14 H15 H16 H17 H18 | typed | H15 PIN to approve an unlock | Nobody outside WAWU | FI-04 |
| I-202 | HOME-12 | H14 H15 H16 H17 H18 | logged | Purchase and ledger row | Nobody outside WAWU (wallet provider† moves the money) | FI-03, FI-04 |
| I-203 | HOME-13 | H26 H27 H28 | typed | H26 tip amount and an optional note; H27 PIN | The creator sees the name and note; wallet provider† moves the money | FI-04, MS-01 |
| I-204 | HOME-14 | none | logged | Backend: tip debit, creator share lands in the creator wallet | Wallet provider† | FI-03, FI-04 |
| I-205 | HOME-15 | none | logged | Backend: unlock debit, access granted after settlement | Wallet provider† | FI-03, FI-04 |
| I-206 | INBOX-01 | none | logged | Communities list, last message, unread, join decisions | Nobody outside WAWU | AA-12, AA-01 |
| I-207 | INBOX-02 | none | logged | A live connection per phone (the request IP in logs); messages and read receipts pushed | Nobody outside WAWU | AP-02, MS-01 |
| I-208 | INBOX-03 | none | logged | Expo push token registered per phone and removed on sign-out | Expo push service and Google FCM | AA-07 |
| I-209 | INBOX-04 | I1 I35 I36 | logged | Read state and unread counts for the list | Nobody outside WAWU | MS-01 |
| I-210 | INBOX-05 | I24 I25 I26 | typed | I25 and I26 a community message (1 credit each) | Community members | MS-01, FI-03 |
| I-211 | INBOX-06 | none | typed | Chat text between two users | The other person | MS-01 |
| I-212 | INBOX-06 | none | uploaded | Photos and files in a chat | The other person; hosted at DigitalOcean | PF-01, PF-04 |
| I-213 | INBOX-06 | none | logged | Read position; blocks enforced | Nobody outside WAWU | MS-01, AA-01 |
| I-214 | INBOX-07 | none | none | One inbox feed with unread counts (reads existing rows) | Nobody outside WAWU | MS-01 |
| I-215 | INBOX-08 | none | logged | Paid DM threads and the creator queue | Nobody outside WAWU | MS-01 |
| I-216 | INBOX-09 | none | logged | Unanswered paid-question rate over 30 days and a 7-day pause | Nobody outside WAWU | AA-09 |
| I-217 | INBOX-10 | I2 I3 I4 I5 | typed | I3 a paid question; PIN | The creator asked; wallet provider† moves the money | MS-01, FI-03 |
| I-218 | INBOX-11 | I6 I7 I8 | none | Not-enough-money, refunded and messages-off states (no new field) | Nobody outside WAWU | FI-03 |
| I-219 | INBOX-12 | I21 I22 I23 | picked | I21 paid messages on or off, price, reply window | Nobody outside WAWU | AA-09 |
| I-220 | INBOX-13 | I27 I28 I29 | picked | I28 a credit pack; PIN | Wallet provider† moves the money | FI-03 |
| I-221 | INBOX-14 | I30 I31 I37 I32 I33 I34 | picked | I30 and I31 Ask to join, Cancel request; I34 host Approve or Decline | The host sees name, headline and city | AA-12 |
| I-222 | INBOX-14 | I30 I31 I37 I32 I33 I34 | typed | I32 community name and what it is for; picked Open or Private | Public or members | AA-04 |
| I-223 | INBOX-14 | I30 I31 I37 I32 I33 I34 | uploaded | I32 community picture | Hosted at DigitalOcean | PF-01 |
| I-224 | INBOX-15 | none | typed | Money request amount and note written into the chat | The other person | FI-04, MS-01 |
| I-225 | INBOX-16 | none | logged | Credits purchase debit, lots, 85/15 split | Wallet provider† | FI-03 |
| I-226 | INBOX-17 | none | logged | Paid-question hold, release and refund | Wallet provider† | FI-03 |
| I-227 | INBOX-18 | I9 I10 I11 | typed | I10 a reply to a paid question | The fan who asked | MS-01 |
| I-228 | INBOX-19 | I12 I13 I14 I15 | typed | I12 chat text; I14 send amount and note; PIN | The other person; wallet provider† moves the money | MS-01, FI-04 |
| I-229 | INBOX-19 | I12 I13 I14 I15 | uploaded | I13 a photo or video; a PDF up to 20 MB | The other person; hosted at DigitalOcean | PF-01, PF-02, PF-04 |
| I-230 | INBOX-20 | I16 I17 I18 I19 I20 | typed | I16 request amount and what it is for; I18 pay or decline; PIN | The other person; wallet provider† moves the money | FI-04, MS-01 |
| I-231 | INBOX-21 | none | picked | Notification permission ask on the phone; token registered; a tap opens the target screen | Expo push service and Google FCM | AA-07 |
| I-232 | KYC-01 | none | typed | A5 occupation (kept); BVN lookup returns name, date of birth, phone, gender and photo | Wallet provider† | PI-13, PI-12, PI-01 |
| I-233 | KYC-02 | none | captured | A6 selfie from the camera, matched to the BVN photo | Wallet provider† (never stored) | PF-01 |
| I-234 | KYC-02 | none | logged | Outcome, confidence, time of each match (never the image) | Hub | PF-01 |
| I-235 | KYC-03 | A5 A6 A7 A16 | typed | A5 home address (street, city or town, state) and occupation; ticked the terms box | Address to the wallet provider† once, not stored | PI-06, PI-12 |
| I-236 | KYC-03 | A5 A6 A7 A16 | captured | A6 camera permission | Wallet provider† | PF-01 |
| I-237 | KYC-04 | A8 A9 A10 | typed | A9 and A10 transaction PIN twice (stored as a hash) | Nobody outside WAWU | FI-04 |
| I-238 | KYC-04 | A8 A9 A10 | logged | The opened wallet account (number, name) | Held by the wallet provider† | FI-04 |
| I-239 | KYC-05 | A14 | typed | A26 BVN and NIN | Wallet provider† (kept only as keyed hashes and last 4) | PI-13 |
| I-240 | LEGAL-01 | none | typed | S14 free text to the assistant | Google Gemini and the consultant | MS-01, PI-17 |
| I-241 | LEGAL-02 | S14 S15 S16 S17 | picked | S14 and S15 quick replies and follow-up answers about the matter | Google Gemini and the consultant | PI-17 |
| I-242 | LEGAL-02 | S14 S15 S16 S17 | typed | S16 "Add anything else" and the confirmed brief | The consultant | PI-17 |
| I-243 | LEGAL-03 | none | picked | Consultation medium and slot; several delivered files come back | The consultant | PI-18, PF-04 |
| I-244 | LEGAL-04 | S18 S19 S20 S25 | picked | S18 video, phone or in person; day and time; S25 Request in person | The consultant; the details email goes through Resend | PI-18 |
| I-245 | LEGAL-04 | S18 S19 S20 S25 | device | S20 Add to calendar writes locally | Nobody outside WAWU | CL-01 |
| I-246 | LEGAL-04 | S18 S19 S20 S25 | typed | S19 PIN | Wallet provider† moves the money | FI-04 |
| I-247 | LEGAL-05 | none | logged | Consultation, service and registration fees debited from the wallet | Wallet provider† | FI-03 |
| I-248 | LEGAL-06 | S21 S22 S23 S24 S26 | signed | S21 a full name typed to sign; time and IP saved | The consultant | PI-19, AA-13 |
| I-249 | LEGAL-06 | S21 S22 S23 S24 S26 | typed | S24 and S26 the business-name request: first name choice, second option, address, what the business does | Whoever files at CAC (LEAD CHECK PI-20) | PI-20 |
| I-250 | LEGAL-06 | S21 S22 S23 S24 S26 | uploaded | S26 ID, signature and passport photograph | Whoever files at CAC (LEAD CHECK PI-20); hosted at DigitalOcean | PF-04, PF-01, PI-20 |
| I-251 | LEGAL-06 | S21 S22 S23 S24 S26 | received | S23 delivered documents (reviewed contract, consultant notes) | The person (received, not collected) | PF-04 |
| I-252 | LEGAL-07 | none | none | Staff screens that set legal prices (no app user) | Nobody outside WAWU | NX-03 |
| I-253 | ME-01 | M1 M2 M4 M10 | device | M1 Share profile (share sheet); own profile shown as visitors see it | The app the person picks | NX-05, PI-16 |
| I-254 | ME-02 | M5 M6 M33 | picked | M5 and M6 Follow, Unfollow; block from the profile menu | Nobody outside WAWU | AA-01 |
| I-255 | ME-03 | M7 Z1 | none | The Me menu (rows and counts read from existing data) | Nobody outside WAWU | AA-01 |
| I-256 | ME-04 | M19 M20 M21 M22 | uploaded | M21 the full video, course lesson, audio, PDF, image set or template file | Hosted at DigitalOcean; locked until bought | PF-02, PF-03, PF-04, PF-01 |
| I-257 | ME-04 | M19 M20 M21 M22 | uploaded | M22 the public preview file | Public | PF-04, PF-02 |
| I-258 | ME-04 | M19 M20 M21 M22 | picked | M20 the format | Nobody outside WAWU | AA-04 |
| I-259 | ME-05 | none | typed | Location, skills, open to, Threads handle, social order (backend) | Public on the profile | PI-12, PI-16 |
| I-260 | ME-06 | M8 M9 | uploaded | M8 avatar picture | Hosted at DigitalOcean; public | PF-01 |
| I-261 | ME-06 | M8 M9 | typed | M8 name, handle, bio, location; M9 social handles; reordered | Public on the profile | PI-01, PI-03, PI-12 |
| I-262 | ME-07 | M18 M28 M26 M27 | picked | M26 Replace the file, Edit, Delete and free the slot, Send again | Nobody outside WAWU | AA-04 |
| I-263 | ME-08 | M23 M24 M25 M37 | typed | M23 title and description; picked category; M24 price, Paid or Free | Public once approved; staff review it | AA-04 |
| I-264 | ME-09 | none | logged | Edit while pending, resubmit, rejection reason, sales count | Nobody outside WAWU | AA-04 |
| I-265 | ME-10 | none | logged | Saved events and creators, course progress, menu counts, notification targets | Nobody outside WAWU | AA-01, AA-09 |
| I-266 | ME-11 | M34 M35 M36 | typed | M36 work title, your role, year, client, link; picked category | Public on the profile | PI-16 |
| I-267 | ME-11 | M34 M35 M36 | uploaded | M36 photos or a video of the work | Hosted at DigitalOcean; public | PF-01, PF-02 |
| I-268 | ME-12 | M11 M12 M13 M14 | typed | M13 PIN to pay for a tick | Wallet provider† moves the money | FI-04, FI-03 |
| I-269 | ME-13 | M15 M16 M17 | none | Tick still confirming, wallet not opened, identity not matched (states) | Nobody outside WAWU | FI-03 |
| I-270 | ME-14 | M29 M30 M31 M32 | typed | M29 "Search what you've bought" (LEAD CHECK AA-03: phone filter or server query) | Nobody outside WAWU | AA-03 |
| I-271 | ME-14 | M29 M30 M31 M32 | picked | M30 saved tabs; M31 filters | Nobody outside WAWU | AA-01 |
| I-272 | ME-16 | none | typed | Education entries (school, field, years) and featured works (backend) | Public on the profile | PI-16 |
| I-273 | ME-17 | none | logged | Upload and storage allowance by tick state; file sizes counted | Nobody outside WAWU | PF-01 |
| I-274 | ME-18 | none | logged | Tick purchase debit from the wallet | Wallet provider† | FI-03 |
| I-275 | MONEY-01 | none | none | A protected-route regression suite (test data only) | Nobody outside WAWU | NX-03 |
| I-276 | MONEY-02 | W11 H15 M13 | device | PIN sheet; the phone's own fingerprint or face prompt (the app never sees it) | Nobody outside WAWU | AA-08, NX-05 |
| I-277 | MONEY-02 | W11 H15 M13 | typed | PIN digits (sent to the Hub over TLS, compared to a hash) | Nobody outside WAWU | FI-04 |
| I-278 | MONEY-03 | H14 W10 | none | The pay-from-wallet sheet (shows price, fee, total) | Nobody outside WAWU | FI-04 |
| I-279 | MONEY-04 | none | none | Conventions and the wallet contract (no data) | Nobody outside WAWU | NX-03 |
| I-280 | MONEY-06 | none | none | The wallet-provider client: sends what other tasks collect | Wallet provider† | FI-04 |
| I-281 | MONEY-07 | none | logged | Provider webhook deliveries stored whole (payload and raw body); a handled delivery's body is cleared after 90 days (FIX-20) | Received from the wallet provider† | FI-04 |
| I-282 | MONEY-08 | none | logged | Status checks of pending transfers | Wallet provider† | FI-04 |
| I-283 | MONEY-09 | none | logged | PIN hash, wrong-try count, lock time | Nobody outside WAWU | FI-04 |
| I-284 | MONEY-10 | none | logged | Ledger rows: amounts, counterparty, notes, references | Wallet provider† | FI-04 |
| I-285 | MONEY-11 | none | logged | Balance read from the wallet provider† (never summed) | Wallet provider† | FI-04 |
| I-286 | MONEY-12 | none | logged | Account opening sends first and last name, phone, email, address, date of birth, BVN, NIN | Wallet provider† | PI-01, PI-02, PI-06, PI-07, PI-12, PI-13 |
| I-287 | MONEY-13 | none | none | Money screens lead to Open your wallet (an error shape) | Nobody outside WAWU | FI-04 |
| I-288 | MONEY-14 | none | typed | W37 the six-digit PIN reset code, sent by SMS today and moving to email in the wallet rebuild (R-39) | Wallet provider† (SMS, until the rebuild) | FI-04, PI-07 |
| I-289 | MONEY-14 | none | logged | Device key registered: deviceId, publicKey, biometric label | Nobody outside WAWU | AA-08 |
| I-290 | MONEY-15 | none | typed | W26 transaction search and filter | Nobody outside WAWU | FI-04 |
| I-291 | MONEY-16 | none | logged | A nightly comparison emailed to the owner on a mismatch | Resend | FI-04, PI-02 |
| I-292 | MONEY-17 | none | logged | A debit to the merchant wallet with the 85/15 split | Wallet provider† | FI-03 |
| I-293 | MONEY-18 | none | logged | Hold, release and refund transfers | Wallet provider† | FI-03 |
| I-294 | MONEY-19 | none | none | Not-enough-money and still-confirming answers (no new field) | Nobody outside WAWU | FI-04 |
| I-295 | OPS-01 | none | none | Records the owner's rulings in DECISIONS.md | Nobody outside WAWU | NX-01 |
| I-296 | OPS-02 | none | none | Sandbox calls with masked test data | Nobody outside WAWU | NX-01 |
| I-297 | OPS-03 | none | none | Runs the backend locally with seeded test data | Nobody outside WAWU | NX-01 |
| I-298 | OPS-04 | none | none | Designer brief, no data | Nobody outside WAWU | NX-01 |
| I-299 | OPS-05 | none | none | Rewrites other repos' CLAUDE.md | Nobody outside WAWU | NX-01 |
| I-300 | OPS-08 | none | none | Retires Shop: routes answer 410, past orders (delivery name, phone, address) stay readable | Nobody outside WAWU | NX-04 |
| I-301 | OPS-09 | none | none | Owner sets merchant charges in a dashboard | Nobody outside WAWU | NX-01 |
| I-302 | OPS-10 | none | none | Live keys and webhook URL on the droplet | Nobody outside WAWU | NX-01 |
| I-303 | OPS-11 | none | logged | Rate limits count by the real client IP, behind nginx | Nobody outside WAWU | AP-02 |
| I-304 | PROS-01 | P1 P2 P3 P4 | picked | P1 to P4 field chips and Ask a question | Nobody outside WAWU | AA-01 |
| I-305 | PROS-02 | none | none | Backend: categories, city, reply time and price on the response | Nobody outside WAWU | PI-14 |
| I-306 | PROS-03 | P5 P6 P7 P8 P9 P10 | typed | P5 headline, about, what you take on; picked fields; P6 kind, licence number, who issued it | Public once listed; the issuing body checks the licence (LEAD CHECK PI-14) | PI-14, AA-04 |
| I-307 | PROS-03 | P5 P6 P7 P8 P9 P10 | uploaded | P6 the licence document | Hosted at DigitalOcean; reviewed by staff | PF-04 |
| I-308 | PROS-03 | P5 P6 P7 P8 P9 P10 | picked | P8 Hide, Show, Apply again | Nobody outside WAWU | AA-04 |
| I-309 | RELEASE-01 | none | none | Store listing and data-safety documents (this task) | Nobody outside WAWU | NX-01 |
| I-310 | RELEASE-02 | none | none | Fixes for QA defects and the store submission | Nobody outside WAWU | NX-01 |
| I-311 | SCHOOLS-01 | none | none | Data model: schools, courses, intakes (no person) | Nobody outside WAWU | NX-03 |
| I-312 | SCHOOLS-02 | none | none | Staff create and edit schools (no app user) | Nobody outside WAWU | NX-03 |
| I-313 | SCHOOLS-03 | SC1 SC2 SC3 SC10 | typed | SC1 school search text | Nobody outside WAWU | AA-03 |
| I-314 | SCHOOLS-03 | SC1 SC2 SC3 SC10 | picked | SC1 category chips; SC3 Enroll | Nobody outside WAWU | AA-01 |
| I-315 | SCHOOLS-04 | none | typed | Search text in the schools tab | Nobody outside WAWU | AA-03 |
| I-316 | SCHOOLS-05 | none | none | Staff screens for schools (no app user) | Nobody outside WAWU | NX-03 |
| I-317 | SCHOOLS-06 | SC4 SC5 SC6 SC7 SC11 | picked | SC4 the class (intake); name, email and masked phone prefilled from the account and sent | The school (SC4 and SC7 say so) | PI-08, PI-01, PI-02, PI-07 |
| I-318 | SCHOOLS-06 | SC4 SC5 SC6 SC7 SC11 | typed | SC6 PIN | Wallet provider† moves the money | FI-04, FI-03 |
| I-319 | SCHOOLS-07 | none | logged | Enrolment with amount, seat claim and receipt | Wallet provider† | PI-08, FI-03 |
| I-320 | SCHOOLS-08 | SC8 SC9 | picked | SC9 Continue to their site (opens the browser) | The school's own site sees a per-school code | AA-10 |
| I-321 | SCHOOLS-08 | SC8 SC9 | logged | SC8 My courses reads the enrolments | Nobody outside WAWU | PI-08 |
| I-322 | SCHOOLS-09 | none | logged | Report emailed to the school: name, email, phone, course, intake, consent time | The school, through Resend | PI-08 |
| I-323 | SCHOOLS-10 | none | logged | Click on the school link: user, course, time | The school sees only a per-school code | AA-10 |
| I-324 | SCHOOLS-11 | none | logged | Settlement of the course fee to the school (a business payee) | Wallet provider† | FI-03 |
| I-325 | SETTINGS-01 | Z2 Z3 Z4 Z5 Z12 | picked | Z3 notification switches; Z4 privacy switches; Z5 block and unblock; Theme and Sound stay on the phone | Nobody outside WAWU | AA-09, AA-01, NX-05 |
| I-326 | SETTINGS-02 | Z9 Z10 Z11 | none | About, Terms and Privacy policy screens read text from the Hub | Nobody outside WAWU | NX-03 |
| I-327 | SETTINGS-03 | none | typed | Current password and new password | WAWU ID (a hash is kept) | PI-04 |
| I-328 | SETTINGS-04 | none | picked | Download my data (a request) | Emailed as a signed link through Resend | HK-04, PI-02 |
| I-329 | SETTINGS-04 | none | logged | Blocks hide people in search, profiles and recipient search | Nobody outside WAWU | AA-01 |
| I-330 | SETTINGS-05 | Z6 Z7 Z8 | typed | Z7 DELETE typed to confirm; picked an optional reason | LEAD CHECK PI-21 | PI-21, HK-05 |
| I-331 | SETTINGS-06 | none | logged | Deletion scheduled, wallet frozen and restored on cancel | Wallet provider† is told to freeze | HK-05 |
| I-332 | SETTINGS-07 | none | picked | Notification switches the server honours | Nobody outside WAWU | AA-09 |
| I-333 | SETTINGS-08 | none | logged | 30-day grace, cancelled by signing in (deletedAt) | Nobody outside WAWU | HK-05 |
| I-334 | SETUP-01 | none | none | Verifies the repo setup | Nobody outside WAWU | NX-01 |
| I-335 | SHELL-01 | H1 W1 I1 M1 X1 | none | The five tabs | Nobody outside WAWU | NX-03 |
| I-336 | SHELL-02 | none | device | Sign-in tokens in the phone's secure store | Nobody outside WAWU | HK-03 |
| I-337 | SHELL-03 | none | none | Tester builds (EAS) | Nobody outside WAWU | NX-01 |
| I-338 | SUPPORT-01 | none | typed | Messages in the support thread with a payment or piece reference | WAWU staff | MS-01 |
| I-339 | TEMPLATE | ids from design/canvas-inventory.json | none | The task template file, not a task | Nobody outside WAWU | NX-03 |
| I-340 | UI-01 | W1 W9 A3 | none | Shared components, no data | Nobody outside WAWU | NX-03 |
| I-341 | UI-02 | W26 H14 I1 X14 | none | Shared components, no data | Nobody outside WAWU | NX-03 |
| I-342 | UI-03 | W7 M1 | none | Shared components, no data | Nobody outside WAWU | NX-03 |
| I-343 | WALLET-01 | W1 W4 W5 W6 | device | W1 Copy account number; balance shown | Nobody outside WAWU | FI-04, NX-05 |
| I-344 | WALLET-02 | W7 W9 W10 W11 W12 | typed | W7 a recipient's name, @handle or phone; W9 amount and optional note; W11 PIN | Wallet provider† moves the money; the recipient sees the note | FI-04, PI-07, MS-01 |
| I-345 | WALLET-02 | W7 W9 W10 W11 W12 | picked | W12 save as beneficiary; share receipt | Nobody outside WAWU | FI-01, NX-05 |
| I-346 | WALLET-03 | W8 W13 W14 | typed | W8 bank and account number; the account name returned | Wallet provider† (name lookup and send) | FI-01 |
| I-347 | WALLET-04 | W26 W27 W28 | typed | W26 search and filter; W27 Report a problem opens support chat | Nobody outside WAWU | FI-04, MS-01 |
| I-348 | WALLET-05 | W15 W17 W19 | typed | W17 a withdrawal amount to the payout account | Wallet provider† | FI-04, FI-01 |
| I-349 | WALLET-06 | W35 W36 W37 | typed | W36 a new PIN twice; W37 the reset code | Wallet provider† (SMS until the wallet rebuild moves the code to email, R-39) | FI-04, PI-07 |
| I-350 | WALLET-06 | W35 W36 W37 | picked | W35 fingerprint or face for payments | Nobody outside WAWU | AA-08 |
| I-351 | WALLET-07 | none | logged | Transfer between two accounts with a note and a receipt | Wallet provider† | FI-04 |
| I-352 | WALLET-08 | none | logged | Server-side recipient search by name, handle or phone; recent recipients | Nobody outside WAWU | PI-07, FI-01 |
| I-353 | WALLET-09 | none | logged | Bank list, name check, transfer with the quoted fee and a note | Wallet provider† | FI-01, FI-04 |
| I-354 | WALLET-10 | none | logged | Inbound credit webhook becomes a ledger row and a money-in push | Expo push | FI-04, AA-07 |
| I-355 | WALLET-11 | A21 | typed | A21 bank and account number; the name resolved and matched to the BVN name | Wallet provider† | FI-01 |
| I-356 | WALLET-13 | W39 | none | W39 earnings read from existing rows | Nobody outside WAWU | FI-03 |
| I-357 | WALLET-14 | none | logged | Saved recipients and the payout account with bank code and resolved name | Nobody outside WAWU (name lookup: wallet provider†) | FI-01 |
| I-358 | WALLET-15 | none | none | Fee quotes from the server (no person data) | Nobody outside WAWU | FI-04 |
| I-359 | WALLET-16 | none | logged | Earnings settle into the wallet; a creator without a wallet keeps the share | Wallet provider† | FI-03, FI-04 |
| I-360 | WALLET-17 | none | logged | Host share of credits and event tickets paid out | Wallet provider† | FI-03, FI-04 |

---

## 3. WAWU ID (wawu-id `origin/main` 4715d17)

### 3a. Models (14)

| Item | Model | Personal data in it | Written by | Goes to | Declared in |
|---|---|---|---|---|---|
| I-361 | `WawuUser` | first, middle and last name, email, phone, gender, country, state, passwordHash, occupation, accountType, tick dates, status, email and phone verified times, cross-app ids (onboardingRef, wawuafricaAppUserId, beautyUserId, basketUserId), legacy trustScore (not shown, R-18), deletedAt | AUTH-01, 03, 04, 05, ME-12, SETTINGS-03, 08 | WAWU ID; email through Resend; until AUTH-07 ships (R-39) the phone code is texted through the wallet provider† | PI-01, PI-02, PI-03, PI-04, PI-05, PI-07, PI-12, FI-03, HK-05 |
| I-362 | `RefreshToken` | token hash, expiry (one per signed-in phone) | AUTH-01, SETTINGS-03 | Nobody outside WAWU | PI-04, HK-03 |
| I-363 | `PasswordResetToken` | token hash, expiry | AUTH-01 (A23, A24) | Resend sends the link | PI-04, PI-02 |
| I-364 | `ActivationToken` | token hash, expiry (the web email activation) | No launch screen (the app proves email by a code) | Resend | PI-02 |
| I-365 | `PhoneChangeRequest` | new phone, code hash | No launch screen (planned, `id:src/auth/auth.service.ts`) | Nobody outside WAWU | PI-07 |
| I-366 | `OtpSession` | phone, code hash (the web phone login over WhatsApp) | No mobile screen (LEAD CHECK PI-07: search `src/` for `/auth/otp`) | Meta WhatsApp, only if the app ever calls it | PI-07 |
| I-367 | `EmailVerificationCode` | code hash, expiry | AUTH-05 | Resend | PI-02 |
| I-368 | `PhoneVerification` | phone, code hash, attempts, claimEmail, email code hash, expiry | AUTH-03, AUTH-04 | Until AUTH-07 ships (R-39): wallet provider† (SMS); Resend (email code) | PI-07, PI-02 |
| I-369 | `PhoneGuessBudget` | phone, wrong-try counters and lock times | AUTH-03, AUTH-04 | Nobody outside WAWU | PI-07, AP-02 |
| I-370 | `SignupProgress` | which sign-up steps were done and when | AUTH-05, AUTH-06 | Nobody outside WAWU | AA-09 |
| I-371 | `SignupEmailCode` | email hash, code hash, send times | AUTH-05 | Resend | PI-02 |
| I-372 | `RateCounter` | scope and key (an address or phone), window, count | Every limited route | Nobody outside WAWU | AP-02, AA-13 |
| I-373 | `Policy` | policy slug, version, title, url (no person) | Staff only | Nobody outside WAWU | NX-03 |
| I-374 | `Consent` | policy slug and version accepted, source, IP address, time | A5 consent box when it is wired (G-73); web | Nobody outside WAWU | AA-13 |

### 3b. Sign-up fields the app sends (`SignupDto` and the sign-up steps in `src/api/identity.generated.ts`)

| Item | Field | How it is given | Goes to | Declared in |
|---|---|---|---|---|
| I-375 | email | A3 typed | Resend sends the sign-up code | PI-02 |
| I-376 | phone number (+234 only) | A3 typed; A4 six-digit code | Until AUTH-07 ships (R-39): wallet provider† (SMS); after it the code goes by email and the phone is not texted | PI-07 |
| I-377 | password | A3 typed | Hashed at WAWU ID | PI-04 |
| I-378 | account type: user or creator | A2 picked | Nobody outside WAWU | PI-05 |
| I-379 | occupation (an optional field of `SignupDto`; the app asks it on A5, not at sign-up) | A5 typed (KYC-03) | Nobody outside WAWU (kept by the Hub) | PI-12 |
| I-380 | email code | Typed to prove the email, or skipped | Resend | PI-02 |
| I-381 | interests, three or more of 12 | A12 picked (the `interests` step) | Nobody outside WAWU | AA-02 |
| I-382 | who to follow | A13 picked (the `follows` step) | Nobody outside WAWU | AA-01 |
| I-383 | creator setup checklist | A11 (the `creator_setup` step) | Nobody outside WAWU | AA-09 |
| I-384 | country and state | Not sent by the app (no field on A3) | n/a | PI-12 |

---

## 4. Who receives what (every third party found in the Hub, WAWU ID, the dashboard and the task files)

| Item | Receiver | What it receives | Declared in |
|---|---|---|---|
| I-385 | Fintava† / Loma Bank† (the wallet provider; R-39 switches Fintava† off and Nuvion in, reversibly) | Name, email, phone, address, date of birth, gender, BVN, NIN, selfie (R-39: the selfie step uses Nuvion's hosted check, or is dropped); recipient account numbers for name lookups; payout and transfer data; until AUTH-07 and the wallet rebuild move codes to email (R-39), the sign-up and PIN-reset SMS codes; bill data if bills ship (bills are on hold, FI-06) | PI-01, PI-02, PI-06, PI-07, PI-12, PI-13, PF-01, FI-01, FI-04, FI-05 |
| I-386 | Resend (email) | Sign-up code, password reset link, data-export link, and when built the school report, legal booking details and the nightly check | PI-02, PI-08, PI-18, FI-04, HK-04 |
| I-387 | Expo push service (and Google FCM) | Push token and notification content | AA-07, FI-08 |
| I-388 | Expo Updates | Platform, runtime version and channel at each update check | AP-02 |
| I-389 | Google Gemini | Legal chat text and the intake answers (text only) | MS-01, PI-17 |
| I-390 | The school | Name, email, phone, course, intake, consent time (SCHOOLS-09); a per-school code in the apply link (SCHOOLS-10) | PI-08, AA-10 |
| I-391 | The WAWU Legal consultant (staff in the dashboard; employer is a LEAD CHECK) | Legal matter details, booking, typed-name signature, attached documents | PI-17, PI-18, PI-19, PF-04 |
| I-392 | Whoever files at CAC (LEAD CHECK) and the Corporate Affairs Commission | Registration type, names, nature, address, ID, signature and passport photograph | PI-20, PF-01, PF-04 |
| I-393 | The biller (electricity, cable, network), through the wallet provider†, only if bills ship | Meter, smartcard or phone number | FI-05, PI-07 |
| I-394 | The other person in a chat, thread or community, and the host | What the person typed or sent to them | MS-01, PF-01, PF-02, PF-04, AA-12 |
| I-395 | The issuing body of a professional licence (LEAD CHECK how) | Licence number and issuer | PI-14 |
| I-396 | DigitalOcean (hosting) | Everything stored: databases (NYC3), droplet (NYC1), uploads (SFO3) | PF-01, PF-02, PF-03, PF-04 |
| I-397 | Flutterwave (web payments only; D-5) | Nothing from this app unless a launch mobile flow calls it | NX-04 |
| I-398 | Meta WhatsApp (web phone login only) | Phone number, only if the app ever calls `/auth/otp` | PI-07 |

Third-party hosts found by searching every `https://` host in `hub:src`, `hub:deploy`, `hub:.env.example`, `id:src` and `id:deploy`: `api.flutterwave.com` (web payments, D-5), `dev.fintavapay.com` and `live.fintavapay.com` (the wallet provider), `generativelanguage.googleapis.com` (Gemini), `*.digitaloceanspaces.com` (uploads), `graph.facebook.com` (WhatsApp, web phone login), `cardex.live` (cards and crypto, after launch, not in any launch task); everything else was an example or test host. Resend and Expo appear by name in `id:deploy/ENV.md` and the task files (INBOX-03, INBOX-21) rather than by host.

---

## 4b. Searched for and not found (the "No" rows and the rows that state facts)

Searches ran over the 183 launch task files on this branch and over `package.json` on 6 Oct 2026.

| Item | Looked for | Result | Declared in |
|---|---|---|---|
| I-399 | A phone contacts or address book read | `address book|phone contacts|expo-contacts|READ_CONTACTS` over the 183 launch task files, 0 hits; `package.json` has no contacts package; recipients are found on the server (WALLET-08) | CL-02 |
| I-400 | Precise or approximate location from the phone | `expo-location|geolocation|ACCESS_FINE_LOCATION|GPS|current location|near me`, 0 hits; no location package; a profile location and an event city are typed text (PI-12, PI-15) | CL-03 |
| I-401 | Microphone or voice recording | `microphone|expo-audio|voice note|record audio|RECORD_AUDIO`: RELEASE-01 (this form) and, from VERIFY-03, `src/features/verify/voiceRecorder.ts` (`expo-audio`), `app.json` (the `expo-audio` plugin's microphone text; `RECORD_AUDIO` no longer blocked). **The app now records the person's own voice** for the Voice Intro (VF9): one file up to 30 seconds, uploaded to the Hub's storage folder `voice/sample` and kept as `VoiceProfile.sampleKey`, with the consent line and its time (`consentLine`, `consentAt`) and the made audio (`audioKey`); sent to the AI voice provider only to make a one-run copy that is deleted after each try. Kept until replaced or the account is deleted; deleted by the account purge (`voice/sample` and `ai/voiceover`); no route yet to delete it on its own (G-VOICE-01-5). **OWNER SIGN-OFF** | PF-03, HK-08 |
| I-402 | A crash or analytics SDK | `crashlytics|sentry|firebase|analytics sdk|segment|mixpanel|amplitude|posthog`: hits only in HOME-05, KYC-02, UI-01, UI-02, all false matches (the word segment in a picture-format or component sense, not an SDK); no such dependency in `package.json` | AP-01, AP-02 |
| I-403 | The advertising ID | `advertising id|AD_ID|gaid`, 0 hits; no ads SDK | AA-07 |
| I-404 | Reading SMS or mail from the phone | `READ_SMS|text messages|sms retriever|expo-sms`, 0 hits; sign-up codes are typed by the person | MS-02 |
| I-405 | Ethnicity, belief or sexual orientation | `ethnic|tribe|sexual orientation|religion|denomination`, 0 hits in the launch tasks (the TGIF card is a daily verse a person reads, not a belief the app asks for) | PI-09, PI-10, PI-11 |
| I-406 | Payment cards, health or fitness data | `card number|debit card|expo-health|step count|heart rate|fitness`: hits only RELEASE-01, AUTH-06 (the interest chip "Sports & Fitness") and WALLET-05 (the debit card option, drawn but not built at launch, R-16); no health package | FI-02, CL-04 |
| I-407 | Installed apps or browsing history | `installed apps|QUERY_ALL_PACKAGES|browsing history`, 0 hits | AA-06 |
| I-408 | A credit score or loan data | `credit score|credit bureau|loan`, 0 hits in the launch tasks ("credits" there are WAWU Credits, a count) | FI-07 |
| I-409 | Data-safety overview answers (collects data, encrypted in transit, deletion path, deletion URL, security review, Families policy) | Answered from the code and the hosts, see the evidence in each row | OV-1, OV-2, OV-3, OV-4, OV-5, OV-6 |
| I-410 | Where data is kept, shared and deleted (money and identity holder, what WAWU keeps, tokens, export, deletion, what deletion keeps, retention) | The facts rows of section 3 | HK-01, HK-02, HK-06, HK-07 |
| I-411 | A bills hold (a recorded fact, not collected data) | `tasks/RELEASE-01.md`, Builder round 4, Recorded facts | FI-06 |

---

## 5. Totals

Pinned to the Hub schema at 872cf45 (116 models). Computed from this file on 6 Oct 2026, round 5.

| Part | Items |
|---|---|
| 1. Hub models in the schema | 116 |
| 1b. Models launch tasks will add (not in the schema) | 10 |
| 2. Launch-task inputs and logged items, across 183 task files | 240 |
| 3a. WAWU ID models | 14 |
| 3b. Sign-up fields | 10 |
| 4. Receivers | 14 |
| 4b. Searched for and not found, and fact rows | 13 |
| **Items found** | **417** |
| **Items mapped to a row of DATA-SAFETY.md** | **417** |
| **Unmapped** | **0** |

Distinct rows of `DATA-SAFETY.md` used: see the check above; the form has 72 referenced rows.
