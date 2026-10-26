import type { ReactElement, ReactNode, RefObject } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View, type RefreshControlProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/Button';
import { PoweredByNuvion } from '@/components/PoweredByNuvion';
import { Text } from '@/components/Text';
import { font, layout, space, useWawu } from '@/theme';

/** design/_gen/kit.js line 34, `nav`: a 56 px bar, 20 px sides, 12 gap, a 42 px round button, a 17 px bold title. */
const navMetrics = { height: 56, button: 42, title: 17, titleTracking: -0.02, step: 12.5 } as const;
/** design/_gen/kit.js line 38, `foot`: 12 px above the buttons, 10 between them. */
const footGap = 10;

export type AuthFrameProps = {
  /** From `useFieldScroll`: lets a focused field scroll itself into view. */
  scrollRef?: RefObject<ScrollView | null>;
  /** The bar's centred title ("Reset password"). Without it the bar holds only the back button. */
  navTitle?: string;
  /** Shows the round back button. Left off when there is nowhere to go back to. */
  onBack?: () => void;
  /** The step in the bar's right corner, "1 of 4" (kit.js `stepL`: 12.5 px, 600, muted). Left out, the corner is empty. */
  navStep?: string;
  /** A button in the bar's right corner instead of the step (A11's Later). Wins over `navStep`. */
  navAction?: ReactNode;
  /** No bar at all (A24 has none). */
  bare?: boolean;
  /** Pinned under the content, above the keyboard: the screen's buttons. A screen with none (A2 until the sign-up screens exist) leaves it out. */
  footer?: ReactNode;
  /** A pull-to-refresh for the content (BILLS-01 round 3, SHARED-CHANGES BILLS-01 #4). Left out, the content does not pull. */
  refreshControl?: ReactElement<RefreshControlProps>;
  children: ReactNode;
  /** Space above the content, where a screen sits lower than the form screens (A24). */
  contentTop?: number;
  /** The money screens of Open your wallet: "Powered by Nuvion" at the foot of the content, once (R-95). Left off, nothing is added. */
  poweredBy?: boolean;
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
export function AuthFrame({ navTitle, navStep, navAction, onBack, bare, footer, children, contentTop, scrollRef, refreshControl, poweredBy, testID }: AuthFrameProps) {
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
          <View style={styles.side}>
            {navAction ?? (navStep ? (
              <Text variant="meta" tone="textMuted" accessibilityLabel={`Step ${navStep}`} testID="auth-step" style={[font(600), styles.step]}>
                {navStep}
              </Text>
            ) : null)}
          </View>
        </View>
      )}
      <ScrollView
        ref={scrollRef}
        testID={testID ? `${testID}-scroll` : undefined}
        style={styles.scroll}
        keyboardShouldPersistTaps="handled"
        refreshControl={refreshControl}
        contentContainerStyle={[styles.content, contentTop !== undefined && { paddingTop: contentTop }]}
      >
        {children}
        {poweredBy ? <PoweredByNuvion style={styles.powered} /> : null}
      </ScrollView>
      {footer ? <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>{footer}</View> : <View style={{ height: Math.max(insets.bottom, space.lg) }} />}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  nav: { height: navMetrics.height, flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: layout.gutter },
  side: { width: navMetrics.button },
  navTitle: { ...font(700), flex: 1, textAlign: 'center' },
  step: { fontSize: navMetrics.step, textAlign: 'right' },
  scroll: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: layout.gutter, paddingTop: space.sm, paddingBottom: space.lg },
  powered: { marginTop: space.lg },
  footer: { paddingTop: space.md, paddingHorizontal: layout.gutter, gap: footGap },
});
