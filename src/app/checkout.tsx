import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { addMoneyHref } from '@/features/addmoney/entry';
import { OPEN_WALLET_PIN_PATH } from '@/features/open-wallet/entry';
import { CheckoutScreen } from '@/features/verify/CheckoutScreen';

const KINDS = ['tier', 'renew', 'upgrade'] as const;

/**
 * VF6 · Checkout (`/checkout?kind=<tier|renew|upgrade>&tier=<id>`), with VF6a to VF6d as its states. Opened by VF5's Continue, VF14's
 * Renew and VF5b's Upgrade. Signed in only. Back returns to the tiers; a paid purchase opens VF7 in its place. Forgot PIN? opens W37, no
 * PIN yet opens A9, and a short wallet opens Add money (W15) with what is missing and returns here.
 */
export default function CheckoutRoute() {
  const router = useRouter();
  const { status } = useSession();
  const { kind, tier } = useLocalSearchParams<{ kind?: string; tier?: string }>();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  const which = KINDS.find((k) => k === kind);
  if (!which || !tier) return <Redirect href="/tiers" />;

  return (
    <CheckoutScreen
      kind={which}
      tierId={tier}
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/tiers'))}
      onPaid={(id) => router.replace({ pathname: '/tier-done', params: { id } })}
      onForgotPin={() => router.push('/reset-pin')}
      onSetPin={() => router.push(OPEN_WALLET_PIN_PATH)}
      onAddMoney={(shortfall) => router.push(addMoneyHref(shortfall))}
    />
  );
}
