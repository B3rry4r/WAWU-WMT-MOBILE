import { fireEvent, render, screen, userEvent, within } from '@testing-library/react-native';
import { useState } from 'react';
import { Platform } from 'react-native';

import { Avatar, initialsOf } from '@/components/Avatar';
import { BottomSheet, sheetMetrics } from '@/components/BottomSheet';
import { Card, GroupedList } from '@/components/Card';
import { ConversationRow } from '@/components/ConversationRow';
import { chipMetrics, FilterChips } from '@/components/FilterChips';
import { KeyValueRow, ListRow, ListSection, rowMetrics } from '@/components/ListRow';
import { mediaMetrics, MediaCard } from '@/components/MediaCard';
import { SegmentedTabs, segmentMetrics } from '@/components/SegmentedTabs';
import { LoadingView, Skeleton, SkeletonRows } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { TransactionRow } from '@/components/TransactionRow';
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

/** Decorative icons, and what sits behind a modal sheet (its backdrop), are hidden from a screen reader but still there to touch. */
const hiddenOk = { includeHiddenElements: true };
const flat = (style: unknown): Record<string, unknown> => Object.assign({}, ...[style].flat(Infinity).filter(Boolean));

const filters = [
  { value: 'all', label: 'All' },
  { value: 'in', label: 'Money in' },
  { value: 'out', label: 'Money out' },
] as const;

function Filters({ onPick }: { onPick?: (v: string) => void }) {
  const [value, setValue] = useState<(typeof filters)[number]['value']>('all');
  return (
    <FilterChips
      label="Filter transactions"
      items={filters}
      value={value}
      onChange={(v) => {
        setValue(v);
        onPick?.(v);
      }}
    />
  );
}

describe('filter chips', () => {
  it('lets a user pick Money out, and only that chip is on afterwards', async () => {
    const onPick = jest.fn();
    await render(<Filters onPick={onPick} />);
    expect(screen.getByRole('radio', { name: 'All' }).props.accessibilityState.checked).toBe(true);
    await userEvent.press(screen.getByRole('radio', { name: 'Money out' }));
    expect(onPick).toHaveBeenCalledWith('out');
    expect(screen.getByRole('radio', { name: 'Money out' }).props.accessibilityState.checked).toBe(true);
    expect(screen.getByRole('radio', { name: 'All' }).props.accessibilityState.checked).toBe(false);
    expect(screen.getByLabelText('Filter transactions')).toBeTruthy();
  });

  it('shows the chosen chip in ink on a dark phone and on a light phone, from the same component', async () => {
    const { unmount } = await render(<Filters />);
    expect(flat(screen.getByRole('radio', { name: 'All' }).props.style).backgroundColor).toBe(darkColors.textPrimary);
    expect(flat(screen.getByRole('radio', { name: 'Money in' }).props.style).borderColor).toBe(darkColors.borderStrong);
    await unmount();
    mockScheme = 'light';
    await render(<Filters />);
    expect(flat(screen.getByRole('radio', { name: 'All' }).props.style).backgroundColor).toBe(lightColors.textPrimary);
    expect(flat(screen.getByRole('radio', { name: 'Money in' }).props.style).borderColor).toBe(lightColors.borderStrong);
  });

  it('draws a chip 36 high with 15 either side', async () => {
    await render(<Filters />);
    const chip = flat(screen.getByRole('radio', { name: 'Money in' }).props.style);
    expect(chip.height).toBe(36);
    expect(chip.paddingHorizontal).toBe(15);
    expect(chipMetrics.font).toBe(14);
  });
});

