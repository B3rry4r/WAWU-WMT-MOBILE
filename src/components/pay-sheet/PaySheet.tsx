import { useEffect, useRef, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Avatar, type AvatarHue } from '@/components/Avatar';
import { Banner } from '@/components/Banner';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { Card, GroupedList } from '@/components/Card';
import { CurrencyFlag } from '@/components/CurrencyFlag';
import { ICON_STROKE, Icon, VerifiedTick } from '@/components/icon';
import { IconTile } from '@/components/IconTile';
import { KeyValueRow } from '@/components/ListRow';
import { MediaCard } from '@/components/MediaCard';
import { Money } from '@/components/Money';
import { Text } from '@/components/Text';
import { canvasNormalLineHeight, layout, motion, space, text, type, useWawu } from '@/theme';
import type { ColorToken } from '@/theme';

import { feesTotalKobo, formatNaira, payTotalKobo, shortfallKobo, type PayFeeLine } from './money';

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
  image?: string | number;
  /**
   * Send: the recipient's short display name ("Chidinma Okoro"), which the
   * avatar's initials come from, as W10 draws "CO"; `title` stays the full name.
   */
  displayName?: string;
  /** Send: the recipient's avatar (W10): their hue, and a photo when they have one. */
  avatar?: { hue: AvatarHue; source?: string | number };
};

/** A row that describes the payment and is not money ("Yours: Forever, in My purchases"). */
export type PayDetailRow = { label: string; value: string };

/**
 * The payer's wallet, as the money core reports it. Fintava's balance is the
 * truth: `balanceKobo` is what the wallet endpoint returned, never a sum.
 */
export type PayWallet =
  | { kind: 'loading' }
  /**
   * No wallet opened yet (R-6): the sheet shows no balance and no Pay. With `onOpenWallet`
   * the footer offers "Open your wallet" in Pay's place (DECISIONS R-27).
   */
  | { kind: 'none' }
  | { kind: 'open'; balanceKobo: number };

/** Where the payment is. `review` shows "enough" or "not enough" from the balance. */
export type PayStatus =
  | { kind: 'review' }
  | { kind: 'paying' }
  /**
   * The debit was sent and its result has not come back yet. `line` replaces the sheet's sentence (W10 points to Wallet activity,
   * the one place the result shows; WALLET-02 round 3). Without it the sentence is the default.
   */
  | { kind: 'confirming'; line?: string }
  /** The payment did not complete. `message` says why, when the server said. */
  | { kind: 'failed'; message?: string }
  /**
   * The payment cannot be tried yet, and nothing was tried (WALLET-02 round 2: over today's limit). Not a failure: no red mark,
   * no "didn't go through". `title` and `message` say why. Cancel is always offered; Try again only with `tryAgain` and `onRetry`.
   */
  | { kind: 'blocked'; title: string; message: string; tryAgain?: boolean };

export type PaySheetProps = {
  /**
   * `purchase` (default): the bottom sheet of H14 and H17, whole-naira prices.
   * `send`: W10's review body. The recipient and the amount lead, every amount
   * shows its kobo faded, and the host screen supplies the nav bar.
   */
  variant?: 'purchase' | 'send';
  /** Purchase: whether the sheet is open (UI-02's `BottomSheet`). Default true. The send variant is a page body. */
  visible?: boolean;
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
  onCancel: () => void;
  /**
   * With no wallet yet (`wallet.kind === 'none'`) the footer offers "Open your wallet" in Pay's place and calls this
   * (KYC-05: the payer passes `useOpenWalletEntry().open`). Left out, the footer draws nothing there.
   */
  onOpenWallet?: () => void;
  /** Failed: try the same payment again. */
  onRetry?: () => void;
  /** Still confirming: ask the server again. */
  onRefresh?: () => void;
  onContactSupport?: () => void;
};

