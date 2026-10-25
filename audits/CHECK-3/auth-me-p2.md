# CHECK-3 audit, area 1, second pass: the rows the first pass could not reach

Auditor: Claude Sonnet 5.5 session, findings only. Independence: this session built none of these files and committed only this report and its screenshots. Base: mobile origin/main 6d387251 (carries the first-pass fixes), backend origin/main 009675f. First-pass report: audits/CHECK-3/auth-me.md on origin/wmt/CHECK-3-auth-me.

Method: the app's web build at 390x844 in Chromium (one browser), design boards rendered with scripts/design/render_design.py (design file `design/<Flow> Flow.dc.html`, light theme), built screen next to board in a side-by-side picture. Stack: Hub, Nuvion stand-in, mock WAWU ID, hosted selfie on (STACK_NUVION_LIVENESS=on), plus this machine's voice and object-storage stand-ins (the two things the first pass lacked). Nothing Fintava, no live host. Seeded on the test database `p2a_wawu_hub_test`: fan, creator and professional-type accounts; a person in Ghana; tiers running, ending in 3 days and ended; funded and low-balance Naira wallets; a blocked account; follows; referrals with granted rewards and a milestone; legal documents (test text, published through the admin route); live, rejected and in-review content.

## Counts

| | |
|---|---|
| Rows the first pass left `unverified` | 54 |
| Reached this pass | 40 |
| Conforms (both file names given) | 34 |
| Differs | 6 |
| Still unreachable | 14 (reasons below) |
| Defects | high 0, medium 7, low 12 |
| Em-dashes users read | none in any screen text captured |

Two first-pass highs no longer reproduce on 6d387251: D-1 (a Ghana account now sees $3, $9, $15 and, on Continue, "Paying in dollars isn't open yet" with "Add a dollar account"; screenshots VF5a-ghana.png, VF5a-ghana-continue.png) and D-2 (a fan who pays for Founding Maker sees "Done" only; no "Record my voice" dead end; VF7a.png).

## Rows reached

Design file names: Auth Flow, Me Flow, Referral Flow, Settings Flow, Verify Flow (`design/<Flow> Flow.dc.html`). Built file: the screenshot under audits/CHECK-3/auth-me-p2/.

