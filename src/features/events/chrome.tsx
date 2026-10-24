import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { IconButton } from '@/components/Button';
import { useFocusRing } from '@/components/focusRing';
import { Text } from '@/components/Text';
import { canvasNormalLineHeight, font, layout, space, useWawu } from '@/theme';

/** design/_gen/kit.js `nav`: a 56 bar, 20 sides, a 42 round button each end, a 17 bold title between. */
export const navMetrics = { height: 56, button: 42, title: 17, titleTracking: -0.02 } as const;
/** design/_gen/events.js `evTabs`: 22 between tabs, 15 semi-bold, an underline 2 thick, 11 above it. */
export const tabMetrics = { between: 22, font: 15, underline: 2, padBottom: 11 } as const;

export type NavBarProps = {
  title: string;
  onBack: () => void;
  /** The control at the right end; an empty 42 square keeps the title centred when there is none. */
  right?: ReactNode;
  backTestID?: string;
  /** A second line under the title (E18: the event's date). */
  subtitle?: string;
};

/** The Events screens' top bar: back, the title, and an optional control. */
export function NavBar({ title, onBack, right, backTestID, subtitle }: NavBarProps) {
  return (
    <View style={styles.nav}>
      <IconButton icon="ChevronLeft" label="Back" onPress={onBack} testID={backTestID} />
      <View style={styles.titles}>
        <Text variant="body" accessibilityRole="header" numberOfLines={1} style={[styles.title, font(700)]}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="secondary" tone="textMuted" numberOfLines={1} style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ?? <View style={styles.spacer} />}
    </View>
  );
}

export type EventsTab = 'discover' | 'mine' | 'host';

/** The tabs under the title (E1, E17, E13 to E15): Discover, My events and Host event, as the canvas draws them. */
const tabs: readonly { value: EventsTab; label: string }[] = [
  { value: 'discover', label: 'Discover' },
  { value: 'mine', label: 'My events' },
  { value: 'host', label: 'Host event' },
];

export function EventsTabs({ active, onChange }: { active: EventsTab; onChange: (tab: EventsTab) => void }) {
  const { colors } = useWawu();
  return (
    <View accessibilityRole="tablist" style={[styles.tabs, { borderBottomColor: colors.borderHairline }]}>
      {tabs.map((tab) => (
        <Tab key={tab.value} label={tab.label} selected={tab.value === active} onPress={() => onChange(tab.value)} testID={`events-tab-${tab.value}`} />
      ))}
    </View>
  );
}

function Tab({ label, selected, onPress, testID }: { label: string; selected: boolean; onPress: () => void; testID: string }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={selected ? undefined : onPress}
      {...ring.handlers}
      style={[styles.tab, selected ? { borderBottomWidth: tabMetrics.underline, borderBottomColor: colors.accent } : styles.tabOff, ring.style]}
    >
      <Text variant="body" tone={selected ? 'textPrimary' : 'textMuted'} style={[font(600), { fontSize: tabMetrics.font, lineHeight: canvasNormalLineHeight(tabMetrics.font) }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  nav: {
    height: navMetrics.height,
    paddingHorizontal: layout.gutter,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  titles: { flex: 1 },
  subtitle: { textAlign: 'center' },
  title: { textAlign: 'center', fontSize: navMetrics.title, letterSpacing: navMetrics.titleTracking * navMetrics.title },
  spacer: { width: navMetrics.button },
  tabs: { flexDirection: 'row', gap: tabMetrics.between, paddingHorizontal: layout.gutter, borderBottomWidth: StyleSheet.hairlineWidth },
  tab: { paddingBottom: tabMetrics.padBottom, marginBottom: -StyleSheet.hairlineWidth },
  /** An unselected tab draws no underline; its room is padding, so every label sits on the same line. */
  tabOff: { paddingBottom: tabMetrics.padBottom + tabMetrics.underline },
});
