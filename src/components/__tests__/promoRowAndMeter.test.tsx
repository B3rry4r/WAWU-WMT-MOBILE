import { render, screen, userEvent } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { floatingRoom } from '@/components/floating';
import { ProductsMeter } from '@/components/ProductsMeter';
import { PromoRow, promoMetrics } from '@/components/PromoRow';
import { PaidFromAbroad } from '@/features/wallet/fx/FxTabBody';
import { lightColors } from '@/theme/tokens.generated';

const flat = (style: unknown) => StyleSheet.flatten(style as never) as Record<string, unknown>;

/**
 * POLISH-1 (R-110, owner, 30 Oct 2026): the promo row and the products meter. A person can read the abroad row and open it; the meter
 * reads "0 of 10", the tier and the date; the row carries no colour outside the theme's tokens.
 */
describe('R-110 point 1 · the promo row', () => {
  it('"Get paid from abroad" is one standard row: a 40 rounded tile, the title, one line, a chevron, 72 high, and a tap opens it', async () => {
    const onPress = jest.fn();
    await render(<PaidFromAbroad code="EUR" onPress={onPress} />);
    expect(screen.getByText('Get paid from abroad')).toBeTruthy();
    const line = screen.getByText('Share your EUR account details');
    expect(line.props.numberOfLines).toBe(1);
    // The row: the kit's minimum height and the promo room above and below; the card adds its own 2 either side (72 in all).
    const row = flat(screen.getByTestId('fx-abroad').props.style);
    expect(row.minHeight).toBe(64);
    expect(row.paddingVertical).toBe(promoMetrics.padV);
    expect(promoMetrics.tile).toBe(40);
    expect((row.minHeight as number) >= 64 && promoMetrics.tile + 2 * promoMetrics.padV + 4).toBe(72);
    await userEvent.press(screen.getByRole('button', { name: 'Get paid in euros. Share your EUR account details.' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('draws the tile in the accent tint, never a currency colour: no blue (curUsd) anywhere in the row', async () => {
    await render(<PaidFromAbroad code="EUR" onPress={() => undefined} />);
    const drawn = JSON.stringify(screen.toJSON());
    expect(drawn).toContain(lightColors.accentTint);
    expect(drawn).not.toContain(lightColors.curUsd);
    // A square tile: 12 round on 40.
    expect(drawn).toContain('"borderRadius":12');
  });

  it('a row that can be put away carries a close button in place of the chevron, and both taps are separate', async () => {
    const onPress = jest.fn();
    const onDismiss = jest.fn();
    await render(<PromoRow icon="Coins" title="More than one currency" subtitle="Hold dollars and crypto." onPress={onPress} testID="row" dismiss={{ label: 'Dismiss', onPress: onDismiss, testID: 'close' }} />);
    await userEvent.press(screen.getByTestId('close'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onPress).not.toHaveBeenCalled();
    await userEvent.press(screen.getByTestId('row'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('R-110 point 2 · the products meter card', () => {
  const NOW = new Date('2026-10-30T09:00:00Z');

  it('reads "Products", "0 of 10", the tier chip and "Renews 30 Oct 2027", with the bar track on the sunken token', async () => {
    await render(<ProductsMeter used={0} allowed={10} tier={{ name: 'Founding Maker', state: 'active', endsAt: '2027-10-30T09:00:00.000Z' }} now={NOW} testID="meter" />);
    expect(screen.getByText('Products')).toBeTruthy();
    expect(screen.getByText('0 of 10')).toBeTruthy();
    expect(screen.getByTestId('meter-tier')).toHaveTextContent('Founding Maker');
    expect(screen.getByText('Renews 30 Oct 2027')).toBeTruthy();
    // The card pads 16; the figure is 22 at 700, tabular; the bar is 6 high and its empty track still shows (the sunken token).
    expect(flat(screen.getByTestId('meter').props.style).padding).toBe(16);
    const figure = flat(screen.getByTestId('meter-figure').props.style);
    expect(figure.fontSize).toBe(22);
    expect(figure.fontVariant).toEqual(['tabular-nums']);
    const fill = screen.getByTestId('meter-fill');
    expect(flat(fill.props.style).width).toBe('0%');
    const track = flat(fill.parent?.props.style);
    expect(track.height).toBe(6);
    expect(track.backgroundColor).toBe(lightColors.surfaceSunken);
    expect(flat(fill.props.style).backgroundColor).toBe(lightColors.accent);
  });

  it('says Ends, not Renews, once the tier is ending; and no line when the Hub names no end day', async () => {
    const { rerender } = await render(<ProductsMeter used={3} allowed={10} tier={{ name: 'Founding Maker', state: 'ending', endsAt: '2027-10-30T09:00:00.000Z' }} now={NOW} testID="meter" />);
    expect(screen.getByText('Ends 30 Oct 2027')).toBeTruthy();
    await rerender(<ProductsMeter used={3} allowed={10} tier={{ name: 'Founding Maker', state: 'active', endsAt: null }} now={NOW} testID="meter" />);
    expect(screen.queryByTestId('meter-renewal')).toBeNull();
  });
});

describe('R-110 point 3 · room under the floating buttons', () => {
  it('a creator ends 90 above the foot and anyone else 83, both at least the top of the tallest button plus clear air', () => {
    expect(floatingRoom({ create: true, music: true })).toBe(90);
    expect(floatingRoom({ create: false, music: true })).toBe(83);
  });
});
