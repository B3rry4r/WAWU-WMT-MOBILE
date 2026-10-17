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
import { KeyValueRow, rowMetrics } from '@/components/ListRow';
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
import { font, radius, space, useWawu } from '@/theme';

import {
  accountRows,
  ACCOUNT_HEAD,
  ACCOUNT_LINE,
  ADD_TITLE,
  ARRIVES_LINE,
  FREE_WORD,
  POLL_MS,
  senderLine,
  shareText,
  SHARE_LABEL,
  shortfallNote,
  WAITING_NOTE,
  WAITING_TITLE,
  type AccountRow,
} from './model';
import { useLanding, type Landing } from './useLanding';

/** kit.js line 61, `copyBtn`: 32 high, 12 at the sides, a pill on the sunken surface, the Copy glyph 14, the word 13 / 600, 6 between. */
const COPY = { height: 32, padX: 12, icon: 14, label: 13, iconGap: 6, ms: 2000 } as const;
/** W15's card: the head's label is 12, the clock line's glyph 16 with 12 beside it; W46's mark is 88 and its figure 36 (W12's own). */
const LOOK = { label: 12, clock: 16, clockGap: 12, dot: 10, mark: 88, figure: 36, rowValue: 14.5, headGap: 12, headTop: 20 } as const;

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
 * account number and the bank's name, each with Copy, and Share details (the phone's share sheet, R-33). "Free" is the board's word
 * for a transfer in. After the person copies or shares the details the screen waits (W45): the bank's balance is asked for every few
 * seconds, and when it changes with a transfer in on the ledger, W46 shows that transfer, the new balance and its reference. Nothing
 * on this screen is a sum of our own records.
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
  notice: string | null;
  /** The details went out (copied or shared): the wait begins. */
  onSent: () => void;
  onNotice: (text: string | null) => void;
};

function AccountCard({ account, waiting, notice, onSent, onNotice }: CardProps) {
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
          <StatusPill testID="add-money-free" label={FREE_WORD} tone="positive" />
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
      {waiting ? <Waiting /> : <Arrives />}
    </>
  );
}

/** The clock line under the card, before anything has been sent. */
function Arrives() {
  const { colors } = useWawu();
  return (
    <View testID="add-money-arrives" style={styles.arrives}>
      <Icon name="Clock" size={LOOK.clock} color={colors.textMuted} />
      <Text variant="secondary" tone="textMuted" style={styles.arrivesText}>
        {ARRIVES_LINE}
      </Text>
    </View>
  );
}

/** W45: the card says the transfer is awaited. A live region, so a screen reader hears it when it appears. */
function Waiting() {
  const { colors } = useWawu();
  return (
    <Card testID="add-money-waiting" style={styles.waiting}>
      <View accessible accessibilityLiveRegion="polite" style={styles.waitingRow}>
        <View style={[styles.dot, { backgroundColor: colors.warning }]} />
        <Text variant="body" style={[font(600), styles.waitingTitle]}>
          {WAITING_TITLE}
        </Text>
        <Text variant="secondary" tone="textMuted" style={styles.waitingNote}>
          {WAITING_NOTE}
        </Text>
      </View>
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

/** W46: what landed, the bank's balance after it, and the ledger's reference for it. */
function Received({ landing, onDone }: { landing: Extract<Landing, { phase: 'landed' }>; onDone: () => void }) {
  const { credit } = landing;
  const from = senderLine(credit);
  return (
    <AuthFrame
      testID="add-money-received"
      bare
      footer={<Button testID="add-money-done" label="Done" full onPress={onDone} />}
    >
      <View style={styles.receivedBody}>
        <View style={styles.receivedHead}>
          <IconTile icon="ArrowDownLeft" tone="in" size={LOOK.mark} strokeWidth={2.4} />
          <View style={styles.figureRow}>
            <Money testID="add-money-amount" minorUnits={credit.amountKobo} size={LOOK.figure} weight={700} decimals={credit.amountKobo % 100 !== 0} />
            <Text variant="title" style={styles.figureWord}>
              received
            </Text>
          </View>
          {from ? (
            <Text variant="secondary" tone="textSecondary" testID="add-money-from" style={styles.centre}>
              {from}
            </Text>
          ) : null}
        </View>
        <GroupedList testID="add-money-receipt">
          <KeyValueRow label="New balance" testID="add-money-balance" value={<Money minorUnits={landing.balanceKobo} size={LOOK.rowValue} weight={600} />} />
          <KeyValueRow
            label="Reference"
            testID="add-money-reference"
            value={
              <Text variant="kvValue" numberOfLines={1} ellipsizeMode="middle" selectable>
                {credit.reference}
              </Text>
            }
          />
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
  arrives: { flexDirection: 'row', alignItems: 'center', gap: LOOK.clockGap },
  arrivesText: { flex: 1 },
  waiting: { paddingVertical: space.md },
  waitingRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  dot: { width: LOOK.dot, height: LOOK.dot, borderRadius: LOOK.dot / 2 },
  waitingTitle: { flexShrink: 1 },
  waitingNote: { flex: 1, textAlign: 'right' },
  receivedBody: { flex: 1, gap: space.lg, paddingTop: LOOK.headTop },
  receivedHead: { alignItems: 'center', gap: LOOK.headGap },
  figureRow: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm },
  figureWord: { fontSize: LOOK.figure * 0.9 },
  centre: { textAlign: 'center' },
});
