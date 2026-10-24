import type { BottomTabBarProps } from 'expo-router/js-tabs';

import { TabBar, tabs } from '@/components/TabBar';

/** The tab Flix movies belongs to: the boards draw Explore lit under MV1, MV11 and MV12. */
const LIT = 'explore';

/**
 * The app's own tab bar (the shared `TabBar`) under the Flix movies screens that draw it (MV1, MV11, MV12). Those screens are
 * stack routes above the tabs, so no tab navigator hands the bar its state: this gives it the same five tabs with Explore lit,
 * and a tap on a tab leaves for that tab (`onOpenTab` gets the tab's route name). The Inbox count is not read here, so no badge
 * is drawn; the bar itself never holds a count.
 */
export function FlixTabBar({ onOpenTab }: { onOpenTab: (route: string) => void }) {
  const routes = tabs.map((tab) => ({ key: tab.route, name: tab.route }));
  const state = { index: routes.findIndex((r) => r.name === LIT), routes };
  const descriptors = Object.fromEntries(routes.map((r) => [r.key, { options: {} }]));
  const navigation = { emit: () => ({ defaultPrevented: false }), navigate: (name: string) => onOpenTab(name) };
  return <TabBar {...({ state, descriptors, navigation } as unknown as BottomTabBarProps)} />;
}
