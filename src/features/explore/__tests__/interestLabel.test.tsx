/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import type { ReactElement } from 'react';

/*
 * R2-SOCIAL3 (CHECK-3 social pass 3, defect 3): a creator row's line under the name is the label of the interest the Hub names in `field`
 * (the same list sign-up draws), on Home's rail, Search's Creators tab and Explore's cards. An id the list does not know shows nothing,
 * never the raw id ("business_entrepreneurship").
 */
const SIGN_UP_LIST = {
  minimum: 3,
  options: [
    { id: 'music_audio', label: 'Music & Audio' },
    { id: 'business_finance', label: 'Business & Finance' },
  ],
  selected: [],
};
let list: 'ok' | 'fail' = 'ok';
globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  if (request.method === 'GET' && url.pathname === '/api/hub/users/me/interests' && list === 'ok') {
    return new Response(JSON.stringify({ statusCode: 200, message: 'OK', data: SIGN_UP_LIST }), { status: 200, headers: { 'content-type': 'application/json' } });
  }
  return new Response(JSON.stringify({ statusCode: 500, message: 'no', data: null }), { status: 500, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

const clients: QueryClient[] = [];
async function show(node: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  clients.push(client);
  return rtl.render(<QueryClientProvider client={client}>{node}</QueryClientProvider>);
}
afterEach(() => clients.splice(0).forEach((c) => c.clear()));
beforeEach(() => {
  list = 'ok';
});

const ticks = { creator: { verified: true, expiresAt: null }, professional: { verified: false, expiresAt: null } };
const searchPerson = (field: string | null) => ({ wawuId: 'c1', name: 'Bisi Ade', handle: 'bisi', avatarUrl: null, field, pieceCount: 1, verification: ticks, following: false, badge: null });
const exploreCreator = (field: string | null) => ({ wawuId: 'c1', name: 'Bisi Ade', handle: 'bisi', avatarUrl: null, field, pieceCount: 1, verification: ticks, following: false, badge: null });
const suggestion = (field: string | null) => ({ wawuId: 'c1', name: 'Bisi Ade', handle: 'bisi', avatarUrl: null, field, pieceCount: 1, verification: ticks, following: false, badge: null });

describe('the line under a creator name is the interest label', () => {
  it('Search Creators: "Music & Audio", not music_audio', async () => {
    const { PersonRow } = require('@/features/search/parts') as typeof import('@/features/search/parts');
    await show(<PersonRow person={searchPerson('music_audio') as never} />);
    expect(await rtl.screen.findByText('Music & Audio')).toBeTruthy();
    expect(rtl.screen.queryByText('music_audio')).toBeNull();
  });

  it('Search Creators: an unknown id shows nothing, not the id', async () => {
    const { PersonRow } = require('@/features/search/parts') as typeof import('@/features/search/parts');
    await show(<PersonRow person={searchPerson('business_entrepreneurship') as never} />);
    await rtl.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(rtl.screen.queryByText('business_entrepreneurship')).toBeNull();
    expect(rtl.screen.getByText('Bisi Ade')).toBeTruthy();
  });

  it('Explore card: the label, and nothing for an unknown id', async () => {
    const { CreatorCard } = require('@/features/explore/CreatorCard') as typeof import('@/features/explore/CreatorCard');
    await show(<CreatorCard creator={exploreCreator('business_finance') as never} />);
    expect(await rtl.screen.findByText('Business & Finance')).toBeTruthy();
    expect(rtl.screen.queryByText('business_finance')).toBeNull();
    await rtl.screen.unmount();
    await show(<CreatorCard creator={exploreCreator('business_entrepreneurship') as never} />);
    await rtl.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(rtl.screen.queryByText('business_entrepreneurship')).toBeNull();
  });

  it('Home rail: the label, and nothing for an unknown id or while the list has not come', async () => {
    const { CreatorRail } = require('@/features/home/CreatorRail') as typeof import('@/features/home/CreatorRail');
    await show(<CreatorRail creators={[suggestion('music_audio') as never]} onRetry={jest.fn()} retrying={false} />);
    expect(await rtl.screen.findByText('Music & Audio')).toBeTruthy();
    expect(rtl.screen.queryByText('music_audio')).toBeNull();
    await rtl.screen.unmount();
    await show(<CreatorRail creators={[suggestion('business_entrepreneurship') as never]} onRetry={jest.fn()} retrying={false} />);
    expect(rtl.screen.queryByText('business_entrepreneurship')).toBeNull();
    await rtl.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(rtl.screen.queryByText('business_entrepreneurship')).toBeNull();
  });

  it('a list that could not be read leaves the line out, never the id', async () => {
    list = 'fail';
    const { PersonRow } = require('@/features/search/parts') as typeof import('@/features/search/parts');
    await show(<PersonRow person={searchPerson('music_audio') as never} />);
    await rtl.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(rtl.screen.queryByText('music_audio')).toBeNull();
    expect(rtl.screen.getByText('Bisi Ade')).toBeTruthy();
  });
});
