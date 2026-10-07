import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { SkeletonRows } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { StatusPill } from '@/components/StatusPill';
import { Text } from '@/components/Text';
import { font, radius, space, useWawu } from '@/theme';

import { fetchFields, fetchIsCreator, fetchMine, proKeys, setListed, type Application, type ProField } from './api';
import { CreatorGate } from './ApplyScreen';
import { HIDDEN, SHOWING, fieldOfCategory, labelOfApplication, latestPerField, rowState, sentenceOf } from './model';
import { Note } from './parts';
import { ProFrame } from './ProFrame';

export const LISTINGS_TITLE = 'Your listings';

/** design/_gen/pros.js line 36, `lrow`: a 14 by 16 card, 10 between its parts; the name at 15 semi-bold, the headline at 13 two below it. */
const rowMetrics = { padV: 14, between: 10, name: 15, headline: 13, headlineGap: 2, ruleTop: 10, applyAgain: 'sm' } as const;

export type ListingsScreenProps = {
  onBack: () => void;
  /** Apply again (with the field) and Apply in another field (without). */
  onApply: (fieldId?: string) => void;
};

/** P8, and P9 for a field that is hidden. P10 stops an account that is not a creator's. */
export function ListingsScreen({ onBack, onApply }: ListingsScreenProps) {
  const creator = useQuery({ queryKey: proKeys.account, queryFn: fetchIsCreator });
  const isCreator = creator.data === true;
  const fields = useQuery({ queryKey: proKeys.fields, queryFn: fetchFields, enabled: isCreator });
  const mine = useQuery({ queryKey: proKeys.mine, queryFn: fetchMine, enabled: isCreator });

  if (creator.data === false) return <CreatorGate title={LISTINGS_TITLE} onBack={onBack} />;
  const failed = creator.isError ? creator : fields.isError ? fields : mine.isError ? mine : null;
  if (failed) {
    return (
      <ProFrame title={LISTINGS_TITLE} onBack={onBack} gap={space.lg} centered testID="pro-listings-error">
        <ErrorState
          title="This could not be loaded"
          message={sentenceOf(failed.error, 'Something went wrong. Try again.')}
          onRetry={() => void Promise.all([creator.isError && creator.refetch(), fields.isError && fields.refetch(), mine.isError && mine.refetch()])}
        />
      </ProFrame>
    );
  }
  if (!fields.data || !mine.data) {
    return (
      <ProFrame title={LISTINGS_TITLE} onBack={onBack} gap={space.lg} testID="pro-listings-loading">
        <SkeletonRows count={3} />
      </ProFrame>
    );
  }
  const rows = latestPerField(mine.data);
  if (rows.length === 0) {
    return (
      <ProFrame title={LISTINGS_TITLE} onBack={onBack} gap={space.lg} centered testID="pro-listings-empty">
        <EmptyState
          icon="BriefcaseBusiness"
          title="You have not offered your services yet"
          message="Apply in a field and people can find you and pay to send the first message."
          action={{ label: 'Offer your services', onPress: () => onApply() }}
        />
      </ProFrame>
    );
  }
  return (
    <ProFrame title={LISTINGS_TITLE} onBack={onBack} gap={space.md} testID="pro-listings">
      {rows.map((row) => (
        <ListingCard key={row.id} row={row} fields={fields.data} onApplyAgain={(field) => onApply(field?.id)} />
      ))}
      <ApplyAnother onPress={() => onApply()} />
      <Note
        tone="info"
        icon="MessageCircle"
        title="People reach you through paid messages"
        body="Set your price and reply time in Inbox settings."
        testID="pro-paid-note"
      />
    </ProFrame>
  );
}

/** pros.js line 37: a 1.5 outline in the strong border, 18 round, 14 all round, 7 between a 16 plus and the 13.5 label in the accent. */
const anotherMetrics = { ring: 1.5, pad: 14, iconToLabel: 7, icon: 16, font: 13.5 } as const;

