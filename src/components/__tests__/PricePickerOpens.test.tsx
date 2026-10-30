/* eslint-disable @typescript-eslint/no-require-imports */
import { act, fireEvent, screen } from '@testing-library/react-native';
import { useState } from 'react';
import { ScrollView } from 'react-native';

import { installFetch, renderFrame } from '@/features/create/__helpers__/harness';
import { LIST, servePrices } from '@/features/prices/__helpers__/prices';

installFetch();
const { PricePicker } = require('@/components/PricePicker') as typeof import('@/components/PricePicker');

const STEP = 76 + 8;

function Controlled({ start = null }: { start?: number | null }) {
  const [value, setValue] = useState<number | null>(start);
  return <PricePicker value={value} onChange={setValue} label="Your price" earnSuffix="a sale" />;
}

const measure = async (width = 390) => {
  const strip = await screen.findByTestId('price-picker-strip');
  await act(async () => {
    fireEvent(strip, 'layout', { nativeEvent: { layout: { x: 0, y: 0, width, height: 70 } } });
  });
  // The strip's content has its size once the measured width has padded it.
  await act(async () => {
    fireEvent(screen.getByTestId('price-picker-scroll'), 'contentSizeChange', LIST.length * STEP + width, 70);
  });
};

let scrolled: jest.SpyInstance;
beforeEach(() => {
  installFetch();
  servePrices();
  scrolled = jest.spyOn(ScrollView.prototype as unknown as { scrollTo: () => void }, 'scrollTo').mockImplementation(() => undefined);
});
afterEach(() => scrolled.mockRestore());

// WALK-FIX M8 (29 Oct walk): the price strips opened scrolled past the first chips (₦100 to ₦1,500 off the left edge) on paid-message
// settings, create-price, community/new and events/host. They all draw this one picker.
describe('a price strip opens where the person can see its start or their price', () => {
  it('with no price chosen it stays at its start: it never scrolls itself to a stop, so the first chips are in view', async () => {
    await renderFrame(<Controlled />);
    await measure();
    expect(scrolled).not.toHaveBeenCalled();
    expect(screen.getByText('Pick a price')).toBeTruthy();
  });

  it('with a price chosen it opens with that price placed in the middle, at once', async () => {
    await renderFrame(<Controlled start={2500} />);
    await measure();
    const x = LIST.indexOf(2500) * STEP;
    expect(scrolled).toHaveBeenCalledWith({ x, y: 0, animated: false });
  });

  it('the chosen price is placed again once the strip\'s content has its padded size (a phone clamps an earlier scroll to the content it had)', async () => {
    await renderFrame(<Controlled start={50_000} />);
    await measure();
    const x = LIST.indexOf(50_000) * STEP;
    const placements = scrolled.mock.calls.filter((call) => call[0].x === x);
    expect(placements.length).toBeGreaterThanOrEqual(2);
  });

  it('choosing a price from nothing places it; a later pick glides there', async () => {
    await renderFrame(<Controlled />);
    await measure();
    await fireEvent.press(await screen.findByTestId('price-popular-1000'));
    const x = LIST.indexOf(1000) * STEP;
    expect(scrolled).toHaveBeenCalledWith({ x, y: 0, animated: false });
  });
});
