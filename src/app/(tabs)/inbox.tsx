import { useRouter } from 'expo-router';

import { InboxScreen } from '@/features/inbox/InboxScreen';
import { SettingsEntry } from '@/features/paid-messages/SettingsEntry';

/**
 * The Inbox tab (I1, I35, I36), inside the tabs so the bottom bar and its unread badge stay. A creator's settings
 * button at the right of the title opens I21 (Paid messages); Back returns here.
 */
export default function InboxTab() {
  const router = useRouter();
  return <InboxScreen headerActions={<SettingsEntry onOpen={() => router.push('/paid-message-settings')} />} />;
}
