/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';
import { Platform } from 'react-native';

import { renderSignedIn, resetApp } from '@/features/store/testing/screen';

/*
 * HOME-SELF: Home's "Who Made This?" rail draws the viewer's own card (it opens their profile) and never a Follow on it; another creator's
 * card keeps Follow, which works. While the viewer's own id is not known no card can be told apart, so none draws Follow. The real
 * `CreatorRail` on Platform.OS android, the Hub as a stand-in `fetch` recording what was sent.
 */
jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(async () => null), setItemAsync: jest.fn(async () => undefined), deleteItemAsync: jest.fn(async () => undefined) }));
jest.mock('@/features/explore/interestLabel', () => ({ useInterestLabel: () => () => null }));

const ME = '00000000-0000-4000-8000-0000000000aa';
const ADA = '00000000-0000-4000-8000-0000000000a1';
const tick = (verified: boolean) => ({ verified, expiresAt: null });
const person = (wawuId: string, name: string) => ({ wawuId, name, handle: null, avatarUrl: null, field: null, pieceCount: 1, verification: { creator: tick(false), professional: tick(false) }, following: false });

let sent: string[] = [];
beforeEach(() => {
  sent = [];
  jest.replaceProperty(Platform, 'OS', 'android');
  globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(String(input), init);
    sent.push(`${request.method} ${new URL(request.url).pathname.replace(/^\/api\/hub/, '')}`);
    return new Response(JSON.stringify({ statusCode: 200, message: 'OK', data: { following: request.method === 'POST' } }), { status: 200, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;
});
afterEach(async () => {
  await rtl.act(async () => new Promise((r) => setTimeout(r, 0)));
  rtl.cleanup();
  resetApp();
  jest.restoreAllMocks();
});

async function draw(myId: string | null) {
  const { CreatorRail } = require('@/features/home/CreatorRail') as typeof import('@/features/home/CreatorRail');
  await renderSignedIn(<CreatorRail creators={[person(ME, 'Me Myself'), person(ADA, 'Ada O.')]} myId={myId} onRetry={() => undefined} retrying={false} onOpenCreator={() => undefined} />);
}

describe('HOME-SELF · the rail on Android', () => {
  it('the viewer\'s own card stays and has no Follow; another creator\'s Follow still works', async () => {
    await draw(ME);
    expect(rtl.screen.getByTestId(`today-creator-${ME}`)).toBeTruthy();
    expect(rtl.screen.queryByTestId(`today-follow-${ME}`)).toBeNull();
    const follow = rtl.screen.getByTestId(`today-follow-${ADA}`);
    expect(follow).toHaveTextContent('Follow');
    await rtl.act(async () => rtl.fireEvent.press(follow));
    // The rail sends the follow for the card it was pressed on (the list itself is the screen's, so the label is not read back here).
    await rtl.waitFor(() => expect(sent).toEqual([`POST /creators/${ADA}/follow`]));
  });

  it('until the viewer\'s own id is known no card draws Follow (an own card cannot be told from another)', async () => {
    await draw(null);
    expect(rtl.screen.getByTestId(`today-creator-${ME}`)).toBeTruthy();
    expect(rtl.screen.queryByTestId(`today-follow-${ME}`)).toBeNull();
    expect(rtl.screen.queryByTestId(`today-follow-${ADA}`)).toBeNull();
  });
});
