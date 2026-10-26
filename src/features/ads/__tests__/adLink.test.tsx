/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/**
 * ADS-LINK (R-92) · an ad opens the advertiser's web link, or does nothing; ads are not tied to events. The three places
 * (the Explore slide, the Today slot, the TGIF card) are drawn from the same card, so each is proved with a link ad, with an
 * ad that does nothing and with a campaign that still opens an event.
 */
const mockOpenURL = jest.fn(async (_url: string) => true);
jest.mock('expo-linking', () => ({ openURL: (url: string) => mockOpenURL(url) }));

let sent: { key: string; body: unknown }[] = [];
globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const text = request.method === 'GET' ? '' : await request.clone().text();
  sent.push({ key: `${request.method} ${url.pathname.replace(/^\/api\/hub/, '')}`, body: text ? JSON.parse(text) : undefined });
  return new Response(JSON.stringify({ statusCode: 200, message: 'OK', data: { accepted: true } }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}) as typeof fetch;

const { adOpensSomething, drawable, openAd } = require('../api') as typeof import('../api');
const { SponsoredSlot } = require('../SponsoredSlot') as typeof import('../SponsoredSlot');
const { SponsoredStep } = require('../SponsoredStep') as typeof import('../SponsoredStep');
const { AdSlide } = require('@/features/explore/AdSlide') as typeof import('@/features/explore/AdSlide');
const { ExploreSlider } = require('@/features/explore/ExploreSlider') as typeof import('@/features/explore/ExploreSlider');

const ART = 'https://cdn.example.test/ad.jpg';
const base = { id: '11111111-1111-4111-8111-111111111111', advertiser: 'Acme', headline: 'Shop with Acme', subline: 'Lagos', artworkUrl: ART };
const LINK_URL = 'https://acme.example.com/shop?ref=wawu';
const wire = {
  link: { ...base, ctaLabel: 'Visit us', ctaDestination: 'link', ctaUrl: LINK_URL },
  none: { ...base, ctaDestination: 'none' },
  event: { ...base, ctaLabel: 'Get tickets', ctaDestination: 'event', ctaDestinationId: '22222222-2222-4222-8222-222222222222' },
};
const card = (kind: keyof typeof wire) => {
  const drawn = drawable(wire[kind]);
  if (!drawn) throw new Error(`${kind} should be drawable`);
  return drawn;
};

const safe = (node: React.ReactNode) => (
  <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>{node}</SafeAreaProvider>
);

beforeEach(() => {
  mockOpenURL.mockClear();
  sent = [];
});

describe('what the app will draw (drawable)', () => {
  it('draws a link, a card that does nothing, and an event as before', () => {
    expect(drawable(wire.link)).toMatchObject({ ctaDestination: 'link', ctaLabel: 'Visit us', ctaUrl: LINK_URL });
    expect(drawable(wire.none)).toMatchObject({ ctaDestination: 'none' });
    expect(drawable(wire.event)).toMatchObject({ ctaDestination: 'event', ctaDestinationId: wire.event.ctaDestinationId });
  });

  it('carries no button, address or event on a card that does nothing', () => {
    const none = drawable({ ...wire.none, ctaLabel: 'Click', ctaUrl: LINK_URL, ctaDestinationId: 'x' });
    expect(none).toEqual({ ...base, ctaDestination: 'none', subline: 'Lagos' });
  });

  it.each([
    ['a link that is http', { ...wire.link, ctaUrl: 'http://acme.example.com' }],
    ['a link that is javascript:', { ...wire.link, ctaUrl: 'javascript:alert(1)' }],
    ['a link that is data:', { ...wire.link, ctaUrl: 'data:text/html,hi' }],
    ['a bare host', { ...wire.link, ctaUrl: 'acme.example.com' }],
    ['a link with no address', { ...wire.link, ctaUrl: undefined }],
    ['a link with no button words', { ...wire.link, ctaLabel: ' ' }],
    ['an event with no event', { ...wire.event, ctaDestinationId: undefined }],
    ['a kind this build does not know', { ...wire.link, ctaDestination: 'phone' }],
    ['no kind', { ...base, ctaLabel: 'Hi' }],
    ['no picture', { ...wire.none, artworkUrl: 'javascript:alert(1)' }],
    ['no headline', { ...wire.none, headline: '' }],
  ])('drops %s', (_n, value) => {
    expect(drawable(value)).toBeNull();
  });
});

