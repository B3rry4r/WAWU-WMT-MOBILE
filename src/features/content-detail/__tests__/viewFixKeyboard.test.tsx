/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';
import { Keyboard, Platform, StyleSheet, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/*
 * VIEW-FIX (R-117) part B, as an Android phone with the real keyboard events: Android 15 and SDK 57 draw the app edge to edge, so the window
 * does not resize for the keyboard and the typing box sat under it. The comment sheet lifts by `KeyboardAvoidingView` padding (the
 * `keyboardDidShow` event, the way the phone says it); the request sheet and every sheet that uses `useKeyboardLift` add the keyboard's
 * height under their last row.
 */
type Page = import('../usePage').Page;
const { CommentsSheet } = require('../CommentsSheet') as typeof import('../CommentsSheet');
const { RequestSheet } = require('@/features/chat/RequestSheet') as typeof import('@/features/chat/RequestSheet');
const { useKeyboardLift } = require('@/features/feedpay/useKeyboardLift') as typeof import('@/features/feedpay/useKeyboardLift');

jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(async () => null), setItemAsync: jest.fn(async () => undefined), deleteItemAsync: jest.fn(async () => undefined) }));

const KEYBOARD = 336;
const SCREEN_H = 844;
const keyboardEvent = { endCoordinates: { screenY: SCREEN_H - KEYBOARD, height: KEYBOARD, screenX: 0, width: 390 }, duration: 0, easing: 'keyboard' as const };

const page = {
  comments: { isPending: false, isError: false, data: { pages: [{ items: [], nextPage: null }] }, hasNextPage: false, isFetchingNextPage: false, fetchNextPage: jest.fn(), refetch: jest.fn() },
  post: { isPending: false, mutate: jest.fn() },
  likeComment: { mutate: jest.fn() },
} as unknown as Page;
const area = (node: React.ReactElement) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: SCREEN_H }, insets: { top: 24, left: 0, right: 0, bottom: 24 } }}>{node}</SafeAreaProvider>;
const settle = () => rtl.act(async () => void (await new Promise((r) => setTimeout(r, 0))));

let os: jest.ReplaceProperty<typeof Platform.OS>;
let listeners: Map<string, ((e: unknown) => void)[]>;
beforeEach(() => {
  os = jest.replaceProperty(Platform, 'OS', 'android');
  listeners = new Map();
  // The keyboard says what the phone says: Android has no "will" events, only `keyboardDidShow` and `keyboardDidHide`.
  jest.spyOn(Keyboard, 'addListener').mockImplementation(((event: string, fn: (e: unknown) => void) => {
    listeners.set(event, [...(listeners.get(event) ?? []), fn]);
    return { remove: () => listeners.set(event, (listeners.get(event) ?? []).filter((l) => l !== fn)) };
  }) as never);
  jest.spyOn(Keyboard, 'isVisible').mockReturnValue(false);
});
afterEach(() => {
  os.restore();
  jest.restoreAllMocks();
});
const say = (event: string, payload?: unknown) => rtl.act(async () => (listeners.get(event) ?? []).forEach((l) => l(payload)));

describe('R-117 B · the comment box rides above the keyboard (Android)', () => {
  it('the sheet pads its foot by the keyboard when the phone says it is up, and gives it back when it goes: the box sits on the keyboard, not under it', async () => {
    await rtl.render(area(<CommentsSheet visible onClose={jest.fn()} count={0} page={page} />));
    const sheet = rtl.screen.getByTestId('comments-keyboard');
    // A KeyboardAvoidingView measures its own frame: the sheet is 170 from the top and runs to the bottom.
    await rtl.act(async () => sheet.props.onLayout({ nativeEvent: { layout: { x: 0, y: 170, width: 390, height: SCREEN_H - 170 } }, persist: () => undefined }));
    expect(StyleSheet.flatten(sheet.props.style).paddingBottom ?? 0).toBe(0);
    await say('keyboardDidShow', keyboardEvent);
    await settle();
    expect(StyleSheet.flatten(rtl.screen.getByTestId('comments-keyboard').props.style).paddingBottom).toBe(KEYBOARD);
    await say('keyboardDidHide');
    await settle();
    expect(StyleSheet.flatten(rtl.screen.getByTestId('comments-keyboard').props.style).paddingBottom ?? 0).toBe(0);
  });

  it('the box leaves out the bottom inset while the keyboard is up (the keyboard covers it) and has it back after', async () => {
    await rtl.render(area(<CommentsSheet visible onClose={jest.fn()} count={0} page={page} />));
    const box = () => StyleSheet.flatten(rtl.screen.getByTestId('comments-composer').props.style);
    const before = box().paddingBottom;
    expect(before).toBeGreaterThanOrEqual(24);
    await say('keyboardDidShow', keyboardEvent);
    expect(box().paddingBottom).toBeLessThan(before);
    await say('keyboardDidHide');
    expect(box().paddingBottom).toBe(before);
  });
});

describe('R-117 B · a bottom sheet with a field lifts for the keyboard on Android', () => {
  it('the request sheet adds the keyboard height under its last row while it is up, and takes it away after', async () => {
    await rtl.render(area(<RequestSheet visible onClose={jest.fn()} name="Bisi" chatId="t1" onSent={jest.fn()} onOpenWallet={jest.fn()} />));
    expect(rtl.screen.queryByTestId('request-keyboard-lift')).toBeNull();
    await say('keyboardDidShow', keyboardEvent);
    expect(StyleSheet.flatten(rtl.screen.getByTestId('request-keyboard-lift').props.style).height).toBe(KEYBOARD);
    await say('keyboardDidHide');
    expect(rtl.screen.queryByTestId('request-keyboard-lift')).toBeNull();
  });

  it('the shared hook answers on Android (it answered 0 before): the tip and ask sheets rise with it', async () => {
    function Probe() {
      return <Text testID="lift">{String(useKeyboardLift())}</Text>;
    }
    await rtl.render(<Probe />);
    expect(rtl.screen.getByTestId('lift').props.children).toBe('0');
    await say('keyboardDidShow', keyboardEvent);
    expect(rtl.screen.getByTestId('lift').props.children).toBe(String(KEYBOARD));
    await say('keyboardDidHide');
    expect(rtl.screen.getByTestId('lift').props.children).toBe('0');
  });
});
