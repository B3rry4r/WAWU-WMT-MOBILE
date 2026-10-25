# CHECK-3 audit, area 1 (sign-up and profile), third pass

Auditor: Claude Sonnet 5.5 session, findings only. Independence: this session built none of these files; it committed only this report and its screenshots. Base: mobile origin/main 1fcf0fd7, backend origin/main 44e9540 (both fetched at the start). Earlier passes: audits/CHECK-3/auth-me-p2.md on origin/wmt/CHECK-3-auth-me-p2.

Method: the app's web build at 390x844 in Chromium (one browser, playwright), boards rendered with scripts/design/render_design.py (light), built screen next to board. Stack: Hub, real WAWU ID (mailed sign-up codes through the mail stand-in), the Nuvion stand-in, voice and storage stand-ins, hosted selfie on. No Fintava, no live host. One call was made to the real voice provider with the key from agent-keys/elevenlabs.env (key never printed): HTTP 401 `quota_exceeded`, which is the real failure VF10a needs. Dark mode was captured only for M10 and M27.

## Counts

| | |
|---|---|
| Rows left by pass two | 14 |
| Reached and compared | 3 (A13 conforms, M10 differs, VF3b differs) |
| Replaced by IAP-02, not walked | 3 (VF6a, VF6b, VF6d) |
| Phone step written | 1 (VF12c) |
| Not producible on this Hub (reason below) | 1 (M27) |
| Not reached in this pass (budget ran out, state notes below) | 6 (A14, A28, VF10a, VF12a, VF15, VF15a) |
| Defects | high 0, medium 2, low 5 |

## Rows