describe('what a tap does (openAd)', () => {
  it('sends the phone to the address for a link, and nowhere else', () => {
    const openEvent = jest.fn();
    openAd(card('link'), openEvent);
    expect(mockOpenURL).toHaveBeenCalledTimes(1);
    expect(mockOpenURL).toHaveBeenCalledWith(LINK_URL);
    expect(openEvent).not.toHaveBeenCalled();
  });

  it('opens the event for an event, and not the browser', () => {
    const openEvent = jest.fn();
    openAd(card('event'), openEvent);
    expect(openEvent).toHaveBeenCalledWith(wire.event.ctaDestinationId);
    expect(mockOpenURL).not.toHaveBeenCalled();
  });

  it('does nothing for a card that does nothing', () => {
    const openEvent = jest.fn();
    openAd(card('none'), openEvent);
    expect(openEvent).not.toHaveBeenCalled();
    expect(mockOpenURL).not.toHaveBeenCalled();
    expect(adOpensSomething(card('none'))).toBe(false);
  });

  it('a browser that cannot be reached is a tap that does nothing, not an error', async () => {
    mockOpenURL.mockRejectedValueOnce(new Error('no browser'));
    expect(() => openAd(card('link'), jest.fn())).not.toThrow();
    await Promise.resolve();
  });
});

