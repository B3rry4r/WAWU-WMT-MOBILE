import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { Button } from '@/components/Button';
import { GroupedList } from '@/components/Card';
import { Money, formatMoney } from '@/components/Money';
import { SegmentedTabs } from '@/components/SegmentedTabs';
import { SkeletonRows } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { Toast, type ToastTone } from '@/components/Toast';
import { CreatorGate } from '@/features/pro-listing/ApplyScreen';
import { ProFrame } from '@/features/pro-listing/ProFrame';
import { space } from '@/theme';

import { PAUSED_CODE, fetchSettings, saveSettings, settingsKey, type PaidMessageSettings } from './api';
import {
  canSave,
  digitsFromKobo,
  digitsOf,
  earnKobo,
  formOf,
  lockedBody,
  lockedTitle,
  modeOf,
  percentText,
  priceKoboOf,
  priceProblem,
  saveBody,
  switchLine,
  warningBody,
  warningTitle,
  windowLabel,
  type Form,
} from './model';
import { Note, PriceField, Presets, Raise, SwitchCard } from './parts';

export const PAID_MESSAGES_TITLE = 'Paid messages';
/** How long "Saved" (or why a save was refused) stays over the screen. */
export const NOTICE_MS = 2400;

/** design/_gen/inbox.js line 62: the parts of the screen are 18 apart, and a label sits 10 above what it names. */
const screenMetrics = { parts: 18, labelGap: 10, rowMin: 50, rowBetween: 14, rowPadV: 12 } as const;

export type PaidMessagesScreenProps = { onBack: () => void };

type Notice = { message: string; tone: ToastTone };

/**
 * I21, I22 and I23: the creator's paid message settings. One screen with three moments, picked by the Hub's standing:
 * settings (I21), warned over the warn line (I22, with the missed and total counts and a price to raise to), and
 * switched off for 7 days (I23, everything locked until the date). Every figure is the Hub's or the person's own;
 * the price presets, the reply times and the lines come from `GET /paid-dm/settings`.
 */
