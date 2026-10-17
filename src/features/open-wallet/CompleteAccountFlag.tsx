import { Pressable, StyleSheet, View } from 'react-native';

import { useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { Text } from '@/components/Text';
import { canvasNormalLineHeight, font, useWawu } from '@/theme';

/** design/_gen/auth.js line 85 (A30), `flagCard`: 14 by 16 padding, 12 gap, a 20 flag at 2.2, a 1 px warning ring, 20 corners; the title 15 / 600, the line 12.5 with 2 above it, a 17 chevron. */
const FLAG = { padV: 14, padH: 16, between: 12, corner: 20, ring: 1, icon: 20, iconStroke: 2.2, title: 15, line: 12.5, lineGap: 2, chevron: 17 } as const;

export const FLAG_TITLE = 'Complete your account';
export const FLAG_LINE = 'Verify your identity to get your account number';

/**
 * A30's flag on Home (KYC-07): shown while the wallet is not open, above the balance card. It is one more way into
 * the steps beside the first tap on Wallet (R-6), and starts A31. It goes when the account is open: the caller
 * draws it only for a person with no wallet, or one still being opened.
 */
export function CompleteAccountFlag({ onPress }: { onPress: () => void }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID="today-complete-account"
      accessibilityRole="button"
      accessibilityLabel={`${FLAG_TITLE}. ${FLAG_LINE}`}
      onPress={onPress}
      {...ring.handlers}
      style={[
        styles.card,
        { backgroundColor: colors.warningTint, boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: FLAG.ring, color: colors.warning, inset: true }] },
        ring.style,
      ]}
    >
      <Icon name="Flag" size={FLAG.icon} color={colors.warning} strokeWidth={FLAG.iconStroke} />
      <View style={styles.text}>
        <Text variant="body" style={[font(600), styles.title]}>
          {FLAG_TITLE}
        </Text>
        <Text variant="secondary" style={styles.line}>
          {FLAG_LINE}
        </Text>
      </View>
      <Icon name="ChevronRight" size={FLAG.chevron} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: FLAG.between, paddingVertical: FLAG.padV, paddingHorizontal: FLAG.padH, borderRadius: FLAG.corner },
  text: { flex: 1, gap: FLAG.lineGap },
  title: { fontSize: FLAG.title, lineHeight: canvasNormalLineHeight(FLAG.title) },
  line: { fontSize: FLAG.line, lineHeight: canvasNormalLineHeight(FLAG.line) },
});
