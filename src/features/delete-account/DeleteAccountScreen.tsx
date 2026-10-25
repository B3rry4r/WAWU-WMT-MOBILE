import { useQuery } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Icon } from '@/components/icon';
import { Skeleton } from '@/components/Skeleton';
import { Text } from '@/components/Text';
import { AuthFrame } from '@/features/auth/AuthFrame';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { homeBalanceQuery, walletHomeQuery } from '@/features/wallet/api/home';
import { homeView } from '@/features/wallet/home/model';
import { radius, space, useWawu } from '@/theme';

import { canContinue, moneyLine, walletView, type WalletView } from './model';
import { WalletNotice } from './WalletNotice';

/** design/_gen/settings.js line 15 (Z6): the title block 6 apart with an `h1` at 24, the parts 16 apart, the card 14 by 16 with 10 between its rows, a 15 cross, 8, the words at 14. */
const LOOK = { title: 24, titleGap: 6, parts: space.lg, cardPadV: 14, rowSpace: 10, cross: 15, crossStroke: 2.4, crossGap: 8, rowText: 14 } as const;

/**
 * What goes with the account. The board's third row says "Your wallet and cards": cards are built now (R-84 settled R-16's open
 * question), so it says so (CHECK-3 L-9). A person with no wallet (R-6) has none to lose, so that row is not drawn for them.
 */
const GOES = ['Your profile, content and communities', 'Your purchases and tickets'] as const;
const GOES_WALLET = 'Your wallet and cards';

export type DeleteAccountScreenProps = {
  onBack: () => void;
  /** Withdraw: W17. */
  onWithdraw: () => void;
  /** Continue: Z7. */
  onContinue: () => void;
};

/**
 * Z6 · Delete account. The wallet must be empty first (R-17): the bank's own balance decides, read the way the Wallet tab reads it. With
 * money in it the warning shows the figure and Withdraw, and Continue waits; with no wallet there is no warning and Continue is open (R-6);
 * when the balance cannot be read the screen says so and never takes it for empty. The waiting period is the Hub's (Z8 shows its date), so
 * no figure for it is written here (G-SETTINGS-05-1).
 */
export function DeleteAccountScreen({ onBack, onWithdraw, onContinue }: DeleteAccountScreenProps) {
  const owner = useSessionAccount(undefined);
  const wallet = useQuery(walletHomeQuery(owner));
  const open = wallet.data?.state === 'open' || wallet.data?.state === 'frozen';
  const balance = useQuery(homeBalanceQuery(owner, open));
  const view = walletView(homeView(wallet, balance));
  const retry = () => {
    void wallet.refetch();
    if (open) void balance.refetch();
  };
  const rows = view.kind === 'clear' && !view.hasWallet ? GOES : [...GOES, GOES_WALLET];

  return (
    <AuthFrame
      testID="delete-account-screen"
      navTitle="Delete account"
      onBack={onBack}
      footer={<Button testID="delete-continue" label="Continue" full disabled={!canContinue(view)} onPress={onContinue} />}
    >
      <View style={styles.body}>
        <View style={styles.titleBlock}>
          <Text variant="h1" accessibilityRole="header" style={{ fontSize: LOOK.title }}>
            Delete your account?
          </Text>
          <Text variant="muted">This can&apos;t be undone once the wait is over.</Text>
        </View>
        <WalletPart view={view} onWithdraw={onWithdraw} onRetry={retry} />
        <Card style={styles.goes} testID="delete-goes">
          {view.kind === 'loading' ? <GoesSkeleton /> : rows.map((row) => <GoesRow key={row} text={row} />)}
        </Card>
      </View>
    </AuthFrame>
  );
}

function WalletPart({ view, onWithdraw, onRetry }: { view: WalletView; onWithdraw: () => void; onRetry: () => void }) {
  if (view.kind === 'loading') return <Skeleton testID="delete-wallet-loading" height={110} radius={radius.tile} />;
  if (view.kind === 'money') {
    return (
      <WalletNotice
        testID="delete-wallet-warning"
        title="Empty your wallet first"
        body={moneyLine(view.kobo)}
        action={{ testID: 'delete-withdraw', label: 'Withdraw', onPress: onWithdraw }}
      />
    );
  }
  if (view.kind === 'notice') {
    return <WalletNotice testID="delete-wallet-notice" title={view.title} body={view.message} action={{ testID: 'delete-wallet-retry', label: view.action, onPress: onRetry }} />;
  }
  return null;
}

function GoesRow({ text }: { text: string }) {
  const { colors } = useWawu();
  return (
    <View style={styles.row}>
      <Icon name="X" size={LOOK.cross} color={colors.danger} strokeWidth={LOOK.crossStroke} />
      <Text variant="body" style={{ fontSize: LOOK.rowText }}>
        {text}
      </Text>
    </View>
  );
}

function GoesSkeleton() {
  return (
    <>
      <Skeleton width="80%" height={16} />
      <Skeleton width="60%" height={16} />
      <Skeleton width="40%" height={16} />
    </>
  );
}

const styles = StyleSheet.create({
  body: { gap: LOOK.parts },
  titleBlock: { gap: LOOK.titleGap },
  goes: { gap: LOOK.rowSpace, paddingVertical: LOOK.cardPadV, paddingHorizontal: space.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: LOOK.crossGap },
});
