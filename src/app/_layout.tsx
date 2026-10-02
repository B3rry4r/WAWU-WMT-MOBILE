import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { useSession } from '@/api/session';
import { fontFiles, useWawu } from '@/theme';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

/**
 * Root of the route graph. Fenced: only a flow-pass task edits routing
 * (docs/WORKFLOW.md, "Shared files"). Signed in, cold start opens (tabs), which
 * opens Home. Signed out, the tabs do not exist and the sign-in screens are the
 * only way in; signing in or out swaps one set for the other at once. Nothing
 * is drawn until the stored session has been read, so a signed-in user never
 * sees sign-in flash by (AUTH-01, SHARED-CHANGES.md).
 */
export default function RootLayout() {
  const [loaded, error] = useFonts(fontFiles);
  const { dark, colors } = useWawu();
  const { status } = useSession();
  const ready = status !== 'restoring';

  useEffect(() => {
    if ((loaded || error) && ready) SplashScreen.hideAsync();
  }, [loaded, error, ready]);

  if ((!loaded && !error) || !ready) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.surfacePage } }}>
        <Stack.Protected guard={status === 'signedIn'}>
          <Stack.Screen name="(tabs)" />
        </Stack.Protected>
        <Stack.Protected guard={status === 'signedOut'}>
          <Stack.Screen name="sign-in" />
          <Stack.Screen name="forgot-password" />
        </Stack.Protected>
      </Stack>
    </QueryClientProvider>
  );
}
