import { fireEvent, render, screen } from '@testing-library/react-native';

import { CreateButton, createButtonMetrics } from '@/components/CreateButton';
import { layout } from '@/theme';

const flat = (style: unknown): Record<string, unknown> => Object.assign({}, ...[style].flat(Infinity).filter(Boolean));

/**
 * No screen draws the Create button today (R-47): ME-04 builds the screen it opens and draws the button over Explore.
 * Until then it is a component that only does what it is handed, so it is pinned here.
 */
describe('the Create button (kit Fab), held for ME-04', () => {
  it('opens what it is handed, and only that', async () => {
    const onPress = jest.fn();
    await render(<CreateButton onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Create' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('is a 58 accent circle standing 18 from the right and 16 above the tab bar, as the canvas has it', async () => {
    await render(<CreateButton onPress={() => undefined} />);
    expect(flat(screen.getByTestId('explore-create').props.style)).toMatchObject({
      position: 'absolute',
      right: 18,
      bottom: 106 - layout.tabbarH,
      width: 58,
      height: 58,
      borderRadius: 29,
    });
    expect(createButtonMetrics.bottom).toBe(16);
  });
});
