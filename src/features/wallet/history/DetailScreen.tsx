import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, RefreshControl, Share, StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { GroupedList } from '@/components/Card';
import { useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { IconTile } from '@/components/IconTile';
import { KeyValueRow, rowMetrics } from '@/components/ListRow';
import { Money } from '@/components/Money';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { StatusPill } from '@/components/StatusPill';
import { EmptyState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { copyText } from '@/features/open-wallet/copy';
import { transactionReference } from '@/features/support/api';
import { useOpenSupport } from '@/features/support/useOpenSupport';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { AuthFrame } from '@/features/auth/AuthFrame';
import { radius, space, useWawu } from '@/theme';

import { transactionQuery, type Transaction } from '../api/history';
import { LoadFailed } from './HistoryParts';
import { receiptOf, shareText, type RowLead } from './model';

/**
 * design/_gen/wallet.js line 119 (W27): the body's parts stand 20 apart; the head stands 8 apart, padded 6 above, its line 14 in
 * the secondary colour 6 under the picture, the pill 4 under the figure; the figure is 40 and the picture 64. The reference's
 * copy glyph is 14 in the muted colour.
 */
const DETAIL = { parts: 20, headGap: 8, headTop: 6, picture: 64, lineTop: 6, line: 14, figure: 40, pillTop: 4, copy: 14, copyMs: 1600, noticeIcon: 15, partMoney: 14.5, actionsGap: 10 } as const;

export type DetailScreenProps = {
  id: string;
  onBack: () => void;
};

/**
 * W27 · Transaction detail: one movement as a receipt, from `GET /money/transactions/{id}`. Every line is a field the Hub sent: the
 * type, what it was on, from and to, the date (Lagos time) and the reference, which can be copied. A debit adds its parts under
 * the card, the amount, the provider's charge, WAWU's fee when there is one and the total (BRIEF W27, R-10), so the charge behind
 * its row on W26 can be checked here. Share receipt opens the phone's share sheet with the receipt's text and reference (R-33).
 *
 * Report a problem, beside Share receipt as drawn, opens the support chat (I12) with this transaction already written as its first
 * message (SUPPORT-01, R-30), so nobody describes it twice. A chat that could not be opened says so in the same line a failed share does.
 *
 * Default (agent), owner may override: the debit's parts sit in their own card under the canvas's card, which stays as drawn.
 */
export function DetailScreen({ id, onBack }: DetailScreenProps) {
  const owner = useSessionAccount(undefined);
  const { colors } = useWawu();
  const read = useQuery(transactionQuery(owner, id), queryClient);
  const row = read.data;
  const [shareNotice, setNotice] = useState<string | null>(null);
  const [pulled, setPulled] = useState(false);
  const support = useOpenSupport();
  const notice = shareNotice ?? support.error;

  const share = async () => {
    if (!row) return;
    setNotice(null);
    support.clearError();
    try {
      await Share.share({ message: shareText(row) });
    } catch {
      setNotice('Sharing isn’t available on this device.');
      AccessibilityInfo.announceForAccessibility('Sharing is not available on this device.');
    }
  };

  const notFound = read.isError && !row && isApiError(read.error) && read.error.kind === 'not_found';
  let body;
  if (row) {
    body = <Receipt row={row} />;
  } else if (notFound) {
    body = (
      <EmptyState
        testID="detail-missing"
        icon="Receipt"
        title="We couldn’t find that transaction"
        message={isApiError(read.error) && read.error.message ? read.error.message : 'It may have been removed.'}
      />
    );
  } else if (read.isError) {
    body = <LoadFailed testID="detail-error" error={read.error} what="this transaction" onRetry={() => void read.refetch()} />;
  } else {
    body = <DetailSkeleton />;
  }

  return (
    <AuthFrame
      testID="detail-screen"
      navTitle="Details"
      onBack={onBack}
      refreshControl={
        row ? (
          <RefreshControl
            refreshing={pulled}
            tintColor={colors.accent}
            onRefresh={() => {
              setPulled(true);
              void read.refetch().finally(() => setPulled(false));
            }}
          />
        ) : undefined
      }
      footer={
        row ? (
          <>
            {notice ? (
              <View testID="detail-notice" style={styles.notice} accessibilityLiveRegion="polite">
                <Icon name="CircleAlert" size={DETAIL.noticeIcon} color={colors.danger} strokeWidth={2.2} />
                <Text variant="errorLine" accessibilityRole="alert">
                  {notice}
                </Text>
              </View>
            ) : null}
            <View style={styles.actions}>
              <Button label="Share receipt" icon="Share" variant="secondary" onPress={() => void share()} style={styles.action} testID="detail-share" />
              <Button
                label="Report a problem"
                variant="outline"
                onPress={() => {
                  setNotice(null);
                  void support.open(transactionReference(row.id));
                }}
                loading={support.opening}
                style={styles.action}
                testID="detail-report"
              />
            </View>
          </>
        ) : undefined
      }
    >
      <View style={styles.body}>{body}</View>
    </AuthFrame>
  );
}

function Lead({ lead }: { lead: RowLead }) {
  return lead.kind === 'avatar' ? (
    <Avatar name={lead.name} hue={lead.hue} source={lead.source} size={DETAIL.picture} decorative />
  ) : (
    <IconTile icon={lead.icon} tone={lead.tone} size={DETAIL.picture} />
  );
}

function Receipt({ row }: { row: Transaction }) {
  const receipt = receiptOf(row);
  return (
    <>
      <View testID="detail-head" style={styles.head}>
        <Lead lead={receipt.lead} />
        <Text variant="secondary" tone="textSecondary" style={styles.line} testID="detail-headline">
          {receipt.headline}
        </Text>
        <Money testID="detail-amount" minorUnits={receipt.amountKobo} size={DETAIL.figure} signed />
        <View style={styles.pill}>
          <StatusPill testID="detail-status" label={receipt.status.label} tone={receipt.status.tone} icon={receipt.status.icon} />
        </View>
      </View>
      <GroupedList testID="detail-card">
        {receipt.lines.map((line) => (
          <KeyValueRow
            key={line.key}
            testID={`detail-${line.key}`}
            label={line.label}
            value={line.copy ? <Reference value={line.value} /> : line.wrap ? <Text variant="kvValue" style={styles.wrapped}>{line.value}</Text> : line.value}
          />
        ))}
      </GroupedList>
      {receipt.cost ? (
        <GroupedList testID="detail-cost">
          {receipt.cost.map((part) => (
            <KeyValueRow
              key={part.key}
              testID={`detail-cost-${part.key}`}
              label={part.label}
              value={<Money minorUnits={part.kobo} size={DETAIL.partMoney} weight={part.strong ? 700 : 600} />}
            />
          ))}
        </GroupedList>
      ) : null}
    </>
  );
}

/** The reference, with a glyph that copies it. It reads "copied" by its check mark for a moment, and says so to a screen reader. */
function Reference({ value }: { value: string }) {
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
    const done = await copyText(value);
    AccessibilityInfo.announceForAccessibility(done ? 'Reference copied' : 'Couldn’t copy the reference');
    if (!done) return;
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), DETAIL.copyMs);
  };
  return (
    <>
      <Text variant="kvValue" numberOfLines={1} ellipsizeMode="middle" selectable style={styles.reference}>
        {value}
      </Text>
      <Pressable
        testID="detail-copy"
        accessibilityRole="button"
        accessibilityLabel={copied ? 'Copied' : 'Copy reference'}
        hitSlop={space.md}
        onPress={() => void copy()}
        {...ring.handlers}
        style={ring.style}
      >
        <Icon name={copied ? 'Check' : 'Copy'} size={DETAIL.copy} color={colors.textMuted} />
      </Pressable>
    </>
  );
}

