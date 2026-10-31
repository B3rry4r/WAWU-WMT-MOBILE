/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Dimensions, Keyboard, Platform, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/*
 * VIEW-FIX round 1 (R-117, owner hard rule 3: a fix is done only when it is carried out everywhere), on Android AND iPhone with the phone's
 * own keyboard events and the real handlers:
 *  - B, every screen where a person types keeps the field and its button above the keyboard: the frames that carry them are padded by the
 *    keyboard (`KeyboardAvoidingView`, 'padding'), the sheets add the keyboard's height under their last row, and the scroll brings the field
 *    being typed in into view.
 *  - C, the players the first round did not reach show the spinner while the file is coming in and the words when it will not load.
 */
type Props = Record<string, unknown> & { playing?: boolean; onLoad?: (state: 'waiting' | 'ready' | 'failed') => void };
const mockPlayers: { audio?: Props; video?: Props } = {};
jest.mock('@/features/feed/player', () => ({
  canPlay: true,
  AudioSource: (props: Props) => {
    mockPlayers.audio = props;
    return null;
  },
  VideoSurface: (props: Props) => {
    mockPlayers.video = props;
    return null;
  },
}));
jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(async () => null), setItemAsync: jest.fn(async () => undefined), deleteItemAsync: jest.fn(async () => undefined) }));
const mockDetail = {
  id: 'm1', title: 'Title m1', premiering: false, premierDate: null, mustAgreeTerms: false, trailer: { kind: 'file', url: 'https://cdn.example.test/t.mp4' },
};
jest.mock('@/features/movies/api', () => ({
  ...jest.requireActual('@/features/movies/api'),
  fetchDetail: jest.fn(async () => mockDetail),
}));

// The Hub's bank list (the api client reads `fetch` when it loads, so it stands here, above the requires).
globalThis.fetch = jest.fn(async () => new Response(JSON.stringify({ statusCode: 200, message: 'OK', data: [{ code: '044', name: 'Access Bank' }, { code: '058', name: 'Guaranty Trust Bank' }] }), { status: 200, headers: { 'content-type': 'application/json' } })) as typeof fetch;

const { CreateFrame } = require('@/features/create/CreateFrame') as typeof import('@/features/create/CreateFrame');
const { ShopFrame } = require('@/features/verify/parts') as typeof import('@/features/verify/parts');
const { LegalFrame } = require('@/features/legal/ui') as typeof import('@/features/legal/ui');
const { ScreenFrame } = require('@/components/ScreenFrame') as typeof import('@/components/ScreenFrame');
const { PointsFrame } = require('@/features/points/PointsFrame') as typeof import('@/features/points/PointsFrame');
const { ProFrame } = require('@/features/pro-listing/ProFrame') as typeof import('@/features/pro-listing/ProFrame');
const { TextField } = require('@/components/TextField') as typeof import('@/components/TextField');
const { FieldScroll } = require('@/components/FieldScroll') as typeof import('@/components/FieldScroll');
const { CancelSheet } = require('@/features/events/organiser/CancelSheet') as typeof import('@/features/events/organiser/CancelSheet');
const { BankSheet } = require('@/features/wallet/BankSheet') as typeof import('@/features/wallet/BankSheet');
const { PreviewPlay } = require('@/features/points/VoiceExtras') as typeof import('@/features/points/VoiceExtras');
const { WorkCover } = require('@/features/works/WorkCover') as typeof import('@/features/works/WorkCover');
const { TrailerScreen } = require('@/features/movies/TrailerScreen') as typeof import('@/features/movies/TrailerScreen');
const { VoiceHearScreen } = require('@/features/verify/VoiceHearScreen') as typeof import('@/features/verify/VoiceHearScreen');
const { queryClient } = require('@/api/query') as typeof import('@/api/query');

