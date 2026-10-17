import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { addMoneyHref } from '@/features/addmoney/entry';
import { ChatScreen } from '@/features/chat/ChatScreen';
import { OPEN_WALLET_PIN_PATH, useOpenWalletEntry } from '@/features/open-wallet/entry';
import { payeeParams, type Payee } from '@/features/send/model';

/** I12 to I19 · A chat between two people (`/chat/<id>`). Opened from the Inbox and from a push. */
export default function ChatRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const entry = useOpenWalletEntry();
  const { status } = useSession();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/inbox'));
  return (
    <ChatScreen
      key={String(id)}
      chatId={String(id)}
      onBack={leave}
      onSendMoney={(person) => {
        const payee: Payee = {
          wawuUserId: person.wawuId,
          name: person.name,
          handle: person.handle,
          avatarUrl: person.avatarUrl,
          tick: person.verification.creator.verified ? 'creator' : person.verification.professional.verified ? 'professional' : null,
        };
        router.push({ pathname: '/chat/send', params: { ...payeeParams(payee), chat: String(id) } });
      }}
      onOpenWallet={entry.open}
      onSetPin={() => router.push(OPEN_WALLET_PIN_PATH)}
      onForgotPin={() => router.push('/reset-pin')}
      onAddMoney={(short) => router.push(addMoneyHref(short))}
    />
  );
}
