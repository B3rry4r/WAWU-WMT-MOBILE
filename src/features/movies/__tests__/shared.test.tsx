import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { SegmentedTabs } from '@/components/SegmentedTabs';
import { ErrorState } from '@/components/StateViews';
import { StatusPill } from '@/components/StatusPill';
import { darkColors, lightColors } from '@/theme/tokens.generated';

import { FilterSheet } from '../FilterSheet';
import { noFilter } from '../api';

jest.mock('@/api/client', () => ({ api: { GET: jest.fn(() => new Promise(() => undefined)), POST: jest.fn() }, unwrap: (p: Promise<{ data: unknown }>) => p.then((r) => r.data) }));

const items = [
  { value: 'a', label: 'Newest' },
  { value: 'b', label: 'Most watched' },
] as const;

describe('FLIX-03 · the optional props added to shared components keep their defaults', () => {
  it('SegmentedTabs: a label is one line unless wrapLabels is given, then two (M1)', async () => {
    const { rerender } = await render(<SegmentedTabs items={items} value="a" onChange={jest.fn()} label="Sort" />);
    expect(screen.getByText('Most watched').props.numberOfLines).toBe(1);
    await rerender(<SegmentedTabs items={items} value="a" onChange={jest.fn()} label="Sort" wrapLabels />);
    expect(screen.getByText('Most watched').props.numberOfLines).toBe(2);
  });

  it('the filter sheet lets "Most watched" wrap as MV7 draws it (M1)', async () => {
    await render(<FilterSheet visible filter={noFilter} options={null} onApply={jest.fn()} onClose={jest.fn()} />);
    expect(screen.getByText('Most watched').props.numberOfLines).toBe(2);
  });

  it('ErrorState: the retry button is secondary unless a variant is given, then that one (M2)', async () => {
    const { rerender } = await render(<ErrorState title="No" message="Try" onRetry={jest.fn()} />);
    expect([darkColors.surfaceCard, lightColors.surfaceCard]).toContain(StyleSheet.flatten(screen.getByRole('button', { name: 'Try again' }).props.style).backgroundColor);
    await rerender(<ErrorState title="No" message="Try" onRetry={jest.fn()} actionVariant="primary" />);
    expect(StyleSheet.flatten(screen.getByRole('button', { name: 'Try again' }).props.style).backgroundColor).toBe(darkColors.accent);
  });

  it('StatusPill: hugs its words unless stretch is given (low)', async () => {
    const { rerender } = await render(<StatusPill testID="pill" label="Premieres Fri 24 Oct" tone="accent" />);
    expect(StyleSheet.flatten(screen.getByTestId('pill').props.style).alignSelf).toBe('flex-start');
    await rerender(<StatusPill testID="pill" label="Premieres Fri 24 Oct" tone="accent" stretch />);
    expect(StyleSheet.flatten(screen.getByTestId('pill').props.style).alignSelf).toBe('stretch');
  });
});
