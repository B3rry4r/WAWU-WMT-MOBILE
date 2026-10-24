/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

jest.mock('expo-router', () => ({ useIsFocused: () => true, useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true }) }));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));
jest.mock('@/api/session', () => ({
  ...jest.requireActual('@/api/session'),
  getAccessToken: async () => 'access-1',
  refreshAccessToken: async () => null,
  isCurrentSessionToken: () => true,
}));
jest.mock('@/api/tokenStore', () => ({
  ...jest.requireActual('@/api/tokenStore'),
  loadTokens: async () => ({ accessToken: 'access-1', refreshToken: 'refresh-1' }),
}));

type Answer = { status: number; body: unknown } | 'offline';
let answers: Record<string, Answer> = {};

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const answer = answers[`${request.method} ${url.pathname}`];
  if (!answer) return new Response(JSON.stringify({ statusCode: 404, message: 'Not Found', data: null }), { status: 404 });
  if (answer === 'offline') throw new TypeError('Network request failed');
  return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

const ok = (data: unknown): Answer => ({ status: 200, body: { statusCode: 200, message: 'OK', data } });
const ME = 'GET /api/hub/users/me';

const { queryClient } = require('@/api/query') as typeof import('@/api/query');
const { SettingsEntry } = require('../SettingsEntry') as typeof import('../SettingsEntry');
const { ComposeEntry } = require('@/features/community-host/ComposeEntry') as typeof import('@/features/community-host/ComposeEntry');
const { InboxScreen } = require('@/features/inbox/InboxScreen') as typeof import('@/features/inbox/InboxScreen');
const { ServicesTab } = require('@/features/me/ServicesTab') as typeof import('@/features/me/ServicesTab');
const { ListingsScreen } = require('@/features/pro-listing/ListingsScreen') as typeof import('@/features/pro-listing/ListingsScreen');

const clients: QueryClient[] = [];
async function frame(child: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false }, mutations: { retry: false } } });
  clients.push(client);
  return render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <QueryClientProvider client={client}>{child}</QueryClientProvider>
    </SafeAreaProvider>,
  );
}

beforeEach(() => {
  answers = {};
});
afterEach(async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  await cleanup();
  clients.splice(0).forEach((c) => c.clear());
  queryClient.clear();
});

describe('I1: the settings button in the Inbox header', () => {
  it('a creator sees it and it opens the paid message settings', async () => {
    answers[ME] = ok({ accountType: 'creator' });
    const onOpen = jest.fn();
    await frame(<SettingsEntry onOpen={onOpen} />);
    const button = await screen.findByLabelText('Paid message settings');
    fireEvent.press(button);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('a plain account, an account with no type and a failed read see nothing (R-47)', async () => {
    for (const answer of [ok({ accountType: 'user' }), ok({ accountType: null }), 'offline' as Answer, { status: 500, body: { statusCode: 500, message: 'Server error', data: null } }]) {
      answers[ME] = answer;
      const view = await frame(<SettingsEntry onOpen={jest.fn()} />);
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 60));
      });
      expect(screen.queryByLabelText('Paid message settings')).toBeNull();
      await view.unmount();
      queryClient.clear();
    }
  });

  it('the Inbox title row carries what it is given at its right, and nothing when given nothing', async () => {
    answers[ME] = ok({ accountType: 'creator' });
    await frame(<InboxScreen headerActions={<SettingsEntry onOpen={jest.fn()} />} />);
    expect(screen.getByRole('header', { name: 'Inbox' })).toBeTruthy();
    expect(await screen.findByLabelText('Paid message settings')).toBeTruthy();
    await cleanup();
    queryClient.clear();
    await frame(<InboxScreen />);
    expect(screen.getByRole('header', { name: 'Inbox' })).toBeTruthy();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 60));
    });
    expect(screen.queryByLabelText('Paid message settings')).toBeNull();
  });
});

