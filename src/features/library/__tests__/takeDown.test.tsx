/* eslint-disable @typescript-eslint/no-require-imports */
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';

import { allowance, calls, hub, installFetch, noContent, ok, piece, refusal, renderFrame } from '../__helpers__/hub';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));
jest.mock('expo-router', () => ({
  useFocusEffect: (run: () => void) => {
    require('react').useEffect(run, [run]);
  },
}));

installFetch();
const { allowanceKey } = require('@/features/create/api') as typeof import('@/features/create/api');
const { LibraryScreen } = require('../LibraryScreen') as typeof import('../LibraryScreen');

const LIST = '/api/hub/content/mine/library';
const COUNTS = '/api/hub/content/mine/library/counts';
const ALLOWANCE = '/api/hub/uploads/allowance';

const page = (items: unknown[]) => ok(items, { currentPage: 1, nextPage: null, perPage: 20, total: items.length });
const live = piece({ id: 'w1', title: 'How I light a night shoot', status: 'live', salesCount: 18 });
const waiting = piece({ id: 'e2', title: 'Pricing playbook v3', status: 'pending', contentType: 'pdf', salesCount: 0 });
const turnedDown = piece({ id: 'r1', title: 'Pricing playbook', status: 'rejected', contentType: 'pdf', rejectionReason: 'Not ours.' });

// Owner hard rule 2: a phone path is proven as a phone.
const realOS = Platform.OS;
const PHONE = process.env.CT_WEB ? realOS : 'android';
beforeAll(() => {
  Platform.OS = PHONE as typeof Platform.OS;
});
afterAll(() => {
  Platform.OS = realOS;
});

const open = async () => {
  const handlers = { back: jest.fn(), create: jest.fn(), seeWhy: jest.fn(), openPiece: jest.fn() };
  const view = await renderFrame(<LibraryScreen onBack={handlers.back} onCreate={handlers.create} onSeeWhy={handlers.seeWhy} onOpenPiece={handlers.openPiece} />);
  return { ...handlers, ...view };
};

beforeEach(() => {
  installFetch();
  hub.answers[`GET ${ALLOWANCE}`] = ok(allowance(5, 5));
  hub.answers[`GET ${COUNTS}`] = ok({ all: 3, live: 1, pending: 1, rejected: 1 });
  hub.answers[`GET ${LIST}`] = page([live, waiting, turnedDown]);
});

describe('CREATOR-TAKEDOWN · My content', () => {
  it('a creator with every place used takes a live piece down: a confirm first, one DELETE, and the lists and the count are read again', async () => {
    hub.answers['DELETE /api/hub/content/w1'] = noContent;
    const handlers = await open();
    handlers.queryClient.setQueryData(allowanceKey, ok(allowance(5, 5)).body.data);
    expect(await screen.findByText('5 of 5 used')).toBeTruthy();
    await fireEvent.press(await screen.findByTestId('library-takedown-w1'));
    expect(await screen.findByText('Take this down?')).toBeTruthy();
    expect(screen.getByText(/People who already bought it keep it/)).toBeTruthy();
    expect(calls('DELETE', '/api/hub/content/w1')).toHaveLength(0);

    // The Hub now holds one fewer, and says so on the reads that follow.
    hub.answers[`GET ${LIST}`] = page([waiting, turnedDown]);
    hub.answers[`GET ${ALLOWANCE}`] = ok(allowance(4, 5));
    await fireEvent.press(screen.getByTestId('library-takedown-confirm'));
    await waitFor(() => expect(calls('DELETE', '/api/hub/content/w1')).toHaveLength(1));
    await waitFor(() => expect(screen.queryByText('How I light a night shoot')).toBeNull());
    expect(await screen.findByText('4 of 5 used')).toBeTruthy();
    expect(screen.queryByText('Take this down?')).toBeNull();
  });

  it('a piece in review is taken down the same way, with words for review', async () => {
    hub.answers['DELETE /api/hub/content/e2'] = noContent;
    await open();
    await fireEvent.press(await screen.findByTestId('library-takedown-e2'));
    expect(await screen.findByText('It leaves review and your place is free again.')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('library-takedown-confirm'));
    await waitFor(() => expect(calls('DELETE', '/api/hub/content/e2')).toHaveLength(1));
  });

  it('Keep it sends nothing, and a turned-down piece carries no take-down here (it is deleted from its own screen)', async () => {
    await open();
    await fireEvent.press(await screen.findByTestId('library-takedown-w1'));
    await fireEvent.press(screen.getByTestId('library-takedown-keep'));
    expect(calls('DELETE', '/api/hub/content/w1')).toHaveLength(0);
    expect(screen.queryByTestId('library-takedown-r1')).toBeNull();
  });

  it('a second tap in the same moment sends once', async () => {
    let answer: () => void = () => undefined;
    hub.answers['DELETE /api/hub/content/w1'] = new Promise((resolve) => {
      answer = () => resolve(noContent);
    });
    await open();
    await fireEvent.press(await screen.findByTestId('library-takedown-w1'));
    const confirm = screen.getByTestId('library-takedown-confirm');
    await fireEvent.press(confirm);
    await fireEvent.press(confirm);
    answer();
    await waitFor(() => expect(calls('DELETE', '/api/hub/content/w1')).toHaveLength(1));
  });

  it('says so when the Hub will not take it down, and keeps the piece', async () => {
    hub.answers['DELETE /api/hub/content/w1'] = refusal(409, 'This piece changed while you removed it. Try again.');
    await open();
    await fireEvent.press(await screen.findByTestId('library-takedown-w1'));
    await fireEvent.press(screen.getByTestId('library-takedown-confirm'));
    expect(await screen.findByText('This piece changed while you removed it. Try again.')).toBeTruthy();
    expect(screen.getByTestId('library-row-w1')).toBeTruthy();
  });

  it('a piece that is already down (another phone) reads as done: it leaves the list', async () => {
    hub.answers['DELETE /api/hub/content/w1'] = refusal(404, 'Content not found');
    await open();
    await fireEvent.press(await screen.findByTestId('library-takedown-w1'));
    hub.answers[`GET ${LIST}`] = page([waiting, turnedDown]);
    await fireEvent.press(screen.getByTestId('library-takedown-confirm'));
    await waitFor(() => expect(screen.queryByText('How I light a night shoot')).toBeNull());
  });
});
