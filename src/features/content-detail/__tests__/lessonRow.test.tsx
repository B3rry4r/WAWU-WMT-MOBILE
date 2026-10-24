import * as rtl from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { LessonList } from '../Parts';

/*
 * SWEEP-APP-8 L4 (FIX-107): H25's lessons. The Free pill sat above the row's centre, because the pill's own `alignSelf: flex-start`
 * beats the row's `alignItems: center`. The mark at the end of a row (the pill or the lock) now sits in a box the row centres.
 */
const lessons = [
  { id: 'l1', title: 'Welcome and what you will build', durationLabel: '9:00', isFree: true },
  { id: 'l2', title: 'Pricing without guessing', durationLabel: '14:00', isFree: false },
] as unknown as Parameters<typeof LessonList>[0]['lessons'];

describe('H25: a lesson row', () => {
  it('centres the Free pill and the lock in the row, not at its top', async () => {
    await rtl.render(<LessonList lessons={lessons} />);
    expect(rtl.within(rtl.screen.getByTestId('lesson-l1')).getByText('Free')).toBeTruthy();
    for (const id of ['lesson-l1', 'lesson-l2']) {
      const row = rtl.screen.getByTestId(id);
      // The row's last child is the Free pill or the lock; its own box is what the row centres.
      const end = row.children[row.children.length - 1] as unknown as { props: { style?: unknown } };
      expect((StyleSheet.flatten(end.props.style as never) as { alignSelf?: string } | undefined)?.alignSelf).toBe('center');
    }
  });
});
