import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { loadPrefs } from '@/features/settings/devicePrefs';

import { registerPushToken, removePushToken } from './api';
import { forgetToken, markAsked, rememberToken, rememberedToken, wasAsked } from './storage';

/**
 * The phone side of push (INBOX-21): the permission ask, the token, and the two
 * calls that tell the Hub about this phone (INBOX-03).
 *
 *   registered   the Hub holds this phone for the signed-in person
 *   off          the person has not allowed notifications (or the Hub refused the phone); nothing else changes
 *   unsupported  the browser build, which has no push
 *   failed       something could not be reached; the next start tries again
 *
 * Refusing is a normal answer, not an error: the app keeps working and the
 * in-app notifications are unaffected.
 */
export type PushOutcome = 'registered' | 'off' | 'unsupported' | 'failed';

/** The Android channel every push lands in. The app config names it as the default (`defaultChannel`, app.json). */
export const CHANNEL_ID = 'default';

/** Android 13 and later only ask for permission once a channel exists, so the channel is made first. */
async function ensureChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  const { sound } = await loadPrefs();
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'WAWU',
    importance: Notifications.AndroidImportance.HIGH,
    // Z2's Sound switch is off until the person turns it on. Android fixes a channel's sound when the
    // channel is made, so this is the switch's value on the first start.
    sound: sound ? 'default' : null,
  });
}

let inFlight: Promise<PushOutcome> | null = null;

async function run(ask: boolean): Promise<PushOutcome> {
  try {
    await ensureChannel();
    let permission = await Notifications.getPermissionsAsync();
    if (!permission.granted && permission.canAskAgain && ask && !(await wasAsked())) {
      await markAsked();
      permission = await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: false, allowSound: true },
      });
    }
    if (!permission.granted) return 'off';
    const { data: token } = await Notifications.getExpoPushTokenAsync();
    const stored = await registerPushToken({
      expoPushToken: token,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
      ...(Constants.deviceName ? { deviceLabel: Constants.deviceName.slice(0, 100) } : {}),
    });
    if (!stored) return 'off';
    await rememberToken(token);
    return 'registered';
  } catch {
    return 'failed';
  }
}

/**
 * Registers this phone for the signed-in person, asking for permission first when `ask` is set and the
 * person has not been asked on this phone before. One run at a time: a second call shares the first.
 */
export function syncPush(options: { ask: boolean }): Promise<PushOutcome> {
  if (Platform.OS === 'web') return Promise.resolve('unsupported');
  inFlight ??= run(options.ask).finally(() => {
    inFlight = null;
  });
  return inFlight;
}

/**
 * Removes this phone from the signed-in person at sign-out, so no more pushes reach it. Called while the
 * session still works. A registration still on its way is waited for first, so it cannot land after the
 * removal. It never rejects. The phone forgets its token whether or not the Hub could be reached; a phone signed out with no
 * connection keeps its registration until another person signs in on it or Expo reports it dead (BACKEND_GAPS G-268).
 */
export async function forgetPush(): Promise<void> {
  if (Platform.OS === 'web') return;
  await inFlight?.catch(() => undefined);
  const token = await rememberedToken();
  if (!token) return;
  try {
    await removePushToken(token);
  } catch {
    // Signing out goes on: the phone cannot be reached or is not signed in any more (see above).
  }
  await forgetToken();
}

/** Sets how a push is shown while the app is open: as a banner, with a sound only when Z2's Sound is on, and no badge. */
export function installPushHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: (await loadPrefs()).sound,
      shouldSetBadge: false,
    }),
  });
}
