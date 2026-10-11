import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { Card, GroupedList } from '@/components/Card';
import { IconTile } from '@/components/IconTile';
import { ListRow, rowMetrics } from '@/components/ListRow';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { groupedAccountNumber } from '@/features/open-wallet/pin';
import { canvasNormalLineHeight, radius, space } from '@/theme';

import { SettingsFrame } from '@/features/settings/SettingsFrame';
import { ROW_TILE } from '@/features/settings/metrics';

import { walletSettingsQuery, type WalletSettings } from '../api/settings';
import { AccountDetailsSheet } from './AccountDetailsSheet';
import { accountLine, limitsLine, pinLine, savedLine } from './model';

/** design/_gen/wallet.js line 143 (W35): the parts of the page stand 14 apart. */
const BODY_GAP = 14;
/** Line 143, the limits card: padded 14 by 16, its tile 44 and 13 from the words, the title 15 / 600 and the line 13 muted, 2 under it. */
const LIMITS = { padV: 14, between: 13, title: 15, line: 13, lineGap: 2 } as const;
/** The loading view's stand-ins: the card, and the rows of the two lists. */
const SKELETON = { card: 78, first: 2, second: 1 } as const;

export type WalletSettingsScreenProps = {
  onBack: () => void;
  /** Transaction PIN: W36 (change it). */
  onOpenPin: () => void;
  /** Transaction PIN when none is set yet: A9 (create it). */
  onCreatePin: () => void;
  /** The account has no wallet: Open your wallet. */
  onOpenWallet: () => void;
};

/**
 * W35 · Wallet settings, read from `GET /money/wallet`: the PIN's age, the beneficiaries' count and the account the
 * bank gave. The bank's name is the server's (BRIEF W35: a slot, "Loma Bank" by default, R-1), and there is no tier:
 * the limits row is drawn only when the server sends a limit (it sends none today, BACKEND_GAPS G-7) and hidden
 * otherwise.
 *
 * Drawn: what has a screen behind it or says something true by itself (R-47). Left out, each added as drawn by the
 * task that builds where it leads: Fingerprint or face for payments (WALLET-06 itself, but it needs a signing package
 * and a PIN sheet without an amount, SHARED-CHANGES WALLET-06 #1), Cards (WALLET-22), Statements (WALLET-35), Help
 * with a payment (SUPPORT-01). Beneficiaries shows the count and, until the list screen (WALLET-03) can be opened
 * from here, has no chevron and opens nothing.
 */
export function WalletSettingsScreen({ onBack, onOpenPin, onCreatePin, onOpenWallet }: WalletSettingsScreenProps) {
  const owner = useSessionAccount(undefined);
  const wallet = useQuery(walletSettingsQuery(owner), queryClient);
  const [showAccount, setShowAccount] = useState(false);
  const data = wallet.data;

  let body: React.ReactNode;
  if (data === undefined && wallet.isError) {
    body = (
      <ErrorState
        testID="wallet-settings-error"
        icon={isApiError(wallet.error) && wallet.error.kind === 'network' ? 'WifiOff' : 'TriangleAlert'}
        title="We couldn't load your wallet"
        message={isApiError(wallet.error) ? wallet.error.message : 'Something went wrong. Try again.'}
        onRetry={() => void wallet.refetch()}
      />
    );
  } else if (data === undefined) {
    body = <Loading />;
  } else if (data.state === 'not_open') {
    body = (
      <EmptyState
        testID="wallet-settings-none"
        icon="Wallet"
        title="You don't have a wallet yet"
        message="Open your wallet to continue."
        action={{ label: 'Open your wallet', onPress: onOpenWallet }}
      />
    );
  } else if (data.state === 'opening') {
    body = (
      <EmptyState
        testID="wallet-settings-opening"
        icon="Clock"
        title="Your account is opening"
        message="Check again in a moment."
        action={{ label: 'Check again', onPress: () => void wallet.refetch() }}
      />
    );
  } else {
    body = <Settings data={data} onOpenPin={onOpenPin} onCreatePin={onCreatePin} onOpenAccount={() => setShowAccount(true)} />;
  }

  return (
    <SettingsFrame title="Wallet settings" onBack={onBack} gap={BODY_GAP} testID="wallet-settings-screen">
      {body}
      {data?.account ? <AccountDetailsSheet visible={showAccount} onClose={() => setShowAccount(false)} account={data.account} /> : null}
    </SettingsFrame>
  );
}

type SettingsProps = { data: WalletSettings; onOpenPin: () => void; onCreatePin: () => void; onOpenAccount: () => void };

function Settings({ data, onOpenPin, onCreatePin, onOpenAccount }: SettingsProps) {
  const limits = data.limits ? limitsLine(data.limits) : null;
  return (
    <>
      {limits ? (
        <Card padded style={styles.limits} testID="wallet-settings-limits">
          <View accessible accessibilityLabel={`${limits.title}, ${limits.subtitle}`} style={styles.limitsRow}>
            <IconTile icon="ShieldCheck" tone="accent" size={ROW_TILE} />
            <View style={styles.limitsWords}>
              <Text variant="cardTitle">{limits.title}</Text>
              <Text variant="meta" tone="textMuted" style={styles.limitsLine}>
                {limits.subtitle}
              </Text>
            </View>
          </View>
        </Card>
      ) : null}
      <GroupedList testID="wallet-settings-security">
        <ListRow
          testID="wallet-settings-pin"
          lead={<IconTile icon="KeyRound" size={ROW_TILE} />}
          title="Transaction PIN"
          subtitle={pinLine(data.pin, new Date())}
          onPress={data.pin.isSet ? onOpenPin : onCreatePin}
        />
        <ListRow testID="wallet-settings-beneficiaries" lead={<IconTile icon="Users" size={ROW_TILE} />} title="Beneficiaries" subtitle={savedLine(data.beneficiaryCount)} />
      </GroupedList>
      {data.account ? (
        <GroupedList testID="wallet-settings-account">
          <ListRow
            testID="wallet-settings-account-details"
            lead={<IconTile icon="Landmark" size={ROW_TILE} />}
            title="Account details"
            subtitle={accountLine(data.account.bankName, groupedAccountNumber(data.account.accountNumber))}
            onPress={onOpenAccount}
          />
        </GroupedList>
      ) : null}
    </>
  );
}

/** The page before the wallet has answered: the card's and the rows' shapes, never a figure or a name. */
function Loading() {
  return (
    <LoadingView label="Loading your wallet settings" testID="wallet-settings-loading">
      <View style={styles.loading}>
        <Skeleton height={SKELETON.card} radius={radius.card} />
        <Skeleton height={SKELETON.first * rowMetrics.minHeight} radius={radius.card} />
        <Skeleton height={SKELETON.second * rowMetrics.minHeight} radius={radius.card} />
      </View>
    </LoadingView>
  );
}

const styles = StyleSheet.create({
  limits: { paddingVertical: LIMITS.padV },
  limitsRow: { flexDirection: 'row', alignItems: 'center', gap: LIMITS.between },
  limitsWords: { flex: 1, minWidth: 0 },
  limitsLine: { fontSize: LIMITS.line, lineHeight: canvasNormalLineHeight(LIMITS.line), marginTop: LIMITS.lineGap },
  loading: { gap: BODY_GAP, paddingTop: space.xs },
});
