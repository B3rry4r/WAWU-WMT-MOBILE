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
import { biometricLook, PinSheet, type BiometricKind, type PinCheckResult } from '@/components/pin-sheet';
import { Switch } from '@/components/Switch';
import { Toast } from '@/components/Toast';
import { Text } from '@/components/Text';
import { disableApproval, enableApproval, useApprovalSwitch } from '@/features/device-approval';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { groupedAccountNumber } from '@/features/open-wallet/pin';
import { useOpenSupport } from '@/features/support/useOpenSupport';
import { canvasNormalLineHeight, radius, space } from '@/theme';

import { ScreenFrame } from '@/components/ScreenFrame';
import { ROW_TILE } from '@/features/settings/metrics';

import { walletSettingsQuery, type WalletSettings } from '../api/settings';
import { useStatementSent } from '../statements/notice';
import { AccountDetailsSheet } from './AccountDetailsSheet';
import { accountLine, approvalTitle, limitsLine, pinLine, turnOnLine } from './model';

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
  /** Statements: W38. Without it the row is not drawn. */
  onOpenStatements?: () => void;
};

/**
 * W35 · Wallet settings, read from `GET /money/wallet`: the PIN's age, the beneficiaries' count and the account the
 * bank gave. The bank's name is the server's (BRIEF W35: a slot, "Loma Bank" by default, R-1), and there is no tier:
 * the limits row is drawn only when the server sends a limit (the Hub fills it only from a provider that reports an account tier; Nuvion reports none) and hidden
 * otherwise.
 *
 * Drawn: what has a screen behind it or says something true by itself (R-47). Statements (WALLET-35) leads to W38 and
 * is drawn when the route gives it somewhere to go; W38's "Toast on W35" shows over this page. Left out, each added as
 * drawn by the task that builds where it leads: Cards (WALLET-22). Fingerprint or face for payments is drawn when this phone can keep a
 * key behind a biometric (FIX-108; SHARED-CHANGES WALLET-06 #1): the switch makes the key, asks the PIN on a sheet with no amount, and
 * registers it (`PUT /money/device`); off turns it off at the Hub and drops the key. Help with a payment, the
 * last row, opens the support chat (I12) with nothing attached, since no one payment is being asked about (SUPPORT-01, R-30; the
 * chat's own entries from H18 and W27 attach theirs). Beneficiaries is not drawn: no screen lists the saved recipients yet (a person
 * saves one from a receipt, W12), and a row that opens nothing is not shown (R-47, SWEEP-FLOWS B9). The screen that builds the list adds it.
 */
