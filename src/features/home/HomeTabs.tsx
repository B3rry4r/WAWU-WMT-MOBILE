import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useFocusRing } from '@/components/focusRing';
import { media, metrics, words } from '@/features/feed/look';
import { useWawu } from '@/theme';

import type { HomeView } from './model';

/** `page` on Today and on the feed's empty and error pages; `media` over a post (always dark). */
export type TabTone = 'media' | 'page';

function HomeTab({ label, selected, tone, onPress, testID }: { label: string; selected: boolean; tone: TabTone; onPress: () => void; testID: string }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const onMedia = tone === 'media';
  const color = onMedia ? (selected ? media.ink : media.tabIdle) : colors[selected ? 'textPrimary' : 'textMuted'];
  const line = selected ? (onMedia ? media.ink : colors.accent) : 'transparent';
  return (
    <Pressable
      testID={testID}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      onPress={onPress}
      {...ring.handlers}
      style={[styles.tab, { borderBottomColor: line }, ring.style]}
    >
      <Text style={[words.tab, { color }]}>{label}</Text>
    </Pressable>
  );
}

export type HomeTabsProps = {
  /** The tabs in order, and the one on screen. */
  views: readonly { view: HomeView; label: string }[];
  selected: HomeView;
  tone: TabTone;
  onChange: (view: HomeView) => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * Home's tab row (H1 to H6): Today, Following, For you, 16.5 bold, 20 apart, the selected one
 * underlined. Today draws it on the page; the feed draws it over the post.
 */
export function HomeTabs({ views, selected, tone, onChange, style }: HomeTabsProps) {
  return (
    <View accessibilityRole="tablist" pointerEvents="box-none" style={[styles.tabs, style]}>
      {views.map((v) => (
        <HomeTab
          key={v.view}
          label={v.label}
          selected={selected === v.view}
          tone={tone}
          onPress={() => onChange(v.view)}
          testID={`feed-tab-${v.view}`}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', alignItems: 'center', gap: metrics.tabsSpacing },
  tab: { paddingBottom: metrics.tabUnderlinePad, borderBottomWidth: metrics.tabUnderline },
});
