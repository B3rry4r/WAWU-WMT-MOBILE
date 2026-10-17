# KYC-06 round 2 (lean) verifier report: mobile wmt/KYC-06 96f92d7 (code 3dd59a6) on 7de785d; backend main a5e48fc untouched

Verdict: merge (nothing medium or worse; two lows).

Setup: stack kyc_06 (7460-7467, mobile export with own cache, baked ports 7460 and 7467 only), real login via the mock WAWU ID, browser fixture for /api/hub/money/* only,
390 px. Harness: scratchpad/kyc-06-v/r2_a.py (M1, M2, M3), r2_c.py (A26 and A27 fields), r2_f.py (A28 and A29 errors); logs r2_a.log, r2_c*.log; pictures pics/r2-*.png
(cmp: r2-cmp-a26, r2-cmp-a27, r2-cmp-a28 = board dark, built dark, board light, built light).

| Check | Result |
|---|---|
| M1 closed | passed. Cold load of /open-wallet-rejected (canResubmit true), rejected and expired: Upload again -> /open-wallet?again=1, stays there 3 s, 0 POSTs, 1 wallet GET (no resume bounce). A26 and A27 by link with nothing held (rejected, expired): "We need your details again" -> "Add your details" -> /open-wallet?again=1, A29 never shown, 0 POSTs. Backend main: documents_closed unless stage needs_documents (documents-flow.ts 407-443); bvn and nin (or checkHandle) are required by OpenNairaWalletDto, so correct details are the only way back in. |
| M2 closed | passed. Forward kept: A26 both photos -> A27 bill -> Back on A27 -> A26 still Done/Done, A27 again keeps the bill. Dropped (reopen A26 reads "Tap to take a photo" x2): Back x2, browser back from A26, jump to a tab route (/inbox) from A26, browser back x2 from A27. |
| M3 closed | passed. Signed out, /open-wallet-id, -address, -checking, -rejected (and /open-wallet) all land on /welcome, 0 money calls. _layout.tsx rows present; SHARED-CHANGES KYC-06 #1 says applied. (Lands on /welcome, the signed-out entry, like every protected route; it is not /sign-in.) |
| Owner answers | passed in the browser: ID type + ID number on A26, Postal code + Document type + Home address on A27, drawn as the form's other fields (label above, same radius and height, chevron on the choice fields) at 390 px dark and light (r2-cmp-a26, r2-cmp-a27). National ID asks both sides (Continue disabled with the front only); passport hides Back and Continue opens after the front. Continue without a number says "Enter the number on your ID: 5 to 30 letters, numbers or dashes." Open-call names: unit test documentsFlow.test.tsx:304-316 asserts idType, idNumber, proofOfAddressType, postalCode (plus city, state, gender, middleName, address); every name and enum value matches OpenNairaWalletDto on main. NOT traced in a browser: no step links A5 or A6 to A26 (G-820, known), so a jump into A26 drops the kept check (the screen then correctly says "We need your details again"). The body carries no bvn or nin (G-820), so a nuvion Hub answers its own 400 for the first field it lacks. |
| A27 says what is missing | passed. Submit empty: banner "Add your bill or statement" plus field errors under Home address, Postal code, Document type; with the bill only: the three field errors; 0 POSTs. |
| A28, A29 | passed. A28 reads "This usually takes a few minutes." (dark, light). A28 and A29 error states (503): Close beside Try again, Close -> Home. |

## Findings
1. LOW. A26 still says "voter's card" (src/features/open-wallet/IdDocumentScreen.tsx:199): "NIN slip, passport, driver's licence or voter's card. Both sides if it has two." The Hub takes only international_passport, drivers_license, national_id (ID_TYPES in open-wallet.dto.ts). Lead ruling: low. Repro: open A26.
2. LOW. The ID type field is drawn even when the Hub already holds the opening (then it is optional and only decides whether Back is asked). Harmless; the number field is correctly hidden then.
3. NOTE. ChoiceField and its ChoiceSheet share one testID (open-wallet-id-type, open-wallet-proof-type), so a test locator needs .first.
Not rechecked (round 1 lows 4 and 5 and G-821, G-823 are known/out of scope this round).

Cleanup: stack kyc_06 down (ports 7460-7467 closed, database dropped); worktrees v-kyc-06-m and v-kyc-06-be removed; nothing pushed.
