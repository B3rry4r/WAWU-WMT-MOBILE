import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { Card } from '@/components/Card';
import { useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { SegmentedTabs } from '@/components/SegmentedTabs';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { AuthFrame } from '@/features/auth/AuthFrame';
import { Qr } from '@/features/events/ticketParts';
import { copyText } from '@/features/open-wallet/copy';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { canvasNormalLineHeight, font, radius, space, useWawu } from '@/theme';

import { chainName, type FxChain, type FxCode } from './amount';
import { accountsQuery, currenciesQuery, openAccount, type FxAccount } from './api';
import { COIN_ORDER, accountsIn, canOpen, currencyOf, fxProblem, sentenceOf } from './model';

const QR = { plate: 210, pad: 18, plateRadius: 28 } as const;
const COPIED_MS = 2000;
const COPY_GAP = 6;

export type ReceiveScreenProps = { coin?: string; onBack: () => void };

/** The account a coin and a network name, among the person's accounts. */
export const accountOn = (accounts: readonly FxAccount[] | null, code: FxCode, chain: FxChain): FxAccount | undefined =>
  accountsIn(accounts, code).find((a) => a.chain === chain);

/**
 * W22 · Crypto · receive: pick the coin, pick the network, and the address with its QR and Copy, and the warning that cannot be dismissed
 * (send only that coin on that network). A stablecoin account is one network's wallet, so a network the person has no account on is
 * opened here, when the Hub lets them. The coins and networks are the Hub's (`GET /money/fx/currencies`), never the board's samples.
 */
export function ReceiveScreen({ coin, onBack }: ReceiveScreenProps) {
  const owner = useSessionAccount(undefined);
  const currencies = useQuery(currenciesQuery(owner), queryClient);
  const accounts = useQuery(accountsQuery(owner), queryClient);

  const coins = useMemo(
    () => COIN_ORDER.filter((code) => accountsIn(accounts.data ?? null, code).length > 0 || (currencyOf(currencies.data ?? null, code)?.enabled && currencies.data?.products.openAccount)),
    [currencies.data, accounts.data],
  );
  const [chosenCoin, setCoin] = useState<FxCode | null>(null);
  const [chosenChain, setChain] = useState<FxChain | null>(null);
  const code = (chosenCoin && coins.includes(chosenCoin) ? chosenCoin : coins.find((c) => c === coin)) ?? coins[0];
  const chains = useMemo(() => {
    if (!code) return [] as FxChain[];
    const served = (currencyOf(currencies.data ?? null, code)?.chains ?? []) as FxChain[];
    const held = accountsIn(accounts.data ?? null, code).map((a) => a.chain as FxChain | null);
    return [...new Set([...served, ...held.filter((c): c is FxChain => c !== null)])];
  }, [code, currencies.data, accounts.data]);
  const chain = chosenChain && chains.includes(chosenChain) ? chosenChain : chains[0];

  const error = currencies.isError && !currencies.data ? currencies.error : accounts.isError && !accounts.data ? accounts.error : null;
  const loading = (currencies.isPending || accounts.isPending) && !error;

  return (
    <AuthFrame testID="receive-screen" navTitle={code ? `Receive ${code}` : 'Receive'} onBack={onBack}>
      {error ? (
        <View style={styles.state}>
          <ErrorState
            testID="receive-error"
            icon={isApiError(error) && error.kind === 'network' ? 'WifiOff' : fxProblem(error) === 'unreachable' ? 'CloudOff' : 'TriangleAlert'}
            title={fxProblem(error) === 'unreachable' ? 'We couldn’t reach your account' : 'We couldn’t load your accounts'}
            message={sentenceOf(error, 'Check your connection and try again.')}
            onRetry={() => {
              void currencies.refetch();
              void accounts.refetch();
            }}
          />
        </View>
      ) : loading ? (
        <View style={styles.stack} testID="receive-loading">
          <Skeleton height={42} radius={radius.chip} />
          <Skeleton height={36} width={240} radius={radius.chip} />
          <Skeleton height={QR.plate + 2 * QR.pad} radius={QR.plateRadius} />
        </View>
      ) : !code || !chain ? (
        <Card style={styles.card}>
          <EmptyState testID="receive-none" icon="Coins" title="Crypto is not available right now" message="Nothing can be received here at the moment. Try again later." />
        </Card>
      ) : (
        <View style={styles.stack}>
          {coins.length > 1 ? (
            <SegmentedTabs
              testID="receive-coins"
              label="Coin"
              items={coins.map((c) => ({ value: c, label: c }))}
              value={code}
              onChange={(next) => {
                setCoin(next as FxCode);
                setChain(null);
              }}
            />
          ) : null}
          <Text variant="label" style={styles.networkLabel}>
            NETWORK
          </Text>
          <View style={styles.chips} accessibilityRole="radiogroup">
            {chains.map((c) => (
              <NetworkChip key={c} chain={c} selected={c === chain} onPress={() => setChain(c)} />
            ))}
          </View>
          <Address
            code={code}
            chain={chain}
            account={accountOn(accounts.data ?? null, code, chain)}
            canOpen={canOpen(currencies.data ?? null, code)}
            onChanged={() => void accounts.refetch()}
          />
        </View>
      )}
    </AuthFrame>
  );
}

function NetworkChip({ chain, selected, onPress }: { chain: FxChain; selected: boolean; onPress: () => void }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID={`receive-chain-${chain}`}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={chainName(chain)}
      onPress={onPress}
      {...ring.handlers}
      style={[
        styles.chip,
        selected ? { backgroundColor: colors.textPrimary, borderColor: colors.textPrimary } : { backgroundColor: 'transparent', borderColor: colors.borderStrong },
        ring.style,
      ]}
    >
      <Text variant="body" style={[font(700), styles.chipLabel, { color: selected ? colors.surfacePage : colors.textSecondary }]}>
        {chainName(chain)}
      </Text>
    </Pressable>
  );
}

