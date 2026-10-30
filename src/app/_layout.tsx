import { useDefaultPaySource } from '@/features/pay-source/usePaySource';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

import { queryClient } from '@/api/query';
import { useSession } from '@/api/session';
import { ErrorScreen } from '@/components/ErrorScreen';
import { refreshSignupGate, resetSignupGate, useSignupGate } from '@/features/auth/signupGate';
import { useAcceptanceRetry } from '@/features/about/acceptance';
import { useClaimOfferStep } from '@/features/claim/offerStep';
import { PlaceBridge } from '@/features/geo/PlaceBridge';
import { PushBridge } from '@/features/push/PushBridge';
import { useTierOfferStep } from '@/features/tier-offer/offerStep';
import { TierOfferBridge } from '@/features/tier-offer/TierOfferBridge';
import { applyStoredTheme } from '@/features/settings/devicePrefs';
import { useBonusStep } from '@/features/verify/bonusStep';
import { fontFiles, useWawu } from '@/theme';

SplashScreen.preventAutoHideAsync();

/**
 * Expo Router wraps the root layout in this: a screen that throws while it draws shows "Something went wrong" with Try again and Go to Home, and
 * never a blank screen (WALLET-BLANK, SHARED-CHANGES WALLET-BLANK #1). Inside the tabs the tabs' own boundary catches first and keeps the tab bar.
 */
export const ErrorBoundary = ErrorScreen;

/** The longest the saved Theme is waited for before the first screen is drawn (SHARED-05 L1). */
export const THEME_READ_LIMIT_MS = 3000;

/**
 * True once the saved Theme has been applied. Nothing is drawn before then, so the first screen
 * is already in the chosen theme. An unreadable phone store counts as nothing saved (it follows
 * the phone), so the app still opens.
 */