describe('segmented tabs', () => {
  function Tabs() {
    const [value, setValue] = useState<'today' | 'foryou'>('today');
    return (
      <SegmentedTabs
        label="Feed"
        items={[
          { value: 'today', label: 'Today' },
          { value: 'foryou', label: 'For you' },
        ]}
        value={value}
        onChange={setValue}
      />
    );
  }

  it('lets a user switch tab and tells a screen reader which one is selected', async () => {
    await render(<Tabs />);
    expect(screen.getByRole('tab', { name: 'Today' }).props.accessibilityState.selected).toBe(true);
    await userEvent.press(screen.getByRole('tab', { name: 'For you' }));
    expect(screen.getByRole('tab', { name: 'For you' }).props.accessibilityState.selected).toBe(true);
    expect(screen.getByRole('tab', { name: 'Today' }).props.accessibilityState.selected).toBe(false);
    expect(screen.getByLabelText('Feed').props.accessibilityRole).toBe('tablist');
  });

  it('raises the chosen segment on a card and leaves the others on the sunken track', async () => {
    await render(<Tabs />);
    expect(flat(screen.getByRole('tab', { name: 'Today' }).props.style).backgroundColor).toBe(darkColors.surfaceCard);
    expect(flat(screen.getByRole('tab', { name: 'For you' }).props.style).backgroundColor).toBe('transparent');
    const track = flat(screen.getByLabelText('Feed').props.style);
    expect(track.backgroundColor).toBe(darkColors.surfaceSunken);
    expect(track.padding).toBe(4);
    expect(flat(screen.getByRole('tab', { name: 'Today' }).props.style).height).toBe(segmentMetrics.height - 8);
  });
});

