import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { getAccessToken, isCurrentSessionToken } from '@/api/session';
import { loadPrefs } from '@/features/settings/devicePrefs';
import { APP_NAME_COPY } from '@/lib/appName';

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
    name: APP_NAME_COPY,
    importance: Notifications.AndroidImportance.HIGH,
    // Z2's Sound switch is off until the person turns it on. Android fixes a channel's sound when the
    // channel is made, so this is the switch's value on the first start.
    sound: sound ? 'default' : null,
  });
}

/**
 * One registration run. Sign-out cancels a run it cannot wait for: a cancelled run sends nothing it has not
 * sent yet, and takes the phone off again if its registration lands after the person signed out.
 */
type Run = {
  cancelled: boolean;
  /** The access token of the session the run was started in: whose phone it registers, and what a late removal uses. */
  owner: string | null;
  /** The Expo token this run got, known as soon as the phone hands it over. */
  token: string | null;
};

let inFlight: { promise: Promise<PushOutcome>; run: Run } | null = null;

/** Stops a run that belongs to a session that is ending or has ended: it sends nothing more, and takes the phone off again if it lands. */
function abandon(pending: NonNullable<typeof inFlight>): void {
  pending.run.cancelled = true;
  if (inFlight === pending) inFlight = null;
}

/** A registration that landed at the Hub after its person signed out. Nobody is left to ask for it, so it is taken off again. */
async function takeOffLate(token: string, bearer: string | null): Promise<void> {
  try {
    if (await getAccessToken()) {
      // Another person is signed in on this phone now: the phone is registered to them again, which also takes it from the one who left.
      void syncPush({ ask: false });
      return;
    }
    if (bearer) await removePushToken(token, bearer);
  } catch {
    // Nothing more can be done from here: Expo reports the phone dead if it is ever not reachable (BACKEND_GAPS G-268).
  }
}

async function run(ask: boolean, current: Run): Promise<PushOutcome> {
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
    current.token = token;
    if (current.cancelled) return 'off';
    const stored = await registerPushToken({
      expoPushToken: token,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
      ...(Constants.deviceName ? { deviceLabel: Constants.deviceName.slice(0, 100) } : {}),
    });
    if (current.cancelled) {
      if (stored) await takeOffLate(token, current.owner);
      return 'off';
    }
    if (!stored) return 'off';
    await rememberToken(token);
    return 'registered';
  } catch {
    return 'failed';
  }
}

/**
 * Registers this phone for the signed-in person, asking for permission first when `ask` is set and the
 * person has not been asked on this phone before. One run at a time: a second call shares the first, unless
 * the first was started in a session that has ended (sign-out, a refused refresh): that run is never shared
 * with the next person, who gets a run of their own.
 */
export async function syncPush(options: { ask: boolean }): Promise<PushOutcome> {
  if (Platform.OS === 'web') return 'unsupported';
  const owner = await getAccessToken().catch(() => null);
  if (inFlight && !(inFlight.run.owner && isCurrentSessionToken(inFlight.run.owner))) abandon(inFlight);
  if (!inFlight) {
    const current: Run = { cancelled: false, owner, token: null };
    const promise: Promise<PushOutcome> = run(options.ask, current).finally(() => {
      if (inFlight?.promise === promise) inFlight = null;
    });
    inFlight = { promise, run: current };
  }
  return inFlight.promise;
}

/**
 * Removes this phone from the signed-in person at sign-out, so no more pushes reach it. Called while the
 * session still works, and before WAWU ID is told to end the session (the removal may need to refresh an
 * access token that ran out, which an ended session cannot do). A registration still on its way is waited
 * for first, so it cannot land after the removal, but only for `waitMs`: a registration that has not settled
 * by then is cancelled, so it sends nothing more, takes the phone off again if it lands after the sign-out,
 * and never holds up the next person's registration. It never rejects. The phone forgets its token whether
 * or not the Hub could be reached; a phone signed out with no connection keeps its registration until
 * another person signs in on it or Expo reports it dead (BACKEND_GAPS G-268).
 */
export async function forgetPush(waitMs = 3000): Promise<void> {
  if (Platform.OS === 'web') return;
  const bearer = await getAccessToken().catch(() => null);
  const pending = inFlight;
  let unsettled: string | null = null;
  if (pending) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const settled = await Promise.race([
      pending.promise.then(
        () => true,
        () => true,
      ),
      new Promise<boolean>((resolve) => {
        timer = setTimeout(() => resolve(false), waitMs);
      }),
    ]);
    clearTimeout(timer);
    if (!settled) {
      // The newest token this session holds: the one the run started with may have run out and been refreshed since, and a late
      // removal with a dead token would be refused (SWEEP-INBOX INBOX-21 R2-2).
      pending.run.owner = bearer ?? pending.run.owner;
      abandon(pending);
      unsettled = pending.run.token;
    }
  }
  const remembered = await rememberedToken();
  // Forgotten before the first request goes out, not after the last one comes back: a removal that hangs past the sign-out's 3 seconds
  // returns when the next person has already signed in and registered, and forgetting then would wipe their token, so their own
  // sign-out would send no removal (SWEEP-INBOX INBOX-21 R2-1).
  await forgetToken();
  for (const token of new Set([unsettled, remembered])) {
    // Only while this person's session is the one running: a sign-out that stopped waiting must not go on to
    // remove the phone from whoever signs in next.
    if (!token || !bearer || !isCurrentSessionToken(bearer)) continue;
    try {
      await removePushToken(token);
    } catch {
      // Signing out goes on: the phone cannot be reached or is not signed in any more (see above).
    }
  }
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
