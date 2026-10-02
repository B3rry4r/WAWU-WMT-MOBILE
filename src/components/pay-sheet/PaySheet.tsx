import { Image, type ImageSource } from 'expo-image';
import { useEffect, useRef, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { font, layout, motion, radius, space, text, type, useWawu } from '@/theme';

import { CheckRing, Clock, Cross, Plus, VerifiedTick, Wallet } from './glyphs';
import { feesTotalKobo, formatNaira, nairaParts, payTotalKobo, shortfallKobo, type PayFeeLine } from './money';

/** What is being paid for: the header of the sheet. */
export type PayItem = {
  title: string;
  /** Who sells it, first on the line under the title ("Chidi Eze"). */
  by?: string;
  /** The seller has a verification tick: drawn after their name, as H14 draws it. */
  verified?: boolean;
  /** The rest of the line under the title, e.g. "Video · 18 min". */
  subtitle?: string;
  /** Thumbnail: a URL, or a bundled image (`require(...)`). Left out, the header is the title alone. */
  image?: ImageSource | string | number;
};

/** A row that describes the purchase and is not money ("Yours: Forever, in My purchases"). */
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
  item: PayItem;
  /** The price, in kobo, before any fee. */
  amountKobo: number;
  /** Label for the price row. Default "Price". */
  amountLabel?: string;
  /** Rows under the price that are not money. */
  details?: readonly PayDetailRow[];
  /**
   * The fee breakdown from the fee quote, one line per part (Fintava's charge,
   * WAWU's fee). Any part can be zero. An empty list means the quote has no
   * fee lines; the Total row still shows.
   */
  fees: readonly PayFeeLine[];
  wallet: PayWallet;
  /** The wallet's name, e.g. "Naira wallet". */
  walletName: string;
  /** The verb on the pay button, e.g. "Unlock". The button adds " · <total>". */
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
 * The pay-from-wallet sheet (H14, H17; W10's wallet card and total). The panel
 * only: presenting it (scrim, slide, drag to dismiss) is the sheet host's job.
 *
 * The total is the price plus every fee line, added here in kobo, so the
 * breakdown, the Total row, the pay button and any shortfall always agree
 * (brief rule 5).
 */
export function PaySheet(props: PaySheetProps) {
  const { colors } = useWawu();
  const total = payTotalKobo(props.amountKobo, props.fees);
  const { wallet, status } = props;
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
  useEffect(() => {
    held.current = false;
  }, [statusKind]);
  return () => {
    if (held.current) return;
    held.current = true;
    const release = () => {
      held.current = false;
    };
    const result = onPay();
    if (result instanceof Promise) result.then(release, release);
    else setTimeout(release, motion.slow);
  };
}

function FeeRows({ fees }: { fees: readonly PayFeeLine[] }) {
  return (
    <>
      {fees.map((f) => <Row key={f.label} label={f.label} value={formatNaira(f.amountKobo)} />)}
      {fees.length > 1 && <Row label="Fees" value={formatNaira(feesTotalKobo(fees))} />}
    </>
  );
}

function Review(p: Inner) {
  const { colors } = useWawu();
  const paying = p.status.kind === 'paying';
  const pay = usePayOnce(p.onPay, p.status.kind);
  return (
    <>
      <Header item={p.item} />
      <Card>
        <Row label={p.amountLabel ?? 'Price'} value={formatNaira(p.amountKobo)} first />
        {p.details?.map((d) => <Row key={d.label} label={d.label} value={d.value} />)}
        <FeeRows fees={p.fees} />
        <Row label="Total" value={formatNaira(p.total)} strong />
      </Card>
      <WalletCard wallet={p.wallet} walletName={p.walletName} />
      {p.recipientGetsKobo !== undefined && (
        <Text style={[text.secondary, styles.centre, { color: colors.textSecondary }]}>
          They get {formatNaira(p.recipientGetsKobo)}
        </Text>
      )}
      {p.wallet.kind === 'none' ? (
        <PillButton label="Open your wallet" onPress={p.onOpenWallet} />
      ) : (
        <PillButton
          label={paying ? 'Paying' : `${p.actionLabel} · ${formatNaira(p.total)}`}
          onPress={pay}
          busy={paying}
          disabled={paying || p.wallet.kind === 'loading'}
        />
      )}
    </>
  );
}

function NotEnough(p: Inner & { balanceKobo: number; short: number }) {
  const { colors } = useWawu();
  return (
    <>
      <Header item={p.item} />
      <View style={[styles.banner, { backgroundColor: colors.warningTint }]}>
        <View style={styles.bannerIcon}>
          <Wallet color={colors.warning} />
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
        <Row label={p.amountLabel ?? 'Price'} value={formatNaira(p.amountKobo)} first />
        <FeeRows fees={p.fees} />
        <Row label={p.walletName} value={<Balance kobo={p.balanceKobo} color={colors.danger} />} />
        <Row label="Top up at least" value={formatNaira(p.short)} />
      </Card>
      <View style={styles.buttons}>
        <PillButton label={`Add ${formatNaira(p.short)}`} onPress={() => p.onAddMoney(p.short)} icon="plus" />
        <PillButton label="Cancel" onPress={p.onCancel} quiet />
      </View>
    </>
  );
}

function Confirming(p: Inner) {
  const { colors } = useWawu();
  return (
    <>
      <Status
        tint={colors.warningTint}
        icon={<Clock color={colors.warning} />}
        title="Still confirming"
        line={`Your payment of ${formatNaira(p.total)} hasn't been confirmed yet. Check again before you pay a second time.`}
      />
      <View style={styles.buttons}>
        {p.onRefresh && <PillButton label="Refresh" onPress={p.onRefresh} />}
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
        icon={<Cross color={colors.danger} />}
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
            {item.by !== undefined && <Text style={[text.secondary, { color: colors.textMuted }]}>{item.by}</Text>}
            {item.verified && item.by !== undefined && <VerifiedTick fill={colors.tickProfessional} mark={colors.textOnAccent} />}
            {item.subtitle !== undefined && (
              <Text style={[text.secondary, styles.flex, { color: colors.textMuted }]} numberOfLines={1}>
                {item.by !== undefined ? `· ${item.subtitle}` : item.subtitle}
              </Text>
            )}
            {item.verified && item.by === undefined && (
              <VerifiedTick fill={colors.tickProfessional} mark={colors.textOnAccent} />
            )}
          </View>
        )}
      </View>
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
    <View
      style={[styles.row, !first && { borderTopWidth: LINE, borderTopColor: colors.borderHairline }]}
    >
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

/** A balance as the canvas draws it: naira full size, kobo small and faded. */
function Balance({ kobo, color, size = 'row' }: { kobo: number; color: string; size?: 'row' | 'line' }) {
  const parts = nairaParts(kobo);
  return (
    <Text style={[size === 'row' ? styles.rowValue : styles.walletLine, styles.money, { color }]}>
      {parts.naira}
      <Text style={styles.kobo}>.{parts.kobo}</Text>
    </Text>
  );
}

function WalletCard({ wallet, walletName }: { wallet: PayWallet; walletName: string }) {
  const { colors } = useWawu();
  let line: ReactNode;
  if (wallet.kind === 'open') {
    line = (
      <Text style={[styles.walletLine, { color: colors.textMuted }]}>
        {walletName} · <Balance kobo={wallet.balanceKobo} color={colors.textMuted} size="line" /> available
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
      {wallet.kind === 'open' && <CheckRing color={colors.accentFg} />}
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
 * The canvas pay button. Local to this sheet until UI-01's Button lands
 * (SHARED-CHANGES.md); it adopts that one then.
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
  icon?: 'plus';
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
      {icon === 'plus' && <Plus color={fg} />}
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
    fontSize: type.size.body - 0.5,
    letterSpacing: type.tracking.heading * (type.size.body - 0.5),
    textAlign: 'right',
    flexShrink: 1,
  },
  money: { fontVariant: ['tabular-nums', 'lining-nums'] },
  kobo: { fontSize: (type.size.body - 0.5) * 0.72, opacity: 0.5 },
  walletCard: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md + NUDGE },
  coin: { width: COIN, height: COIN, borderRadius: radius.chip, alignItems: 'center', justifyContent: 'center' },
  coinMark: { ...font(700), fontSize: type.size.h3 + 0.5 },
  walletTitle: { ...font(600), fontSize: type.size.body },
  walletLine: { ...font(400), fontSize: type.size.sec - 0.5, marginTop: NUDGE },
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
    borderRadius: radius.tile,
    paddingVertical: space.md + NUDGE,
    paddingHorizontal: space.lg,
  },
  bannerIcon: { paddingTop: NUDGE },
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
