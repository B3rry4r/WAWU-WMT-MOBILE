import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isApiError } from '@/api/client';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { layout, radius, space, useWawu } from '@/theme';

/** VF1's own top gap (BonusScreen `hero.top`). */
const top = 56;

export type BonusGateViewProps = {
  /** `loading` while the account type is being read or is not known yet; `waiting` when it still is not after the last ask; `error` when the read failed. */
  state: 'loading' | 'waiting' | 'error';
  error?: unknown;
  onRetry: () => void;
};

/** VF1's own loading and error states while it finds out whether the person has a shop to build: the screen's shapes, then a retry. */
export function BonusGateView({ state, error, onRetry }: BonusGateViewProps) {
  const { colors } = useWawu();
  const insets = useSafeAreaInsets();
  return (
    <View testID="bonus-gate" style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingLeft: layout.gutter + insets.left, paddingRight: layout.gutter + insets.right }]}>
        {state === 'loading' ? (
          <LoadingView label="Getting your bonus ready" testID="bonus-gate-loading">
            <View style={styles.hero}>
              <Skeleton width={72} height={72} radius={36} />
              <Skeleton width={240} height={28} radius={radius.chip} />
              <Skeleton width={280} height={36} radius={radius.chip} />
            </View>
            <View style={styles.rows}>
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} height={72} radius={radius.card} />
              ))}
            </View>
          </LoadingView>
        ) : state === 'waiting' ? (
          <ErrorState testID="bonus-gate-waiting" icon="Clock" title="Your account is almost ready" message="It is taking longer than usual. Try again in a moment." onRetry={onRetry} />
        ) : (
          <ErrorState
            testID="bonus-gate-error"
            title="Your account did not load"
            message={isApiError(error) && error.message ? error.message : 'Check your connection and try again.'}
            onRetry={onRetry}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flexGrow: 1, paddingTop: top, paddingBottom: space.xl, justifyContent: 'flex-start' },
  hero: { alignItems: 'center', gap: space.md, marginBottom: space.xl },
  rows: { gap: space.sm },
});
