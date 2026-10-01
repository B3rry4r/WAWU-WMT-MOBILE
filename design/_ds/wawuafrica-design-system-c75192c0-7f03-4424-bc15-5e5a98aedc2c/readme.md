# WAWUAfrica Design System — mobile

The design system for the **WAWU mobile app**: a creator and professional platform with a real bank built in (via the BaaS partner **Fintava**: Naira, Dollar and crypto accounts, WAWU-branded Verve cards, transfers, withdrawals, bill payments). Light and dark are both first-class.

**Source of truth for screens:** `explorations/WAWU Mobile Board v2.html` — the approved board. The approved screens themselves (E1–E7, F1–F6) are in the Design System tab under **Approved screens**, rendered from the board's own code in dark and light (`explorations/screen-*.card.html`). Every production screen design starts from it. Components here are extracted from it one-to-one; if a screen and this system disagree, the board wins and the system gets updated.

## Sources

| Source | Where | What came from it |
|---|---|---|
| Approved mobile board | `explorations/WAWU Mobile Board v2.html` (+ `board-kit.jsx`, `home.jsx`, `feed.jsx`, `dir-*.jsx`) | Navigation model, every screen, every component and value in this system |
| Web app repo | `WAWUAfrica-main` (local) | Home tab structure (TGIF, "What would you like to do today?", creators), Explore structure, platform services list, taxonomy |
| Approved web references | `explorations/refs/` | Explore desktop structure (category tiles, featured creators, events, professional doors) |
| Brand guidelines | `uploads/NEW WAWU LOGO.pdf` | WAWU Purple, Alan Sans |
| Logo pack | `assets/` | Main mark and icon in three colourways |

## Navigation (locked)

**Bottom tabs: Home · Explore · Inbox · Wallet · Me.** Five, in that order, for every account type. **Create** is a purple floating button bottom-right above the tab bar (creator accounts only). Never add a sixth tab or move Create into the bar.

**Home has three top tabs:** **Today** (default) · **Following** · **For you**.
- **Today** is calm, on page chrome: the balance card (Naira · Send / Add / Bills / Scan), a one-line TGIF row, "What would you like to do today?" with exactly four services — **Pay bills, Events, Legal, Shop** — then "Creators to discover".
- **Following** and **For you** are full-bleed, immersive, and the tab bar goes translucent-dark. Every content type has its own frame: video, **photo set** (counter + dots + next-frame peek), **PDF/book** (standing cover, free pages), **locked** (frosted, Unlock / Subscribe from wallet), **audio** (art + waveform), and **creator** and **professional** profile cards that scroll in the feed with Follow / Book in place.

**Explore** is the faithful port of the approved web Explore: featured hero, category tiles, featured creators, upcoming events. **Inbox** is money-aware messaging (tips, paid DMs with countdowns, payment requests). **Wallet** is Naira / Dollar / Crypto with account number, actions, bills and transactions. **Me** is the full profile: cover, avatar, ticks, bio, **social handles directly above the follower counts**, stats, Content / Services / Shop / About.

## Product truths

- **Money is multi-currency now.** Naira (₦) is the default and the home currency. Dollar ($), USDT and BTC exist as accounts. Content prices are in Naira. Format with `formatMoney` / `<Amount>`; never hand-write currency strings.
- **Pay from wallet is the default everywhere** — unlocks, tips, bookings, tickets, bills. Say so near the price ("Pay from wallet", "Paid from Naira wallet · ₦X available").
- **Professional bookings are held in escrow** until the job is done — show the line "Payment held by WAWU until the job is done."
- **Messaging exists** (Inbox). Paid DMs hold the sender's money until the creator replies.
- **Ticks:** purple = verified creator, blue = verified professional; both can show.
- **Trust Score** (Basic 0 · Verified 100 · Gold 500 · Elite 1500 · Trusted Partner 5000) — breakdown only on the viewer's own profile.
- **Services on Home are four:** Pay bills, Events, Legal, Shop. Don't bring back the commissioned service art or the long services grid.

