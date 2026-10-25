# CHECK-3 audit: sign-up, settings, verification, referral, profile (area 1)

Auditor: Claude Sonnet 5.5 session, findings only. Base: mobile origin/main 67f4d3ff, backend origin/main dcee8af, wawu-id origin/main a9180a5. Independence: this session built none of these files and committed nothing to them.

## Biggest thing never covered

54 of 127 artboards stayed `unverified`. Three gaps cause nearly all of them:
1. **Voice** (VF3, VF3a, VF3b, VF8 to VF11, VF9a to VF9c, VF10a): the stack has no voice provider, so every voice screen shows "Voices are not available right now".
2. **Uploads and publishing** (VF12 and its states, VF13, VF15, M22 to M27, M37): the stack has no object storage, so no file could be added.
3. **The tail of opening a wallet** (A6 to A10, A14, A16, A28): the walk stopped at A5, and the hosted selfie needs a liveness stack.

Not done at all: the signed release build on the owner's Android phone (AUDITOR step 6, R-24). Everything here ran on the app's web build at 390x844 in Chromium.

## Counts

| | |
|---|---|
| Artboards in scope | 127 (Auth 31, Settings 12, Verify 40, Referral 7, Me 37) |
| Coverage | built 116, missing 11 (all ruled: A17 to A20 R-79 d; M3 R-9; M11 to M14 R-43; VF5a, VF13a R-65) |
| Conformance | conforms 42, differs 20, unbuilt 11, unverified 54 |
| Defects | high 2, medium 7, low 11 |
| Em-dashes users read | none found in any screen text captured |

## Defects

### High

**D-1 · Dollar tier prices are shown with a naira sign.** Screen /tiers, artboard VF5a (not built, R-65), design VF5 draws $3, $9, $15 for people outside Nigeria. Built shows "₦3", "₦9", "₦15" for a person whose country is Ghana, then Continue goes to a cedi wallet opening ("Where do you live?"), never to a payment. A mislabelled price is a money defect. Repro: register a user with countryCode GH on the mock WAWU ID, sign in, Settings > Your tier > See tiers. Screenshots: built-gh-tiers.png, design-VF5a.png.

**D-2 · "Record my voice" after paying for a tier is a dead end for a fan account.** Screen /tier-done, artboard VF7. An account that chose "I'm here to discover" can open Settings > Your tier, pay ₦1,000, and the success screen's only button returns to Home with no message. /verify-bonus, /hear-name, /voice-intro and /voice-consent all redirect a fan to Home too (the same routes open for a creator). Repro: wallet user (type user, funded wallet): Settings > Your tier > See tiers > Verify > Pay > PIN > "Record my voice". Screenshots: built-w-paid.png, built-w-record-voice.png.

### Medium

**D-2b · Share card has one target, the design draws four.** /invite-card, RF2: design has WhatsApp, Story, Who Made This? chat, Save; built has a single Share (ShareCardScreen.tsx, one `Target`). Not on the Not built at launch list. Screenshots: built-fan_invite-card.png, design-RF2.png.

**D-3 · Checkout shows no Bank transfer row on first paint.** /checkout?kind=tier&tier=verify, VF6 (VF6b): only the wallet row and the points checkbox show, even after 7 seconds; "Bank transfer, From any Nigerian bank" appears only after Pay has been tapped and the PIN sheet is open. Screenshots: built-w-checkout.png, built-w-pin-wrong1.png, design-VF6.png.

**D-4 · About lacks rows the artboard draws.** /about, Z9: "Banking by <bank>" and "Rate the app" are config-gated (AboutScreen.tsx `bank ?`, `rate ?`) and absent when config is unset; Contact support has no address line; Terms and Privacy policy rows are added though Z9 does not draw them. Release needs the bank name and the store link set. Screenshots: built-fan_about.png, design-Z9.png.

**D-5 · Confirm your details (A5) is an empty form, not the BVN summary.** /open-wallet-details: design shows Name, Date of birth, Gender read from the BVN, then State and Occupation; built asks First name, Last name, Date of birth, Gender, City, State. R-82 (4) covers only the names. Needs a ruling. Screenshots: built-ow-3.png, design-A5.png.

**D-6 · Rejected (A29) has no reason, no "What to do", and no "Upload again".** /open-wallet-rejected shows the title and Done only. Reached by URL without a rejection record, so the reason line is data, but the card and the button differ in structure. Screenshots: built-ow-rejected.png, design-A29.png.

