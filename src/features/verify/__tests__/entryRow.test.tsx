import { render, screen, userEvent } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { ListRow, rowMetrics } from '@/components/ListRow';

import { EntryRow } from '../voiceParts';

const flat = (style: unknown) => StyleSheet.flatten(style as never) as Record<string, number>;

/** SWEEP-VOICE A2: the Voice entries (VF2's "Hear your name", Me's Voice Intro prompt) are the shared ListRow in a card, not a row of their own. */
describe('EntryRow is a ListRow', () => {
  it('draws the kit row (64 high at least, the kit title and line) with the entry room above and below', async () => {
    const onPress = jest.fn();
    await render(<EntryRow testID="entry" icon="AudioLines" title="Hear your name" line="Free · how buyers will hear it" onPress={onPress} />);
    const row = flat(screen.getByTestId('entry').props.style);
    expect(row.minHeight).toBe(rowMetrics.minHeight);
    expect(row.paddingVertical).toBe(14);
    expect(flat(screen.getByText('Hear your name').props.style).fontSize).toBe(rowMetrics.title);
    expect(flat(screen.getByText('Free · how buyers will hear it').props.style).fontSize).toBe(rowMetrics.subtitle);
    await userEvent.press(screen.getByRole('button', { name: 'Hear your name. Free · how buyers will hear it' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('leaves every other ListRow as it was: the kit room unless a row asks for more', async () => {
    await render(
      <>
        <ListRow title="Plain" testID="plain" />
        <ListRow title="Roomy" padV={14} testID="roomy" onPress={() => undefined} />
      </>,
    );
    expect(flat(screen.getByTestId('plain').props.style).paddingVertical).toBe(rowMetrics.padV);
    expect(flat(screen.getByTestId('roomy').props.style).paddingVertical).toBe(14);
  });
});
