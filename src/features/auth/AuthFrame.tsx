import type { ReactNode, RefObject } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/Button';
import { Text } from '@/components/Text';
import { font, layout, space, useWawu } from '@/theme';

/** design/_gen/kit.js line 34, `nav`: a 56 px bar, 20 px sides, 12 gap, a 42 px round button, a 17 px bold title. */
const navMetrics = { height: 56, button: 42, title: 17, titleTracking: -0.02 } as const;
/** design/_gen/kit.js line 38, `foot`: 12 px above the buttons, 10 between them. */
const footGap = 10;

export type AuthFrameProps = {
  /** From `useFieldScroll`: lets a focused field scroll itself into view. */
  scrollRef?: RefObject<ScrollView | null>;
  /** The bar's centred title ("Reset password"). Without it the bar holds only the back button. */
  navTitle?: string;
  /** Shows the round back button. Left off when there is nowhere to go back to. */
  onBack?: () => void;
  /** No bar at all (A24 has none). */
  bare?: boolean;
  /** Pinned under the content, above the keyboard: the screen's buttons. */
  footer: ReactNode;
  children: ReactNode;
  /** Space above the content, where a screen sits lower than the form screens (A24). */
  contentTop?: number;
  testID?: string;
};

/**
 * The frame every signed-out screen shares: safe areas, the back bar, scrolling
 * content and a pinned footer that rides above the keyboard.
 *
 * Android 15 and SDK 57 draw the app edge to edge, so the phone no longer
 * resizes the window for the keyboard: the app's own `KeyboardAvoidingView`
 * pads the bottom by the part of the keyboard that covers it (react-native
 * `KeyboardAvoidingView`; the Expo config reference says to use it in this
 * case). Where the window is resized anyway nothing overlaps and it adds
 * nothing; the web has no keyboard events, the browser shrinks the viewport.
 */
export function AuthFrame({ navTitle, onBack, bare, footer, children, contentTop, scrollRef, testID }: AuthFrameProps) {
  const { colors } = useWawu();
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView
      testID={testID}
      behavior="padding"
      style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: insets.top }]}
    >
      {bare ? null : (
        <View style={styles.nav}>
          <View style={styles.side}>{onBack ? <IconButton icon="ChevronLeft" label="Back" onPress={onBack} testID="auth-back" /> : null}</View>
          <Text variant="body" numberOfLines={1} style={[styles.navTitle, { fontSize: navMetrics.title, letterSpacing: navMetrics.titleTracking * navMetrics.title }]}>
            {navTitle ?? ''}
          </Text>
          <View style={styles.side} />
        </View>
      )}
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, contentTop !== undefined && { paddingTop: contentTop }]}
      >
        {children}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>{footer}</View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  nav: { height: navMetrics.height, flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: layout.gutter },
  side: { width: navMetrics.button },
  navTitle: { ...font(700), flex: 1, textAlign: 'center' },
  scroll: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: layout.gutter, paddingTop: space.sm, paddingBottom: space.lg },
  footer: { paddingTop: space.md, paddingHorizontal: layout.gutter, gap: footGap },
});
