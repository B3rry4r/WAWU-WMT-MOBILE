import { Tabs } from 'expo-router/js-tabs';
import { StyleSheet, View } from 'react-native';

import { ErrorScreen } from '@/components/ErrorScreen';
import { TabBar, tabs } from '@/components/TabBar';
import { useInboxUnread } from '@/features/inbox/unread';
import { MusicLayer } from '@/features/music/MusicButton';

/**
 * A tab screen that throws while it draws shows "Something went wrong" in its place, with the tab bar still standing, so a person can leave it
 * (WALLET-BLANK, SHARED-CHANGES WALLET-BLANK #1). The root layout's boundary catches anything this one does not.
 */
export const unstable_settings = { screenErrorBoundary: ErrorScreen };

/**
 * Home, Explore, Inbox, Wallet, Me: the same five tabs for everyone. The WAWU theme's round button (R-99, THEME-MUSIC) stands over
 * them, above the Create button; it hides itself on the Inbox tab, where a person talks.
 */
export default function TabsLayout() {
  const unread = useInboxUnread();

  return (
    <View style={styles.root}>
      <Tabs initialRouteName="index" tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
        {tabs.map((tab) => (
          <Tabs.Screen
            key={tab.route}
            name={tab.route}
            options={{ title: tab.label, tabBarBadge: tab.route === 'inbox' && unread > 0 ? unread : undefined }}
          />
        ))}
      </Tabs>
      <MusicLayer />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
