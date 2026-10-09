import { useWindowDimensions } from 'react-native';

import { layout } from '@/theme';

/**
 * The width a full-width row on the Wallet tab has to use: the window less the gutter on each side (the tab's
 * scroll body pads every block by `layout.gutter`). The bills tiles, the actions and their loading shapes size
 * themselves from this one number, so the three agree at every phone width (COMPLETE-05 round 2, defect 1).
 */
export function useRowRoom(): number {
  const { width } = useWindowDimensions();
  return Math.max(0, width - 2 * layout.gutter);
}
