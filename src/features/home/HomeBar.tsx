import { StyleSheet, View } from 'react-native';

import { IconButton } from '@/components/Button';
import { unbuilt } from '@/lib/unbuilt';
import { useWawu } from '@/theme';

import { HomeTabs } from './HomeTabs';
import { gutter, todayMetrics as m } from './look';
import { homeViews, type HomeView } from './model';

export type HomeBarProps = {
  onView: (view: HomeView) => void;
  /** How many notifications are waiting: the bell shows its dot only when there are some. */
  unread: number;
};

/**
 * H1, H11 and H36's bar (design/_gen/home.js `todayHead`): the tab row at the left with Today on, then the search and the
 * bell, 40 round buttons 8 apart. Search is X5 (EXPLORE-02) and the bell is M31 (ME-14): neither is built, so each is drawn
 * and opens nothing until its task is (R-46). The bell's dot is data, not decoration: it shows when `GET /me/counts`
 * says something is unread (the canvas's dot is a sample), as Explore's bell does.
 *
 * The tab row takes the room the buttons leave and gives way to it on a narrow phone (`HomeTabs` `fit`).
 */
export function HomeBar({ onView, unread }: HomeBarProps) {
  const { colors } = useWawu();
  return (
    <View style={styles.bar}>
      <HomeTabs views={homeViews} selected="today" tone="page" onChange={onView} fit style={styles.tabs} />
      <View style={styles.buttons}>
        <IconButton testID="today-search" icon="Search" size={m.barButton} label="Search" onPress={unbuilt('EXPLORE-02')} />
        <View style={styles.bell}>
          <IconButton
            testID="today-bell"
            icon="Bell"
            size={m.barButton}
            label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
            onPress={unbuilt('ME-14')}
          />
          {unread > 0 ? (
            <View
              testID="today-bell-dot"
              pointerEvents="none"
              style={[
                styles.dot,
                {
                  backgroundColor: colors.accent,
                  boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: m.dotRing, color: colors.surfaceCard }],
                },
              ]}
            />
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { height: m.headRow, marginBottom: m.headBottom, paddingHorizontal: gutter, flexDirection: 'row', alignItems: 'center' },
  tabs: { marginRight: m.barClear },
  buttons: { flexDirection: 'row', alignItems: 'center', gap: m.barButtonsApart, flexShrink: 0 },
  bell: { width: m.barButton, height: m.barButton },
  dot: { position: 'absolute', top: m.dotTop, right: m.dotRight, width: m.dot, height: m.dot, borderRadius: m.dot / 2 },
});
