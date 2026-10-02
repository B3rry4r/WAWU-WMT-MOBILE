import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { PaySheet, type PaySheetProps } from '@/components/pay-sheet';
import { useWawu } from '@/theme';

/**
 * Development-only gallery of the pay sheet's states, for screenshots beside
 * the H14, H17 and W10 artboards: /preview/pay-sheet?state=<name>.
 * The amounts are the brief's example values (docs/designer/BRIEF.md), not
 * prices. A release build redirects home.
 */

const unlock = {
  item: {
    title: 'How I built a ₦2M a month agency',
    subtitle: 'Chidi Eze · Video · 18 min',
    image: require('../../../assets/images/icon.png'),
  },
  amountKobo: 250000,
  details: [{ label: 'Yours', value: 'Forever, in My purchases' }],
  fees: [{ label: "Fintava's charge", amountKobo: 2325 }],
  walletName: 'Naira wallet',
  actionLabel: 'Unlock',
} satisfies Partial<PaySheetProps>;

const open = (balanceKobo: number) => ({ kind: 'open', balanceKobo }) as const;

const cases: Record<string, Omit<PaySheetProps, 'onPay' | 'onAddMoney' | 'onOpenWallet' | 'onCancel'>> = {
  enough: { ...unlock, wallet: open(48525075), status: { kind: 'review' } },
  short: { ...unlock, wallet: open(120000), status: { kind: 'review' } },
  paying: { ...unlock, wallet: open(48525075), status: { kind: 'paying' } },
  confirming: { ...unlock, wallet: open(48525075), status: { kind: 'confirming' } },
  failed: { ...unlock, wallet: open(48525075), status: { kind: 'failed' } },
  'no-wallet': { ...unlock, wallet: { kind: 'none' }, status: { kind: 'review' } },
  loading: { ...unlock, wallet: { kind: 'loading' }, status: { kind: 'review' } },
  'zero-fee': {
    ...unlock,
    fees: [{ label: "Fintava's charge", amountKobo: 0 }],
    wallet: open(48525075),
    status: { kind: 'review' },
  },
  send: {
    item: { title: 'Chidinma Adaeze Okoro', subtitle: 'Guaranty Trust Bank · 0123456789' },
    amountLabel: 'Amount',
    amountKobo: 2500000,
    details: [{ label: 'Note', value: 'Rent contribution' }],
    fees: [
      { label: "Fintava's charge", amountKobo: 4000 },
      { label: "WAWU's fee", amountKobo: 2500 },
    ],
    walletName: 'Naira wallet',
    actionLabel: 'Send',
    recipientGetsKobo: 2500000,
    wallet: open(48525075),
    status: { kind: 'review' },
  },
};

export default function PaySheetPreview() {
  const { colors } = useWawu();
  const { state } = useLocalSearchParams<{ state?: string }>();
  if (!__DEV__) return <Redirect href="/" />;

  const shown = cases[state ?? 'enough'] ?? cases.enough;
  const go = (next: string) => router.setParams({ state: next });

  return (
    <View style={[styles.root, { backgroundColor: colors.surfacePage }]}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.surfaceScrim }]} />
      <PaySheet
        {...shown}
        onPay={() => go('paying')}
        onAddMoney={() => go('enough')}
        onOpenWallet={() => go('enough')}
        onCancel={() => go('enough')}
        onRetry={() => go('paying')}
        onRefresh={() => go('enough')}
        onContactSupport={() => go('enough')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
});
