import { StyleSheet, View } from 'react-native';

import { IconButton } from '@/components/Button';
import { Card } from '@/components/Card';
import { Text } from '@/components/Text';
import { font, radius, space, useWawu } from '@/theme';

import type { Work } from './api';
import { bylineOf, stillOf } from './model';
import { WorkCover } from './WorkCover';

/** One row of the order list: a 56 square picture with M34's 12 corner, 12 between the parts, the title at 14.5 and the line under it at 12.5 as a card has them. */
const rowMetrics = { picture: 56, between: space.md, title: 14.5, sub: 12.5, subGap: 2, button: 36 } as const;

/** `from` moved to `to` in `list` (a new list; the same one when either end is outside it). */
export function moved<T>(list: readonly T[], from: number, to: number): T[] {
  const next = [...list];
  if (from < 0 || from >= next.length || to < 0 || to >= next.length || from === to) return next;
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export type ReorderListProps = {
  works: readonly Work[];
  onMove: (from: number, to: number) => void;
  disabled?: boolean;
};

/**
 * M34 in its reorder form (FIX-113, G-252; no board draws it, so it is built from the works card's picture and words with a move
 * up and a move down on each row: R-29, BACKEND_GAPS). The first work is the one the profile shows first.
 */
export function ReorderList({ works, onMove, disabled }: ReorderListProps) {
  const { colors } = useWawu();
  return (
    <View testID="works-reorder" style={styles.list}>
      {works.map((work, index) => (
        <Card key={work.id} testID={`reorder-${work.id}`} style={styles.row}>
          <View style={[styles.picture, { backgroundColor: colors.surfaceSunken }]}>
            <WorkCover media={stillOf(work)} />
          </View>
          <View style={styles.words}>
            <Text variant="body" numberOfLines={1} style={[font(600), styles.title]}>
              {work.title}
            </Text>
            <Text variant="body" numberOfLines={1} style={[styles.sub, { color: colors.textMuted }]}>
              {bylineOf(work)}
            </Text>
          </View>
          {/* The same chevron turned over: a round button is the same upside down. */}
          <View style={styles.flip}>
            <IconButton
              icon="ChevronDown"
              label={`Move ${work.title} up`}
              size={rowMetrics.button}
              disabled={disabled || index === 0}
              onPress={() => onMove(index, index - 1)}
              testID={`reorder-up-${work.id}`}
            />
          </View>
          <View>
            <IconButton
              icon="ChevronDown"
              label={`Move ${work.title} down`}
              size={rowMetrics.button}
              disabled={disabled || index === works.length - 1}
              onPress={() => onMove(index, index + 1)}
              testID={`reorder-down-${work.id}`}
            />
          </View>
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: space.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: rowMetrics.between, padding: space.sm },
  picture: { width: rowMetrics.picture, height: rowMetrics.picture, borderRadius: radius.input, overflow: 'hidden' },
  words: { flex: 1, minWidth: 0, gap: rowMetrics.subGap },
  title: { fontSize: rowMetrics.title },
  sub: { fontSize: rowMetrics.sub },
  flip: { transform: [{ rotate: '180deg' }] },
});
