import * as rtl from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { BalanceCard } from '../home/BalanceCard';

/*
 * A balance is never painted cut off (lead ruling, round 2; round 2's D5): a figure is shown only once the
 * hidden copy has measured that same figure. jest lays nothing out, so each test sends the two layouts by
 * hand: the row's width (the room there is) and the hidden copy's width (the figure at the design's 42).
 */
const ROOM = 236;
const props = { accountNumber: '8100000417', bankName: 'Ekiti Trial MFB', onToggleHidden: () => undefined };

type Host = { type: string; props: Record<string, unknown>; children: readonly (Host | string)[] };

/** Every host element under the screen's root, in tree order. */
function hosts(): Host[] {
  const found: Host[] = [];
  const walk = (node: Host | string) => {
    if (typeof node === 'string') return;
    found.push(node);
    node.children.forEach(walk);
  };
  walk(rtl.screen.root as unknown as Host);
  return found;
}

/** The views that listen for their own layout, in tree order: the row, then the hidden copy. */
function layoutTargets() {
  return hosts().filter((node) => node.type === 'View' && typeof node.props.onLayout === 'function');
}

async function layout(node: Host, width: number) {
  await rtl.act(async () => {
    (node.props.onLayout as (e: object) => void)({ nativeEvent: { layout: { x: 0, y: 0, width, height: 42 } } });
  });
}

/** The row gets its width, then the hidden copy reports the figure's natural width at 42. */
async function measure(natural: number) {
  const [row, copy] = layoutTargets();
  await layout(row, ROOM);
  await layout(copy, natural);
}

const shown = () => (StyleSheet.flatten(rtl.screen.getByTestId('wallet-balance-fit').props.style as object) as { opacity?: number } | undefined)?.opacity !== 0;
const size = () => (StyleSheet.flatten(rtl.screen.getByTestId('wallet-balance').props.style as object) as { fontSize?: number })?.fontSize;

afterEach(() => rtl.cleanup());

describe('the balance on the card is never painted cut off', () => {
  it('is invisible until measured, then shown at a size that fits', async () => {
    await rtl.render(<BalanceCard {...props} availableKobo={48_525_075} hidden={false} />);
    expect(shown()).toBe(false);
    await measure(260);
    expect(shown()).toBe(true);
    // 42 * 236 / 260 = 38.1, so 38
    expect(size()).toBe(38);
  });

  it('a new figure stays invisible until the hidden copy has measured it, not the one before', async () => {
    const view = await rtl.render(<BalanceCard {...props} availableKobo={0} hidden={false} />);
    await measure(110);
    expect(shown()).toBe(true);
    expect(size()).toBe(42);
    await view.rerender(<BalanceCard {...props} availableKobo={9_876_543_210} hidden={false} />);
    // The new figure would be cut at 42: it must not be painted before it is measured.
    expect(shown()).toBe(false);
    await measure(310);
    expect(shown()).toBe(true);
    expect(size()).toBe(30);
  });

  it('Show after Hide waits for the figure to be measured again', async () => {
    const view = await rtl.render(<BalanceCard {...props} availableKobo={485_250_775} hidden={false} />);
    await measure(300);
    expect(shown()).toBe(true);
    await view.rerender(<BalanceCard {...props} availableKobo={485_250_775} hidden />);
    expect(shown()).toBe(false);
    await measure(150);
    expect(shown()).toBe(true);
    await view.rerender(<BalanceCard {...props} availableKobo={485_250_775} hidden={false} />);
    expect(shown()).toBe(false);
    await measure(300);
    expect(shown()).toBe(true);
    expect(size()).toBe(32);
  });

  it('the measuring copy is hidden from screen readers on every platform', async () => {
    await rtl.render(<BalanceCard {...props} availableKobo={48_525_075} hidden={false} />);
    const hiders = hosts().filter((node) => node.type === 'View' && node.props['aria-hidden'] === true);
    expect(hiders).toHaveLength(1);
    expect(hiders[0].props.accessibilityElementsHidden).toBe(true);
    expect(hiders[0].props.importantForAccessibility).toBe('no-hide-descendants');
  });
});
