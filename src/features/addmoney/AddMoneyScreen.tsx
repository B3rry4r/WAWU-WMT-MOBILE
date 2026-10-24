import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, Share, StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Card, GroupedList } from '@/components/Card';
import { useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { IconTile } from '@/components/IconTile';
import { KeyValueRow, ListRow, rowMetrics } from '@/components/ListRow';
import { Money } from '@/components/Money';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { StatusPill } from '@/components/StatusPill';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { AuthFrame } from '@/features/auth/AuthFrame';
import { copyText } from '@/features/open-wallet/copy';
import { useOpenWalletEntry } from '@/features/open-wallet/entry';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { walletHomeQuery, type WalletHome } from '@/features/wallet/api/home';
import { FREE_PILL, sendArrivesLine, usuallyAbout } from '@/features/wallet/arrival';
import { font, radius, space, type, useWawu } from '@/theme';

import {
  accountRows,
  ACCOUNT_HEAD,
  ACCOUNT_LINE,
  ADD_TITLE,
  manyReceived,
  POLL_MS,
  senderLine,
  shareText,
  SHARE_LABEL,
  shortfallNote,
  WAITING_TITLE,
  type AccountRow,
} from './model';
import { useLanding, type Landing } from './useLanding';

/** kit.js line 61, `copyBtn`: 32 high, 12 at the sides, a pill on the sunken surface, the Copy glyph 14, the word 13 / 600, 6 between. */
const COPY = { height: 32, padX: 12, icon: 14, label: 13, iconGap: 6, ms: 2000 } as const;
/**
 * W15's card: the head's label is 12. W46 is kit.js `result`: an 88 mark, the headline 30 / 700 at -0.035em with the word the same size as
 * the figure (`type.size.title`, `type.tracking.title`), 10 between its parts and 8 more above the headline (`titleLift`), so the
 * headline sits 18 under the mark; the card sits 20 under the line below it (the body's own gap, `space.xl`). The board sets no line
 * height on the headline or the line under it (14.5, `sub`), so both take Alan Sans's normal, 1.3 (`titleLeading`, 39 at 30; measured
 * in the browser), which puts the headline's ink 26.5 under the mark and the line under it 19 below the ink, as the board's picture
 * measures (SWEEP-APP-5, row SWEEP-APP-4 L2).
 * W46's head starts 120 under the status bar (the board's padding); the frame's own 8 is part of it, so headTop is 112 (SWEEP-APP-4 row 142).
 */
const LOOK = { label: 12, dot: 10, mark: 88, figure: type.size.title, figureTracking: type.tracking.title, rowValue: 14.5, headGap: 10, titleLift: 8, titleLeading: type.leading.snug, sub: 14.5, bodyGap: space.xl, headTop: 112, arrivesIcon: 18 } as const;

export type AddMoneyScreenProps = {
  /** What a pay sheet was short by (kobo), when it sent the person here: shown above the card. */
  shortfallKobo?: number | null;
  onBack: () => void;
  /** Done on W46: back to where the person came from. */
  onDone: () => void;
  /** How often the balance is asked for while a transfer is awaited (tests). */
  pollMs?: number;
};

/**
 * W15 · Add money, with W45 (waiting) and W46 (received) as its states (WALLET-05, the 16 Oct board, R-42).
 *
 * Adding money is a bank transfer to the person's own wallet account, so the card draws what the Hub holds: the account name, the
 * account number and the bank's name, each with Copy, and Share details (the phone's share sheet, R-33). The board's "Free" and its
 * "arrives in a few minutes" are the Hub's words (FIX-109): "Free" only when `transferIn.feeKobo` is 0, and the line from
 * `transferIn.arrivalMinutes`, each drawn only when the Hub sent it. After the
 * person copies or shares the details the screen waits (W45): the bank's balance is asked for every few seconds, and when it changes
 * with a transfer in on the ledger, W46 shows that transfer, the new balance and its reference; when more than one landed, W46 says
 * how many and lists each. Nothing on this screen is a sum of our own records.
 *
 * Nobody has a wallet until they open one (R-6): with none, this leads to Open your wallet. A wallet still opening, a read that
 * failed and a read in flight each have their own state. When a pay sheet sent the person here, the note above the card names what
 * was missing.
 */
export function AddMoneyScreen({ shortfallKobo, onBack, onDone, pollMs = POLL_MS }: AddMoneyScreenProps) {
  const owner = useSessionAccount(undefined);
  const entry = useOpenWalletEntry();
  const wallet = useQuery(walletHomeQuery(owner), queryClient);
  const [sent, setSent] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const landing = useLanding(owner, sent, pollMs);

  const led = useRef(false);
  const noWallet = wallet.data?.state === 'not_open';
  useEffect(() => {
    if (noWallet && !led.current) {
      led.current = true;
      entry.open();
    }
  }, [noWallet, entry]);

  if (landing.phase === 'landed') return <Received landing={landing} onDone={onDone} />;

  let body;
  if (wallet.data && wallet.data.account && (wallet.data.state === 'open' || wallet.data.state === 'frozen')) {
    body = (
      <AccountCard
        account={wallet.data.account}
        waiting={landing.phase === 'waiting'}
        transferIn={wallet.data.transferIn}
        notice={notice}
        onSent={() => setSent(true)}
        onNotice={setNotice}
      />
    );
  } else if (wallet.data?.state === 'not_open') {
    body = (
      <EmptyState
        testID="add-money-no-wallet"
        icon="Wallet"
        title="Open your wallet first"
        message="You get an account number to add money to once your wallet is open."
        action={{ label: 'Open your wallet', onPress: entry.open }}
      />
    );
  } else if (wallet.data?.state === 'opening') {
    body = (
      <EmptyState
        testID="add-money-opening"
        icon="Clock"
        title="Your account is being set up"
        message="Your account number shows here as soon as the bank has made it."
        action={{ label: 'Check again', onPress: () => void wallet.refetch() }}
      />
    );
  } else if (wallet.isError) {
    body = (
      <ErrorState
        testID="add-money-error"
        icon={isApiError(wallet.error) && wallet.error.kind === 'network' ? 'WifiOff' : 'TriangleAlert'}
        title="We couldn't load your account details"
        message={isApiError(wallet.error) && wallet.error.message ? wallet.error.message : 'Check your connection and try again.'}
        onRetry={() => void wallet.refetch()}
      />
    );
  } else {
    body = <AccountSkeleton />;
  }

  const note = shortfallKobo ? shortfallNote(shortfallKobo) : null;
  return (
    <AuthFrame testID="add-money-screen" navTitle={ADD_TITLE} onBack={onBack}>
      <View style={styles.body}>
        {note ? <Banner testID="add-money-short" tone="info" icon="Wallet" title={note.title} body={note.body} /> : null}
        {body}
      </View>
    </AuthFrame>
  );
}

type CardProps = {
  account: NonNullable<WalletHome['account']>;
  waiting: boolean;
  /** What the Hub says of a transfer in: the pill and the two lines are drawn only for what it sent (FIX-109). */
  transferIn: WalletHome['transferIn'];
  notice: string | null;
  /** The details went out (copied or shared): the wait begins. */
  onSent: () => void;
  onNotice: (text: string | null) => void;
};

function AccountCard({ account, waiting, transferIn, notice, onSent, onNotice }: CardProps) {
  const { colors } = useWawu();

  const share = async () => {
    onNotice(null);
    try {
      const result = await Share.share({ message: shareText(account) });
      if (result.action !== Share.dismissedAction) onSent();
    } catch {
      onNotice('Sharing isn’t available on this device.');
      AccessibilityInfo.announceForAccessibility('Sharing is not available on this device.');
    }
  };

  return (
    <>
      <Card testID="add-money-card">
        <View style={styles.head}>
          <Text variant="label" style={styles.headLabel}>
            {ACCOUNT_HEAD}
          </Text>
          {transferIn?.feeKobo === 0 ? <StatusPill testID="add-money-free" label={FREE_PILL} tone="positive" /> : null}
        </View>
        <Text variant="secondary" style={styles.line}>
          {ACCOUNT_LINE}
        </Text>
        {accountRows(account).map((row, i) => (
          <View key={row.key}>
            {i > 0 ? <View style={[styles.divider, { backgroundColor: colors.borderHairline }]} /> : null}
            <KeyValueRow
              testID={`add-money-${row.key}`}
              label={row.label}
              value={
                <>
                  <Text variant="body" numberOfLines={1} selectable style={[font(600), styles.value]} testID={`add-money-${row.key}-value`}>
                    {row.value}
                  </Text>
                  <CopyPill row={row} onCopied={onSent} />
                </>
              }
            />
          </View>
        ))}
        <View style={styles.share}>
          <Button testID="add-money-share" label={SHARE_LABEL} icon="Share" variant="secondary" full onPress={() => void share()} />
        </View>
      </Card>
      {notice ? (
        <Text variant="errorLine" testID="add-money-notice" accessibilityRole="alert">
          {notice}
        </Text>
      ) : null}
      {transferIn?.arrivalMinutes !== undefined ? (
        <View testID="add-money-arrives" style={styles.arrives}>
          <Icon name="Clock" size={LOOK.arrivesIcon} color={colors.textMuted} />
          <Text variant="body" tone="textSecondary" style={styles.arrivesLine}>
            {sendArrivesLine(transferIn.arrivalMinutes)}
          </Text>
        </View>
      ) : null}
      {waiting ? <Waiting arrivalMinutes={transferIn?.arrivalMinutes} /> : null}
    </>
  );
}

/** W45: the card says the transfer is awaited. A live region, so a screen reader hears it when it appears. */
function Waiting({ arrivalMinutes }: { arrivalMinutes?: number }) {
  const { colors } = useWawu();
  return (
    <Card testID="add-money-waiting" style={styles.waiting}>
      <View accessible accessibilityLiveRegion="polite" style={styles.waitingRow}>
        <View style={[styles.dot, { backgroundColor: colors.warning }]} />
        <Text variant="body" style={[font(600), styles.waitingTitle]}>
          {WAITING_TITLE}
        </Text>
      </View>
      {arrivalMinutes !== undefined ? (
        <Text variant="secondary" tone="textMuted" testID="add-money-waiting-usually" style={styles.waitingUsually}>
          {usuallyAbout(arrivalMinutes)}
        </Text>
      ) : null}
    </Card>
  );
}

/** One row's Copy: the value as the bank gave it onto the clipboard, "Copied" for a moment after. Copying starts the wait. */
function CopyPill({ row, onCopied }: { row: AccountRow; onCopied: () => void }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const copy = async () => {
    const done = await copyText(row.copy);
    AccessibilityInfo.announceForAccessibility(done ? `${row.label} copied` : `Couldn't copy the ${row.label.toLowerCase()}`);
    if (!done) return;
    setCopied(true);
    onCopied();
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), COPY.ms);
  };
  return (
    <Pressable
      testID={`add-money-${row.key}-copy`}
      accessibilityRole="button"
      accessibilityLabel={copied ? 'Copied' : row.copyLabel}
      onPress={() => void copy()}
      hitSlop={space.sm}
      {...ring.handlers}
      style={({ pressed }) => [styles.copy, { backgroundColor: pressed ? colors.borderHairline : colors.surfaceSunken }, ring.style]}
    >
      <Icon name={copied ? 'Check' : 'Copy'} size={COPY.icon} color={colors.textPrimary} />
      <Text variant="body" style={[font(600), styles.copyLabel]}>
        {copied ? 'Copied' : 'Copy'}
      </Text>
    </Pressable>
  );
}