function ApplyAnother({ onPress }: { onPress: () => void }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID="pro-apply-another"
      accessibilityRole="button"
      accessibilityLabel="Apply in another field"
      onPress={onPress}
      {...ring.handlers}
      style={[styles.another, { borderColor: colors.borderStrong }, ring.style]}
    >
      <Icon name="Plus" size={anotherMetrics.icon} color={colors.accentFg} strokeWidth={2.2} />
      <Text variant="body" tone="accentFg" style={[font(600), { fontSize: anotherMetrics.font }]}>
        Apply in another field
      </Text>
    </Pressable>
  );
}

function ListingCard({ row, fields, onApplyAgain }: { row: Application; fields: ProField[]; onApplyAgain: (field?: ProField) => void }) {
  const { colors } = useWawu();
  const client = useQueryClient();
  const state = rowState(row);
  const [problem, setProblem] = useState<string | null>(null);
  const inFlight = useRef(false);
  const [busy, setBusy] = useState(false);
  const flip = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setProblem(null);
    try {
      const saved = await setListed(row.id, state !== 'listed');
      client.setQueryData<Application[]>(proKeys.mine, (old) => old?.map((a) => (a.id === saved.id ? { ...a, listed: saved.listed } : a)));
    } catch (error) {
      setProblem(sentenceOf(error, state === 'listed' ? 'Your listing could not be hidden. Try again.' : 'Your listing could not be shown. Try again.'));
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };
  const pill =
    state === 'review' ? (
      <StatusPill label="Under review" tone="warning" />
    ) : state === 'turned-down' ? (
      <StatusPill label="Turned down" tone="danger" />
    ) : (
      <StatusPill label="Listed" tone="positive" />
    );
  return (
    <Card testID={`pro-row-${row.id}`} padded style={styles.card}>
      <View style={styles.head}>
        <View style={styles.words}>
          <Text variant="body" style={[font(600), { fontSize: rowMetrics.name }]}>
            {labelOfApplication(fields, row)}
          </Text>
          <Text variant="secondary" style={styles.headline}>
            {row.headline}
          </Text>
        </View>
        {pill}
      </View>
      {state === 'listed' || state === 'hidden' ? (
        <View style={[styles.rule, { borderTopColor: colors.borderHairline }]}>
          <Text variant="secondary" style={styles.ruleText}>
            {state === 'listed' ? SHOWING : HIDDEN}
          </Text>
          <Button label={state === 'listed' ? 'Hide' : 'Show'} variant="secondary" size="sm" loading={busy} onPress={() => void flip()} testID={`pro-toggle-${row.id}`} />
        </View>
      ) : null}
      {problem ? (
        <Text variant="caption" tone="danger" accessibilityRole="alert" testID={`pro-toggle-problem-${row.id}`}>
          {problem}
        </Text>
      ) : null}
      {state === 'turned-down' ? (
        <>
          {row.rejectionReason ? <Note tone="warning" icon="Info" title="Why it was turned down" body={row.rejectionReason} testID={`pro-reason-${row.id}`} /> : null}
          <Button label="Apply again" variant="secondary" size="sm" full onPress={() => onApplyAgain(fieldOfCategory(fields, row.category))} testID={`pro-again-${row.id}`} />
        </>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  another: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: anotherMetrics.iconToLabel, padding: anotherMetrics.pad, borderRadius: radius.tile, borderWidth: anotherMetrics.ring },
  card: { gap: rowMetrics.between, borderRadius: radius.card },
  head: { flexDirection: 'row', alignItems: 'center', gap: rowMetrics.between },
  words: { flex: 1, minWidth: 0 },
  headline: { marginTop: rowMetrics.headlineGap, fontSize: rowMetrics.headline },
  rule: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingTop: rowMetrics.ruleTop, borderTopWidth: StyleSheet.hairlineWidth },
  ruleText: { flex: 1, fontSize: rowMetrics.headline },
});

