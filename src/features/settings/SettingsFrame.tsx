import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/Button';
import { Text } from '@/components/Text';
import { font, layout, space, useWawu } from '@/theme';

/** design/_gen/kit.js line 34, `nav`: a 56 px bar, 20 px sides, 12 gap, a 42 px round button, a 17 px bold title, a 42 px slot on the right. */
const navMetrics = { height: 56, button: 42, title: 17, titleTracking: -0.02 } as const;
/** design/_gen/kit.js line 35, `body`: 8 above (settings.js sets `pb: 40` on these screens). */
const bodyMetrics = { top: space.sm, bottom: 40 } as const;

export type SettingsFrameProps = {
  title: string;
  onBack: () => void;
  /** The gap between the screen's parts (Z2 12, Z3 and Z4 16, Z5 4). */
  gap: number;
  children: ReactNode;
  testID?: string;
};

/**
 * The frame Z2 to Z5 and the password screen share: safe areas, the bar (back, centred title) and
 * scrolling content. Content keeps clear of the phone's edges, and the title wraps at a large font
 * instead of being cut.
 */
export function SettingsFrame({ title, onBack, gap, children, testID }: SettingsFrameProps) {
  const { colors } = useWawu();
  const insets = useSafeAreaInsets();
  return (
    <View testID={testID} style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: insets.top }]}>
      <View style={styles.nav}>
        <View style={styles.side}>
          <IconButton icon="ChevronLeft" label="Back" onPress={onBack} testID="settings-back" />
        </View>
        <Text
          variant="body"
          accessibilityRole="header"
          style={[styles.title, { fontSize: navMetrics.title, letterSpacing: navMetrics.titleTracking * navMetrics.title }]}
        >
          {title}
        </Text>
        <View style={styles.side} />
      </View>
      <ScrollView
        style={styles.scroll}
        testID="settings-scroll"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          { gap, paddingBottom: insets.bottom + bodyMetrics.bottom, paddingLeft: layout.gutter + insets.left, paddingRight: layout.gutter + insets.right },
        ]}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  nav: { minHeight: navMetrics.height, flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: layout.gutter },
  side: { width: navMetrics.button },
  title: { ...font(700), flex: 1, textAlign: 'center' },
  scroll: { flex: 1 },
  content: { flexGrow: 1, paddingTop: bodyMetrics.top },
});
