import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { OPEN_WALLET_PIN_PATH } from '@/features/open-wallet/entry';
import { ToolScreen } from '@/features/points/ToolScreen';

/**
 * PT2 · One AI tool (`/studio-tool?tool=voiceover`), with PT2a (working), PT2b (done) and PT2c (failed). Opened from a tool's tile on
 * Studio (PT1). Signed in only, as the other points routes are. Buy points opens PT4 and leads back here; Forgot PIN? opens W37 and no PIN
 * yet opens A9; the daily limit's "Back to AI tools" goes back to Studio.
 */
export default function StudioToolRoute() {
  const router = useRouter();
  const { tool } = useLocalSearchParams<{ tool?: string }>();
  const { status } = useSession();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;

  const leave = () => (router.canGoBack() ? router.back() : router.replace('/studio'));
  return (
    <ToolScreen
      toolId={tool ?? ''}
      onBack={leave}
      onBuyPoints={() => router.push({ pathname: '/points-buy', params: { from: 'studio' } })}
      onForgotPin={() => router.push('/reset-pin')}
      onSetPin={() => router.push(OPEN_WALLET_PIN_PATH)}
      onLeave={leave}
    />
  );
}
