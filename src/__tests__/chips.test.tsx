import { fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { useState } from 'react';
import { Platform } from 'react-native';

import { FilterChips, optionChipMetrics } from '@/components/FilterChips';
import { focusRingGap } from '@/components/focusRing';
import { VerifiedTick } from '@/components/icon';
import { pillMetrics, StatusPill } from '@/components/StatusPill';
import { Showcase } from '@/features/showcase/Showcase';
import { darkColors, lightColors, radius } from '@/theme/tokens.generated';

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
const hiddenOk = { includeHiddenElements: true };
/** The pill's own box: the parent of its label text. */
const pillOf = (label: string) => screen.getByText(label).parent!;
const keyboard = { target: { matches: (q: string) => q === ':focus-visible' } };
const mouse = { target: { matches: () => false } };

const kinds = [
  { value: 'all', label: 'All' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'concert', label: 'Concert' },
] as const;

function Options({ onPick }: { onPick?: (v: string) => void }) {
  const [value, setValue] = useState<(typeof kinds)[number]['value']>('all');
  return (
    <FilterChips
      variant="option"
      label="Kind of event"
      items={kinds}
      value={value}
      onChange={(v) => {
        setValue(v);
        onPick?.(v);
      }}
    />
  );
}

describe('option chips in a filter sheet', () => {
  it('lets a user choose one kind and tells a screen reader which is on', async () => {
    const onPick = jest.fn();
    await render(<Options onPick={onPick} />);
    expect(screen.getByLabelText('Kind of event').props.accessibilityRole).toBe('radiogroup');
    await userEvent.press(screen.getByRole('radio', { name: 'Workshop' }));
    expect(onPick).toHaveBeenCalledWith('workshop');
    expect(screen.getByRole('radio', { name: 'Workshop' }).props.accessibilityState.checked).toBe(true);
    expect(screen.getByRole('radio', { name: 'All' }).props.accessibilityState.checked).toBe(false);
  });

  it('wraps onto new lines inside the sheet instead of scrolling sideways', async () => {
    await render(<Options />);
    expect(flat(screen.getByLabelText('Kind of event').props.style)).toMatchObject({ flexDirection: 'row', flexWrap: 'wrap' });
  });

  it('draws a chip 38 high with 14 either side, and the chosen one in ink on both themes', async () => {
    const { unmount } = await render(<Options />);
    const chip = flat(screen.getByRole('radio', { name: 'Workshop' }).props.style);
    expect(chip.height).toBe(optionChipMetrics.height);
    expect(optionChipMetrics.height).toBe(38);
    expect(chip.paddingHorizontal).toBe(optionChipMetrics.padH - optionChipMetrics.border);
    expect(flat(screen.getByRole('radio', { name: 'All' }).props.style).backgroundColor).toBe(darkColors.textPrimary);
    await unmount();
    mockScheme = 'light';
    await render(<Options />);
    expect(flat(screen.getByRole('radio', { name: 'All' }).props.style).backgroundColor).toBe(lightColors.textPrimary);
    expect(flat(screen.getByRole('radio', { name: 'Workshop' }).props.style).borderColor).toBe(lightColors.borderStrong);
  });

  it('shows the keyboard ring on a focused chip, not on a click, with no browser outline on the web', async () => {
    jest.replaceProperty(Platform, 'OS', 'web');
    await render(<Options />);
    const get = () => screen.getByRole('radio', { name: 'Workshop' });
    await fireEvent(get(), 'focus', mouse);
    expect(flat(get().props.style).boxShadow).toBeUndefined();
    await fireEvent(get(), 'blur');
    await fireEvent(get(), 'focus', keyboard);
    expect(String(flat(get().props.style).boxShadow)).toBe(
      `0 0 0 ${focusRingGap}px ${darkColors.surfacePage}, 0 0 0 3.5px ${darkColors.accentFg}`,
    );
    expect(flat(get().props.style)).toMatchObject({ outlineStyle: 'none', outlineWidth: 0 });
  });
});

describe('option chip label and width', () => {
  it.each([
    ['dark', darkColors],
    ['light', lightColors],
  ] as const)('writes an unselected option chip in primary text on %s, and the chosen one in the page colour', async (scheme, colors) => {
    mockScheme = scheme;
    await render(<Options />);
    expect(flat(screen.getByText('Workshop').props.style).color).toBe(colors.textPrimary);
    expect(flat(screen.getByText('All').props.style).color).toBe(colors.surfacePage);
  });

  it('keeps a row chip label in secondary text, so the two variants differ only where the kit does', async () => {
    await render(<FilterChips label="Rows" items={kinds} value="all" onChange={() => undefined} />);
    expect(flat(screen.getByText('Workshop').props.style).color).toBe(darkColors.textSecondary);
  });

  it('takes 14 across from the edge to the label, border included, as the kit draws the outline without taking room', async () => {
    await render(<Options />);
    const chip = flat(screen.getByRole('radio', { name: 'Workshop' }).props.style);
    expect(chip.borderWidth).toBe(optionChipMetrics.border);
    expect(Number(chip.paddingHorizontal) + Number(chip.borderWidth)).toBe(optionChipMetrics.padH);
    const selected = flat(screen.getByRole('radio', { name: 'All' }).props.style);
    expect(Number(selected.paddingHorizontal) + Number(selected.borderWidth)).toBe(14);
  });
});

describe('status pills', () => {
  it('lets a user read the status as words, with the icon left out of what a screen reader says', async () => {
    await render(<StatusPill label="Completed" tone="positive" icon="Check" />);
    expect(pillOf('Completed').props.accessible).toBe(true);
    expect(screen.getByText('Completed')).toBeTruthy();
    expect(screen.getByTestId('icon-Check', hiddenOk)).toBeTruthy();
    expect(screen.queryByRole('image')).toBeNull();
    expect(screen.getByTestId('icon-Check', hiddenOk).parent!.parent!.props).toMatchObject({ accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' });
  });

  it('is not a control: a user cannot press it and it has no button or radio role', async () => {
    await render(<StatusPill label="Pending" tone="warning" icon="Clock" />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByRole('radio')).toBeNull();
  });

  it.each([
    ['positive', 'positiveTint', 'positive'],
    ['warning', 'warningTint', 'warning'],
    ['danger', 'dangerTint', 'danger'],
    ['info', 'infoTint', 'info'],
    ['accent', 'accentTint', 'accent'],
    ['neutral', 'surfaceSunken', 'textSecondary'],
  ] as const)('draws the %s pill in its tint and ink, light and dark', async (tone, tint, ink) => {
    for (const scheme of ['dark', 'light'] as const) {
      mockScheme = scheme;
      const colors = scheme === 'dark' ? darkColors : lightColors;
      const { unmount } = await render(<StatusPill label="Status" tone={tone} />);
      expect(flat(pillOf('Status').props.style).backgroundColor).toBe(colors[tint]);
      expect(flat(screen.getByText('Status').props.style).color).toBe(colors[ink]);
      await unmount();
    }
  });

  it('is 26 high with 10 either side and a round end, as the kit draws it', async () => {
    await render(<StatusPill label="Live" />);
    const pill = flat(pillOf('Live').props.style);
    expect(pill).toMatchObject({ height: 26, paddingHorizontal: 10, gap: 5, borderRadius: radius.chip });
    expect(pillMetrics.font).toBe(12.5);
    expect(flat(screen.getByText('Live').props.style)).toMatchObject({ fontSize: 12.5, fontFamily: 'AlanSans-Bold' });
  });

  it('draws the icon at 13 with a 2.4 stroke in the tone colour', async () => {
    await render(<StatusPill label="Failed" tone="danger" icon="X" />);
    const icon = screen.getByTestId('icon-X', hiddenOk);
    expect(icon.props.width).toBe(13);
    expect(icon.props.height).toBe(13);
    expect(icon.props.strokeWidth).toBe(2.4);
    expect(icon.props.stroke).toBe(darkColors.danger);
  });
});

describe('ticks against the kit', () => {
  /** react-native-svg hands a hex colour to the native side as opaque ARGB. */
  const argb = (hex: string) => ({ type: 0, payload: (0xff000000 + parseInt(hex.slice(1), 16)) >>> 0 });

  /** The two shapes a tick draws: the filled badge and the stroked check. */
  const shapes = (id: string) => {
    const group = screen.getByTestId(id).children[0] as { children: { props: Record<string, unknown> }[] };
    const [badge, check] = group.children.map((n) => n.props);
    return { badge, check };
  };

  it('draws the creator tick purple at the size it is given, default 15, with a white check at stroke 2.4', async () => {
    await render(<VerifiedTick kind="creator" />);
    expect(screen.getByTestId('tick-creator').props).toMatchObject({ width: 15, height: 15 });
    const { badge, check } = shapes('tick-creator');
    expect(badge).toMatchObject({ fill: argb(darkColors.tickCreator), stroke: argb(darkColors.tickCreator), strokeWidth: 1.5 });
    expect(check).toMatchObject({ fill: null, stroke: argb('#FFFFFF'), strokeWidth: 2.4 });
  });

  it('draws the professional tick blue at 24, the size M1 gives the prompt card', async () => {
    await render(<VerifiedTick kind="pro" size={24} />);
    expect(screen.getByTestId('tick-pro').props).toMatchObject({ width: 24, height: 24 });
    expect(shapes('tick-pro').badge).toMatchObject({ fill: argb(darkColors.tickProfessional) });
  });
});

describe('the showcase', () => {
  it('shows every chip: option chips and each status pill', async () => {
    await render(<Showcase />);
    expect(screen.getByTestId('showcase-option-chips')).toBeTruthy();
    for (const label of ['Completed', 'Pending', 'Failed', 'Frozen', 'WAWU pick', 'Removed']) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
  });
});