export function PaidMessagesScreen({ onBack }: PaidMessagesScreenProps) {
  const client = useQueryClient();
  const settings = useQuery({ queryKey: settingsKey, queryFn: fetchSettings });
  const [draft, setDraft] = useState<Form | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  const save = useMutation({
    mutationFn: saveSettings,
    onSuccess: (saved) => {
      client.setQueryData(settingsKey, saved);
      setDraft(null);
      setNotice({ message: 'Saved', tone: 'success' });
    },
    onError: (error) => {
      // Paid messages went off while the screen was open: read the standing again, and the screen locks.
      if (isApiError(error) && error.code === PAUSED_CODE) void client.invalidateQueries({ queryKey: settingsKey });
      setNotice({ message: isApiError(error) ? error.message : 'Your settings could not be saved. Try again.', tone: 'alert' });
    },
  });

  if (isApiError(settings.error) && settings.error.kind === 'forbidden') return <CreatorGate title={PAID_MESSAGES_TITLE} onBack={onBack} />;
  if (settings.isError && !settings.data) {
    return (
      <ProFrame title={PAID_MESSAGES_TITLE} onBack={onBack} gap={space.lg} centered testID="paid-error">
        <ErrorState
          title="This could not be loaded"
          message={isApiError(settings.error) ? settings.error.message : 'Something went wrong. Try again.'}
          icon={isApiError(settings.error) && settings.error.kind === 'network' ? 'WifiOff' : 'TriangleAlert'}
          onRetry={() => void settings.refetch()}
        />
      </ProFrame>
    );
  }
  if (!settings.data) {
    return (
      <ProFrame title={PAID_MESSAGES_TITLE} onBack={onBack} gap={space.lg} testID="paid-loading">
        <SkeletonRows count={3} />
      </ProFrame>
    );
  }

  const data = settings.data;
  const form = draft ?? formOf(data);
  const mode = modeOf(data.standing);
  const locked = mode === 'locked';
  const priceKobo = priceKoboOf(form);
  const problem = priceProblem(form, data);
  const change = (next: Partial<Form>) => setDraft({ ...form, ...next });

  return (
    <ProFrame
      title={PAID_MESSAGES_TITLE}
      onBack={onBack}
      gap={screenMetrics.parts}
      testID="paid-messages"
      foot={
        <>
          <Button
            label="Save"
            testID="paid-save"
            disabled={!canSave(form, data)}
            loading={save.isPending}
            onPress={() => {
              setNotice(null);
              save.mutate(saveBody(form));
            }}
          />
          <Toast message={notice?.message ?? null} tone={notice?.tone} placement="bottom" offset={96} duration={NOTICE_MS} onHide={() => setNotice(null)} />
        </>
      }
    >
      <SwitchCard
        testID="paid-switch"
        title="Take paid messages"
        line={switchLine(form, mode, data.standing)}
        on={form.enabled}
        locked={locked}
        onToggle={() => change({ enabled: !form.enabled })}
      />
      <Banner data={data} mode={mode} onRaise={(kobo) => change({ digits: digitsFromKobo(kobo) })} />
      <View style={styles.section}>
        <Text variant="label" tone="textMuted">
          Price per message
        </Text>
        <PriceField testID="paid-price" digits={form.digits} onChangeDigits={(typed) => change({ digits: digitsOf(typed) })} locked={locked} invalid={problem !== null} />
        {problem ? (
          <Text variant="caption" tone="danger" accessibilityRole="alert" testID="paid-price-problem">
            {problem}
          </Text>
        ) : null}
        <Presets presetsKobo={data.options.pricePresets.map((preset) => preset.priceKobo)} priceKobo={priceKobo} locked={locked} onPick={(kobo) => change({ digits: digitsFromKobo(kobo) })} />
      </View>
      <View style={styles.section}>
        <Text variant="label" tone="textMuted">
          You have this long to reply
        </Text>
        <SegmentedTabs
          label="Time to reply"
          testID="paid-window"
          items={data.options.responseWindowHours.map((hours) => ({ value: String(hours), label: windowLabel(hours) }))}
          value={form.hours === null ? '' : String(form.hours)}
          onChange={(value) => {
            if (!locked) change({ hours: Number(value) });
          }}
        />
      </View>
      <GroupedList testID="paid-figures">
        <Figure label="You earn per message">
          {priceKobo === null || problem !== null ? (
            <Text variant="kvValue">-</Text>
          ) : (
            <Money minorUnits={earnKobo(priceKobo, data.creatorSharePct)} size={14.5} weight={600} decimals={false} testID="paid-earn" />
          )}
        </Figure>
        <Figure label="Your share">
          <Text variant="kvValue" testID="paid-share">{`${data.creatorSharePct}%`}</Text>
        </Figure>
        <Figure label={`Unanswered, last ${data.standing.windowDays} days`}>
          <Text variant="kvValue" tone={mode === 'locked' ? 'danger' : mode === 'warned' ? 'warning' : 'textPrimary'} testID="paid-unanswered">
            {percentText(data.standing.unansweredPct)}
          </Text>
        </Figure>
      </GroupedList>
    </ProFrame>
  );
}

/** I22's warning with Raise, or I23's lock. Nothing in the standing that is fine. */
function Banner({ data, mode, onRaise }: { data: PaidMessageSettings; mode: ReturnType<typeof modeOf>; onRaise: (kobo: number) => void }) {
  if (mode === 'locked') {
    return <Note testID="paid-locked" tone="danger" icon="MessageCircleOff" title={lockedTitle(data.standing)} body={lockedBody(data.standing)} />;
  }
  if (mode !== 'warned') return null;
  const title = warningTitle(data.standing);
  const raise = data.raiseToKobo;
  return (
    <Note
      testID="paid-warning"
      tone="warning"
      icon="TriangleAlert"
      title={title ?? 'Too many paid messages are going unanswered'}
      body={warningBody(data.standing, raise !== null)}
    >
      {raise === null ? null : <Raise label={`Raise to ${formatMoney(raise, { decimals: false })}`} onPress={() => onRaise(raise)} />}
    </Note>
  );
}

/** kit.js line 44, `kv`: a row 50 tall at least, 12 above and below, the key and the value 14 apart. */
function Figure({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.figure}>
      <Text variant="kvLabel" tone="textSecondary">
        {label}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: screenMetrics.labelGap },
  figure: { minHeight: screenMetrics.rowMin, paddingVertical: screenMetrics.rowPadV, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: screenMetrics.rowBetween },
});
