/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import { Keyboard, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/*
 * VIEW-FIX patch A (R-117, verifier finding: "Who is running it" cut to a sliver above Continue in the host-keyboard picture). The picture
 * ran on the web, where FieldScroll's scroll-into-view returns early, so it said nothing about the phone. This is the phone path, on
 * Android AND iPhone, with the phone's own keyboard events, `KeyboardAvoidingView`'s real handler and FieldScroll's real code, on the real
 * Events host screen (E13): the field is focused, the keyboard (336 high) comes up, the scroll is shortened by what the frame pads, and
 * the page scrolls so the WHOLE field (the label over the box, the box, and the line under it when it shows an error) sits above the
 * Continue button and the keyboard.
 *
 * jest has no layout engine, so the positions are a model whose numbers were MEASURED on the real screen (the web export at 390 x 844,
 * the same flex layout, keyboard 336 high, the field at the top of the scroll): the bar and tabs above the scroll are 89 high, the foot
 * (Continue and its padding) 78 with the keyboard up, the input 21.75 high, the label 43.1 above the input's top, the box ends 16.1 under
 * its foot, the error line ends 41.0 under it. What a person's phone has on top of that (the status bar) is the inset the test sets.
 */
type Reply = { status?: number; body?: unknown };
type Call = { path: string };

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const call: Call = { path: new URL(request.url).pathname.replace(/^\/api\/hub/, '') };
  const reply = answer(call);
  if (!reply) throw new Error(`no answer for ${call.path}`);
  return new Response(JSON.stringify(reply.body), { status: reply.status ?? 200, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

jest.mock('@/features/open-wallet/sessionAccount', () => ({ useSessionAccount: () => 'acct-host' }));

const ok = (data: unknown) => ({ status: 200, body: { statusCode: 200, message: 'OK', data } });
const options = {
  categories: [{ value: 'business', label: 'Business & Finance' }],
  formats: [{ value: 'in_person', label: 'In person' }, { value: 'online', label: 'Online' }],
  types: [{ value: 'conference', label: 'Conference' }],
  tickets: { hostSharePercent: 85, minPriceNaira: 0, maxPriceNaira: 10_000_000, minQuantity: 1, maxQuantity: 1_000_000, nameMinLength: 2, nameMaxLength: 60, maxTypes: 20 },
  fields: { nameMax: 160, descriptionMax: 5000, hostOrgMax: 160, addressMax: 300 },
};
const tick = {
  verification: { creator: { verified: true, expiresAt: null }, professional: { verified: false, expiresAt: null } },
  pricing: { creator: 2000, professional: 2000, currency: 'NGN', termMonths: 12 },
  eligibility: [],
};
const tier = { state: 'none', tier: null, activeFrom: null, activeUntil: null, productsAllowed: 0, productsUsed: 0, extraProducts: 0, pointsIncluded: 0, firstVoiceIntroIncluded: false, eventPass: null };
const answer = (c: Call): Reply | undefined =>
  c.path === '/verification/me' ? ok(tick) : c.path === '/events/options' ? ok(options) : c.path === '/me/tier' ? ok(tier) : c.path === '/prices' ? ok({ prices: [], tips: [] }) : undefined;

// Loaded here, where no test's timeout applies.
const { HostScreen } = require('@/features/events/host/HostScreen') as typeof import('@/features/events/host/HostScreen');
const { footMetrics } = require('@/features/events/host/HostEnds') as typeof import('@/features/events/host/HostEnds');
beforeAll(async () => {
  const warm = await rtl.render(<View />);
  warm.unmount();
});

const SCREEN_H = 844;
const KEYBOARD = 336;
/** The phones: Android (edge to edge, a 24 status bar) and an iPhone (a 47 notch, a 34 home bar). */
const PHONES = {
  android: { top: 24, bottom: 24, show: 'keyboardDidShow', hide: 'keyboardDidHide' },
  ios: { top: 47, bottom: 34, show: 'keyboardWillShow', hide: 'keyboardWillHide' },
} as const;
type Phone = keyof typeof PHONES;

/** Measured on the real screen (see the top of the file). All content positions are from the top of the scroll's content, in px. */
const MEASURED = {
  barAndTabs: 89,
  footWithKeyboard: 78,
  // "Who is running it", the third field of E13, with nothing under it...
  plain: { inputY: 319.9, inputH: 21.75, labelTop: 276.9, boxBottom: 357.8, lineBottom: null, content: 545 },
  // ...and with the line "Say who is running it." under it (the page's first Continue with the form empty).
  error: { inputY: 368.8, inputH: 21.75, labelTop: 325.8, boxBottom: 406.7, lineBottom: 431.6, content: 643 },
} as const;

const area = (insets: { top: number; bottom: number }, node: React.ReactElement) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } })}>
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: SCREEN_H }, insets: { ...insets, left: 0, right: 0 } }}>{node}</SafeAreaProvider>
  </QueryClientProvider>
);
const settle = () => rtl.act(async () => void (await new Promise((r) => setTimeout(r, 0))));

let os: jest.ReplaceProperty<typeof Platform.OS>;
let listeners: Map<string, ((e: unknown) => void)[]>;
afterEach(() => {
  os?.restore();
  jest.restoreAllMocks();
  rtl.cleanup();
});
const say = (event: string, payload?: unknown) => rtl.act(async () => (listeners.get(event) ?? []).forEach((l) => l(payload)));
const keyboardEvent = { endCoordinates: { screenY: SCREEN_H - KEYBOARD, height: KEYBOARD, screenX: 0, width: 390 }, duration: 0, easing: 'keyboard' as const };

