import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/Button';
import { Text } from '@/components/Text';
import { font, layout, space, useWawu } from '@/theme';

/** design/_gen/kit.js `nav`: a 56 bar, 20 sides, 12 gap, a 42 round button, a 17 bold title with a 12.5 line under it 2 below. */
const navMetrics = { height: 56, button: 42, title: 17, titleTracking: -0.02, sub: 12.5, subGap: 2 } as const;
/** kit.js `body`: 8 above, 18 between the parts of the Create screens (me.js `hub`, `upload`), room for the foot below. */
const bodyMetrics = { top: space.sm, between: 18, bottom: space.xl } as const;
/** kit.js `foot`: 12 above, 34 below the phone's edge (the bottom inset takes the place of it on a phone). */
export const footMetrics = { top: space.md, bottom: 24 } as const;

export type CreateFrameProps = {
  title: string;
  /** The muted line under the title ("Step 2 of 5"). */
  subtitle?: string;
  /** `close` draws the X of M19; `back` the chevron of the steps. */
  leading?: 'back' | 'close';
  onLeave: () => void;
  /** Pinned under the body: the Continue button. */
  foot?: ReactNode;
  children: ReactNode;
  testID?: string;
};

/** The Create screens' frame: safe areas, the bar (a round button, a title with a line under it), the scrolling body and a pinned foot. */
export function CreateFrame({ title, subtitle, leading = 'back', onLeave, foot, children, testID }: CreateFrameProps) {
  const { colors } = useWawu();
  const insets = useSafeAreaInsets();
  return (
    <View testID={testID} style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: insets.top }]}>
      <View style={styles.nav}>
        <View style={styles.side}>
          <IconButton icon={leading === 'close' ? 'X' : 'ChevronLeft'} label={leading === 'close' ? 'Close' : 'Back'} onPress={onLeave} testID="create-leave" />
        </View>
        <View style={styles.titles}>
          <Text variant="body" numberOfLines={1} accessibilityRole="header" style={[styles.title, { fontSize: navMetrics.title, letterSpacing: navMetrics.titleTracking * navMetrics.title }]}>
            {title}
          </Text>
          {subtitle ? (
            <Text variant="body" numberOfLines={1} testID="create-subtitle" style={[styles.sub, { color: colors.textMuted }]}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <View style={styles.side} />
      </View>
      <ScrollView
        style={styles.scroll}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingLeft: layout.gutter + insets.left, paddingRight: layout.gutter + insets.right, paddingBottom: bodyMetrics.bottom }]}
      >
        {children}
      </ScrollView>
      {foot ? (
        <View style={[styles.foot, { backgroundColor: colors.surfacePage, paddingBottom: footMetrics.bottom + insets.bottom, paddingLeft: layout.gutter + insets.left, paddingRight: layout.gutter + insets.right }]}>
          {foot}
        </View>
      ) : null}
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
  content: { flexGrow: 1, paddingTop: bodyMetrics.top, gap: bodyMetrics.between },
  foot: { paddingTop: footMetrics.top, gap: space.sm },
});
