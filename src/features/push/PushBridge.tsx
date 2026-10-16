import * as Notifications from 'expo-notifications';
import { useRootNavigationState, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';

import { useSession } from '@/api/session';

import { installPushHandler, syncPush } from './registration';
import { routeForPush } from './routes';

/** Longest the app waits before it registers the phone again on coming back to the front. */
const RESYNC_AFTER_MS = 30 * 60 * 1000;

/**
 * Turns phone notifications on for the signed-in person (INBOX-21). Mounted once by the root layout, with
 * `live` true when the tabs are reachable (signed in, sign-up steps done). It has no screen.
 *
 *   - On the first live start it asks the system for permission, once per phone, then registers the phone with
 *     the Hub. Later starts, and coming back to the front after a while, register it again (the call is idempotent).
 *   - A tap on a notification opens its screen (`routeForPush`). A cold start from a tap waits until the
 *     route graph is ready and the person is in the signed-in app. A tap that arrives while nobody is signed in is dropped.
 */
export function PushBridge({ live }: { live: boolean }) {
  if (Platform.OS === 'web') return null;
  return <NativePushBridge live={live} />;
}

function NativePushBridge({ live }: { live: boolean }) {
  const router = useRouter();
  const { status } = useSession();
  const ready = Boolean(useRootNavigationState()?.key);
  const [response, setResponse] = useState<Notifications.NotificationResponse | null>(null);
  const handled = useRef<string | null>(null);
  const lastSync = useRef(0);

  // A tap that started the app is held by the system until read; a tap while the app runs arrives by event.
  // (`useLastNotificationResponse` would do both, but it throws on a response the system gave no notification for.)
  useEffect(() => {
    try {
      const first = Notifications.getLastNotificationResponse();
      if (first) setResponse(first);
    } catch {
      // No tap to read: the app was opened some other way.
    }
    try {
      const watch = Notifications.addNotificationResponseReceivedListener((next) => setResponse(next));
      return () => watch?.remove();
    } catch {
      return undefined;
    }
  }, []);

  useEffect(() => {
    if (!live) return;
    installPushHandler();
    lastSync.current = Date.now();
    void syncPush({ ask: true });
    const watch = AppState.addEventListener('change', (next) => {
      if (next !== 'active' || Date.now() - lastSync.current < RESYNC_AFTER_MS) return;
      lastSync.current = Date.now();
      void syncPush({ ask: false });
    });
    return () => watch.remove();
  }, [live]);

  useEffect(() => {
    const request = response?.notification?.request;
    if (!response || !request) return;
    if (status === 'signedOut') {
      setResponse(null);
      Notifications.clearLastNotificationResponse();
      return;
    }
    if (!live || !ready) return;
    const key = `${request.identifier}:${response.notification.date}`;
    if (handled.current === key) return;
    handled.current = key;
    setResponse(null);
    Notifications.clearLastNotificationResponse();
    if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    const href = routeForPush(request.content?.data);
    if (href) router.navigate(href);
  }, [response, status, live, ready, router]);

  return null;
}
