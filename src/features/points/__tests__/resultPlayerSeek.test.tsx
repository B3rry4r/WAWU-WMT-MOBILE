import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { ResultPlayer } from '../ResultPlayer';

/*
 * A long audio, an audiobook, can be sought (POINTS-18): a tap on the wave moves the sound to that place, and a screen reader's increase and
 * decrease step a tenth of it. The sound itself is the shared audio source, replaced here by one the test drives.
 */
const mockSource: { props: { playing: boolean; seek: { to: number; at: number } | null; onTime: (at: number, total: number) => void } | null } = { props: null };
jest.mock('@/features/feed/player', () => ({
  AudioSource: (props: NonNullable<typeof mockSource.props>) => {
    mockSource.props = props;
    return null;
  },
}));

describe('the result player seeks', () => {
  it('a person taps the middle of a 1 hour audio and the sound moves to 30 minutes; a screen reader steps a tenth', async () => {
    await render(<ResultPlayer testID="p" uri="https://f.test/book.mp3" name="Audiobook" />);
    await act(async () => mockSource.props?.onTime(0, 3600));
    const wave = screen.getByTestId('p-wave');
    await fireEvent(wave, 'layout', { nativeEvent: { layout: { width: 200, height: 24, x: 0, y: 0 } } });
    await fireEvent.press(wave, { nativeEvent: { locationX: 100 } });
    expect(mockSource.props?.seek?.to).toBe(1800);
    await fireEvent(wave, 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });
    expect(mockSource.props?.seek?.to).toBe(2160);
    await fireEvent(wave, 'accessibilityAction', { nativeEvent: { actionName: 'decrement' } });
    expect(mockSource.props?.seek?.to).toBe(1800);
  });

  it('does nothing before the length is known', async () => {
    await render(<ResultPlayer testID="p" uri="https://f.test/book.mp3" name="Audiobook" />);
    await fireEvent.press(screen.getByTestId('p-wave'), { nativeEvent: { locationX: 10 } });
    expect(mockSource.props?.seek ?? null).toBeNull();
  });
});
