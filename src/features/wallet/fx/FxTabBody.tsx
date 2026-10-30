import { useQueries } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useFocusRing } from '@/components/focusRing';
import { Icon, type IconName } from '@/components/icon';
import { PoweredByNuvion } from '@/components/PoweredByNuvion';
import { PromoRow } from '@/components/PromoRow';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { ACCT } from '@/features/wallet/home/BalanceCard';
import { font, radius, space, useWawu } from '@/theme';

import { chainList, SHORT_NAME, WORD, WORDS, type FxCode } from './amount';
import { openAccount, transactionsQuery, type FxAccount, type FxCurrencies, type FxTransaction } from './api';
import { FxDetailsSheet } from './FxDetailsSheet';
import { FxBalanceCard } from './FxBalanceCard';
import { beginOpening, endOpening, useOpening } from './opening';
import {
  accountsIn,
  canOpen,
  COIN_ORDER,
  coinGroups,
  decimalsFor,
  fxProblem,
  maskedNumber,
  primaryNumber,
  sentenceOf,
  swapOffered,
  type CoinGroup,
} from './model';
import { FxAmount, FxFlag, FxTxRow, fxRowOf } from './parts';

const ACTION = { height: 54, label: 16, icon: 19, gap: space.sm } as const;
const LINE_GAP = 3;

export type FxTabBodyProps = {
  /** A currency code (the Dollar tab is `USD`), or `crypto`. */
  tab: string;
  owner: string | null;
  currencies: FxCurrencies | null;
  accounts: readonly FxAccount[] | null;
  /** The read of the accounts failed: why, so the tab says it by cause. */
  accountsError: unknown;
  accountsPending: boolean;
  onRetry: () => void;
  hidden: boolean;
  onToggleHidden: () => void;
};

/**
 * What a currency tab on W1 draws (W2 for every currency account, W3 for Crypto), by what the Hub says: the account's own balance
 * and details, Add and Swap, the details payers use, and the account's statement. A person who has no account in it yet is offered to open
 * one when the Hub lets them (R-47); every state has its real cause (reading, the provider not answering, a frozen wallet, no account).
 */
export function FxTabBody(props: FxTabBodyProps) {
  if (props.accountsPending && !props.accounts) return <FxSkeleton />;
  if (props.accountsError && !props.accounts) return <FxProblemCard error={props.accountsError} onRetry={props.onRetry} />;
  return props.tab === 'crypto' ? <CryptoBody {...props} /> : <FiatBody {...props} code={props.tab as FxCode} />;
}

function FxSkeleton() {
  return (
    <View testID="fx-loading" style={styles.stack}>
      <Skeleton height={220} radius={28} />
      <Skeleton height={ACTION.height} radius={radius.chip} />
      <Skeleton height={120} radius={radius.card} />
    </View>
  );
}

