import { useMutation, useQuery } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { CurrencyFlag } from '@/components/CurrencyFlag';
import { FilterChips } from '@/components/FilterChips';
import { Icon } from '@/components/icon';
import { SegmentedTabs } from '@/components/SegmentedTabs';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { AuthFrame } from '@/features/auth/AuthFrame';
import { groupedAccountNumber } from '@/features/open-wallet/pin';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { fieldMetrics } from '@/components/TextField';
import { font, space, useWawu } from '@/theme';

import { newRequestKey, walletSettingsQuery } from '../api/settings';
import { sendStatement, statementDeliveryQuery, type StatementFormat } from './api';
import { DaySheet } from './DaySheet';
import { dayLabel, lagosToday, periodProblem, PRESETS, presetRange, type Day, type PresetId } from './period';
import { postStatementSent } from './notice';
import { ValueField } from './ValueField';

const NAV_TITLE = 'Statement';
/** design/_gen/wallet.js line 146 (W38): the parts of the page stand 18 apart; a label sits 10 above its chips or segments. */
const BODY_GAP = 18;
const LABEL_GAP = 10;
/** The Account field's flag, kit.js `Flag('NGN', 26)`. */
const FLAG = 26;
const FOOT_ERROR = { icon: 15, stroke: 2.2, iconGap: 6 } as const;
/** The loading view's stand-ins: Account, the dates, the format and Send to. */
const SKELETON_FIELDS = 4;
const NO_EMAIL = { icon: 20, gap: space.md } as const;

/** What the person sees for each format the server offers. A format the app has no name for shows as the server wrote it, in capitals. */
const FORMAT_NAMES: Record<string, string> = { csv: 'CSV', pdf: 'Stamped PDF' };
const formatName = (format: string): string => FORMAT_NAMES[format] ?? format.toUpperCase();

export type StatementScreenProps = {
  onBack: () => void;
  /** The statement is on its way: W35 shows the toast. */
  onSent: () => void;
  /** The account has no wallet: Open your wallet. */
  onOpenWallet: () => void;
  /** The phone's clock; a test sets it. */
  clock?: () => Date;
};

/**
 * W38 · Statement. Ask for a statement of the wallet over a period and have it emailed: `GET
 * /money/statements/delivery` says where it can go and in which formats, `POST /money/statements/email` sends it.
 *
 * What differs from the canvas, each for a recorded reason (task WALLET-35):
 * - Stamped PDF is not drawn: Fintava issues no statement (BACKEND_GAPS G-68), and the format row shows only what the
 *   server offers. With one format it is a plain field; with more, the segments.
 * - "Send to" is the account's own confirmed email, masked by the server, and cannot be typed: a statement lists every
 *   movement and counterparty name. An account with no confirmed email says so and sends nothing.
 * - The Account field has no chevron: there is one account (Naira), so there is nothing to choose.
 */
