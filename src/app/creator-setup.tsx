import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useState } from 'react';

import { CreatorSetupScreen, type SetupTarget } from '@/features/after-signup/CreatorSetupScreen';
import { setupReturnOf } from '@/features/after-signup/setupReturn';
import { finishStep } from '@/features/after-signup/steps';
import { useSignupGate } from '@/features/auth/signupGate';
import { meKey } from '@/features/profile-edit/api';

/** What each row of A11 opens: I21, M8, M19, I32 and Open your wallet (A26). */
const TARGETS: Record<SetupTarget, Href> = {
  paid: '/paid-message-settings',
  profile: '/edit-profile',
  publish: '/create',
  community: '/community/new',
  wallet: '/open-wallet',
};

/**
 * A11 · Set up your account (`/creator-setup`). Two ways in: as the step after sign-up for an earning account (the route graph opens it
 * while WAWU ID's progress says `creator_setup`; Later finishes the step and Home opens), and from "Become a creator" (P10), where the
 * account type is already `creator` and Later goes back to where the person was. When P10 names the screen that sent the person
 * (`?next=professional-apply`, SERVICES-FEEDBACK 3), Later returns to it, the listing form, even when the history that led here is gone.
 */
export default function CreatorSetupRoute() {
  const router = useRouter();
  const client = useQueryClient();
  const gate = useSignupGate();
  const { next } = useLocalSearchParams<{ next?: string }>();
  const returnTo = setupReturnOf(next);
  const inSequence = Boolean(gate.progress?.inSequence && gate.progress.step === 'creator_setup');
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const later = async () => {
    if (!inSequence) {
      if (returnTo) {
        // Pop to the screen when it is under this one; with no history (a page opened again) put it in this one's place.
        if (router.canGoBack()) router.dismissTo(returnTo);
        else router.replace(returnTo);
        return;
      }
      if (router.canGoBack()) router.back();
      else router.replace('/');
      return;
    }
    setBusy(true);
    setFailed(false);
    try {
      await finishStep('creator_setup');
      void client.invalidateQueries({ queryKey: meKey });
      router.replace('/');
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return <CreatorSetupScreen onLater={() => void later()} laterBusy={busy} laterFailed={failed} onOpen={(target) => router.push(TARGETS[target])} />;
}
