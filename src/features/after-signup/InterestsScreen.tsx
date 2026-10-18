import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { SkeletonRows } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { AuthFrame } from '@/features/auth/AuthFrame';
import { font, radius, space, useWawu } from '@/theme';

import { fetchInterests, interestsKey } from './api';

export const INTERESTS_TITLE = 'What are you into?';

const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'] as const;

/** A12's sub-line, in the board's words ("Pick three or more."): the Hub's minimum is spelled out up to ten and shown as digits above that. */
export const interestsHint = (minimum: number): string => `Pick ${NUMBER_WORDS[minimum] ?? minimum} or more. It tunes your feed.`;

/** design/_gen/auth.js line 19, `chip`: 40 high, 16 across, 6 between the check and the label; the chips 8 apart. */
const CHIP = { height: 40, padH: 16, inner: 6, between: 8, check: 14 } as const;

export type InterestsScreenProps = {
  /** "n of m" for the bar's corner, from the steps WAWU ID lists; left out when there is only this one. */
  step?: string;
  /** The round back button: given only when there is a screen to go back to (A13, when A12 was reopened from it). */
  onBack?: () => void;
  /** Saves the picks (ids, chip order) and moves on. Throws when it could not. */
  onContinue: (picks: string[]) => Promise<void>;
};

function Chip({ label, on, onPress, testID }: { label: string; on: boolean; onPress: () => void; testID: string }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      accessibilityLabel={label}
      onPress={onPress}
      {...ring.handlers}
      style={[
        styles.chip,
        on ? { backgroundColor: colors.accent } : { boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 1, color: colors.borderStrong, inset: true }] },
        ring.style,
      ]}
    >
      {on ? <Icon name="Check" size={CHIP.check} color={colors.textOnAccent} strokeWidth={2.6} /> : null}
      <Text variant="body" style={[font(600), styles.label, { color: on ? colors.textOnAccent : colors.textPrimary }]}>
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * A12 · What are you into? The twelve chips and the minimum come from the Hub (`GET /users/me/interests`), as does what was saved before, so
 * a person who comes back sees their picks. Continue is "Continue · n picked" and stays off until the minimum is picked.
 */
export function InterestsScreen({ step, onBack, onContinue }: InterestsScreenProps) {
  const view = useQuery({ queryKey: interestsKey, queryFn: fetchInterests, staleTime: 0 });
  const [picked, setPicked] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const data = view.data;
  const held = picked ?? data?.selected ?? [];
  const minimum = data?.minimum ?? 0;
  const ready = Boolean(data) && held.length >= minimum;

  const toggle = (id: string) => {
    setFailed(false);
    setPicked(held.includes(id) ? held.filter((p) => p !== id) : [...held, id]);
  };
  const next = async () => {
    if (!data || !ready || busy) return;
    setBusy(true);
    setFailed(false);
    try {
      await onContinue(data.options.filter((o) => held.includes(o.id)).map((o) => o.id));
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthFrame
      testID="interests"
      navTitle={INTERESTS_TITLE}
      navStep={step}
      onBack={onBack}
      footer={
        data ? (
          <>
            {failed ? (
              <Text variant="secondary" tone="danger" testID="interests-failed" accessibilityRole="alert">
                Couldn’t save your picks. Try again.
              </Text>
            ) : null}
            <Button
              label={held.length > 0 ? `Continue · ${held.length} picked` : 'Continue'}
              onPress={() => void next()}
              disabled={!ready}
              loading={busy}
              full
              testID="interests-continue"
            />
          </>
        ) : undefined
      }
    >
      {view.isPending ? (
        <SkeletonRows count={6} testID="interests-loading" />
      ) : view.isError || !data ? (
        <ErrorState title="Couldn’t load your options" message="Check your connection and try again." onRetry={() => void view.refetch()} testID="interests-error" />
      ) : (
        <View style={styles.body}>
          <Text variant="body" tone="textSecondary" testID="interests-hint">
            {interestsHint(data.minimum)}
          </Text>
          <View style={styles.chips}>
            {data.options.map((o) => (
              <Chip key={o.id} testID={`interest-${o.id}`} label={o.label} on={held.includes(o.id)} onPress={() => toggle(o.id)} />
            ))}
          </View>
        </View>
      )}
    </AuthFrame>
  );
}

const styles = StyleSheet.create({
  body: { gap: space.lg, paddingTop: space.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: CHIP.between },
  chip: { height: CHIP.height, paddingHorizontal: CHIP.padH, borderRadius: radius.chip, flexDirection: 'row', alignItems: 'center', gap: CHIP.inner },
  label: { fontSize: 14 },
});
