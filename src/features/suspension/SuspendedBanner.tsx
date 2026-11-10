import { Pressable } from 'react-native';

import { Banner } from '@/components/Banner';

import { useMySuspension } from './api';

/**
 * USER-SUSPEND (R-121). The banner on Me while a moderator's suspension is in force: the shared warning banner with the Hub's own
 * sentence, and it opens the suspended screen. Nothing is drawn when the person is not suspended or the read failed.
 */
export function SuspendedBanner({ onOpen }: { onOpen?: () => void }) {
  const mine = useMySuspension();
  if (!mine.data?.suspended) return null;
  return (
    <Pressable testID="me-suspended-banner" accessibilityRole="button" accessibilityLabel="Your account is suspended. Open for details." onPress={onOpen}>
      <Banner tone="warning" icon="ShieldAlert" title="Your account is suspended" body={mine.data.message} />
    </Pressable>
  );
}