export function StatementScreen({ onBack, onSent, onOpenWallet, clock = () => new Date() }: StatementScreenProps) {
  const { colors } = useWawu();
  const owner = useSessionAccount(undefined);
  const wallet = useQuery(walletSettingsQuery(owner), queryClient);
  const delivery = useQuery(statementDeliveryQuery(owner), queryClient);
  const today = lagosToday(clock());

  const [preset, setPreset] = useState<PresetId>('three_months');
  const [custom, setCustom] = useState<{ from: Day; to: Day }>(() => presetRange('three_months', today));
  const [picking, setPicking] = useState<'from' | 'to' | null>(null);
  const [chosenFormat, setChosenFormat] = useState<StatementFormat | null>(null);
  /** The attempt's Idempotency-Key, kept while no answer came so a repeat is the same request. */
  const attempt = useRef<{ signature: string; key: string } | null>(null);

  const send = useMutation(
    {
      mutationFn: sendStatement,
      onSuccess: (sent) => {
        attempt.current = null;
        postStatementSent(sent.sentTo);
        onSent();
      },
      onError: (error) => {
        // An answer from the server, even a refusal, ends the attempt; no answer at all keeps its key.
        if (!isApiError(error) || error.kind !== 'network') attempt.current = null;
        if (isApiError(error) && error.code === 'email_not_verified') void delivery.refetch();
      },
    },
    queryClient,
  );

  if ((wallet.data === undefined && wallet.isError) || (delivery.data === undefined && delivery.isError)) {
    const failure = wallet.data === undefined && wallet.isError ? wallet.error : delivery.error;
    return (
      <AuthFrame navTitle={NAV_TITLE} onBack={onBack} testID="statement-problem">
        <ErrorState
          testID="statement-error"
          icon={isApiError(failure) && failure.kind === 'network' ? 'WifiOff' : 'TriangleAlert'}
          title="We couldn't load this page"
          message={isApiError(failure) ? failure.message : 'Something went wrong. Try again.'}
          onRetry={() => {
            void wallet.refetch();
            void delivery.refetch();
          }}
        />
      </AuthFrame>
    );
  }
  if (wallet.data === undefined || delivery.data === undefined) {
    return (
      <AuthFrame navTitle={NAV_TITLE} onBack={onBack} testID="statement-loading">
        <LoadingView label="Loading your statement options" testID="statement-loading-view">
          <View style={styles.body}>
            {Array.from({ length: SKELETON_FIELDS }, (_, i) => (
              <Skeleton key={i} height={fieldMetrics.height} radius={fieldMetrics.radius} />
            ))}
          </View>
        </LoadingView>
      </AuthFrame>
    );
  }

  const settings = wallet.data;
  if (settings.state === 'not_open' || settings.state === 'opening' || !settings.account) {
    const opening = settings.state === 'opening';
    return (
      <AuthFrame navTitle={NAV_TITLE} onBack={onBack} testID="statement-no-wallet">
        {opening ? (
          <EmptyState
            testID="statement-opening"
            icon="Clock"
            title="Your account is opening"
            message="Check again in a moment."
            action={{ label: 'Check again', onPress: () => void wallet.refetch() }}
          />
        ) : (
          <EmptyState
            testID="statement-none"
            icon="Wallet"
            title="You don't have a wallet yet"
            message="Open your wallet to continue."
            action={{ label: 'Open your wallet', onPress: onOpenWallet }}
          />
        )}
      </AuthFrame>
    );
  }

  const { formats, email, canEmail } = delivery.data;
  const format = chosenFormat !== null && formats.includes(chosenFormat) ? chosenFormat : (formats[0] ?? null);
  const range = preset === 'custom' ? custom : presetRange(preset, today);
  const problem = periodProblem(range.from, range.to, today);
  const canSend = canEmail && format !== null && problem === null && !send.isPending;

  const submit = () => {
    if (!canSend || format === null) return;
    const signature = `${range.from}|${range.to}|${format}`;
    if (attempt.current?.signature !== signature) attempt.current = { signature, key: newRequestKey() };
    send.mutate({ from: range.from, to: range.to, format, key: attempt.current.key });
  };

  const pickDay = (day: Day) => {
    if (picking === null) return;
    setCustom({ from: picking === 'from' ? day : range.from, to: picking === 'to' ? day : range.to });
    setPreset('custom');
    setPicking(null);
  };

  const footError = send.isError ? (isApiError(send.error) ? send.error.message : 'Something went wrong. Try again.') : null;

  return (
    <AuthFrame
      testID="statement-form"
      navTitle={NAV_TITLE}
      onBack={onBack}
      footer={
        <>
          {footError ? (
            <View style={styles.footError} accessibilityRole="alert" accessibilityLiveRegion="polite" testID="statement-send-error">
              <Icon name="CircleAlert" size={FOOT_ERROR.icon} color={colors.danger} strokeWidth={FOOT_ERROR.stroke} />
              <Text variant="errorLine" tone="danger" style={styles.footErrorText}>
                {footError}
              </Text>
            </View>
          ) : null}
          <Button label="Send statement" full loading={send.isPending} disabled={!canSend} onPress={submit} testID="statement-send" />
        </>
      }
    >
      <View style={styles.body}>
        <ValueField
          testID="statement-account"
          label="Account"
          value={`Naira wallet · ${groupedAccountNumber(settings.account.accountNumber)}`}
          lead={<CurrencyFlag currency="NGN" size={FLAG} />}
        />
        <View style={styles.group}>
          <Text variant="label" tone="textMuted">
            Period
          </Text>
          <FilterChips
            testID="statement-period"
            label="Period"
            variant="option"
            items={PRESETS}
            value={preset}
            onChange={(next) => {
              if (next === 'custom') setCustom(range);
              setPreset(next);
            }}
          />
        </View>
        <View style={styles.dates}>
          <View style={styles.date}>
            <ValueField
              testID="statement-from"
              label="From"
              value={dayLabel(range.from)}
              trailIcon="Calendar"
              hint="Opens a calendar"
              disabled={send.isPending}
              onPress={() => setPicking('from')}
            />
          </View>
          <View style={styles.date}>
            <ValueField
              testID="statement-to"
              label="To"
              value={dayLabel(range.to)}
              trailIcon="Calendar"
              hint="Opens a calendar"
              disabled={send.isPending}
              onPress={() => setPicking('to')}
            />
          </View>
        </View>
        {problem ? (
          <View style={styles.footError} accessibilityRole="alert" accessibilityLiveRegion="polite" testID="statement-period-problem">
            <Icon name="CircleAlert" size={FOOT_ERROR.icon} color={colors.danger} strokeWidth={FOOT_ERROR.stroke} />
            <Text variant="errorLine" tone="danger" style={styles.footErrorText}>
              {problem}
            </Text>
          </View>
        ) : null}
        {formats.length > 1 && format !== null ? (
          <View style={styles.group}>
            <Text variant="label" tone="textMuted">
              Format
            </Text>
            <SegmentedTabs
              testID="statement-format"
              label="Format"
              items={formats.map((f) => ({ value: f, label: formatName(f) }))}
              value={format}
              onChange={setChosenFormat}
            />
          </View>
        ) : format !== null ? (
          <ValueField testID="statement-format" label="Format" value={formatName(format)} section />
        ) : null}
        {canEmail && email !== null ? (
          <ValueField testID="statement-send-to" label="Send to" value={email} />
        ) : (
          <Card padded testID="statement-no-email">
            <View style={styles.noEmail}>
              <Icon name="Mail" size={NO_EMAIL.icon} color={colors.textSecondary} />
              <Text variant="bannerBody" tone="textSecondary" style={[styles.noEmailText, font(500)]}>
                Confirm your email address to get a statement by email.
              </Text>
            </View>
          </Card>
        )}
      </View>
      <DaySheet
        visible={picking !== null}
        onClose={() => setPicking(null)}
        title={picking === 'to' ? 'Last day' : 'First day'}
        value={picking === 'to' ? range.to : range.from}
        max={today}
        onPick={pickDay}
      />
    </AuthFrame>
  );
}

const styles = StyleSheet.create({
  body: { gap: BODY_GAP },
  group: { gap: LABEL_GAP },
  dates: { flexDirection: 'row', gap: LABEL_GAP },
  date: { flex: 1, minWidth: 0 },
  footError: { flexDirection: 'row', alignItems: 'center', gap: FOOT_ERROR.iconGap },
  footErrorText: { flexShrink: 1 },
  noEmail: { flexDirection: 'row', alignItems: 'center', gap: NO_EMAIL.gap },
  noEmailText: { flex: 1 },
});
