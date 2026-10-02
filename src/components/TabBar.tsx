import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { BottomTabBarProps } from 'expo-router/js-tabs';

import { font, layout, radius, space, type, useWawu } from '@/theme';

import { ICON_STROKE, Icon, type IconName } from './icon';

/** The locked five tabs. Order and labels are fixed. */
export const tabs = [
  { route: 'index', icon: 'House', label: 'Home' },
  { route: 'explore', icon: 'Compass', label: 'Explore' },
  { route: 'inbox', icon: 'MessageCircle', label: 'Inbox' },
  { route: 'wallet', icon: 'Wallet', label: 'Wallet' },
  { route: 'me', icon: 'CircleUserRound', label: 'Me' },
] as const satisfies readonly { route: string; icon: IconName; label: string }[];

const iconSize = space.s2xl;
const strokeActive = ICON_STROKE.activeTab;
const strokeIdle = ICON_STROKE.default;

/**
 * The bottom bar every signed-in screen shares. Badges come from each tab's
 * `tabBarBadge` option, so the bar itself never holds a count.
 */
export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors } = useWawu();

  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.bar,
        { backgroundColor: colors.surfaceChrome, borderTopColor: colors.borderHairline },
      ]}
    >
      {tabs.map((tab) => {
        const index = state.routes.findIndex((r) => r.name === tab.route);
        const route = state.routes[index];
        if (!route) return null;
        const focused = state.index === index;
        const badge = descriptors[route.key]?.options.tabBarBadge;
        const color = focused ? colors.accentFg : colors.textMuted;
        const count = typeof badge === 'number' ? badge : Number(badge ?? 0);

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={count > 0 ? `${tab.label}, ${count} unread` : tab.label}
            onPress={onPress}
            style={styles.tab}
          >
            <View>
              <Icon
                name={tab.icon}
                size={iconSize}
                color={color}
                fill={focused ? colors.accentTintStrong : 'none'}
                strokeWidth={focused ? strokeActive : strokeIdle}
              />
              {count > 0 ? (
                <View
                  testID="tab-badge"
                  style={[styles.badge, { backgroundColor: colors.accent, borderColor: colors.surfacePage }]}
                >
                  <Text style={[styles.badgeText, { color: colors.textOnAccent }]}>
                    {count > 99 ? '99+' : count}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.label, font(focused ? 700 : 500), { color }]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: layout.tabbarH,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.sm,
    paddingBottom: space.s2xl,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: space.xs,
  },
  label: { fontSize: type.size.tab },
  badge: {
    position: 'absolute',
    top: -space.xs,
    left: space.lg,
    minWidth: space.lg,
    height: space.lg,
    paddingHorizontal: space.xs,
    borderRadius: radius.chip,
    borderWidth: StyleSheet.hairlineWidth * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { ...font(700), fontSize: type.size.label },
});
