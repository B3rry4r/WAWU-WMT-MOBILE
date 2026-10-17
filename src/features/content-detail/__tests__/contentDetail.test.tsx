/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import { userEvent } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/*
 * A piece's own page (HOME-03: H19 to H23, HOME-08: H24, H25), with the Hub as a stand-in `fetch` that answers in the Hub's shapes
 * and records every write. It is told what it holds (a paid PDF, a free video, a paid course) and what the viewer has done.
 */
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const ok = (data: unknown, extra: Record<string, unknown> = {}) => json(200, { statusCode: 200, message: 'OK', data, ...extra });
const refuse = (status: number, message: string, reason: Record<string, unknown> = {}) => json(status, { data: null, statusCode: status, message, reason });

const ME = '00000000-0000-4000-8000-0000000000aa';
const KEMI = '00000000-0000-4000-8000-0000000000c1';
const TIFE = '00000000-0000-4000-8000-0000000000c2';
const PDF = 'pdf-1';
const VIDEO = 'video-1';
const COURSE = 'course-1';
const PAYMENT = '88888888-8888-4888-8888-888888888888';
const tick = (verified: boolean) => ({ verified, expiresAt: null });
const verification = { creator: tick(true), professional: tick(false) };

const maker = (wawuId: string, name: string, headline: string, followerCount: number) => ({ wawuId, displayName: name, handle: name.split(' ')[0].toLowerCase(), avatarUrl: null, verification, headline, followerCount });

const base = {
  status: 'live',
  createdAt: '2026-09-02T10:00:00Z',
  slug: 'a-piece',
  description: 'The words.',
  category: 'business_entrepreneurship',
  specializations: [],
  tags: [],
  creatorFirstUploadFree: false,
  ratingPct: null,
  likes: 1200,
  commentCount: 48,
};

type Hold = { piece: Record<string, unknown>; detail: Record<string, unknown> };
const lessons = Array.from({ length: 12 }, (_, i) => ({ id: `l${i + 1}`, title: `Lesson ${i + 1}`, order: i + 1, durationLabel: i === 0 ? '9:00' : '14:00', isFree: i === 0 }));

const pieces = (): Record<string, Hold> => ({
  [PDF]: {
    piece: { ...base, id: PDF, title: 'The Freelancer’s Pricing Playbook', creatorWawuId: KEMI, contentType: 'pdf', accessType: 'paid', price: 3000, durationLabel: null, pageCount: 84, previewAssetUrl: 'https://cdn.test/p.pdf', views: 2140, fullAssetUrl: hub.bought ? 'https://cdn.test/full.pdf' : null, fullAssetLocked: !hub.bought },
    detail: { contentId: PDF, contentType: 'pdf', updatedAt: '2026-09-20T10:00:00Z', purchasedAt: hub.bought ? '2026-09-26T08:00:00Z' : null, buyerCount: 12, studentCount: null, freePreview: { pages: 4, seconds: null, lessons: null }, lessons: [], creator: maker(KEMI, 'Kemi Okafor', 'Business coach', 22000) },
  },
  [VIDEO]: {
    piece: { ...base, id: VIDEO, title: 'Orbit shot in one take', creatorWawuId: TIFE, contentType: 'video', accessType: 'free', price: 0, durationLabel: '1:50', pageCount: null, previewAssetUrl: 'https://cdn.test/v.webm', views: 12400, createdAt: new Date(Date.now() - 3 * 86400000).toISOString(), fullAssetUrl: 'https://cdn.test/v.webm', fullAssetLocked: false, commentCount: 340 },
    detail: { contentId: VIDEO, contentType: 'video', updatedAt: '2026-10-10T10:00:00Z', purchasedAt: null, buyerCount: 0, studentCount: null, freePreview: { pages: null, seconds: null, lessons: null }, lessons: [], creator: maker(TIFE, 'Tife Adeola', 'VFX artist', 41000) },
  },
  [COURSE]: {
    piece: { ...base, id: COURSE, title: 'VFX for Beginners', creatorWawuId: TIFE, contentType: 'course', accessType: 'paid', price: 8000, durationLabel: null, pageCount: null, previewAssetUrl: 'https://cdn.test/c.jpg', views: 800, fullAssetUrl: null, fullAssetLocked: true, commentCount: 0 },
    detail: { contentId: COURSE, contentType: 'course', updatedAt: '2026-10-01T10:00:00Z', purchasedAt: null, buyerCount: 1280, studentCount: 1280, freePreview: { pages: null, seconds: null, lessons: 1 }, lessons, creator: maker(TIFE, 'Tife Adeola', 'VFX artist', 41000) },
  },
});

