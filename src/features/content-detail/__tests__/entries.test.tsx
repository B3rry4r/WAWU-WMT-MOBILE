import * as rtl from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { FeedItem } from '@/features/feed/api';
import { Byline } from '@/features/feed/parts';
import { ContentRow } from '@/features/search/parts';

/*
 * The two entries this task adds (HOME-03): a feed post's caption (H2) and a content result on Search (X6) open the piece's own page.
 * Each is drawn only when something is wired to it (R-47).
 */
const frame = (node: React.ReactElement) => (
  <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>{node}</SafeAreaProvider>
);

const item = {
  id: 'p1',
  title: 'The Freelancer’s Pricing Playbook',
  description: 'How to price your work.',
  creator: { wawuId: 'k', displayName: 'Kemi Okafor', handle: 'kemi', avatarUrl: null, verification: { creator: { verified: true, expiresAt: null }, professional: { verified: false, expiresAt: null } } },
} as unknown as FeedItem;

describe('the caption on a feed post (H2)', () => {
  it('a user presses the caption and the piece is opened', async () => {
    const open = jest.fn();
    await rtl.render(frame(<Byline item={item} follows={false} onOpen={open} />));
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Open The Freelancer’s Pricing Playbook' }));
    expect(open).toHaveBeenCalledTimes(1);
  });

  it('draws no button when nothing is wired', async () => {
    await rtl.render(frame(<Byline item={item} follows={false} />));
    expect(rtl.screen.getByText('How to price your work.')).toBeTruthy();
    expect(rtl.screen.queryByRole('button')).toBeNull();
  });
});

describe('a content result on Search (X6)', () => {
  const row = { id: 'p1', title: 'The Freelancer’s Pricing Playbook', byline: 'Kemi Okafor · PDF', thumb: null, locked: true, priceKobo: 300000 };

  it('a user presses the result and the piece is opened', async () => {
    const open = jest.fn();
    await rtl.render(frame(<ContentRow row={row} testID="r" onPress={open} />));
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: /The Freelancer’s Pricing Playbook, Kemi Okafor · PDF, paid/ }));
    expect(open).toHaveBeenCalledTimes(1);
  });

  it('draws no button when nothing is wired', async () => {
    await rtl.render(frame(<ContentRow row={row} testID="r" />));
    expect(rtl.screen.queryByRole('button')).toBeNull();
  });
});
