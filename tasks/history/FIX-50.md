# FIX-50 · round history

Moved out of [tasks/FIX-50.md](../FIX-50.md) word for word, oldest first. The current state is in that file.

## Builder report

Sonnet builder. Mobile `wmt/FIX-50` from `origin/wmt/FIX-47` `0626e38`.
- **Changed:** `OpenWalletScreen.tsx` line 45, `LOCK_LINE` 'Checked with NIBSS. Never shown on your profile.' is now 'Never shown on your profile.'. `OpenWalletScreen.test.tsx` line 202 asserts the new words (the lead authorised that one edit).
- **Searched** `src` for 'checked with', 'NIBSS', 'verified by' and provider names (Nuvion, Fintava, Loma, Dojah and others) in user-facing strings on a BVN or NIN step: the lock line was the only one. Left alone: code comments, `auth-signup.test.tsx` (asserts no NIBSS line on A3), a generated schema comment, and the phone-mismatch banner "Use the number on your BVN, or update it with your bank." (it says where to fix the record, not who checks the number).
- **Not run:** GitHub CI, a real device.
