# Web features the app does not have (OPS-07)

This is the list the web team starts from for its own port, after launch. The mobile app is the product and the canvas decides what is in it (`DECISIONS.md`, Authority, owner, 1 Oct 2026). The web follows after launch (R-34). A web feature the canvas does not draw is not built in the app, so it is listed here.

Nothing in this file is an owner ruling. It does not say a feature should be built, kept or cut on the web. It says what the app lacks, what the web holds that must not be lost, and where the work has no task yet.

Source: `docs/analysis/ANALYSIS-EVIDENCE.md`, section "On the web today, absent from the canvas by name". The section is headed (89) and has 89 rows, counted by script. Each row below keeps the evidence wording, numbered 1 to 89 in the order the evidence gives them.

Repos read for this list (read only): `wawu-wmt-mobile` main `dd1c885`, `wawu-backend` main `38bbe4c` (schema and routes), `wawuafrica` (the web, the branch checked out there), `wawu-id` main (`WawuUser`).

## At a glance

| | Count |
|---|---|
| Rows in the evidence section | 89 |
| Marked "not in the app" | 89 |
| With a web-port task | 0 |
| "No task yet" | 89 |
| Rows tied to user money or user data (section 2) | 39 |
| Rows where the app may already have the feature (section 3) | 6 (rows 13, 15, 43, 58, 64, 73) |

**There is no web-port task.** No file in `tasks/` has `type: web-port` and none carries the web port: the template names the type, `docs/WORKFLOW.md` gives it its checks (V1 V3 V4 V5 V6 V7 V9), `DECISIONS.md` says the web port comes after launch, and three BACKEND_GAPS rows (G-31, G-60, G-78) name the web port as a later step, G-31 saying "none yet (web port, owner to assign)". So every row says "no task yet" and no id has been made up. Section 4 lists what has to be created.

## 1. The 89 rows

Columns: **In the app?** is always "Not in the app" (the evidence). **Web-port task** is "no task yet" for every row. **What it is** is one line. **App check** appears only where the app or its task list already has something close. **Money or data** points to a group in section 2, or says none.


### A1 Wallet and earnings

| # | Feature (evidence row) | In the app? | Web-port task | What it is | App check | Money or data |
|---|---|---|---|---|---|---|
| 1 | Paid in / Incoming / Withdrawn ledger tiles beside the balance (WalletScreen.tsx) | Not in the app | no task yet | Three tiles under the web wallet balance: money paid in, money on its way in, money withdrawn. Worked out from the wallet ledger. |  | M1 |
| 2 | Explicit custody explainer copy: 'Your own account, in your name. WAWU never holds your money, it only moves it on your instruction.' | Not in the app | no task yet | A line of reassurance on the web wallet saying the account is the user's own and WAWU only moves money on instruction. |  | none |
| 3 | Buyer-account state 'Wallets come with a creator account' (no wallet for buyers) | Not in the app | no task yet | The web tells a buyer account that wallets come with a creator account. The app gives every user a wallet, so this state does not exist there. |  | none |
| 4 | Minimum withdrawal of ₦1,000 (MIN_WITHDRAWAL_NGN, enforced in the web sheet and server) | Not in the app | no task yet | A floor of 1,000 naira on any withdrawal, set in the web sheet and enforced by the server. |  | M1 |
| 5 | Withdraw to any bank account typed by the user each time (canvas defaults to the KYC payout account with Change) | Not in the app | no task yet | On the web the user types a bank account for each withdrawal. | The app can send to any bank account (WALLET-09), but its Withdraw uses the saved payout account (WALLET-11, WALLET-14). | M1 |
| 6 | Earnings 'Held, not payable yet' figure for unanswered paid DMs | Not in the app | no task yet | A 'held, not payable yet' figure on /earnings: the creator's share of paid questions not yet answered. |  | M2 |
| 7 | Community credits earnings stream (shown as a credit count) on /earnings | Not in the app | no task yet | A line on /earnings for what a host earned from community credits, shown as a credit count. |  | M4 |
| 8 | EVG score tile on /earnings | Not in the app | no task yet | A score tile on /earnings. Nothing in the backend writes an EVG score (search only reads it to rank results), so there is no user data behind it. |  | none |
| 9 | Recent sales list on /earnings | Not in the app | no task yet | A list of the creator's latest sales on /earnings (content, paid questions, tips). |  | M3 |
| 10 | Ledger kinds 'Sale' and 'Reversed' as labelled on the web history | Not in the app | no task yet | The web history labels wallet entries 'Sale' and 'Reversed'. |  | M1 |

### A2 Sign-up, sign-in and Settings

