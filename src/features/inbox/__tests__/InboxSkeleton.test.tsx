import * as rtl from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { InboxSkeleton } from '../InboxSkeleton';

/*
 * jest has no layout engine, so this pins the style rules that make the row fit; the measured result at
 * 320, 390 and 430 px (no bar past its column, none under the time) is in the builder report's addendum.
 */
const style = (testID: string) => StyleSheet.flatten(rtl.screen.getByTestId(testID).props.style) as Record<string, unknown>;

describe('the loading list (I36)', () => {
  it('draws six rows with the artboard\'s sizes: a 52 circle, 140 and 210 bars, a 36 time', async () => {
    await rtl.render(<InboxSkeleton />);
    expect(rtl.screen.getAllByTestId(/^inbox-skeleton-lines-/)).toHaveLength(6);
    expect(style('inbox-skeleton-name-0')).toMatchObject({ width: 140, height: 14 });
    expect(style('inbox-skeleton-preview-0')).toMatchObject({ width: 210, height: 12 });
    expect(style('inbox-skeleton-time-0')).toMatchObject({ width: 36, height: 12 });
  });

  it('on a narrow phone the bars shrink with the row instead of running under the time', async () => {
    await rtl.render(<InboxSkeleton />);
    for (const bar of ['inbox-skeleton-name-0', 'inbox-skeleton-preview-0']) {
      expect(style(bar).maxWidth).toBe('100%');
      expect(style(bar).flexShrink).toBe(0);
    }
    const lines = style('inbox-skeleton-lines-0');
    expect(lines.flex).toBe(1);
    expect(lines.minWidth).toBe(0);
    expect(style('inbox-skeleton-time-0').flexShrink).toBe(0);
  });
});
