import { Image, type ImageSource } from 'expo-image';
import { useEffect, useRef, type ReactNode } from 'react';
import { ActivityIndicator, Text as NativeText, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { ICON_STROKE, Icon, VerifiedTick } from '@/components/icon';
import { Money } from '@/components/Money';
import { Text } from '@/components/Text';
import { font, layout, motion, radius, space, type, useWawu } from '@/theme';
import type { ColorToken } from '@/theme';

import { feesTotalKobo, formatNaira, payTotalKobo, shortfallKobo, type PayFeeLine } from './money';

/** The canvas's avatar hues (`Av(name, hue)`). */
export type PayAvatarHue = 'lilac' | 'lemon' | 'green' | 'sky' | 'pink' | 'coral' | 'sand';

/** What is being paid for, or who is being paid: the header. */
export type PayItem = {
  /** The purchase ("How I built a ₦2M a month agency"), or the person a send goes to. */
  title: string;
  /** Who sells it, first on the line under the title ("Chidi Eze"). */
  by?: string;
  /** The seller's tick, drawn after their name as H14 draws it: purple for creators, blue for professionals. */
  verified?: 'creator' | 'pro';
  /** The rest of the line under the title, e.g. "Video · 18 min". */
  subtitle?: string;
  /** Thumbnail: a URL, or a bundled image (`require(...)`). Left out, the header is the title alone. */
  image?: ImageSource | string | number;
  /** Send: the recipient's initials and avatar hue (W10). */
  avatar?: { initials: string; hue: PayAvatarHue };
};

/** A row that describes the payment and is not money ("Yours: Forever, in My purchases"). */
export type PayDetailRow = { label: string; value: string };

/**
 * The payer's wallet, as the money core reports it. Fintava's balance is the
 * truth: `balanceKobo` is what the wallet endpoint returned, never a sum.
 */
export type PayWallet =
  | { kind: 'loading' }
  /** No wallet opened yet (R-6). The sheet hands over to "Open your wallet". */
  | { kind: 'none' }
  | { kind: 'open'; balanceKobo: number };

/** Where the payment is. `review` shows "enough" or "not enough" from the balance. */
export type PayStatus =
  | { kind: 'review' }
  | { kind: 'paying' }
  /** The debit was sent and its result has not come back yet. */
  | { kind: 'confirming' }
  /** The payment did not complete. `message` says why, when the server said. */
  | { kind: 'failed'; message?: string };

export type PaySheetProps = {
  /**
   * `purchase` (default): the bottom sheet of H14 and H17, whole-naira prices.
   * `send`: W10's review body. The recipient and the amount lead, every amount
   * shows its kobo faded, and the host screen supplies the nav bar.
   */
  variant?: 'purchase' | 'send';
  item: PayItem;
  /** The price or the amount sent, in kobo, before any fee. */
  amountKobo: number;
  /** Label for the price row (purchase). Default "Price". */
  amountLabel?: string;
  /** Rows before the fees that are not money (Yours; Bank, Account). */
  details?: readonly PayDetailRow[];
  /**
   * The fee breakdown from the fee quote, one line per part (Fintava's charge,
   * WAWU's fee). Any part can be zero. With two or more parts a "Fees" row
   * adds them up (DECISIONS.md R-23). The Total row always shows.
   */
  fees: readonly PayFeeLine[];
  /** Rows after Total that are not money (W10's Note). */
  notes?: readonly PayDetailRow[];
  wallet: PayWallet;
  /** The wallet's name, e.g. "Naira wallet". */
  walletName: string;
  /** The verb on the pay button: "Unlock" gives "Unlock · ₦2,523.25"; a send gives "Send ₦25,065". */
  actionLabel: string;
  /** When another person receives a set amount (a send), say what arrives. */
  recipientGetsKobo?: number;
  status: PayStatus;
  /**
   * Pay the total. The caller opens the PIN sheet next. A second tap is
   * ignored until `status` changes or the returned promise settles; a caller
   * that returns nothing gets a short guard against a double tap.
   */
  onPay: () => void | Promise<unknown>;
  /** Top up by at least the shortfall (kobo), then come back. */
  onAddMoney: (shortfallKobo: number) => void;
  /** No wallet yet: start "Open your wallet" (MONEY-13). */
  onOpenWallet: () => void;
  onCancel: () => void;
  /** Failed: try the same payment again. */
  onRetry?: () => void;
  /** Still confirming: ask the server again. */
  onRefresh?: () => void;
  onContactSupport?: () => void;
};

/**
 * The pay-from-wallet sheet (H14, H17; W10 as the `send` variant). For a
 * purchase this is the panel only: presenting it (scrim, slide, drag to
 * dismiss) is the sheet host's job.
 *
 * The total is the price plus every fee line, added here in kobo, so the
 * breakdown, the Total row, the pay button and any shortfall always agree
 * (brief rule 5).
 */
export function PaySheet(props: PaySheetProps) {
  const { colors } = useWawu();
  const total = payTotalKobo(props.amountKobo, props.fees);
  const { wallet, status } = props;
  const send = props.variant === 'send';
  const short = wallet.kind === 'open' ? shortfallKobo(total, wallet.balanceKobo) : 0;

  let body: ReactNode;
  if (status.kind === 'confirming') {
    body = <Confirming {...props} total={total} />;
  } else if (status.kind === 'failed') {
    body = <Failed {...props} total={total} message={status.message} />;
  } else if (wallet.kind === 'open' && short > 0 && status.kind === 'review') {
    body = <NotEnough {...props} total={total} balanceKobo={wallet.balanceKobo} short={short} />;
  } else {
    body = <Review {...props} total={total} />;
  }

  if (send) {
    return <View style={[styles.page, { backgroundColor: colors.surfacePage }]}>{body}</View>;
  }
  return (
    <View
      accessibilityViewIsModal
      style={[styles.sheet, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderHairline }]}
    >
      <View style={[styles.handle, { backgroundColor: colors.borderStrong }]} />
      {body}
    </View>
  );
}

