import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { openRoom } from '@/features/communities/routes';
import { CreatedScreen } from '@/features/community-host/CreatedScreen';

/** I33 · Created (`/community/created/<id>`, INBOX-14): the host's room is live; its link, Copy, Share link and Open room. */
export default function CommunityCreatedRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { status } = useSession();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  return <CreatedScreen id={String(id)} onOpenRoom={() => openRoom(router, String(id))} />;
}
