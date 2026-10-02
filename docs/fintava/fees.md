# Fintava's charges

From the Fintava dashboard, shared by the owner on 2 Oct 2026. "Platform"
is what Fintava charges. "Merchant" is the extra WAWU can set in the same
dashboard; it is ₦0 for everything today.

- Bank transfer ("transfer fee"): ₦40
- Wallet to wallet ("balance transfer"):
  - below ₦5,000: ₦23.25
  - below ₦50,000: ₦15.75
  - above ₦50,000: ₦15.75
- Electricity: ₦100
- Cable TV: ₦100
- Airtime: ₦0
- Data: ₦0
- Virtual card: ₦2,000
- BVN check: ₦60
- NIN check: ₦70
- Passport check: ₦56
- Driver's licence check: ₦50
- SMS: ₦7 each

## What the user pays (R-10)

Fintava's charge plus WAWU's fee on top:

- Send to a WAWU user: Fintava's balance-transfer charge + ₦10.
- Send to a bank: ₦40 + ₦25 = ₦65.
- Bills: Fintava's charge (₦100 electricity or cable, ₦0 airtime or data)
  plus WAWU's bill fee if one is set. The design shows "No fee" on bills, but
  that can't be true for electricity and cable, so the review screen shows
  the real total.
- Card top-up 1.5% and the physical card ₦1,500 + ₦500 delivery stay as R-10
  says. Fintava lists a virtual card at ₦2,000; no physical-card price is
  listed.

## Where WAWU's fee is added: the dashboard

There are two ways to add WAWU's fee:

1. **The dashboard's "Merchant charges".** Fintava adds WAWU's fee to the
   same transaction and pays it to WAWU's merchant wallet. That's one call,
   and no extra Fintava charge.
2. **In our code.** We would make a second transfer for WAWU's fee, and
   Fintava would charge a balance-transfer fee (₦15.75 to ₦23.25) on that
   transfer too.

So set WAWU's fees in the dashboard. Our backend keeps the same numbers in
config only to show the user the total before they confirm, and the nightly
check (MONEY-16) confirms the merchant charge really lands in WAWU's wallet.
The first live transaction confirms how the dashboard charge shows up in the
response and the webhook.

## Charges WAWU pays itself

Opening a wallet runs a BVN check (₦60) and a NIN check (₦70), so each wallet
costs WAWU at least ₦130 in checks. The selfie match isn't in the list; ask
Fintava for its price. Sign-up codes by SMS cost ₦7 each.
