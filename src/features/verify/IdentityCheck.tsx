import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Icon } from '@/components/icon';
import { Text } from '@/components/Text';
import { footMetrics } from '@/features/create/CreateFrame';
import { font, layout, space, useWawu } from '@/theme';

import type { IdentityState } from './identityModel';
import { MakingRing } from './voiceParts';

const MARK = { circle: 88, icon: 40 } as const;
/** VF15a and VF15b's title is the board's result title; VF15's is `h1(.., { size: 22 })` (design/_gen/verify.js `vf15`). */
const HEAD = { title: 28, checking: 22, tracking: -0.035 } as const;

export type IdentityCheckProps = {
  state: IdentityState;
  /** VF15a's Continue: on to the publish form. */
  onContinue: () => void;
  /** VF15b's button: Open your wallet (when it is the way forward), else asks the Hub again. */
  onTryAgain: () => void;
  testID?: string;
};

/**
 * VF15 · Checking your identity, VF15a · Identity checked and VF15b · Uploads are paused: one centred state, the mark, the
 * heading, a line, and (paused) what to do. The words of VF15 and VF15a are the board's; the paused line and the steps are the
 * Hub's own (the wallet review's reasons and fixes). The three boards are full-bleed: no bar, no back button (SWEEP-R3), so this
 * draws its own safe areas and holds its one button at the foot, as VF10's frame does. VF15's ring is the 96 ring of VF10 (the
 * Hub serves no progress figure, so it turns, G-VERIFY-04-1).
 */
export function IdentityCheck({ state, onContinue, onTryAgain, testID = 'identity-check' }: IdentityCheckProps) {
  const { colors } = useWawu();
  const insets = useSafeAreaInsets();
  const passed = state.kind === 'passed';
  const paused = state.kind === 'paused';
  const sides = { paddingLeft: layout.gutter + insets.left, paddingRight: layout.gutter + insets.right };
  const title = passed ? 'Identity checked' : paused ? 'Uploads are paused' : 'Checking your identity';
  const titleSize = state.kind === 'checking' ? HEAD.checking : HEAD.title;
  return (
    <View testID={testID} style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: insets.top }]}>
      <View style={[styles.centre, sides]}>
        {state.kind === 'checking' ? (
          <MakingRing testID="identity-ring" label="Checking your identity" />
        ) : (
          <View testID={passed ? 'identity-passed-mark' : 'identity-paused-mark'} style={[styles.mark, { backgroundColor: passed ? colors.positiveTint : colors.dangerTint }]}>
            <Icon name={passed ? 'Check' : 'X'} size={MARK.icon} color={passed ? colors.positive : colors.danger} strokeWidth={2.4} />
          </View>
        )}
        <Text variant="display" accessibilityRole="header" testID="identity-title" style={[styles.title, { fontSize: titleSize, letterSpacing: HEAD.tracking * titleSize }]}>
          {title}
        </Text>
        <Text variant="body" tone="textSecondary" testID="identity-line" style={styles.line}>
          {passed ? 'You can upload and publish.' : paused ? state.reason : 'BVN and NIN, as when you opened your wallet. A few minutes.'}
        </Text>
        {paused && state.fixes.length > 0 ? (
          <Card padded testID="identity-fixes" style={styles.fixes}>
            <Text variant="secondary" tone="textMuted">
              What to do
            </Text>
            {state.fixes.map((fix) => (
              <View key={fix} style={styles.fix}>
                <Icon name="Check" size={16} color={colors.positive} strokeWidth={2.4} />
                <Text variant="body" style={[font(500), styles.fixWords]}>
                  {fix}
                </Text>
              </View>
            ))}
          </Card>
        ) : null}
      </View>
      {passed || paused ? (
        <View style={[{ paddingTop: footMetrics.top, paddingBottom: footMetrics.bottom + insets.bottom }, sides]}>
          {passed ? <Button testID="identity-continue" label="Continue" full onPress={onContinue} /> : <Button testID="identity-try-again" label="Try again" full onPress={onTryAgain} />}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md },
  mark: { width: MARK.circle, height: MARK.circle, borderRadius: MARK.circle / 2, alignItems: 'center', justifyContent: 'center' },
  title: { textAlign: 'center' },
  line: { textAlign: 'center' },
  fixes: { alignSelf: 'stretch', gap: space.sm, marginTop: space.sm },
  fix: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  fixWords: { flex: 1 },
});