const comment = (id: string, who: string, text: string, replyToId: string | null, extra: Record<string, unknown> = {}) => ({
  id,
  createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  contentId: PDF,
  likes: 24,
  text,
  authorWawuId: who,
  replyToId,
  author: { wawuId: who, verification, name: who === KEMI ? 'Kemi Okafor' : who === 'emeka' ? 'Emeka Obi' : 'Bisi Akande', handle: null, avatarUrl: null },
  likedByMe: false,
  ...extra,
});

const hub = {
  bought: false,
  balanceKobo: 48_525_000,
  engagement: { likes: 1200, views: 2140, shares: 3, commentCount: 48, likedByMe: false, savedByMe: false, followsCreator: false },
  rating: { average: null as number | null, count: 0, myRating: null as number | null },
  comments: [] as ReturnType<typeof comment>[],
  noComments: false,
  commentsFail: false,
  postFails: false,
  posts: [] as Record<string, unknown>[],
  ratings: [] as number[],
  shares: 0,
  unlocks: [] as { key: string | null; pin: string | null }[],
  sends: [] as { chatId: string; text: string; id: string }[],
  writes: [] as string[],
  gone: false,
  loadFails: false,
  noWallet: false,
};

const FEE = 2325;
const quote = (price: number) => ({
  contentId: PDF,
  title: 'The Freelancer’s Pricing Playbook',
  creator: { wawuUserId: KEMI, displayName: 'Kemi Okafor', handle: 'kemi', avatarUrl: null, tick: 'creator' },
  priceKobo: price,
  payment: {
    kind: 'content_unlock',
    targetId: PDF,
    title: 'The Freelancer’s Pricing Playbook',
    payee: null,
    priceKobo: price,
    fee: { providerFeeKobo: FEE, wawuFeeKobo: 0, totalFeeKobo: FEE },
    totalKobo: price + FEE,
    balanceKobo: hub.balanceKobo,
    shortfallKobo: null,
    willBeHeld: false,
    withinDailyLimit: true,
    remainingTodayKobo: null,
    quoteToken: 'tok',
    expiresAt: '2099-01-01T00:00:00.000Z',
  },
});
const unlockView = () => ({
  id: PAYMENT,
  method: 'wallet',
  contentId: PDF,
  title: 'The Freelancer’s Pricing Playbook',
  status: 'paid',
  statusMessage: null,
  priceKobo: 300000,
  purchased: true,
  fullAssetUrl: 'https://cdn.test/full.pdf',
  payment: { id: PAYMENT, kind: 'content_unlock', targetId: PDF, title: 'x', status: 'completed', priceKobo: 300000, fee: { providerFeeKobo: FEE, wawuFeeKobo: 0, totalFeeKobo: FEE }, totalKobo: 300000 + FEE, reference: 'WAW-UNL-4K2P', hold: null, failureReason: null, delivered: true, statusMessage: null, createdAt: '2026-10-17T09:42:00.000Z', completedAt: '2026-10-17T09:42:05.000Z' },
  createdAt: '2026-10-17T09:42:00.000Z',
  paidAt: '2026-10-17T09:42:05.000Z',
});

