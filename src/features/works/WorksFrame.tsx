import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/Button';
import { Text } from '@/components/Text';
import { font, layout, space, useWawu } from '@/theme';

/** design/_gen/kit.js line 34, `nav`: a 56 px bar, 20 px sides, 12 gap, a 42 px round button, a 17 px bold title with a 12.5 px line under it 2 below, a 42 px slot on the right. */
const navMetrics = { height: 56, button: 42, title: 17, titleTracking: -0.02, sub: 12.5, subGap: 2 } as const;
/** design/_gen/kit.js line 35, `body`: 8 above; me.js line 70 (M34) 16 between the parts; 40 below as the other pushed screens. */
const bodyMetrics = { top: space.sm, gap: space.lg, bottom: 40 } as const;

export type WorksFrameProps = {
  title: string;
  /** The muted line under the title ("Lennox Emmanuel · 12"). */
  subtitle?: string;
  onBack: () => void;
  children: ReactNode;
  /** The 42 slot on the right of the bar (M33's Share). Empty by default. */
  right?: ReactNode;
  /** A row between the bar and the scrolling body that stays put (M33's tabs). */
  below?: ReactNode;
  /** A bar pinned to the bottom of the screen (M33's Follow). The body leaves room for it. */
  footer?: ReactNode;
  testID?: string;
};

/** M34's frame: safe areas, the bar (back, a title with a line under it) and the scrolling body. */
export function WorksFrame({ title, subtitle, onBack, children, right, below, footer, testID }: WorksFrameProps) {
  const { colors } = useWawu();
  const insets = useSafeAreaInsets();
  return (
    <View testID={testID} style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: insets.top }]}>
      <View style={styles.nav}>
        <View style={styles.side}>
          <IconButton icon="ChevronLeft" label="Back" onPress={onBack} testID="works-back" />
        </View>
        <View style={styles.titles}>
          <Text variant="body" numberOfLines={1} accessibilityRole="header" style={[styles.title, { fontSize: navMetrics.title, letterSpacing: navMetrics.titleTracking * navMetrics.title }]}>
            {title}
          </Text>
          {subtitle ? (
            <Text variant="body" numberOfLines={1} testID="works-subtitle" style={[styles.sub, { color: colors.textMuted }]}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <View style={styles.side}>{right}</View>
      </View>
      {below}
      <ScrollView
        style={styles.scroll}
        testID="works-scroll"
        contentContainerStyle={[
          styles.content,
          { paddingBottom: footer ? bodyMetrics.bottom : insets.bottom + bodyMetrics.bottom, paddingLeft: layout.gutter + insets.left, paddingRight: layout.gutter + insets.right },
        ]}
      >
        {children}
      </ScrollView>
      {footer}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  nav: { minHeight: navMetrics.height, flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: layout.gutter },
  side: { width: navMetrics.button },
  titles: { flex: 1, minWidth: 0, alignItems: 'center' },
  title: { ...font(700), textAlign: 'center' },
  sub: { fontSize: navMetrics.sub, marginTop: navMetrics.subGap, textAlign: 'center' },
  scroll: { flex: 1 },
  content: { flexGrow: 1, paddingTop: bodyMetrics.top, gap: bodyMetrics.gap },
});