describe('bottom sheet', () => {
  it('shows a user the sheet and its content only while it is open', async () => {
    const { rerender } = await render(
      <BottomSheet visible={false} onClose={() => undefined} label="Unlock">
        <Text>Price</Text>
      </BottomSheet>,
    );
    expect(screen.queryByText('Price')).toBeNull();
    await rerender(
      <BottomSheet visible onClose={() => undefined} label="Unlock">
        <Text>Price</Text>
      </BottomSheet>,
    );
    expect(screen.getByText('Price')).toBeTruthy();
    expect(screen.getByLabelText('Unlock').props.role).toBe('dialog');
  });

  it('lets a user close the sheet by tapping the backdrop', async () => {
    const onClose = jest.fn();
    await render(
      <BottomSheet visible onClose={onClose} label="Unlock" testID="sheet">
        <Text>Price</Text>
      </BottomSheet>,
    );
    await userEvent.press(screen.getByTestId('sheet-backdrop', hiddenOk));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('lets a screen reader or keyboard user close the sheet with its close control', async () => {
    const onClose = jest.fn();
    await render(
      <BottomSheet visible onClose={onClose} label="Unlock">
        <Text>Price</Text>
      </BottomSheet>,
    );
    await userEvent.press(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on the Android back button and the web Escape key, which both arrive as a close request', async () => {
    const onClose = jest.fn();
    await render(
      <BottomSheet visible onClose={onClose} label="Unlock">
        <Text>Price</Text>
      </BottomSheet>,
    );
    await fireEvent(screen.root!, 'requestClose');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps a user from dismissing a sheet while something is in flight', async () => {
    const onClose = jest.fn();
    await render(
      <BottomSheet visible onClose={onClose} label="Unlock" dismissible={false} testID="sheet">
        <Text>Paying</Text>
      </BottomSheet>,
    );
    await userEvent.press(screen.getByTestId('sheet-backdrop', hiddenOk));
    await userEvent.press(screen.getByRole('button', { name: 'Close' }));
    await fireEvent(screen.root!, 'requestClose');
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText('Paying')).toBeTruthy();
  });

  it('draws the sheet with the design corners, grabber and scrim', async () => {
    await render(
      <BottomSheet visible onClose={() => undefined} label="Unlock" testID="sheet">
        <Text>Price</Text>
      </BottomSheet>,
    );
    const sheet = flat(screen.getByTestId('sheet').props.style);
    expect(sheet.borderTopLeftRadius).toBe(radius.sheet);
    expect(sheet.borderTopRightRadius).toBe(radius.sheet);
    expect(sheet.backgroundColor).toBe(darkColors.surfaceElevated);
    expect(sheet.paddingBottom).toBe(sheetMetrics.padBottom);
    const grabber = flat(screen.getByTestId('sheet-close').props.style);
    expect(grabber.width).toBe(40);
    expect(grabber.height).toBe(5);
    expect(flat(screen.getByTestId('sheet-backdrop', hiddenOk).props.style).backgroundColor).toBe(darkColors.surfaceScrim);
  });

  it('shows a keyboard user a ring on the close control, and a mouse user none', async () => {
    const original = Platform.OS;
    jest.replaceProperty(Platform, 'OS', 'web');
    await render(
      <BottomSheet visible onClose={() => undefined} label="Unlock">
        <Text>Price</Text>
      </BottomSheet>,
    );
    const close = screen.getByRole('button', { name: 'Close' });
    await fireEvent(close, 'focus', { target: { matches: () => false } });
    expect(flat(screen.getByRole('button', { name: 'Close' }).props.style).boxShadow).toBeUndefined();
    await fireEvent(close, 'blur');
    await fireEvent(close, 'focus', { target: { matches: () => true } });
    expect(flat(screen.getByRole('button', { name: 'Close' }).props.style).boxShadow).toContain(darkColors.accentFg);
    jest.replaceProperty(Platform, 'OS', original);
  });
});

describe('grouped lists', () => {
  it('puts one hairline between rows and none around a single row', async () => {
    const { unmount } = await render(
      <GroupedList testID="three">
        <KeyValueRow label="Price" value="₦2,500" />
        <KeyValueRow label="Yours" value="Forever" />
        <KeyValueRow label="Fee" value="₦23.25" />
      </GroupedList>,
    );
    const dividers = (id: string) =>
      screen.getByTestId(id).children.filter((c) => typeof c !== 'string' && flat((c as unknown as { props: { style: unknown } }).props.style).backgroundColor === darkColors.borderHairline);
    expect(dividers('three')).toHaveLength(2);
    await unmount();
    await render(
      <GroupedList testID="one">
        <KeyValueRow label="Price" value="₦2,500" />
      </GroupedList>,
    );
    expect(dividers('one')).toHaveLength(0);
  });

  it('shows a user a key and its value, read out together', async () => {
    await render(<KeyValueRow label="Price" value="₦2,500" testID="kv" />);
    expect(screen.getByText('Price')).toBeTruthy();
    expect(screen.getByText('₦2,500')).toBeTruthy();
    expect(flat(screen.getByTestId('kv').props.style).minHeight).toBe(rowMetrics.pairMinHeight);
  });

  it('lets a user open a row, and only a row that opens shows a chevron', async () => {
    const onPress = jest.fn();
    await render(
      <GroupedList>
        <ListRow title="Transaction PIN" subtitle="Change or reset it" onPress={onPress} testID="open" />
        <ListRow title="Read only" testID="plain" />
      </GroupedList>,
    );
    await userEvent.press(screen.getByRole('button', { name: 'Transaction PIN, Change or reset it' }));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(within(screen.getByTestId('open')).getByTestId('icon-ChevronRight', hiddenOk)).toBeTruthy();
    expect(within(screen.getByTestId('plain')).queryByTestId('icon-ChevronRight', hiddenOk)).toBeNull();
    expect(screen.queryByRole('button', { name: 'Read only' })).toBeNull();
  });

  it('draws a row at least 64 high and a card with the 22 corner and a hairline edge', async () => {
    await render(
      <Card testID="card">
        <ListRow title="Row" testID="row" />
      </Card>,
    );
    expect(flat(screen.getByTestId('row').props.style).minHeight).toBe(64);
    const card = flat(screen.getByTestId('card').props.style);
    expect(card.borderRadius).toBe(radius.card);
    expect(card.borderColor).toBe(darkColors.borderHairline);
    expect(card.backgroundColor).toBe(darkColors.surfaceCard);
  });

  it('gives a screen reader each day as a heading above its rows', async () => {
    await render(
      <ListSection title="Today">
        <ListRow title="Row" />
      </ListSection>,
    );
    expect(screen.getByRole('header', { name: 'Today' })).toBeTruthy();
  });
});

describe('transaction rows', () => {
  it('shows a user money out as minus and money in as plus in green, and reads the whole line out', async () => {
    const { unmount } = await render(
      <TransactionRow title="Chidinma Okoro" subtitle="Transfer · GTBank" amountMinor={-2506500} time="11:02" icon="ArrowUpRight" />,
    );
    expect(screen.getByLabelText('Chidinma Okoro, Transfer · GTBank, −₦25,065.00, 11:02')).toBeTruthy();
    expect(screen.getByLabelText('minus 25,065 naira')).toBeTruthy();
    await unmount();
    await render(<TransactionRow title="Amaka Nwosu" amountMinor={200000} time="10:24" lead={<Avatar name="Amaka Nwosu" decorative />} />);
    expect(screen.getByLabelText('Amaka Nwosu, +₦2,000.00, 10:24')).toBeTruthy();
    expect(flat(screen.getByLabelText('plus 2,000 naira').props.style).color).toBe(darkColors.positive);
  });

  it('lets a user open a transaction to see its receipt', async () => {
    const onPress = jest.fn();
    await render(<TransactionRow title="MTN airtime" amountMinor={-200000} icon="Smartphone" onPress={onPress} />);
    await userEvent.press(screen.getByRole('button', { name: /MTN airtime/ }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('conversation rows', () => {
  it('tells a user how many messages are unread, on the badge and to a screen reader', async () => {
    await render(<ConversationRow name="Amaka Nwosu" preview="Sent you ₦5,000" time="10:24" kind="money" unread={2} />);
    expect(screen.getByLabelText('Amaka Nwosu, Sent you ₦5,000, 10:24, 2 unread')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
    expect(flat(screen.getByText('10:24').props.style).color).toBe(darkColors.accentFg);
  });

  it('shows a read conversation quietly: no badge, muted time and a secondary preview', async () => {
    await render(<ConversationRow name="Femi Bankole" preview="You: Thanks, got it" time="Yest." />);
    expect(screen.getByLabelText('Femi Bankole, You: Thanks, got it, Yest.')).toBeTruthy();
    expect(flat(screen.getByText('Yest.').props.style).color).toBe(darkColors.textMuted);
    expect(flat(screen.getByText('You: Thanks, got it').props.style).color).toBe(darkColors.textSecondary);
  });

  it('caps a very large unread count at 99+ and lets a user open the chat', async () => {
    const onPress = jest.fn();
    await render(<ConversationRow name="Lagos Freelancers" preview="Tolu: hi" time="09:12" unread={140} onPress={onPress} />);
    expect(screen.getByText('99+')).toBeTruthy();
    await userEvent.press(screen.getByRole('button', { name: /Lagos Freelancers/ }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('media cards', () => {
  it('draws a sheet header thumbnail at 56 with a 14 corner, and a shelf card at 150 by 200 with a 20 corner', async () => {
    const { unmount } = await render(<MediaCard title="How I built a ₦2M a month agency" subtitle="Chidi Eze" testID="row" />);
    const thumb = flat((screen.getByTestId('row').children[0] as unknown as { props: { style: unknown } }).props.style);
    expect(thumb).toMatchObject({ width: mediaMetrics.thumb, height: mediaMetrics.thumb, borderRadius: 14 });
    await unmount();
    await render(<MediaCard layout="stacked" title="Lighting night shoots" testID="stacked" />);
    const cover = flat((screen.getByTestId('stacked').children[0] as unknown as { props: { style: unknown } }).props.style);
    expect(cover).toMatchObject({ width: 150, height: 200, borderRadius: radius.media });
  });

  it('lets a user open a card, and reads its title and maker', async () => {
    const onPress = jest.fn();
    await render(<MediaCard title="Pricing a wedding film" subtitle="Video · 18 min" onPress={onPress} />);
    await userEvent.press(screen.getByRole('button', { name: 'Pricing a wedding film, Video · 18 min' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('people and badges', () => {
  it('shows a person as their initials, or W for WAWU', async () => {
    expect(initialsOf('Amaka Nwosu')).toBe('AN');
    expect(initialsOf('chidi')).toBe('C');
    expect(initialsOf(' Ada  Obi Eze ')).toBe('AO');
    expect(initialsOf()).toBe('W');
    await render(<Avatar name="Amaka Nwosu" hue="green" />);
    expect(screen.getByLabelText('Amaka Nwosu')).toBeTruthy();
    expect(screen.getByText('AN')).toBeTruthy();
    expect(flat(screen.getByLabelText('Amaka Nwosu').props.style).backgroundColor).toBe(darkColors.hueGreen);
  });

  it('tells a screen reader a conversation is with a verified account, and which kind', async () => {
    const { unmount } = await render(<ConversationRow name="Chidi Eze" preview="Hi" time="09:51" tick="pro" />);
    expect(screen.getByLabelText('Chidi Eze, verified professional, Hi, 09:51')).toBeTruthy();
    expect(screen.getByTestId('tick-pro')).toBeTruthy();
    await unmount();
    await render(<ConversationRow name="Amaka" preview="Hi" time="09:51" tick="creator" />);
    expect(screen.getByLabelText('Amaka, verified creator, Hi, 09:51')).toBeTruthy();
  });
});

describe('loading, empty and error views', () => {
  it('tells a user, and a screen reader, that content is loading, without showing a made-up figure', async () => {
    await render(<SkeletonRows count={3} testID="rows" />);
    const loading = screen.getByRole('progressbar', { name: 'Loading' });
    expect(loading.props.accessibilityState.busy).toBe(true);
    expect(screen.queryByText(/\d/)).toBeNull();
  });

  it('keeps a skeleton block the size it is given, on the sunken colour', async () => {
    await render(
      <LoadingView label="Loading Explore">
        <Skeleton testID="hero" height={196} radius={24} />
      </LoadingView>,
    );
    expect(screen.getByRole('progressbar', { name: 'Loading Explore' })).toBeTruthy();
    expect(flat(screen.getByTestId('hero').props.style)).toMatchObject({ height: 196, borderRadius: 24, backgroundColor: darkColors.surfaceSunken });
  });

  it('shows a user nothing-here-yet with the one thing they can do about it', async () => {
    const onPress = jest.fn();
    await render(
      <EmptyState title="No messages yet" message="Message a creator from their profile." action={{ label: 'Browse communities', onPress }} />,
    );
    expect(screen.getByRole('header', { name: 'No messages yet' })).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
    await userEvent.press(screen.getByRole('button', { name: 'Browse communities' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('tells a user a request failed, and lets them try again', async () => {
    const onRetry = jest.fn();
    await render(<ErrorState title="Search isn't working right now" message="Check your connection and try again." onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toBeTruthy();
    await userEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('offers no retry button when there is nothing to run again', async () => {
    await render(<ErrorState title="Something went wrong" message="Try again later." />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('showcase of lists, sheets and states', () => {
  it('lets a developer reach the loading, empty and error views, and retry from the error', async () => {
    await render(<Showcase />);
    const states = screen.getByLabelText('State');
    await userEvent.press(within(states).getByRole('tab', { name: 'Loading' }));
    expect(within(screen.getByTestId('showcase-state-view')).getByRole('progressbar', { name: 'Loading' })).toBeTruthy();
    await userEvent.press(within(states).getByRole('tab', { name: 'Empty' }));
    expect(within(screen.getByTestId('showcase-state-view')).getByText('No messages yet')).toBeTruthy();
    await userEvent.press(within(states).getByRole('tab', { name: 'Error' }));
    await userEvent.press(within(screen.getByTestId('showcase-state-view')).getByRole('button', { name: 'Try again' }));
    expect(within(screen.getByTestId('showcase-state-view')).getByRole('progressbar', { name: 'Loading' })).toBeTruthy();
    expect(screen.getByText('Tried again 1 times')).toBeTruthy();
  });

  it('lets a developer open the unlock sheet and close it again', async () => {
    await render(<Showcase />);
    expect(screen.queryByLabelText('Unlock')).toBeNull();
    await userEvent.press(screen.getByRole('button', { name: 'Open the unlock sheet' }));
    expect(screen.getByLabelText('Unlock').props.role).toBe('dialog');
    await userEvent.press(screen.getByTestId('showcase-sheet-close'));
    expect(screen.queryByLabelText('Unlock')).toBeNull();
  });
});