type Inner = PaySheetProps & { total: number };

/** A second tap on Pay does nothing until the payment has moved on. */
function usePayOnce(onPay: PaySheetProps['onPay'], statusKind: PayStatus['kind']) {
  const held = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    held.current = false;
  }, [statusKind]);
  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current);
    },
    [],
  );
  return () => {
    if (held.current) return;
    held.current = true;
    const release = () => {
      held.current = false;
      timer.current = null;
    };
    const result = onPay();
    if (result instanceof Promise) result.then(release, release);
    else timer.current = setTimeout(release, motion.slow);
  };
}

/**
 * A row amount, the kit's `Amt(v, { size: 14.5 })`. Purchase rows drop a whole
 * price's ".00" as H14 does (`dec: false`) but never hide real kobo; send rows
 * show every kobo, faded, as W10 does.
 */
function money(p: PaySheetProps, kobo: number, tone?: ColorToken) {
  return <Money minorUnits={kobo} size={ROW_VALUE} decimals={p.variant === 'send' || kobo % 100 !== 0} tone={tone} />;
}

function FeeRows({ p }: { p: PaySheetProps }) {
  return (
    <>
      {p.fees.map((f) => <Row key={f.label} label={f.label} value={money(p, f.amountKobo)} />)}
      {p.fees.length > 1 && <Row label="Fees" value={money(p, feesTotalKobo(p.fees))} />}
    </>
  );
}

