import { useEffect, useRef, type ReactNode } from 'react';
import { BackHandler, Platform, StyleSheet, View } from 'react-native';

import { Button, IconButton } from '@/components/Button';
import { Text } from '@/components/Text';
import { canvasNormalLineHeight, font, layout, space } from '@/theme';

/** design/_gen/kit.js line 34, `nav`: a 56 bar, 20 at the sides, 12 between, a 42 round back button, a 17 bold title at -0.02em, a 42 slot on the right. */
export const navMetrics = { height: 56, button: 42, title: 17, titleTracking: -0.02 } as const;

/** P1 to P4's bar: back and the centred title. */
export function ProsNav({ title, onBack, right }: { title: string; onBack: () => void; right?: ReactNode }) {
  return (
    <View style={styles.nav}>
      <View style={styles.side}>
        <IconButton icon="ChevronLeft" label="Back" onPress={onBack} testID="pros-back" />
      </View>
      <Text variant="body" numberOfLines={1} accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      <View style={styles.side}>{right}</View>
    </View>
  );
}

/**
 * A refresh failed while the screen still shows what it read before: say so in one line, keep what is shown, and offer
 * to ask again.
 */
export function RefreshFailed({ onRetry, testID }: { onRetry: () => void; testID?: string }) {
  return (
    <View testID={testID} style={styles.refresh} accessibilityLiveRegion="polite">
      <Text variant="meta" tone="textSecondary" accessibilityRole="alert" style={styles.refreshText}>
        Could not check for updates.
      </Text>
      <Button label="Try again" variant="secondary" size="sm" icon="RotateCw" onPress={onRetry} testID={testID ? `${testID}-retry` : undefined} />
    </View>
  );
}

/**
 * Android's back button does what the on-screen back does (the route's `onBack`: back a step, or to the screen this one
 * opens from when it was opened on its own). The browser's back walks the history the router keeps, which is the same
 * step.
 */
export function useSystemBack(onBack: () => void): void {
  const handler = useRef(onBack);
  useEffect(() => {
    handler.current = onBack;
  });
  useEffect(() => {
    if (Platform.OS === 'web') return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handler.current();
      return true;
    });
    return () => sub.remove();
  }, []);
}

const styles = StyleSheet.create({
  nav: { minHeight: navMetrics.height, flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: layout.gutter },
  side: { width: navMetrics.button },
  title: { ...font(700), flex: 1, textAlign: 'center', fontSize: navMetrics.title, lineHeight: canvasNormalLineHeight(navMetrics.title), letterSpacing: navMetrics.titleTracking * navMetrics.title },
  refresh: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  refreshText: { flex: 1 },
});