describe('the Today slot', () => {
  it('a link ad is one button: the card and its pill open the address', async () => {
    const onOpen = jest.fn(() => openAd(card('link'), jest.fn()));
    const screen = await rtl.render(<SponsoredSlot ad={card('link')} onOpen={onOpen} />);
    expect(screen.getByRole('button', { name: /Sponsored\. Shop with Acme\. Lagos\. Visit us/ })).toBeTruthy();
    expect(screen.getByTestId('today-sponsored-cta')).toHaveTextContent('Visit us');
    await rtl.fireEvent.press(screen.getByTestId('today-sponsored'));
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(mockOpenURL).toHaveBeenCalledWith(LINK_URL);
  });

  it('an ad that does nothing has no button, nothing pressable and is read as an ad', async () => {
    const onOpen = jest.fn();
    const screen = await rtl.render(<SponsoredSlot ad={card('none')} onOpen={onOpen} />);
    expect(screen.getByTestId('today-sponsored-headline')).toHaveTextContent('Shop with Acme');
    expect(screen.queryByTestId('today-sponsored-button')).toBeNull();
    expect(screen.queryByTestId('today-sponsored-cta')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
    const root = screen.getByTestId('today-sponsored');
    expect(root.props.accessibilityLabel).toBe('Sponsored. Shop with Acme. Lagos.');
    expect(root.props.accessibilityRole).toBeUndefined();
    expect(root.props.onPress).toBeUndefined();
    await rtl.fireEvent.press(root);
    expect(onOpen).not.toHaveBeenCalled();
    expect(mockOpenURL).not.toHaveBeenCalled();
  });

  it('is the Explore slide at the Explore size: 196 high, corner 24, the same fade, with the pill added (R-92)', async () => {
    const { exploreEventMetrics: ev } = require('@/features/events/ExploreEvents') as typeof import('@/features/events/ExploreEvents');
    const { StyleSheet } = require('react-native') as typeof import('react-native');
    const screen = await rtl.render(<SponsoredSlot ad={card('link')} onOpen={jest.fn()} />);
    const style = StyleSheet.flatten(screen.getByTestId('today-sponsored').props.style) as { height: number; borderRadius: number };
    expect(style.height).toBe(ev.heroHeight);
    expect(style.height).toBe(196);
    expect(style.borderRadius).toBe(ev.heroCorner);
    expect(style.borderRadius).toBe(24);
    expect(screen.getByText('SPONSORED')).toBeTruthy();
    expect(screen.getByTestId('today-sponsored-shade')).toBeTruthy();
    const slide = await rtl.render(<AdSlide ad={card('link')} onOpen={jest.fn()} />);
    const slideStyle = StyleSheet.flatten(slide.getByTestId('explore-ad').props.style) as { height: number; borderRadius: number };
    expect({ height: slideStyle.height, borderRadius: slideStyle.borderRadius }).toEqual({ height: style.height, borderRadius: style.borderRadius });
    expect(slide.queryByTestId('explore-ad-button')).toBeNull();
  });

  it('an event ad is still one button with its pill', async () => {
    const screen = await rtl.render(<SponsoredSlot ad={card('event')} onOpen={jest.fn()} />);
    expect(screen.getByRole('button', { name: /Get tickets/ })).toBeTruthy();
    expect(screen.getByTestId('today-sponsored-button')).toBeTruthy();
  });
});

describe('the TGIF card', () => {
  it('a link ad has its button, which opens the address', async () => {
    const onOpen = jest.fn(() => openAd(card('link'), jest.fn()));
    const screen = await rtl.render(safe(<SponsoredStep ad={card('link')} onOpen={onOpen} onSkip={jest.fn()} bottomInset={0} />));
    expect(screen.getByTestId('sponsored-cta')).toBeTruthy();
    await rtl.fireEvent.press(screen.getByTestId('sponsored-cta'));
    expect(mockOpenURL).toHaveBeenCalledWith(LINK_URL);
  });

  it('an ad that does nothing draws no button, and Skip stays as the reader\'s own way on', async () => {
    const onSkip = jest.fn();
    const onOpen = jest.fn();
    const screen = await rtl.render(safe(<SponsoredStep ad={card('none')} onOpen={onOpen} onSkip={onSkip} bottomInset={0} />));
    expect(screen.queryByTestId('sponsored-cta')).toBeNull();
    expect(screen.getByTestId('sponsored-headline')).toHaveTextContent('Shop with Acme');
    await rtl.fireEvent.press(screen.getByTestId('sponsored-skip'));
    expect(onSkip).toHaveBeenCalledTimes(1);
    expect(onOpen).not.toHaveBeenCalled();
  });
});

describe('the Explore slide', () => {
  it('an ad that does nothing is a card with nothing pressable on it', async () => {
    const onOpen = jest.fn();
    const screen = await rtl.render(<AdSlide ad={card('none')} onOpen={onOpen} />);
    const root = screen.getByTestId('explore-ad');
    expect(root.props.accessibilityLabel).toBe('Sponsored. Shop with Acme. Lagos.');
    expect(root.props.accessibilityRole).toBeUndefined();
    expect(screen.queryByRole('button')).toBeNull();
    await rtl.fireEvent.press(root);
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('a link ad opens the address, counts one tap, and never opens an event', async () => {
    const onOpenEvent = jest.fn();
    const slides = [{ kind: 'ad' as const, key: `ad-${base.id}`, ad: card('link') }];
    const screen = await rtl.render(safe(<ExploreSlider slides={slides} showing onOpenEvent={onOpenEvent} />));
    await rtl.fireEvent.press(screen.getByTestId(`explore-ad-${base.id}`));
    expect(mockOpenURL).toHaveBeenCalledWith(LINK_URL);
    expect(onOpenEvent).not.toHaveBeenCalled();
    await rtl.waitFor(() => expect(sent.filter((s) => s.key === `POST /ads/${base.id}/events`).map((s) => (s.body as { type: string }).type)).toEqual(['view', 'tap']));
  });

  it('an ad that does nothing is viewed but never tapped', async () => {
    const onOpenEvent = jest.fn();
    const slides = [{ kind: 'ad' as const, key: `ad-${base.id}`, ad: card('none') }];
    const screen = await rtl.render(safe(<ExploreSlider slides={slides} showing onOpenEvent={onOpenEvent} />));
    await rtl.fireEvent.press(screen.getByTestId(`explore-ad-${base.id}`));
    await rtl.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 30));
    });
    expect(mockOpenURL).not.toHaveBeenCalled();
    expect(onOpenEvent).not.toHaveBeenCalled();
    expect(sent.filter((s) => s.key === `POST /ads/${base.id}/events`).map((s) => (s.body as { type: string }).type)).toEqual(['view']);
  });
});