function Review(p: Inner) {
  const paying = p.status.kind === 'paying';
  const pay = usePayOnce(p.onPay, p.status.kind);
  const send = p.variant === 'send';
  const card = (
    <Card>
      {send ? (
        p.details?.map((d, i) => <Row key={d.label} label={d.label} value={d.value} first={i === 0} />)
      ) : (
        <>
          <Row label={p.amountLabel ?? 'Price'} value={formatNaira(p.amountKobo)} first />
          {p.details?.map((d) => <Row key={d.label} label={d.label} value={d.value} />)}
        </>
      )}
      <FeeRows p={p} />
      <Row label="Total" value={money(p, p.total)} first={send && !p.details?.length && p.fees.length === 0} />
      {p.notes?.map((d) => <Row key={d.label} label={d.label} value={d.value} />)}
    </Card>
  );
  const action =
    p.wallet.kind === 'none' ? (
      <Button label="Open your wallet" onPress={p.onOpenWallet} full />
    ) : (
      <Button
        label={paying ? 'Paying' : send ? `${p.actionLabel} ${formatNaira(p.total)}` : `${p.actionLabel} · ${formatNaira(p.total)}`}
        onPress={pay}
        loading={paying}
        disabled={p.wallet.kind === 'loading'}
        full
      />
    );
  const gets = p.recipientGetsKobo !== undefined && (
    <Text variant="secondary" style={styles.centre}>
      They get {formatNaira(p.recipientGetsKobo)}
    </Text>
  );

  if (send) {
    return (
      <>
        <View style={styles.sendBody}>
          <SendHeader item={p.item} amountKobo={p.amountKobo} />
          {card}
          <WalletCard wallet={p.wallet} walletName={p.walletName} />
        </View>
        <View style={styles.foot}>
          {gets}
          {action}
        </View>
      </>
    );
  }
  return (
    <>
      <Header item={p.item} />
      {card}
      <WalletCard wallet={p.wallet} walletName={p.walletName} />
      {gets}
      {action}
    </>
  );
}

function NotEnough(p: Inner & { balanceKobo: number; short: number }) {
  const { colors } = useWawu();
  const send = p.variant === 'send';
  const content = (
    <>
      {send ? <SendHeader item={p.item} amountKobo={p.amountKobo} /> : <Header item={p.item} />}
      <View style={[styles.banner, { backgroundColor: colors.warningTint }]}>
        <View style={styles.bannerIcon}>
          <Icon name="Wallet" size={ICON_BANNER} color={colors.warning} strokeWidth={ICON_STROKE.button} />
        </View>
        <View style={styles.flex}>
          <NativeText accessibilityRole="alert" style={[styles.kvValue, styles.bannerTitle, { color: colors.textPrimary }]}>
            Not enough in your {p.walletName}
          </NativeText>
          <NativeText style={[styles.meta, styles.bannerLine, { color: colors.textSecondary }]}>
            This costs {formatNaira(p.total)}. You have {formatNaira(p.balanceKobo, 'always')}.
          </NativeText>
        </View>
      </View>
      <Card>
        <Row label={p.amountLabel ?? (send ? 'Amount' : 'Price')} value={money(p, p.amountKobo)} first />
        <FeeRows p={p} />
        <Row label={p.walletName} value={<Money minorUnits={p.balanceKobo} size={ROW_VALUE} tone="danger" />} />
        <Row label="Top up at least" value={money(p, p.short)} />
      </Card>
    </>
  );
  const buttons = (
    <View style={styles.buttons}>
      <Button label={`Add ${formatNaira(p.short)}`} onPress={() => p.onAddMoney(p.short)} icon="Plus" full />
      <Button label="Cancel" onPress={p.onCancel} variant="secondary" full />
    </View>
  );
  if (send) {
    return (
      <>
        <View style={styles.sendBody}>{content}</View>
        <View style={styles.foot}>{buttons}</View>
      </>
    );
  }
  return (
    <>
      {content}
      {buttons}
    </>
  );
}

function Confirming(p: Inner) {
  const { colors } = useWawu();
  return (
    <>
      <Status
        tint={colors.warningTint}
        icon={<Icon name="Clock" size={ICON_STATUS} color={colors.warning} strokeWidth={STATUS_STROKE} />}
        title="Still confirming"
        line={`Your payment of ${formatNaira(p.total)} hasn't been confirmed yet. Check again before you pay a second time.`}
      />
      <View style={styles.buttons}>
        {p.onRefresh && <Button label="Refresh" onPress={p.onRefresh} icon="RotateCcw" full />}
        {p.onContactSupport && <Button label="Contact support" onPress={p.onContactSupport} variant="secondary" full />}
        {!p.onRefresh && !p.onContactSupport && <Button label="Close" onPress={p.onCancel} variant="secondary" full />}
      </View>
    </>
  );
}