const chat = (id: string, name: string, canMessage = true) => ({
  id,
  other: { wawuId: `w-${id}`, name, handle: null, avatarUrl: null, verification },
  createdAt: '2026-10-01T00:00:00Z',
  lastActivityAt: '2026-10-16T00:00:00Z',
  lastMessage: null,
  unreadCount: 0,
  myLastReadAt: null,
  otherLastReadAt: null,
  canMessage,
});
const chatsList = [chat('c1', 'Amaka Nwosu'), chat('c2', 'Chidi Eze'), chat('c3', 'Bisi Akande'), chat('c4', 'Tolu Balogun'), chat('c5', 'Ngozi Ade'), chat('c6', 'Closed Chat', false)];

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/hub/, '');
  const method = request.method;
  if (method !== 'GET') hub.writes.push(`${method} ${path}`);
  if (path === '/users/me') return ok({ wawuUserId: ME });
  if (path === '/money/wallet/balance' && hub.noWallet) return refuse(409, 'Open your wallet first.', { code: 'no_wallet' });
  if (path === '/money/wallet/balance') return ok({ availableKobo: hub.balanceKobo, asOf: '2026-10-17T09:00:00.000Z' });
  if (path === '/chats' && method === 'GET') return ok({ items: chatsList, nextCursor: null });
  const send = /^\/chats\/([^/]+)\/messages$/.exec(path);
  if (send && method === 'POST') {
    const body = (await request.json()) as { text: string; clientMessageId: string };
    hub.sends.push({ chatId: send[1], text: body.text, id: body.clientMessageId });
    return json(201, { statusCode: 201, message: 'Created', data: { id: 'm1' } });
  }
  const follows = /^\/creators\/([^/]+)\/follow$/.exec(path);
  if (follows) return json(method === 'POST' ? 201 : 200, { statusCode: 200, message: 'OK', data: { following: method === 'POST' } });
  const m = /^\/content\/([^/]+)(\/.*)?$/.exec(path);
  if (!m) throw new Error(`no answer for ${method} ${path}`);
  const [, id, rest = ''] = m;
  const hold = pieces()[id];
  if (hub.gone) return refuse(404, 'Content not found');
  if (hub.loadFails && rest === '') return refuse(500, 'Something went wrong');
  if (!hold) throw new Error(`no piece ${id}`);
  if (rest === '' && method === 'GET') return ok(hold.piece);
  if (rest === '/detail') return ok({ ...hold.detail, rating: { ...hub.rating, canRate: hub.bought || hold.piece.accessType === 'free', cannotRateReason: hub.bought || hold.piece.accessType === 'free' ? null : 'not_purchased' } });
  if (rest === '/engagement') return ok({ ...hub.engagement, commentCount: hold.piece.commentCount });
  if (rest === '/media') return ok({ contentId: id, contentType: hold.piece.contentType, durationLabel: hold.piece.durationLabel, pageCount: hold.piece.pageCount, frameCount: 0, frames: [] });
  if (rest === '/view') return ok({ views: 1, counted: true });
  if (rest === '/like') {
    const on = method === 'POST';
    hub.engagement = { ...hub.engagement, likedByMe: on, likes: hub.engagement.likes + (on ? 1 : -1) };
    return ok({ likes: hub.engagement.likes, likedByMe: on });
  }
  if (rest === '/save') {
    hub.engagement = { ...hub.engagement, savedByMe: method === 'POST' };
    return json(method === 'POST' ? 201 : 200, { statusCode: 200, message: 'OK', data: {} });
  }
  if (rest === '/share') {
    hub.shares += 1;
    return ok({ shares: hub.shares, counted: true });
  }
  if (rest === '/rating') {
    const body = (await request.json()) as { rating: number };
    hub.ratings.push(body.rating);
    hub.rating = { average: body.rating, count: 1, myRating: body.rating };
    return ok({ ...hub.rating, canRate: true, cannotRateReason: null });
  }
  if (rest === '/comments' && method === 'GET') {
    if (hub.commentsFail) return refuse(500, 'Something went wrong');
    return ok(hub.noComments ? [] : hub.comments, { pagination: { currentPage: 1, nextPage: null, perPage: 20, total: hub.comments.length } });
  }
  if (rest === '/comments' && method === 'POST') {
    const body = (await request.json()) as { text: string; replyToId?: string };
    if (hub.postFails) return refuse(500, 'Something went wrong');
    hub.posts.push(body);
    const made = comment(`new-${hub.posts.length}`, ME, body.text, body.replyToId ?? null, { likes: 0 });
    hub.comments = [...hub.comments, made];
    return json(201, { statusCode: 201, message: 'Created', data: made });
  }
  const like = /^\/comments\/([^/]+)\/like$/.exec(rest);
  if (like) return ok({ likes: method === 'POST' ? 25 : 24, likedByMe: method === 'POST' });
  if (rest === '/unlock/wallet/quote') return ok(quote(300000));
  if (rest === '/unlock/wallet' && method === 'POST') {
    hub.unlocks.push({ key: request.headers.get('idempotency-key'), pin: request.headers.get('x-transaction-pin') });
    hub.bought = true;
    return json(201, { statusCode: 201, message: 'Created', data: unlockView() });
  }
  throw new Error(`no answer for ${method} ${path}`);
}) as typeof fetch;

