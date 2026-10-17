import { useQuery } from '@tanstack/react-query';

import { queryClient } from '@/api/query';
import { IconButton } from '@/components/Button';
import { fetchIsCreator, proKeys } from '@/features/pro-listing/api';

export type ComposeEntryProps = { onOpen: () => void };

/**
 * I1's compose pencil (kit.js line 24, `Big`, `IB('SquarePen')`, board track "I1 · compose · New community"): the way into I32 for a
 * creator, the only account that hosts a community. For anyone else, and until the account is known, nothing is drawn (R-47). It
 * sits beside the settings button; the two share one read of the account.
 */
export function ComposeEntry({ onOpen }: ComposeEntryProps) {
  // The app's one client, named as the inbox's own read does, so the button needs no provider above it (the tab shell renders without one).
  const account = useQuery({ queryKey: proKeys.account, queryFn: fetchIsCreator }, queryClient);
  if (account.data !== true) return null;
  return <IconButton icon="SquarePen" label="New community" onPress={onOpen} testID="inbox-compose" />;
}