function Failed(p: Inner & { message?: string }) {
  const { colors } = useWawu();
  return (
    <>
      <Status
        tint={colors.dangerTint}
        icon={<Icon name="X" size={ICON_STATUS} color={colors.danger} strokeWidth={STATUS_STROKE} />}
        title="Payment didn't go through"
        line={p.message ?? `Your payment of ${formatNaira(p.total)} didn't complete. Check your ${p.walletName} before you try again.`}
      />
      <View style={styles.buttons}>
        {p.onRetry && <Button label="Try again" onPress={p.onRetry} full />}
        <Button label="Cancel" onPress={p.onCancel} variant="secondary" full />
      </View>
    </>
  );
}

function Header({ item }: { item: PayItem }) {
  const { colors } = useWawu();
  const tick = item.verified && <VerifiedTick kind={item.verified} size={TICK} />;
  return (
    <View style={styles.header}>
      {item.image !== undefined && (
        <Image
          source={item.image}
          contentFit="cover"
          style={[styles.thumb, { backgroundColor: colors.surfaceSunken }]}
          accessibilityIgnoresInvertColors
        />
      )}
      <View style={styles.flex}>
        <Text variant="h3" numberOfLines={2}>
          {item.title}
        </Text>
        {(item.by !== undefined || item.subtitle !== undefined || item.verified) && (
          <View style={[styles.inline, styles.subtitle]}>
            {item.by !== undefined && <NativeText style={[styles.meta, { color: colors.textMuted }]}>{item.by}</NativeText>}
            {item.by !== undefined && tick}
            {item.subtitle !== undefined && (
              <NativeText style={[styles.meta, styles.flex, { color: colors.textMuted }]} numberOfLines={1}>
                {item.by !== undefined ? `· ${item.subtitle}` : item.subtitle}
              </NativeText>
            )}
            {item.by === undefined && tick}
          </View>
        )}
      </View>
    </View>
  );
}

const HUE: Record<PayAvatarHue, ColorToken> = {
  lilac: 'hueLilac',
  lemon: 'hueLemon',
  green: 'hueGreen',
  sky: 'hueSky',
  pink: 'huePink',
  coral: 'hueCoral',
  sand: 'hueSand',
};

/**
 * W10's head: the recipient's avatar, "Sending to <name>", and the amount.
 * The avatar is the kit's `Av`; a shared one is requested (SHARED-CHANGES.md section 1 row 8).
 */
function SendHeader({ item, amountKobo }: { item: PayItem; amountKobo: number }) {
  const { colors } = useWawu();
  return (
    <View style={styles.sendHead}>
      {item.avatar && (
        <View style={[styles.avatar, { backgroundColor: colors[HUE[item.avatar.hue]] }]}>
          <NativeText style={[styles.avatarText, { color: colors.textOnLight }]}>{item.avatar.initials}</NativeText>
        </View>
      )}
      <Text variant="secondary" tone="textMuted" style={styles.sendingTo}>
        Sending to {item.title}
      </Text>
      <Money minorUnits={amountKobo} size={type.size.display} />
    </View>
  );
}

function Card({ children }: { children: ReactNode }) {
  const { colors } = useWawu();
  return (
    <View style={[styles.card, { backgroundColor: colors.surfaceCard, borderColor: colors.borderHairline }]}>
      {children}
    </View>
  );
}

