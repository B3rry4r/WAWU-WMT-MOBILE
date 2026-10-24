import { Pressable, StyleSheet, View } from 'react-native';

import { useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { Text } from '@/components/Text';
import { canvasNormalLineHeight, font, space, useWawu } from '@/theme';

/** design/_gen/auth.js line 57, the consent box: 22 square, 7 radius, a Check 14 at 3; 10 to its line of 13.5 text-secondary. */
const CONSENT = { box: 22, corner: 7, tick: 14, tickStroke: 3, ring: 1.5, between: 10, size: 13.5 } as const;

export type ConsentBoxProps = {
  agreed: boolean;
  busy: boolean;
  /** Why the box must be ticked, shown under it (and read as the box's hint). */
  problem?: string;
  onToggle: () => void;
  /** Opens the terms: the word "terms" is a link where this is given, and only styled as one where it is not. */
  onOpenTerms?: () => void;
  /** Opens the privacy policy, the same. */
  onOpenPrivacy?: () => void;
  testID?: string;
};

/** "I agree to the terms and privacy policy" (R-67): A5's box, shared by both of the details step's forms, and A3's. */
export function ConsentBox({ agreed, busy, problem, onToggle, onOpenTerms, onOpenPrivacy, testID = 'open-wallet-consent' }: ConsentBoxProps) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <View style={styles.block}>
      <Pressable
        testID={testID}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: agreed, disabled: busy }}
        aria-checked={agreed}
        accessibilityLabel="I agree to the terms and privacy policy"
        accessibilityHint={problem}
        disabled={busy}
        onPress={onToggle}
        {...ring.handlers}
        style={[styles.consent, ring.style]}
      >
        <View
          style={[
            styles.box,
            agreed ? { backgroundColor: colors.accent } : { borderWidth: CONSENT.ring, borderColor: problem ? colors.danger : colors.borderStrong },
          ]}
        >
          {agreed ? <Icon name="Check" size={CONSENT.tick} color={colors.textOnAccent} strokeWidth={CONSENT.tickStroke} /> : null}
        </View>
        <Text variant="secondary" style={styles.text}>
          {'I agree to the '}
          <Text variant="secondary" tone="accentFg" style={font(700)} accessibilityRole={onOpenTerms ? 'link' : undefined} onPress={onOpenTerms} testID={`${testID}-terms`}>
            terms
          </Text>
          {' and '}
          <Text variant="secondary" tone="accentFg" style={font(700)} accessibilityRole={onOpenPrivacy ? 'link' : undefined} onPress={onOpenPrivacy} testID={`${testID}-privacy`}>
            privacy policy
          </Text>
        </Text>
      </Pressable>
      {problem ? (
        <Text variant="caption" tone="danger" accessibilityRole="alert" testID={`${testID}-error`}>
          {problem}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: space.sm },
  consent: { flexDirection: 'row', alignItems: 'center', gap: CONSENT.between, alignSelf: 'flex-start' },
  box: { width: CONSENT.box, height: CONSENT.box, borderRadius: CONSENT.corner, alignItems: 'center', justifyContent: 'center' },
  text: { flexShrink: 1, fontSize: CONSENT.size, lineHeight: canvasNormalLineHeight(CONSENT.size) },
});
