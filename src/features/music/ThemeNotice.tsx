import { Toast } from '@/components/Toast';

import { clearThemeNotice, useThemeMusic } from './themeMusic';

/**
 * The line said when the theme song could not be downloaded (R-99), as a toast. The button above Create and Settings' Music row both start
 * the download, and Settings sits above the tabs where the button lives, so each draws this where it is: whichever screen is on top is the
 * one the person sees. `offset` is how far the toast stands from the bottom edge (a screen with the tab bar clears it, one without adds its safe area).
 */
export function ThemeNotice({ offset }: { offset: number }) {
  const music = useThemeMusic();
  return <Toast message={music.notice} tone="alert" placement="bottom" offset={offset} lines={2} duration={6000} onHide={clearThemeNotice} testID="music-notice" />;
}
