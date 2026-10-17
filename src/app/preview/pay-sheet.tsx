import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { IconButton } from '@/components/Button';
import { PaySheet, type PaySheetProps } from '@/components/pay-sheet';
import { font, layout, space, type, useWawu } from '@/theme';
import { LeaveDevRoute } from '@/features/shell/LeaveDevRoute';

/**
 * Development-only gallery of the pay sheet's states, for screenshots beside
 * the H14, H17 and W10 artboards: /preview/pay-sheet?state=<name>. The seller
 * carries a professional tick, as H14 draws it; &tick=creator or &tick=off
 * changes it. The send states draw W10's nav bar above the sheet, as the
 * WALLET-02 screen will.
 * The amounts are the brief's example values (docs/designer/BRIEF.md), not
 * prices. A release build redirects home.
 */

const unlock = {
  item: {
    title: 'How I built a ₦2M a month agency',
    by: 'Chidi Eze',
    subtitle: 'Video · 18 min',
    image: require('../../../assets/images/icon.png'),
  },
  amountKobo: 250000,
  details: [{ label: 'Yours', value: 'Forever, in My purchases' }],
  fees: [{ label: 'Bank charge', amountKobo: 2325 }],
  walletName: 'Naira wallet',
  actionLabel: 'Unlock',
} satisfies Partial<PaySheetProps>;

const open = (balanceKobo: number) => ({ kind: 'open', balanceKobo }) as const;

const cases: Record<string, Omit<PaySheetProps, 'onPay' | 'onCancel'>> = {
  enough: { ...unlock, wallet: open(48525075), status: { kind: 'review' } },
  short: { ...unlock, wallet: open(120000), status: { kind: 'review' } },
  paying: { ...unlock, wallet: open(48525075), status: { kind: 'paying' } },
  confirming: { ...unlock, wallet: open(48525075), status: { kind: 'confirming' } },
  failed: { ...unlock, wallet: open(48525075), status: { kind: 'failed' } },
  'no-wallet': { ...unlock, wallet: { kind: 'none' }, status: { kind: 'review' } },
  loading: { ...unlock, wallet: { kind: 'loading' }, status: { kind: 'review' } },
  'zero-fee': {
    ...unlock,
    fees: [{ label: 'Bank charge', amountKobo: 0 }],
    wallet: open(48525075),
    status: { kind: 'review' },
  },
  send: {
    variant: 'send',
    item: { title: 'Chidinma Adaeze Okoro', displayName: 'Chidinma Okoro', avatar: { hue: 'coral' } },
    amountKobo: 2500000,
    details: [
      { label: 'Bank', value: 'Guaranty Trust Bank' },
      { label: 'Account', value: '0123456789' },
    ],
    fees: [
      { label: 'Bank charge', amountKobo: 4000 },
      { label: "WAWU's fee", amountKobo: 2500 },
    ],
    notes: [{ label: 'Note', value: 'Rent contribution' }],
    walletName: 'Naira wallet',
    actionLabel: 'Send',
    recipientGetsKobo: 2500000,
    wallet: open(48525075),
    status: { kind: 'review' },
  },
  'send-short': {
    variant: 'send',
    item: { title: 'Chidinma Adaeze Okoro', displayName: 'Chidinma Okoro', avatar: { hue: 'coral' } },
    amountKobo: 2500000,
    fees: [
      { label: 'Bank charge', amountKobo: 4000 },
      { label: "WAWU's fee", amountKobo: 2500 },
    ],
    walletName: 'Naira wallet',
    actionLabel: 'Send',
    wallet: open(2500000),
    status: { kind: 'review' },
  },
};

export default function PaySheetPreview() {
  const { colors } = useWawu();
  const { state, tick } = useLocalSearchParams<{ state?: string; tick?: string }>();
  if (!__DEV__) return <LeaveDevRoute />;

  const shown = cases[state ?? 'enough'] ?? cases.enough;
  const go = (next: string) => router.setParams({ state: next });

  const tickKind = tick === 'off' ? undefined : tick === 'creator' ? 'creator' : 'pro';
  const sheet = (
    <PaySheet
      {...shown}
      item={{ ...shown.item, verified: shown.item.by !== undefined ? tickKind : undefined }}
      onPay={() => go('paying')}
      onOpenWallet={() => router.push('/open-wallet')}
      onCancel={() => go('enough')}
      onRetry={() => go('paying')}
      onRefresh={() => go('enough')}
      onContactSupport={() => go('enough')}
    />
  );

  if (shown.variant === 'send') {
    return (
      <View style={[styles.page, { backgroundColor: colors.surfacePage }]}>
        <View style={styles.nav}>
          <IconButton icon="ChevronLeft" label="Back" onPress={() => go('enough')} size={BACK} />
          <Text style={[styles.navTitle, { color: colors.textPrimary }]}>Review</Text>
          <View style={styles.backSpace} />
        </View>
        {sheet}
      </View>
    );
  }
  return (
    <View style={[styles.root, { backgroundColor: colors.surfacePage }]}>
      {sheet}
    </View>
  );
}

/** W10's nav: a 42 px back button and the title, 56 px tall (kit `nav`). */
const BACK = layout.tapMin - space.xs / 2;

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  page: { flex: 1, paddingTop: layout.tapMin },
  nav: {
    height: layout.controlH + space.sm,
    paddingHorizontal: layout.gutter,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  backSpace: { width: BACK },
  navTitle: { ...font(700), flex: 1, textAlign: 'center', fontSize: type.size.h3 + 1, letterSpacing: -0.02 * (type.size.h3 + 1) },
});
