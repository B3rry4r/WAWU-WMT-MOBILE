import { render, screen } from '@testing-library/react-native';
import { StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { chipIconMetrics, chipMetrics, FilterChips, optionChipMetrics } from '@/components/FilterChips';
import { MediaCard, mediaMetrics } from '@/components/MediaCard';

/*
 * FIX-14: the shared follow-ups SHARED-03 left. R1, the row chip's outline takes no room; N1, a decorative avatar and the
 * card placeholder are hidden from a screen reader on the web (react-native-web reads only `aria-hidden`).
 */

const flat = (style: unknown): Record<string, number | string | undefined> => Object.assign({}, ...[style].flat(Infinity).filter(Boolean));
const styleOf = (node: unknown) => flat((node as { props: { style: unknown } }).props.style);
const hiddenOk = { includeHiddenElements: true };

const plain = [
  { value: 'all', label: 'All' },
  { value: 'photo', label: 'Photography' },
] as const;
const withIcons = [
  { value: 'all', label: 'All', icon: 'LayoutGrid' },
  { value: 'photo', label: 'Photography', icon: 'Camera' },
  { value: 'music', label: 'Music' },
] as const;

/** What the canvas measures from the chip's edge to its label: the padding, and the border that is inside it. */
const across = (node: unknown) => {
  const s = styleOf(node);
  const border = Number(s.borderWidth);
  return { start: Number(s.paddingLeft ?? s.paddingHorizontal) + border, end: Number(s.paddingRight ?? s.paddingHorizontal) + border, border };
};

describe('R1 · a row chip draws its outline without taking room', () => {
  it('is 15 from each edge to the label, on a chip that is on and a chip that is off', async () => {
    await render(<FilterChips label="Kinds" items={plain} value="all" onChange={() => undefined} testID="row" />);
    for (const id of ['row-all', 'row-photo']) {
      const { start, end, border } = across(screen.getByTestId(id));
      expect(border).toBe(StyleSheet.hairlineWidth);
      expect([start, end]).toEqual([chipMetrics.padH, chipMetrics.padH]);
    }
  });

  it('keeps the outline on both states, so a chip does not change size when it is picked', async () => {
    await render(<FilterChips label="Kinds" items={plain} value="all" onChange={() => undefined} testID="row" />);
    const on = styleOf(screen.getByTestId('row-all'));
    const off = styleOf(screen.getByTestId('row-photo'));
    expect(on.borderWidth).toBe(off.borderWidth);
    expect(on.paddingHorizontal).toBe(off.paddingHorizontal);
    expect(on.borderColor).toBe('transparent');
  });

  it('is 11 at the start and 14 at the end on every chip of an icon row, with or without an icon of its own', async () => {
    await render(<FilterChips label="Categories" items={withIcons} value="all" onChange={() => undefined} testID="row" />);
    for (const id of ['row-all', 'row-photo', 'row-music']) {
      const { start, end } = across(screen.getByTestId(id));
      expect([start, end]).toEqual([chipIconMetrics.padStart, chipIconMetrics.padEnd]);
    }
  });

  it('leaves the option chips in a sheet as they were: 14 across with the 1 px outline counted in', async () => {
    await render(<FilterChips variant="option" label="Kinds" items={plain} value="all" onChange={() => undefined} testID="opt" />);
    const { start, end, border } = across(screen.getByTestId('opt-photo'));
    expect(border).toBe(optionChipMetrics.border);
    expect([start, end]).toEqual([optionChipMetrics.padH, optionChipMetrics.padH]);
  });
});

describe('N1 · what a screen reader on the web skips', () => {
  it('hides a decorative avatar with aria-hidden, which is the only hiding the web reads, and the two native props', async () => {
    await render(<Avatar name="Amaka Nwosu" decorative testID="av" />);
    const props = screen.getByTestId('av', hiddenOk).props;
    expect(props['aria-hidden']).toBe(true);
    expect(props.accessibilityElementsHidden).toBe(true);
    expect(props.importantForAccessibility).toBe('no-hide-descendants');
    expect(props.accessibilityLabel).toBeUndefined();
  });

  it('keeps an avatar that is not decorative as an image with its name, and does not hide it', async () => {
    await render(<Avatar name="Amaka Nwosu" testID="av" />);
    const props = screen.getByTestId('av').props;
    expect(props['aria-hidden']).toBeUndefined();
    expect(props.accessibilityRole).toBe('image');
    expect(props.accessibilityLabel).toBe('Amaka Nwosu');
  });

  it("hides a creator card's placeholder (the initials of someone with no photo) the same way", async () => {
    await render(
      <MediaCard layout="stacked" title="Emeka" subtitle="Photographer" testID="card" placeholder={<Avatar name="Emeka N" size={mediaMetrics.placeholderAvatar} decorative />} />,
    );
    const slot = screen.getByTestId('card-placeholder', hiddenOk).props;
    expect(slot['aria-hidden']).toBe(true);
    expect(slot.accessibilityElementsHidden).toBe(true);
    expect(slot.importantForAccessibility).toBe('no-hide-descendants');
  });

  it('draws no placeholder slot, hidden or not, on a card with a picture', async () => {
    await render(<MediaCard layout="stacked" title="Emeka" subtitle="Photographer" testID="card" imageUrl="https://example.test/e.jpg" placeholder={<View />} />);
    expect(screen.queryByTestId('card-placeholder', hiddenOk)).toBeNull();
  });
});