const KEYBOARD = 336;
const SCREEN_H = 844;
const OSES = ['android', 'ios'] as const;
type Phone = (typeof OSES)[number];
const showEvent = (os: Phone) => (os === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow');
const hideEvent = (os: Phone) => (os === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide');
const keyboardEvent = { endCoordinates: { screenY: SCREEN_H - KEYBOARD, height: KEYBOARD, screenX: 0, width: 390 }, duration: 0, easing: 'keyboard' as const };

const area = (node: React.ReactElement) => (
  <QueryClientProvider client={queryClient}>
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: SCREEN_H }, insets: { top: 24, left: 0, right: 0, bottom: 24 } }}>{node}</SafeAreaProvider>
  </QueryClientProvider>
);
const settle = () => rtl.act(async () => void (await new Promise((r) => setTimeout(r, 0))));

let os: jest.ReplaceProperty<typeof Platform.OS>;
let listeners: Map<string, ((e: unknown) => void)[]>;
function phone(name: Phone) {
  os = jest.replaceProperty(Platform, 'OS', name);
  listeners = new Map();
  // The keyboard says what each phone says: the iPhone announces before it moves (`will`), Android once it is up (`did`).
  jest.spyOn(Keyboard, 'addListener').mockImplementation(((event: string, fn: (e: unknown) => void) => {
    listeners.set(event, [...(listeners.get(event) ?? []), fn]);
    return { remove: () => listeners.set(event, (listeners.get(event) ?? []).filter((l) => l !== fn)) };
  }) as never);
  jest.spyOn(Keyboard, 'isVisible').mockReturnValue(false);
}
afterEach(() => {
  os?.restore();
  jest.restoreAllMocks();
  rtl.cleanup();
});
const say = (event: string, payload?: unknown) => rtl.act(async () => (listeners.get(event) ?? []).forEach((l) => l(payload)));
/** Lays the named view out full height (the way the phone does) and raises the keyboard; returns the bottom padding the view took. */
async function raise(name: Phone, testID: string) {
  await rtl.act(async () => rtl.screen.getByTestId(testID).props.onLayout({ nativeEvent: { layout: { x: 0, y: 0, width: 390, height: SCREEN_H } }, persist: () => undefined }));
  const before = StyleSheet.flatten(rtl.screen.getByTestId(testID).props.style).paddingBottom ?? 0;
  await say(showEvent(name), keyboardEvent);
  await settle();
  const after = StyleSheet.flatten(rtl.screen.getByTestId(testID).props.style).paddingBottom ?? 0;
  await say(hideEvent(name));
  await settle();
  const back = StyleSheet.flatten(rtl.screen.getByTestId(testID).props.style).paddingBottom ?? 0;
  return { before, after, back };
}

const field = <TextField label="Name" value="" onChangeText={jest.fn()} testID="field" />;
const nothing = jest.fn();

describe.each(OSES)('R-117 B · the frames that hold a field ride above the keyboard (%s)', (name) => {
  beforeEach(() => phone(name));
  const cases: [string, () => React.ReactElement][] = [
    ['features/create/CreateFrame (new community, edit details, create details, price, upload)', () => <CreateFrame testID="root" title="T" onLeave={nothing} foot={<Text>foot</Text>}>{field}</CreateFrame>],
    ['features/verify/ShopFrame (the product draft form)', () => <ShopFrame testID="root" title="T" onBack={nothing} foot={<Text>foot</Text>}>{field}</ShopFrame>],
    ['features/legal/LegalFrame with keyboard (fixed-price request, matter)', () => <LegalFrame testID="root" title="T" onBack={nothing} keyboard foot={<Text>foot</Text>}>{field}</LegalFrame>],
    ['components/ScreenFrame with keyboard (work forms, password, and every screen that passes it)', () => <ScreenFrame testID="root" title="T" gap={8} idPrefix="sf" keyboard>{field}</ScreenFrame>],
    ['points/PointsFrame', () => <PointsFrame testID="root" title="T" gap={8} foot={<Text>foot</Text>}>{field}</PointsFrame>],
    ['pro-listing/ProFrame', () => <ProFrame testID="root" title="T" gap={8} foot={<Text>foot</Text>}>{field}</ProFrame>],
  ];
  it.each(cases)('%s is padded by the keyboard while it is up, and gives it back', async (_label, make) => {
    await rtl.render(area(make()));
    const { before, after, back } = await raise(name, 'root');
    expect(before).toBe(0);
    expect(after).toBe(KEYBOARD);
    expect(back).toBe(0);
  });

  it('a pinned foot drops the bottom inset while the keyboard is up (it covers it), so the button sits on the keyboard', async () => {
    await rtl.render(area(<CreateFrame testID="root" title="T" onLeave={nothing} foot={<Text testID="foot">foot</Text>}>{field}</CreateFrame>));
    const footStyle = () => StyleSheet.flatten(rtl.screen.getByTestId('foot').parent?.props.style).paddingBottom as number;
    const resting = footStyle();
    expect(resting).toBeGreaterThanOrEqual(24);
    await say(showEvent(name), keyboardEvent);
    expect(footStyle()).toBeLessThan(resting);
    await say(hideEvent(name));
    expect(footStyle()).toBe(resting);
  });
});