/**
 * W46: what landed, the bank's balance after it, and the ledger's reference for it. When more than one transfer landed since the
 * wait began, the head says how many and each row is listed with its sender and reference: the Hub serves no total of them, so none
 * is added up here, and the balance line is the bank's own.
 */
function Received({ landing, onDone }: { landing: Extract<Landing, { phase: 'landed' }>; onDone: () => void }) {
  const { credits } = landing;
  const first = credits[0];
  const many = credits.length > 1;
  const from = first && !many ? senderLine(first) : null;
  return (
    <AuthFrame
      testID="add-money-received"
      bare
      footer={<Button testID="add-money-done" label="Done" full onPress={onDone} />}
    >
      <View testID="add-money-received-body" style={styles.receivedBody}>
        <View style={styles.receivedHead}>
          <IconTile icon="ArrowDownLeft" tone="in" size={LOOK.mark} strokeWidth={2.4} />
          {first && !many ? (
            <View style={styles.figureRow}>
              <Money
                testID="add-money-amount"
                minorUnits={first.amountKobo}
                size={LOOK.figure}
                weight={700}
                decimals={first.amountKobo % 100 !== 0}
                style={styles.figureTracking}
              />
              <Text variant="title" style={styles.figureLine}>
                received
              </Text>
            </View>
          ) : (
            <Text variant="title" testID="add-money-count" style={[styles.centre, styles.lifted]}>
              {manyReceived(credits.length)}
            </Text>
          )}
          {from ? (
            <Text variant="secondary" tone="textSecondary" testID="add-money-from" style={[styles.centre, styles.sub]}>
              {from}
            </Text>
          ) : null}
        </View>
        {many ? (
          <GroupedList testID="add-money-credits">
            {credits.map((credit, i) => (
              <ListRow
                key={credit.id}
                testID={`add-money-credit-${i}`}
                title={senderLine(credit) ?? credit.description}
                subtitle={credit.reference}
                subtitleSelectable
                trailing={<Money minorUnits={credit.amountKobo} size={LOOK.rowValue} weight={600} decimals={credit.amountKobo % 100 !== 0} />}
              />
            ))}
          </GroupedList>
        ) : null}
        <GroupedList testID="add-money-receipt">
          <KeyValueRow label="New balance" testID="add-money-balance" value={<Money minorUnits={landing.balanceKobo} size={LOOK.rowValue} weight={600} />} />
          {first && !many ? (
            <KeyValueRow
              label="Reference"
              testID="add-money-reference"
              value={
                <Text variant="kvValue" numberOfLines={1} ellipsizeMode="middle" selectable>
                  {first.reference}
                </Text>
              }
            />
          ) : null}
        </GroupedList>
      </View>
    </AuthFrame>
  );
}

