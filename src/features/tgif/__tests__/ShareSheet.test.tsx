/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { Linking } from 'react-native';

const mockCard = jest.fn<Promise<unknown>, [string]>();
jest.mock('../api/tgif', () => ({
  ...jest.requireActual('../api/tgif'),
  fetchShareCard: (date: string) => mockCard(date),
}));

type Answer = { status: number; body: unknown } | 'offline' | 'hold';
let answers: Record<string, Answer[]> = {};
let sent: { key: string; body: unknown; type: string | null }[] = [];

const ok = (data: unknown, status = 200): Answer => ({ status, body: { statusCode: status, message: 'OK', data } });
const refused = (status: number, message: string): Answer => ({ status, body: { statusCode: status, message, data: null } });

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const path = new URL(request.url).pathname.replace(/^\/api\/hub/, '');
  const key = `${request.method} ${path}`;
  const raw = request.method === 'GET' || request.method === 'DELETE' ? '' : await request.clone().text();
  let body: unknown = raw || undefined;
  try {
    body = raw ? JSON.parse(raw) : undefined;
  } catch {
    body = raw;
  }
  sent.push({ key, body, type: request.headers.get('content-type') });
  const answer = answers[key]?.[0];
  if (answers[key] && answers[key].length > 1) answers[key].shift();
  if (!answer) throw new Error(`no answer for ${key}`);
  if (answer === 'hold') return new Promise<Response>(() => undefined);
  if (answer === 'offline') throw new TypeError('Network request failed');
  return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

const clients: QueryClient[] = [];

async function render(child: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } } });
  clients.push(client);
  await rtl.render(<QueryClientProvider client={client}>{child}</QueryClientProvider>);
}

const DATE = '2025-09-26';
const day = {
  date: DATE,
  series: 'SONS, NOT SLAVES',
  seriesTheme: 'Who you are',
  verse: 'This is the day which the LORD hath made; we will rejoice and be glad in it.',
  verseReference: 'Psalm 118:24 (KJV)',
  reality: 'r',
  remember: 'm',
  prayer: 'p',
  takeaway: 't',
  shareLink: 'wawu/tgif' as string | null,
};

/** A real PNG header for 1050 by 660, so the preview keeps the card's shape. */
function cardUri(width = 1050, height = 660) {
  const head = Buffer.alloc(24);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(head, 0);
  head.writeUInt32BE(13, 8);
  head.write('IHDR', 12, 'latin1');
  head.writeUInt32BE(width, 16);
  head.writeUInt32BE(height, 20);
  return `data:image/png;base64,${head.toString('base64')}AAAA`;
}

const card = { blob: { size: 1234 } as Blob, uri: cardUri() };

const person = (id: string, name: string, over: Record<string, unknown> = {}) => ({
  id,
  other: { wawuId: `w-${id}`, name, handle: name.toLowerCase(), avatarUrl: null, verification: 'none' },
  createdAt: '2025-09-01T10:00:00.000Z',
  lastActivityAt: '2025-09-25T10:00:00.000Z',
  lastMessage: null,
  unreadCount: 0,
  myLastReadAt: null,
  otherLastReadAt: null,
  canMessage: true,
  ...over,
});

async function boot(over: { day?: typeof day; onClose?: () => void; onOpenInbox?: () => void } = {}) {
  const { ShareSheet } = require('../ShareSheet') as typeof import('../ShareSheet');
  const props = { onClose: over.onClose ?? jest.fn(), onOpenInbox: over.onOpenInbox };
  await render(<ShareSheet visible date={DATE} day={over.day ?? day} {...props} />);
  return props;
}

const calls = (key: string) => sent.filter((s) => s.key === key);
let open: jest.SpyInstance;

beforeEach(() => {
  answers = { [`POST /tgif/${DATE}/share`]: [ok({ shares: 1, counted: true })] };
  sent = [];
  mockCard.mockReset().mockResolvedValue(card);
  open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
});

