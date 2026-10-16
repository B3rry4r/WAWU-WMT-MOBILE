/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react-native';
import type { ComponentType } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/*
 * FIX-14 (KYC-03 R3-1): on the web, A5's consent box must say whether it is ticked. react-native-web 0.21.3 reads
 * `aria-checked`, not `accessibilityState`, and a phone's Pressable folds `aria-checked` into the state before the host
 * view sees it, so the host cannot tell the two apart. This file watches the props the screen hands the Pressable.
 */

const mockPressableProps: Record<string, unknown>[] = [];
jest.mock('react-native/Libraries/Components/Pressable/Pressable', () => {
  const React = require('react');
  const actual = jest.requireActual('react-native/Libraries/Components/Pressable/Pressable');
  const Watched = React.forwardRef(function Watched(props: Record<string, unknown>, ref: unknown) {
    mockPressableProps.push(props);
    return React.createElement(actual.default, { ...props, ref });
  });
  return { __esModule: true, default: Watched };
});

const mockVault = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockVault.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockVault.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockVault.delete(key);
  }),
}));

const OWNER = '00000000-0000-4000-8000-0000000000c1';
const identity = { bvn: { last4: '0111', verifiedAt: '2026-10-03T10:00:00.000Z' }, ninLast4: '0999', occupation: null, checksLeft: 2 };
const prefill = { firstName: 'Ada', middleName: 'B', lastName: 'Eze', dateOfBirth: '1992-10-04', gender: 'female' as const };

globalThis.fetch = jest.fn(async () => new Response(JSON.stringify({ statusCode: 200, message: 'OK', data: identity }), { status: 200, headers: { 'content-type': 'application/json' } })) as typeof fetch;

function tokenFor(sub: string) {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'RS256' })}.${part({ sub })}.signature`;
}

const clients: QueryClient[] = [];

beforeEach(() => {
  mockPressableProps.length = 0;
  mockVault.clear();
  mockVault.set('wawu.session.access', tokenFor(OWNER));
  mockVault.set('wawu.session.refresh', 'refresh-1');
  const kept = require('../keptCheck') as typeof import('../keptCheck');
  kept.forgetKeptCheck();
  kept.keepCheck(kept.ticketFor(OWNER), { checkHandle: 'v1.k03-test-handle', identity, prefill });
  (require('@/api/session') as typeof import('@/api/session')).resetSessionForTests();
});

afterEach(async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  await cleanup();
  clients.splice(0).forEach((client) => client.clear());
});

/** The props of the latest draw of the consent box's Pressable. */
const consentBox = () => [...mockPressableProps].reverse().find((props) => props.testID === 'open-wallet-consent') as Record<string, unknown>;

describe('A5 · the consent box on the web', () => {
  it('hands the Pressable aria-checked beside accessibilityState, and both follow the tick', async () => {
    const { ConfirmDetailsScreen } = require('../ConfirmDetailsScreen') as { ConfirmDetailsScreen: ComponentType<Record<string, unknown>> };
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } } });
    clients.push(client);
    await render(
      <QueryClientProvider client={client}>
        <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
          <ConfirmDetailsScreen onBack={jest.fn()} onContinue={jest.fn()} onRestart={jest.fn()} onLeave={jest.fn()} />
        </SafeAreaProvider>
      </QueryClientProvider>,
    );
    await screen.findByTestId('open-wallet-from-bvn');

    expect(consentBox()['aria-checked']).toBe(false);
    expect(consentBox().accessibilityRole).toBe('checkbox');
    await fireEvent.press(screen.getByTestId('open-wallet-consent'));
    expect(consentBox()['aria-checked']).toBe(true);
    expect(consentBox().accessibilityState).toMatchObject({ checked: true });
    await fireEvent.press(screen.getByTestId('open-wallet-consent'));
    expect(consentBox()['aria-checked']).toBe(false);
    expect(consentBox().accessibilityState).toMatchObject({ checked: false });
  });
});
