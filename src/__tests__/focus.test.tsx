import { fireEvent, render, screen } from '@testing-library/react-native';
import { act as routerAct, renderRouter, screen as routerScreen, fireEvent as routerFire } from 'expo-router/testing-library';
import { Platform } from 'react-native';

import TabsLayout from '@/app/(tabs)/_layout';
import Home from '@/app/(tabs)/index';
import Explore from '@/app/(tabs)/explore';
import Inbox from '@/app/(tabs)/inbox';
import Wallet from '@/app/(tabs)/wallet';
import Me from '@/app/(tabs)/me';
import { IconButton } from '@/components/Button';
import { Card, GroupedList } from '@/components/Card';
import { ConversationRow } from '@/components/ConversationRow';
import { FilterChips } from '@/components/FilterChips';
import { focusRingGap } from '@/components/focusRing';
import { KeyValueRow } from '@/components/ListRow';
import { SegmentedTabs } from '@/components/SegmentedTabs';
import { Skeleton, SkeletonRows } from '@/components/Skeleton';
import { TextField } from '@/components/TextField';
import { darkColors, lightColors } from '@/theme/tokens.generated';

let mockScheme: 'light' | 'dark' = 'dark';
jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: () => mockScheme,
}));
beforeEach(() => {
  mockScheme = 'dark';
});
afterEach(() => jest.restoreAllMocks());

const flat = (style: unknown): Record<string, unknown> => Object.assign({}, ...[style].flat(Infinity).filter(Boolean));
const keyboard = { target: { matches: (q: string) => q === ':focus-visible' } };
const mouse = { target: { matches: () => false } };
const hiddenOk = { includeHiddenElements: true };

const routes = {
  '(tabs)/_layout': TabsLayout,
  '(tabs)/index': Home,
  '(tabs)/explore': Explore,
  '(tabs)/inbox': Inbox,
  '(tabs)/wallet': Wallet,
  '(tabs)/me': Me,
};

/** One check per control: keyboard focus draws the double ring, mouse focus none, and the browser outline is off on the web. */
async function expectRing(get: () => { props: { style?: unknown } }, scheme: 'light' | 'dark') {
  const colors = scheme === 'dark' ? darkColors : lightColors;
  const control = get();
  expect(flat(control.props.style).boxShadow).toBeUndefined();
  await fireEvent(control as never, 'focus', mouse);
  expect(flat(get().props.style).boxShadow).toBeUndefined();
  await fireEvent(control as never, 'blur');
  await fireEvent(control as never, 'focus', keyboard);
  const shadow = String(flat(get().props.style).boxShadow);
  expect(shadow).toBe(`0 0 0 ${focusRingGap}px ${colors.surfacePage}, 0 0 0 3.5px ${colors.accentFg}`);
  expect(flat(get().props.style)).toMatchObject({ outlineStyle: 'none', outlineWidth: 0 });
}

describe.each(['dark', 'light'] as const)('keyboard focus ring in %s mode', (scheme) => {
  beforeEach(() => {
    mockScheme = scheme;
    jest.replaceProperty(Platform, 'OS', 'web');
  });

  it('shows a keyboard user the ring on an icon button, and a mouse user none', async () => {
    await render(<IconButton icon="ChevronLeft" label="Back" onPress={() => undefined} />);
    await expectRing(() => screen.getByRole('button', { name: 'Back' }), scheme);
  });

  it('shows a keyboard user the ring on the show-password toggle', async () => {
    await render(<TextField label="Password" secret />);
    await expectRing(() => screen.getByRole('button', { name: 'Show password' }), scheme);
  });

  it('shows a keyboard user the ring on a chip and a segment', async () => {
    await render(
      <>
        <FilterChips label="Filter" items={[{ value: 'a', label: 'All' }]} value="a" onChange={() => undefined} />
        <SegmentedTabs label="Feed" items={[{ value: 'x', label: 'Today' }]} value="x" onChange={() => undefined} />
      </>,
    );
    await expectRing(() => screen.getByRole('radio', { name: 'All' }), scheme);
    await expectRing(() => screen.getByRole('tab', { name: 'Today' }), scheme);
  });
});

