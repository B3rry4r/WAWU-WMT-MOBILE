import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { TgifReader } from '@/features/tgif/TgifReader';

/**
 * H29 to H34 · TGIF (`/tgif`): today's five cards, full screen. Today's TGIF card opens it
 * (HOME-01 adds the entry); close and Done go back to where it was opened from. The sponsored card's
 * button opens its event (E2, ADS-01); the reader stays under it, so back returns to the card.
 * The morning notice (HOME-16) opens it with `date`, the day the notice was made for: the reader
 * reads that day when it is yesterday, today or tomorrow on the phone, otherwise today.
 */
export default function TgifRoute() {
  const router = useRouter();
  const { date } = useLocalSearchParams<{ date?: string }>();
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));
  return (
    <>
      <Stack.Screen options={{ animation: 'fade' }} />
      <TgifReader
        date={typeof date === 'string' ? date : undefined}
        onClose={leave}
        onOpenEvent={(id) => router.push({ pathname: '/events/[id]', params: { id } })}
      />
    </>
  );
}
