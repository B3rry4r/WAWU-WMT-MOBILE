/* eslint-disable @typescript-eslint/no-require-imports */
import { Stack } from 'expo-router';
import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import * as rtl from '@testing-library/react-native';
import { Text, View } from 'react-native';

import { ErrorScreen, errorDetails } from '@/components/ErrorScreen';

/*
 * WALLET-BLANK: a screen that throws while it draws shows "Something went wrong" with Try again and Go to Home, and never nothing. The two
 * layouts that carry the boundary are checked as the router reads them, and the tabs' boundary is driven on the real router: the tab bar
 * (a stand-in sibling) stays, Try again draws the screen again, and Details shows the error's name and first line, never a stack.
 */
jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(async () => null), setItemAsync: jest.fn(async () => undefined), deleteItemAsync: jest.fn(async () => undefined) }));

let broken = true;
function Throws() {
  if (broken) {
    const error = new TypeError("Cannot read properties of null (reading 'layout')\n    at secret (/data/user/0/app/stack.js:1:1)");
    throw error;
  }
  return <Text>Wallet is fine</Text>;
}
function TabsLike() {
  return (
    <View>
      <Stack screenOptions={{ headerShown: false }} />
      <Text>Tab bar</Text>
    </View>
  );
}

beforeEach(() => {
  broken = true;
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => jest.restoreAllMocks());

describe('the error screen', () => {
  it('says what happened plainly, with Try again and Go to Home, and no em-dash', async () => {
    const retry = jest.fn();
    await rtl.render(<ErrorScreen error={new Error('boom')} retry={retry} />);
    expect(rtl.screen.getByText('Something went wrong')).toBeTruthy();
    expect(rtl.screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
    expect(rtl.screen.getByRole('button', { name: 'Go to Home' })).toBeTruthy();
    expect(rtl.screen.queryByText(/—/)).toBeNull();
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('keeps the error behind a Details link: its name and first line, cut short, never a stack', async () => {
    await rtl.render(<ErrorScreen error={new TypeError('Cannot read properties of null\n    at secret (/data/app.js:1:1)')} retry={jest.fn()} />);
    expect(rtl.screen.queryByTestId('error-details')).toBeNull();
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Details' }));
    expect(rtl.screen.getByTestId('error-details').props.children).toBe('TypeError: Cannot read properties of null');
    expect(errorDetails('x'.repeat(500)).length).toBeLessThanOrEqual(160);
    expect(errorDetails(undefined)).toBe('Error');
  });
});

describe('the boundary in the two layouts', () => {
  it('the root layout exports ErrorBoundary and the tabs layout names the same screen as their screen boundary', () => {
    const root = require('@/app/_layout') as { ErrorBoundary: unknown };
    const tabs = require('@/app/(tabs)/_layout') as { unstable_settings: { screenErrorBoundary: unknown } };
    expect(root.ErrorBoundary).toBe(ErrorScreen);
    expect(tabs.unstable_settings.screenErrorBoundary).toBe(ErrorScreen);
  });

  it('a tab screen that throws shows the error screen in its place with the tab bar still there, and Try again draws it again', async () => {
    await renderRouter({
      _layout: { default: TabsLike, unstable_settings: { screenErrorBoundary: ErrorScreen } },
      index: Throws,
    } as never);
    expect(await screen.findByText('Something went wrong')).toBeTruthy();
    expect(screen.getByText('Tab bar')).toBeTruthy();
    broken = false;
    fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(screen.getByText('Wallet is fine')).toBeTruthy());
    expect(screen.queryByText('Something went wrong')).toBeNull();
  });
});
