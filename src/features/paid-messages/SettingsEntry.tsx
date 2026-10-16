import { useQuery } from '@tanstack/react-query';

import { queryClient } from '@/api/query';
import { IconButton } from '@/components/Button';
import { fetchIsCreator, proKeys } from '@/features/pro-listing/api';

export type SettingsEntryProps = { onOpen: () => void };

/**
 * I1's settings button (kit.js line 24, `Big`, `IB('Settings2')`): the way into I21 for a creator. Paid messages
 * are a creator's, so for anyone else, and until the account is known, nothing is drawn (R-47).
 */
export function SettingsEntry({ onOpen }: SettingsEntryProps) {
  // The app's one client, named as the inbox's own read does, so the button needs no provider above it (the tab shell renders without one).
  const account = useQuery({ queryKey: proKeys.account, queryFn: fetchIsCreator }, queryClient);
  if (account.data !== true) return null;
  return <IconButton icon="Settings2" label="Paid message settings" onPress={onOpen} testID="inbox-paid-settings" />;
}