describe.each(OSES)('R-117 B · the sheets with a field add the keyboard under their last row (%s)', (name) => {
  beforeEach(() => phone(name));

  it('the cancel-event sheet (the reason field)', async () => {
    await rtl.render(area(<CancelSheet visible onClose={nothing} buyers={3} onCancel={jest.fn()} onDone={nothing} />));
    expect(rtl.screen.queryByTestId('cancel-keyboard-lift')).toBeNull();
    await say(showEvent(name), keyboardEvent);
    expect(StyleSheet.flatten(rtl.screen.getByTestId('cancel-keyboard-lift').props.style).height).toBe(KEYBOARD);
    await say(hideEvent(name));
    expect(rtl.screen.queryByTestId('cancel-keyboard-lift')).toBeNull();
  });

  it('the bank sheet (the search field): the room is added under the list and the list shortens to what is left', async () => {
    Dimensions.set({ window: { width: 390, height: SCREEN_H, scale: 3, fontScale: 1 }, screen: { width: 390, height: SCREEN_H, scale: 3, fontScale: 1 } });
    await rtl.render(area(<BankSheet visible onClose={nothing} onPick={nothing} selectedCode={null} />));
    const list = await rtl.screen.findByTestId('bank-sheet-list');
    const resting = StyleSheet.flatten(list.props.style).maxHeight as number;
    expect(rtl.screen.queryByTestId('bank-sheet-keyboard-lift')).toBeNull();
    await say(showEvent(name), keyboardEvent);
    expect(StyleSheet.flatten(rtl.screen.getByTestId('bank-sheet-keyboard-lift').props.style).height).toBe(KEYBOARD);
    expect(StyleSheet.flatten(rtl.screen.getByTestId('bank-sheet-list').props.style).maxHeight).toBeLessThan(resting);
    await say(hideEvent(name));
    expect(rtl.screen.queryByTestId('bank-sheet-keyboard-lift')).toBeNull();
    expect(StyleSheet.flatten(rtl.screen.getByTestId('bank-sheet-list').props.style).maxHeight).toBe(resting);
  });
});

