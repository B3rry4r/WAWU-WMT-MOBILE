import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

import { queryClient } from '@/api/query';
import { useSession } from '@/api/session';
import { refreshSignupGate, resetSignupGate, useSignupGate } from '@/features/auth/signupGate';
import { useClaimOfferStep } from '@/features/claim/offerStep';
import { PushBridge } from '@/features/push/PushBridge';
import { applyStoredTheme } from '@/features/settings/devicePrefs';
import { useBonusStep } from '@/features/verify/bonusStep';
import { fontFiles, useWawu } from '@/theme';

SplashScreen.preventAutoHideAsync();

/**
 * True once the saved Theme has been applied. Nothing is drawn before then, so the first screen
 * is already in the chosen theme. An unreadable phone store counts as nothing saved (it follows
 * the phone), so the app still opens.
 */
function useStoredTheme(): boolean {
  const [applied, setApplied] = useState(false);
  useEffect(() => {
    let live = true;
    applyStoredTheme()
      .catch(() => undefined)
      .then(() => {
        if (live) setApplied(true);
      });
    return () => {
      live = false;
    };
  }, []);
  return applied;
}

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
 * So do every other signed-in screen that is not a tab: Payout bank, Edit profile and Social
 * links, the five steps of Open your wallet, and the five Settings screens (SHARED-05). The
 * guard is the one place that sends a signed-out visitor to the welcome screen; those screens
 * carry no sign-in check of their own. About, Terms and Privacy policy are public on purpose
 * (the Terms must be readable before sign-up), so they sit outside every guard, after the
 * signed-out set so that a cold start with nobody signed in still opens the welcome screen.
 * The Theme a person picked in Settings (System, Light or Dark) is read from the phone and
 * applied before the first screen is drawn, with the splash screen still up, so the next
 * launch never shows the other theme first (SETTINGS-01 #3 (a)).
 * "Your bonus is waiting" (VF1, `/verify-bonus`) comes once after the access-code step, the same way (VERIFY-01 #1); the shop
 * (`/shop`) and its draft form (`/shop-product`) sit with the tabs (VERIFY-01 #2).
 * The push bridge (INBOX-21, SHARED-CHANGES INBOX-21 #1) has no screen: once the tabs are reachable it asks for
 * notification permission, registers the phone, and opens the screen a tapped notification is about.
 */
export default function RootLayout() {
  const [loaded, error] = useFonts(fontFiles);
  const { dark, colors } = useWawu();
  const { status } = useSession();
  const gate = useSignupGate();
  const signedIn = status === 'signedIn';
  const offer = useClaimOfferStep(signedIn);
  const bonus = useBonusStep(signedIn);
  const themed = useStoredTheme();
  const ready = themed && status !== 'restoring' && (!signedIn || gate.phase === 'ready');
  const inApp = signedIn && !gate.needsEmail && !offer.visible && !bonus.visible;

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
        <Stack.Protected guard={signedIn && !gate.needsEmail && !offer.visible && bonus.visible}>
          <Stack.Screen name="verify-bonus" />
        </Stack.Protected>
        <Stack.Protected guard={signedIn && !gate.needsEmail && !offer.visible && !bonus.visible}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="shop" />
          <Stack.Screen name="shop-product" />
          <Stack.Screen name="categories" />
          <Stack.Screen name="add-work" />
          <Stack.Screen name="works/[wawuId]/index" />
          <Stack.Screen name="works/[wawuId]/[workId]" />
          <Stack.Screen name="payout-account" />
          <Stack.Screen name="edit-profile" />
          <Stack.Screen name="social-links" />
          <Stack.Screen name="open-wallet" />
          <Stack.Screen name="open-wallet-details" />
          <Stack.Screen name="open-wallet-selfie" />
          <Stack.Screen name="open-wallet-id" />
          <Stack.Screen name="open-wallet-address" />
          <Stack.Screen name="open-wallet-checking" />
          <Stack.Screen name="open-wallet-rejected" />
          <Stack.Screen name="open-wallet-account" />
          <Stack.Screen name="open-wallet-pin" />
          <Stack.Screen name="settings/index" />
          <Stack.Screen name="settings/notifications" />
          <Stack.Screen name="settings/privacy" />
          <Stack.Screen name="settings/blocked" />
          <Stack.Screen name="settings/password" />
        </Stack.Protected>
        <Stack.Protected guard={status === 'signedOut'}>
          <Stack.Screen name="welcome" />
          <Stack.Screen name="account-type" />
          <Stack.Screen name="sign-up" />
          <Stack.Screen name="phone-code" />
          <Stack.Screen name="sign-in" />
          <Stack.Screen name="forgot-password" />
        </Stack.Protected>
        <Stack.Screen name="about" />
        <Stack.Screen name="terms" />
        <Stack.Screen name="privacy-policy" />
      </Stack>
      <PushBridge live={inApp} />
    </QueryClientProvider>
  );
}