function FxProblemCard({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const problem = fxProblem(error);
  const network = isApiError(error) && error.kind === 'network';
  const words =
    problem === 'unreachable'
      ? { icon: 'CloudOff' as IconName, title: 'We couldn’t reach your account', message: 'The bank did not answer. Your money is safe. Try again in a moment.' }
      : problem === 'frozen'
        ? { icon: 'Snowflake' as IconName, title: 'Your wallet is frozen', message: sentenceOf(error, 'Contact support to open it again.') }
        : problem === 'opening'
          ? { icon: 'Clock' as IconName, title: 'Your wallet is opening', message: 'This tab opens when it is ready.' }
          : {
              icon: (network ? 'WifiOff' : 'TriangleAlert') as IconName,
              title: network ? 'No connection' : 'We couldn’t load this account',
              message: sentenceOf(error, 'Check your connection and try again.'),
            };
  return (
    <Card style={styles.state}>
      <ErrorState testID="fx-error" {...words} onRetry={onRetry} />
    </Card>
  );
}

/** W2: one currency account. */
function FiatBody({ code, ...props }: FxTabBodyProps & { code: FxCode }) {
  const router = useRouter();
  const [sheet, setSheet] = useState(false);
  const account = accountsIn(props.accounts, code)[0] ?? null;
  const name = SHORT_NAME[code];

  if (!account) {
    return <OpenCard code={code} owner={props.owner} allowed={canOpen(props.currencies, code)} />;
  }
  if (account.status === 'opening') {
    return (
      <Card style={styles.state}>
        <EmptyState testID="fx-opening" icon="Clock" title={`Your ${WORD[code]} account is opening`} message="It takes a short while. Check again in a moment." action={{ label: 'Check again', onPress: props.onRetry }} />
      </Card>
    );
  }
  const number = primaryNumber(account);
  const bank = account.details?.bankName?.trim();
  const frozen = account.status === 'frozen';
  const toNaira = () => router.push({ pathname: '/swap', params: { from: code, to: 'NGN' } });
  const fromNaira = () => router.push({ pathname: '/swap', params: { from: 'NGN', to: code } });
  const swaps = swapOffered(props.currencies, props.accounts) && !frozen;
  return (
    <View style={styles.stack} testID={`fx-body-${code}`}>
      <View>
        <FxBalanceCard
          label={`${name} balance`}
          availableMinor={account.balance?.availableMinor ?? null}
          code={code}
          decimals={account.decimals}
          hidden={props.hidden}
          onToggleHidden={props.onToggleHidden}
          line={bank ? `${code} account · ${bank}` : `${code} account`}
          maskedNumber={number ? maskedNumber(number) : null}
          copyValue={number}
          detailsStatus={account.detailsStatus}
          detailsNote={account.detailsNote}
          onRetry={props.onRetry}
        />
        <PoweredByNuvion style={styles.powered} hidden={sheet} />
      </View>
      {frozen ? <Banner tone="warning" title="This account is frozen" body="Money can arrive, but it cannot be swapped or sent until it is opened again." testID="fx-frozen" /> : null}
      {swaps ? (
        <View style={styles.actions} testID="fx-actions">
          <ActionPill testID="fx-add" icon="Plus" label={`Add ${WORDS[code]}`} accent onPress={fromNaira} />
          <ActionRound testID="fx-swap" icon="ArrowLeftRight" label={`Swap ${WORD[code]} to naira`} onPress={toNaira} />
        </View>
      ) : null}
      {account.details?.status === 'active' && number ? (
        <PaidFromAbroad code={code} onPress={() => setSheet(true)} />
      ) : null}
      <Transactions owner={props.owner} accounts={[account]} currencies={props.currencies} allAccounts={props.accounts} noun={WORD[code]} />
      <FxDetailsSheet visible={sheet} onClose={() => setSheet(false)} account={account} name={name} />
    </View>
  );
}

/**
 * The one thing a person with no account in a currency can do: open it, when the Hub lets them. Never a button for a switched-off one.
 * From the ask (here, or from "Add a currency") until the Hub has answered and the accounts are read again it says the account is opening
 * (FX-POLISH L1), and it cannot be asked for twice.
 */
function OpenCard({ code, owner, allowed }: { code: FxCode; owner: string | null; allowed: boolean }) {
  const key = owner ?? '';
  const opening = useOpening(owner).has(code);
  const [problem, setProblem] = useState<string | null>(null);
  if (!allowed) return null;
  if (opening) {
    return (
      <Card style={styles.state}>
        <EmptyState testID="fx-opening" icon="Clock" title={`Your ${WORD[code]} account is opening`} message="It takes a short while." />
      </Card>
    );
  }
  const open = async () => {
    if (!beginOpening(key, code)) return;
    setProblem(null);
    try {
      await openAccount(code);
      await queryClient.invalidateQueries({ queryKey: ['money', 'fx'] });
    } catch (error) {
      setProblem(sentenceOf(error, 'We couldn’t open it. Try again.'));
    } finally {
      endOpening(key, code);
    }
  };
  return (
    <Card style={styles.state}>
      <EmptyState
        testID="fx-none"
        icon="Wallet"
        title={`Open a ${WORD[code]} account`}
        message={problem ?? `Get paid in ${WORDS[code]}, hold them, and swap to naira when you want.`}
        action={{ label: `Open ${WORD[code]} account`, onPress: () => void open() }}
        actionVariant="primary"
      />
    </Card>
  );
}

/**
 * W2's "Get paid from abroad": the row that opens the details payers need. The words say what is there, never what it will earn. It is the
 * shared promo row (R-110 point 1): a 40 rounded accent tile with an arrow-down-to-tray glyph, the title, one muted line and a chevron, in a
 * card with the Wallet's corner; it had a 52 round currency coin (a saturated blue) and two lines.
 */
export function PaidFromAbroad({ code, onPress }: { code: FxCode; onPress: () => void }) {
  return (
    <PromoRow
      testID="fx-abroad"
      icon="ArrowDownToLine"
      title="Get paid from abroad"
      subtitle={`Share your ${code} account details`}
      accessibilityLabel={`Get paid in ${WORDS[code]}. Share your ${code} account details.`}
      onPress={onPress}
      radius={ACCT.radius}
    />
  );
}

/** W3: the stablecoins, grouped by coin. */
function CryptoBody(props: FxTabBodyProps) {
  const router = useRouter();
  const groups = coinGroups(props.currencies, props.accounts);
  const coinAccounts = groups.flatMap((g) => g.accounts);
  const coinsOpenable = COIN_ORDER.some((code) => canOpen(props.currencies, code));

  if (groups.length === 0) {
    if (!coinsOpenable) return null;
    return (
      <Card style={styles.state}>
        <EmptyState
          testID="fx-crypto-none"
          icon="Coins"
          title="Get a crypto address"
          message="Pick a coin and a network to get an address you can be paid at."
          action={{ label: 'Get an address', onPress: () => router.push('/crypto-receive') }}
          actionVariant="primary"
        />
      </Card>
    );
  }
  return (
    <View style={styles.stack} testID="fx-body-crypto">
      <CryptoSection currencies={props.currencies} accounts={props.accounts} hidden={props.hidden} />
      <Transactions owner={props.owner} accounts={coinAccounts} currencies={props.currencies} allAccounts={props.accounts} noun="crypto" />
      <PoweredByNuvion />
    </View>
  );
}

/**
 * The coins a person holds and what they can do with them: Receive, Send and Swap, then each coin's holding. The Wallet's Crypto tab and
 * the Wallet of a person outside Nigeria draw the same one (R-87). Nothing is drawn with no coin held. A person with a naira wallet swaps
 * to naira; one without swaps between their own accounts.
 */
export function CryptoSection({ currencies, accounts, hidden, toNaira = true }: { currencies: FxCurrencies | null; accounts: readonly FxAccount[] | null; hidden: boolean; toNaira?: boolean }) {
  const router = useRouter();
  const groups = coinGroups(currencies, accounts);
  if (groups.length === 0) return null;
  const coinAccounts = groups.flatMap((g) => g.accounts);
  const sends = Boolean(currencies?.products.cryptoSend) && coinAccounts.some((a) => a.status === 'open');
  const swaps = swapOffered(currencies, accounts);
  const first = groups.find((g) => g.accounts.some((a) => a.status === 'open'));
  return (
    <>
      <View style={styles.actions} testID="fx-actions">
        <ActionPill testID="fx-receive" icon="ArrowDownLeft" label="Receive" onPress={() => router.push('/crypto-receive')} />
        {sends ? <ActionPill testID="fx-send" icon="ArrowUpRight" label="Send" onPress={() => router.push('/crypto-send')} /> : null}
        {swaps && first ? (
          <ActionRound
            testID="fx-swap"
            icon="ArrowLeftRight"
            label={toNaira ? `Swap ${first.code} to naira` : `Swap ${first.code}`}
            onPress={() => router.push({ pathname: '/swap', params: toNaira ? { from: first.code, to: 'NGN' } : { from: first.code } })}
          />
        ) : null}
      </View>
      <Holdings groups={groups} hidden={hidden} onOpen={(code) => router.push({ pathname: '/crypto-receive', params: { coin: code } })} />
    </>
  );
}

function Holdings({ groups, hidden, onOpen }: { groups: CoinGroup[]; hidden: boolean; onOpen: (code: FxCode) => void }) {
  const { colors } = useWawu();
  return (
    <Card testID="fx-holdings" style={styles.holdings}>
      {groups.map((g, i) => (
        <Pressable
          key={g.code}
          testID={`fx-holding-${g.code}`}
          accessibilityRole="button"
          accessibilityLabel={`${g.name}, ${g.code}. Open its address.`}
          onPress={() => onOpen(g.code)}
          style={[styles.holding, i > 0 ? { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderHairline } : null]}
        >
          <FxFlag currency={g.code} size={44} />
          <View style={styles.words}>
            <Text variant="cardTitle" numberOfLines={1}>
              {g.name}
            </Text>
            <Text variant="secondary" tone="textSecondary" numberOfLines={1} style={styles.abroadLine}>
              {g.code}
              {g.chains.length > 0 ? ` · ${chainList(g.chains)}` : ''}
            </Text>
          </View>
          {g.availableMinor === null ? (
            <Text variant="secondary" tone="textMuted">
              {g.accounts.every((a) => a.status === 'opening') ? 'Opening' : 'Not read'}
            </Text>
          ) : (
            <FxAmount minor={g.availableMinor} code={g.code} decimals={g.decimals} size={16} weight={700} masked={hidden} />
          )}
        </Pressable>
      ))}
    </Card>
  );
}

export type TxProps = {
  owner: string | null;
  accounts: readonly { id: string; currency: string; decimals: number }[];
  currencies: FxCurrencies | null;
  allAccounts: readonly { currency: string; decimals: number }[] | null;
  noun: string;
};

/** The account's statement (the provider's, newest first): its rows, the designed empty state, and a retry for a read that failed. */
export function Transactions({ owner, accounts, currencies, allAccounts, noun }: TxProps) {
  const reads = useQueries({ queries: accounts.map((a) => transactionsQuery(owner, a.id)) }, queryClient);
  const loading = reads.some((r) => r.isPending && r.isFetching);
  const failed = reads.find((r) => r.isError);
  const rows: FxTransaction[] = reads.flatMap((r) => r.data?.items ?? []).sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt)).slice(0, 20);
  const now = new Date();
  const decimalsOf = (code: Parameters<typeof decimalsFor>[2]) => decimalsFor(currencies, allAccounts, code);
  if (loading && rows.length === 0) {
    return (
      <View style={styles.rows} testID="fx-tx-loading">
        <Skeleton height={44} radius={22} />
        <Skeleton height={44} radius={22} />
      </View>
    );
  }
  if (failed && rows.length === 0) {
    return (
      <View style={styles.failed} testID="fx-tx-error">
        <Text variant="secondary" tone="textSecondary" accessibilityRole="alert">
          Couldn’t load your transactions.
        </Text>
        <Button label="Try again" icon="RotateCw" variant="secondary" size="sm" onPress={() => reads.forEach((r) => void r.refetch())} testID="fx-tx-retry" />
      </View>
    );
  }
  if (rows.length === 0) {
    return (
      <Card style={styles.state} testID="fx-no-transactions">
        <EmptyState icon="ArrowLeftRight" title="No transactions yet" message={`Your ${noun} activity shows here.`} />
      </Card>
    );
  }
  return (
    <View style={styles.rows} testID="fx-transactions">
      <Text variant="h2" accessibilityRole="header">
        Transactions
      </Text>
      {rows.map((t) => (
        <FxTxRow key={t.id} testID={`fx-row-${t.id}`} row={fxRowOf(t, decimalsOf, now)} />
      ))}
    </View>
  );
}