afterEach(async () => {
  await rtl.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  open.mockRestore();
  clients.splice(0).forEach((c) => c.clear());
});

describe('H35 · share the verse', () => {
  it("shows the sheet's words, the Hub's card in its own shape, and the two ways to send it that work today", async () => {
    await boot();
    expect(rtl.screen.getByText("Share today's verse")).toBeTruthy();
    expect(rtl.screen.getByText('The card goes to Chat as an image. WhatsApp gets the verse as text. Both carry the link.')).toBeTruthy();
    expect(rtl.screen.queryByText(/Posted as an image/)).toBeNull();
    const preview = await rtl.screen.findByTestId('tgif-share-preview');
    expect([preview.props.source].flat()).toEqual([{ uri: card.uri }]);
    expect(preview.props.accessibilityLabel).toContain(day.verse);
    expect(mockCard).toHaveBeenCalledWith(DATE);
    expect(rtl.screen.getByTestId('tgif-share-whatsapp')).toBeTruthy();
    expect(rtl.screen.getByTestId('tgif-share-chat')).toBeTruthy();
    expect(rtl.screen.getByText('WhatsApp')).toBeTruthy();
    expect(rtl.screen.getByText('Chat')).toBeTruthy();
    expect(rtl.screen.queryByText('Story')).toBeNull();
    expect(rtl.screen.queryByText('Save')).toBeNull();
    expect(JSON.stringify(rtl.screen.toJSON())).not.toMatch(/WAWU|—/);
  });

  it('says only what each way of sending does, and names no link while the Hub has none (D7)', async () => {
    await boot({ day: { ...day, shareLink: null } });
    expect(rtl.screen.getByText('The card goes to Chat as an image. WhatsApp gets the verse as text.')).toBeTruthy();
    expect(JSON.stringify(rtl.screen.toJSON())).not.toMatch(/link|wawu\/tgif|Posted as an image/i);
    await rtl.screen.findByTestId('tgif-share-preview');
    expect(JSON.stringify(rtl.screen.toJSON())).not.toMatch(/link|wawu\/tgif/i);
  });

  it('holds a place for the card while it is drawn, and offers a retry when it cannot be', async () => {
    mockCard.mockReturnValueOnce(new Promise(() => undefined));
    await boot();
    expect(rtl.screen.getByTestId('tgif-share-preview-loading')).toBeTruthy();
    await rtl.cleanup();
    mockCard.mockRejectedValueOnce(new Error('boom')).mockResolvedValue(card);
    await boot();
    expect(await rtl.screen.findByTestId('tgif-share-preview-error')).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getByLabelText('Try again'));
    expect(await rtl.screen.findByTestId('tgif-share-preview')).toBeTruthy();
  });

  it('a user can send the verse to WhatsApp: it opens with the verse, where it is from and the link, and the share is counted once', async () => {
    await boot();
    await rtl.fireEvent.press(await rtl.screen.findByTestId('tgif-share-whatsapp'));
    await rtl.waitFor(() => expect(open).toHaveBeenCalledTimes(1));
    const url = new URL(open.mock.calls[0][0] as string);
    expect(url.origin + url.pathname).toBe('https://wa.me/');
    expect(url.searchParams.get('text')).toBe(`“${day.verse}”\nPsalm 118:24 (KJV)\nwawu/tgif`);
    await rtl.waitFor(() => expect(calls(`POST /tgif/${DATE}/share`)).toHaveLength(1));
    expect(rtl.screen.queryByTestId('tgif-share-problem')).toBeNull();
  });

  it('leaves the link out of the message while the Hub has none', async () => {
    await boot({ day: { ...day, shareLink: null } });
    await rtl.fireEvent.press(await rtl.screen.findByTestId('tgif-share-whatsapp'));
    await rtl.waitFor(() => expect(open).toHaveBeenCalledTimes(1));
    expect(new URL(open.mock.calls[0][0] as string).searchParams.get('text')).toBe(`“${day.verse}”\nPsalm 118:24 (KJV)`);
  });

  it('says so, and counts no share, when WhatsApp cannot be opened', async () => {
    open.mockRejectedValue(new Error('no handler'));
    await boot();
    await rtl.fireEvent.press(await rtl.screen.findByTestId('tgif-share-whatsapp'));
    expect(await rtl.screen.findByText('WhatsApp could not be opened. Try again.')).toBeTruthy();
    expect(calls(`POST /tgif/${DATE}/share`)).toHaveLength(0);
  });
});

