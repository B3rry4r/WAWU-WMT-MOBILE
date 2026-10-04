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

export type AboutFrameProps = {
  title: string;
  onBack: () => void;
  /** The gap between the screen's parts (Z9 16, Z10 and Z11 18). */
  gap: number;
  children: ReactNode;
  testID?: string;
};

/**
 * The frame Z9, Z10 and Z11 share: safe areas, the bar (back, centred title) and
 * scrolling content. A long legal text scrolls inside it and keeps clear of the
 * phone's edges; the title wraps on a large font instead of being cut.
 */
export function AboutFrame({ title, onBack, gap, children, testID }: AboutFrameProps) {
  const { colors } = useWawu();
  const insets = useSafeAreaInsets();
  return (
    <View testID={testID} style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: insets.top }]}>
      <View style={styles.nav}>
        <View style={styles.side}>
          <IconButton icon="ChevronLeft" label="Back" onPress={onBack} testID="about-back" />
        </View>
        <Text
          variant="body"
          numberOfLines={2}
          accessibilityRole="header"
          style={[styles.title, { fontSize: navMetrics.title, letterSpacing: navMetrics.titleTracking * navMetrics.title }]}
        >
          {title}
        </Text>
        <View style={styles.side} />
      </View>
      <ScrollView
        style={styles.scroll}
        testID="about-scroll"
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