function AccountSkeleton() {
  return (
    <LoadingView label="Loading your account details" testID="add-money-loading">
      <Skeleton height={rowMetrics.pairMinHeight * 3 + 150} radius={radius.card} />
    </LoadingView>
  );
}

const styles = StyleSheet.create({
  body: { gap: space.lg },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: space.sm },
  headLabel: { fontSize: LOOK.label },
  line: { paddingTop: space.sm, paddingBottom: space.sm },
  divider: { height: StyleSheet.hairlineWidth },
  value: { fontSize: rowMetrics.pairValue, flexShrink: 1 },
  copy: { height: COPY.height, paddingHorizontal: COPY.padX, borderRadius: radius.chip, flexDirection: 'row', alignItems: 'center', gap: COPY.iconGap, flexShrink: 0 },
  copyLabel: { fontSize: COPY.label },
  share: { paddingTop: space.md, paddingBottom: space.sm },
  waiting: { paddingVertical: space.md },
  waitingRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  dot: { width: LOOK.dot, height: LOOK.dot, borderRadius: LOOK.dot / 2 },
  waitingTitle: { flexShrink: 1 },
  waitingUsually: { paddingTop: space.xs, paddingLeft: LOOK.dot + space.md },
  arrives: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  arrivesLine: { flexShrink: 1 },
  receivedBody: { flex: 1, gap: LOOK.bodyGap, paddingTop: LOOK.headTop },
  receivedHead: { alignItems: 'center', gap: LOOK.headGap },
  figureRow: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm, marginTop: LOOK.titleLift },
  figureTracking: { letterSpacing: LOOK.figureTracking * LOOK.figure, lineHeight: LOOK.figure * LOOK.titleLeading },
  figureLine: { lineHeight: LOOK.figure * LOOK.titleLeading },
  lifted: { marginTop: LOOK.titleLift, lineHeight: LOOK.figure * LOOK.titleLeading },
  sub: { fontSize: LOOK.sub, lineHeight: LOOK.sub * LOOK.titleLeading },
  centre: { textAlign: 'center' },
});