**D-7 · Verification page does not draw "Your ticks".** /verification, M16 and M17: design draws Creator tick, Professional tick (Get it), and "Every tick gives you" (uploads, library space, reach, tick, events). Built shows Getting paid, then Your tier once a tier is held; a person with no tier sees no way to get one from here. R-43 retires M11 to M14 but does not say this section goes. Needs a ruling. Screenshots: built-cpro_verification.png, design-M16.png.

**D-8 · Terms and Privacy policy show "Not available yet".** /terms and /privacy-policy (Z10, Z11) on a fresh stack, and the sign-up consent line links to both. The layout of the real documents could not be compared. The owner must publish both before release or sign-up links to an empty page. Screenshot: built-fan_terms.png.

### Low

- **L-1** Me menu (M7, Z1) has an extra "Your tier" row the artboards do not draw. Screenshot built-w-me-menu.png.
- **L-2** VF1 third row reads "Maker Pass, priority"; design has the Christmas event pass row. Screenshots built-su1-step1.png, design-VF1.png.
- **L-3** A26 adds ID type and ID number fields and drops "voter's card"; A27 adds Postal code and Document type. Screenshots built-ow-id.png, built-ow-address.png.
- **L-4** Add a work (M36) adds Category and Description fields. L-4b: Edit profile (M8) has Country, State, City where design has one Location picker. Screenshots built-fan_add-work.png, built-cpro_edit-profile.png.
- **L-5** Voice Intro (VF4, VF4a) counts 0 / 500, design 0 / 250, and the "About 20 seconds when read" line is missing. Screenshots built-cpro_voice-intro.png, design-VF4.png.
- **L-6** How it works (RF4) item 6 stops at "Rewards are points, never cash." Screenshot built-fan_invite-rules.png.
- **L-7** Visitor About tab (M33) footer shows only "Following"; design has Follow and "Message · ₦300". L-7b: Creator dashboard (M18) has no "Get verified" link under the Uploads meter, no earnings chart, and its meter copy says "Get verified for up to 25 uploads" to a person who holds a tier. Screenshots built-fan-prof-cpro-about.png, built-cb-creator.png, design-M33.png, design-M18.png.
- **L-8** Sign in (A22, A25) has no back arrow when opened cold.
- **L-9** Delete account (Z6) lists "Your wallet", design says "Your wallet and cards".
- **L-10** Welcome (A1): the second line is shorter than the design's ("and bank it all in one app" dropped). Screenshot built-s2-welcome.png.
- **L-11** Payout account (A21): "Creators only." line dropped from the intro.

## What was walked

Stack 1 (mock WAWU ID, Nuvion stand-in, ports 8900 to 8905): fan (verified_user), creator with pending KYC, creator with approved KYC, a funded Naira wallet user (₦200,000, PIN set), a creator with a funded wallet who bought the Verify tier, a Ghana user, a new user who deleted their account. Stack 2 (real wawu-id with a mail stand-in, ports 8910 to 8915): two real sign-ups (creator path and discover path), cold-start reload on the code screen, wrong code, right code, sign-in with a wrong password and an unknown email, forgot password, wallet opening to A5. Money: wrong PIN twice ("Wrong PIN. 4 tries left", then 3), one payment of ₦1,000 debited once (₦200,000 to ₦199,000), tier upgrade sheet, funded wallet on the Delete account screen ("Empty your wallet first"). Dark and light were both compared for Z2, RF1, M1 and VF14; the rest were compared light design against light build.

## Hubs

- **Settings (Z2):** every drawn row is there and opens its screen (Notifications, Privacy, Password, Wallet and PIN, TGIF, Sound, Theme, About, Terms, Privacy policy, Sign out, Delete account). Extra, BRIEF-ruled rows: Your tier, Access code, Use wallet for AI tools.
- **Me menu (M7, Z1):** Creator dashboard, My content, My purchases, My courses, Saved, Notifications, Verification, Settings all lead where drawn. Gaps: D-7 and L-1.
- **Me profile (M1):** Content, Services, About tabs work; Shop tab and QR button are allowed missing.
- **Referral (RF1):** link, code, Share, counters, level pills, next milestone, help all there; D-2b and L-6 on its children.

## Coverage table

Conformance `conforms` means the design artboard and the built screen were both pictured and compared (light, plus dark for four). Design file: design/<Flow> Flow.dc.html, rendered with scripts/design/render_design.py.

