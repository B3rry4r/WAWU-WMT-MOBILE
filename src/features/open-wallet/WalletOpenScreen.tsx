import { useQuery } from '@tanstack/react-query';
import { useIsFocused } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { GroupedList } from '@/components/Card';
import { Icon } from '@/components/icon';
import { KeyValueRow, rowMetrics } from '@/components/ListRow';
import { formatMoney } from '@/components/Money';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { font, radius, space, useWawu } from '@/theme';

import { AuthFrame } from '@/features/auth/AuthFrame';

import { openedWalletQuery, type OpenedWallet } from './api/wallet';
import { copyText } from './copy';
import { OpenWalletEnd } from './OpenWalletEnd';
import { groupedAccountNumber } from './pin';
import { useSessionAccount } from './sessionAccount';

/**
 * design/_gen/auth.js line 45, `walletOpen`: the kit's `result` (positive,
 * Check) 60 down, 18 between it and the card of `kv` rows, the button
 * "Create your transaction PIN" with an arrow.
 */
const A8 = { top: 60, between: 18 } as const;
/** kit.js line 61, `copyBtn`: 32 high, 12 at the sides, a pill on the sunken surface, the Copy glyph 14, the word 13 / 600, 6 between. */
const COPY = { height: 32, padX: 12, icon: 14, label: 13, iconGap: 6 } as const;
/** How long the button says "Copied" before it reads "Copy" again. Default (agent), owner may override. */
const COPIED_MS = 2000;
/** The loading view's stand-ins for the title, the bank line and the rows. */
const SKELETON = { circle: 88, title: 30, titleWidth: '70%', line: 15, lineWidth: '40%', rows: 3 } as const;
const KOBO_PER_NAIRA = 100;

const TITLE = 'Your wallet is open';

export type WalletOpenScreenProps = {
  /** "Create your transaction PIN" (A9). */
  onCreatePin: () => void;
  /** Back to where Open your wallet started: Done when a PIN is already set, and the way out of a state with nothing to do here. */
  onDone: () => void;
  /** No wallet for this account (reached by a link or a reload): Open your wallet starts at A26. */
  onNoWallet: () => void;
};

/**
 * A8 · Wallet open (KYC-04), the step after A7: the account Fintava opened,
 * as the server records it. The bank name is the server's (BRIEF A8: a slot,
 * "Loma Bank", the long legal name wrapping), there is no tier and no "Raise
 * your limits", and the Limit row shows only when the server sends a limit
 * (it sends none today, BACKEND_GAPS G-7, G-114). Nothing here is a balance.
 */
export function WalletOpenScreen({ onCreatePin, onDone, onNoWallet }: WalletOpenScreenProps) {
  const signedIn = useSessionAccount(undefined);
  const owner = signedIn ?? undefined;
  const wallet = useQuery(openedWalletQuery(owner));
  const state = wallet.data?.state;

  // A9 and A10 sit on top of this screen, which stays mounted under them. Whatever the cache held when they opened
  // (a PIN not yet set) may be out of date by the time the person comes back (Back from A10's unknown state, where
  // the PIN may have been set), so every return reads the wallet again, and the loading view shows until it answers.
  const focused = useIsFocused();
  const [away, setAway] = useState(false);
  const { refetch } = wallet;
  // Behind A9 (not in front): remembered while rendering, so the first frame back is already the loading view.
  if (!focused && !away) setAway(true);
  useEffect(() => {
    if (!focused || !away) return undefined;
    let current = true;
    void refetch().finally(() => {
      if (current) setAway(false);
    });
    return () => {
      current = false;
    };
  }, [focused, away, refetch]);

  useEffect(() => {
    if (state === 'not_open') onNoWallet();
  }, [state, onNoWallet]);

  // While it is read again, never the cached offer: the loading view.
  if (focused && (away || wallet.isFetching)) return <Loading />;
  // A read that failed is not answered with what the cache held before it.
  if (wallet.isError) {
    return (
      <AuthFrame testID="open-wallet-account-error" onBack={onDone}>
        <ErrorState
          title="We couldn't show your account"
          message={isApiError(wallet.error) ? wallet.error.message : 'Something went wrong. Try again.'}
          onRetry={() => void wallet.refetch()}
        />
      </AuthFrame>
    );
  }
  if (!wallet.data || state === 'not_open') return <Loading />;
  if (state === 'opening') {
    return (
      <OpenWalletEnd
        testID="open-wallet-account-opening"
        tone="warn"
        icon="Clock"
        title="Your account is opening"
        message="Check again in a moment."
        actionLabel="Done"
        onAction={onDone}
      />
    );
  }
  return <AccountOpened wallet={wallet.data} onCreatePin={onCreatePin} onDone={onDone} />;
}

