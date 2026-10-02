import { Image, type ImageSource } from 'expo-image';
import { useEffect, useRef, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { ICON_STROKE, Icon, VerifiedTick, type IconName } from '@/components/icon';
import { font, layout, motion, radius, space, text, type, useWawu } from '@/theme';
import type { ColorToken } from '@/theme';

import { feesTotalKobo, formatNaira, nairaParts, payTotalKobo, shortfallKobo, type PayFeeLine } from './money';

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
   * adds them up (owner ruling, DECISIONS.md). The Total row always shows.
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

/** Purchase rows show a whole price as "₦2,500"; send rows show every kobo, faded (the kit's `Amt`). */
function money(p: PaySheetProps, kobo: number, color?: string) {
  return p.variant === 'send' ? <Amount kobo={kobo} color={color} /> : formatNaira(kobo);
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
  const { colors } = useWawu();
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
      <PillButton label="Open your wallet" onPress={p.onOpenWallet} />
    ) : (
      <PillButton
        label={paying ? 'Paying' : send ? `${p.actionLabel} ${formatNaira(p.total)}` : `${p.actionLabel} · ${formatNaira(p.total)}`}
        onPress={pay}
        busy={paying}
        disabled={paying || p.wallet.kind === 'loading'}
      />
    );
  const gets = p.recipientGetsKobo !== undefined && (
    <Text style={[text.secondary, styles.centre, { color: colors.textSecondary }]}>
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
          <Text accessibilityRole="alert" style={[styles.bannerTitle, { color: colors.textPrimary }]}>
            Not enough in your {p.walletName}
          </Text>
          <Text style={[text.secondary, { color: colors.textSecondary }]}>
            This costs {formatNaira(p.total)}. You have {formatNaira(p.balanceKobo, 'always')}.
          </Text>
        </View>
      </View>
      <Card>
        <Row label={p.amountLabel ?? (send ? 'Amount' : 'Price')} value={money(p, p.amountKobo)} first />
        <FeeRows p={p} />
        <Row label={p.walletName} value={<Amount kobo={p.balanceKobo} color={colors.danger} />} />
        <Row label="Top up at least" value={money(p, p.short)} />
      </Card>
    </>
  );
  const buttons = (
    <View style={styles.buttons}>
      <PillButton label={`Add ${formatNaira(p.short)}`} onPress={() => p.onAddMoney(p.short)} icon="Plus" />
      <PillButton label="Cancel" onPress={p.onCancel} quiet />
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
        {p.onRefresh && <PillButton label="Refresh" onPress={p.onRefresh} icon="RotateCcw" />}
        {p.onContactSupport && <PillButton label="Contact support" onPress={p.onContactSupport} quiet />}
        {!p.onRefresh && !p.onContactSupport && <PillButton label="Close" onPress={p.onCancel} quiet />}
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
        icon={<Icon name="CircleX" size={ICON_STATUS} color={colors.danger} strokeWidth={STATUS_STROKE} />}
        title="Payment didn't go through"
        line={p.message ?? `Your payment of ${formatNaira(p.total)} didn't complete. Check your ${p.walletName} before you try again.`}
      />
      <View style={styles.buttons}>
        {p.onRetry && <PillButton label="Try again" onPress={p.onRetry} />}
        <PillButton label="Cancel" onPress={p.onCancel} quiet />
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
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>
          {item.title}
        </Text>
        {(item.by !== undefined || item.subtitle !== undefined || item.verified) && (
          <View style={[styles.inline, styles.subtitle]}>
            {item.by !== undefined && <Text style={[styles.meta, { color: colors.textMuted }]}>{item.by}</Text>}
            {item.by !== undefined && tick}
            {item.subtitle !== undefined && (
              <Text style={[styles.meta, styles.flex, { color: colors.textMuted }]} numberOfLines={1}>
                {item.by !== undefined ? `· ${item.subtitle}` : item.subtitle}
              </Text>
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

/** W10's head: the recipient's avatar, "Sending to <name>", and the amount. */
function SendHeader({ item, amountKobo }: { item: PayItem; amountKobo: number }) {
  const { colors } = useWawu();
  return (
    <View style={styles.sendHead}>
      {item.avatar && (
        <View style={[styles.avatar, { backgroundColor: colors[HUE[item.avatar.hue]] }]}>
          <Text style={[styles.avatarText, { color: colors.textOnLight }]}>{item.avatar.initials}</Text>
        </View>
      )}
      <Text style={[text.secondary, styles.sendingTo, { color: colors.textMuted }]}>Sending to {item.title}</Text>
      <Amount kobo={amountKobo} size={type.size.display} />
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

function Row({ label, value, first, strong }: { label: string; value: ReactNode; first?: boolean; strong?: boolean }) {
  const { colors } = useWawu();
  return (
    <View style={[styles.row, !first && { borderTopWidth: LINE, borderTopColor: colors.borderHairline }]}>
      <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>{label}</Text>
      {typeof value === 'string' ? (
        <Text style={[styles.rowValue, strong && font(700), { color: colors.textPrimary }]} numberOfLines={1}>
          {value}
        </Text>
      ) : (
        value
      )}
    </View>
  );
}

/**
 * An amount as the kit's `Amt` draws it: naira at full size, then the kobo at
 * 0.72 of the size and half opacity ("₦25,065" + ".00").
 */
function Amount({
  kobo,
  color,
  size = ROW_VALUE,
  weight = 600,
}: {
  kobo: number;
  color?: string;
  size?: number;
  weight?: 500 | 600 | 700;
}) {
  const { colors } = useWawu();
  const parts = nairaParts(kobo);
  return (
    <Text
      style={[
        styles.money,
        font(weight),
        { fontSize: size, letterSpacing: type.tracking.heading * size, color: color ?? colors.textPrimary },
      ]}
      numberOfLines={1}
    >
      {parts.naira}
      <Text style={[styles.kobo, { fontSize: size * KOBO_SCALE }]}>.{parts.kobo}</Text>
    </Text>
  );
}

function WalletCard({ wallet, walletName }: { wallet: PayWallet; walletName: string }) {
  const { colors } = useWawu();
  let line: ReactNode;
  if (wallet.kind === 'open') {
    line = (
      <Text style={[styles.walletLine, { color: colors.textMuted }]}>
        {walletName} · <Amount kobo={wallet.balanceKobo} color={colors.textMuted} size={WALLET_LINE} weight={500} />{' '}
        available
      </Text>
    );
  } else if (wallet.kind === 'none') {
    line = <Text style={[styles.walletLine, { color: colors.textMuted }]}>{"You don't have a wallet yet"}</Text>;
  } else {
    line = (
      <View style={styles.inline}>
        <ActivityIndicator size="small" color={colors.textMuted} />
        <Text style={[styles.walletLine, { color: colors.textMuted }]}>Checking your balance</Text>
      </View>
    );
  }
  return (
    <View style={[styles.card, styles.walletCard, { backgroundColor: colors.surfaceCard, borderColor: colors.borderHairline }]}>
      <View style={[styles.coin, { backgroundColor: colors.curNgn }]}>
        <Text style={[styles.coinMark, { color: colors.textOnAccent }]}>₦</Text>
      </View>
      <View style={styles.flex}>
        <Text style={[styles.walletTitle, { color: colors.textPrimary }]}>Pay from wallet</Text>
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
      <Text accessibilityRole="header" style={[text.h1, styles.centre, { color: colors.textPrimary }]}>
        {title}
      </Text>
      <Text style={[text.secondary, styles.centre, { color: colors.textSecondary }]}>{line}</Text>
    </View>
  );
}

/**
 * The canvas pay button (kit `Btn`, size lg). Local to this sheet until
 * UI-01's Button lands (SHARED-CHANGES.md); it adopts that one then.
 */
function PillButton({
  label,
  onPress,
  quiet,
  busy,
  disabled,
  icon,
}: {
  label: string;
  onPress: () => void;
  quiet?: boolean;
  busy?: boolean;
  disabled?: boolean;
  icon?: IconName;
}) {
  const { colors } = useWawu();
  const fg = quiet ? colors.textPrimary : colors.textOnAccent;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled, busy: !!busy }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        quiet
          ? { backgroundColor: colors.surfaceCard, borderColor: colors.borderHairline, borderWidth: LINE }
          : { backgroundColor: pressed ? colors.accentPress : colors.accent },
        disabled && !busy && styles.dim,
      ]}
    >
      {busy && <ActivityIndicator size="small" color={fg} />}
      {icon && <Icon name={icon} size={ICON_BUTTON} color={fg} strokeWidth={ICON_STROKE.button} />}
      <Text style={[styles.buttonLabel, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

/** The canvas draws every rule, card edge and outline at 1 px. */
const LINE = 1;
/** The canvas nudges a few things by 2 px off the 4-point scale. */
const NUDGE = space.xs / 2;
/** The canvas pay button is 54 px tall: the control height plus 6. */
const BUTTON_H = layout.controlH + space.xs + NUDGE;
const THUMB = layout.controlH + space.sm; // 56
const COIN = layout.tapMin - space.sm; // 36
const AVATAR = space.s3xl * 2; // 64, W10's Av(..., 64)
/** Icon sizes the artboards pass to I(): banner 19, button 19, check 20, status 32; the tick 13. */
const ICON_BANNER = space.xl - 1;
const ICON_BUTTON = space.xl - 1;
const ICON_CHECK = space.xl;
const ICON_STATUS = space.s3xl;
const TICK = space.md + 1;
/** H18 strokes its 32 px status mark at 2.4, the kit's heaviest stroke. */
const STATUS_STROKE = ICON_STROKE.fab;
/** The kit's `Amt`: row amounts at 14.5, kobo at 0.72 of the size. */
const ROW_VALUE = type.size.body - 0.5;
const WALLET_LINE = type.size.sec - 0.5;
const KOBO_SCALE = 0.72;

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
  title: { ...font(600), fontSize: type.size.h3, lineHeight: Math.round(type.size.h3 * type.leading.snug) },
  subtitle: { marginTop: space.xs - 1 },
  meta: { ...font(400), fontSize: type.size.sec - 0.5 },
  sendHead: { alignItems: 'center', gap: space.xs + NUDGE, paddingTop: space.xs + NUDGE },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: radius.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...font(700), fontSize: Math.round(AVATAR * 0.36), letterSpacing: -0.02 * Math.round(AVATAR * 0.36) },
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
  rowLabel: { ...font(400), fontSize: type.size.sec + 0.5, flexShrink: 0 },
  rowValue: {
    ...font(600),
    fontSize: ROW_VALUE,
    letterSpacing: type.tracking.heading * ROW_VALUE,
    textAlign: 'right',
    flexShrink: 1,
  },
  money: { fontVariant: ['tabular-nums', 'lining-nums'] },
  kobo: { opacity: 0.5 },
  walletCard: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md + NUDGE },
  coin: { width: COIN, height: COIN, borderRadius: radius.chip, alignItems: 'center', justifyContent: 'center' },
  coinMark: { ...font(700), fontSize: type.size.h3 + 0.5 },
  walletTitle: { ...font(600), fontSize: type.size.body },
  walletLine: { ...font(400), fontSize: WALLET_LINE, marginTop: NUDGE },
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
    borderRadius: radius.tile,
    paddingVertical: space.md + NUDGE,
    paddingHorizontal: space.lg,
  },
  bannerIcon: { paddingTop: NUDGE / 2 },
  bannerTitle: { ...font(600), fontSize: type.size.body - 0.5, marginBottom: NUDGE + 1 },
  buttons: { gap: space.sm + NUDGE },
  button: {
    height: BUTTON_H,
    borderRadius: radius.button,
    paddingHorizontal: space.s2xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm - 1,
  },
  buttonLabel: { ...font(700), fontSize: type.size.h3, letterSpacing: -0.01 * type.size.h3 },
  dim: { opacity: 0.5 },
  status: { alignItems: 'center', gap: space.sm + NUDGE },
  statusMark: {
    width: layout.tapMin + space.s3xl - space.xs,
    height: layout.tapMin + space.s3xl - space.xs,
    borderRadius: radius.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