jest.mock('expo-router', () => ({ useIsFocused: () => true }));
jest.mock('@/features/open-wallet/copy', () => ({ copyText: jest.fn(async () => true) }));

const clients: QueryClient[] = [];
const wired = () => ({ onOpenWallet: jest.fn(), onSetPin: jest.fn(), onForgotPin: jest.fn(), onAddMoney: jest.fn() });

async function boot(id: string, ready = true) {
  const { ContentDetailScreen } = require('@/features/content-detail/ContentDetailScreen') as typeof import('@/features/content-detail/ContentDetailScreen');
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } } });
  clients.push(client);
  const onBack = jest.fn();
  const screen = await rtl.render(
    <QueryClientProvider client={client}>
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
        <ContentDetailScreen id={id} onBack={onBack} pay={wired()} />
      </SafeAreaProvider>
    </QueryClientProvider>,
  );
  if (ready) await screen.findByTestId('detail-title');
  return { screen, onBack };
}

rtl.configure({ asyncUtilTimeout: 5000 });

beforeAll(async () => {
  const warm = await boot(PDF);
  warm.screen.unmount();
}, 120_000);

beforeEach(() => {
  Object.assign(hub, {
    bought: false,
    balanceKobo: 48_525_000,
    engagement: { likes: 1200, views: 2140, shares: 3, commentCount: 48, likedByMe: false, savedByMe: false, followsCreator: false },
    rating: { average: null, count: 0, myRating: null },
    comments: [comment('c-1', 'bisi', 'Chapter 3 on anchoring your rate changed how I quote. Worth it.', null), comment('c-2', KEMI, 'Thank you Bisi. The worksheet is on page 41.', 'c-1', { likes: 9 }), comment('c-3', 'emeka', 'Does it cover retainers?', null, { likes: 2 })],
    noComments: false,
    commentsFail: false,
    postFails: false,
    posts: [],
    ratings: [],
    shares: 0,
    unlocks: [],
    sends: [],
    writes: [],
    gone: false,
    loadFails: false,
    noWallet: false,
  });
});

afterEach(async () => {
  await rtl.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  clients.splice(0).forEach((c) => c.clear());
});

async function enterPin(pin: string) {
  const user = userEvent.setup();
  for (const d of pin) await user.press(await rtl.screen.findByRole('button', { name: d }));
}

