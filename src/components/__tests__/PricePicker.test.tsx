import { act, fireEvent, screen, waitFor, within } from '@testing-library/react-native';
import { useState } from 'react';

import { hub, installFetch, renderFrame } from '@/features/create/__helpers__/harness';
import { LIST, servePrices } from '@/features/prices/__helpers__/prices';

// The Hub client takes `fetch` when it is first loaded, so the stand-in goes in before the picker is required.
installFetch();
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PricePicker } = require('@/components/PricePicker') as typeof import('@/components/PricePicker');

/**
 * PRICE-PICKER (R-101): the one picker every price is chosen with. A person can see the Hub's list in order, tap or scroll a price to the
 * middle, jump to a popular one, read what they earn, and (only when the Hub gives a store price) read what a fan pays in the store.
 */
const STEP = 76 + 8;

function Controlled({ start = null, onChange, storeNote, disabled }: { start?: number | null; onChange?: (n: number) => void; storeNote?: boolean; disabled?: boolean }) {
  const [value, setValue] = useState<number | null>(start);
  return (
    <PricePicker
      value={value}
      onChange={(n) => {
        onChange?.(n);
        setValue(n);
      }}
      label="Your price"
      earnSuffix="a sale"
      storeNote={storeNote}
      disabled={disabled}
    />
  );
}

const stops = () => screen.getAllByTestId(/^price-stop-\d+$/).map((s) => Number(String(s.props.testID).replace('price-stop-', '')));
const selected = () => screen.getAllByTestId(/^price-stop-\d+$/).filter((s) => s.props.accessibilityState?.selected).map((s) => Number(String(s.props.testID).replace('price-stop-', '')));
const earnLabel = () => screen.getByTestId('price-picker-earn').props.accessibilityLabel as string;

beforeEach(() => {
  installFetch();
  servePrices();
});

describe('PricePicker · the list', () => {
  it('draws every list price, in the Hub\'s order, and starts on 2,500 when no price is chosen', async () => {
    const onChange = jest.fn();
    await renderFrame(<Controlled onChange={onChange} />);
    expect(await screen.findByTestId('price-stop-2500')).toBeTruthy();
    expect(stops()).toEqual(LIST);
    await waitFor(() => expect(selected()).toEqual([2500]));
    // The screen is told what is drawn, once, so what it sends is what the person sees.
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(2500);
    expect(within(screen.getByTestId('price-picker-price')).getByText('₦2,500')).toBeTruthy();
  });

  it('follows a list the admin changed: only the Hub\'s prices are drawn, in its order', async () => {
    servePrices([300, 1000, 2500, 9000], [1000]);
    await renderFrame(<Controlled start={1000} />);
    expect(await screen.findByTestId('price-stop-9000')).toBeTruthy();
    expect(stops()).toEqual([300, 1000, 2500, 9000]);
    expect(screen.queryByTestId('price-stop-100')).toBeNull();
  });

  it('a user taps a price and it is chosen: the big price and "You earn" follow', async () => {
    const onChange = jest.fn();
    await renderFrame(<Controlled start={2500} onChange={onChange} />);
    await fireEvent.press(await screen.findByTestId('price-stop-7500'));
    expect(onChange).toHaveBeenLastCalledWith(7500);
    expect(selected()).toEqual([7500]);
    expect(within(screen.getByTestId('price-picker-price')).getByText('₦7,500')).toBeTruthy();
    expect(earnLabel()).toBe('You earn 6,375 naira a sale');
  });

  it('a user scrolls the strip and the price in the middle is chosen, snapped to its stop', async () => {
    const onChange = jest.fn();
    await renderFrame(<Controlled start={2500} onChange={onChange} />);
    const scroll = await screen.findByTestId('price-picker-scroll');
    const index = LIST.indexOf(15_000);
    await act(async () => {
      fireEvent(scroll, 'momentumScrollEnd', { nativeEvent: { contentOffset: { x: index * STEP + 6, y: 0 } } });
    });
    expect(onChange).toHaveBeenLastCalledWith(15_000);
    expect(selected()).toEqual([15_000]);
    // Past either end holds at the ends of the list, never beyond it.
    await act(async () => {
      fireEvent(scroll, 'momentumScrollEnd', { nativeEvent: { contentOffset: { x: 99999, y: 0 } } });
    });
    expect(onChange).toHaveBeenLastCalledWith(1_000_000);
    await act(async () => {
      fireEvent(scroll, 'momentumScrollEnd', { nativeEvent: { contentOffset: { x: -50, y: 0 } } });
    });
    expect(onChange).toHaveBeenLastCalledWith(100);
  });
});

describe('PricePicker · popular shortcuts', () => {
  it('draws 1,000, 2,500, 5,000 and 10,000 under the strip, and a tap jumps to one', async () => {
    const onChange = jest.fn();
    await renderFrame(<Controlled start={100} onChange={onChange} />);
    await screen.findByTestId('price-stop-100');
    const shortcuts = screen.getAllByTestId(/^price-popular-\d+$/).map((s) => Number(String(s.props.testID).replace('price-popular-', '')));
    expect(shortcuts).toEqual([1000, 2500, 5000, 10_000]);
    await fireEvent.press(screen.getByTestId('price-popular-5000'));
    expect(onChange).toHaveBeenLastCalledWith(5000);
    expect(selected()).toEqual([5000]);
    expect(screen.getByTestId('price-popular-5000').props.accessibilityState.selected).toBe(true);
    expect(screen.getByTestId('price-popular-1000').props.accessibilityState.selected).toBe(false);
  });

  it('leaves out a shortcut the admin took off the list', async () => {
    servePrices(LIST.filter((n) => n !== 2500));
    await renderFrame(<Controlled start={1000} />);
    await screen.findByTestId('price-stop-1000');
    expect(screen.queryByTestId('price-popular-2500')).toBeNull();
    expect(screen.getAllByTestId(/^price-popular-\d+$/)).toHaveLength(3);
  });
});

