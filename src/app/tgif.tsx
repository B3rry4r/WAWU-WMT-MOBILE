import { Stack, useRouter } from 'expo-router';

import { TgifReader } from '@/features/tgif/TgifReader';

/**
 * H29 to H34 · TGIF (`/tgif`): today's five cards, full screen. Today's TGIF card opens it
 * (HOME-01 adds the entry); close and Done go back to where it was opened from.
 */
export default function TgifRoute() {
  const router = useRouter();
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));
  return (
    <>
      <Stack.Screen options={{ animation: 'fade' }} />
      <TgifReader onClose={leave} onOpenInbox={() => router.push('/inbox')} />
    </>
  );
}
