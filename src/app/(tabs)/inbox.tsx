import { useRouter } from 'expo-router';

import { ComposeEntry } from '@/features/community-host/ComposeEntry';
import { InboxScreen } from '@/features/inbox/InboxScreen';
import { SettingsEntry } from '@/features/paid-messages/SettingsEntry';

/**
 * The Inbox tab (I1, I35, I36), inside the tabs so the bottom bar and its unread badge stay. A creator's settings
 * button at the right of the title opens I21 (Paid messages) and the pencil beside it opens I32 (New community); Back returns here. The
 * floating + above the bar is Create (M19), as on Home, Explore and Me, for creator accounts only (R-38).
 */
export default function InboxTab() {
  const router = useRouter();
  return (
    <InboxScreen
      onCreate={() => router.push('/create')}
      headerActions={
        <>
          <SettingsEntry onOpen={() => router.push('/paid-message-settings')} />
          <ComposeEntry onOpen={() => router.push('/community/new')} />
        </>
      }
    />
  );
}
