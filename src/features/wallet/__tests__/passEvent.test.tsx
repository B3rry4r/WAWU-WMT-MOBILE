import * as rtl from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { POINTS_TILE } from '../home/PointsTile';
import { PassCard } from '../pass/PassCard';
import { PassesTile } from '../pass/PassesTile';

/**
 * FIX-110 (G-814): W44's event name above the pass's name and its QR code beside the date, and W1's Passes card naming the event.
 * Each is the Hub's (`eventPass.eventName`, `passCode`) and is drawn only when the Hub sends it.
 */
const pass = { name: 'Maker Pass', tierName: 'Founding Maker', eventDate: null, eventName: null, code: null };

describe('W44 · the pass card', () => {
  it('draws the Hub\'s event name over the pass name and a QR that carries the Hub\'s code', async () => {
    await rtl.render(<PassCard pass={{ ...pass, eventName: 'Christmas event', code: 'b3d1c0de-0000-4000-8000-00000000abcd' }} />);
    expect(rtl.screen.getByTestId('pass-event')).toHaveTextContent('Christmas event');
    expect(rtl.screen.getByTestId('pass-name')).toHaveTextContent('Maker Pass');
    expect(rtl.screen.getByTestId('pass-qr-plate')).toBeTruthy();
    expect(rtl.screen.getByLabelText('Pass QR code')).toBeTruthy();
    // The date line is still there beside the plate.
    expect(rtl.screen.getByTestId('pass-date')).toHaveTextContent('Date to be announced');
  });

  it('draws neither while the Hub has sent neither (R-47)', async () => {
    await rtl.render(<PassCard pass={pass} />);
    expect(rtl.screen.queryByTestId('pass-event')).toBeNull();
    expect(rtl.screen.queryByTestId('pass-qr-plate')).toBeNull();
    expect(rtl.screen.queryByLabelText('Pass QR code')).toBeNull();
  });

  it('draws the code alone when there is no event name, and the name alone when there is no code', async () => {
    await rtl.render(<PassCard pass={{ ...pass, code: 'abc' }} />);
    expect(rtl.screen.getByTestId('pass-qr-plate')).toBeTruthy();
    expect(rtl.screen.queryByTestId('pass-event')).toBeNull();
    await rtl.cleanup();
    await rtl.render(<PassCard pass={{ ...pass, eventName: 'Christmas event' }} />);
    expect(rtl.screen.getByTestId('pass-event')).toBeTruthy();
    expect(rtl.screen.queryByTestId('pass-qr-plate')).toBeNull();
  });
});

describe('W1 · the Passes card', () => {
  it('names the event under the pass name when the Hub names it, else the date', async () => {
    await rtl.render(<PassesTile pass={{ name: 'Maker Pass', eventDate: '2026-12-20', eventName: 'Christmas event' }} onPress={() => undefined} />);
    expect(rtl.screen.getByTestId('wallet-passes-when')).toHaveTextContent('Christmas event');
    await rtl.cleanup();
    await rtl.render(<PassesTile pass={{ name: 'Maker Pass', eventDate: '2026-12-20', eventName: null }} onPress={() => undefined} />);
    expect(rtl.screen.getByTestId('wallet-passes-when')).toHaveTextContent('Sun 20 Dec 2026');
  });

  it('with no pass it is the empty card in the same place: Passes, No pass yet, With Founding Maker, and a tap calls what it was given (R-97)', async () => {
    const onPress = jest.fn();
    await rtl.render(<PassesTile pass={null} onPress={onPress} />);
    expect(rtl.screen.getByText('Passes')).toBeTruthy();
    expect(rtl.screen.getByTestId('wallet-passes-name')).toHaveTextContent('No pass yet');
    expect(rtl.screen.getByTestId('wallet-passes-when')).toHaveTextContent('With Founding Maker');
    expect(rtl.screen.getByLabelText('Passes, No pass yet, With Founding Maker')).toBeTruthy();
    rtl.fireEvent.press(rtl.screen.getByTestId('wallet-passes'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('the empty card title is the same size as the Points card count and a pass name (18), on one line (SWEEP-1026 row 9)', async () => {
    const size = () => (StyleSheet.flatten(rtl.screen.getByTestId('wallet-passes-name').props.style) as { fontSize: number }).fontSize;
    await rtl.render(<PassesTile pass={null} onPress={() => undefined} />);
    const empty = size();
    expect(rtl.screen.getByTestId('wallet-passes-name').props.numberOfLines).toBe(1);
    expect(rtl.screen.getByTestId('wallet-passes-when').props.numberOfLines).toBe(1);
    await rtl.cleanup();
    await rtl.render(<PassesTile pass={{ name: 'Maker Pass', eventDate: '2026-12-20', eventName: null }} onPress={() => undefined} />);
    expect(size()).toBe(empty);
    expect(empty).toBe(18);
    expect(POINTS_TILE.sub).toBe(12);
  });
});
