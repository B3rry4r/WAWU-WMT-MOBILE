import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { useOpenWalletEntry } from '@/features/open-wallet/entry';
import { PaidThreadScreen } from '@/features/paid-answers/PaidThreadScreen';
import { payeeParams, type Payee } from '@/features/send/model';

/**
 * I10 and I11 · A fan's paid questions, as the creator answers them (`/paid-questions/<fan's WAWU ID>`, `?question=` names the one
 * the person came for). Opened from the Inbox (I9's rows and the All list's paid row) and from Reply on a notification (M31). Message
 * opens the free chat (I12); "+" sends or requests money through that chat, and "..." reports or blocks (FIX-109). Signed in only.
 */
export default function PaidQuestionsRoute() {
  const { wawuId, question } = useLocalSearchParams<{ wawuId: string; question?: string }>();
  const router = useRouter();
  const entry = useOpenWalletEntry();
  const { status } = useSession();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/inbox'));
  return (
    <PaidThreadScreen
      key={String(wawuId)}
      wawuId={String(wawuId)}
      focusQuestion={question ? String(question) : undefined}
      onBack={leave}
      onOpenChat={(chatId) => router.push({ pathname: '/chat/[id]', params: { id: chatId } })}
      onSendMoney={(person, chatId) => {
        const payee: Payee = {
          wawuUserId: person.wawuId,
          name: person.name,
          handle: person.handle,
          avatarUrl: person.avatarUrl,
          tick: person.verification.creator.verified ? 'creator' : person.verification.professional.verified ? 'professional' : null,
        };
        router.push({ pathname: '/chat/send', params: { ...payeeParams(payee), chat: chatId } });
      }}
      onOpenWallet={entry.open}
    />
  );
}