export function WalletSettingsScreen({ onBack, onOpenPin, onCreatePin, onOpenWallet, onOpenStatements }: WalletSettingsScreenProps) {
  const owner = useSessionAccount(undefined);
  const wallet = useQuery(walletSettingsQuery(owner), queryClient);
  const [showAccount, setShowAccount] = useState(false);
  // W38's ending: "Toast on W35", while the notice it posted is up.
  const sent = useStatementSent();
  const support = useOpenSupport();
  const data = wallet.data;
  // Fingerprint or face for payments (R-26): read again whenever the wallet read comes in, so a PIN reset (which turns it off at the Hub) shows.
  const approval = useApprovalSwitch(wallet.dataUpdatedAt);
  const [askPin, setAskPin] = useState(false);
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);
  const [switching, setSwitching] = useState(false);
  const [switchProblem, setSwitchProblem] = useState<string | null>(null);

  const turnOn = async (pin: string): Promise<PinCheckResult> => {
    if (approval.support === null) return { code: 'unanswered' };
    const outcome = await enableApproval({ pin, biometric: approval.support });
    switch (outcome.kind) {
      case 'done':
        setAskPin(false);
        approval.reload();
        return { code: 'approved' };
      case 'pin_incorrect':
        return { code: 'pin_incorrect', triesLeft: outcome.triesLeft };
      case 'pin_locked':
        setLockedUntil(outcome.lockedUntil);
        return { code: 'pin_locked', lockedUntil: outcome.lockedUntil };
      case 'pin_not_set':
        setAskPin(false);
        onCreatePin();
        return { code: 'approved' };
      case 'no_wallet':
        setAskPin(false);
        onOpenWallet();
        return { code: 'approved' };
      default:
        return { code: 'unanswered' };
    }
  };

  const turnOff = async () => {
    setSwitching(true);
    try {
      await disableApproval();
      approval.reload();
    } catch {
      setSwitchProblem("We couldn't turn it off. Try again.");
    } finally {
      setSwitching(false);
    }
  };

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
    body = (
      <Settings
        data={data}
        onOpenPin={onOpenPin}
        onCreatePin={onCreatePin}
        onOpenAccount={() => setShowAccount(true)}
        onOpenStatements={onOpenStatements}
        onOpenHelp={() => void support.open()}
        biometric={
          approval.support !== null
            ? { kind: approval.support, on: approval.on, busy: switching, onPress: approval.on ? () => void turnOff() : data.pin.isSet ? () => setAskPin(true) : onCreatePin }
            : undefined
        }
      />
    );
  }

  return (
    <ScreenFrame idPrefix="settings" title="Wallet settings" onBack={onBack} gap={BODY_GAP} testID="wallet-settings-screen">
      {body}
      <Toast message={sent} testID="statement-sent" />
      {switchProblem ? <Toast message={switchProblem} tone="alert" placement="top" lines={2} duration={4000} onHide={() => setSwitchProblem(null)} testID="wallet-settings-biometric-error" /> : null}
      {approval.support !== null ? (
        <PinSheet
          visible={askPin}
          onClose={() => setAskPin(false)}
          approval={{ purpose: turnOnLine(biometricLook(approval.support).name) }}
          onSubmit={turnOn}
          unansweredLine="We couldn't turn it on. Try again."
          lockedUntil={lockedUntil}
        />
      ) : null}
      {support.error ? <Toast message={support.error} tone="alert" placement="top" lines={2} duration={4000} onHide={support.clearError} testID="wallet-settings-help-error" /> : null}
      {data?.account ? <AccountDetailsSheet visible={showAccount} onClose={() => setShowAccount(false)} account={data.account} /> : null}
    </ScreenFrame>
  );
}

type SettingsProps = {
  data: WalletSettings;
  /** The fingerprint or face row; left out when this phone cannot keep a key behind a biometric. */
  biometric?: { kind: BiometricKind; on: boolean; busy: boolean; onPress: () => void };
  onOpenPin: () => void;
  onCreatePin: () => void;
  onOpenAccount: () => void;
  onOpenStatements?: () => void;
  onOpenHelp: () => void;
};

function Settings({ data, biometric, onOpenPin, onCreatePin, onOpenAccount, onOpenStatements, onOpenHelp }: SettingsProps) {
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
        {biometric ? <BiometricRow {...biometric} /> : null}
      </GroupedList>
      <GroupedList testID="wallet-settings-account">
        {onOpenStatements ? (
          <ListRow
            testID="wallet-settings-statements"
            lead={<IconTile icon="FileText" size={ROW_TILE} />}
            title="Statements"
            subtitle="Sent to your email"
            onPress={onOpenStatements}
          />
        ) : null}
        {data.account ? (
          <ListRow
            testID="wallet-settings-account-details"
            lead={<IconTile icon="Landmark" size={ROW_TILE} />}
            title="Account details"
            subtitle={accountLine(data.account.bankName, groupedAccountNumber(data.account.accountNumber))}
            onPress={onOpenAccount}
          />
        ) : null}
        <ListRow testID="wallet-settings-help" lead={<IconTile icon="LifeBuoy" size={ROW_TILE} />} title="Help with a payment" onPress={onOpenHelp} />
      </GroupedList>
    </>
  );
}

/** W35's "Face ID for payments" row, named for what the phone has (R-26): the tile and a switch, as drawn. */
function BiometricRow({ kind, on, busy, onPress }: { kind: BiometricKind; on: boolean; busy: boolean; onPress: () => void }) {
  const look = biometricLook(kind);
  const title = approvalTitle(look.name);
  return (
    <ListRow
      testID="wallet-settings-biometric"
      lead={<IconTile icon={look.icon} size={ROW_TILE} />}
      title={title}
      accessibilityLabel={`${title}, ${on ? 'on' : 'off'}`}
      trailing={<Switch on={on} busy={busy} />}
      onPress={busy ? undefined : onPress}
    />
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