| ID | Artboard | Flow | Coverage | Conformance | Evidence or reason |
|---|---|---|---|---|---|
| A1 | Welcome | Auth | built | conforms | Auth Flow.dc.html A1 vs welcome (stack 2, /welcome). Copy line shorter, logo is the Who Made This one (L-10). |
| A2 | Why you're here | Auth | built | conforms | A2 vs /account-type. |
| A3 | Create your account | Auth | built | conforms | A3 vs /sign-up. Extra first name, last name, username and country fields are ruled by R-82. |
| A4 | Phone code | Auth | built | conforms | A4 vs /phone-code. Email code instead of SMS is the ruled launch channel (R-72). Cold-start reload resumes here. |
| A11 | Creator setup | Auth | built | conforms | A11 vs /creator-setup (BRIEF "Uploading needs a tier"). |
| A30 | Home · complete your account | Auth | built | conforms | A30 vs Home "Complete your account". Scan is on the Not built list. |
| A12 | Interests | Auth | built | conforms | A12 vs /interests (picked and unpicked states). |
| A13 | People to follow | Auth | built | unverified | Only the empty state "No one to suggest yet" was reachable: the stack has no creators to suggest. |
| A15 | Wrong code | Auth | built | conforms | A15 vs /phone-code after a wrong code ("That code isn't right"). |
| A31 | BVN and NIN | Auth | built | conforms | A31 vs /open-wallet. Short BVN refused with "Enter the 11 digits of your BVN." |
| A5 | Confirm your details | Auth | built | differs | D-5: design is a read-only "From your BVN" summary plus State and Occupation; built is an empty form. |
| A6 | Selfie hand-off | Auth | built | unverified | Hosted selfie needs STACK_NUVION_LIVENESS=on; /selfie sends the person back to /open-wallet. |
| A7 | Back from the secure page | Auth | built | unverified | Same as A6. |
| A26 | ID document | Auth | built | differs | L-3: adds ID type and ID number fields, drops "voter's card" from the line. |
| A27 | Proof of address | Auth | built | differs | L-3: adds Postal code and Document type fields. |
| A28 | Checking your details | Auth | built | unverified | Not reached: the walk stopped at A5 (date, gender and state pickers not driven); out-of-order URLs bounce to /open-wallet. |
| A8 | Approved | Auth | built | unverified | Not reached (as A28). |
| A9 | Create PIN | Auth | built | unverified | Not reached (as A28). /change-pin is a different screen (enter current PIN). |
| A10 | Confirm PIN | Auth | built | unverified | Not reached (as A28). |
| A14 | Phone doesn't match BVN | Auth | built | unverified | Phone-mismatch refusal needs a BVN record the stand-in refuses; not driven. |
| A16 | Face doesn't match | Auth | built | unverified | Needs the hosted selfie (A6). |
| A29 | Rejected | Auth | built | differs | D-6: /open-wallet-rejected shows only the title and Done; design has the reason, "What to do" card and "Upload again". |
| A17 | Account limits | Auth | missing | unbuilt | Ruled after launch (R-79 d, WALLET-19). |
| A18 | Tier 2 · NIN | Auth | missing | unbuilt | Ruled after launch (R-79 d, WALLET-19). |
| A19 | Tier 2 done | Auth | missing | unbuilt | Ruled after launch (R-79 d, WALLET-19). |
| A20 | Tier 3 · address | Auth | missing | unbuilt | Ruled after launch (R-79 d, WALLET-19). |
| A21 | Payout bank | Auth | built | differs | L-11: form drawn (bank, account number, Save) but "Creators only." is dropped; name-match line not reached. No wallet shows "Open your wallet first". |
| A22 | Sign in | Auth | built | conforms | A22 vs /sign-in. No back arrow when opened cold (L-8). |
| A23 | Forgot password | Auth | built | conforms | A23 vs /forgot-password. |
| A24 | Check your email | Auth | built | conforms | A24 vs check-your-email (copy "1 hour" is config). |
| A25 | Wrong password | Auth | built | conforms | A25 vs /sign-in after a wrong password on the real wawu-id. |
| M1 | Me · Content | Me | built | conforms | M1 vs /me (creator with tier, dark and light). Shop tab (R-9) and QR button (WALLET-20) are allowed missing. |
| M2 | Services | Me | built | conforms | M2 vs /me Services tab. |
| M3 | Shop | Me | missing | unbuilt | Ruled (R-9). |
| M4 | About | Me | built | conforms | M4 vs /me About tab. |
| M5 | Public profile | Me | built | conforms | M5 vs /profile/<id> as a fan. |
| M6 | Following | Me | built | unverified | Following list not opened (the count is not a tap target in the build I drove). |
| M7 | Menu | Me | built | differs | L-1: extra "Your tier" row; fan menu has no dashboard or content rows by account type. |
| M33 | About, as a visitor | Me | built | differs | L-7: visitor About footer has only "Following", no "Message". |
| M34 | All works | Me | built | unverified | /works/<id> not driven (no works seeded). |
| M35 | A work | Me | built | unverified | As M34. |
| M36 | Add a work | Me | built | differs | L-4: extra Category and Description fields. |
| M8 | Edit profile | Me | built | differs | L-4b: Country, State and City fields where design has one Location picker. |
| M9 | Social links | Me | built | conforms | M9 vs /social-links. |
| M10 | Saved | Me | built | unverified | "Profile saved" toast on Me not driven; /saved is M30. |
| M11 | Replaced by VF5 | Me | missing | unbuilt | Replaced by VF5 to VF7 (R-43). |
| M12 | Replaced by VF6 | Me | missing | unbuilt | Replaced by VF5 to VF7 (R-43). |
| M13 | Replaced by VF6 | Me | missing | unbuilt | Replaced by VF5 to VF7 (R-43). |
| M14 | Replaced by VF7 | Me | missing | unbuilt | Replaced by VF5 to VF7 (R-43). |
| M15 | Paid, still confirming | Me | built | unverified | "Paid, still confirming" needs the stand-in hold switch; not driven. |
| M16 | KYC not started | Me | built | differs | D-7: "Your ticks" and "Every tick gives you" are not drawn; page shows Getting paid (and Your tier once held). |
| M17 | KYC not approved | Me | built | differs | D-7 (same screen; not-approved state not reached). |
| M18 | Creator dashboard | Me | built | differs | L-7b: "Get verified" link and earnings chart not drawn; setup rows follow BRIEF. |
| M19 | Create | Me | built | conforms | M19 vs /create. |
| M20 | Pick a format | Me | built | conforms | M20 vs /create-format. |
| M21 | Upload | Me | built | conforms | M21 vs /create-upload (empty state). |
| M22 | Preview | Me | built | unverified | Needs an uploaded file (no object storage on the stack). |
| M23 | Details | Me | built | unverified | Needs an uploaded file (no object storage on the stack). |
| M24 | Price | Me | built | unverified | Needs an uploaded file (no object storage on the stack). |
| M25 | In review | Me | built | unverified | Needs an uploaded file (no object storage on the stack). |
| M28 | My content | Me | built | conforms | M28 vs /library (state differs by data). |
| M26 | Rejected | Me | built | unverified | Needs an uploaded file (no object storage on the stack). |
| M27 | 5 free uploads used | Me | built | unverified | Needs an uploaded file (no object storage on the stack). |
| M37 | Free piece | Me | built | unverified | Needs an uploaded file (no object storage on the stack). |
| M29 | My purchases | Me | built | conforms | M29 vs /purchases. |
| M30 | Saved | Me | built | conforms | M30 vs /saved. |
| M31 | Notifications | Me | built | conforms | M31 vs /notifications. |
| M32 | Nothing new | Me | built | conforms | M32 vs /notifications, empty. |
| RF1 | Invite and earn | Referral | built | conforms | RF1 vs /invite, dark and light (link shows the real host, not wawu/r/). |
| RF2 | Share card | Referral | built | differs | D-2b: one Share target; WhatsApp, Story, Who Made This? chat and Save are missing. |
| RF3 | You earned points | Referral | built | unverified | Reward moment needs a converted referral. |
| RF4 | How it works | Referral | built | differs | L-6: item 6 stops after "Rewards are points, never cash." |
| RF1a | Nothing yet | Referral | built | conforms | RF1a vs /invite with nobody invited. |
| RF1b | Milestone close | Referral | built | unverified | Needs a referral count near a milestone. |
| RF3a | Milestone | Referral | built | unverified | As RF3. |
| Z1 | Me menu | Settings | built | differs | L-1: menu has an extra "Your tier" row; creator rows not pictured (see M7). |
| Z2 | Settings | Settings | built | conforms | Z2 vs /settings, dark and light. Added rows (Your tier, Access code, Use wallet for AI tools) are BRIEF-ruled. |
| Z3 | Notifications | Settings | built | conforms | Z3 vs /settings/notifications. |
| Z4 | Privacy | Settings | built | conforms | Z4 vs /settings/privacy. |
| Z5 | Blocked | Settings | built | unverified | No blocked account on the stack, list state not reached. |
| Z6 | Delete account | Settings | built | conforms | Z6 vs /settings/delete-account. With a funded wallet "Empty your wallet first / Withdraw" shows (text). Line reads "Your wallet", design "Your wallet and cards" (L-9). |
| Z7 | Confirm | Settings | built | conforms | Z7 vs /settings/delete-account/confirm; reason sheet and DELETE gate work. |
| Z8 | Scheduled | Settings | built | conforms | Z8 vs /settings/delete-account/scheduled, reached by a real deletion. |
| Z9 | About | Settings | built | differs | D-4: "Banking by" and "Rate the app" rows hide when config is unset; Contact support has no address line; Terms and Privacy policy rows added. |
| Z10 | Terms | Settings | built | unverified | D-8: stack shows "Not available yet"; the legal text is not published. |
| Z11 | Privacy policy | Settings | built | unverified | D-8: as Z10. |
| Z12 | Nobody blocked | Settings | built | conforms | Z12 vs /settings/blocked (empty). |
| VF1 | Your bonus is waiting | Verify | built | differs | L-2: third row "Maker Pass, priority" instead of the Christmas event pass row. |
| VF2 | Draft shop | Verify | built | conforms | VF2 vs /shop with one draft. |
| VF3 | Hear your name | Verify | built | unverified | D-9: "Voices are not available right now" (no voice provider on the stack). |
| VF4 | Write your Voice Intro | Verify | built | differs | L-5: counter 0 / 500 and no "About 20 seconds" hint; design 250. |
| VF5 | Make it official | Verify | built | conforms | VF5 vs /tiers sheet (header differs by state). |
| VF6 | Checkout | Verify | built | differs | D-3: Bank transfer row missing on first paint. |
| VF7 | You're official | Verify | built | conforms | VF7 vs /tier-done after a real ₦1,000 payment. Its "Record my voice" button dead-ends for a fan (D-2). |
| VF8 | Your voice, your consent | Verify | built | unverified | D-9: voice provider off. |
| VF9 | Record 30 seconds | Verify | built | unverified | D-9. |
| VF10 | Making your intro | Verify | built | unverified | D-9. |
| VF11 | Hear yourself | Verify | built | unverified | D-9. |
| VF12 | Publish your first product | Verify | built | unverified | Publishing needs a file in object storage; the stack has none. |
| VF15 | Identity check | Verify | built | unverified | Identity check before publish not reached (no file to publish). |
| VF15a | Passed | Verify | built | unverified | As VF15. |
| VF13 | All products used | Verify | built | unverified | Needs three drafts and three uploads. |
| VF14 | Your tier | Verify | built | conforms | VF14 vs /your-tier, dark and light. |
| VF2a | Draft shop · empty | Verify | built | conforms | VF2a vs /shop with no drafts. |
| VF2b | Draft shop · three drafts | Verify | built | conforms | VF2b vs /shop after saving a draft. |
| VF3a | Phonetic edit | Verify | built | unverified | D-9. |
| VF3b | Name saved | Verify | built | unverified | D-9. |
| VF4a | Intro · empty | Verify | built | differs | L-5 (counter 0 / 500 against 0 / 250). |
| VF4b | Intro · too long | Verify | built | unverified | Too-long state not driven. |
| VF5a | Tiers · dollars | Verify | missing | unbuilt | Ruled not built (R-16, R-65), yet /tiers renders its dollar figures with a naira sign: D-1. |
| VF5b | Upgrade | Verify | built | conforms | VF5b vs /tiers upgrade sheet ("Pay only the difference"). |
| VF6a | Wallet short | Verify | built | unverified | Wallet-short state not driven. |
| VF6b | Bank transfer | Verify | built | unverified | Bank transfer path not driven (see D-3). |
| VF6c | Paying | Verify | built | unverified | Paying state not driven. |
| VF6d | Payment failed | Verify | built | unverified | Payment failed not driven; wrong PIN shows "Wrong PIN. 4 tries left." |
| VF7a | Founding Maker | Verify | built | unverified | Founding Maker purchase not driven. |
| VF9a | Recording | Verify | built | unverified | D-9. |
| VF9b | Too short | Verify | built | unverified | D-9. |
| VF9c | Recording done | Verify | built | unverified | D-9. |
| VF10a | Intro failed | Verify | built | unverified | D-9. |
| VF12a | Uploading | Verify | built | unverified | Needs object storage. |
| VF12b | Published | Verify | built | unverified | Needs object storage. |
| VF12c | Share sheet | Verify | built | unverified | Needs object storage. |
| VF13a | All used · dollars | Verify | missing | unbuilt | Ruled not built (dollar variant, R-65). |
| VF14a | Ending in 3 days | Verify | built | unverified | Needs a tier within 3 days of its end. |
| VF14b | Ended | Verify | built | unverified | Needs an expired tier. |
| VF15b | Uploads paused | Verify | built | unverified | Not reached (as VF15). |

## Housekeeping

Everything here was run on throwaway databases (a3a_wawu_hub_test, a3i_wawu_hub_test, a3i_wawu_id_test) and torn down after. No code, test, gate or baseline was edited.
