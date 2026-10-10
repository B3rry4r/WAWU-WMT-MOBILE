import { StyleSheet, View } from 'react-native';

import { IconButton } from '@/components/Button';
import { formatCredits } from '@/components/Credits';
import { Icon } from '@/components/icon';
import { Text } from '@/components/Text';
import { font, radius, useWawu } from '@/theme';

import { GroupTile, tileMetrics } from './GroupTile';

/**
 * design/_gen/inbox.js lines 17 (`chatHead`) and 69 (`credPill`): a 64 bar with 12 on the left and 16 on the right,
 * 10 between its parts and a hairline under it; the back button is 40; the name is 16 / 700 over a 12.5 line;
 * the credit pill is 32 high, 12 across, 13 / 700, with a 15 coin 6 before the words.
 *
 * The artboard's name and count carry no `nowrap` and no ellipsis (line 17: `white-space: normal`, `text-overflow: clip`), so on a
 * phone narrower than the artboard they wrap onto more lines (measured: at 360 the name takes two lines and the count two, at 320
 * the count takes three) and the pill keeps its width. The bar here does the same, growing past 64 instead of cutting the name or
 * the count (INBOX-05 round 5, verifier note 26). Only a name past `nameLines` lines is cut, so one very long name cannot take the screen.
 */
const headMetrics = { height: 64, padLeft: 12, padRight: 16, between: 10, back: 40, name: 16, sub: 12.5, subGap: 1, nameLines: 3, pillHeight: 32, pillPadH: 12, pillGap: 6, pillFont: 13, coin: 15, coinStroke: 2.2 } as const;

export type RoomHeaderProps = {
  name: string;
  imageUrl: string | null;
  /** "1,204 members · open". */
  sub: string;
  /** The person's WAWU Credits, as the server holds them. Left out until they are known. */
  credits?: number;
  onBack: () => void;
};

/** I25's top bar: back, the room's picture and name with its member count, and the credit balance. */
export function RoomHeader({ name, imageUrl, sub, credits, onBack }: RoomHeaderProps) {
  const { colors } = useWawu();
  const empty = credits === 0;
  return (
    <View style={[styles.bar, { borderBottomColor: colors.borderHairline }]} testID="room-header">
      <IconButton icon="ChevronLeft" label="Back" onPress={onBack} size={headMetrics.back} testID="room-back" />
      <GroupTile uri={imageUrl} size={tileMetrics.header} testID="room-tile" />
      <View style={styles.words}>
        <Text variant="body" numberOfLines={headMetrics.nameLines} accessibilityRole="header" style={[font(700), { fontSize: headMetrics.name }]} testID="room-name">
          {name}
        </Text>
        <Text variant="caption" tone="textMuted" style={[{ fontSize: headMetrics.sub }, styles.sub]} testID="room-sub">
          {sub}
        </Text>
      </View>
      {credits !== undefined ? (
        <View
          testID="room-credits"
          accessible
          accessibilityLabel={`${formatCredits(credits)} left`}
          style={[styles.pill, { backgroundColor: empty ? colors.warningTint : colors.accentTint }]}
        >
          <Icon name="Coins" size={headMetrics.coin} color={empty ? colors.warning : colors.accentFg} strokeWidth={headMetrics.coinStroke} />
          <Text variant="caption" tone={empty ? 'warning' : 'accentFg'} style={[font(700), { fontSize: headMetrics.pillFont }]}>
            {formatCredits(credits)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    minHeight: headMetrics.height,
    paddingLeft: headMetrics.padLeft,
    paddingRight: headMetrics.padRight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: headMetrics.between,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  words: { flex: 1, minWidth: 0 },
  sub: { marginTop: headMetrics.subGap },
  pill: {
    height: headMetrics.pillHeight,
    paddingHorizontal: headMetrics.pillPadH,
    borderRadius: radius.chip,
    flexDirection: 'row',
    alignItems: 'center',
    gap: headMetrics.pillGap,
  },
});

