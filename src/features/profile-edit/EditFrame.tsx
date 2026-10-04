import type { ReactNode, RefObject } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/Button';
import { useFocusRing } from '@/components/focusRing';
import { Text } from '@/components/Text';
import { font, layout, space, useWawu } from '@/theme';

/** design/_gen/kit.js line 34, `nav`: a 56 px bar, 20 px sides, 12 gap, a 42 px round button, a 17 px bold title, and `right` a 42 px slot. */
const navMetrics = { height: 56, button: 42, title: 17, titleTracking: -0.02, action: 15 } as const;
/** design/_gen/kit.js line 35, `body`: 8 above, 40 below, 14 between (M8) or 12 (M9). */
const bodyMetrics = { top: space.sm, bottom: 40 } as const;

export type EditAction = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  /** The request is on its way: the label is replaced by a spinner. */
  loading?: boolean;
  testID?: string;
};

export type EditFrameProps = {
  title: string;
  onBack?: () => void;
  /** The bar's right-hand word: "Save" on M8, "Done" on M9. */
  action?: EditAction;
  scrollRef?: RefObject<ScrollView | null>;
  /** The gap between the screen's parts (M8 14, M9 12). */
  gap: number;
  children: ReactNode;
  testID?: string;
};

/**
 * The frame M8 and M9 share: safe areas, the bar (back, title, a word on the
 * right in the accent colour) and scrolling content that rides above the
 * keyboard. The auth frame has no right-hand slot, so these two screens carry
 * their own bar until a shared screen frame has one (SHARED-CHANGES.md, ME-06).
 */
export function EditFrame({ title, onBack, action, scrollRef, gap, children, testID }: EditFrameProps) {
  const { colors } = useWawu();
  const insets = useSafeAreaInsets();
  const ring = useFocusRing();
  const tone = action?.disabled || action?.loading ? colors.textDisabled : colors.accentFg;
  return (
    <KeyboardAvoidingView testID={testID} behavior="padding" style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: insets.top }]}>
      <View style={styles.nav}>
        <View style={styles.side}>{onBack ? <IconButton icon="ChevronLeft" label="Back" onPress={onBack} testID="edit-back" /> : null}</View>
        <Text variant="body" numberOfLines={1} accessibilityRole="header" style={[styles.title, { fontSize: navMetrics.title, letterSpacing: navMetrics.titleTracking * navMetrics.title }]}>
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
                <ActivityIndicator testID="edit-action-spinner" size="small" color={colors.textMuted} />
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
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { gap, paddingBottom: Math.max(insets.bottom, 0) + bodyMetrics.bottom }]}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  nav: { height: navMetrics.height, flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: layout.gutter },
  side: { width: navMetrics.button },
  actionSide: { alignItems: 'flex-end', justifyContent: 'center' },
  title: { ...font(700), flex: 1, textAlign: 'center' },
  action: { minHeight: layout.tapMin, minWidth: navMetrics.button, alignItems: 'flex-end', justifyContent: 'center' },
  scroll: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: layout.gutter, paddingTop: bodyMetrics.top },
});