describe('tab bar ring', () => {
  it.each(['dark', 'light'] as const)('shows a keyboard user the ring on a tab of the app tab bar in %s mode', async (scheme) => {
    mockScheme = scheme;
    await renderRouter(routes);
    const get = () => routerScreen.getByRole('tab', { name: 'Explore' });
    const tab = get();
    expect(flat(get().props.style).boxShadow).toBeUndefined();
    await routerFire(tab, 'focus', keyboard);
    const colors = scheme === 'dark' ? darkColors : lightColors;
    expect(String(flat(get().props.style).boxShadow)).toContain(`0 0 0 ${focusRingGap}px ${colors.surfacePage}`);
    await routerFire(tab, 'blur');
    expect(flat(get().props.style).boxShadow).toBeUndefined();
    await routerAct(async () => undefined);
  });
});

describe('the ring gap', () => {
  it('keeps the 2 px page-coloured gap between a button and its ring', async () => {
    expect(focusRingGap).toBe(2);
    await render(<IconButton icon="X" label="Close" onPress={() => undefined} />);
    await fireEvent(screen.getByRole('button', { name: 'Close' }), 'focus', keyboard);
    expect(String(flat(screen.getByRole('button', { name: 'Close' }).props.style).boxShadow)).toMatch(/^0 0 0 2px /);
  });
});

describe('layout that matches the kit', () => {
  it('lets the loading rows sit exactly where the rows will, with no gutter of their own', async () => {
    await render(<SkeletonRows count={2} testID="rows" />);
    const row = screen.getByTestId('rows').children[0] as unknown as { children: { props: { style: unknown } }[] };
    expect(flat(row.children[0].props.style).paddingHorizontal).toBeUndefined();
  });

  it('draws a skeleton at the kit 12 corner unless a caller says otherwise', async () => {
    await render(<Skeleton testID="s" height={20} />);
    expect(flat(screen.getByTestId('s').props.style).borderRadius).toBe(12);
  });

  it('adds no height for a divider: a conversation row and a grouped list keep the kit heights', async () => {
    await render(<ConversationRow name="Amaka" preview="Hi" time="10:24" testID="c" />);
    const row = flat(screen.getByTestId('c').props.style);
    expect(row.borderBottomWidth).toBeUndefined();
    const divider = flat((screen.getByTestId('c').children.at(-1) as unknown as { props: { style: unknown } }).props.style);
    expect(divider).toMatchObject({ position: 'absolute', bottom: 0 });
    await render(
      <GroupedList testID="g">
        <KeyValueRow label="a" value="b" />
        <KeyValueRow label="c" value="d" />
      </GroupedList>,
    );
    const line = flat((screen.getByTestId('g').children[1] as unknown as { props: { style: unknown } }).props.style);
    expect(Number(line.height) + Number(line.marginBottom)).toBe(0);
    expect(Card).toBeDefined();
  });

  it('gives the chip scroller room for the ring without moving the chips', async () => {
    await render(<FilterChips testID="chips" label="Filter" items={[{ value: 'a', label: 'All' }]} value="a" onChange={() => undefined} />);
    const scroller = flat(screen.getByTestId('chips').props.style);
    const content = flat(screen.getByTestId('chips').props.contentContainerStyle);
    expect(Number(content.paddingVertical)).toBeGreaterThanOrEqual(focusRingGap + 1.5);
    expect(Number(scroller.marginVertical)).toBe(-Number(content.paddingVertical));
  });

  it('puts 6 between the parts of a key-value value, as the kit does', async () => {
    await render(<KeyValueRow label="Total" value="x" testID="kv" />);
    const value = screen.getByTestId('kv').children[1] as unknown as { props: { style: unknown } };
    expect(flat(value.props.style).gap).toBe(6);
  });

  it('draws the kit refund and request glyphs in a conversation', async () => {
    const { unmount } = await render(<ConversationRow name="A" preview="Refunded" time="1" kind="refund" />);
    expect(screen.getByTestId('icon-RotateCcw', hiddenOk)).toBeTruthy();
    await unmount();
    await render(<ConversationRow name="A" preview="Asked" time="1" kind="req" />);
    expect(screen.getByTestId('icon-HandCoins', hiddenOk)).toBeTruthy();
  });
});
