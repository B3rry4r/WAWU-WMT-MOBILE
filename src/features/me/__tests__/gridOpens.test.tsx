/* eslint-disable @typescript-eslint/no-require-imports */
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const { ContentGrid } = require('@/features/me/ContentGrid') as typeof import('@/features/me/ContentGrid');

const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };
const frame = (children: React.ReactNode) => <SafeAreaProvider initialMetrics={metrics}>{children}</SafeAreaProvider>;
const tile = (id: string, draft: boolean) => ({ id, title: id, still: null, kind: 'pdf' as const, locked: false, caption: id, spoken: draft ? `${id}, draft` : `${id}, free`, draft });

// WALK-FIX H1 (29 Oct walk): a published tile in the grid is the way into the piece (design M5). It was a plain View.
describe('WALK-FIX H1 · a published tile opens its piece', () => {
  it('a published tile is pressable and hands its id to the opener; a draft keeps the shop opener', async () => {
    const onOpenPiece = jest.fn();
    const onOpenDraft = jest.fn();
    await render(frame(<ContentGrid tiles={[tile('d1', true), tile('p1', false), tile('p2', false)]} onOpenDraft={onOpenDraft} onOpenPiece={onOpenPiece} />));
    await fireEvent.press(screen.getByTestId('me-tile-p2'));
    expect(onOpenPiece).toHaveBeenCalledWith('p2');
    expect(screen.getByTestId('me-tile-p1').props.accessibilityRole).toBe('button');
    await fireEvent.press(screen.getByTestId('me-tile-d1'));
    expect(onOpenDraft).toHaveBeenCalledTimes(1);
    expect(onOpenPiece).toHaveBeenCalledTimes(1);
  });

  it('a draft never opens the piece page, even with no shop opener', async () => {
    const onOpenPiece = jest.fn();
    await render(frame(<ContentGrid tiles={[tile('d1', true)]} onOpenPiece={onOpenPiece} />));
    await fireEvent.press(screen.getByTestId('me-tile-d1'));
    expect(onOpenPiece).not.toHaveBeenCalled();
  });
});
