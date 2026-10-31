/* eslint-disable @typescript-eslint/no-require-imports */
import { render, screen } from '@testing-library/react-native';
import { Keyboard, KeyboardAvoidingView, Platform } from 'react-native';

/*
 * VIEW-FIX round 2 (verifier finding 1): /preview/view-fix puts the phone in Android's clothes (Platform.OS, the keyboard listeners and
 * KeyboardAvoidingView's rule) to draw the keyboard pictures. A release build must get the redirect and none of that set-up, so the
 * guard comes first and the set-up lives in the component the guard lets through. The positive control proves the test can see the change.
 */
jest.mock('expo-router', () => ({
  router: { setParams: jest.fn(), push: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => ({ state: 'closed' }),
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  useIsFocused: () => true,
}));
jest.mock('@/features/shell/LeaveDevRoute', () => {
  const { Text } = require('react-native');
  const { createElement } = require('react');
  return { LeaveDevRoute: () => createElement(Text, { testID: 'left-dev-route' }, 'left') };
});

const globals = globalThis as unknown as { __DEV__: boolean };
// The gallery pulls in the whole app (the heavy part of a cold cache): loaded here, once, so no test's 20 s timeout pays for it.
const ViewFix = (require('@/app/preview/view-fix') as typeof import('@/app/preview/view-fix')).default;
const Route = () => <ViewFix />;
const avoiding = () => KeyboardAvoidingView.prototype as unknown as Record<string, unknown>;

afterEach(() => {
  globals.__DEV__ = true;
  // The gallery seeds the app's cache; its garbage-collection timers would keep the test process open.
  (require('@/api/query') as typeof import('@/api/query')).queryClient.clear();
});

describe('/preview/view-fix in a release build', () => {
  it('draws the redirect and leaves Platform.OS, Keyboard.addListener and KeyboardAvoidingView exactly as they were', async () => {
    globals.__DEV__ = false;
    const os = Platform.OS;
    const addListener = Keyboard.addListener;
    const { componentDidMount, render: draw } = avoiding();
    const view = await render(<Route />);
    expect(screen.getByTestId('left-dev-route')).toBeTruthy();
    expect(Platform.OS).toBe(os);
    expect(Platform.OS).not.toBe('android');
    expect(Keyboard.addListener).toBe(addListener);
    expect(avoiding().componentDidMount).toBe(componentDidMount);
    expect(avoiding().render).toBe(draw);
    await view.unmount();
    expect(Platform.OS).toBe(os);
    expect(Keyboard.addListener).toBe(addListener);
  });

  it('control: in a development build the gallery does put the phone in Android clothes while it is open, and puts it back on close', async () => {
    globals.__DEV__ = true;
    const os = Platform.OS;
    const addListener = Keyboard.addListener;
    const view = await render(<Route />);
    expect(screen.queryByTestId('left-dev-route')).toBeNull();
    expect(Platform.OS).toBe('android');
    expect(Keyboard.addListener).not.toBe(addListener);
    await view.unmount();
    expect(Platform.OS).toBe(os);
    expect(Keyboard.addListener).toBe(addListener);
  });
});
