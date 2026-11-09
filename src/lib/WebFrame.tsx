import { useEffect, type ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { useWawu } from '@/theme';

import { captureLandingPath, useReturnAfterSignIn } from './returnPath';
import { ShareNote } from './shareNote';
import { FRAME_WIDTH, useIsFramed } from './useFrameWidth';

// The address the browser opened on is read before the router moves a signed-out visitor to the welcome screen (WEBAPP-03).
captureLandingPath();

type WebFrameProps = {
  children: ReactNode;
  /** The app's own frame, drawn once by the root layout: it also carries the share note and the return to a link after sign-in. */
  root?: boolean;
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
export function WebFrame({ children, root = false, fill = true, testID = 'web-frame' }: WebFrameProps) {
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
  if (!framed) {
    return (
      <>
        {children}
        {root ? <RootExtras /> : null}
      </>
    );
  }
  return (
    <View testID={testID} style={[styles.outer, fill ? { backgroundColor: colors.surfacePage } : null]} pointerEvents="box-none">
      <View
        testID={`${testID}-column`}
        style={[styles.column, fill ? { backgroundColor: colors.surfacePage } : null]}
        pointerEvents="box-none"
      >
        {children}
      </View>
      {root ? <RootExtras /> : null}
    </View>
  );
}

/** What only the app's own frame carries (not a modal's): the share note, and the return to a link opened while signed out. */
function RootExtras() {
  useReturnAfterSignIn();
  return <ShareNote />;
}

const styles = StyleSheet.create({
  outer: { flex: 1, alignItems: 'center' },
  column: { flex: 1, width: '100%', maxWidth: FRAME_WIDTH, overflow: 'hidden' },
});
