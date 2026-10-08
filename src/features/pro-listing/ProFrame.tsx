import type { ReactNode } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/Button';
import { Text } from '@/components/Text';
import { font, layout, space, useWawu } from '@/theme';

/** design/_gen/kit.js line 34, `nav`: a 56 px bar, 20 px sides, 12 gap, a 42 px round button, a 17 px bold title, a 42 px slot on the right. */
const navMetrics = { height: 56, button: 42, title: 17, titleTracking: -0.02 } as const;
/** kit.js line 35, `body`: 8 above. Line 38, `foot`: 12 above its buttons, 34 below (the home indicator), 10 between them. */
const frameMetrics = { top: space.sm, bottom: 40, footTop: 12, footBottom: 34, footGap: 10 } as const;

export type ProFrameProps = {
  /** The bar's title; omitted for P7, which draws none. */
  title?: string;
  onBack?: () => void;
  /** The gap between the screen's parts (P5 and P6 16, P8 12). */
  gap: number;
  /** Buttons held at the foot, above the home indicator. */
  foot?: ReactNode;
  /** Centres the body in the space the bar and the foot leave (P7, P10). */
  centered?: boolean;
  /** Space above the body where a screen draws its own (P7's `pt: 120`); the kit's 8 otherwise. */
  top?: number;
  children: ReactNode;
  testID?: string;
};

/**
 * The frame P5 to P10 share: safe areas, the bar (back, centred title), content that scrolls and rides above the
 * keyboard, and the foot that holds Continue, Send for review or Done. No shared frame has a foot yet
 * (SHARED-CHANGES.md, PROS-03).
 */
export function ProFrame({ title, onBack, gap, foot, centered, top, children, testID }: ProFrameProps) {
  const { colors } = useWawu();
  const insets = useSafeAreaInsets();
  const showBar = Boolean(title || onBack);
  return (
    <KeyboardAvoidingView testID={testID} behavior="padding" style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: insets.top }]}>
      {showBar ? (
        <View style={styles.nav}>
          <View style={styles.side}>{onBack ? <IconButton icon="ChevronLeft" label="Back" onPress={onBack} testID="pro-back" /> : null}</View>
          <Text variant="body" numberOfLines={2} accessibilityRole="header" style={[styles.title, { fontSize: navMetrics.title, letterSpacing: navMetrics.titleTracking * navMetrics.title }]}>
            {title}
          </Text>
          <View style={styles.side} />
        </View>
      ) : null}
      <ScrollView
        style={styles.scroll}
        testID="pro-scroll"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          centered && styles.centered,
          { gap, paddingTop: top ?? frameMetrics.top, paddingBottom: (foot ? 0 : insets.bottom) + frameMetrics.bottom, paddingLeft: layout.gutter + insets.left, paddingRight: layout.gutter + insets.right },
        ]}
      >
        {children}
      </ScrollView>
      {foot ? (
        <View style={[styles.foot, { paddingBottom: Math.max(insets.bottom, frameMetrics.footBottom), paddingLeft: layout.gutter + insets.left, paddingRight: layout.gutter + insets.right }]}>{foot}</View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  nav: { minHeight: navMetrics.height, flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: layout.gutter },
  side: { width: navMetrics.button },
  title: { ...font(700), flex: 1, textAlign: 'center' },
  scroll: { flex: 1 },
  content: { flexGrow: 1 },
  centered: { justifyContent: 'center' },
  foot: { paddingTop: frameMetrics.footTop, gap: frameMetrics.footGap },
});
