# OPS-DEL-TEST · round history

Moved out of [tasks/OPS-DEL-TEST.md](../OPS-DEL-TEST.md) word for word, oldest first. The current state is in that file.

## Current state as cut (11 Nov 2026, the lead)

As of 11 Nov 2026.
- **Status:** todo. Cut by the lead from the owner's ask (11 Nov, about 08:48 UTC by the owner's phone). The owner asked to delete their own test account, which holds test wallet money: "we are not wiping the database but deleting just this test account... in fact just this my own". The app cannot delete it, because R-17 refuses deletion while the wallet holds money, and the money is sandbox money that cannot be withdrawn.
- **Facts checked by the lead:**
  - The Hub has no admin delete.
  - `DELETE /account` waits `DELETION_GRACE_DAYS` (30) and then `AccountPurgeService.purge(wawuUserId)` runs.
  - The deletion blockers are in `src/account/account-deletion-money.service.ts`.
  - Admin dashboard logins are their own `AdminUser` rows (README, "Admin surface"), so deleting an app account never touches an admin login.
  - The live server's wallet provider is Nuvion on its TEST keys (the owner switches to live keys themselves).
- **Next:** a builder on wawu-backend `wmt/OPS-DEL-TEST`, then a T2 verifier. The owner then runs the script on the server themselves.

