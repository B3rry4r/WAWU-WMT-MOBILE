/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';
import { Share } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/**
 * SWEEP-FLOWS B12: I33's link is a full address a person can send, `https://wawuafrica.com/c/<slug>` (the invite card's form: shown
 * without its scheme, copied and shared with it), never the Hub's `wawu/c/<slug>`.
 */
const mockCopied: string[] = [];
jest.mock('@/features/open-wallet/copy', () => ({
  copyText: async (text: string) => {
    mockCopied.push(text);
    return true;
  },
}));

globalThis.fetch = jest.fn(async () =>
  new Response(
    JSON.stringify({
      statusCode: 200,
      message: 'OK',
      data: { id: 'room-1', name: 'Lagos photographers', kind: 'open', imageUrl: null, description: 'About', hostWawuId: 'me', memberCount: 1, messagesToday: 0, slug: 'lagos-photographers', link: 'wawu/c/lagos-photographers', role: 'host', messageCostInCredits: 0 },
    }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  ),
) as typeof fetch;

const { CreatedScreen } = require('../CreatedScreen') as typeof import('../CreatedScreen');
const { queryClient } = require('@/api/query') as typeof import('@/api/query');

afterEach(() => {
  queryClient.clear();
  mockCopied.length = 0;
});

async function boot() {
  await rtl.render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <CreatedScreen id="room-1" onOpenRoom={jest.fn()} />
    </SafeAreaProvider>,
  );
}

describe('I33 · the community link a person sends', () => {
  it('shows the address without its scheme, copies the full link and shares the full link', async () => {
    const share = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' } as never);
    await boot();
    expect(await rtl.screen.findByText('wawuafrica.com/c/lagos-photographers')).toBeTruthy();
    expect(rtl.screen.queryByText('wawu/c/lagos-photographers')).toBeNull();
    await rtl.fireEvent.press(rtl.screen.getByTestId('created-copy'));
    await rtl.waitFor(() => expect(mockCopied).toEqual(['https://wawuafrica.com/c/lagos-photographers']));
    await rtl.fireEvent.press(rtl.screen.getByTestId('created-share'));
    expect(share).toHaveBeenCalledWith({ message: 'https://wawuafrica.com/c/lagos-photographers' });
    share.mockRestore();
  });
});
