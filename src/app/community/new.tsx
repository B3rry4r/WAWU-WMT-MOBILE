import { Redirect, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { useCreatorGate } from '@/features/create/CreateEntry';
import { NewCommunityScreen } from '@/features/community-host/NewCommunityScreen';

/**
 * I32 · New community (`/community/new`, INBOX-14). Opened from Create (M19), the creator dashboard (M18), Set up your account (A11) and the
 * Inbox (I1). Creator accounts only: anyone else who opens it is sent Home, as Create does.
 */
export default function NewCommunityRoute() {
  const router = useRouter();
  const { status } = useSession();
  const gate = useCreatorGate(status === 'signedIn');
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  if (gate !== 'creator') return gate === 'checking' ? null : <Redirect href="/" />;
  return (
    <NewCommunityScreen
      onClose={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      onCreated={(room) => router.replace({ pathname: '/community/created/[id]', params: { id: room.id } })}
    />
  );
}
