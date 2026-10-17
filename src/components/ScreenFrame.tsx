import type { ReactNode, RefObject } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { font, layout, space, useWawu } from '@/theme';

import { IconButton } from './Button';
import { useFocusRing } from './focusRing';
import { Text } from './Text';

/** design/_gen/kit.js line 34, `nav`: a 56 px bar, 20 px sides, 12 gap, a 42 px round button, a 17 px bold title, and `right` a 42 px slot. */
const navMetrics = { height: 56, button: 42, title: 17, titleTracking: -0.02, action: 15 } as const;
/** design/_gen/kit.js line 35, `body`: 8 above, 40 below (settings.js and me.js set `pb: 40` on these screens). */
const bodyMetrics = { top: space.sm, bottom: 40 } as const;

export type ScreenFrameAction = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  /** The request is on its way: the label is replaced by a spinner. */
  loading?: boolean;
  testID?: string;
};

export type ScreenFrameProps = {
  title: string;
  onBack?: () => void;
  /** The bar's right-hand word in the accent colour: "Save" on M8, "Done" on M9 (kit.js `nav` with `right`). */
  action?: ScreenFrameAction;
  /** The gap between the screen's parts. */
  gap: number;
  /** The start of the test ids the frame names: `<idPrefix>-back`, `<idPrefix>-scroll` and `<idPrefix>-action-spinner`. */
  idPrefix: string;
  /** The content rides above the keyboard (screens with fields). */
  keyboard?: boolean;
  /** Cut the title to this many lines (the default lets it wrap, so a large font never cuts it). */
  titleLines?: number;
  scrollRef?: RefObject<ScrollView | null>;
  children: ReactNode;
  testID?: string;
};

/**
 * The frame the screens with a bar share (Z2 to Z5, Z9 to Z11, M8, M9, the password screen): safe areas, the bar
 * (a round back button, the title centred, optionally a word on the right) and scrolling content that keeps clear
 * of the phone's edges.
 */
export function ScreenFrame({ title, onBack, action, gap, idPrefix, keyboard, titleLines, scrollRef, children, testID }: ScreenFrameProps) {
  const { colors } = useWawu();
  const insets = useSafeAreaInsets();
  const ring = useFocusRing();
  const tone = action?.disabled || action?.loading ? colors.textDisabled : colors.accentFg;
  const Root = keyboard ? KeyboardAvoidingView : View;
  return (
    <Root
      testID={testID}
      {...(keyboard ? { behavior: 'padding' as const } : {})}
      style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: insets.top }]}
    >
      <View style={styles.nav}>
        <View style={styles.side}>{onBack ? <IconButton icon="ChevronLeft" label="Back" onPress={onBack} testID={`${idPrefix}-back`} /> : null}</View>
        <Text
          variant="body"
          numberOfLines={titleLines}
          accessibilityRole="header"
          style={[styles.title, { fontSize: navMetrics.title, letterSpacing: navMetrics.titleTracking * navMetrics.title }]}
        >
          {title}
        </Text>
        <View style={[styles.side, styles.actionSide]}>
          {action ? (
            <Pressable
              testID={action.testID}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              accessibilityState={{ disabled: Boolean(action.disabled), busy: Boolean(action.loading) }}
              disabled={action.disabled || action.loading}
              onPress={action.onPress}
              hitSlop={space.sm}
              {...ring.handlers}
              style={[styles.action, ring.style]}
            >
              {action.loading ? (
                <ActivityIndicator testID={`${idPrefix}-action-spinner`} size="small" color={colors.textMuted} />
              ) : (
                <Text variant="body" style={[font(700), { fontSize: navMetrics.action, color: tone }]}>
                  {action.label}
                </Text>
              )}
            </Pressable>
          ) : null}
        </View>
      </View>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        testID={`${idPrefix}-scroll`}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          { gap, paddingBottom: Math.max(insets.bottom, 0) + bodyMetrics.bottom, paddingLeft: layout.gutter + insets.left, paddingRight: layout.gutter + insets.right },
        ]}
      >
        {children}
      </ScrollView>
    </Root>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  nav: { minHeight: navMetrics.height, flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: layout.gutter },
  side: { width: navMetrics.button },
  actionSide: { alignItems: 'flex-end', justifyContent: 'center' },
  title: { ...font(700), flex: 1, textAlign: 'center' },
  action: { minHeight: layout.tapMin, minWidth: navMetrics.button, alignItems: 'flex-end', justifyContent: 'center' },
  scroll: { flex: 1 },
  content: { flexGrow: 1, paddingTop: bodyMetrics.top },
});
