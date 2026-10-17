import { Redirect, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { StudioScreen } from '@/features/points/StudioScreen';

/**
 * PT1 · Studio (`/studio`), with PT1a (no points): the AI tools the Hub lists, each with its cost in points. Opened from the Studio tile on
 * Home (R-61) and the Studio card on the Create hub (M19). Signed in only: the route graph does not guard it, so a signed-out visit is sent
 * to the welcome screen here, as the other points routes do. The round button on its bar opens Your points (PT5) and Buy points opens
 * PT4, which leads back here when its points are added. A tool's tile opens that tool's screen (`/studio-tool`, POINTS-08).
 */
export default function StudioRoute() {
  const router = useRouter();
  const { status } = useSession();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;

  return (
    <StudioScreen
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      onHistory={() => router.push('/points')}
      onBuy={() => router.push({ pathname: '/points-buy', params: { from: 'studio' } })}
      onOpenTool={(tool) => router.push({ pathname: '/studio-tool', params: { tool: tool.id } })}
    />
  );
}
