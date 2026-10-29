import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/Card';
import { useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { Text } from '@/components/Text';
import { copyText } from '@/features/open-wallet/copy';
import { font, radius, space, useWawu } from '@/theme';

/**
 * S7's token card, as design/_gen/services.js draws it (`token`): the card with 16 all round and 10 between its parts, "Your token"
 * 12.5 muted, the token 22 bold with 0.06em tracking and tabular figures, then the Copy button (the add-money Copy pill: 32 high, 12
 * at the sides, the Copy glyph 14, the word 13 semi-bold, 6 between) and the units, 12.5 muted, in a row 10 apart.
 */
const TOKEN = { label: 12.5, figure: 22, tracking: 0.06, copyHeight: 32, copyPadX: 12, copyIcon: 14, copyWord: 13, copyGap: 6, actionSpacing: 10, partGap: 10, copiedMs: 2000 } as const;

export const TOKEN_WORDS = { title: 'Your token', copy: 'Copy token', copied: 'Copied', unitsOf: 'kWh' } as const;

/**
 * A token that is only digits (a prepaid meter's twenty) is drawn in groups of four, as the board draws it; anything else is drawn as
 * the Hub wrote it. What Copy puts on the phone is what is drawn.
 */
export function groupToken(token: string): string {
  return /^\d{8,}$/.test(token) ? (token.match(/\d{1,4}/g) ?? [token]).join(' ') : token;
}

export type TokenCardProps = { token: string; units: string | null };

export function TokenCard({ token, units }: TokenCardProps) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const shown = groupToken(token);
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const copy = async () => {
    const done = await copyText(shown);
    AccessibilityInfo.announceForAccessibility(done ? 'Token copied' : "Couldn't copy the token");
    if (!done) return;
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), TOKEN.copiedMs);
  };
  return (
    <Card testID="receipt-token-card" padded style={styles.card}>
      <Text variant="secondary" tone="textSecondary" style={styles.label}>
        {TOKEN_WORDS.title}
      </Text>
      <Text
        testID="receipt-token"
        selectable
        accessibilityLabel={`${TOKEN_WORDS.title}: ${shown}`}
        style={[font(700), styles.figure, { color: colors.textPrimary }]}
      >
        {shown}
      </Text>
      <View style={styles.row}>
        <Pressable
          testID="receipt-token-copy"
          accessibilityRole="button"
          accessibilityLabel={copied ? TOKEN_WORDS.copied : TOKEN_WORDS.copy}
          onPress={() => void copy()}
          hitSlop={space.sm}
          {...ring.handlers}
          style={({ pressed }) => [styles.copy, { backgroundColor: pressed ? colors.borderHairline : colors.surfaceSunken }, ring.style]}
        >
          <Icon name={copied ? 'Check' : 'Copy'} size={TOKEN.copyIcon} color={colors.textPrimary} />
          <Text variant="body" style={[font(600), styles.copyWord]}>
            {copied ? TOKEN_WORDS.copied : TOKEN_WORDS.copy}
          </Text>
        </Pressable>
        {units ? (
          <Text testID="receipt-units" variant="secondary" tone="textSecondary" style={styles.label}>
            {`${units} ${TOKEN_WORDS.unitsOf}`}
          </Text>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: TOKEN.partGap },
  label: { fontSize: TOKEN.label },
  figure: { fontSize: TOKEN.figure, lineHeight: TOKEN.figure * 1.25, letterSpacing: TOKEN.tracking * TOKEN.figure, fontVariant: ['tabular-nums', 'lining-nums'] },
  row: { flexDirection: 'row', alignItems: 'center', gap: TOKEN.actionSpacing },
  copy: { height: TOKEN.copyHeight, paddingHorizontal: TOKEN.copyPadX, borderRadius: radius.chip, flexDirection: 'row', alignItems: 'center', gap: TOKEN.copyGap, flexShrink: 0 },
  copyWord: { fontSize: TOKEN.copyWord },
});