| ID | Result | Files and note |
|---|---|---|
| A13 People to follow | conforms | Auth Flow A13 vs A13-light.png. Populated with three creators (title, step line, 52 px avatar, name, field line, Following and Follow pills, Go to Home all as drawn). Differences are data: no ticks (seeded creators are unticked), initials for pictures, step line "2 of 2" (the board's "3 of 3" counts the retired account-type step). Why p2 saw none: see L-p3-1. |
| M10 Saved | differs | Me Flow M10 vs M10-built-light.png and M10-built-dark.png. The toast itself is as drawn (dark pill, green check, "Profile saved"). The board draws it over the profile; built keeps the person on Edit profile and draws it over that screen. D-p3-3. |
| VF3b Name saved | differs | Verify Flow VF3b vs VF3-built.png. "Sounds right" opens Voice Intro at once. The board's Saved chip and "Write my Voice Intro" button are never drawn. L-p3-2. |
| M27 5 free uploads used | not producible | The Hub serves `uploads.allowed 0` and `free.uploads 0` for an account with no tier (GET /api/hub/uploads/allowance, R-43), and the app then draws no meter and no note (UploadsMeter.tsx, `noAllowance`). The "free" wording path cannot run on this Hub. M27-light.png and M27-dark.png show the account with five pieces and no note. Needs a ruling: retire M27 or serve a free allowance. D-p3-4. |
| VF6a, VF6b, VF6d | replaced by IAP-02 | Wallet checkout for a tick, replaced by the store sheet (R-86). Not walked. |
| VF12c Share sheet | phone pass | On the Android phone: publish a product with a Verify tier, on "Published" tap "Share it". Expect the phone's own share sheet with the product link (wawu/<handle>/<slug>) and the app name; pick Copy and paste it into a note to check the link; Back returns to Published. Browsers draw nothing here. |
| A14 Phone doesn't match BVN | not reached | Built the scratch stand-in (scratchpad p3a/nuvion-standin-p3a.cjs, uncommitted; a decision file makes the review answer "rejected, phone does not match the BVN" after the submission) and swapped it onto the stack. Not driven: the Open your wallet walk through to the selfie was not run. Finding from the Hub code: on Nuvion the BVN step is not used (`checkIdentity` is `not_supported`, `checkBvn` answers `step_not_used`), so A14's sentence can only come from a rejected review whose reason names the phone (review-stage.ts, `namesPhoneMismatch`), shown on the rejected screen, not as an error on the BVN and NIN step the board draws. |
| A28 Checking your details | not reached | Same stand-in, `ms` set high in its decision file holds the review pending. Not driven. |
| VF15, VF15a | not reached | Needs a creator with a tier and a wallet opening still pending when they publish. Person j2 (Verify tier, 800 points) is made; the opening was not started. |
| VF12a Uploading | not reached | j2 is ready (tier, test image). Network throttle in playwright was not applied. |
| VF10a Intro failed | not reached | Probe to the real provider answered 401 quota_exceeded. On the web build the recording starts (VF9a-built.png, 0:03 of 0:30) and finishes (VF9c-built.png), but "Use this" produced no change for 50 s and the Hub log shows no voice request, so the generation never started. Cause unknown (the storage stand-in or the browser's recording are the suspects). Not a confirmed app defect. |

## Journey walk

Fresh creator "Dayo": Welcome, Create an account, "I want to earn" (A2), sign-up (first name, last name, username with live "free" line, email, phone with country dropdown, country, password, terms box), mailed code, "Have an access code?" (Skip), A11 "Set up your account", Create, Content, Image, Continue, upload step. Choosing the file sent the person to Make it official (tiers): a person with no tier cannot upload (R-43), and there is no free path. The tier is bought by wallet checkout, which IAP-02 replaces, so the journey cannot reach a first publish for a free person until IAP-02 ships. I then granted Verify, a tick and 800 points in the database to carry on with other rows; the first publish was not completed in this pass. Discover path "Kemi": sign-up, code, interests (pick three), People to follow, Go to Home: no break. Notes: reopening the app mid sign-up returns to an empty sign-up form (re-submitting the same details sends a fresh code, no break); the phone dropdown starts on +1 for a browser in en-US and Nigeria must be picked; the terms row opens the Terms page ("Not available yet", first-pass D-8) when tapped on its words.

## Defects

### High

None.

### Medium

**D-p3-1 · Home's "Who Made This?" rail shows raw interest ids.** Home, H1. The rail's second line reads `film_video`, `business_finance`, `fashion_beauty`, while A13 turns the same ids into "Film & Video" and so on. The app saves interests as chip ids, so every real creator would show this. Repro: any account, Home, scroll to the rail (creators with interests saved from the chips). Screenshot j-09-home.png (rail text read from the page: "Amaka Nwosu | photography", "Funmi Adeyemi | business_finance").

**D-p3-2 · Edit profile loses the Country after Save.** Edit profile, M9. Two accounts signed up with Nigeria: the one never saved shows "Nigeria" on Edit profile; the one that pressed Save (bio and city changed) shows "Choose your country" and a disabled Region, also when reopened (country_code NG is still held by WAWU ID). Repro: sign up with Nigeria, Me, Edit profile, change the bio, Save, reopen. Screenshots M10-built-light.png, M10-built-dark.png. Cause not traced.

### Low

- **D-p3-3** M10 toast sits over Edit profile, not over the profile (see row). M10-built-light.png.
- **D-p3-4** M27 cannot occur: the Hub serves no free uploads (R-43), the board and the Hub's own constant FREE_UPLOADS = 5 (src/common/creator-allowance.ts) both say 5. Needs a ruling.
- **L-p3-1** A13 can say "No one to suggest yet" while creators with live content exist. The Hub's suggestion query (explore.service.ts, `suggested` and `eligibleFrom`) lists only creators with a live piece, not hidden from member lists, not blocked, with at least one of the picked interests in their own `interests`, and with a name or handle. A creator who never saved interests never matches, and there is no fallback list. With matching interests the list fills (A13-light.png).
- **L-p3-2** VF3b saved state not built (see row).
- **L-p3-3** Terms and privacy are still unpublished on this stack: the sign-up terms row opens "Not available yet" (first-pass D-8 stands).

## Housekeeping

Database p3a_wawu_hub_test and p3a_wawu_id_test, worktrees /home/user/wt/p3a-app, p3a-be, p3a-id, the stand-ins on 9578 to 9581 and the swapped Nuvion stand-in on 9576 are removed at the end (ports checked with lsof). No code, test, gate or baseline was edited.
