import { Redirect, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

import { useSession } from '@/api/session';
import { ScheduledScreen } from '@/features/delete-account/ScheduledScreen';
import { useSystemBack } from '@/features/professionals/parts';

/**
 * Z8 · Scheduled (`/settings/delete-account/scheduled?on=<the Hub's date>`). Done signs the phone out and opens the welcome screen. The route
 * has no back: the account is scheduled, and the one way on is Done. A visit with no date has nothing to say and goes to Settings.
 */
export default function ScheduledRoute() {
  const router = useRouter();
  const { status } = useSession();
  const { on } = useLocalSearchParams<{ on: string }>();
  // Held for the screen's life: the phone's session ends under it (Done), and the route must not bounce away while it signs out.
  const [date] = useState(() => (typeof on === 'string' ? on : ''));
  useSystemBack(() => undefined);
  if (status === 'restoring') return null;
  if (status === 'signedOut') return <Redirect href="/welcome" />;
  if (date === '') return <Redirect href="/settings" />;
  return (
    <>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <ScheduledScreen at={date} onSignedOut={() => router.replace('/welcome')} />
    </>
  );
}
