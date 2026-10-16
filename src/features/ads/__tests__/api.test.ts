/* eslint-disable @typescript-eslint/no-require-imports */

type Sent = { method: string; path: string; query: string; body: unknown };
let sent: Sent[] = [];
let answer: { status: number; body: unknown } | 'offline' = { status: 200, body: {} };

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const text = request.method === 'GET' ? '' : await request.clone().text();
  sent.push({ method: request.method, path: url.pathname.replace(/^\/api\/hub/, ''), query: url.search, body: text ? JSON.parse(text) : undefined });
  if (answer === 'offline') throw new TypeError('Network request failed');
  return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

// The client takes the fetch that exists when it is made, so the module is loaded once the stand-in is in place.
const { adKey, drawable, fetchAd, reportAd } = require('../api') as typeof import('../api');

const card = {
  id: '11111111-1111-4111-8111-111111111111',
  advertiser: 'Gospel Night Co',
  headline: 'Gospel Night Live',
  subline: 'Abuja · Sat 18 October · from ₦5,000',
  ctaLabel: 'Get tickets',
  ctaDestination: 'event',
  ctaDestinationId: '22222222-2222-4222-8222-222222222222',
  artworkUrl: 'https://cdn.example.test/a.jpg',
};
const ok = (data: unknown) => ({ status: 200, body: { statusCode: 200, message: 'OK', data } });

beforeEach(() => {
  sent = [];
  answer = ok(card);
});

describe('GET /ads', () => {
  it('asks for the one placement it draws, and returns the card as the Hub served it', async () => {
    expect(await fetchAd('tgif_card')).toEqual(card);
    expect(sent).toEqual([{ method: 'GET', path: '/ads', query: '?placement=tgif_card', body: undefined }]);
    await fetchAd('today_slot');
    expect(sent[1].query).toBe('?placement=today_slot');
  });

  it('is no card when nothing is live (data: null), so there is nothing to draw', async () => {
    answer = ok(null);
    expect(await fetchAd('today_slot')).toBeNull();
  });

  it('keeps each placement in its own cache entry', () => {
    expect(adKey('tgif_card')).not.toEqual(adKey('today_slot'));
  });

  it('rejects with the Hub error when the call fails, so the screen can draw nothing for the real cause', async () => {
    answer = { status: 500, body: { statusCode: 500, message: 'Server error', data: null } };
    await expect(fetchAd('tgif_card')).rejects.toMatchObject({ kind: 'server' });
    answer = 'offline';
    await expect(fetchAd('tgif_card')).rejects.toMatchObject({ kind: 'network' });
  });
});

describe('what can be drawn', () => {
  it('draws a card with its words and an event to open', () => {
    expect(drawable(card)).toEqual(card);
  });

  it('draws a card with no line under the headline and no picture, and leaves both out', () => {
    expect(drawable({ ...card, subline: null, artworkUrl: null })).toMatchObject({ subline: null, artworkUrl: null });
    expect(drawable({ ...card, subline: '  ' })).toMatchObject({ subline: null });
  });

  it('draws nothing for a card it cannot finish: no headline, no button word, no event, or a destination this build does not know', () => {
    expect(drawable({ ...card, headline: '' })).toBeNull();
    expect(drawable({ ...card, ctaLabel: ' ' })).toBeNull();
    expect(drawable({ ...card, ctaDestinationId: '' })).toBeNull();
    expect(drawable({ ...card, ctaDestination: 'link' })).toBeNull();
    expect(drawable({ ...card, id: undefined })).toBeNull();
    expect(drawable(null)).toBeNull();
    expect(drawable('card')).toBeNull();
  });

  it('never draws a picture from an address that is not http or https', () => {
    expect(drawable({ ...card, artworkUrl: 'javascript:alert(1)' })).toMatchObject({ artworkUrl: null });
    expect(drawable({ ...card, artworkUrl: 'file:///etc/passwd' })).toMatchObject({ artworkUrl: null });
    expect(drawable({ ...card, artworkUrl: 'http://cdn.example.test/a.jpg' })).toMatchObject({ artworkUrl: 'http://cdn.example.test/a.jpg' });
  });
});

describe('POST /ads/{id}/events', () => {
  it.each(['view', 'tap', 'skip'] as const)('reports a %s against the campaign, with the kind as the Hub names it', async (kind) => {
    answer = { status: 200, body: { statusCode: 200, message: 'OK', data: { accepted: true } } };
    await reportAd(card.id, kind);
    expect(sent).toEqual([{ method: 'POST', path: `/ads/${card.id}/events`, query: '', body: { type: kind } }]);
  });

  it('rejects when the Hub refuses (a campaign that has ended answers 404)', async () => {
    answer = { status: 404, body: { statusCode: 404, message: 'Not found', data: null } };
    await expect(reportAd(card.id, 'view')).rejects.toMatchObject({ status: 404 });
  });
});