describe('PricePicker · what the creator earns', () => {
  it('is 85% of the list price, in whole naira', async () => {
    await renderFrame(<Controlled start={100} />);
    await screen.findByTestId('price-stop-100');
    expect(earnLabel()).toBe('You earn 85 naira a sale');
    await fireEvent.press(screen.getByTestId('price-stop-1500'));
    expect(earnLabel()).toBe('You earn 1,275 naira a sale');
    await fireEvent.press(screen.getByTestId('price-stop-1000000'));
    expect(earnLabel()).toBe('You earn 850,000 naira a sale');
    expect(within(screen.getByTestId('price-picker-earn')).getByText('₦850,000')).toBeTruthy();
  });
});

describe('PricePicker · the store note', () => {
  it('is not drawn while the Hub gives no store price (it does not serve one yet)', async () => {
    await renderFrame(<Controlled start={2500} />);
    await screen.findByTestId('price-stop-2500');
    expect(screen.queryByTestId('price-picker-store')).toBeNull();
    expect(screen.queryByText(/Apple and Google/)).toBeNull();
  });

  it('is drawn, with the store price, only for a price the Hub gives one for', async () => {
    servePrices(LIST, undefined, { 2500: 3200 });
    await renderFrame(<Controlled start={2500} />);
    const note = await screen.findByTestId('price-picker-store');
    expect(within(note).getByText(/In the app, Apple and Google add their fee\. Fans there pay/)).toBeTruthy();
    expect(within(note).getByText('₦3,200')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('price-stop-5000'));
    expect(screen.queryByTestId('price-picker-store')).toBeNull();
  });

  it('is left out where the price is not a store purchase (storeNote off)', async () => {
    servePrices(LIST, undefined, { 2500: 3200 });
    await renderFrame(<Controlled start={2500} storeNote={false} />);
    await screen.findByTestId('price-stop-2500');
    expect(screen.queryByTestId('price-picker-store')).toBeNull();
  });
});

describe('PricePicker · a screen reader', () => {
  it('reads each stop as a button named by its price, with the chosen one marked selected', async () => {
    await renderFrame(<Controlled start={2500} />);
    const stop = await screen.findByLabelText('₦2,500');
    expect(stop.props.accessibilityRole).toBe('button');
    expect(stop.props.accessibilityState.selected).toBe(true);
    expect(screen.getByLabelText('₦3,000').props.accessibilityState.selected).toBe(false);
    expect(screen.getByLabelText('Popular price ₦5,000').props.accessibilityRole).toBe('button');
  });

  it('can adjust the strip: increment goes to the next list price, decrement to the one before, and both stop at the ends', async () => {
    const onChange = jest.fn();
    await renderFrame(<Controlled start={2500} onChange={onChange} />);
    const strip = await screen.findByTestId('price-picker-strip');
    expect(strip.props.accessibilityRole).toBe('adjustable');
    expect(strip.props.accessibilityValue).toEqual({ text: '₦2,500' });
    await fireEvent(strip, 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });
    expect(onChange).toHaveBeenLastCalledWith(3000);
    await fireEvent(screen.getByTestId('price-picker-strip'), 'accessibilityAction', { nativeEvent: { actionName: 'decrement' } });
    await fireEvent(screen.getByTestId('price-picker-strip'), 'accessibilityAction', { nativeEvent: { actionName: 'decrement' } });
    expect(onChange).toHaveBeenLastCalledWith(2000);
    expect(screen.getByTestId('price-picker-strip').props.accessibilityValue).toEqual({ text: '₦2,000' });
  });
});

describe('PricePicker · a saved price that is not on the list', () => {
  it('shows the nearest list price selected, says to pick one, and sends nothing until a price is picked', async () => {
    const onChange = jest.fn();
    await renderFrame(<Controlled start={1200} onChange={onChange} />);
    await screen.findByTestId('price-stop-1000');
    expect(selected()).toEqual([1000]);
    expect(screen.getByText('Pick a price from the list.')).toBeTruthy();
    expect(onChange).not.toHaveBeenCalled();
    // Picking the very price that is selected counts as picking it.
    await fireEvent.press(screen.getByTestId('price-stop-1000'));
    expect(onChange).toHaveBeenCalledWith(1000);
    expect(screen.queryByText('Pick a price from the list.')).toBeNull();
  });

  it('takes the lower of two list prices on a tie', async () => {
    await renderFrame(<Controlled start={1250} />);
    await screen.findByTestId('price-stop-1000');
    expect(selected()).toEqual([1000]);
  });
});

describe('PricePicker · locked and failing', () => {
  it('does nothing when locked', async () => {
    const onChange = jest.fn();
    await renderFrame(<Controlled start={2500} onChange={onChange} disabled />);
    await fireEvent.press(await screen.findByTestId('price-stop-5000'));
    await fireEvent.press(screen.getByTestId('price-popular-1000'));
    expect(onChange).not.toHaveBeenCalled();
    expect(selected()).toEqual([2500]);
  });

  it('says the prices did not load, and Try again reads them again', async () => {
    delete hub.answers['GET /api/hub/prices'];
    await renderFrame(<Controlled start={2500} />);
    expect(await screen.findByTestId('price-picker-error')).toBeTruthy();
    expect(screen.queryByTestId('price-picker-strip')).toBeNull();
    servePrices();
    await fireEvent.press(screen.getByText('Try again'));
    expect(await screen.findByTestId('price-stop-2500')).toBeTruthy();
  });
});