describe('I1: the compose pencil in the Inbox header (INBOX-14)', () => {
  it('a creator sees it and it opens I32, New community', async () => {
    answers[ME] = ok({ accountType: 'creator' });
    const onOpen = jest.fn();
    await frame(<ComposeEntry onOpen={onOpen} />);
    fireEvent.press(await screen.findByLabelText('New community'));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('a plain account, an account with no type and a failed read see nothing: only creators host (R-47)', async () => {
    for (const answer of [ok({ accountType: 'user' }), ok({ accountType: null }), 'offline' as Answer]) {
      answers[ME] = answer;
      const view = await frame(<ComposeEntry onOpen={jest.fn()} />);
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 60));
      });
      expect(screen.queryByLabelText('New community')).toBeNull();
      await view.unmount();
      queryClient.clear();
    }
  });
});

describe('M2: the paid messages row on Services', () => {
  const paid = { priceLine: '₦1,500 a message', replyLine: 'replies within 24 hours' };

  it('opens the settings with the chevron the other rows have, when a way in is given', async () => {
    const onOpenPaid = jest.fn();
    await frame(<ServicesTab paid={paid} listings={[]} onOpenPaid={onOpenPaid} />);
    const row = screen.getByTestId('me-service-paid-open');
    expect(row.props.accessibilityRole).toBe('button');
    expect(screen.getByTestId('icon-ChevronRight', { includeHiddenElements: true })).toBeTruthy();
    fireEvent.press(row);
    expect(onOpenPaid).toHaveBeenCalledTimes(1);
  });

  it('is a plain card with no press and no chevron when no way in is given', async () => {
    await frame(<ServicesTab paid={paid} listings={[]} />);
    expect(screen.queryByTestId('me-service-paid-open')).toBeNull();
    expect(screen.queryByTestId('icon-ChevronRight', { includeHiddenElements: true })).toBeNull();
    expect(screen.getByTestId('me-service-paid')).toBeTruthy();
  });
});

describe('P8: Inbox settings in the note on Your listings', () => {
  const application = {
    id: 'a1',
    status: 'approved',
    reviewedAt: '2026-10-02T10:00:00.000Z',
    category: 'finance',
    documents: [],
    wawuUserId: 'u1',
    headline: 'Chartered accountant, 9 years',
    about: 'I help creators and small businesses file taxes and keep books.',
    submittedAt: '2026-10-01T10:00:00.000Z',
    rejectionReason: null,
    services: ['Tax filing'],
    credentialKind: 'licence',
    licenceNumber: 'ICAN/2016/40921',
    issuingBody: 'ICAN',
    listed: true,
  };
  const field = { id: 'accounting_tax', label: 'Accounting & Tax', applyCategory: 'finance', categories: ['finance'], regulated: true };

  beforeEach(() => {
    answers[ME] = ok({ accountType: 'creator' });
    answers['GET /api/hub/professionals/fields'] = ok([field]);
    answers['GET /api/hub/professionals/applications/mine'] = ok([application]);
  });

  it('a user can tap Inbox settings in the note to open them', async () => {
    const onOpenInboxSettings = jest.fn();
    await frame(<ListingsScreen onBack={jest.fn()} onApply={jest.fn()} onOpenInboxSettings={onOpenInboxSettings} />);
    expect(await screen.findByText('People reach you through paid messages')).toBeTruthy();
    const link = screen.getByTestId('pro-paid-note-open');
    expect(link.props.accessibilityRole).toBe('link');
    fireEvent.press(link);
    expect(onOpenInboxSettings).toHaveBeenCalledTimes(1);
  });

  it('keeps the note as plain words when no way in is given', async () => {
    await frame(<ListingsScreen onBack={jest.fn()} onApply={jest.fn()} />);
    expect(await screen.findByText('Set your price and reply time in Inbox settings.')).toBeTruthy();
    expect(screen.queryByTestId('pro-paid-note-open')).toBeNull();
    await waitFor(() => expect(screen.getByTestId('pro-paid-note')).toBeTruthy());
  });
});