| ID | Artboard | Result | Built file and note |
|---|---|---|---|
| A6 | Selfie hand-off | conforms | Auth Flow A6 vs A6.png. The line "It must match your BVN photo" is dropped from the body (low, L-p2-9). |
| A7 | Back from the secure page | conforms | A7 vs A7.png. Says "Your selfie is approved" where the board says "Your face matched your BVN" (safer, no fact claimed). |
| A8 | Wallet open | conforms | A8 vs the wallet-open screen. BRIEF overrides the board: no "Tier 1", no Limit row, no "Raise your limits"; bank is Nuvion MFB. Screenshot withheld because it shows an account number. |
| A9 | Create PIN | conforms | A9 vs A9.png. |
| A10 | Confirm PIN | conforms | A10 vs A10-mismatch.png. The mismatch state follows BRIEF section 12 (the server's sentence, danger-ringed dots, back to step 1). |
| A16 | Face doesn't match | differs | M-4. Board: dark screen, red-ringed oval, "We couldn't match your face", "It must match your BVN photo. Good light, no glasses or cap". Built: plain light result, red X, "Your selfie wasn't approved". A16.png (hosted page's "Face does not match" button, then /selfie). |
| M6 | Following | conforms | M6 vs M6.png. Built adds the tip button and a "Messages off" note because this creator has paid messages off (data). |
| M15 | Paid, still confirming | conforms | M15 vs M15.png (stand-in hold on, ₦1,000 tier paid). "Professional tick" row not drawn (L-p2-7). |
| M22 | Preview | conforms | M22 vs M22.png. |
| M23 | Details | conforms | M23 vs M23.png. |
| M24 | Price | conforms | M24 vs M24.png. Naira only (R-64). |
| M25 | In review | conforms | M25 vs M25.png (1 of 3 used, data). |
| M26 | Rejected | differs | L-p2-5. Third action reads "Delete"; board reads "Delete and free the slot". M26.png (admin rejected a piece). |
| M34 | All works | conforms | M34 vs M34.png (one work, no filter chips because no category). |
| M35 | A work | conforms | M35 vs the work screen (visitor). Footer "Message" absent because paid messages are off (data). |
| M37 | Free piece | conforms | M37 vs M37.png. |
| RF1b | Milestone close | conforms | RF1b vs RF1b.png (4 of 5 verified, "One more verified person"). |
| RF3 | You earned points | conforms | RF3 vs RF3.png (a new granted reward after a first look). Names nobody ("Someone you invited"). |
| RF3a | Milestone | conforms | RF3a vs RF3a.png. |
| Z5 | Blocked | conforms | Settings Flow Z5 vs Z5.png (one blocked account, Unblock). |
| Z10 | Terms | conforms | Z10 vs Z10.png. Layout compared with test text published through the admin route; the empty state is Z10-empty.png. The owner's real text is still unpublished (first-pass D-8 stands for the real stack). |
| Z11 | Privacy policy | conforms | Z11 vs Z11.png (same test text). |
| VF3 | Hear your name | conforms | Verify Flow VF3 vs VF3.png. |
| VF3a | Phonetic edit | conforms | VF3a vs VF3a.png. |
| VF4b | Intro, too long | conforms | VF4b vs VF4b.png. Limit 500 and wording "Too long for a Voice Intro" differ from 250 and "30-second intro" (L-5 stands). |
| VF8 | Your voice, your consent | conforms | VF8 vs VF8.png. Fourth line "Delete it any time in Settings" not drawn (no such screen, R-47). |
| VF9 | Record 30 seconds | conforms | VF9 vs VF9.png (fake microphone on this browser). |
| VF9a | Recording | conforms | VF9a vs VF9a.png. |
| VF9b | Too short | conforms | VF9b vs VF9b.png. |
| VF9c | Recording done | conforms | VF9c vs VF9c.png. |
| VF10 | Making your intro | differs | L-p2-6. Board shows a 64% ring and "About a minute"; built shows a plain spinner and "In your own voice." VF10.png. |
| VF11 | Hear yourself | conforms | VF11 vs VF11.png. Adds the "AI voice" tag beside "Bio" (R-66). |
| VF6c | Paying | conforms | VF6c vs VF6c.png ("We are confirming your payment. Don't pay again." with the hold on). |
| VF7a | Founding Maker | differs | L-p2-4. Success shows "Founding Maker" without the badge number the board draws ("#128"); the Hub did assign badge number 1 (database). VF7a.png. |
| VF12 | Publish your first product | differs | L-p2-8. Built opens with 30 category chips, then preview and file; board shows the finished state. VF12.png. |
| VF12b | Published | conforms | VF12b vs VF12b.png. Built says it is with the team for review (honest); board says "live". |
| VF13 | All products used | differs | M-3. VF13.png. |
| VF14a | Ending in 3 days | conforms | VF14a vs VF14a.png. |
| VF14b | Ended | conforms | VF14b vs VF14b.png. |
| VF15b | Uploads paused | conforms | VF15b vs VF15b.png. Structure matches; the cause line differs by data ("Your identity has not been checked yet" for a person with no wallet; the board's NIN-mismatch cause could not be produced). |

Also compared again from the first pass (still differs on 6d387251): A5 (M-5), A26 and A27 (L-3), A21 (L-11), M33 (L-7).

## Rows still unreachable, with the reason

| ID | Artboard | Reason |
|---|---|---|
| A13 | People to follow (populated) | Reached again (sign-up step answered at the network layer, because the mock WAWU ID always says the sign-up is finished). It shows only "No one to suggest yet", although a creator with live content exists (L-p2-3). Populated state not reached. |
| A14 | Phone doesn't match BVN | The Nuvion stand-in returns no BVN record with a phone, so the Hub never refuses on the phone. |
| A28 | Checking your details | The stand-in approves in under 3 seconds; the screen passed between two looks. Not captured. |
| M10 | Saved (toast) | Edit profile Save and its toast were not driven. |
| M27 | 5 free uploads used | Needs an account with free uploads left and none to spend; not driven. |
| VF3b | Name saved | "Sounds right" goes straight to the Voice Intro editor with no separate state; board not compared. |
| VF6a | Wallet short | A ₦500 wallet was seeded but its checkout was not driven. |
| VF6b | Bank transfer | The transfer row only appears after Pay is tapped (M-2); the transfer path was not driven. |
| VF6d | Payment failed | Only the wrong-PIN sheet was driven ("Wrong PIN. 4 tries left"). A failed transfer through the stand-in was not driven. |
| VF10a | Intro failed | The second intro costs 200 points; the account had none, so the screen shows "You don't have enough points for this." (VF10a-points-short.png). The provider-failure screen was not reached. |
| VF12a | Uploading | Passed in under a second on the local storage stand-in. |
| VF12c | Share sheet | "Share it" opens the phone's own share sheet; nothing is drawn in a browser. Needs the Android phone. |
| VF15 | Identity check | A person whose check already passed goes straight to "Published"; no checking screen is shown. |
| VF15a | Passed | As VF15. |

Not done at all: the signed release build on the owner's Android phone (AUDITOR step 6, R-24).

## Defects

### High

None found. First-pass D-1 and D-2 are fixed.

### Medium

**M-1 · Tier checkout shows no fee breakdown.** /checkout?kind=tier&tier=verify and kind=upgrade, VF6. BRIEF rules 3 and 4: a payment review shows the bank charge, WAWU's fee and the total, even at ₦0. Built shows only "Total ₦1,000" and "Pay ₦1,000". The pay button and PIN sheet do show the total ("₦1,000 for the Verify tier", "₦4,000 for upgrading to Founding Maker"). This stack's book-transfer fee is 0, so whether a non-zero fee would show was not tested. Repro: fan1 (wallet), Settings > Your tier > See tiers > Continue. Screenshots VF6.png, VF6-pin.png.

**M-2 · Bank transfer row missing on first paint (first-pass D-3, still wrong).** VF6, VF6b. Only the wallet row and the points checkbox show; "Bank transfer, From any Nigerian bank" appears after Pay is tapped. May be the FIX-55 rule; the board draws the row always, so it needs a ruling. Screenshots VF6.png, VF6-pin.png.

**M-3 · "All products used" is a banner, not the sheet (VF13).** At 3 of 3 uploads /create-format shows "Your 3 uploads are used. Get verified for up to 25 uploads, or take something down." with Open library. The board draws a sheet: "You have used 3 of 3. Add 5 more products ₦1,500" with Add 5 and "Upgrade instead" (R-65 sets the ₦1,500 pack). The same "Get verified for up to 25 uploads" line reaches a person who already holds Verify, also in My content (M28). Repro: creator with Verify, three uploads, Create > Content. Screenshots VF13.png, M28.png.

**M-4 · Face doesn't match (A16) is not the board's screen.** See the row above. Screenshot A16.png.

**M-5 · Confirm your details (A5) is an empty form (first-pass D-5, still wrong).** Built asks first name, last name, date of birth, gender, city, state; the BRIEF says keep the "From your BVN" card (name, date of birth, gender) and add an address, with Occupation. Needs a ruling. Screenshot A5.png.

**M-6 · Tiers are paid from the wallet, R-86 says no wallet path.** R-86 (24 Oct 2026): ticks and tiers are bought through Google Play Billing and Apple In-App Purchase and "the app draws no wallet path for these". 6d387251 still draws the wallet checkout (VF6) and pays it. IAP-02 owes the change; listed so it is not forgotten. Screenshots VF6.png, VF7a.png.

**M-7 · Verification page lacks the Professional tick row (M16, M17).** Now draws Your ticks and "Every tick gives you" (first-pass D-7 mostly closed), but the board's second tick row, "Professional tick, ₦2,000 a year, Get it", is not drawn. Needs a ruling (R-43 retired M11 to M14 only). Screenshots M15.png, M16-tier.png, M16-no-tier.png.

### Low

- **L-p2-1** (L-5 stands) Voice Intro counts 0 / 500; board 250 and "About 20 seconds when read" is missing. VF4a.png.
- **L-p2-2** (L-3 stands) A26 adds ID type and number; A27 adds postal code and document type. A26.png, A27.png.
- **L-p2-3** A13 says "No one to suggest yet" for an account that picked no interests while Home's "Who Made This?" rail lists a creator with live content for another account. A13.png.
- **L-p2-4** VF7a: no badge number on the Founding Maker success. VF7a.png.
- **L-p2-5** M26: "Delete" against "Delete and free the slot". M26.png.
- **L-p2-6** VF10: no progress figure, no "About a minute". VF10.png.
- **L-p2-7** Professional tick row missing (see M-7 for the ruling).
- **L-p2-8** VF12 opens with a category chip list the board does not draw (the Hub needs a category). VF12.png.
- **L-p2-9** A6 drops "It must match your BVN photo". A6.png.
- **L-p2-10** (L-11 stands) A21 drops "Creators only." A21.png.
- **L-p2-11** (L-7 stands) M33 visitor footer shows only "Following" when paid messages are off; board shows Follow and "Message". M33.png.
- **L-p2-12** The library meter and VF13 banner tell a Verify holder to "Get verified" (see M-3).

## What was walked

Fan (verified wallet, then Verify, then Founding Maker by upgrade), creators with a tier running, ending and ended, a creator with no tier and no wallet through the whole Open your wallet path (BVN and NIN, details, ID, address, hosted selfie refused then approved, wallet open, PIN created and mismatched), a Ghana account, a referrer with granted rewards, a milestone and a new reward, a blocked account, uploads of three pieces (paid, free, rejected by an admin, two approved), drafts and publishing, the Voice Intro from writing to hearing it (with the voice stand-in), legal documents empty and published. Cold start of each account was by tokens in local storage; resume was a reload on the same screen.

## Housekeeping

Databases p2a_wawu_hub_test (dropped by the stack's down), worktrees /home/user/wt/p2a-app and /home/user/wt/p2a-be (removed), ports 9230 to 9242 (verified closed). No code, test, gate or baseline was edited.
