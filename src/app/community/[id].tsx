import { useLocalSearchParams, useRouter } from 'expo-router';

import { RoomScreen } from '@/features/communities/RoomScreen';

/** I25 and I26 · A community's room (`/community/<id>`). Opened from the Inbox, from I24 and from a room link. */
export default function CommunityRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/inbox'));
  return <RoomScreen key={String(id)} id={String(id)} onBack={leave} />;
}