function Row({ label, value, first }: { label: string; value: ReactNode; first?: boolean }) {
  const { colors } = useWawu();
  return (
    <View style={[styles.row, !first && { borderTopWidth: LINE, borderTopColor: colors.borderHairline }]}>
      <NativeText style={[styles.kvLabel, { color: colors.textSecondary }]}>{label}</NativeText>
      {typeof value === 'string' ? (
        <NativeText style={[styles.kvValue, styles.rowValue, { color: colors.textPrimary }]} numberOfLines={1}>
          {value}
        </NativeText>
      ) : (
        value
      )}
    </View>
  );
}

function WalletCard({ wallet, walletName }: { wallet: PayWallet; walletName: string }) {
  const { colors } = useWawu();
  let line: ReactNode;
  if (wallet.kind === 'open') {
    line = (
      <NativeText style={[styles.meta, styles.walletLine, { color: colors.textMuted }]}>
        {walletName} · <Money minorUnits={wallet.balanceKobo} size={META} weight={500} tone="textMuted" /> available
      </NativeText>
    );
  } else if (wallet.kind === 'none') {
    line = <NativeText style={[styles.meta, styles.walletLine, { color: colors.textMuted }]}>{"You don't have a wallet yet"}</NativeText>;
  } else {
    line = (
      <View style={styles.inline}>
        <ActivityIndicator size="small" color={colors.textMuted} />
        <NativeText style={[styles.meta, { color: colors.textMuted }]}>Checking your balance</NativeText>
      </View>
    );
  }
  return (
    <View style={[styles.card, styles.walletCard, { backgroundColor: colors.surfaceCard, borderColor: colors.borderHairline }]}>
      {/* The kit's `Flag('NGN', 36)`; a shared one is requested (SHARED-CHANGES.md section 1 row 8). */}
      <View style={[styles.coin, { backgroundColor: colors.curNgn }]}>
        <NativeText style={[styles.coinMark, { color: colors.textOnAccent }]}>₦</NativeText>
      </View>
      <View style={styles.flex}>
        <NativeText style={[styles.walletTitle, { color: colors.textPrimary }]}>Pay from wallet</NativeText>
        {line}
      </View>
      {wallet.kind === 'open' && (
        <Icon name="CircleCheck" size={ICON_CHECK} color={colors.accentFg} strokeWidth={ICON_STROKE.button} />
      )}
    </View>
  );
}

function Status({ tint, icon, title, line }: { tint: string; icon: ReactNode; title: string; line: string }) {
  const { colors } = useWawu();
  return (
    <View style={styles.status}>
      <View style={[styles.statusMark, { backgroundColor: tint }]}>{icon}</View>
      <NativeText accessibilityRole="header" style={[styles.sheetTitle, styles.centre, { color: colors.textPrimary }]}>
        {title}
      </NativeText>
      <Text variant="secondary" style={styles.centre}>
        {line}
      </Text>
    </View>
  );
}

/** The canvas draws every rule, card edge and outline at 1 px. */
const LINE = 1;
/** The canvas nudges a few things by 2 px off the 4-point scale. */
const NUDGE = space.xs / 2;
const THUMB = layout.controlH + space.sm; // 56, home.js unlockSheet thumbnail
const COIN = layout.tapMin - space.sm; // 36, kit.js fromWallet `Flag('NGN', 36)`
const AVATAR = space.s3xl * 2; // 64, wallet.js W10 `Av(..., 64)`
/** Icon sizes the artboards pass to I(): banner 19 (kit `banner`), check 20 (kit `fromWallet`), status 32 (H18); the tick 13 (unlockSheet). */
const ICON_BANNER = space.xl - 1;
const ICON_CHECK = space.xl;
const ICON_STATUS = space.s3xl;
const TICK = space.md + 1;
/** H18 strokes its 32 px status mark at 2.4. The failed mark is W14's `X` (Send · failed), drawn at H18's sheet size. */
const STATUS_STROKE = ICON_STROKE.fab;
/** Kit `kv` value and `Amt(v, { size: 14.5 })`. */
const ROW_VALUE = type.size.body - 0.5;

/**
 * Copy sizes from the kit that no `Text` variant has yet. Each is filed as a
 * variant request in SHARED-CHANGES.md section 1 (row 6); the rest of the
 * sheet's copy uses `Text` (h3, secondary).
 */
