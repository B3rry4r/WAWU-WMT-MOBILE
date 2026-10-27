import { Tabs } from 'expo-router/js-tabs';
import { StyleSheet, View } from 'react-native';

import { TabBar, tabs } from '@/components/TabBar';
import { useInboxUnread } from '@/features/inbox/unread';
import { MusicLayer } from '@/features/music/MusicButton';

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