describe('H19: a locked paid piece', () => {
  it('a user sees the preview, the title, the Hub\'s counts, who made it and the price card with the wallet balance', async () => {
    const { screen } = await boot(PDF);
    expect(screen.getByText('PDF')).toBeTruthy();
    expect(screen.getByText('Preview · pages 1–4 of 84')).toBeTruthy();
    expect(screen.getByTestId('detail-title').props.children).toBe('The Freelancer’s Pricing Playbook');
    expect(screen.getByTestId('detail-meta').props.children).toBe('84 pages · 2,140 views · Updated Sep 2026');
    expect(rtl.within(screen.getByTestId('detail-maker')).getByText('Kemi Okafor')).toBeTruthy();
    expect(screen.getByText('Business coach · 22K followers')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Follow' })).toBeTruthy();
    expect(screen.getByText('Unlock the full PDF')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Unlock · ₦3,000' })).toBeTruthy();
    expect(screen.getByText('Pay from wallet · ₦485,250 available')).toBeTruthy();
    // Nothing the Hub does not say: no "forever", no 96%, no Read now or Tip while it is locked.
    expect(screen.queryByText(/forever|96%/i)).toBeNull();
    expect(screen.queryByTestId('detail-open')).toBeNull();
    expect(screen.queryByTestId('detail-tip')).toBeNull();
    expect(screen.getByText('1.2K')).toBeTruthy();
    expect(screen.getByText('Rate')).toBeTruthy();
    expect(screen.getByText('Chapter 3 on anchoring your rate changed how I quote. Worth it.')).toBeTruthy();
    expect(screen.getByText('48 comments')).toBeTruthy();
    expect(hub.writes).toEqual(['POST /content/pdf-1/view']);
  });

  it('with no wallet yet the line says only how it is paid, never a balance', async () => {
    hub.noWallet = true;
    const { screen } = await boot(PDF);
    await rtl.waitFor(() => expect(rtl.within(screen.getByTestId('detail-wallet-line')).getByText('Pay from wallet')).toBeTruthy());
    expect(screen.queryByText(/available/)).toBeNull();
  });

  it('a user unlocks with the PIN: one debit with one key, and the page then reads as bought (H20)', async () => {
    const { screen } = await boot(PDF);
    await rtl.fireEvent.press(screen.getByRole('button', { name: 'Unlock · ₦3,000' }));
    await rtl.fireEvent.press(await screen.findByRole('button', { name: /^Unlock · ₦3,023.25$/ }));
    await screen.findByText(/^Approve /);
    await enterPin('4829');
    await screen.findByText('Unlocked');
    expect(hub.unlocks).toHaveLength(1);
    expect(hub.unlocks[0].key).toMatch(/[0-9a-f-]{36}/);
    expect(hub.unlocks[0].pin).toBe('4829');
    await rtl.fireEvent.press(screen.getByTestId('unlock-open'));
    await rtl.waitFor(() => expect(screen.getByTestId('detail-meta').props.children).toBe('84 pages · Bought 26 Sep'));
    expect(screen.getByText('All 84 pages')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Read now' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Download' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Tip Kemi' })).toBeTruthy();
    expect(screen.queryByTestId('detail-price-card')).toBeNull();
    expect(hub.unlocks).toHaveLength(1);
  });
});

describe('marks: like, save, follow, share', () => {
  it('a user likes, saves and follows, each drawn at once and written once; Saved and Following read back', async () => {
    const { screen } = await boot(PDF);
    await rtl.fireEvent.press(screen.getByTestId('detail-like'));
    await rtl.waitFor(() => expect(screen.getByText('1.2K')).toBeTruthy());
    await rtl.fireEvent.press(screen.getByTestId('detail-save'));
    await screen.findByText('Saved');
    await rtl.fireEvent.press(screen.getByTestId('detail-follow'));
    await screen.findByRole('button', { name: 'Following' });
    expect(hub.writes).toEqual(expect.arrayContaining(['POST /content/pdf-1/like', 'POST /content/pdf-1/save', 'POST /creators/00000000-0000-4000-8000-0000000000c1/follow']));
    await rtl.fireEvent.press(screen.getByTestId('detail-save'));
    await screen.findByText('Save');
    expect(hub.writes).toContain('DELETE /content/pdf-1/save');
  });
});

describe('H21: comments', () => {
  const open = async () => {
    const booted = await boot(PDF);
    await rtl.fireEvent.press(booted.screen.getByTestId('detail-comments-open'));
    await booted.screen.findByTestId('comments-sheet');
    return booted;
  };

  it('a user sees each comment with its reply indented under it, and Reply fills the box with the first name', async () => {
    const { screen } = await open();
    const sheet = rtl.within(screen.getByTestId('comments-sheet'));
    expect(sheet.getByTestId('comments-count').props.children).toBe('48 comments');
    expect(sheet.getByText('Thank you Bisi. The worksheet is on page 41.')).toBeTruthy();
    expect(sheet.getByText('Does it cover retainers?')).toBeTruthy();
    await rtl.fireEvent.press(sheet.getByTestId('comment-c-3-reply'));
    expect(sheet.getByTestId('comments-input').props.value).toBe('@Emeka ');
    expect(sheet.getByText('Replying to Emeka Obi')).toBeTruthy();
  });

  it('a user posts a reply: the words and the comment answered go once, and the box clears', async () => {
    const { screen } = await open();
    const sheet = rtl.within(screen.getByTestId('comments-sheet'));
    await rtl.fireEvent.press(sheet.getByTestId('comment-c-3-reply'));
    await rtl.fireEvent.changeText(sheet.getByTestId('comments-input'), '@Emeka yes, chapter 6');
    await rtl.fireEvent.press(sheet.getByTestId('comments-send'));
    await rtl.waitFor(() => expect(hub.posts).toHaveLength(1));
    expect(hub.posts[0]).toEqual({ text: '@Emeka yes, chapter 6', replyToId: 'c-3' });
    await rtl.waitFor(() => expect(sheet.getByTestId('comments-input').props.value).toBe(''));
    expect(await sheet.findByText('@Emeka yes, chapter 6')).toBeTruthy();
  });

  it('a comment that fails keeps its words in the box and says so; posting again works', async () => {
    hub.postFails = true;
    const { screen } = await open();
    const sheet = rtl.within(screen.getByTestId('comments-sheet'));
    await rtl.fireEvent.changeText(sheet.getByTestId('comments-input'), 'Great book');
    await rtl.fireEvent.press(sheet.getByTestId('comments-send'));
    await sheet.findByText("Your comment couldn't be posted. Try again.");
    expect(sheet.getByTestId('comments-input').props.value).toBe('Great book');
    hub.postFails = false;
    await rtl.fireEvent.press(sheet.getByTestId('comments-send'));
    await rtl.waitFor(() => expect(hub.posts).toHaveLength(1));
    expect(sheet.queryByText("Your comment couldn't be posted. Try again.")).toBeNull();
  });

  it('a piece with no comments says so, and the box is there to write the first', async () => {
    hub.noComments = true;
    const { screen } = await open();
    const sheet = rtl.within(screen.getByTestId('comments-sheet'));
    await sheet.findByText('No comments yet');
    expect(sheet.getByTestId('comments-input')).toBeTruthy();
    expect(sheet.getByTestId('comments-send').props.accessibilityState.disabled).toBe(true);
  });

  it('a user likes a comment: the count follows the Hub', async () => {
    const { screen } = await open();
    const sheet = rtl.within(screen.getByTestId('comments-sheet'));
    await rtl.fireEvent.press(sheet.getByTestId('comment-c-3-like'));
    await rtl.waitFor(() => expect(hub.writes).toContain('POST /content/pdf-1/comments/c-3/like'));
    await rtl.waitFor(() => expect(sheet.getByTestId('comment-c-3-like').props.accessibilityState.selected).toBe(true));
  });

  it('comments that cannot be read say so on their own part, and Try again reads them', async () => {
    hub.commentsFail = true;
    const { screen } = await boot(PDF);
    await screen.findByTestId('detail-comments-error');
    expect(screen.getByTestId('detail-title')).toBeTruthy();
    hub.commentsFail = false;
    await rtl.fireEvent.press(rtl.within(screen.getByTestId('detail-comments-error')).getByRole('button', { name: 'Try again' }));
    await screen.findByText('Does it cover retainers?');
  });
});

describe('H23: rate', () => {
  it('a buyer rates once: the stars go to the Hub, "Thanks for rating" shows and the button reads Rated 4', async () => {
    hub.bought = true;
    const { screen } = await boot(PDF);
    await rtl.fireEvent.press(screen.getByTestId('detail-rate'));
    await screen.findByText('Rate this piece');
    expect(screen.getByRole('button', { name: 'Submit rating' }).props.accessibilityState.disabled).toBe(true);
    await rtl.fireEvent.press(screen.getByTestId('rate-star-4'));
    expect(screen.getByText('4 of 5 · Really good')).toBeTruthy();
    await rtl.fireEvent.press(screen.getByTestId('rate-submit'));
    await screen.findByText('Thanks for rating');
    expect(hub.ratings).toEqual([4]);
    await rtl.waitFor(() => expect(screen.getByText('Rated 4')).toBeTruthy());
  });

  it('someone who has not bought a paid piece is told it opens after buying, and nothing is sent', async () => {
    const { screen } = await boot(PDF);
    await rtl.fireEvent.press(screen.getByTestId('detail-rate'));
    await screen.findByText('Only people who bought this can rate it.');
    expect(screen.queryByText('Rate this piece')).toBeNull();
    expect(hub.ratings).toEqual([]);
  });
});

describe('H22: share', () => {
  it('a user sees the link and the recent people, copies the link and sends it to a person once', async () => {
    const { screen } = await boot(PDF);
    await rtl.fireEvent.press(screen.getByTestId('detail-share-action'));
    await screen.findByTestId('share-sheet');
    const sheet = rtl.within(screen.getByTestId('share-sheet'));
    expect(sheet.getByTestId('share-link').props.children).toBe('wawuafrica.com/content/pdf-1');
    expect(await sheet.findByText('Amaka')).toBeTruthy();
    expect(sheet.getByText('Tolu')).toBeTruthy();
    expect(sheet.queryByText('Ngozi')).toBeNull(); // the board draws four; the chat button opens the rest
    expect(sheet.queryByText('Closed')).toBeNull(); // a chat that cannot be written to is not offered
    await rtl.fireEvent.press(sheet.getByTestId('share-copy-button'));
    await sheet.findByText('Copied');
    await rtl.waitFor(() => expect(hub.writes).toContain('POST /content/pdf-1/share'));
    await rtl.fireEvent.press(sheet.getByTestId('share-person-w-c2'));
    await sheet.findByText('Sent to Chidi Eze.');
    expect(hub.sends).toHaveLength(1);
    expect(hub.sends[0].chatId).toBe('c2');
    expect(hub.sends[0].text).toBe('The Freelancer’s Pricing Playbook by Kemi Okafor\nhttps://wawuafrica.com/content/pdf-1');
    expect(hub.sends[0].id.length).toBeGreaterThanOrEqual(8);
  });

  it('the chat button opens the whole list of recent people', async () => {
    const { screen } = await boot(PDF);
    await rtl.fireEvent.press(screen.getByTestId('detail-share-action'));
    const sheet = rtl.within(await screen.findByTestId('share-sheet'));
    await sheet.findByText('Amaka');
    await rtl.fireEvent.press(sheet.getByTestId('share-chat'));
    expect(await sheet.findByText('Ngozi')).toBeTruthy();
  });
});

describe('H24: a free video', () => {
  it('shows Free and its length, the Hub\'s views and age, no price and no Read now, and a Tip', async () => {
    const { screen } = await boot(VIDEO);
    expect(screen.getByText('Video')).toBeTruthy();
    expect(screen.getByText('Free · 1:50')).toBeTruthy();
    expect(screen.getByTestId('detail-meta').props.children).toBe('Video · 12.4K views · 3 days ago');
    expect(rtl.within(screen.getByTestId('detail-maker')).getByText('Tife Adeola')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Tip Tife' })).toBeTruthy();
    expect(screen.queryByTestId('detail-price-card')).toBeNull();
    expect(screen.queryByTestId('detail-open')).toBeNull();
    expect(screen.queryByTestId('detail-unlock')).toBeNull();
    expect(screen.getByText('340 comments')).toBeTruthy();
    // A free piece can be rated by anyone.
    expect(screen.getByText('Rate')).toBeTruthy();
  });
});

describe('H25: a course', () => {
  it('shows the lessons with the first Free and the rest locked, See all, and the unlock at the foot', async () => {
    const { screen } = await boot(COURSE);
    expect(screen.getByText('Course')).toBeTruthy();
    expect(screen.getByText('12 lessons · 2h 43m')).toBeTruthy(); // 9 min and eleven of 14: the Hub's own lengths, added up
    expect(screen.getByTestId('detail-meta').props.children).toBe('Course · 1,280 students');
    expect(screen.getByText('Lesson 1')).toBeTruthy();
    expect(rtl.within(screen.getByTestId('lesson-l1')).getByText('Free')).toBeTruthy();
    expect(rtl.within(screen.getByTestId('lesson-l2')).queryByText('Free')).toBeNull();
    expect(screen.queryByText('Lesson 5')).toBeNull();
    expect(screen.getByRole('button', { name: 'Unlock course · ₦8,000' })).toBeTruthy();
    expect(screen.getByText('Pay from wallet · ₦485,250 available')).toBeTruthy();
    await rtl.fireEvent.press(screen.getByRole('button', { name: 'See all 12 lessons' }));
    expect(screen.getByText('Lesson 12')).toBeTruthy();
    await rtl.fireEvent.press(screen.getByRole('button', { name: 'Show fewer lessons' }));
    expect(screen.queryByText('Lesson 12')).toBeNull();
  });
});

describe('states', () => {
  it('a piece that is gone says so and goes back', async () => {
    hub.gone = true;
    const { screen, onBack } = await boot(PDF, false);
    await screen.findByTestId('detail-gone');
    await rtl.fireEvent.press(screen.getByRole('button', { name: 'Go back' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('a page that cannot load says so, and Try again reads it', async () => {
    hub.loadFails = true;
    const { screen } = await boot(PDF, false);
    await screen.findByTestId('detail-error');
    hub.loadFails = false;
    await rtl.fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    await screen.findByTestId('detail-title');
  });
});