describe.each(OSES)('R-117 B · the scroll brings the field being typed in into view (%s)', (name) => {
  beforeEach(() => phone(name));

  async function scene(measured: { y: number; h: number }, offset = 0) {
    const scrollTo = jest.fn();
    let instance: ScrollView | null = null;
    jest.spyOn(TextInput.State, 'currentlyFocusedInput').mockReturnValue({ measureLayout: (_to: unknown, ok: (x: number, y: number, w: number, h: number) => void) => ok(0, measured.y, 300, measured.h) } as never);
    await rtl.render(
      <FieldScroll
        testID="scroll"
        ref={(node) => {
          instance = node;
          if (node) Object.assign(node, { scrollTo, getInnerViewNode: () => 1 });
        }}
      >
        {field}
      </FieldScroll>,
    );
    void instance;
    // The scroll is 500 high once the keyboard has shortened it, and sits at `offset`.
    await rtl.act(async () => rtl.screen.getByTestId('scroll').props.onScroll({ nativeEvent: { contentOffset: { x: 0, y: offset } } }));
    await rtl.act(async () => rtl.screen.getByTestId('scroll').props.onLayout({ nativeEvent: { layout: { x: 0, y: 0, width: 390, height: 500 } } }));
    await settle();
    return scrollTo;
  }

  it('a field below what is visible is scrolled up until its foot clears the scroll, with room', async () => {
    const scrollTo = await scene({ y: 700, h: 56 });
    expect(scrollTo).toHaveBeenCalledTimes(1);
    const to = (scrollTo.mock.calls[0][0] as { y: number }).y;
    expect(to).toBeGreaterThan(700 + 56 - 500);
    expect(to).toBeLessThanOrEqual(700);
  });

  it('a field already in view does not move the page', async () => {
    const scrollTo = await scene({ y: 200, h: 56 });
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('a field scrolled off the top is brought back down', async () => {
    const scrollTo = await scene({ y: 100, h: 56 }, 400);
    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect((scrollTo.mock.calls[0][0] as { y: number }).y).toBeLessThan(100);
  });
});

describe('R-117 B · every screen that types is on a frame or a sheet that rides above the keyboard (the hand-made inventory, checked in the source)', () => {
  const read = (file: string) => readFileSync(join(__dirname, '..', file), 'utf8');
  const screens: [string, RegExp][] = [
    ['features/community-host/NewCommunityScreen.tsx', /<CreateFrame/],
    ['features/library/EditDetailsScreen.tsx', /<CreateFrame/],
    ['features/create/DetailsScreen.tsx', /<CreateFrame/],
    ['features/verify/DraftFormScreen.tsx', /<ShopFrame/],
    ['features/legal/fixed/FixedPriceScreen.tsx', /<LegalFrame[\s\S]*keyboard/],
    ['features/events/organiser/CancelSheet.tsx', /useKeyboardLift\(\)/],
    ['features/wallet/BankSheet.tsx', /useKeyboardLift\(\)/],
    ['features/works/AddWorkScreen.tsx', /<ScreenFrame[\s\S]*keyboard/],
    ['features/events/host/HostScreen.tsx', /<KeyboardAvoidingView[^>]*behavior="padding"/],
    ['features/events/host/EditEventScreen.tsx', /<KeyboardAvoidingView[^>]*behavior="padding"/],
    ['features/events/host/TicketTypesScreen.tsx', /<KeyboardAvoidingView[^>]*behavior="padding"/],
    ['features/events/host/SentBackScreen.tsx', /<KeyboardAvoidingView[^>]*behavior="padding"/],
    ['features/events/organiser/SharedLinksScreen.tsx', /<KeyboardAvoidingView[^>]*behavior="padding"/],
    ['features/search/SearchScreen.tsx', /<KeyboardAvoidingView[^>]*behavior="padding"/],
    ['features/schools/SchoolsScreen.tsx', /<KeyboardAvoidingView[^>]*behavior="padding"/],
    ['features/wallet/history/HistoryScreen.tsx', /<KeyboardAvoidingView[^>]*behavior="padding"/],
    ['components/CountryPicker.tsx', /useKeyboardLift\(\)/],
  ];
  it.each(screens)('%s', (file, rule) => {
    expect(read(file)).toMatch(rule);
  });
  it('no KeyboardAvoidingView in the app is iOS-only any more (it does nothing on Android, which draws edge to edge)', () => {
    const { execSync } = require('node:child_process') as typeof import('node:child_process');
    const found = execSync(`grep -rnE "Platform.OS === 'ios' \\? 'padding'|behavior=\\{Platform" src --include=*.tsx --exclude-dir=__tests__ || true`, { cwd: join(__dirname, '..', '..') }).toString().trim();
    expect(found).toBe('');
  });
});

const report = (kind: 'audio' | 'video', state: 'waiting' | 'ready' | 'failed') => rtl.act(async () => mockPlayers[kind]?.onLoad?.(state));

describe.each(OSES)('R-117 C · the players the first round did not reach show the spinner and the words (%s)', (name) => {
  beforeEach(() => {
    phone(name);
    mockPlayers.audio = undefined;
    mockPlayers.video = undefined;
  });

  it('the sample play on a voice row: a spinner in place of pause while it comes in, the words when it will not load, and a tap asks again', async () => {
    await rtl.render(area(<PreviewPlay sampleUrl="https://files.test/s.mp3" name="Ada" />));
    await rtl.fireEvent.press(rtl.screen.getByTestId('sample-play-Ada'));
    expect(mockPlayers.audio?.playing).toBe(true);
    await report('audio', 'waiting');
    expect(rtl.screen.getByTestId('sample-spinner-Ada')).toBeTruthy();
    await report('audio', 'ready');
    expect(rtl.screen.queryByTestId('sample-spinner-Ada')).toBeNull();
    await report('audio', 'failed');
    expect(rtl.screen.getByTestId('sample-failed-Ada')).toBeTruthy();
    expect(mockPlayers.audio?.playing).toBe(false);
    await rtl.fireEvent.press(rtl.screen.getByTestId('sample-play-Ada'));
    expect(rtl.screen.queryByTestId('sample-failed-Ada')).toBeNull();
    expect(mockPlayers.audio?.playing).toBe(true);
  });

  it('a work\'s video cover: the spinner stands in the middle while it comes in, the words when it will not load, and the screen is told to stop', async () => {
    const onFailed = jest.fn();
    const media = { kind: 'video', url: 'https://files.test/w.mp4' } as never;
    const view = await rtl.render(<WorkCover media={media} playing onFailed={onFailed} testID="wc" />);
    await report('video', 'waiting');
    expect(rtl.screen.getByTestId('wc-spinner')).toBeTruthy();
    await report('video', 'failed');
    expect(rtl.screen.queryByTestId('wc-spinner')).toBeNull();
    expect(rtl.screen.getByTestId('wc-failed')).toBeTruthy();
    expect(onFailed).toHaveBeenCalledTimes(1);
    // The screen let it stop, and a new press on Play asks again.
    await view.rerender(<WorkCover media={media} playing={false} onFailed={onFailed} testID="wc" />);
    await view.rerender(<WorkCover media={media} playing onFailed={onFailed} testID="wc" />);
    expect(rtl.screen.queryByTestId('wc-failed')).toBeNull();
  });

  it('the trailer: the spinner in place of pause while it comes in, the words over the picture when it will not load, and Play asks again', async () => {
    await rtl.render(area(<TrailerScreen movieId="m1" onClose={nothing} />));
    await rtl.screen.findByTestId('trailer-toggle');
    expect(mockPlayers.video?.playing).toBe(true);
    await report('video', 'waiting');
    expect(rtl.screen.getByTestId('trailer-spinner')).toBeTruthy();
    await report('video', 'ready');
    expect(rtl.screen.queryByTestId('trailer-spinner')).toBeNull();
    await report('video', 'failed');
    expect(rtl.screen.getByTestId('trailer-failed')).toBeTruthy();
    expect(mockPlayers.video?.playing).toBe(false);
    await rtl.fireEvent.press(rtl.screen.getByTestId('trailer-toggle'));
    expect(rtl.screen.queryByTestId('trailer-failed')).toBeNull();
    expect(mockPlayers.video?.playing).toBe(true);
  });

  it('Hear yourself (the Voice Intro): the pill shows its loading state while the intro comes in and its own failure row when it will not load', async () => {
    await rtl.render(
      area(<VoiceHearScreen name="Ada" hue="lilac" avatarUrl={null} audioUrl="https://files.test/i.mp3" text="Hello" aiVoice onBack={nothing} onUse={nothing} onEditText={nothing} onReRecord={nothing} />),
    );
    expect(mockPlayers.audio?.playing).toBe(true);
    await report('audio', 'waiting');
    expect(rtl.screen.getByLabelText('Loading Bio')).toBeTruthy();
    await report('audio', 'ready');
    expect(rtl.screen.getByLabelText('Pause Bio')).toBeTruthy();
    await report('audio', 'failed');
    expect(rtl.screen.getByLabelText(/Try again$/)).toBeTruthy();
    expect(mockPlayers.audio?.playing).toBe(false);
  });
});
