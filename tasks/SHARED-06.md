---
id: SHARED-06
title: Shared components, theme tokens and the API client take the requests screens left in SHARED-CHANGES
owner: YOU
area: SHARED
order: 229
priority: launch
repo: wawu-wmt-mobile
type: component
status: verifying
depends_on: [SHARED-05]
decisions: []
passes: [V1, V2, V5, V6, V7]
artboards: []
---
# SHARED-06 · Shared components, theme tokens and the API client take the requests screens left in SHARED-CHANGES

## Current state

As of 17 Oct 2026 (builder, Sonnet, round 1; mobile `wmt/SHARED-06` from `origin/wmt/MERGE-7` f45ffbd; no backend or wawu-id change).
- **Status:** verifying. 17 of the 19 rows are applied and marked in SHARED-CHANGES.md; 2 are listed below with the reason.
- **Applied (screens moved off their stand-ins, stand-ins deleted):**
  - Tokens: `--shadow-lift`, `--shadow-knob` and the `media-*` overlay colours are theme tokens (`design/_ds/wawu/tokens/elevation.css`, generator prefix `media-`); `shadow.ts` and `atStrength` are gone (row 7, HOME-02 #1).
  - API: `ApiError.detail` and `retryAfterSeconds: number | null` (reason, else `Retry-After*` headers); `changePassword` and `logoutRequest` in `src/api/identity.ts`; `replaceTokens` in `src/api/session.ts` (the password screen uses it); `nairaToKobo` in `src/api/kobo.ts`. `check.ts`, `StepRefusal` and `settings/api/identity.ts` are deleted (KYC-02 #4, KYC-05 #3, SETTINGS-01 #1, HOME-02 #3).
  - Components: `Banner`, `Switch`, `SwitchRow`, `ScreenFrame` (with `action`), `PinDots` (and `Keypad` on the barrel), `TextField` (`mono`, `onPress` with `trailingIcon`, `tone`, `multiline` with `max`), `ListRow` (`subtitleLines`), `PaySheet` (`onOpenWallet`), `Button` (`selected`, `count`, size `pill`) and `IconButton tone="lift"`; four social marks (AUTH-01 #4, KYC-05 #1, KYC-05 #2, WALLET-11 #1, ME-11 #2, SETTINGS-02 #2, KYC-04 #2, ME-06 #4, SETTINGS-01 #2, HOME-09 #5, ME-06 #2).
  - Deleted stand-ins: `BankField`, `NameLineView`, `BioField`, `LongField`, `SettingsFrame`, `AboutFrame`, `EditFrame`, the settings `Switch` and `SwitchRow`, About's `WrapRow`, the pay sheet's own banner, the three PIN dots rows.
- **Not applied, needs the lead:**
  - **HOME-02 #4 (`TabBar` `tone: 'media'`).** More than a prop: the bar floats over the feed and the post runs under it, so the feed's own geometry (`fromPostBottom`, `metrics.tabbar`) and all five post layouts change, and the canvas's look has to be pictured against the build. Its own task.
  - **Row 11 (`unwrap` resolves with `data`).** About 60 calls in 40 files read `body.data` from the whole body and cast it (`as unknown as Envelope<T>`); changing `unwrap` alone breaks all of them. A mechanical codemod, then each file's tests. Its own task.
- **Look changes the rows ask for (everything else matches pixel for pixel, see the report):** the pay sheet with no wallet draws "Open your wallet"; the TGIF arrow is a 16% white disc and its pills 40 high at 600; M8's Bio and P5's About are the kit's 76 high box with a border ring (P5 was 80 with an inset ring); H4's book cover is the canvas's #3B0B54; the four social rows show the logo and not the platform word; the Bank field and the name line keep their sizes.
- **Left as is:** `src/features/wallet/statements/ValueField.tsx` is a read-only and section-label variant that WALLET-11 #1 does not cover; `Note` in `pro-listing/parts.tsx` is a second banner (not named by a row).
- **Next:** a verifier; the lead decides HOME-02 #4 and row 11.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows; section 4, fenced files: this task IS the lead's shared-change pass, so it may edit the fenced files its rows name, and nothing else that is fenced)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `SHARED-CHANGES.md` rows: 7, AUTH-01 #4, KYC-05 #1, KYC-05 #2, WALLET-11 #1, ME-11 #2, SETTINGS-02 #2, KYC-04 #2, ME-06 #4, SETTINGS-01 #2, HOME-09 #5, HOME-02 #4, HOME-02 #1, KYC-02 #4, KYC-05 #3, 11 (MONEY-11), SETTINGS-01 #1, HOME-02 #3, ME-06 #2 (each row says what to change and why; the status cells were audited on 8 Oct 2026, mobile `fb01391`)
- `src/components/ui/` (the barrel), `src/theme/`, `src/api/`; each row's raising task file

## Goal

Nineteen rows ask for a prop on a shared component, a theme token, an API-client change or an icon, and none were applied, so screens carry local stand-ins (named constants, local helpers, a deprecated path). Nothing is broken for a person today; the stand-ins drift.

## Scope

- Apply each row as written: the shared props and new shared pieces (`Banner`, `Switch`, `SwitchRow`, `ScreenFrame`, `PinDots`, the `TextField` and `Button` props), the shadow and overlay tokens (delete `shadow.ts` and `atStrength` once nothing uses them), the API client rows (`ApiError.detail`, `retryAfterSeconds`, `unwrap`, `changePassword` and `logoutRequest` in `src/api/identity.ts`, `nairaToKobo` into `src/api/`), and the four social icons.
- Then move each raising screen off its stand-in, so there is one copy of each thing. A screen must look and behave the same before and after (screenshots of every touched screen, light and dark).
- Mark each row applied. Rows that need a ruling are listed, not guessed.

## Capability checks

- [ ] Every row applied or listed with the reason.
- [ ] Every touched screen pictured before and after, identical except where a row says otherwise.
- [ ] No local stand-in left that a row names (grep).
- [ ] `npm run check` exit 0.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/SHARED-06.md](history/SHARED-06.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
