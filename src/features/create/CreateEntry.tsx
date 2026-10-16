import { useQuery } from '@tanstack/react-query';

import { queryClient } from '@/api/query';
import { CreateButton } from '@/components/CreateButton';
import { fetchMe, meKey } from '@/features/profile-edit/api';

/**
 * Whether the signed-in person has a creator account: the Hub's `accountType` on their own profile (the same answer Me reads, under
 * the same key). Anyone else, and a profile that did not load, is not shown the button. It reads through the app's own client
 * (`@/api/query`, the one the root layout provides), so it needs no provider above it.
 */
export function useIsCreator(): boolean {
  const me = useQuery({ queryKey: meKey, queryFn: fetchMe, select: (profile) => profile.accountType === 'creator' }, queryClient);
  return me.data === true;
}

/**
 * The floating Create button (X1, X14, H1, H11, H36, M1) for creator accounts only (R-38). Home, Explore and Me each draw it as
 * their last child, over their own content, and pass the route that opens M19; a screen given none draws nothing.
 */
export function CreateEntry({ onPress }: { onPress: () => void }) {
  return useIsCreator() ? <CreateButton onPress={onPress} /> : null;
}
