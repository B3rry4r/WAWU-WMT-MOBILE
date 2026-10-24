import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Icon } from '@/components/icon';
import { Text } from '@/components/Text';
import { font, space, useWawu } from '@/theme';

import type { IdentityState } from './identityModel';

const MARK = { circle: 88, icon: 40 } as const;
const HEAD = { title: 28, tracking: -0.035 } as const;

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
 * Hub's own (the wallet review's reasons and fixes).
 */
export function IdentityCheck({ state, onContinue, onTryAgain, testID = 'identity-check' }: IdentityCheckProps) {
  const { colors } = useWawu();
  const passed = state.kind === 'passed';
  const paused = state.kind === 'paused';
  return (
    <View testID={testID} style={styles.root}>
      <View style={styles.centre}>
        {state.kind === 'checking' ? (
          <View testID="identity-ring" style={styles.mark}>
            <ActivityIndicator size="large" color={colors.accent} accessibilityLabel="Checking" />
          </View>
        ) : (
          <View testID={passed ? 'identity-passed-mark' : 'identity-paused-mark'} style={[styles.mark, { backgroundColor: passed ? colors.positiveTint : colors.dangerTint }]}>
            <Icon name={passed ? 'Check' : 'X'} size={MARK.icon} color={passed ? colors.positive : colors.danger} strokeWidth={2.4} />
          </View>
        )}
        <Text variant="display" accessibilityRole="header" testID="identity-title" style={[styles.title, { fontSize: HEAD.title, letterSpacing: HEAD.tracking * HEAD.title }]}>
          {passed ? 'Identity checked' : paused ? 'Uploads are paused' : 'Checking your identity'}
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
      {passed ? <Button testID="identity-continue" label="Continue" full onPress={onContinue} /> : null}
      {paused ? <Button testID="identity-try-again" label="Try again" full onPress={onTryAgain} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'space-between', gap: space.xl },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md },
  mark: { width: MARK.circle, height: MARK.circle, borderRadius: MARK.circle / 2, alignItems: 'center', justifyContent: 'center' },
  title: { textAlign: 'center' },
  line: { textAlign: 'center' },
  fixes: { alignSelf: 'stretch', gap: space.sm, marginTop: space.sm },
  fix: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  fixWords: { flex: 1 },
});
