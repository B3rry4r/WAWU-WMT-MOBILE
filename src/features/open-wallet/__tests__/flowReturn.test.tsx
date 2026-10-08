import { Stack, useRouter } from 'expo-router';
import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import TabsLayout from '@/app/(tabs)/_layout';
import Home from '@/app/(tabs)/index';
import Explore from '@/app/(tabs)/explore';
import Inbox from '@/app/(tabs)/inbox';
import Me from '@/app/(tabs)/me';

import { OPEN_WALLET_DETAILS_PATH, OPEN_WALLET_PIN_PATH, OPEN_WALLET_SELFIE_PATH, useOpenWalletEntry } from '../entry';
import { useOpenWalletWay } from '../leave';

/*
 * Where Open your wallet ends (KYC-04): after A10 the person is back where
 * they tapped. Each way in is a stand-in screen that calls the real
 * `useOpenWalletEntry().open`, as the real ones do: a tab (the Wallet tab's
 * own walk from the real `(tabs)/wallet` route, with W5 on return, is
 * WALLET-01's `src/features/wallet/__tests__/walletTabFlow.test.tsx`;
 * SHARED-CHANGES WALLET-01 #2) and the pay sheet's "Open your wallet"
 * (SHARED-CHANGES KYC-05 #1). The flow's screens are stand-ins too, each a button that moves the
 * way the real route does (`router.push` to the next step, and the real
 * `useOpenWalletWay().opened` and `.leave`), on the real Expo Router stack
 * and tabs.
 */
function Button({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress}>
      <Text>{label}</Text>
    </Pressable>
  );
}

/** A tab with a way in: what the flow needs from it is only that it calls `open` and is a tab. */
function TabWayIn() {
  const entry = useOpenWalletEntry();
  return (
    <View>
      <Text accessibilityRole="header">Wallet tab</Text>
      <Button label="Open your wallet from the Wallet tab" onPress={entry.open} />
    </View>
  );
}

/** A screen with a pay sheet open on it, whose no-wallet state leads to Open your wallet. */
function Payer() {
  const entry = useOpenWalletEntry();
  const [sheet, setSheet] = useState(false);
  return (
    <View>
      <Text accessibilityRole="header">Payer</Text>
      <Button label="Unlock" onPress={() => setSheet(true)} />
      {sheet ? (
        <View testID="pay-sheet">
          <Text>Pay sheet</Text>
          <Button label="Open your wallet from the pay sheet" onPress={entry.open} />
        </View>
      ) : null}
    </View>
  );
}

function A26() {
  const router = useRouter();
  return <Button label="A26 Continue" onPress={() => router.push(OPEN_WALLET_DETAILS_PATH)} />;
}
function A5() {
  const router = useRouter();
  return <Button label="A5 Continue" onPress={() => router.push(OPEN_WALLET_SELFIE_PATH)} />;
}
function A7() {
  const way = useOpenWalletWay();
  return <Button label="A7 account open" onPress={way.opened} />;
}
function A8() {
  const router = useRouter();
  return (
    <View>
      <Text accessibilityRole="header">A8</Text>
      <Button label="Create your transaction PIN" onPress={() => router.push(OPEN_WALLET_PIN_PATH)} />
    </View>
  );
}
function A10() {
  const way = useOpenWalletWay();
  return <Button label="A10 PIN set" onPress={way.leave} />;
}

const routes = {
  _layout: () => <Stack screenOptions={{ headerShown: false }} />,
  '(tabs)/_layout': TabsLayout,
  '(tabs)/index': Home,
  '(tabs)/explore': Explore,
  '(tabs)/inbox': Inbox,
  '(tabs)/wallet': TabWayIn,
  '(tabs)/me': Me,
  payer: Payer,
  'open-wallet': A26,
  'open-wallet-details': A5,
  'open-wallet-selfie': A7,
  'open-wallet-account': A8,
  'open-wallet-pin': A10,
};

beforeAll(async () => {
  const { unmount } = await renderRouter(routes);
  await unmount();
}, 60_000);

/** The router's own view of where it is (what `toHavePathname` reads). */
function pathname(): string {
  const { store } = jest.requireActual('expo-router/build/global-state/router-store') as { store: { getRouteInfo: () => { pathname: string } } };
  return store.getRouteInfo().pathname;
}

async function start(...args: Parameters<typeof renderRouter>): Promise<void> {
  await renderRouter(...args);
}

async function walkTheFlow() {
  await fireEvent.press(await screen.findByRole('button', { name: 'A26 Continue' }));
  await fireEvent.press(await screen.findByRole('button', { name: 'A5 Continue' }));
  await fireEvent.press(await screen.findByRole('button', { name: 'A7 account open' }));
  expect(await screen.findByRole('header', { name: 'A8' })).toBeTruthy();
  expect(pathname()).toBe('/open-wallet-account');
}

describe('after A10, a user goes back to where Open your wallet started', () => {
  it('from a tab: back on that tab, and Back from A8 never lands on an earlier step', async () => {
    await start(routes);
    await fireEvent.press(screen.getByRole('tab', { name: 'Wallet' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Open your wallet from the Wallet tab' }));
    expect(pathname()).toBe('/open-wallet');
    await walkTheFlow();
    // A26, A5 and A6 are gone: A8 sits straight on the Wallet tab.
    await act(async () => {
      screen.getByRole('header', { name: 'A8' });
    });
    await fireEvent.press(screen.getByRole('button', { name: 'Create your transaction PIN' }));
    expect(pathname()).toBe('/open-wallet-pin');
    await fireEvent.press(await screen.findByRole('button', { name: 'A10 PIN set' }));
    expect(pathname()).toBe('/wallet');
    expect(screen.getByRole('tab', { name: 'Wallet' }).props.accessibilityState.selected).toBe(true);
    expect(screen.queryByRole('header', { name: 'A8' })).toBeNull();
  });

  it('from a pay sheet: back on that screen with its pay sheet still open', async () => {
    await start(routes, { initialUrl: '/payer' });
    await fireEvent.press(screen.getByRole('button', { name: 'Unlock' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Open your wallet from the pay sheet' }));
    await walkTheFlow();
    await fireEvent.press(screen.getByRole('button', { name: 'Create your transaction PIN' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'A10 PIN set' }));
    expect(pathname()).toBe('/payer');
    expect(screen.getByTestId('pay-sheet')).toBeTruthy();
  });

  it('a Back from A8 goes to where the flow started, not to A7, A5 or A26', async () => {
    await start(routes, { initialUrl: '/payer' });
    await fireEvent.press(screen.getByRole('button', { name: 'Unlock' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Open your wallet from the pay sheet' }));
    await walkTheFlow();
    await act(async () => {
      screen.getByRole('header', { name: 'A8' });
    });
    const { router } = jest.requireActual('expo-router') as typeof import('expo-router');
    await act(async () => router.back());
    expect(pathname()).toBe('/payer');
  });
});