/**
 * The pay-from-wallet sheet (H14, H17; W10 as the `send` variant). A purchase
 * opens in UI-02's `BottomSheet` (scrim, grabber, slide-up; closing calls
 * `onCancel`, and it cannot be closed while paying).
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
    body = <Confirming {...props} total={total} line={status.line} />;
  } else if (status.kind === 'failed') {
    body = <Failed {...props} total={total} message={status.message} />;
  } else if (status.kind === 'blocked') {
    body = <Blocked {...props} total={total} title={status.title} message={status.message} tryAgain={status.tryAgain === true} />;
  } else if (wallet.kind === 'open' && short > 0 && status.kind === 'review') {
    body = <NotEnough {...props} total={total} balanceKobo={wallet.balanceKobo} short={short} />;
  } else {
    body = <Review {...props} total={total} />;
  }

  if (send) {
    return <View style={[styles.page, { backgroundColor: colors.surfacePage }]}>{body}</View>;
  }
  return (
    <BottomSheet
      visible={props.visible ?? true}
      onClose={props.onCancel}
      label={props.actionLabel}
      dismissible={status.kind !== 'paying'}
      gap={SHEET_GAP}
    >
      {body}
    </BottomSheet>
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

/** One row per fee part, then "Fees" when there are two or more (R-23). An array, so `GroupedList` draws a line between each. */
function feeRows(p: PaySheetProps) {
  const rows = p.fees.map((f) => <KeyValueRow key={f.label} label={f.label} value={money(p, f.amountKobo)} />);
  if (p.fees.length > 1) rows.push(<KeyValueRow key="fees" label="Fees" value={money(p, feesTotalKobo(p.fees))} />);
  return rows;
}