function useStoredTheme(): boolean {
  const [applied, setApplied] = useState(false);
  useEffect(() => {
    let live = true;
    // A phone store that never answers must not hold the splash forever: after this long the app opens following the phone.
    const gaveUp = setTimeout(() => {
      if (live) setApplied(true);
    }, THEME_READ_LIMIT_MS);
    applyStoredTheme()
      .catch(() => undefined)
      .then(() => {
        clearTimeout(gaveUp);
        if (live) setApplied(true);
      });
    return () => {
      live = false;
      clearTimeout(gaveUp);
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
 * SHARED-CHANGES AUTH-04 #2). So do A11, A12 and A13 (AUTH-06, SHARED-CHANGES AUTH-06 #1): the tabs wait while the progress
 * says `creator_setup`, `interests` or `follows`; A11 is also reachable from "Become a creator" once the sequence is over, and
 * the screens A11's rows open stay reachable while it is the step. Categories (EXPLORE-01 #2) and the featured works
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
 * Every other route file that needs a session sits in that same last signed-in group (FIX-63, SHARED-CHANGES FIX-63 #1): wallet,
 * send, withdraw, bills, events, schools, professionals, library, create and publish, chat and rooms, points, invite, legal,
 * notifications, search, saved, TGIF and the rest. A route file is listed in a signed-in group, or it is on the short public
 * list kept in `src/__tests__/route-guard.test.tsx`: the signed-out set above, About, Terms and Privacy policy, the app links
 * (`/r`, `/selfie`, `/activate`, `/receipt`, `/u`, `/c`, `/content`, which each send a signed-out visitor on themselves),
 * `/claim-code` (sends a signed-out visitor to sign-in and brings the sign-in back) and the development-only screens. That test
 * fails when a route file is neither.
 * The Voice Intro's writing and recording screens (`/voice-intro`, `/voice-consent`) sit with the creator's setup checklist, so VF7's
 * "Record my voice" works for a creator who bought a tier while still inside sign-up setup (SWEEP-FLOWS B4); there, Use this
 * goes back to the checklist, since the tabs are not open yet.
 * "Your bonus is waiting" (VF1, `/verify-bonus`) comes once after the access-code step, the same way (VERIFY-01 #1); the shop
 * (`/shop`) and its draft form (`/shop-product`) sit with the tabs (VERIFY-01 #2).
 * "Choose your tier" (TIER-OFFER, R-94, `/tier-offer`) comes first, as soon as the sign-up's email, name and access-code steps are done: before
 * "Set up your account" (A11) and the other setup steps, "Your bonus" and Home (FIX-P5, lead ruling 27 Oct 2026). The Hub says whether it is
 * this person's to see, on every app start, for any account type with no running tier (R-105, `tier_offer.every_start_on`), every setup step and the tabs wait while it is on screen, and its
 * X or Not now (by the admin setting) or a Subscribe ends it; Subscribe's checkout is opened by `TierOfferBridge` once the offer is gone, over the
 * screen that took its place.
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
  // LEGAL-DOCS: a sign-up whose agreement could not reach the Hub sends it again once the person is signed in.
  useAcceptanceRetry(signedIn);
  // PAY-FX (R-91): where a wallet payment starts from (naira, or the main currency of a person with no naira wallet).
  useDefaultPaySource(signedIn);
  const bonus = useBonusStep(signedIn, gate.progress?.accountType);
  // TIER-OFFER (R-94, R-105): the Hub is asked once the sign-up gate is open, for every account type; the splash waits for the answer (bounded), so Home is never drawn first.
  const tierOffer = useTierOfferStep(signedIn && gate.phase === 'ready');
  const themed = useStoredTheme();
  const ready = themed && status !== 'restoring' && (!signedIn || (gate.phase === 'ready' && !tierOffer.holding));
  const inApp = signedIn && !gate.needsEmail && !gate.needsIdentity && !offer.visible && !tierOffer.visible && !bonus.visible;

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
        <Stack.Protected guard={signedIn && !gate.needsEmail && gate.needsIdentity}>
          <Stack.Screen name="your-details" />
        </Stack.Protected>
        <Stack.Protected guard={signedIn && !gate.needsEmail && !gate.needsIdentity && offer.visible}>
          <Stack.Screen name="claim-offer" />
        </Stack.Protected>
        <Stack.Protected guard={signedIn && !gate.needsEmail && !gate.needsIdentity && !offer.visible && tierOffer.visible}>
          <Stack.Screen name="tier-offer" />
        </Stack.Protected>
        <Stack.Protected guard={signedIn && !gate.needsEmail && !gate.needsIdentity && !offer.visible && gate.setupStep === null && !tierOffer.visible && bonus.visible}>
          <Stack.Screen name="verify-bonus" />
        </Stack.Protected>
        <Stack.Protected guard={signedIn && !gate.needsEmail && !gate.needsIdentity && !offer.visible && !tierOffer.visible && gate.setupStep === 'interests'}>
          <Stack.Screen name="interests" />
        </Stack.Protected>
        <Stack.Protected guard={signedIn && !gate.needsEmail && !gate.needsIdentity && !offer.visible && !tierOffer.visible && gate.setupStep === 'follows'}>
          <Stack.Screen name="people-to-follow" />
        </Stack.Protected>
        <Stack.Protected guard={signedIn && !gate.needsEmail && !gate.needsIdentity && !offer.visible && gate.setupStep === null && !tierOffer.visible && !bonus.visible}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="shop" />
          <Stack.Screen name="shop-product" />
          <Stack.Screen name="hear-name" />
        </Stack.Protected>
        <Stack.Protected guard={signedIn && !gate.needsEmail && !gate.needsIdentity && !offer.visible && !tierOffer.visible && (gate.setupStep === 'creator_setup' || (gate.setupStep === null && !bonus.visible))}>
          <Stack.Screen name="creator-setup" />
          <Stack.Screen name="voice-intro" />
          <Stack.Screen name="voice-consent" />
        </Stack.Protected>
        <Stack.Protected guard={signedIn && !gate.needsEmail && !gate.needsIdentity && !offer.visible}>
          <Stack.Screen name="categories" />
          <Stack.Screen name="add-work" />
          <Stack.Screen name="works/[wawuId]/index" />
          <Stack.Screen name="works/[wawuId]/[workId]" />
          <Stack.Screen name="payout-account" />
          <Stack.Screen name="edit-profile" />
          <Stack.Screen name="social-links" />
          <Stack.Screen name="photo-position" />
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
          <Stack.Screen name="add-money" />
          <Stack.Screen name="add-money/status" />
          <Stack.Screen name="add-money/way" />
          <Stack.Screen name="bills/airtime" />
          <Stack.Screen name="bills/cable/index" />
          <Stack.Screen name="bills/data" />
          <Stack.Screen name="bills/electricity/index" />
          <Stack.Screen name="bills/index" />
          <Stack.Screen name="bills/items" />
          <Stack.Screen name="bills/number" />
          <Stack.Screen name="bills/receipt/[id]" />
          <Stack.Screen name="bills/review" />
          <Stack.Screen name="capital/index" />
          <Stack.Screen name="capital/order" />
          <Stack.Screen name="capital/product" />
          <Stack.Screen name="capital/review" />
          <Stack.Screen name="capital/withdraw" />
          <Stack.Screen name="cards/[id]" />
          <Stack.Screen name="cards/index" />
          <Stack.Screen name="cards/new" />
          <Stack.Screen name="change-pin" />
          <Stack.Screen name="chat/[id]" />
          <Stack.Screen name="chat/send" />
          <Stack.Screen name="checkout" />
          <Stack.Screen name="crypto-receive" />
          <Stack.Screen name="crypto-send" />
          <Stack.Screen name="fx-receipt" />
          <Stack.Screen name="community/[id]" />
          <Stack.Screen name="community/created/[id]" />
          <Stack.Screen name="community/new" />
          <Stack.Screen name="community/pass/[id]" />
          <Stack.Screen name="community/requests/[id]" />
          <Stack.Screen name="confirm-email" />
          <Stack.Screen name="create" />
          <Stack.Screen name="create-details" />
          <Stack.Screen name="create-format" />
          <Stack.Screen name="create-preview" />
          <Stack.Screen name="create-price" />
          <Stack.Screen name="create-review" />
          <Stack.Screen name="create-upload" />
          <Stack.Screen name="creator" />
          <Stack.Screen name="creators" />
          <Stack.Screen name="earnings" />
          <Stack.Screen name="events/[id]" />
          <Stack.Screen name="events/dashboard/[id]" />
          <Stack.Screen name="events/door/[id]" />
          <Stack.Screen name="events/edit/[id]" />
          <Stack.Screen name="events/host" />
          <Stack.Screen name="events/index" />
          <Stack.Screen name="events/links/[id]" />
          <Stack.Screen name="events/mine" />
          <Stack.Screen name="events/orders/[orderId]" />
          <Stack.Screen name="events/sent-back/[id]" />
          <Stack.Screen name="events/ticket-types/[id]" />
          <Stack.Screen name="events/tickets/[ticketId]" />
          <Stack.Screen name="events/tickets/index" />
          <Stack.Screen name="invite" />
          <Stack.Screen name="invite-card" />
          <Stack.Screen name="invite-rules" />
          <Stack.Screen name="legal" />
          <Stack.Screen name="legal-book" />
          <Stack.Screen name="legal-fixed" />
          <Stack.Screen name="legal-matter" />
          <Stack.Screen name="library/[id]/edit" />
          <Stack.Screen name="library/[id]/index" />
          <Stack.Screen name="library/[id]/lessons" />
          <Stack.Screen name="library/[id]/replace" />
          <Stack.Screen name="library/index" />
          <Stack.Screen name="movies/[id]/index" />
          <Stack.Screen name="movies/[id]/trailer" />
          <Stack.Screen name="movies/all" />
          <Stack.Screen name="movies/index" />
          <Stack.Screen name="movies/search" />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="paid-message-settings" />
          <Stack.Screen name="paid-questions/[wawuId]" />
          <Stack.Screen name="paid-thread/[wawuId]" />
          <Stack.Screen name="pass" />
          <Stack.Screen name="points" />
          <Stack.Screen name="points-buy" />
          <Stack.Screen name="points-convert" />
          <Stack.Screen name="professional-apply" />
          <Stack.Screen name="professional-listings" />
          <Stack.Screen name="professionals/[id]" />
          <Stack.Screen name="professionals/index" />
          <Stack.Screen name="profile/[wawuId]" />
          <Stack.Screen name="publish" />
          <Stack.Screen name="purchases" />
          <Stack.Screen name="reset-pin" />
          <Stack.Screen name="role" />
          <Stack.Screen name="saved" />
          <Stack.Screen name="schools/[id]" />
          <Stack.Screen name="schools/courses/[id]" />
          <Stack.Screen name="schools/enrol/[courseId]" />
          <Stack.Screen name="schools/enrolments/[id]" />
          <Stack.Screen name="schools/index" />
          <Stack.Screen name="schools/mine" />
          <Stack.Screen name="search" />
          <Stack.Screen name="send/abroad/amount" />
          <Stack.Screen name="send/abroad/index" />
          <Stack.Screen name="send/abroad/new" />
          <Stack.Screen name="send/abroad/receipt" />
          <Stack.Screen name="send/abroad/review" />
          <Stack.Screen name="send/amount" />
          <Stack.Screen name="send/bank" />
          <Stack.Screen name="send/failed" />
          <Stack.Screen name="send/index" />
          <Stack.Screen name="send/receipt" />
          <Stack.Screen name="send/review" />
          <Stack.Screen name="settings/delete-account/confirm" />
          <Stack.Screen name="settings/delete-account/index" />
          <Stack.Screen name="settings/delete-account/scheduled" />
          <Stack.Screen name="studio" />
          <Stack.Screen name="studio-tool" />
          <Stack.Screen name="swap" />
          <Stack.Screen name="tgif" />
          <Stack.Screen name="tier-done" />
          <Stack.Screen name="tiers" />
          <Stack.Screen name="transactions/[id]" />
          <Stack.Screen name="transactions/index" />
          <Stack.Screen name="verification" />
          <Stack.Screen name="wallet-settings" />
          <Stack.Screen name="accounts" />
          <Stack.Screen name="wallet-statement" />
          <Stack.Screen name="withdraw/failed" />
          <Stack.Screen name="withdraw/index" />
          <Stack.Screen name="withdraw/receipt" />
          <Stack.Screen name="your-tier" />
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
        <Stack.Screen name="legal-documents/index" />
        <Stack.Screen name="legal-documents/[slug]" />
      </Stack>
      <TierOfferBridge checkout={tierOffer.checkout} />
      <PushBridge live={inApp} />
      <PlaceBridge live={inApp} />
    </QueryClientProvider>
  );
}
