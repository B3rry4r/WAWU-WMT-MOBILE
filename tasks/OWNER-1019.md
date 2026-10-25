---
id: OWNER-1019
title: Record the owner's four answers of 19 Oct 2026 (Q-42 to Q-45) as rulings R-70 to R-73
owner: YOU
area: OWNER
order: 355
priority: after-launch
repo: wawu-wmt-mobile
type: setup
status: review
depends_on: []
decisions: [R-70, R-71, R-72, R-73]
passes: [V1]
artboards: []
tier: T0
---
# OWNER-1019 · Record the owner's four answers of 19 Oct 2026 (Q-42 to Q-45) as rulings R-70 to R-73

## Current state

As of 19 Oct 2026, merging (lead): stacked in batch 26 (mobile `wmt/OWNER-1019` `7b49e863`, with AUTH-09, FIX-88, INBOX-25 and SETTINGS-09).
- **Status:** merging (lead). Records only, tier T0: no app code, no backend or WAWU ID change, no stack, no jest, no port. Mobile branch `wmt/OWNER-1019` from `origin/wmt/MERGE-25` `eb2ffa3b`.
- **Done:** four rulings after R-69 in `DECISIONS.md`: R-70 (Q-42, three old tests on the Fintava double, test files only, FIX-88), R-71 (Q-43, a host's removal pays back the unused days from the price paid, INBOX-25), R-72 (Q-44, sign-up and PIN reset codes by email at launch, `SIGNUP_VERIFY_CHANNEL=email`), R-73 (Q-45, ID documents kept hidden 5 years after an account's deletion, then deleted, SETTINGS-09). Notes "Updated by R-71" on R-63 and "Updated by R-72" on R-39.
- **Cross-references:** Q-42 in SWEEP-APP, FIX-67, FIX-74, FIX-75, FIX-77, INBOX-24, AITOOLS-01, WALLET-16; Q-43 and its default in INBOX-24 and BACKEND_GAPS (G-INBOX-24-3, G-INBOX-24-6); Q-45 in FIX-65, SWEEP-MONEY and BACKEND_GAPS (G-FIX-65-1); Q-44 and its default in AUTH-07 (default line, release step 5) and BACKEND_GAPS (G-42, G-93, G-222, G-400); G-FIX-75-1 now points at FIX-88. SHARED-CHANGES holds none of the four questions, so it is unchanged.
- **Tasks FIX-88, INBOX-25 and SETTINGS-09:** their builders already have worktrees (`wmt/FIX-88`, `wmt/INBOX-25`, `wmt/SETTINGS-09`) and make their own task files, so this task does not create them. Until they land, `Carried out by` and the BACKEND_GAPS task column name ids with no file.
- **Q-43 has two meanings in the records:** INBOX-24 line 21 used "Q-43" for the removed member's re-join (answered by its round 3); BACKEND_GAPS used it for the refund. R-71 is the refund. INBOX-24 now says so.
- **Check, read only (backend `origin/wmt/MERGE-25` `223fe89`, WAWU ID `origin/wmt/MERGE-16` `22b5f0f`, which holds main `8e4ee10`):**
  - PIN reset code, under `WALLET_PROVIDER=nuvion`: `src/money/pin/pin-reset.service.ts:243` calls `OTP_SENDER.sendResetCode`; `src/nuvion/nuvion-otp-sender.ts:97` posts `POST /internal/users/:userId/pin-reset-code` to WAWU ID (path at `:19`; `channel` is `'email'` at `:43`; `sendText` is refused at `:62`). Wired in `src/wallet-provider/wallet-provider.module.ts:61` to `:73`.
  - An email sender for it does NOT exist in WAWU ID: the route is on none of its 23 branches (G-400 is open, no task). Under nuvion today the reset answers 503 "We could not send the code right now". The Hub's `mock-wawu-id/server.js:439` serves the route (a double only). Under fintava the code is a text: `src/fintava/fintava-wallet-provider.ts:706` (`FintavaOtpSender`).
  - Sign-up code, `SIGNUP_VERIFY_CHANNEL=email`: the email path is built. `src/auth/email-signup.service.ts:701` mails the 6-digit code through `MailService.sendOtpCode` (`src/mail/mail.service.ts:786`, Resend, strict delivery). The setting is read at `src/auth/signup-channel.config.ts:34` and applied at `signup-channel.service.ts:62`. Its default is `phone` (Fintava text through `src/sms/fintava-sms.provider.ts`), also `.env.example:63` and `deploy/ENV.md:27`, so production must set `email` (AUTH-07 release step 5, after G-222).
- **Checks (EXIT lines):** `python3 scripts/tasks/check_tasks.py --write` EXIT 0 (380 tasks, INDEX.md written); `npm run tasks` EXIT 0; `python3 scripts/gates/run.py` EXIT 0 (10 gates, 1162 files, 0 fail, 16 warn, 0 accepted; the warns are old PROVISIONAL lines). No em-dash added.

Status set to review by the records sync, 25 Oct 2026: merged as app 1d7dc26a, lead acceptance in the lead's merge log, 19 Oct.

## Read first

- `docs/WORKFLOW.md`
- `DECISIONS.md`: R-70 to R-73 (and R-39, R-55, R-63)

## Goal

The owner's four answers of 19 Oct 2026 are rulings, so the builders of FIX-88, INBOX-25 and SETTINGS-09 and the lead read them where the old question or default lived.

## Scope

`DECISIONS.md`, `BACKEND_GAPS.md` and one-sentence notes in the task files that quoted Q-42, Q-43, Q-45 or the sign-up default. No code, no test, no gate, no contract.

## Capability checks

- [x] R-70 to R-73 exist after R-69, in the format of R-60 to R-69, each "(owner, 19 Oct 2026)".
- [x] Each place that quoted Q-42, Q-43, Q-44 or Q-45, or the default each replaces, points at its ruling.
- [x] `python3 scripts/tasks/check_tasks.py` passes and `tasks/INDEX.md` is current.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/OWNER-1019.md](history/OWNER-1019.md).

## Owner sign-off

Not needed.