function Review(p: Inner) {
  const paying = p.status.kind === 'paying';
  const pay = usePayOnce(p.onPay, p.status.kind);
  const send = p.variant === 'send';
  const card = (
    <GroupedList>
      {send ? null : <KeyValueRow key="price" label={p.amountLabel ?? 'Price'} value={money(p, p.amountKobo)} />}
      {p.details?.map((d) => <KeyValueRow key={d.label} label={d.label} value={d.value} />)}
      {feeRows(p)}
      <KeyValueRow key="total" label="Total" value={money(p, p.total)} />
      {p.notes?.map((d) => <KeyValueRow key={d.label} label={d.label} value={d.value} />)}
    </GroupedList>
  );
  const action =
    p.wallet.kind === 'none' ? (
      p.onOpenWallet ? <Button label="Open your wallet" onPress={p.onOpenWallet} full /> : null
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
    <Text variant="muted" style={styles.centre}>
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
  const send = p.variant === 'send';
  const content = (
    <>
      {send ? <SendHeader item={p.item} amountKobo={p.amountKobo} /> : <Header item={p.item} />}
      <Banner
        tone="warning"
        icon="Wallet"
        title={`Not enough in your ${p.walletName}`}
        body={`This costs ${formatNaira(p.total)}. You have ${formatNaira(p.balanceKobo, 'always')}.`}
      />
      <GroupedList>
        <KeyValueRow key="price" label={p.amountLabel ?? (send ? 'Amount' : 'Price')} value={money(p, p.amountKobo)} />
        {feeRows(p)}
        <KeyValueRow key="wallet" label={p.walletName} value={<Money minorUnits={p.balanceKobo} size={ROW_VALUE} tone="danger" />} />
        <KeyValueRow key="short" label="Top up at least" value={money(p, p.short)} />
      </GroupedList>
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

/**
 * A status (still confirming, failed, blocked) and its buttons. A purchase sheet spaces them with the sheet's own gap. W10's page
 * pins the buttons to the foot, as it does the Send button and the not-enough state (the canvas's W14 and SH14 do the same), so a
 * message never sits a few points above its button (WALLET-02 round 3).
 */
function StatusBody({ send, status, buttons }: { send: boolean; status: ReactNode; buttons: ReactNode }) {
  if (!send) {
    return (
      <>
        {status}
        {buttons}
      </>
    );
  }
  return (
    <>
      <View style={styles.sendBody}>{status}</View>
      <View testID="pay-sheet-foot" style={styles.foot}>
        {buttons}
      </View>
    </>
  );
}

function Confirming(p: Inner & { line?: string }) {
  return (
    <StatusBody
      send={p.variant === 'send'}
      status={
        <Status
          icon={<IconTile icon="Clock" tone="warn" size={STATUS_MARK} strokeWidth={STATUS_STROKE} />}
          title="Still confirming"
          line={p.line ?? `Your payment of ${formatNaira(p.total)} hasn't been confirmed yet. Check again before you pay a second time.`}
        />
      }
      buttons={
        <View style={styles.buttons}>
          {p.onRefresh && <Button label="Refresh" onPress={p.onRefresh} icon="RotateCcw" full />}
          {p.onContactSupport && <Button label="Contact support" onPress={p.onContactSupport} variant="secondary" full />}
          {!p.onRefresh && !p.onContactSupport && <Button label="Close" onPress={p.onCancel} variant="secondary" full />}
        </View>
      }
    />
  );
}

function Failed(p: Inner & { message?: string }) {
  return (
    <StatusBody
      send={p.variant === 'send'}
      status={
        <Status
          icon={<IconTile icon="X" tone="danger" size={STATUS_MARK} strokeWidth={STATUS_STROKE} />}
          title="Payment didn't go through"
          line={p.message ?? `Your payment of ${formatNaira(p.total)} didn't complete. Check your ${p.walletName} before you try again.`}
        />
      }
      buttons={
        <View style={styles.buttons}>
          {p.onRetry && <Button label="Try again" onPress={p.onRetry} full />}
          <Button label="Cancel" onPress={p.onCancel} variant="secondary" full />
        </View>
      }
    />
  );
}

/** H14's head: the thumbnail, the title, and "Chidi Eze ✓ · Video · 18 min" (UI-02's `MediaCard`, row layout). */
function Header({ item }: { item: PayItem }) {
  return (
    <MediaCard
      title={item.title}
      byline={item.by}
      subtitle={item.subtitle}
      subtitleAccessory={item.verified ? <VerifiedTick kind={item.verified} size={TICK} /> : undefined}
      image={item.image}
    />
  );
}

/** W10's head: the recipient's avatar (kit `Av(..., 64)`), "Sending to <name>", and the amount. */
function SendHeader({ item, amountKobo }: { item: PayItem; amountKobo: number }) {
  return (
    <View style={styles.sendHead}>
      {item.avatar && (
        <Avatar name={item.displayName ?? item.title} hue={item.avatar.hue} source={item.avatar.source} size={AVATAR} decorative />
      )}
      <Text variant="secondary" tone="textMuted" style={styles.sendingTo}>
        Sending to {item.title}
      </Text>
      <Money minorUnits={amountKobo} size={type.size.display} />
    </View>
  );
}

function WalletCard({ wallet, walletName }: { wallet: PayWallet; walletName: string }) {
  const { colors } = useWawu();
  let line: ReactNode;
  if (wallet.kind === 'open') {
    line = (
      <Text variant="meta" style={styles.walletLine}>
        {walletName} · <Money minorUnits={wallet.balanceKobo} size={text.meta.fontSize} weight={500} tone="textMuted" /> available
      </Text>
    );
  } else if (wallet.kind === 'none') {
    line = (
      <Text variant="meta" style={styles.walletLine}>
        {"You don't have a wallet yet"}
      </Text>
    );
  } else {
    line = (
      <View style={styles.inline}>
        <ActivityIndicator size="small" color={colors.textMuted} />
        <Text variant="meta">Checking your balance</Text>
      </View>
    );
  }
  return (
    <Card style={styles.walletCard}>
      <CurrencyFlag currency="NGN" />
      <View style={styles.flex}>
        <Text variant="cardTitle">Pay from wallet</Text>
        {line}
      </View>
      {wallet.kind === 'open' && (
        <Icon name="CircleCheck" size={ICON_CHECK} color={colors.accentFg} strokeWidth={ICON_STROKE.button} />
      )}
    </Card>
  );
}

function Status({ icon, title, line }: { icon: ReactNode; title: string; line: string }) {
  return (
    <View style={styles.status}>
      {icon}
      <Text variant="sheetTitle" style={styles.centre}>
        {title}
      </Text>
      <Text variant="muted" style={styles.centre}>
        {line}
      </Text>
    </View>
  );
}

/** A payment that cannot be tried (over a limit): a warning mark, why, and Cancel. Nothing went wrong, so nothing is drawn as failed. */
function Blocked(p: Inner & { title: string; message: string; tryAgain: boolean }) {
  return (
    <StatusBody
      send={p.variant === 'send'}
      status={<Status icon={<IconTile icon="CircleAlert" tone="warn" size={STATUS_MARK} strokeWidth={STATUS_STROKE} />} title={p.title} line={p.message} />}
      buttons={
        <View style={styles.buttons}>
          {p.tryAgain && p.onRetry && <Button label="Try again" onPress={p.onRetry} full />}
          <Button label="Cancel" onPress={p.onCancel} variant="secondary" full />
        </View>
      }
    />
  );
}

/** The canvas nudges a few things by 2 px off the 4-point scale. */
const NUDGE = space.xs / 2;
const AVATAR = space.s3xl * 2; // 64, wallet.js W10 `Av(..., 64)`
/** Icon sizes the artboards pass to I(): check 20 (kit `fromWallet`); the tick 13 (unlockSheet). */
const ICON_CHECK = space.xl;
/** H18's status mark: a 72 tinted disc (its 32 glyph is `IconTile`'s 45%). */
const STATUS_MARK = layout.tapMin + space.s3xl - space.xs;
const TICK = space.md + 1;
/** H18 strokes its 32 px status mark at 2.4. The failed mark is W14's `X` (Send · failed), drawn at H18's sheet size. */
const STATUS_STROKE = ICON_STROKE.fab;
/** Row amounts: the kit's `Amt(v, { size: 14.5 })`, the `kv` value size. */
const ROW_VALUE = text.kvValue.fontSize;

/**
 * W10's "Sending to" is the kit's 13.5 at `line-height: normal` (6 px above it).
 * No `Text` variant is 13.5 on the canvas's normal line (`secondary` leads at
 * 1.4, `muted` at 1.45), so this one line takes `canvasNormalLineHeight`.
 */
const SENDING_LINE = canvasNormalLineHeight(type.size.sec);
/** H14 and H17 space the sheet's parts 16 px apart: home.js passes `sheet()` a 16 px gap. */
const SHEET_GAP = space.lg;

const styles = StyleSheet.create({
  page: { flex: 1, paddingHorizontal: layout.gutter, paddingTop: space.sm, paddingBottom: space.s3xl + NUDGE },
  sendBody: { gap: space.lg + NUDGE },
  foot: { marginTop: 'auto', paddingTop: space.md, gap: space.sm + NUDGE },
  flex: { flex: 1, minWidth: 0 },
  centre: { textAlign: 'center' },
  inline: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  sendHead: { alignItems: 'center', gap: space.xs + NUDGE, paddingTop: space.xs + NUDGE },
  sendingTo: { marginTop: space.xs + NUDGE, lineHeight: SENDING_LINE },
  /** Kit `fromWallet`: `card(..., { pad: '14px 16px' })`, a row with 12 between its parts. */
  walletCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md + NUDGE,
    paddingHorizontal: layout.cardPad,
  },
  walletLine: { marginTop: NUDGE },
  buttons: { gap: space.sm + NUDGE },
  status: { alignItems: 'center', gap: space.sm + NUDGE },
});
