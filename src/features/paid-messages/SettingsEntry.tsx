import { useQuery } from '@tanstack/react-query';

import { IconButton } from '@/components/Button';
import { fetchIsCreator, proKeys } from '@/features/pro-listing/api';

export type SettingsEntryProps = { onOpen: () => void };

/**
 * I1's settings button (kit.js line 24, `Big`, `IB('Settings2')`): the way into I21 for a creator. Paid messages
 * are a creator's, so for anyone else, and until the account is known, nothing is drawn (R-47).
 */
export function SettingsEntry({ onOpen }: SettingsEntryProps) {
  const account = useQuery({ queryKey: proKeys.account, queryFn: fetchIsCreator });
  if (account.data !== true) return null;
  return <IconButton icon="Settings2" label="Paid message settings" onPress={onOpen} testID="inbox-paid-settings" />;
}