## Content fundamentals

Direct, second person, sentence case. Short verbs on buttons: "Send ₦25,000", "Unlock · ₦2,500", "Book Funmi", "Follow", "Get tickets". No exclamation marks, no emoji. Money always with the glyph and comma thousands; kobo shown small and dim on balances and ledger rows, dropped on prices.

## Visual foundations

**Colour.** One accent, WAWU Purple `#9411C9`, for the single primary action, the FAB, the active tab and date blocks. As text or icon on dark use `--accent-fg` (`#C368EA`) for contrast. Neutrals: dark page `#0B0A0D` → card `#16151B` → sunken `#221F29`; light page `#F6F5F8` → card `#FFFFFF` → sunken `#EEECF2`. Green `--positive` means money in. Currency discs and avatar hues are the only other colour. Set the theme with `data-theme="dark" | "light"` on any ancestor; dark is the `:root` default.

**Type.** Alan Sans only. Balance 40/600 · title 30/700 · H1 24/700 · section 18.5/700 · card title 16/600 · body 15 · secondary 13.5 · caption 12.5 · label 11/700 uppercase · tab 11. Tight negative tracking on everything above body. Tabular figures on all money.

**Shape.** Every button and chip is a pill. Tiles 18 · media 20 · list cards 22 · money card 26 · feed cards 30 · sheets 44. Borders are drawn as `inset 0 0 0 1px var(--border-hairline)`.

**Elevation.** Flat. Cards are a surface step plus a hairline. Shadows only on the FAB (purple glow), sheets, the debit card, and cover art in the feed. Chrome (tab bar, sticky headers) is translucent with a 20px blur.

**Imagery.** Photography is the payload: creator cards are the portrait, events and content are photo-first with a bottom scrim. Locked media is frosted (22px blur) with the price on a white pill. Placeholders live in `assets/mock/` and must be replaced with real creator photography.

**Motion.** One easing, `cubic-bezier(.32,.72,0,1)`. Press scales 0.98. Sheets slide up. Nothing bounces.

## Iconography

**Lucide** (`lucide@0.460.0`, loaded by `Icon`). PascalCase names. Stroke 1.8 resting, 2.2 active tab / emphasis. Active tab icons also take a tinted fill. Social platform marks come from Simple Icons via `SocialLinks` (monochrome, theme-matched). No emoji, no hand-drawn SVG.

## Components

**core/** — Icon · Button · IconButton · Chip · Segmented · Tabs · Avatar

**navigation/** — TabBar · CreateFab · HomeTabs · ScreenHeader

**money/** — Amount · CurrencyFlag · formatMoney · BalanceCard · AccountCard · TxRow · TxIcon · ServiceTile

**content/** — SectionHeader · SearchField · ExploreHero · CategoryTile · CreatorCard · VerifiedTicks · EventCard · DateBlock · TypeTag · TgifCard

**inbox/** — ConversationRow

**feed/** — FeedFrame · ActionRail · FeedCaption · Byline · OfferBar · LockedOverlay · FeedProfileCard

**identity/** — ProfileHeader · SocialLinks · ProfileStats

Everything here is lifted from an approved screen. Nothing from the discarded variants. New components are added only when a new screen is approved on the board.

Each directory has a `.card.html` that renders its components in dark and light side by side (via `guidelines/card-kit.js`); each component has a `.d.ts` contract.

## Building a screen

Screens are 390×844, `position: relative`, side padding `var(--gutter)` (20), sections `var(--section-gap)` (22) apart, content padded ~120px at the bottom to clear the tab bar. Place `<TabBar active="…" />` and (on creator accounts) `<CreateFab />` last. Full-bleed feed screens: `<FeedFrame>` + `<TabBar onDark />`.

## Assets

`assets/` — logo pack (`wawu-logo*.png`, `wawu-icon-*.png`), WAWUBasket / WAWUBeauty marks, partner logos, `mock/` placeholder imagery.
