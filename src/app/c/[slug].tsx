import { useLocalSearchParams } from 'expo-router';

import { RoomLinkScreen } from '@/features/communities/RoomLinkScreen';

/** A room link, `wawu/c/<slug>`: opens the room it names (`/c/<slug>`). */
export default function RoomLinkRoute() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  return <RoomLinkScreen slug={String(slug)} />;
}
