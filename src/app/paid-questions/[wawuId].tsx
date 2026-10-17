import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { PaidThreadScreen } from '@/features/paid-answers/PaidThreadScreen';

/**
 * I10 and I11 · A fan's paid questions, as the creator answers them (`/paid-questions/<fan's WAWU ID>`, `?question=` names the one
 * the person came for). Opened from the Inbox (I9's rows and the All list's paid row) and from Reply on a notification (M31). Message
 * opens the free chat (I12). Signed in only.
 */
export default function PaidQuestionsRoute() {
  const { wawuId, question } = useLocalSearchParams<{ wawuId: string; question?: string }>();
  const router = useRouter();
  const { status } = useSession();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/inbox'));
  return <PaidThreadScreen key={String(wawuId)} wawuId={String(wawuId)} focusQuestion={question ? String(question) : undefined} onBack={leave} onOpenChat={(chatId) => router.push({ pathname: '/chat/[id]', params: { id: chatId } })} />;
}