const KV_LABEL = type.size.sec + 0.5; // 14, kit `kv` key
const META = type.size.sec - 0.5; // 13, unlockSheet meta line, `fromWallet` line, `banner` body
const CARD_TITLE = type.size.body; // 15 at 600, `fromWallet` title
const SHEET_TITLE = type.size.h1 - NUDGE; // 22 at 700, H18 `h1(..., { size: 22 })`
const SHEET_TITLE_LEADING = 1.15; // kit `h1` line height
const BANNER_LEADING = type.leading.body; // 1.45, kit `banner` body
const AVATAR_TEXT = Math.round(AVATAR * 0.36); // kit `Av`: 36% of the size
const COIN_TEXT = COIN * 0.46; // kit `Flag`: 46% of the size

const styles = StyleSheet.create({
  sheet: {
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    borderTopWidth: LINE,
    paddingTop: space.sm + NUDGE,
    paddingHorizontal: layout.gutter,
    paddingBottom: space.s3xl + NUDGE,
    gap: space.lg,
  },
  page: { flex: 1, paddingHorizontal: layout.gutter, paddingTop: space.sm, paddingBottom: space.s3xl + NUDGE },
  sendBody: { gap: space.lg + NUDGE },
  foot: { marginTop: 'auto', paddingTop: space.md, gap: space.sm + NUDGE },
  handle: {
    width: space.s3xl + space.sm,
    height: space.xs + 1,
    borderRadius: radius.chip,
    alignSelf: 'center',
    marginBottom: space.xs,
  },
  flex: { flex: 1, minWidth: 0 },
  centre: { textAlign: 'center' },
  inline: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  thumb: { width: THUMB, height: THUMB, borderRadius: radius.input - NUDGE },
  subtitle: { marginTop: space.xs - 1 },
  meta: { ...font(400), fontSize: META },
  sendHead: { alignItems: 'center', gap: space.xs + NUDGE, paddingTop: space.xs + NUDGE },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: radius.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...font(700), fontSize: AVATAR_TEXT, letterSpacing: -0.02 * AVATAR_TEXT },
  sendingTo: { marginTop: space.xs + NUDGE },
  card: {
    borderRadius: radius.card,
    borderWidth: LINE,
    paddingHorizontal: layout.cardPad,
    paddingVertical: NUDGE,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md + NUDGE,
    minHeight: layout.controlH + NUDGE,
    paddingVertical: space.md,
  },
  kvLabel: { ...font(400), fontSize: KV_LABEL, flexShrink: 0 },
  kvValue: { ...font(600), fontSize: ROW_VALUE },
  rowValue: { textAlign: 'right', flexShrink: 1 },
  walletCard: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md + NUDGE },
  coin: { width: COIN, height: COIN, borderRadius: radius.chip, alignItems: 'center', justifyContent: 'center' },
  coinMark: { ...font(700), fontSize: COIN_TEXT },
  walletTitle: { ...font(600), fontSize: CARD_TITLE },
  walletLine: { marginTop: NUDGE },
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
    borderRadius: radius.tile,
    paddingVertical: space.md + NUDGE,
    paddingHorizontal: space.lg,
  },
  bannerIcon: { paddingTop: NUDGE / 2 },
  bannerTitle: { marginBottom: NUDGE + 1 },
  bannerLine: { lineHeight: Math.round(META * BANNER_LEADING) },
  buttons: { gap: space.sm + NUDGE },
  sheetTitle: {
    ...font(700),
    fontSize: SHEET_TITLE,
    letterSpacing: -0.03 * SHEET_TITLE,
    lineHeight: Math.round(SHEET_TITLE * SHEET_TITLE_LEADING),
  },
  status: { alignItems: 'center', gap: space.sm + NUDGE },
  statusMark: {
    width: layout.tapMin + space.s3xl - space.xs,
    height: layout.tapMin + space.s3xl - space.xs,
    borderRadius: radius.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
