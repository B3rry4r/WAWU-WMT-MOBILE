import { Pressable, StyleSheet, View } from 'react-native';

import { useFocusRing } from '@/components/focusRing';
import { Text } from '@/components/Text';
import { canvasNormalLineHeight, font, useWawu } from '@/theme';

import { PROFILE_TABS, type ProfileTab } from './model';

/**
 * design/_gen/me.js line 13, `ptabs`: 24 between the words, 15 at 600, 12 under each word, a 2 high line under
 * the one on show (text-primary) sitting on the row's own hairline, and 4 more above the row than the body's gap.
 */
const tabMetrics = { between: 24, fontSize: 15, under: 12, line: 2, hairline: 1, above: 4 } as const;

export type ProfileTabsProps = {
  value: ProfileTab;
  onChange: (tab: ProfileTab) => void;
  /** M33 draws the line under the tab on show in the accent; M1 and M5 draw it in the text colour. */
  accent?: boolean;
};

/** Content · Services · About (R-9: no Shop tab). A screen reader hears a tab list and which tab is on. */
export function ProfileTabs({ value, onChange, accent }: ProfileTabsProps) {
  const { colors } = useWawu();
  return (
    <View
      accessibilityRole="tablist"
      testID="me-tabs"
      style={[styles.row, { boxShadow: [{ offsetX: 0, offsetY: -tabMetrics.hairline, blurRadius: 0, spreadDistance: 0, color: colors.borderHairline, inset: true }] }]}
    >
      {PROFILE_TABS.map((tab) => (
        <TabWord key={tab.value} label={tab.label} selected={tab.value === value} accent={accent} onPress={() => onChange(tab.value)} testID={`me-tab-${tab.value}`} />
      ))}
    </View>
  );
}

function TabWord({ label, selected, accent, onPress, testID }: { label: string; selected: boolean; accent?: boolean; onPress: () => void; testID: string }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      aria-selected={selected}
      accessibilityLabel={label}
      onPress={onPress}
      {...ring.handlers}
      style={[styles.tab, { borderBottomColor: selected ? (accent ? colors.accent : colors.textPrimary) : 'transparent' }, ring.style]}
    >
      <Text variant="body" tone={selected ? 'textPrimary' : 'textMuted'} style={styles.label}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: tabMetrics.between, marginTop: tabMetrics.above },
  tab: { paddingBottom: tabMetrics.under, borderBottomWidth: tabMetrics.line, marginBottom: -tabMetrics.hairline },
  label: { ...font(600), fontSize: tabMetrics.fontSize, lineHeight: canvasNormalLineHeight(tabMetrics.fontSize) },
});
