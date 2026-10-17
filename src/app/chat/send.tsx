import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { ChatSendScreen } from '@/features/chat/ChatSendScreen';
import { OPEN_WALLET_PIN_PATH } from '@/features/open-wallet/entry';
import { useSystemBack } from '@/features/professionals/parts';
import { payeeFromParams } from '@/features/send/model';

/** I14 · Amount (`/chat/send`): the person and the chat they are in ride in the params. Without them, back to the Inbox. */
export default function ChatSendRoute() {
  const router = useRouter();
  const { status } = useSession();
  const params = useLocalSearchParams();
  const payee = payeeFromParams(params);
  const chat = Array.isArray(params.chat) ? params.chat[0] : params.chat;
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/inbox'));
  useSystemBack(leave);
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  if (!payee || !chat) return <Redirect href="/inbox" />;
  return (
    <ChatSendScreen
      chatId={chat}
      payee={payee}
      onBack={leave}
      onDone={leave}
      onSetPin={() => router.push(OPEN_WALLET_PIN_PATH)}
      onForgotPin={() => router.push('/reset-pin')}
    />
  );
}
