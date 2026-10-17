import { useQuery } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/client';
import { Card, GroupedList } from '@/components/Card';
import { useFocusRing } from '@/components/focusRing';
import { IconTile } from '@/components/IconTile';
import { ListRow } from '@/components/ListRow';
import { formatMoney, Money } from '@/components/Money';
import { Skeleton } from '@/components/Skeleton';
import { StatusPill } from '@/components/StatusPill';
import { Text } from '@/components/Text';
import { CreateFrame } from '@/features/create/CreateFrame';
import { AllowanceMeter } from '@/features/create/UploadsMeter';
import { countsKey, fetchCounts } from '@/features/library/api';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { fetchSettings, settingsKey, type PaidMessageSettings } from '@/features/paid-messages/api';
import { earningsQuery } from '@/features/wallet/earnings/api';
import { font, radius, space, useWawu } from '@/theme';

import { earningsKey, fetchMyEarnings, type MyEarnings } from './api';
import { barsOf, changeOf, contentLine, earnedTitle } from './model';

/**
 * design/_gen/me.js line 81 (`dash`): the body's parts are 16 apart; the earnings card is a 22 corner, 18 in, its parts 14 apart, the
 * label 13 / 600 in the secondary colour, the figure at 32, the twelve bars 40 high, 4 apart, 4 corners; the set-up section is the small
 * capital label 10 over its card.
 */
const DASH = { between: 16, cardPad: 18, cardBetween: 14, label: 13, figure: 32, barsHeight: 40, barBetween: 4, barCorner: 4, sectionBetween: 10, rowIcon: 44, skeletonCard: 150 } as const;

export type DashboardScreenProps = {
  onBack: () => void;
  /** The Paid messages row opens I21. */
  onOpenPaid: () => void;
  /** The wallet row, while the wallet is not open, opens Open your wallet (A26, R-6). */
  onOpenWallet: () => void;
  /** The Earnings row opens W39. */
  onOpenEarnings: () => void;
  /** The My content row opens M28. */
  onOpenLibrary: () => void;
};

/** "On · ₦300 a message", or "Off". Both figures are the Hub's; a price it has not set is not written. */
export function paidLine(s: Pick<PaidMessageSettings, 'enabled' | 'priceKobo'>): string {
  if (!s.enabled) return 'Off';
  return s.priceKobo && s.priceKobo > 0 ? `On · ${formatMoney(s.priceKobo, { decimals: false })} a message` : 'On';
}

/**
 * M18 · Creator dashboard. The month's earnings with the change on the month before and a bar for each of the last twelve months
 * (`GET /me/earnings`, the Hub's own figures), the uploads meter from the Hub's count, and the set-up list: the account (done, or
 * the screen is not one), Paid messages with its price, and the wallet, which asks for no identity check here (R-6): "Not opened" and
 * Open until the person has opened one, then done. Earnings lands in the wallet by itself (R-11), so its row says so and opens W39;
 * My content opens M28 with the Hub's counts. "Get verified" under the meter is added by ME-12 and "Host a community" by INBOX-14 (R-47).
 */
export function DashboardScreen({ onBack, onOpenPaid, onOpenWallet, onOpenEarnings, onOpenLibrary }: DashboardScreenProps) {
  const owner = useSessionAccount(undefined);
  const earnings = useQuery({ queryKey: earningsKey, queryFn: fetchMyEarnings, staleTime: 0 });
  const paid = useQuery({ queryKey: settingsKey, queryFn: fetchSettings, staleTime: 0 });
  const counts = useQuery({ queryKey: countsKey, queryFn: fetchCounts, staleTime: 0 });
  // Whether a wallet is open is what `GET /money/earnings` says (the same read W39 makes, so the two share it).
  const wallet = useQuery(earningsQuery(owner));
  // Back from a row (the price changed, a wallet opened, a piece deleted) shows what the Hub now says; the first focus is the opening.
  const opened = useRef(false);
  const { refetch: refetchEarnings } = earnings;
  const { refetch: refetchPaid } = paid;
  const { refetch: refetchCounts } = counts;
  const { refetch: refetchWallet } = wallet;
  useFocusEffect(
    useCallback(() => {
      if (!opened.current) {
        opened.current = true;
        return;
      }
      void refetchEarnings();
      void refetchPaid();
      void refetchCounts();
      void refetchWallet();
    }, [refetchEarnings, refetchPaid, refetchCounts, refetchWallet]),
  );

  return (
    <CreateFrame testID="creator-screen" title="Creator dashboard" onLeave={onBack} gap={DASH.between}>
      {earnings.data ? (
        <EarningsCard earnings={earnings.data} />
      ) : earnings.isError ? (
        <EarningsFailed message={isApiError(earnings.error) ? earnings.error.message : 'Check your connection and try again.'} onRetry={() => void earnings.refetch()} />
      ) : (
        <Skeleton testID="creator-earnings-loading" height={DASH.skeletonCard} radius={radius.card} />
      )}
      <AllowanceMeter />
      <View style={styles.section}>
        <Text variant="label" accessibilityRole="header">
          Set up
        </Text>
        <GroupedList testID="creator-setup">
          <ListRow testID="creator-account" lead={<IconTile icon="CircleCheck" tone="in" size={DASH.rowIcon} />} title="Creator account" subtitle="Done" />
          <ListRow
            testID="creator-paid"
            lead={<IconTile icon="MessageCircle" tone={paid.data?.enabled ? 'in' : 'neutral'} size={DASH.rowIcon} />}
            title="Paid messages"
            subtitle={paid.data ? paidLine(paid.data) : undefined}
            onPress={onOpenPaid}
          />
          <WalletRow open={wallet.data?.walletOpen} failed={wallet.isError} onOpen={onOpenWallet} onRetry={() => void wallet.refetch()} />
        </GroupedList>
      </View>
      <GroupedList testID="creator-more">
        <ListRow testID="creator-earnings" lead={<IconTile icon="Wallet" size={DASH.rowIcon} />} title="Earnings" subtitle="Lands in your wallet automatically" onPress={onOpenEarnings} />
        <ListRow testID="creator-content" lead={<IconTile icon="Library" size={DASH.rowIcon} />} title="My content" subtitle={counts.data ? contentLine(counts.data) : undefined} onPress={onOpenLibrary} />
      </GroupedList>
    </CreateFrame>
  );
}

