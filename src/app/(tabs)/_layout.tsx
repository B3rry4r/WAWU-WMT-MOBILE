import { Tabs } from 'expo-router/js-tabs';

import { TabBar, tabs } from '@/components/TabBar';
import { useInboxUnread } from '@/features/inbox/unread';

/** Home, Explore, Inbox, Wallet, Me: the same five tabs for everyone. */
export default function TabsLayout() {
  const unread = useInboxUnread();

  return (
    <Tabs initialRouteName="index" tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.route}
          name={tab.route}
          options={{ title: tab.label, tabBarBadge: tab.route === 'inbox' && unread > 0 ? unread : undefined }}
        />
      ))}
    </Tabs>
  );
}
