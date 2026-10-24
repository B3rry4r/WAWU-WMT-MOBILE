import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Icon, type IconName } from '@/components/icon';
import { Text } from '@/components/Text';
import { radius, space, useWawu } from '@/theme';

/**
 * design/_gen/kit.js line 58 (`banner`, warning) as design/_gen/settings.js line 15 (Z6) draws it: an 18 radius tint box, 14 by 16
 * inside, a 19 mark with 12 after it, the title at 14.5 / 600, the words at 13 on a 1.45 line, and a small button 8 under them.
 * The shared `Banner` has no button yet (SHARED-CHANGES INBOX-13 #2, SETTINGS-05 #2), so this draws the same box with one.
 */
const noticeMetrics = { padV: 14, icon: 19, iconToText: 12, inner: 3, iconNudge: 1, buttonTop: 8 } as const;

export type WalletNoticeProps = {
  title: string;
  body: string;
  icon?: IconName;
  action?: { label: string; onPress: () => void; testID: string; loading?: boolean };
  testID: string;
};

export function WalletNotice({ title, body, icon = 'Wallet', action, testID }: WalletNoticeProps) {
  const { colors } = useWawu();
  return (
    <View testID={testID} accessibilityRole="alert" accessibilityLiveRegion="polite" style={[styles.root, { backgroundColor: colors.warningTint }]}>
      <View style={styles.icon}>
        <Icon name={icon} size={noticeMetrics.icon} color={colors.warning} strokeWidth={2.2} />
      </View>
      <View style={styles.text}>
        <Text variant="kvValue">{title}</Text>
        <Text variant="bannerBody">{body}</Text>
        {action ? (
          <View style={styles.action}>
            <Button testID={action.testID} label={action.label} size="sm" loading={action.loading} onPress={action.onPress} />
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'flex-start', gap: noticeMetrics.iconToText, borderRadius: radius.tile, paddingVertical: noticeMetrics.padV, paddingHorizontal: space.lg },
  icon: { paddingTop: noticeMetrics.iconNudge },
  text: { flex: 1, gap: noticeMetrics.inner },
  action: { marginTop: noticeMetrics.buttonTop, alignItems: 'flex-start' },
});
