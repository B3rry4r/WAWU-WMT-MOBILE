import type { ReactNode } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/Button';
import type { IconName } from '@/components/icon';
import { Text } from '@/components/Text';
import { font, layout, space, useWawu } from '@/theme';

/** design/_gen/kit.js line 34, `nav`: a 56 px bar, 20 px sides, 12 gap, a 42 px round button, a 17 px bold title, a 42 px slot on the right. */
const navMetrics = { height: 56, button: 42, title: 17, titleTracking: -0.02 } as const;
/** kit.js line 35, `body`: 8 above. Line 38, `foot`: 12 above its button, 34 below (the home indicator). */
const frameMetrics = { top: space.sm, bottom: 40, footTop: 12, footBottom: 34 } as const;

export type PointsFrameAction = { icon: IconName; label: string; onPress: () => void; testID?: string };

export type PointsFrameProps = {
  title: string;
  onBack?: () => void;
  /** The round button on the bar's right (PT5's "Convert to cash"). */
  action?: PointsFrameAction;
  /** The gap between the screen's parts (PT5 and PT6 draw 14). */
  gap: number;
  /** The button held at the foot, above the home indicator (PT6's Convert, PT6b's Done). */
  foot?: ReactNode;
  /** Centres the body in the space the bar and the foot leave (PT5a's empty view, PT6b). */
  centered?: boolean;
  children: ReactNode;
  testID?: string;
};

/**
 * The frame PT5 and PT6 share: safe areas, the bar (a round back button, the centred title, and a round button on the right when
 * the board draws one), content that scrolls and rides above the keyboard, and the foot that holds Convert or Done. The shared
 * `ScreenFrame` has no round button on the right and no foot (SHARED-CHANGES.md, POINTS-05 #1), so this one draws them, as
 * `ProFrame` does; it goes when `ScreenFrame` takes both.
 */
export function PointsFrame({ title, onBack, action, gap, foot, centered, children, testID }: PointsFrameProps) {
  const { colors } = useWawu();
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView testID={testID} behavior="padding" style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: insets.top }]}>
      <View style={styles.nav}>
        <View style={styles.side}>{onBack ? <IconButton icon="ChevronLeft" label="Back" onPress={onBack} testID="points-back" /> : null}</View>
        <Text variant="body" numberOfLines={2} accessibilityRole="header" style={[styles.title, { fontSize: navMetrics.title, letterSpacing: navMetrics.titleTracking * navMetrics.title }]}>
          {title}
        </Text>
        <View style={styles.side}>{action ? <IconButton icon={action.icon} label={action.label} onPress={action.onPress} testID={action.testID} /> : null}</View>
      </View>
      <ScrollView
        style={styles.scroll}
        testID="points-scroll"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          centered && styles.centered,
          { gap, paddingTop: frameMetrics.top, paddingBottom: (foot ? 0 : insets.bottom) + frameMetrics.bottom, paddingLeft: layout.gutter + insets.left, paddingRight: layout.gutter + insets.right },
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
  foot: { paddingTop: frameMetrics.footTop },
});
