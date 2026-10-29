---
id: BILLS-10
title: Bills against the provider's real lists: airtime numbers checked on the phone, whole network names, bouquets and plans that always draw, labels on one line
owner: YOU
area: BILLS
order: 360
priority: after-launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: [BILLS-02, BILLS-03]
decisions: [R-102, R-27, R-29, R-47]
passes: [V1, V4, V5, V6, V9]
artboards: []
tier: T1
---
# BILLS-10 · Bills against the provider's real lists

## Current state

As of 29 Oct 2026, built by a Sonnet builder (T1), mobile `wmt/BILLS-10` on `origin/main` `6e5df4ec`. App only: no backend change, no native change, `package.json` untouched, Android fingerprint unchanged (`17ffb13d`). Status verifying. Cause: the owner tested bills on TestFlight build 6 (29 Oct 2026) against the live Hub and the provider's real lists, and four things broke. The website's bills page uses the same Hub routes and works, so it is the reference for the real data (wawuafrica `src/app/(app)/services/pay/page.tsx`, `src/lib/api/lifestyle.ts`).

| # | Before (`origin/main`) | After |
|---|---|---|
| 1 | Airtime to Airtel, 0808 992 5524, ₦500: "We couldn't confirm this number. Check it." The app asked the provider to validate a phone number; the provider's validate is for meters and smartcards and refuses a phone | an airtime or data number is checked on the phone and never sent to `POST /bills/validate`: a Nigerian mobile number is 11 digits from 07, 08 or 09 (the `+234` form with 10 digits is read as the same number, so a pasted `+234 808 992 5524` becomes `0808 992 5524`). Pay is allowed once it passes ("Number looks right"); 11 digits that are not one say "Enter a Nigerian mobile number: 11 digits starting with 07, 08 or 09." Meters and smartcards still go to the provider |
| 2 | The network chips read "MTN Ni...", "AIRTEL...", "GLO NI...", "9MOBI...": the provider's raw long names, cut off | one tidy name, `tidyBillerName` (`src/features/bills/names.ts`), applied where the app reads a company (`fetchBillers`) and a recorded bill (`readRecord`), so every place draws it: the chips, the list of companies, the review, the payment window's title, the receipt, S12 and Recent. A network is MTN, Airtel, Glo or 9mobile (matched on the provider's name, else its code); anything else the provider wrote in capitals is title case ("Ikeja Electric"), a brand keeps its own spelling (DStv, GOtv, StarTimes), and a name with mixed case is left alone. Tidying twice changes nothing, so a bill the Hub holds under the raw name draws the same. A chip shrinks its word to fit before it would cut it |
| 3 | Cable TV: after picking DSTV nothing drew under the biller | see "Cause of the cable blank" below. A company's items now always draw: a row is kept when it has an item code and a name (its short name will do); a price that arrives as digits in text is read and one that is missing or null is "no price" (the person types it, as airtime does); nothing drops a row for its price. The provider's own page (`{ data: [...] }`) is read like the Hub's. A list with no readable row says "Nothing to pay for here right now", never a blank. The smartcard field is named by the item's own `label_name` ("SmartCard Number" is "Smartcard number"; electricity's "Meter Number" is "Meter number") |
| 4 | "Paying for" and "Biller" wrapped onto two lines | the label is one line (`numberOfLines={1}`), as wide as its words and never narrower than the board's 64 column (`minWidth` 64, `flexShrink` 0), so the value gives way instead. Measured in the browser at 390 px with the label's text at 1x, 2x and 3x: one line every time (width 64, 114, 174 for "Paying for") |
| 5 | Items: airtime's one distinct code selected itself, every other company needed a pick | the web's rule for every kind: one distinct item code is no choice and selects itself (airtime's AT099 under all four networks; a data network with a single item; an electricity company with one plan); a genuine choice (data bundles, DSTV bouquets, prepaid and postpaid) is a list with prices. A network with nothing readable says so (`items-none`) |
| 6 | Electricity | the same path checked: prepaid and postpaid are two item codes and draw as a list ("Which plan?"), one plan passes the step by, the meter field is named by the item's label, and the meter still goes to the provider's validate |

### Cause of the cable blank
Not reproduced from the website's documented data: the current `ItemsScreen` draws a DSTV list shaped like it (distinct codes, numeric prices, `label_name` "SmartCard Number"; tested on `origin/main` before the change). No live host was called (rules), so the real DSTV answer was not seen. What the code did that can leave nothing under the biller, and is fixed: `fetchItems` dropped every row whose price was not a JavaScript number (`isNumber(r.amount)`), so a list whose prices arrive as text or null lost those rows, and when one row was left the step passed itself over; a list with none left was an empty state, and a wrapped provider page (`{ data: [...] }`) was "unreadable". The red-first tests (`bills10.test.tsx`, "every row is kept whatever way its price arrives") fail on `origin/main` and pass now. If the live Hub answers DSTV with a shape none of these cover, it is a new row here.

### Default (lead), owner may override
- The line under a good phone number says "Number looks right" (a shape check, never "confirmed": nobody asked the network). The board draws no such line for a phone, so it is built from the existing hint line (R-29).
- Package, bundle and plan names are drawn as the provider writes them ("DSTV COMPACT", "MTN 1GB 1 day"); only companies are tidied (the brief names biller names). Tidying plan names risks "5GB" and brand letters, so it is left.
- Airtime and data have no per-number limits now (they came from `validate`): the Hub's own ₦50 floor is the only limit; a bundle's price is its amount.

### Tests
- Red first on `origin/main` (`bills10.test.tsx`, 17 cases; the owner's case, `+234`, a non-mobile number, data, raw network names on the chips, the companies list, Recent and the receipt, DSTV rows with odd prices, a wrapped list, an unreadable list, electricity plans, the chip label), then green. Stand-ins are shaped like the website's documented real data: the category list with codes (AIRTIME, MOBILEDATA, CABLEBILLS, UTILITYBILLS, INTSERVICE), four airtime billers each with the same four AT099 items (MTN VTU, GLO Nigeria, 9Mobile, Airtel Nigeria), DSTV bouquets with their own codes, prices and label "SmartCard Number", data bundles, Ikeja's prepaid and postpaid plans, and every field the provider sends beside the ones the app reads.
- `bills10Names.test.ts`: the names rule and the phone helpers.
- Three existing assertions in `billsScreens.test.tsx` pinned the defect and were changed (the lead's brief names it): the two that waited for "Number confirmed" and the provider's validate body for an airtime and a data number, and "a number the provider refuses is not bought for", now "a number that is not a Nigerian mobile number is not bought for". Nothing else in an existing test changed.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md`
- [BILLS-02](BILLS-02.md) (gap row G-BILLS-CATEGORY), [BILLS-03](BILLS-03.md)
- `src/features/bills/` (`api.ts`, `names.ts`, `model.ts`, `PhoneBillScreen.tsx`, `ItemsScreen.tsx`, `NumberScreen.tsx`, `parts.tsx`)
- The website: wawuafrica `src/app/(app)/services/pay/page.tsx`, `src/lib/api/lifestyle.ts`; the Hub: `src/bill-payment/` (`origin/main` `e7e3523`)

## Goal

Bills work on the provider's real lists: a phone number is checked as a phone number, every network and company reads whole, a company's packages always draw, and the labels stay on one line.

## Scope

`wawu-wmt-mobile` only: `src/features/bills/` (`api.ts`, `model.ts`, `names.ts`, `parts.tsx`, `PhoneBillScreen.tsx`, `NumberScreen.tsx`) and its tests. No route file, no shared component, no backend.

## Capability checks

- [x] A user can buy ₦500 airtime for Airtel at 0808 992 5524: no validation call is made and Pay opens the review (`bills10.test.tsx`).
- [x] A user can paste a `+234` number and it is taken as the same local number.
- [x] A user who types 11 digits that are not a Nigerian mobile number is told so and cannot buy.
- [x] A user sees MTN, Airtel, Glo and 9mobile on the chips, whole, with the company's name tidy on the review, the receipt and in Recent.
- [x] A user who picks DSTV sees its bouquets with prices, picks one and then names the smartcard in a field the provider labels; electricity shows prepaid and postpaid and a meter field.
- [x] A user sees "Paying for" and "Biller" on one line at 390 px and at three times the text size (browser measurement).
- [ ] On a phone and against the live Hub: NOT RUN (no device, no live host in this session).