export function ActionPill({ icon, label, onPress, accent, testID }: { icon: IconName; label: string; onPress: () => void; accent?: boolean; testID: string }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      {...ring.handlers}
      style={[styles.pill, { backgroundColor: colors.surfaceCard, borderColor: colors.borderHairline }, ring.style]}
    >
      <Icon name={icon} size={ACTION.icon} color={accent ? colors.accent : colors.textPrimary} />
      <Text variant="body" numberOfLines={1} style={[font(700), styles.pillLabel]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function ActionRound({ icon, label, onPress, testID }: { icon: IconName; label: string; onPress: () => void; testID: string }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      {...ring.handlers}
      style={[styles.round, { backgroundColor: colors.surfaceCard, borderColor: colors.borderHairline }, ring.style]}
    >
      <Icon name={icon} size={ACTION.icon + 2} color={colors.textPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stack: { gap: space.lg },
  // Under the balance card, close to it, so it reads as that card's own line.
  powered: { marginTop: space.sm },
  state: { borderRadius: ACCT.radius, paddingVertical: space.md - 2, paddingHorizontal: space.lg },
  actions: { flexDirection: 'row', gap: ACTION.gap, alignItems: 'center' },
  pill: { flex: 1, height: ACTION.height, borderRadius: radius.chip, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm, paddingHorizontal: space.md },
  pillLabel: { fontSize: ACTION.label },
  round: { width: ACTION.height, height: ACTION.height, borderRadius: radius.chip, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  abroadLine: { marginTop: LINE_GAP },
  words: { flex: 1, minWidth: 0 },
  holdings: { padding: 0 },
  holding: { flexDirection: 'row', alignItems: 'center', gap: space.lg, paddingVertical: space.lg, paddingHorizontal: space.lg },
  rows: { gap: space.lg },
  failed: { alignItems: 'flex-start', gap: space.sm },
});

