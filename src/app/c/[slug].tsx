import { useLocalSearchParams } from 'expo-router';

import { RoomLinkScreen } from '@/features/communities/RoomLinkScreen';

/** A room link, `https://wawuafrica.com/c/<slug>` (LINKS-01, A3) or `wawu://c/<slug>`: opens the room it names. */
export default function RoomLinkRoute() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  return <RoomLinkScreen slug={String(slug)} />;
}
