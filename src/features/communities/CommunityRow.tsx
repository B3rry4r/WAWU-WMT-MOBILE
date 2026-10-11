import { Pressable, StyleSheet, View } from 'react-native';

import { useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { Text } from '@/components/Text';
import { font, radius, space, useWawu } from '@/theme';

import { GroupTile, tileMetrics } from './GroupTile';

/** design/_gen/inbox.js line 68, `cRow`: a 52 tile, 13 apart, 13 above and below, the name 16 / 600, the line 13.5, the right-hand word 12.5. */
const rowMetrics = { between: 13, padV: 13, name: 16, lineGap: 3, nameGap: 5, line: 13.5, meta: 12.5, lock: 14, lockStroke: 2.2, badge: 21, badgeFont: 11.5, badgePadH: 6 } as const;
const MAX_COUNT = 99;

export type CommunityRowProps = {
  name: string;
  imageUrl: string | null;
  /** A private room carries a lock after its name. */
  locked?: boolean;
  /** The line under the name: the last message, or "2.1K members · open". */
  line: string;
  /** What sits on the right: the time of the last message, or "Join". */
  meta?: string;
  /** Messages the person has not read. Zero draws the quiet colours and no badge. */
  unread?: number;
  /** The row's meta shows a problem (a join that failed). */
  problem?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  testID?: string;
};

/** One community of I24: its picture, its name (with a lock when private), a line under it, and a word on the right. */
export function CommunityRow({ name, imageUrl, locked, line, meta, unread = 0, problem, onPress, accessibilityLabel, testID }: CommunityRowProps) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const isUnread = unread > 0;
  const label = accessibilityLabel ?? [name, locked ? 'private' : null, line, meta, isUnread ? `${unread} unread` : null].filter(Boolean).join(', ');
  const body = (
    <>
      <GroupTile uri={imageUrl} size={tileMetrics.row} testID={testID ? `${testID}-tile` : undefined} />
      <View style={styles.words}>
        <View style={styles.nameLine}>
          <Text variant="body" numberOfLines={1} style={[font(600), { fontSize: rowMetrics.name }, styles.name]}>
            {name}
          </Text>
          {locked ? <Icon name="Lock" size={rowMetrics.lock} color={colors.textMuted} strokeWidth={rowMetrics.lockStroke} /> : null}
        </View>
        <Text
          variant="secondary"
          tone={isUnread ? 'textPrimary' : 'textSecondary'}
          numberOfLines={1}
          style={[{ fontSize: rowMetrics.line }, styles.line]}
        >
          {line}
        </Text>
      </View>
      {isUnread ? (
        <View style={styles.right}>
          {meta ? (
            <Text variant="caption" tone="accentFg" style={[font(700), { fontSize: rowMetrics.meta }]}>
              {meta}
            </Text>
          ) : null}
          <View style={[styles.badge, { backgroundColor: colors.accent }]}>
            <Text variant="caption" tone="textOnAccent" style={[font(700), { fontSize: rowMetrics.badgeFont }]}>
              {unread > MAX_COUNT ? `${MAX_COUNT}+` : String(unread)}
            </Text>
          </View>
        </View>
      ) : meta ? (
        <Text variant="caption" tone={problem ? 'danger' : 'textMuted'} style={{ fontSize: rowMetrics.meta }}>
          {meta}
        </Text>
      ) : null}
      <View pointerEvents="none" style={[styles.divider, { backgroundColor: colors.borderHairline }]} />
    </>
  );
  return onPress ? (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} onPress={onPress} {...ring.handlers} style={[styles.row, ring.style]}>
      {body}
    </Pressable>
  ) : (
    <View testID={testID} accessible accessibilityLabel={label} style={styles.row}>
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: rowMetrics.between, paddingVertical: rowMetrics.padV },
  words: { flex: 1, minWidth: 0 },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: rowMetrics.nameGap, minWidth: 0 },
  name: { flexShrink: 1 },
  line: { marginTop: rowMetrics.lineGap },
  right: { alignItems: 'flex-end', gap: space.xs },
  badge: { minWidth: rowMetrics.badge, height: rowMetrics.badge, paddingHorizontal: rowMetrics.badgePadH, borderRadius: radius.chip, alignItems: 'center', justifyContent: 'center' },
  divider: { position: 'absolute', left: 0, right: 0, bottom: 0, height: StyleSheet.hairlineWidth },
});