| # | Feature (evidence row) | In the app? | Web-port task | What it is | App check | Money or data |
|---|---|---|---|---|---|---|
| 11 | Web sign-up captures first/middle/last name, gender, country, state/region and occupation by hand (SignUpFlow details step); board derives them from BVN and has no country picker. | Not in the app | no task yet | Web sign-up asks for first, middle and last name, gender, country, state and occupation by hand. |  | M6 |
| 12 | Non-Nigerian sign-up and KYC (country picker; KYC nationalIdEquivalent + passport/national ID/driver's licence document upload in /kyc). | Not in the app | no task yet | Sign-up and identity check for people outside Nigeria: a country picker, a national ID equivalent, and a passport, national ID or driver's licence upload. | The app signs up Nigerian numbers only at launch (R-36). | M5 |
| 13 | Email verification code step at sign-up (WAWU ID /auth/email/verify/start\|confirm). | Not in the app | no task yet | A step at sign-up that emails a code to confirm the address. | Built in the app after the evidence was written: src/app/email-code.tsx (AUTH-04, AUTH-05). The evidence row is out of date. | none |
| 14 | Manual KYC form at /kyc (BVN + NIN + ID document upload + payout bank) as the earning gate; board splits this into wallet tiers (A17-A20) and payout bank (A21) with no ID document upload. | Not in the app | no task yet | The /kyc form: BVN, NIN, an ID document upload and a payout bank, reviewed by hand, which unlocks earning on the web. | The app has no manual review: the wallet opens after a BVN check and a selfie match (KYC-01, KYC-02, KYC-05). | M5 |
| 15 | Switching a discover account to creator later (/onboarding 'Become a creator', becomeCreator() PATCH /users/me). | Not in the app | no task yet | A way for a member (discover) account to become a creator account later, from /onboarding. | Partly in the app: the creator-needed screen (P10) has a 'Become a creator' button that opens the creator setup (AUTH-06 check, PROS-03). No task adds a switch from Settings. | none |
| 16 | Settings rows: Profile, Edit profile, Verification ticks (/profile/verification), Identity verification (/kyc), Paid messages (/messages/settings), Earnings (/earnings), Saved, My tickets, Shop orders, 'About and partners'. | Not in the app | no task yet | Web Settings rows for Profile, Edit profile, Verification ticks, Identity verification, Paid messages, Earnings, Saved, My tickets, Shop orders and About and partners. | The app's Settings (Z2) and Me menu (M7) carry their own set of rows. | none |
| 17 | Settings header account-type label ('Creator' / 'Member' account). | Not in the app | no task yet | A label at the top of web Settings saying 'Creator' or 'Member' account. |  | none |
| 18 | Sound setting that plays 'The WAWU theme' music track (board's Sound row is 'Taps and alerts'). | Not in the app | no task yet | A Settings switch that plays the WAWU theme music. Kept only in the browser (localStorage), so nothing is stored on the account. | The app's Sound row is 'Taps and alerts' (Z2, SETTINGS-01). | none |
| 19 | Notification toggles '24-hour message reminders', 'Replies to my messages' and weekly 'Community digest'. | Not in the app | no task yet | Settings switches for 24-hour message reminders, replies to my messages and a weekly community digest. | The app's Notifications screen (Z3) uses a different set of switches (SETTINGS-07). | M8 |
| 20 | About page sections: mission statement, 'What creators earn' (85/15), 'Credits, never cash', 'Nigeria-first'. | Not in the app | no task yet | Sections on the web About page: mission, what creators earn (85/15), credits never cash, Nigeria first. | The app's About (Z9) is a different page (SETTINGS-02). | none |
| 21 | Single Master Terms, Privacy and Platform Policy document with privacy anchor (/privacy/policy redirects to /terms). | Not in the app | no task yet | One Master Terms, Privacy and Platform Policy page on the web, with a privacy anchor. The text is a file in the web repo (lib/legal/master-agreement.ts), not a database row. | The app serves Terms and Privacy policy as two pages from the backend (SETTINGS-02). | none |
| 22 | Delete-account warning that unused credits are removed and there is no refund for time already spent. | Not in the app | no task yet | A warning on web delete-account that unused credits are removed and time already spent is not refunded. | The app's delete flow is Z6 to Z8 (SETTINGS-05, R-17). | M4 |
| 23 | Phone-number sign-in and WhatsApp-code password reset supported by WAWU ID (identifier accepts phone; forgot-password method 'sms') - not on web either, but available in WAWU ID. | Not in the app | no task yet | Phone-number sign-in and a WhatsApp-code password reset. The evidence says WAWU ID supports it and the web does not, so it is not a web feature. | Phone codes are part of the app's sign-up (AUTH-03, R-36). | none |

### A3 Me (profile and creator dashboard)

| # | Feature (evidence row) | In the app? | Web-port task | What it is | App check | Money or data |
|---|---|---|---|---|---|---|
| 24 | EVG score on the creator dashboard and GET /creators/{wawuId}/evg (no EVG anywhere on Me boards) | Not in the app | no task yet | The EVG score on the creator dashboard and GET /creators/{wawuId}/evg. Nothing writes the score; the backend's own data map calls it a derived score, not data the person gave. |  | none |
| 25 | Owner stat cards on profile: Total earnings, Profile views, Products sold this month (GET /users/me/profile-stats) | Not in the app | no task yet | Owner stat cards on the web profile: total earnings, profile views, products sold this month. |  | none |
| 26 | Four-up stat row with Monthly Views | Not in the app | no task yet | A four-up stat row on the web profile including monthly views. |  | none |
| 27 | Profile Strength / completeness ring with missing steps (avatar, cover, handle, bio, links) | Not in the app | no task yet | A profile completeness ring listing missing steps (photo, cover, handle, bio, links). |  | none |
| 28 | Creator tools rail on the owner's profile (Upload content, Create event, Start a community, Offer a service) | Not in the app | no task yet | A row of creator shortcuts on the owner's web profile: upload, create event, start a community, offer a service. |  | none |
| 29 | Cover image upload on profile and edit | Not in the app | no task yet | Uploading a cover image on the web profile and edit page. |  | M7 |
| 30 | Headline and Company inputs in Edit profile (canvas M8 has neither, though M33 displays both) | Not in the app | no task yet | Headline and Company fields in web Edit profile. | The app shows both on a public profile (M33) but its editor (M8) has neither (ME-06). | M7 |
| 31 | Experience editor (add/edit/delete roles) - canvas displays experience but draws no editor | Not in the app | no task yet | A web editor to add, change and delete experience roles. | The app shows experience (M33) but draws no editor. | M7 |
| 32 | Interests/specialization chips editor | Not in the app | no task yet | A web editor for interest or specialisation chips. | The app asks for interests once, at sign-up (A12, AUTH-06). | M7 |
| 33 | WhatsApp handle and Website as social fields in edit (canvas M9 list has neither) | Not in the app | no task yet | WhatsApp and Website as social fields in web Edit profile. | The app's social links list (M9) has neither (ME-06). | M7 |
| 34 | First/middle/last name split | Not in the app | no task yet | The web splits a name into first, middle and last. The app has one Name field. |  | M6 |
| 35 | Events tab on profile and Communities block on profile overview | Not in the app | no task yet | An Events tab and a Communities block on the web profile. |  | none |
| 36 | Professional standing block on profile | Not in the app | no task yet | A professional standing block on the web profile. |  | none |
| 37 | Profile cross-sell block | Not in the app | no task yet | A cross-sell block on the web profile. |  | none |
| 38 | Earnings statement CSV download on the dashboard | Not in the app | no task yet | A CSV download of earnings statements on the web dashboard. | Partly in the app: the wallet has statements as PDF or CSV for any period (WALLET-27, WALLET-35). It is not on the creator dashboard. | none |
| 39 | Questions answered / DM response stats on the dashboard | Not in the app | no task yet | Questions answered and reply-rate figures on the web dashboard. |  | none |
| 40 | Saved tabs for Guides and Products | Not in the app | no task yet | Guides and Products tabs on web Saved. | The app's Saved (M30) has All, Content, Events, Creators. | none |
| 41 | My tickets and Shop orders rows (web Settings) | Not in the app | no task yet | My tickets and Shop orders rows in web Settings. | Tickets are in the app under the Me menu (E6, EVENTS-03). Shop is retired (R-2). | none |
| 42 | KYC status panel component on profile | Not in the app | no task yet | A panel on the web profile showing the state of the user's KYC review. |  | M5 |
| 43 | Paid-DM settings screen (/messages/settings) - canvas M18 only shows 'Paid messages On · ₦300' as a row | Not in the app | no task yet | The web's own screen for paid-message settings (/messages/settings). | In the app: I21 to I23 (INBOX-12) are the same settings screen. The evidence row looked only at the Me board (M18). Treat as in the app. | none |
| 44 | Public share page /wawu/[handle] | Not in the app | no task yet | A public profile page at /wawu/[handle] on the web. |  | none |

### A4 Home and Explore

| # | Feature (evidence row) | In the app? | Web-port task | What it is | App check | Money or data |
|---|---|---|---|---|---|---|
| 45 | Home: TGIF as its own tab in the Home tab row (web: Home · TGIF · For you · Following) | Not in the app | no task yet | TGIF as its own tab in the web Home tab row. |  | none |
| 46 | Home: TGIF hero 'Reflect' button and personalisation of '{Name}' in the devotional text | Not in the app | no task yet | A 'Reflect' button on the TGIF hero and the user's name inside the devotional text. |  | none |
| 47 | Home: desktop eye-icon toggle for TGIF in the tab row | Not in the app | no task yet | A desktop eye icon in the tab row that hides TGIF. The choice is kept only in the browser. | The app keeps TGIF on or off on the account (HOME-11). | none |
| 48 | Home: persistent VerificationPrompt (verification ask with no dismiss) on Home | Not in the app | no task yet | A web Home banner asking the user to get verified, with no dismiss. |  | none |
| 49 | Home: full service icon grid (orderedServices: all platform services incl. dimmed 'soon' ones); canvas shows four tiles | Not in the app | no task yet | The full icon grid of every WAWU service on web Home, including dimmed 'coming soon' ones. | The app's Today screen shows four tiles. | none |
| 50 | Home: HomeRightRail (desktop) | Not in the app | no task yet | The desktop right rail on web Home. |  | none |
| 51 | Home: floating Sound/music toggle (SoundToggle) | Not in the app | no task yet | A floating sound toggle on the web. Kept only in the browser. |  | none |
| 52 | Explore: 'Everything WAWU can do' service grid | Not in the app | no task yet | An 'Everything WAWU can do' service grid on web Explore. |  | none |
| 53 | Explore: 'Featured this week' mixed rail (the paid-featuring placement) | Not in the app | no task yet | A 'Featured this week' rail on web Explore, the paid-featuring placement. |  | none |
| 54 | Explore: ProfessionalsRail (canvas has a door row instead) | Not in the app | no task yet | A professionals rail on web Explore. | The app has a door row to Professionals instead. | none |
| 55 | Explore: LearningRail of /learn courses (canvas has 'Find a school' door instead) | Not in the app | no task yet | A rail of /learn courses on web Explore. | The app has a 'Find a school' door instead. | none |
| 56 | Explore: ExploreHero fallback slide (WAWU's own pitch when no featured event) | Not in the app | no task yet | A fallback hero slide on web Explore with WAWU's own pitch when no event is featured. |  | none |
| 57 | Explore: 25-sector category list and desktop CategoryFilterAside | Not in the app | no task yet | A 25-sector category list and a desktop category filter on web Explore. |  | none |
| 58 | Content detail: comment like is drawn as a count only; web lets you like comments (canvas shows counts 24/9/2 but no explicit like control) | Not in the app | no task yet | Liking a comment on the web content page. | Probably in the app: HOME-03 lists 'like a comment' as a check for H21. The canvas draws counts only, so confirm with the HOME-03 verifier. | none |

### A5 Inbox, communities and notifications

| # | Feature (evidence row) | In the app? | Web-port task | What it is | App check | Money or data |
|---|---|---|---|---|---|---|
| 59 | Report a paid DM (POST /api/hub/dm/{messageId}/report, web reportDmThread) | Not in the app | no task yet | Reporting a paid DM thread to the admins (POST /dm/{messageId}/report). |  | M10 |
| 60 | Leave a community (DELETE /api/hub/communities/{id}/join) | Not in the app | no task yet | A member leaving a community (DELETE /communities/{id}/join). |  | none |
| 61 | Host edits community name/description/image (PATCH /api/hub/communities/{id}) | Not in the app | no task yet | A host editing a community's name, description and image. |  | none |
| 62 | Host removes a member (DELETE /api/hub/communities/{id}/members/{userWawuId}) | Not in the app | no task yet | A host removing a member from a community. |  | none |
| 63 | Hosting tab listing communities I host (web CommunityTabs "hosting") | Not in the app | no task yet | A 'hosting' tab listing the communities a user hosts. | The app's 'my communities' list shows hosted and joined rooms together (INBOX-01). | none |
| 64 | Standalone notifications page /notifications with mark-all-read (canvas only shows a WAWU row in the inbox) | Not in the app | no task yet | A notifications page with mark-all-read. | Partly in the app: Notifications is screen M31 (ME-14) with All, Money, Messages, Content filters. Mark-all-read is not drawn. | none |
| 65 | Notification settings toggles (newReplies, dmReminders, refunds, communityDigest) at /settings/notifications | Not in the app | no task yet | Settings switches for new replies, DM reminders, refunds and community digest. | The app's switches are different (Z3, SETTINGS-07). | M8 |
| 66 | 30-day paid-DM suspension tier (disabled_30d) shown on web settings | Not in the app | no task yet | A 30-day suspension step (disabled_30d) for creators who miss paid questions. | The app uses one rule: a warning at 20% unanswered and 7 days off at 30%, worked out from the last 30 days (INBOX-09, R-13). | M9 |
| 67 | Posting a photo into a community room (CommunityMessage.imageUrl) | Not in the app | no task yet | Sending a photo into a community room. |  | M11 |
| 68 | credits_low warning notification | Not in the app | no task yet | A notification warning a user that credits are running low. |  | none |
| 69 | Desktop three-pane questions view (QuestionsDesktop) | Not in the app | no task yet | A three-pane questions view on desktop. |  | none |
| 70 | Dispute/query on an unanswered DM (01_SPEC §2) | Not in the app | no task yet | A way to query or dispute an unanswered paid DM. The spec line asks for it. I found no route or table for it in the backend, so it may not exist even on the web. |  | none |

### A6 Events, professionals and services

| # | Feature (evidence row) | In the app? | Web-port task | What it is | App check | Money or data |
|---|---|---|---|---|---|---|
| 71 | Events: speakers (EventSpeaker), save/bookmark (POST/DELETE /events/{id}/save), event recap (recapUrl/recapText), external URL, contact email/phone, admin featuring is fine but the web 'starting soon/trending' sorts are not drawn; per-tier sales start/end editing (salesStartAt/salesEndAt) is not drawn on E15. | Not in the app | no task yet | Event extras the board does not draw: speakers, save, recap, external link, contact details, sales start and end per ticket tier. |  | M12 |
| 72 | Events: creating a referral link is on web (/events/[id]/manage) but the board only shows the count 'Shared links 3 links · 22 sales'. | Not in the app | no task yet | Creating a referral link for an event (on /events/[id]/manage). The app only shows the count. |  | M12 |
| 73 | Professionals: ratings and reviews (ProfessionalReview, POST /api/hub/professionals/{id}/reviews, ratingAvg/reviewCount in the listing) appear nowhere on the boards. | Not in the app | no task yet | Professional reviews: writing a review and the rating and count in the listing. | Partly in the app: the professional card (H10) draws '4.9 212 reviews' and HOME-05 orders by rating. Nothing in the app writes a review. | M13 |
| 74 | Services hub /services (partner-service catalogue, 'Top Professionals', Business playbook): board says 'There's no Services screen.' | Not in the app | no task yet | The /services hub: partner catalogue, Top Professionals, Business playbook. | The board says there is no Services screen. | none |
| 75 | Health plans / Telemedicine (/services/care, /api/hub/care/*, WellaHealth, HealthSubscription): absent from canvas. | Not in the app | no task yet | Health plans and telemedicine (/services/care, WellaHealth). |  | M14 |
| 76 | NEPC export licence (/services/nepc, POST /api/hub/services/nepc/apply): absent. | Not in the app | no task yet | NEPC export licence application (/services/nepc). |  | M15 |
| 77 | Partner services Pension, Banking, Grants (POST /api/hub/services/partner/apply) and web catalogue Loans/EasyBuy, Pensions: absent. | Not in the app | no task yet | Partner services (pension, banking, grants) and the web catalogue of loans and pensions. |  | M15 |
| 78 | Mentors (/api/hub/services/mentors, MentorRequest): absent. | Not in the app | no task yet | Mentors and mentor requests (/services/mentors). |  | M16 |
| 79 | Service applications list/timeline page (/services/applications/[id]) other than CAC tracking: absent. | Not in the app | no task yet | A list and timeline page for service applications other than CAC tracking. | CAC tracking is in the app (S26, LEGAL-06). | M15 |
| 80 | Legal service catalogue browse by category (LEGAL_CATEGORIES, 15+ services e.g. trademark, contract drafting, debt recovery) on /services/legal: the board replaces it with chat quick replies. | Not in the app | no task yet | Browsing legal services by category (about 15 services such as trademark, contract drafting, debt recovery). | The app starts legal as a chat (LEGAL-01). | M17 |
| 81 | Legal in-person and chat consultation media as listed on web (chat/zoom/physical): board has video/phone/in person. | Not in the app | no task yet | Legal consultation by chat, zoom or in person, as the web lists them. | The board offers video, phone and in person (LEGAL-04). | M17 |

### A7 Schools and Shop

| # | Feature (evidence row) | In the app? | Web-port task | What it is | App check | Money or data |
|---|---|---|---|---|---|---|
| 82 | WAWU Learn (/learn, /learn/courses, /learn/guides, /learn/playbook; LearnCourse + CourseEnrollment with free-course slots) does not appear on the Schools boards | Not in the app | no task yet | WAWU Learn on the web: courses, guides, playbook and free-course slots. | The app's 'My courses' (SC8, SCHOOLS-08) is the Schools product, not this. | M18 |
| 83 | Mentors (GET /api/hub/services/mentors, POST /mentors/{id}/requests) do not appear on the Schools boards | Not in the app | no task yet | Mentors on the Schools side: the list and a request to a mentor. |  | M16 |
| 84 | Web ShopHome 'Featured Services' rail of partner services (ShopHome.tsx ServiceCard) is not on SH1 | Not in the app | no task yet | A 'Featured Services' rail of partner services on web ShopHome. |  | none |
| 85 | Web shop max-price filter (CategoryBrowser maxPriceNaira) is not on SH2 | Not in the app | no task yet | A maximum price filter on web shop categories. |  | none |
| 86 | Web Flutterwave card checkout for shop is not on canvas (replaced by Pay from wallet) | Not in the app | no task yet | Paying for a shop order by card on the web. | The canvas pays from the wallet. Shop is retired in the app (R-2, OPS-08). | M19 |
| 87 | Web 'Shop orders' row in Settings is not on canvas (canvas uses Me menu · My purchases) | Not in the app | no task yet | A 'Shop orders' row in web Settings. | Shop is retired in the app (R-2, OPS-08). | M19 |
| 88 | WAWUBasket / WAWUBeauty handoff saves (POST /api/hub/marketplace/saves, ShopKind basket\|beauty) do not appear on the Shop boards | Not in the app | no task yet | Saving a WAWUBasket or WAWUBeauty item for later (POST /marketplace/saves). |  | M19 |
| 89 | Admin shop dispatch queue (GET /api/hub/admin/shop/orders, PATCH fulfilment, trackingNote) has no buyer-facing tracking-note display on SH8/SH10 | Not in the app | no task yet | The admin dispatch queue for shop orders, with a tracking note. | OPS-08 keeps past orders readable in purchases. | M19 |

## 2. Rows that hold user money or user data needing migration

A row is listed here if the web feature reads or writes records that belong to a user and that the app has no screen for, so they would be lost, orphaned or left unpaid if the web or the backend changed under them. Money means a balance, a payment, a hold, a refund or a purchase paid through Flutterwave, which the app replaces with the Fintava wallet. Data means records users wrote, uploaded or submitted.

"Migrate or keep" is what the web team must do so nothing is lost. Whether to copy anything into the new wallet or screens is a product question and is not decided here. Every table named is also in the backend's own account data map (`src/account-purge/account-data-map.ts`), the list of everything a user owns.

| Group | Kind | What | Rows | Related tasks here |
|---|---|---|---|---|
| M1 | Money | The web creator wallet on Flutterwave and its ledger | 1, 4, 5, 10 | WALLET-29, WALLET-30, MONEY-10 |
| M2 | Money | Money held for unanswered paid questions | 6 | INBOX-17, INBOX-08, WALLET-30 |
| M3 | Money | Sales and tips history | 9 | HOME-15, HOME-14, WALLET-30 |
| M4 | Both | WAWU Credits balances and host earnings | 7, 22 | WALLET-17, INBOX-16, INBOX-13 |
| M5 | Data | Identity review records (KYC) | 12, 14, 42 | KYC-01, KYC-02, KYC-05, AUTH-03 |
| M6 | Data | Sign-up details typed on the web | 11, 34 | AUTH-03, AUTH-05, KYC-03 |
| M7 | Data | Profile fields only the web can edit | 29, 30, 31, 32, 33 | ME-05, ME-06, ME-17 |
| M8 | Data | Notification switches | 19, 65 | SETTINGS-07, SETTINGS-01 |
| M9 | Data | Paid-question suspension state | 66 | INBOX-09, INBOX-12 |
| M10 | Data | Reports on paid questions | 59 | none found |
| M11 | Data | Photos posted in community rooms | 67 | INBOX-05 |
| M12 | Both | Event extras and referral links | 71, 72 | EVENTS-02, EVENTS-05, EVENTS-08 |
| M13 | Data | Professional reviews | 73 | HOME-05, PROS-01, PROS-02 |
| M14 | Both | Health plans and telemedicine | 75 | WALLET-30 |
| M15 | Both | NEPC and partner service applications | 76, 77, 79 | LEGAL-06 |
| M16 | Data | Mentor requests | 78, 83 | none found |
| M17 | Both | Legal requests started on the web | 80, 81 | LEGAL-01, LEGAL-04, LEGAL-06, WALLET-30 |
| M18 | Data | WAWU Learn enrolments | 82 | SCHOOLS-08, SCHOOLS-09 |
| M19 | Both | Shop orders and saved partner items | 86, 87, 88, 89 | OPS-08, WALLET-30 |

### M1. The web creator wallet on Flutterwave and its ledger (Money)

- **Rows:** 1, 4, 5, 10
- **Tables:** `CreatorWallet` (link to the Flutterwave payout subaccount: account reference, barter id, account number, bank, status), `WalletLedgerEntry` (every earning, withdrawal and reversal, with provider reference and transfer id), `WalletWithdrawal` (the bank code, account number and account name typed for each withdrawal).
- **What it holds:** Creators who earned on the web hold a real balance at Flutterwave, in an account in their own name. Flutterwave's balance is the true one; the ledger is only WAWU's record of what it instructed, so a number summed from it is never shown as the balance. The app's wallet is a different set of tables (`FintavaWallet`, `FintavaLedgerEntry`, `MoneyPayoutAccount`) with none of this history in it.
- **Migrate or keep:** Keep all three tables unchanged until WALLET-29 has taken every Flutterwave subaccount to zero with a matching ledger entry. Until then the web must keep its wallet screen and its withdraw path working for any creator who still has a balance (the web stays on Flutterwave until after launch, `docs/WORKFLOW.md` section 6). Do not remove the paths before WALLET-30's two weeks of zero calls. The typed bank accounts in `WalletWithdrawal` are personal data: keep them readable only to the owner and admins. Nothing in DECISIONS or the tasks says whether the old ledger history is copied into the new wallet's history or stays on the web only: that is an open question, not decided here.
- **Related tasks here:** WALLET-29, WALLET-30, MONEY-10

### M2. Money held for unanswered paid questions (Money)

- **Rows:** 6
- **Tables:** `DirectMessage` (amount, status, deadlineAt, flutterwaveTxRef, flutterwaveTxId, refundStatus, refundReference, refundAttempts, refundLockedAt).
- **What it holds:** A fan's card payment taken on the web that has not yet been answered (then paid out) or refunded. The Flutterwave transaction id on the row is what a refund needs. The creator's "held" figure is worked out from these rows.
- **Migrate or keep:** Keep every row whose status is awaiting a response or whose refund is not settled, and keep the deadline sweep and the Flutterwave refund executor running for them until none is left. New questions bought in the app move to the wallet (INBOX-17); old ones still settle through Flutterwave, so removing the Flutterwave refund path (WALLET-30) must wait for them.
- **Related tasks here:** INBOX-17, INBOX-08, WALLET-30

### M3. Sales and tips history (Money)

- **Rows:** 9
- **Tables:** `Purchase` (type content or tip, buyer, creator, amount, commissionRate, flutterwaveTxRef, flutterwaveTxId, status).
- **What it holds:** Every web sale and tip. It is the buyer's proof of purchase and the creator's sales history, and the source of the web's "recent sales" list.
- **Migrate or keep:** Keep every row. Do not recompute `commissionRate` on past rows: it is the rate written when the sale happened. Keep the Flutterwave references, which are the lookup for refunds and for checking a charge later.
- **Related tasks here:** HOME-15, HOME-14, WALLET-30

### M4. WAWU Credits balances and host earnings (Both)

- **Rows:** 7, 22
- **Tables:** `CreditsState` (creditBalance, trialEndsAt), `CreditPurchase` (pack, creditsGranted, amount, flutterwaveTxRef), `CreditLot` (creditsRemaining, grossKobo, allocatedKobo), `CreditSpend`, `CreditSpendEarning` (hostShareKobo, platformShareKobo, lot ids).
- **What it holds:** Each user's prepaid credit count, the lots it was bought in, and what each host earned when members spent credits in their room. The earnings rows are computed but not yet paid to anyone (WALLET-17 pays them).
- **Migrate or keep:** Keep every balance exactly. Credits stay a count, never a naira value and never cashable. Keep `CreditSpendEarning` rows untouched: WALLET-17 funds the host's wallet from them, and recomputing them would pay the wrong amount. Past purchases were paid through Flutterwave, so their references stay. The web's delete-account warning (row 22) says unused credits are removed on deletion; the app's delete flow is a separate path (SETTINGS-05, SETTINGS-06, SETTINGS-08).
- **Related tasks here:** WALLET-17, INBOX-16, INBOX-13

### M5. Identity review records (KYC) (Data)

- **Rows:** 12, 14, 42
- **Tables:** `KycSubmission` (country, BVN, NIN, nationalIdEquivalent, idDocumentType, idDocumentUrl, payout bank name and account number, status, rejectionReason, reviewedAt), `AdminKycAudit`, and the stored ID document files.
- **What it holds:** The manual review that unlocks earning on the web, including identity numbers and a photo of an ID document. People outside Nigeria can only go through this path: the app's Naira wallet needs a Nigerian BVN (R-6) and its sign-up takes Nigerian numbers only at launch (R-36). The app's own identity data is separate (`WalletIdentity`, `BvnCheckAttempt`, `SelfieMatchAttempt`).
- **Migrate or keep:** Keep every submission and its audit rows, and the files they point to. Keep the web's /kyc path and the earning gate for anyone who has no app wallet. Do not copy BVN, NIN or ID numbers into logs, exports or new tables. Whether an approved web review should count as an identity check in the app is not decided anywhere I found.
- **Related tasks here:** KYC-01, KYC-02, KYC-05, AUTH-03

### M6. Sign-up details typed on the web (Data)

- **Rows:** 11, 34
- **Tables:** WAWU ID `WawuUser` (firstName, middleName, lastName, gender, country, state, occupation), in the `wawu-id` repo, not the Hub.
- **What it holds:** Details web users typed by hand. The app takes name and details from the BVN when a wallet is opened, and has one Name field.
- **Migrate or keep:** Keep these columns and do not overwrite them from a BVN result without a stated rule. Nothing says which value wins when the typed name and the BVN name differ: that is open.
- **Related tasks here:** AUTH-03, AUTH-05, KYC-03

### M7. Profile fields only the web can edit (Data)

- **Rows:** 29, 30, 31, 32, 33
- **Tables:** `UserProfile` (coverUrl, headline, company, interests, whatsappHandle, websiteUrl), `ProfileExperience` (title, company, location, dates, description), `StorageObject` for the cover file.
- **What it holds:** What users wrote or uploaded in the web profile editor. The app shows headline, company and experience on a profile (M33) but cannot edit them, and has no cover, WhatsApp or website field.
- **Migrate or keep:** Keep every column and row. The app's profile save (ME-06) must not clear fields it does not draw: the web team should check this before the web changes its own editor.
- **Related tasks here:** ME-05, ME-06, ME-17

### M8. Notification switches (Data)

- **Rows:** 19, 65
- **Tables:** `NotificationSettings` (newReplies, dmReminders, refunds, communityDigest, newFollowers, promotions, and the new nullable moneyIn, contentReviews, communityMessages).
- **What it holds:** Each user's own choices. The app draws a different set of switches (Z3).
- **Migrate or keep:** Keep existing values. SETTINGS-07 made its new keys nullable so nothing changes for existing users; a web switch the app does not draw must keep being honoured by the web until the web adopts the app's set.
- **Related tasks here:** SETTINGS-07, SETTINGS-01

### M9. Paid-question suspension state (Data)

- **Rows:** 66
- **Tables:** `CreatorNoResponseTracker` (noResponseRatePct, penaltyState: none, warned, disabled_7d, disabled_30d, dmDisabledUntil).
- **What it holds:** A creator's standing for missed paid questions. The app writes the same table (INBOX-09) but only ever produces warned and disabled_7d.
- **Migrate or keep:** Keep existing rows. A row already at disabled_30d with a future date has no meaning in the app's rule (warn at 20%, 7 days off at 30%, R-13). What the app should show such a creator is not decided anywhere I found.
- **Related tasks here:** INBOX-09, INBOX-12

### M10. Reports on paid questions (Data)

- **Rows:** 59
- **Tables:** `DmReport` (threadId, reporterWawuId).
- **What it holds:** Which user reported which paid thread. Admins read it.
- **Migrate or keep:** Keep every row. The app has no report button, so a later web or app change must keep one report per user per thread (the table's unique key).
- **Related tasks here:** none found

### M11. Photos posted in community rooms (Data)

- **Rows:** 67
- **Tables:** `CommunityMessage.imageUrl` and the stored image files.
- **What it holds:** Image messages already in rooms. The app's room draws text only.
- **Migrate or keep:** Keep the column and the files. The app must show or skip an image message without failing.
- **Related tasks here:** INBOX-05

### M12. Event extras and referral links (Both)

- **Rows:** 71, 72
- **Tables:** `EventSpeaker`, `EventSave`, `Event` (recapUrl, recapText, externalUrl, contactEmail, contactPhone), `EventReferral` (code, label, ownerWawuId) and the `referralCode` on `EventOrder`.
- **What it holds:** What event hosts entered, what users saved, and the codes inside links already shared. Ticket orders carrying a referral code decide who gets credit for a sale.
- **Migrate or keep:** Keep all rows. Never reissue or delete a referral code: links already shared would stop crediting. The app reads the referral counts (EVENTS-05).
- **Related tasks here:** EVENTS-02, EVENTS-05, EVENTS-08

### M13. Professional reviews (Data)

- **Rows:** 73
- **Tables:** `ProfessionalReview` (professional, author, stars, body) and the rating and count derived from it.
- **What it holds:** Reviews users wrote. The app already displays the rating and count (H10, HOME-05) and orders professionals by them.
- **Migrate or keep:** Keep every review. Deleting an account removes its reviews by design (the backend's account data map). The app has no way to write a review.
- **Related tasks here:** HOME-05, PROS-01, PROS-02

### M14. Health plans and telemedicine (Both)

- **Rows:** 75
- **Tables:** `HealthSubscription` (plan, price, phone, first and last name, gender, date of birth, email, flutterwaveTxRef, flutterwaveTxId, policyNumber, providerReference, status, startsAt, expiresAt, refundReference, refundedAt).
- **What it holds:** Paid plans bought on the web through Flutterwave, with personal data (date of birth, phone) and the WellaHealth policy number. Active plans run until `expiresAt` at the provider whether or not the app has the feature.
- **Migrate or keep:** Keep every row and let active plans reach their end date. Refunds still go through Flutterwave. The date of birth and policy number are sensitive: do not log them. The app has no screen for this, so nothing in the app can see these rows.
- **Related tasks here:** WALLET-30

### M15. NEPC and partner service applications (Both)

- **Rows:** 76, 77, 79
- **Tables:** `ServiceApplication` (kind, reference, status, amountPaid, certificateExpectedBy, timeline, rejection, documents), `PartnerService`.
- **What it holds:** Applications in progress, fees already paid, uploaded documents and the status timeline. The app uses the same table for CAC tracking, so the other kinds sit beside the app's rows.
- **Migrate or keep:** Keep every application and its documents. In-flight ones must still be able to move to done or rejected from an admin screen. Check that the app's CAC list filters on `kind` so it does not show these.
- **Related tasks here:** LEGAL-06

### M16. Mentor requests (Data)

- **Rows:** 78, 83
- **Tables:** `Mentor`, `MentorRequest` (requester, topics, note, slot, status).
- **What it holds:** Requests users sent to mentors, with a free-text note.
- **Migrate or keep:** Keep every request and let mentors finish pending ones.
- **Related tasks here:** none found

### M17. Legal requests started on the web (Both)

- **Rows:** 80, 81
- **Tables:** `LegalRequest` (service, path, status, details, uploaded documents, consultationMedium chat, zoom or physical, consultationFee, consultationTxRef, quote, contract text and signature with time and IP, serviceTxRef, deliverableUrl), `LegalIntake`, `LegalChatMessage`.
- **What it holds:** Paid consultations, signed contracts, delivered documents and intake chats for real people. The medium values on old rows (chat, zoom, physical) do not match the board's (video, phone, in person).
- **Migrate or keep:** Keep every row, including the signed contract text and signature record, and keep deliverable links working. Map the old medium values when the app first shows an old request. Prices are set by WAWU in admin (R-14), so old fees stay as paid.
- **Related tasks here:** LEGAL-01, LEGAL-04, LEGAL-06, WALLET-30

### M18. WAWU Learn enrolments (Data)

- **Rows:** 82
- **Tables:** `CourseEnrollment` (user, course, enrolledAt, progressPct), `LearnCourse`, `LearnGuide`, `Playbook`.
- **What it holds:** Which free-course slots users took and how far they got. This is a different product from the app's Schools.
- **Migrate or keep:** Keep enrolment rows and progress. The app's My courses reads Schools enrolments (SCHOOLS-08, SCHOOLS-09), so the two lists must not be merged by accident.
- **Related tasks here:** SCHOOLS-08, SCHOOLS-09

### M19. Shop orders and saved partner items (Both)

- **Rows:** 86, 87, 88, 89
- **Tables:** `ShopOrder` and `ShopOrderItem` (flutterwaveTxRef, flutterwaveTxId, fulfilment, tracking note), `CartItem`, `MarketplaceSave` (WAWUBasket and WAWUBeauty).
- **What it holds:** Paid shop orders on the web (card payments through Flutterwave), orders not yet dispatched, refund state, and users' saved items. Shop is retired in the app (R-2).
- **Migrate or keep:** Keep every order readable. OPS-08 keeps past orders readable in purchases. An order paid but not yet dispatched still needs the admin dispatch queue and tracking note until it is closed, and a refund still goes through Flutterwave.
- **Related tasks here:** OPS-08, WALLET-30

### Checked, nothing to migrate

Rows 2, 3, 8, 13, 15, 16, 17, 18, 20, 21, 23, 24, 25, 26, 27, 28, 35, 36, 37, 38, 39, 40, 41, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 60, 61, 62, 63, 64, 68, 69, 70, 74, 84, 85 hold no user money and no user data of their own. They are screens, copy or figures worked out from other tables, with these notes:

- Rows 8 and 24 (EVG score): nothing writes `EvgScore`; the backend's data map calls it "derived score, not data the person gave". Search reads it to rank creators.
- Rows 18, 45, 47 and 51 (sound, TGIF choices): kept in the browser only (`localStorage` in `lib/sound.ts` and `lib/tgif-preference.ts`), so there is no server record to move. HOME-11 gives the app an account-level TGIF preference.
- Row 21 (Master Terms): the text is a file in the web repo (`lib/legal/master-agreement.ts`). The web writes no acceptance record for it. The text itself has to be carried by the web team.
- Row 23 (phone sign-in): lives in WAWU ID and is not a web feature.
- Rows 60, 61 and 62 (leave, edit, remove member): act on `Community` and `CommunityMembership`, which the app also uses. No new table.
- Row 70 (dispute an unanswered DM): I found no route or table behind it in the backend. It may exist only as a line in the web spec, so I could not classify it further.

## 3. Rows where the app may already have the feature

The evidence was written against the canvas boards one flow at a time, and the app has moved since. For six rows a task in this repo, or a screen the evidence did not look at, already carries the same or nearly the same thing. They stay marked "not in the app" as the task asks, because I did not build or run anything. The verifier or the lead should confirm before the web team plans work for them.

| Row | Feature | What I found |
|---|---|---|
| 13 | Email verification code step at sign-up (WAWU ID /auth/email/verify/start\|confirm). | Built in the app after the evidence was written: src/app/email-code.tsx (AUTH-04, AUTH-05). The evidence row is out of date. |
| 15 | Switching a discover account to creator later (/onboarding 'Become a creator', becomeCreator() PATCH /users/me). | Partly in the app: the creator-needed screen (P10) has a 'Become a creator' button that opens the creator setup (AUTH-06 check, PROS-03). No task adds a switch from Settings. |
| 43 | Paid-DM settings screen (/messages/settings) - canvas M18 only shows 'Paid messages On · ₦300' as a row | In the app: I21 to I23 (INBOX-12) are the same settings screen. The evidence row looked only at the Me board (M18). Treat as in the app. |
| 58 | Content detail: comment like is drawn as a count only; web lets you like comments (canvas shows counts 24/9/2 but no explicit like control) | Probably in the app: HOME-03 lists 'like a comment' as a check for H21. The canvas draws counts only, so confirm with the HOME-03 verifier. |
| 64 | Standalone notifications page /notifications with mark-all-read (canvas only shows a WAWU row in the inbox) | Partly in the app: Notifications is screen M31 (ME-14) with All, Money, Messages, Content filters. Mark-all-read is not drawn. |
| 73 | Professionals: ratings and reviews (ProfessionalReview, POST /api/hub/professionals/{id}/reviews, ratingAvg/reviewCount in the listing) appear nowhere on the boards. | Partly in the app: the professional card (H10) draws '4.9 212 reviews' and HOME-05 orders by rating. Nothing in the app writes a review. |

## 4. No task yet

All 89 rows are on this list. Counts by area, for whoever writes the web-port tasks:

| Area | Rows | Count |
|---|---|---|
| A1 Wallet and earnings | 1 to 10 | 10 |
| A2 Sign-up, sign-in and Settings | 11 to 23 | 13 |
| A3 Me (profile and creator dashboard) | 24 to 44 | 21 |
| A4 Home and Explore | 45 to 58 | 14 |
| A5 Inbox, communities and notifications | 59 to 70 | 12 |
| A6 Events, professionals and services | 71 to 81 | 11 |
| A7 Schools and Shop | 82 to 89 | 8 |

What a web-port task needs, from `docs/WORKFLOW.md`: `type: web-port`, passes V1 V3 V4 V5 V6 V7 V9, one small slice each (rule 2: every task is small), and "add, move, then remove" for anything the live web uses (section 6). The money and data groups in section 2 are the slices where moving first and removing last matters most. The backend tasks that already name the web as the later mover are WALLET-29 (move creators off Flutterwave), WALLET-30 (remove the Flutterwave paths), OPS-08 (retire Shop on the backend) and HOME-11 (TGIF choice on the account); none of them ports a web screen.

## 5. How this was checked

- **Row count.** Counted the bullets between the evidence heading and the next heading with a script: 89, matching the heading and `tasks/OPS-07.md`. The table above is generated from those rows, so none is dropped or reworded.
- **Web-port task.** Searched `tasks/` (208 files including INDEX and TEMPLATE, every type), `tasks/INDEX.md`, `docs/WORKFLOW.md`, `docs/PLAN.md`, `DECISIONS.md` and `BACKEND_GAPS.md` for web-port, web port, after-launch and R-34. Found the type definition, the rule that the web follows, and three gap rows that name the web port as a later step (G-31 says "owner to assign"). Found no task that carries a web port.
- **Not in the app.** The evidence rows were taken as the starting claim. I then searched the canvas text (all `design/*Flow.sections.json`), the mobile source on main (`src/`) and every task file for each row's distinctive words, and read the hits. Rows 13, 15, 43, 58, 64 and 73 turned up something close (section 3); the rest found nothing that draws or builds the feature. This is a word search plus reading, not a walk through the running app.
- **Money and data.** For each row I read the model in the backend schema on `origin/main` (106 models) and the route or service behind it, the web file named in the evidence, and the money rules in `DECISIONS.md` (R-1, R-6, R-11, R-13, R-19, R-36), `docs/WORKFLOW.md` section 6 and WALLET-29, WALLET-30, WALLET-17. The Fintava docs in `docs/fintava/` describe the new rail only, and nothing there concerns Flutterwave balances, so they were not needed beyond that.
- **Could not classify.** Row 70 (no route or table found). Also three questions that no document answers, recorded in section 2: whether old Flutterwave ledger history is copied into the new wallet (M1), which name wins between a typed name and a BVN name (M6), and what the app shows a creator already at disabled_30d (M9). None of the three is decided here.