function AccountOpened({ wallet, onCreatePin, onDone }: { wallet: OpenedWallet; onCreatePin: () => void; onDone: () => void }) {
  const { colors } = useWawu();
  const account = wallet.account;
  if (!account) return null;
  const limit = wallet.limits;
  return (
    <OpenWalletEnd
      testID="open-wallet-account"
      tone="in"
      icon="Check"
      title={TITLE}
      message={account.bankName}
      // A PIN set before (BACKEND_GAPS G-41) has nothing to create: the flow ends here.
      actionLabel={wallet.pinIsSet ? 'Done' : 'Create your transaction PIN'}
      onAction={wallet.pinIsSet ? onDone : onCreatePin}
      top={A8.top}
      between={A8.between}
    >
      <GroupedList testID="open-wallet-account-card">
        <KeyValueRow label="Account name" value={account.accountName} testID="open-wallet-account-name" />
        <KeyValueRow
          label="Account number"
          testID="open-wallet-account-number"
          value={
            <>
              <Text variant="body" numberOfLines={1} selectable style={[font(600), styles.value]} testID="open-wallet-account-number-value">
                {groupedAccountNumber(account.accountNumber)}
              </Text>
              <CopyButton value={account.accountNumber} />
            </>
          }
        />
        <KeyValueRow
          label="Bank"
          testID="open-wallet-account-bank"
          value={
            // The long legal name ("Iyin Ekiti Microfinance Bank Limited (Loma Bank)") wraps to a second line, then truncates (BRIEF A8).
            <Text variant="body" numberOfLines={2} style={[font(600), styles.value, styles.wrapValue, { color: colors.textPrimary }]}>
              {account.bankName}
            </Text>
          }
        />
        {limit ? (
          <KeyValueRow
            label="Limit"
            testID="open-wallet-account-limit"
            value={`${formatMoney(limit.dailyLimitKobo, { decimals: limit.dailyLimitKobo % KOBO_PER_NAIRA !== 0 })} a day`}
          />
        ) : null}
      </GroupedList>
    </OpenWalletEnd>
  );
}

/** A8's Copy: the account number as sent, digits only, onto the clipboard; it reads "Copied" for a moment after. */
function CopyButton({ value }: { value: string }) {
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
    AccessibilityInfo.announceForAccessibility(done ? 'Account number copied' : "Couldn't copy the account number");
    if (!done) return;
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), COPIED_MS);
  };
  const label = copied ? 'Copied' : 'Copy';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={copied ? 'Copied' : 'Copy account number'}
      onPress={() => void copy()}
      hitSlop={space.sm}
      testID="open-wallet-account-copy"
      style={({ pressed }) => [styles.copy, { backgroundColor: pressed ? colors.borderHairline : colors.surfaceSunken }]}
    >
      <Icon name={copied ? 'Check' : 'Copy'} size={COPY.icon} color={colors.textPrimary} />
      <Text variant="body" style={[font(600), styles.copyLabel]}>
        {label}
      </Text>
    </Pressable>
  );
}

function Loading() {
  return (
    <AuthFrame testID="open-wallet-account-loading" bare contentTop={A8.top}>
      <LoadingView label="Loading your account">
        <View style={styles.loading}>
          <View style={styles.loadingHead}>
            <Skeleton width={SKELETON.circle} height={SKELETON.circle} radius={radius.chip} />
            <Skeleton width={SKELETON.titleWidth} height={SKELETON.title} />
            <Skeleton width={SKELETON.lineWidth} height={SKELETON.line} />
          </View>
          {Array.from({ length: SKELETON.rows }, (_, i) => (
            <Skeleton key={i} height={rowMetrics.pairMinHeight} />
          ))}
        </View>
      </LoadingView>
    </AuthFrame>
  );
}

const styles = StyleSheet.create({
  value: { fontSize: rowMetrics.pairValue, flexShrink: 1 },
  wrapValue: { textAlign: 'right' },
  copy: { height: COPY.height, paddingHorizontal: COPY.padX, borderRadius: radius.chip, flexDirection: 'row', alignItems: 'center', gap: COPY.iconGap, flexShrink: 0 },
  copyLabel: { fontSize: COPY.label },
  loading: { gap: A8.between },
  loadingHead: { alignItems: 'center', gap: space.md },
});
