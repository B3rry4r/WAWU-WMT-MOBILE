import * as rtl from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { HomeTabs, tabFitSteps } from '../HomeTabs';
import { homeViews } from '../model';

const layout = (width: number) => ({ nativeEvent: { layout: { x: 0, y: 0, width, height: 40 } } });
const gapOf = () => (StyleSheet.flatten(rtl.screen.getByTestId('home-tabs').props.style) as { gap: number }).gap;
const sizeOf = (view: string) => (StyleSheet.flatten(rtl.screen.getByTestId(`feed-tab-${view}`).children[0] && (rtl.screen.getByText(homeViews.find((v) => v.view === view)!.label).props.style)) as { fontSize: number }).fontSize;

async function draw(fit: boolean) {
  return rtl.render(<HomeTabs views={homeViews} selected="today" tone="page" onChange={() => undefined} fit={fit} />);
}
const room = (width: number) => rtl.act(() => rtl.fireEvent(rtl.screen.getByTestId('home-tabs-room'), 'layout', layout(width)));
const row = (width: number) => rtl.act(() => rtl.fireEvent(rtl.screen.getByTestId('home-tabs'), 'layout', layout(width)));

describe('Home tab row, fitted to the room beside it (a 320 or 360 wide phone with the search and the bell)', () => {
  it('keeps the design (20 between tabs, 16.5 labels) when the row fits', async () => {
    await draw(true);
    await room(280);
    await row(223);
    expect(gapOf()).toBe(tabFitSteps[0].gap);
    expect(tabFitSteps[0].gap).toBe(20);
    expect(sizeOf('today')).toBe(16.5);
  });

  it('takes from the space between the tabs first, then from the labels, each step only while the row is wider than its room', async () => {
    await draw(true);
    await room(184);
    await row(223);
    expect(gapOf()).toBe(tabFitSteps[1].gap);
    await row(215);
    expect(gapOf()).toBe(tabFitSteps[2].gap);
    expect(sizeOf('today')).toBe(16.5);
    await row(205);
    expect(gapOf()).toBe(tabFitSteps[3].gap);
    expect(sizeOf('today')).toBeCloseTo(16.5 * tabFitSteps[3].scale, 5);
    await row(180);
    // It fits now (180 is under 184): the steps stop here.
    expect(gapOf()).toBe(tabFitSteps[3].gap);
    await row(180);
    expect(gapOf()).toBe(tabFitSteps[3].gap);
  });

  it('stops at the last step when even that is too wide, and never loops', async () => {
    await draw(true);
    await room(100);
    for (let i = 0; i < tabFitSteps.length + 4; i += 1) await row(300 - i);
    expect(gapOf()).toBe(tabFitSteps[tabFitSteps.length - 1].gap);
    expect(sizeOf('today')).toBeCloseTo(16.5 * tabFitSteps[tabFitSteps.length - 1].scale, 5);
  });

  it('starts again from the design when the room changes', async () => {
    await draw(true);
    await room(184);
    await row(223);
    await row(215);
    expect(gapOf()).toBe(tabFitSteps[2].gap);
    await room(300);
    expect(gapOf()).toBe(tabFitSteps[0].gap);
    expect(sizeOf('today')).toBe(16.5);
  });

  it('every step is narrower than the one before and never smaller than 80% of the design', () => {
    for (let i = 1; i < tabFitSteps.length; i += 1) {
      expect(tabFitSteps[i].gap * 2 + tabFitSteps[i].scale * 100).toBeLessThanOrEqual(tabFitSteps[i - 1].gap * 2 + tabFitSteps[i - 1].scale * 100);
    }
    expect(Math.min(...tabFitSteps.map((s) => s.scale))).toBeGreaterThanOrEqual(0.8);
  });

  it('with fit off (the feed) the row is the design and takes no room wrapper', async () => {
    await draw(false);
    expect(rtl.screen.queryByTestId('home-tabs-room')).toBeNull();
    expect(gapOf()).toBe(20);
    expect(sizeOf('today')).toBe(16.5);
  });
});