describe.each(Object.keys(PHONES) as Phone[])('R-117 B, patch A · the host form keeps the whole focused field above Continue and the keyboard (%s)', (name) => {
  const phone = PHONES[name];

  async function scene(state: 'plain' | 'error') {
    os = jest.replaceProperty(Platform, 'OS', name);
    listeners = new Map();
    jest.spyOn(Keyboard, 'addListener').mockImplementation(((event: string, fn: (e: unknown) => void) => {
      listeners.set(event, [...(listeners.get(event) ?? []), fn]);
      return { remove: () => listeners.set(event, (listeners.get(event) ?? []).filter((l) => l !== fn)) };
    }) as never);
    jest.spyOn(Keyboard, 'isVisible').mockReturnValue(false);
    const m = MEASURED[state];
    let focused = false;
    jest.spyOn(TextInput.State, 'currentlyFocusedInput').mockImplementation(
      () => (focused ? { measureLayout: (_to: unknown, done: (x: number, y: number, w: number, h: number) => void) => done(0, m.inputY, 316, m.inputH) } : null) as never,
    );

    await rtl.render(area(phone, <HostScreen onBack={jest.fn()} onDiscover={jest.fn()} onDone={jest.fn()} />));
    const input = await rtl.screen.findByTestId('host-org');
    if (state === 'error') {
      // The form is empty and Continue says so under each field: the lines are on screen before the field is touched.
      await rtl.fireEvent.press(rtl.screen.getByTestId('host-continue'));
      await rtl.screen.findByText('Say who is running it.');
    }

    // The scroll the phone has: it takes scrollTo and offsets the way a ScrollView does (clamped to its content).
    const scrollTo = jest.spyOn(ScrollView.prototype as unknown as { scrollTo: (to: { y: number }) => void }, 'scrollTo').mockImplementation(() => undefined);
    jest.spyOn(ScrollView.prototype as unknown as { getInnerViewNode: () => number }, 'getInnerViewNode').mockReturnValue(1);
    // The form's own scroll: the nearest thing above its fields that takes the scroll's events (FieldScroll's handlers, the real ones).
    let scroll = input.parent;
    while (scroll && typeof scroll.props.onScroll !== 'function') scroll = scroll.parent;
    if (!scroll) throw new Error('the form has no scroll');
    const scrollProps = scroll.props as { onLayout: (e: unknown) => void; onScroll: (e: unknown) => void };
    let offset = 0;
    const layScroll = async (height: number) => rtl.act(async () => scrollProps.onLayout({ nativeEvent: { layout: { x: 0, y: 0, width: 390, height } } }));
    const moveTo = async (y: number, height: number) => {
      offset = Math.max(0, Math.min(y, m.content - height));
      await rtl.act(async () => scrollProps.onScroll({ nativeEvent: { contentOffset: { x: 0, y: offset } } }));
    };
    // The frame is laid out full height first; the scroll then has the screen less the bar, the tabs and the foot (with its bottom inset).
    await rtl.act(async () => rtl.screen.getByTestId('host-screen').props.onLayout({ nativeEvent: { layout: { x: 0, y: 0, width: 390, height: SCREEN_H } }, persist: () => undefined }));
    const footResting = MEASURED.footWithKeyboard - 12 + footMetrics.bottom + phone.bottom;
    const before = SCREEN_H - phone.top - MEASURED.barAndTabs - footResting;
    await layScroll(before);

    // The field takes the focus (the keyboard is not up yet), then the keyboard comes up as the phone says it.
    focused = true;
    await rtl.fireEvent(input, 'focus');
    await settle();
    await say(phone.show, keyboardEvent);
    await settle();
    // What the frame padded is what the layout engine takes off the scroll: read from the real frame, not assumed.
    const padded = StyleSheet.flatten(rtl.screen.getByTestId('host-screen').props.style).paddingBottom as number;
    const shown = SCREEN_H - phone.top - MEASURED.barAndTabs - MEASURED.footWithKeyboard - padded;
    scrollTo.mockClear();
    await layScroll(shown);
    await settle();
    const asked = scrollTo.mock.calls.length ? (scrollTo.mock.calls[scrollTo.mock.calls.length - 1][0] as { y: number }).y : 0;
    await moveTo(asked, shown);
    return { m, padded, shown, offset, scrollTo };
  }

  it.each(['plain', 'error'] as const)('the field with %s is scrolled until its label, its box and its last line are inside what is left above Continue', async (state) => {
    const { m, padded, shown, offset } = await scene(state);
    expect(padded).toBe(KEYBOARD);
    // The scroll is what is left of the screen: its foot is where the Continue button's row begins, and that row ends where the keyboard begins.
    const scrollTopOnScreen = phone.top + MEASURED.barAndTabs;
    const continueTop = scrollTopOnScreen + shown;
    expect(continueTop + MEASURED.footWithKeyboard).toBe(SCREEN_H - KEYBOARD);
    const head = m.labelTop - offset;
    const foot = (m.lineBottom ?? m.boxBottom) - offset;
    // The top of the field (its label) is not above the scroll, the bottom of the field is not under it, so it is above Continue and the keyboard.
    expect(head).toBeGreaterThanOrEqual(0);
    expect(foot).toBeLessThanOrEqual(shown);
    expect(scrollTopOnScreen + foot).toBeLessThanOrEqual(continueTop);
    expect(scrollTopOnScreen + foot).toBeLessThanOrEqual(SCREEN_H - KEYBOARD);
  });

  it('control: the scroll is asked to move, because the field did not fit once the keyboard shortened it', async () => {
    const { scrollTo, offset } = await scene('plain');
    expect(scrollTo).toHaveBeenCalled();
    expect(offset).toBeGreaterThan(0);
  });
});