/** W27's shape while the Hub answers: the picture, a line, the figure and the pill, then the card's rows. */
function DetailSkeleton() {
  return (
    <LoadingView label="Loading the transaction" testID="detail-loading">
      <View style={styles.skeleton}>
        <View style={styles.head}>
          <Skeleton width={DETAIL.picture} height={DETAIL.picture} radius={radius.chip} />
          <Skeleton width="45%" height={DETAIL.line} radius={rowMetrics.title / 2} />
          <Skeleton width="55%" height={DETAIL.figure} radius={radius.tile} />
        </View>
        <Skeleton height={rowMetrics.pairMinHeight * 4} radius={radius.card} />
      </View>
    </LoadingView>
  );
}

const styles = StyleSheet.create({
  body: { gap: DETAIL.parts },
  /** design/_gen/wallet.js line 119: Share receipt and Report a problem side by side, 10 apart, each taking half. */
  actions: { flexDirection: 'row', gap: DETAIL.actionsGap },
  action: { flex: 1 },
  head: { alignItems: 'center', gap: DETAIL.headGap, paddingTop: DETAIL.headTop },
  line: { marginTop: DETAIL.lineTop, fontSize: DETAIL.line, textAlign: 'center' },
  pill: { marginTop: DETAIL.pillTop },
  reference: { flexShrink: 1 },
  wrapped: { flexShrink: 1, textAlign: 'right' },
  notice: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  skeleton: { gap: DETAIL.parts },
});
