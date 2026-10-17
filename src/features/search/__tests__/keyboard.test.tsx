/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */
import { QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

jest.mock('expo-router', () => ({ useIsFocused: () => true }));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

type Answer = { status: number; body: unknown } | 'offline';
let answers: Record<string, Answer[]> = {};
let sent: string[] = [];
let bodies: Record<string, unknown[]> = {};

const ok = (data: unknown, status = 200): Answer => ({ status, body: { statusCode: status, message: 'OK', data } });

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const key = `${request.method} ${url.pathname.replace(/^\/api\/hub/, '')}`;
  sent.push(`${key}${url.search}`);
  if (request.method === 'POST') (bodies[key] ??= []).push(await request.clone().json().catch(() => null));
  const queue = answers[key];
  const answer = queue?.[0];
  if (queue && queue.length > 1) queue.shift();
  if (!answer) throw new Error(`no answer for ${key}`);
  if (answer === 'offline') throw new TypeError('Network request failed');
  return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

const { queryClient } = require('@/api/query') as typeof import('@/api/query');
const { SearchScreen } = require('../SearchScreen') as typeof import('../SearchScreen');
const { ExploreBar } = require('@/features/explore/ExploreBar') as typeof import('@/features/explore/ExploreBar');
const { CategoriesScreen } = require('@/features/explore/CategoriesScreen') as typeof import('@/features/explore/CategoriesScreen');
const { CreatorRail } = require('@/features/home/CreatorRail') as typeof import('@/features/home/CreatorRail');
const { contentRows, countsOf, namedCreators, peopleMap, personIds, typeLabel } = require('../model') as typeof import('../model');

const ticks = (creator: boolean, professional: boolean) => ({ creator: { verified: creator, expiresAt: null }, professional: { verified: professional, expiresAt: null } });
const person = (wawuId: string, name: string, over: Record<string, unknown> = {}) => ({
  wawuId, name, handle: name.split(' ')[0].toLowerCase(), avatarUrl: null, field: 'Business strategist', verification: ticks(true, false), following: false, ...over,
});
const profile = (wawuUserId: string) => ({ wawuUserId, handle: wawuUserId });
const piece = (id: string, creatorWawuId: string, title: string, over: Record<string, unknown> = {}) => ({
  id, title, creatorWawuId, contentType: 'pdf', accessType: 'paid', price: 3000, previewAssetUrl: '', fullAssetLocked: true, ...over,
});
const room = (id: string, name: string, kind: 'open' | 'private', memberCount: number) => ({ id, name, kind, imageUrl: null, description: '', hostWawuId: 'h', memberCount, messagesToday: 0 });

const SUGGEST = 'GET /search/suggestions';
const POPULAR = 'GET /search/popular';
const SEARCH = 'GET /search';
const PEOPLE = 'GET /search/people';

const kemi = person('c-kemi', 'Kemi Okafor');
const adaeze = person('c-adaeze', 'Adaeze Okonkwo');
const funmi = person('c-funmi', 'Funmi Adeyemi', { following: true, verification: ticks(false, true) });

function landing(over: { recent?: string[]; popular?: string[]; known?: unknown[]; people?: unknown[] } = {}) {
  answers[SUGGEST] = [ok({ recentSearches: over.recent ?? ['pricing playbook', 'Funmi'], popularSearches: ['NEVER SHOWN'], suggestedCreators: over.known ?? [profile('c-adaeze')] })];
  answers[POPULAR] = [ok({ items: over.popular ?? ['tax filing', 'VFX course'] })];
  answers[PEOPLE] = [ok({ items: over.people ?? [adaeze] })];
}

function results() {
  answers[SEARCH] = [
    ok({
      content: [
        piece('p1', 'c-kemi', 'The Freelancer’s Pricing Playbook'),
        piece('p2', 'c-adaeze', 'How to price your first shoot', { accessType: 'free', price: 0, fullAssetLocked: false, contentType: 'video' }),
        piece('p3', 'c-kemi', 'Rate card template', { price: 1500, contentType: 'template' }),
        piece('p4', 'c-kemi', 'Pricing beats', { price: 1000, contentType: 'audio' }),
      ],
      creators: [profile('c-adaeze'), profile('c-funmi'), profile('c-hidden')],
      communities: [room('r-open', 'Lagos Freelancers', 'open', 1204), room('r-private', 'Pricing clinic', 'private', 380)],
    }),
  ];
  answers[PEOPLE] = [ok({ items: [adaeze, funmi, kemi] })];
}

function wrap(children: ReactNode) {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, left: 0, right: 0, bottom: 34 } }}>{children}</SafeAreaProvider>
    </QueryClientProvider>
  );
}

const onCancel = jest.fn();
const onOpenRoom = jest.fn();
const screen = () => rtl.render(wrap(<SearchScreen onCancel={onCancel} onOpenRoom={onOpenRoom} />));
const type = (text: string) => rtl.fireEvent.changeText(rtl.screen.getByTestId('search-input'), text);
const submit = (text: string) => rtl.fireEvent(rtl.screen.getByTestId('search-input'), 'submitEditing', { nativeEvent: { text } });

afterEach(async () => {
  await queryClient.cancelQueries();
  await rtl.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  rtl.cleanup();
  // A finished follow waits five minutes in the mutation cache before it is collected; that timer would keep jest open.
  queryClient.getMutationCache().getAll().forEach((mutation) => mutation.destroy());
  queryClient.clear();
});

beforeEach(() => {
  answers = { 'GET /users/me': [ok({ wawuUserId: 'me-1' })] };
  sent = [];
  bodies = {};
  onCancel.mockClear();
  onOpenRoom.mockClear();
  queryClient.clear();
});

describe('the keyboard’s search key', () => {
  it('searches at once and remembers the text the keyboard holds', async () => {
    landing();
    results();
    answers['POST /search/recent'] = [ok({ items: ['pricing'] }, 201)];
    await screen();
    await rtl.screen.findByText('pricing playbook');
    await submit('pricing');
    await rtl.screen.findByTestId('search-tab-all');
    expect(bodies['POST /search/recent']).toEqual([{ q: 'pricing' }]);
    expect(sent.some((s) => s.startsWith('GET /search?q=pricing'))).toBe(true);
  });
});
