import { Platform, useWindowDimensions } from 'react-native';

import { layout } from '@/theme';

/** R-127, Phase 1: on a browser window wider than this the app is drawn in one phone-width column. A phone browser is narrower and is never framed. */
export const FRAME_FROM = 600;

/** The column's width: a phone's (390). */
export const FRAME_WIDTH = layout.screenW;

/** True when the app runs in a browser window wide enough to be framed. `os` is the platform (a test passes one). */
export function isFramed(windowWidth: number, os: string = Platform.OS): boolean {
  return os === 'web' && windowWidth > FRAME_FROM;
}

/** The width the app has to size to: the column in a framed browser window, the window everywhere else (so on a phone nothing changes). */
export function frameWidthFor(windowWidth: number, os: string = Platform.OS): number {
  return isFramed(windowWidth, os) ? FRAME_WIDTH : windowWidth;
}

/**
 * The width a screen sizes to. Use it where `useWindowDimensions().width` was read: inside the frame the window is
 * 1440 wide but the app is 390, so a slider or a photo stage sized from the window would be far too wide. It follows
 * the window as it is resized, with no reload.
 */
export function useFrameWidth(): number {
  const { width } = useWindowDimensions();
  return frameWidthFor(width);
}

/** True while the app is drawn in the column (a browser window wider than a phone). */
export function useIsFramed(): boolean {
  const { width } = useWindowDimensions();
  return isFramed(width);
}