describe('H35 · send in chat', () => {
  const chats = [person('c1', 'Ada Obi'), person('c2', 'Bola Ige', { canMessage: false })];

  it('lists the person\'s chats, newest first, with a chat that cannot be messaged shown and not pressable', async () => {
    answers['GET /chats'] = [ok({ items: chats, nextCursor: null })];
    await boot();
    await rtl.fireEvent.press(await rtl.screen.findByTestId('tgif-share-chat'));
    expect(rtl.screen.getByText('Send in chat')).toBeTruthy();
    expect(await rtl.screen.findByText('Ada Obi')).toBeTruthy();
    expect(rtl.screen.getByText('Bola Ige')).toBeTruthy();
    expect(rtl.screen.getByText('Messages are off in this chat')).toBeTruthy();
    expect(rtl.screen.getByTestId('tgif-chat-c1').props.accessibilityRole).toBe('button');
    expect(rtl.screen.getByTestId('tgif-chat-c2').props.accessibilityRole).toBeUndefined();
    expect(calls('GET /chats')).toHaveLength(1);
  });

  it('a user can send the card to a chat: the picture is uploaded, then sent with the link, and the share is counted once', async () => {
    answers['GET /chats'] = [ok({ items: chats, nextCursor: null })];
    answers['POST /chats/c1/attachments'] = [ok({ uploadUrl: 'https://storage.example.test/up/abc', key: 'chat/media/w/abc.png' })];
    answers['PUT /up/abc'] = [{ status: 200, body: {} }];
    answers['POST /chats/c1/messages'] = [ok({ id: 'm1' }, 201)];
    const { onClose } = await boot();
    await rtl.fireEvent.press(await rtl.screen.findByTestId('tgif-share-chat'));
    await rtl.fireEvent.press(await rtl.screen.findByTestId('tgif-chat-c1'));
    expect(await rtl.screen.findByTestId('tgif-sent')).toBeTruthy();
    expect(rtl.screen.getByText("Today's verse is in your chat with Ada Obi.")).toBeTruthy();
    expect(calls('POST /chats/c1/attachments')[0].body).toEqual({ contentType: 'image/png', contentLength: 1234 });
    expect(calls('PUT /up/abc')[0].type).toBe('image/png');
    const message = calls('POST /chats/c1/messages')[0].body as { text?: string; attachment: { key: string; name: string }; clientMessageId: string };
    expect(message.attachment).toEqual({ key: 'chat/media/w/abc.png', name: 'TGIF-2025-09-26.png' });
    expect(message.text).toBe('wawu/tgif');
    expect(message.clientMessageId).toMatch(/^[A-Za-z0-9_-]{8,64}$/);
    await rtl.waitFor(() => expect(calls(`POST /tgif/${DATE}/share`)).toHaveLength(1));
    await rtl.fireEvent.press(rtl.screen.getByTestId('tgif-sent-done'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('sends the picture alone while the Hub has no link', async () => {
    answers['GET /chats'] = [ok({ items: chats, nextCursor: null })];
    answers['POST /chats/c1/attachments'] = [ok({ uploadUrl: 'https://storage.example.test/up/abc', key: 'k' })];
    answers['PUT /up/abc'] = [{ status: 200, body: {} }];
    answers['POST /chats/c1/messages'] = [ok({ id: 'm1' }, 201)];
    await boot({ day: { ...day, shareLink: null } });
    await rtl.fireEvent.press(await rtl.screen.findByTestId('tgif-share-chat'));
    await rtl.fireEvent.press(await rtl.screen.findByTestId('tgif-chat-c1'));
    await rtl.screen.findByTestId('tgif-sent');
    expect(calls('POST /chats/c1/messages')[0].body).not.toHaveProperty('text');
  });

  it('shows the Hub\'s own sentence when a chat refuses the card, sends nothing, and counts no share', async () => {
    answers['GET /chats'] = [ok({ items: chats, nextCursor: null })];
    answers['POST /chats/c1/attachments'] = [refused(403, 'You cannot message this person.')];
    await boot();
    await rtl.fireEvent.press(await rtl.screen.findByTestId('tgif-share-chat'));
    await rtl.fireEvent.press(await rtl.screen.findByTestId('tgif-chat-c1'));
    expect(await rtl.screen.findByText('You cannot message this person.')).toBeTruthy();
    expect(calls('POST /chats/c1/messages')).toHaveLength(0);
    expect(calls(`POST /tgif/${DATE}/share`)).toHaveLength(0);
  });

  it('tries the same message again with the same id, so a retry after a dropped answer posts the card once', async () => {
    answers['GET /chats'] = [ok({ items: chats, nextCursor: null })];
    answers['POST /chats/c1/attachments'] = [
      ok({ uploadUrl: 'https://storage.example.test/up/one', key: 'k1' }),
      ok({ uploadUrl: 'https://storage.example.test/up/two', key: 'k2' }),
    ];
    answers['PUT /up/one'] = [{ status: 200, body: {} }];
    answers['PUT /up/two'] = [{ status: 200, body: {} }];
    answers['POST /chats/c1/messages'] = ['offline', ok({ id: 'm1' }, 201)];
    await boot();
    await rtl.fireEvent.press(await rtl.screen.findByTestId('tgif-share-chat'));
    await rtl.fireEvent.press(await rtl.screen.findByTestId('tgif-chat-c1'));
    expect(await rtl.screen.findByTestId('tgif-chat-problem')).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getByTestId('tgif-chat-c1'));
    await rtl.screen.findByTestId('tgif-sent');
    const ids = calls('POST /chats/c1/messages').map((m) => (m.body as { clientMessageId: string }).clientMessageId);
    expect(ids).toHaveLength(2);
    expect(ids[0]).toBe(ids[1]);
  });

  it('says "No chats yet" with a way to Messages when the person has none, and closes the sheet on the way', async () => {
    answers['GET /chats'] = [ok({ items: [], nextCursor: null })];
    const onOpenInbox = jest.fn();
    const { onClose } = await boot({ onOpenInbox });
    await rtl.fireEvent.press(await rtl.screen.findByTestId('tgif-share-chat'));
    expect(await rtl.screen.findByText('No chats yet')).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getByLabelText('Open Messages'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onOpenInbox).toHaveBeenCalledTimes(1);
  });

  it('holds places while the chats load, offers a retry when they cannot, and goes back to the ways to send', async () => {
    answers['GET /chats'] = ['hold'];
    await boot();
    await rtl.fireEvent.press(await rtl.screen.findByTestId('tgif-share-chat'));
    expect(await rtl.screen.findByTestId('tgif-chats-loading')).toBeTruthy();
    await rtl.cleanup();
    answers['GET /chats'] = [refused(500, 'Something went wrong'), ok({ items: chats, nextCursor: null })];
    await boot();
    await rtl.fireEvent.press(await rtl.screen.findByTestId('tgif-share-chat'));
    expect(await rtl.screen.findByTestId('tgif-chats-error')).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getByLabelText('Try again'));
    expect(await rtl.screen.findByText('Ada Obi')).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getByTestId('tgif-chat-back'));
    expect(await rtl.screen.findByTestId('tgif-share-whatsapp')).toBeTruthy();
  });
});