/** The wallet's line of the list: "Open your wallet" with "Not opened" and Open until it is, then the done mark. Not drawn as a button once there is nothing to open. */
function WalletRow({ open, failed, onOpen, onRetry }: { open: boolean | undefined; failed: boolean; onOpen: () => void; onRetry: () => void }) {
  if (open === true) {
    return <ListRow testID="creator-wallet" lead={<IconTile icon="CircleCheck" tone="in" size={DASH.rowIcon} />} title="Your wallet" subtitle="Opened" />;
  }
  if (open === false) {
    return (
      <ListRow
        testID="creator-wallet"
        lead={<IconTile icon="IdCard" tone="warn" size={DASH.rowIcon} />}
        title="Open your wallet"
        subtitle="Not opened"
        trailing={<Text variant="linkStrong">Open</Text>}
        onPress={onOpen}
        accessibilityLabel="Open your wallet, not opened"
      />
    );
  }
  if (failed) {
    return (
      <ListRow
        testID="creator-wallet-error"
        lead={<IconTile icon="IdCard" tone="warn" size={DASH.rowIcon} />}
        title="Your wallet"
        subtitle="Could not check. Tap to try again"
        onPress={onRetry}
      />
    );
  }
  return (
    <View testID="creator-wallet-loading" style={styles.walletLoading}>
      <Skeleton height={DASH.rowIcon} radius={radius.tile} />
    </View>
  );
}

function EarningsCard({ earnings }: { earnings: MyEarnings }) {
  const { colors } = useWawu();
  const change = changeOf(earnings);
  return (
    <Card padded testID="creator-earned" style={styles.card}>
      <View style={styles.cardHead}>
        <Text variant="body" tone="textSecondary" testID="creator-earned-title" style={[font(600), styles.cardLabel]}>
          {earnedTitle(earnings)}
        </Text>
        {change ? <StatusPill testID="creator-earned-change" label={change.label} tone={change.tone} /> : null}
      </View>
      <Money testID="creator-earned-amount" minorUnits={earnings.earnedKobo} size={DASH.figure} />
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.bars}>
        {barsOf(earnings).map((bar) => (
          <View
            key={bar.month}
            style={[styles.bar, { height: `${Math.round(bar.share * 100)}%`, backgroundColor: bar.last ? colors.accent : colors.surfaceSunken }]}
          />
        ))}
      </View>
    </Card>
  );
}

/** The month's figure could not be read: the rest of the screen still works, and this says so with a way to ask again. */
function EarningsFailed({ message, onRetry }: { message: string; onRetry: () => void }) {
  const ring = useFocusRing();
  return (
    <Card padded testID="creator-earnings-error" style={styles.card}>
      <Text variant="body" style={font(600)}>
        Your earnings did not load
      </Text>
      <Text variant="caption" tone="textMuted">
        {message}
      </Text>
      <Pressable accessibilityRole="button" onPress={onRetry} testID="creator-earnings-retry" {...ring.handlers} style={ring.style}>
        <Text variant="linkStrong">Try again</Text>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: DASH.cardPad, gap: DASH.cardBetween },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  cardLabel: { fontSize: DASH.label, flexShrink: 1 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: DASH.barBetween, height: DASH.barsHeight },
  bar: { flex: 1, borderRadius: DASH.barCorner },
  section: { gap: DASH.sectionBetween },
  walletLoading: { minHeight: 64, justifyContent: 'center' },
});
