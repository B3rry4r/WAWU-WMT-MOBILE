import { useEffect, type ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { useWawu } from '@/theme';

import { FRAME_WIDTH, useIsFramed } from './useFrameWidth';

type WebFrameProps = {
  children: ReactNode;
  /** Paint the area around the column. Off for a transparent overlay (a sheet over the app), where the app shows through. */
  fill?: boolean;
  testID?: string;
};

/**
 * R-127, Phase 1: on a browser window wider than a phone, the app sits in one phone-width column in the middle of the
 * page, on the app's own background, so nothing stretches. On a phone, or on any window as narrow as a phone, this draws
 * its children as they were (no wrapper at all). Set in one place: the root layout, and `FrameModal` for what the browser
 * lifts out of the page (sheets and full-screen viewers).
 */
export function WebFrame({ children, fill = true, testID = 'web-frame' }: WebFrameProps) {
  const { colors } = useWawu();
  const framed = useIsFramed();
  useEffect(() => {
    // The page behind the root view (the browser's own overscroll and the area beside the column) follows the theme too.
    if (Platform.OS !== 'web' || typeof document === 'undefined' || !fill) return undefined;
    const previous = document.body.style.backgroundColor;
    document.body.style.backgroundColor = colors.surfacePage;
    return () => {
      document.body.style.backgroundColor = previous;
    };
  }, [colors.surfacePage, fill]);
  if (!framed) return <>{children}</>;
  return (
    <View testID={testID} style={[styles.outer, fill ? { backgroundColor: colors.surfacePage } : null]} pointerEvents="box-none">
      <View
        testID={`${testID}-column`}
        style={[styles.column, { borderColor: colors.borderHairline }, fill ? { backgroundColor: colors.surfacePage } : null]}
        pointerEvents="box-none"
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, alignItems: 'center' },
  column: { flex: 1, width: '100%', maxWidth: FRAME_WIDTH, overflow: 'hidden', borderLeftWidth: StyleSheet.hairlineWidth, borderRightWidth: StyleSheet.hairlineWidth },
});
