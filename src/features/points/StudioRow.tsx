import { useQuery } from '@tanstack/react-query';
import { Pressable, StyleSheet, View } from 'react-native';

import { queryClient } from '@/api/query';
import { useFocusRing } from '@/components/focusRing';
import { IconTile } from '@/components/IconTile';
import { PointsFigure } from '@/components/PointsFigure';
import { Text } from '@/components/Text';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { font, radius, space, useWawu } from '@/theme';

import { myPointsQuery } from './api';
import { aiToolsQuery } from './studioApi';
import { STUDIO_WORDS } from './studioModel';

/** me.js `hubItem` as M19 draws the Studio card: a 22 corner card, 16 padding, 12 between the mark and the words; a 48 accent mark, the name 16 semi-bold, a 13 muted line under it, the count at the end. */
const ROW = { pad: space.lg, gap: space.md, icon: 48, title: 16, sub: 13, subLeading: 1.35, subGap: 3, ring: 1.5 } as const;

/** The line under "Studio": the tools the Hub lists, by name. With none listed (or none read) it says what Studio is, never a tool the Hub does not run. */
export function studioSub(names: readonly string[]): string {
  return names.length > 0 ? names.join(', ') : STUDIO_WORDS.sub;
}

/**
 * M19's Studio card on the Create hub (POINTS-07): the tools the Hub lists and the person's points, both the Hub's. A balance that cannot
 * be read leaves the count out (never a made-up number); the card still opens Studio, which says what is wrong. Added where the board draws
 * it, because this task builds the screen it opens (R-27, R-47).
 */
export function StudioRow({ onPress }: { onPress: () => void }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const owner = useSessionAccount(undefined);
  const tools = useQuery({ ...aiToolsQuery(owner), retry: false }, queryClient);
  const points = useQuery({ ...myPointsQuery(owner), retry: false }, queryClient);
  const sub = studioSub((tools.data?.tools ?? []).filter((t) => t.enabled).map((t) => t.name));
  const balance = points.data?.balance;
  return (
    <Pressable
      testID="create-studio-row"
      accessibilityRole="button"
      accessibilityLabel={`${STUDIO_WORDS.title}, ${sub}${balance === undefined ? '' : `, ${balance} points`}`}
      onPress={onPress}
      {...ring.handlers}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed ? colors.accentTintStrong : colors.accentTint, boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: ROW.ring, color: colors.accent, inset: true }] },
        ring.style,
      ]}
    >
      <IconTile icon="Sparkles" tone="accent" size={ROW.icon} />
      <View style={styles.words}>
        <Text variant="body" style={[font(600), styles.title]}>
          {STUDIO_WORDS.title}
        </Text>
        <Text variant="body" tone="textMuted" testID="create-studio-sub" style={styles.sub}>
          {sub}
        </Text>
      </View>
      {balance !== undefined ? <PointsFigure count={balance} size="chip" testID="create-studio-points" /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.card, padding: ROW.pad, gap: ROW.gap },
  words: { flex: 1, minWidth: 0 },
  title: { fontSize: ROW.title },
  sub: { fontSize: ROW.sub, lineHeight: ROW.sub * ROW.subLeading, marginTop: ROW.subGap },
});
