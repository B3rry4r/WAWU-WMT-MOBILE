import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { addMoneyHref } from '@/features/addmoney/entry';
import { useCreatorGate } from '@/features/create/CreateEntry';
import { OPEN_WALLET_PIN_PATH } from '@/features/open-wallet/entry';
import { PublishScreen } from '@/features/verify/PublishScreen';

/**
 * VF12 · Publish (`/publish?id=<draft id>`), with VF12a to VF12c and the identity check (VF15 to VF15b) as its states. The draft form's
 * Publish opens it for a saved draft, once a tier is running. Creator accounts only; signed in only. Back returns to the draft.
 */
export default function PublishRoute() {
  const router = useRouter();
  const { status } = useSession();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const gate = useCreatorGate(status === 'signedIn');
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  if (gate !== 'creator') return gate === 'checking' ? null : <Redirect href="/" />;
  if (!id) return <Redirect href="/shop" />;

  return (
    <PublishScreen
      draftId={id}
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/shop'))}
      onSeeTiers={() => router.push('/tiers')}
      onYourTier={() => router.push('/your-tier')}
      onUpgrade={() => router.push('/tiers')}
      onEditDraft={() => router.push({ pathname: '/shop-product', params: { id } })}
      onForgotPin={() => router.push('/reset-pin')}
      onSetPin={() => router.push(OPEN_WALLET_PIN_PATH)}
      onAddMoney={(shortfall) => router.push(addMoneyHref(shortfall))}
      onOpenLibrary={() => router.push('/library')}
    />
  );
}
