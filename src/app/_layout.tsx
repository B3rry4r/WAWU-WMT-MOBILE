import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { queryClient } from '@/api/query';
import { useSession } from '@/api/session';
import { refreshSignupGate, resetSignupGate, useSignupGate } from '@/features/auth/signupGate';
import { useClaimOfferStep } from '@/features/claim/offerStep';
import { fontFiles, useWawu } from '@/theme';

SplashScreen.preventAutoHideAsync();

/**
 * Root of the route graph. Fenced: only a flow-pass task edits routing
 * (docs/WORKFLOW.md, "Shared files"). Signed in, cold start opens (tabs), which
 * opens Home. Signed out, the tabs do not exist and the signed-out screens (the
 * welcome screen first, then sign-up and sign-in) are the only way in; signing in or out swaps one set for the other at once. Nothing
 * is drawn until the stored session has been read, so a signed-in user never
 * sees sign-in flash by (AUTH-01, SHARED-CHANGES.md). The query cache is the
 * app's one `queryClient` (`@/api/query`): its defaults live there, and it is
 * emptied whenever the session ends, so one account's answers are never drawn
 * for the next (FIX-04). A signed-in account whose sign-up has an email step
 * left opens that step before the tabs; the server's progress decides (AUTH-04,
 * SHARED-CHANGES AUTH-04 #2). Categories (EXPLORE-01 #2) and the featured works
 * screens (ME-11 #3) sit with the tabs: a signed-out visit to one never draws it.
 */
export default function RootLayout() {
  const [loaded, error] = useFonts(fontFiles);
  const { dark, colors } = useWawu();
  const { status } = useSession();
  const gate = useSignupGate();
  const signedIn = status === 'signedIn';
  const offer = useClaimOfferStep(signedIn);
  const ready = status !== 'restoring' && (!signedIn || gate.phase === 'ready');

  useEffect(() => {
    if (signedIn && gate.phase === 'idle') void refreshSignupGate();
    if (status === 'signedOut') resetSignupGate();
  }, [signedIn, status, gate.phase]);

  useEffect(() => {
    if ((loaded || error) && ready) SplashScreen.hideAsync();
  }, [loaded, error, ready]);

  if ((!loaded && !error) || !ready) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.surfacePage } }}>
        <Stack.Protected guard={signedIn && gate.needsEmail}>
          <Stack.Screen name="email-code" />
        </Stack.Protected>
        <Stack.Protected guard={signedIn && !gate.needsEmail && offer.visible}>
          <Stack.Screen name="claim-offer" />
        </Stack.Protected>
        <Stack.Protected guard={signedIn && !gate.needsEmail && !offer.visible}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="categories" />
          <Stack.Screen name="add-work" />
          <Stack.Screen name="works/[wawuId]/index" />
          <Stack.Screen name="works/[wawuId]/[workId]" />
        </Stack.Protected>
        <Stack.Protected guard={status === 'signedOut'}>
          <Stack.Screen name="welcome" />
          <Stack.Screen name="account-type" />
          <Stack.Screen name="sign-up" />
          <Stack.Screen name="phone-code" />
          <Stack.Screen name="sign-in" />
          <Stack.Screen name="forgot-password" />
        </Stack.Protected>
      </Stack>
    </QueryClientProvider>
  );
}
