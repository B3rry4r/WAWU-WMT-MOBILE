import { useQueryClient } from '@tanstack/react-query';
import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';

import { CreatorSetupScreen, type SetupTarget } from '@/features/after-signup/CreatorSetupScreen';
import { finishStep } from '@/features/after-signup/steps';
import { useSignupGate } from '@/features/auth/signupGate';
import { meKey } from '@/features/profile-edit/api';

/** What each row of A11 opens: I21, M8, M19 and Open your wallet (A26). */
const TARGETS: Record<SetupTarget, Href> = {
  paid: '/paid-message-settings',
  profile: '/edit-profile',
  publish: '/create',
  wallet: '/open-wallet',
};

/**
 * A11 · Set up your account (`/creator-setup`). Two ways in: as the step after sign-up for an earning account (the route graph opens it
 * while WAWU ID's progress says `creator_setup`; Later finishes the step and Home opens), and from "Become a creator" (P10), where the
 * account type is already `creator` and Later goes back to where the person was.
 */
export default function CreatorSetupRoute() {
  const router = useRouter();
  const client = useQueryClient();
  const gate = useSignupGate();
  const inSequence = Boolean(gate.progress?.inSequence && gate.progress.step === 'creator_setup');
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const later = async () => {
    if (!inSequence) {
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
