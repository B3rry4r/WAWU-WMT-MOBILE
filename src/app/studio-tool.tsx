import { useQuery } from '@tanstack/react-query';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { queryClient } from '@/api/query';
import { useSession } from '@/api/session';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { ToolScreen } from '@/features/points/ToolScreen';
import { voiceJobQuery } from '@/features/points/voiceoverApi';

/**
 * PT2 · One AI tool (`/studio-tool?tool=voiceover`), with PT2a (working), PT2b (done) and PT2c (failed). Opened from a tool's tile on
 * Studio (PT1). Signed in only, as the other points routes are. Buy points opens PT4 (the store packs) and leads back here; the daily limit's
 * "Back to AI tools" goes back to Studio.
 *
 * The ready notice of a long job (AITOOLS-08, R-109) opens `/studio-tool?job=<id>`: the job names its tool, and the tool opens on that job.
 */
export default function StudioToolRoute() {
  const router = useRouter();
  const { tool, job } = useLocalSearchParams<{ tool?: string; job?: string }>();
  const { status } = useSession();
  const owner = useSessionAccount(undefined);
  const named = useQuery({ ...voiceJobQuery(owner, tool ? null : (job ?? null)) }, queryClient);
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;

  const leave = () => (router.canGoBack() ? router.back() : router.replace('/studio'));
  // A notice names a job and not a tool: wait for the job to say which tool it was. A job the Hub does not know goes to Studio.
  if (!tool && job) {
    if (named.isError) return <Redirect href="/studio" />;
    if (!named.data) return null;
  }
  return (
    <ToolScreen
      toolId={tool ?? named.data?.tool ?? ''}
      openJobId={tool ? undefined : job}
      onBack={leave}
      onBuyPoints={() => router.push({ pathname: '/points-buy', params: { from: 'studio' } })}
      onLeave={leave}
    />
  );
}
