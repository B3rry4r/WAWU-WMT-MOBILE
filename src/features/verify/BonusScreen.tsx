import { useQuery } from '@tanstack/react-query';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isApiError } from '@/api/client';
import { Button } from '@/components/Button';
import { IconTile } from '@/components/IconTile';
import { Skeleton, LoadingView } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { footMetrics } from '@/features/create/CreateFrame';
import { canvasNormalLineHeight, font, layout, radius, space, useWawu } from '@/theme';

import { fetchPlans, plansKey } from './api';
import { bonusRowsOf } from './model';
import { BonusRowCard } from './parts';

/** VF1: a 72 round gift tile, the title at 28 bold, a 17 line under it, the rows 8 apart, "Build my shop" pinned at the foot. */
const hero = { tile: 72, title: 28, sub: 17, subWidth: 300, top: 56, rows: space.sm, rowsTop: space.xl } as const;

export type BonusScreenProps = {
  /** "Build my shop": opens VF2. */
  onBuild: () => void;
};

/**
 * VF1 · Your bonus is waiting. Right after sign-up: what the preselected tier unlocks (its points, a first Voice Intro, its event pass),
 * shown locked, every figure and name read from `GET /plans`. One button. A read that fails is a note with a retry above the button, and
 * the button still works: building a shop is free and needs nothing from the plans.
 */
export function BonusScreen({ onBuild }: BonusScreenProps) {
  const { colors } = useWawu();
  const insets = useSafeAreaInsets();
  const plans = useQuery({ queryKey: plansKey, queryFn: fetchPlans });
  const rows = plans.data ? bonusRowsOf(plans.data) : null;

  return (
    <View testID="bonus-screen" style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingLeft: layout.gutter + insets.left, paddingRight: layout.gutter + insets.right }]}
      >
        <View style={styles.hero}>
          <View style={styles.tile}>
            <IconTile icon="Gift" tone="accent" size={hero.tile} strokeWidth={1.8} />
          </View>
          <Text variant="h1" style={styles.title}>
            Your bonus is waiting
          </Text>
          <Text variant="body" tone="textSecondary" style={styles.sub}>
            Build your shop for free. When you make it official, these unlock.
          </Text>
        </View>
        {plans.isError && !plans.data ? (
          <ErrorState
            testID="bonus-error"
            title="Your bonus did not load"
            message={isApiError(plans.error) ? plans.error.message : 'Check your connection and try again.'}
            onRetry={() => void plans.refetch()}
          />
        ) : !plans.data ? (
          <LoadingView label="Loading your bonus" testID="bonus-loading">
            <View style={styles.rows}>
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} height={72} radius={radius.card} />
              ))}
            </View>
          </LoadingView>
        ) : rows && rows.length > 0 ? (
          <View testID="bonus-rows" style={styles.rows}>
            {rows.map((row) => (
              <BonusRowCard key={row.id} {...row} />
            ))}
          </View>
        ) : null}
      </ScrollView>
      <View style={[styles.foot, { backgroundColor: colors.surfacePage, paddingBottom: footMetrics.bottom + insets.bottom, paddingLeft: layout.gutter + insets.left, paddingRight: layout.gutter + insets.right }]}>
        <Button testID="bonus-build" label="Build my shop" full onPress={onBuild} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: { flexGrow: 1, paddingTop: hero.top, paddingBottom: space.xl, gap: hero.rowsTop },
  hero: { alignItems: 'center', gap: space.md },
  tile: { marginBottom: space.sm },
  title: { ...font(700), fontSize: hero.title, lineHeight: canvasNormalLineHeight(hero.title), textAlign: 'center' },
  sub: { fontSize: hero.sub, lineHeight: hero.sub * 1.4, textAlign: 'center', maxWidth: hero.subWidth },
  rows: { gap: hero.rows },
  foot: { paddingTop: footMetrics.top },
});
