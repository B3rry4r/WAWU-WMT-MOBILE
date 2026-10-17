import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { IconTile } from '@/components/IconTile';
import { PointsFigure } from '@/components/PointsFigure';
import { Text } from '@/components/Text';
import { layout, space, useWawu } from '@/theme';

import type { MomentCopy } from './model';

/**
 * design/_gen/referral.js `rf3`: a full screen with no bar. The icon (88, accent) sits 190 down the phone (the canvas's
 * 50 status bar counted in), then the title at 26, the line, and the points as the hero figure, 12 apart; one button
 * at the foot. RF3 is a reward that has become available; RF3a is a milestone (a trophy for the star).
 */
const moment = { top: 190, statusBar: 50, icon: 88, title: 26, stack: 12, footTop: 12 } as const;

export type RewardMomentProps = { copy: MomentCopy; onKeepInviting: () => void };

export function RewardMoment({ copy, onKeepInviting }: RewardMomentProps) {
  const { colors } = useWawu();
  const insets = useSafeAreaInsets();
  return (
    <View testID="invite-moment" style={[styles.root, { backgroundColor: colors.surfacePage }]}>
      <View style={[styles.column, { paddingTop: moment.top - moment.statusBar + insets.top }]}>
        <IconTile icon={copy.icon} tone="accent" size={moment.icon} />
        <Text variant="h1" style={styles.title} testID="invite-moment-title">
          {copy.title}
        </Text>
        <Text variant="muted" style={styles.line} testID="invite-moment-line">
          {copy.body}
        </Text>
        <PointsFigure count={copy.points} size="hero" testID="invite-moment-points" />
      </View>
      <View style={[styles.foot, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>
        <Button label="Keep inviting" full onPress={onKeepInviting} testID="invite-moment-continue" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  column: { flex: 1, alignItems: 'center', paddingHorizontal: layout.gutter, gap: moment.stack },
  title: { fontSize: moment.title, textAlign: 'center' },
  line: { textAlign: 'center' },
  foot: { paddingTop: moment.footTop, paddingHorizontal: layout.gutter },
});
