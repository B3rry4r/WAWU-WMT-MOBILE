import { Pressable, StyleSheet, View } from 'react-native';

import { useFocusRing } from '@/components/focusRing';
import { Text } from '@/components/Text';
import { font, radius, useWawu } from '@/theme';

import type { Work } from './api';
import { bylineOf, stillOf } from './model';
import { WorkCover } from './WorkCover';

/** design/_gen/me.js line 57 (`work`): the picture is 0.72 as high as it is wide with a 16 corner, 7 to the title (14, 600, line 1.25) and 7 to the line under it (12.5, muted). */
export const cardMetrics = { ratio: 0.72, stack: 7, title: 14, titleLine: 1.25, sub: 12.5 } as const;

export type WorkCardProps = {
  work: Pick<Work, 'id' | 'title' | 'role' | 'year' | 'media'>;
  onPress: () => void;
  testID?: string;
};

/** One work in M34's grid: its picture, its title, and "Role · year". */
export function WorkCard({ work, onPress, testID }: WorkCardProps) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const byline = bylineOf(work);
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`${work.title}, ${byline}`}
      onPress={onPress}
      {...ring.handlers}
      style={[styles.card, ring.style]}
    >
      <View style={[styles.picture, { backgroundColor: colors.surfaceSunken }]}>
        <WorkCover media={stillOf(work)} />
      </View>
      <Text variant="body" numberOfLines={2} style={[font(600), styles.title]}>
        {work.title}
      </Text>
      <Text variant="body" numberOfLines={1} style={[styles.sub, { color: colors.textMuted }]}>
        {byline}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minWidth: 0, gap: cardMetrics.stack },
  picture: { width: '100%', aspectRatio: 1 / cardMetrics.ratio, borderRadius: radius.input, overflow: 'hidden' },
  title: { fontSize: cardMetrics.title, lineHeight: cardMetrics.title * cardMetrics.titleLine },
  sub: { fontSize: cardMetrics.sub },
});