function Address({ code, chain, account, canOpen: allowed, onChanged }: { code: FxCode; chain: FxChain; account: FxAccount | undefined; canOpen: boolean; onChanged: () => void }) {
  const { colors } = useWawu();
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const address = account?.details?.status === 'active' ? account.details.address?.trim() || null : null;

  if (!account) {
    if (!allowed) {
      return (
        <Card style={styles.card}>
          <EmptyState testID="receive-off" icon="Coins" title={`${code} on ${chainName(chain)} is not available`} message="It is switched off right now. Try again later." />
        </Card>
      );
    }
    const open = async () => {
      setBusy(true);
      setProblem(null);
      try {
        await openAccount(code, chain);
        onChanged();
      } catch (error) {
        setProblem(sentenceOf(error, 'We couldn’t make an address. Try again.'));
      } finally {
        setBusy(false);
      }
    };
    return (
      <Card style={styles.card}>
        <EmptyState
          testID="receive-open"
          icon="Coins"
          title={`Get your ${code} address on ${chainName(chain)}`}
          message={problem ?? 'It is made for you once, and it stays yours.'}
          action={{ label: busy ? 'Getting your address' : 'Get my address', onPress: () => void open() }}
          actionVariant="primary"
        />
      </Card>
    );
  }
  if (!address) {
    // The Hub says where the address stands (`detailsStatus`); the card never promises one is coming (SWEEP-MONEY-6, WALLET-21 L1).
    const unavailable = account.detailsStatus === 'unavailable';
    return (
      <Card style={styles.card}>
        <EmptyState
          testID="receive-pending"
          icon="Clock"
          title={unavailable ? 'Your address is not available right now' : 'Your address is pending'}
          message={unavailable ? account.detailsNote?.trim() || 'Try again in a few minutes.' : 'Check again in a moment.'}
          action={{ label: 'Check again', onPress: onChanged }}
        />
      </Card>
    );
  }
  return (
    <View style={styles.stack}>
      <View style={styles.plateRow}>
        <View style={[styles.plate, { backgroundColor: colors.surfaceCard, borderColor: colors.borderHairline }]}>
          <Qr testID="receive-qr" value={address} size={QR.plate - 2 * QR.pad} label={`QR code of your ${code} address on ${chainName(chain)}`} />
        </View>
      </View>
      <View style={[styles.address, { backgroundColor: colors.surfaceCard, borderColor: colors.borderHairline }]}>
        <Text variant="body" selectable style={[font(700), styles.addressText]} testID="receive-address">
          {address}
        </Text>
        <CopyAddress value={address} />
      </View>
      <View style={[styles.warning, { backgroundColor: colors.warningTint }]} accessibilityRole="alert" testID="receive-warning">
        <Icon name="TriangleAlert" size={22} color={colors.warning} />
        <View style={styles.warningWords}>
          <Text variant="cardTitle">
            Send only {code} on {chainName(chain)}
          </Text>
          <Text variant="secondary" tone="textSecondary" style={styles.warningLine}>
            Other coins or networks sent here can’t be recovered.
          </Text>
        </View>
      </View>
      {account.status === 'frozen' ? (
        <Text variant="secondary" tone="textSecondary" testID="receive-frozen">
          This account is frozen. Money can arrive, but it cannot be sent until it is opened again.
        </Text>
      ) : null}
    </View>
  );
}

function CopyAddress({ value }: { value: string }) {
  const { colors } = useWawu();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const copy = async () => {
    const done = await copyText(value);
    AccessibilityInfo.announceForAccessibility(done ? 'Address copied' : "Couldn't copy the address");
    if (!done) return;
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), COPIED_MS);
  };
  return (
    <Pressable
      testID="receive-copy"
      accessibilityRole="button"
      accessibilityLabel={copied ? 'Copied' : 'Copy address'}
      onPress={() => void copy()}
      hitSlop={space.sm}
      style={({ pressed }) => [styles.copy, { backgroundColor: pressed ? colors.borderHairline : colors.surfaceSunken }]}
    >
      <Icon name={copied ? 'Check' : 'Copy'} size={14} color={colors.textPrimary} />
      <Text variant="body" style={[font(600), styles.copyLabel]}>
        {copied ? 'Copied' : 'Copy'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stack: { gap: space.lg },
  state: { flex: 1 },
  card: { borderRadius: QR.plateRadius, paddingVertical: space.md - 2, paddingHorizontal: space.lg },
  networkLabel: { letterSpacing: 1.2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: { height: 40, paddingHorizontal: space.lg, borderRadius: radius.chip, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  chipLabel: { fontSize: 15 },
  plateRow: { alignItems: 'center' },
  plate: { width: QR.plate + 2 * 0, padding: QR.pad, borderRadius: QR.plateRadius, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  address: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, borderRadius: radius.card + 6, borderWidth: StyleSheet.hairlineWidth },
  addressText: { flex: 1, minWidth: 0, fontSize: 17, lineHeight: canvasNormalLineHeight(17) },
  copy: { height: 36, paddingHorizontal: space.md, borderRadius: radius.chip, flexDirection: 'row', alignItems: 'center', gap: COPY_GAP, flexShrink: 0 },
  copyLabel: { fontSize: 14 },
  warning: { flexDirection: 'row', gap: space.md, padding: space.lg, borderRadius: radius.card + 6, alignItems: 'flex-start' },
  warningWords: { flex: 1, minWidth: 0 },
  warningLine: { marginTop: COPY_GAP / 2 },
});
