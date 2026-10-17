import { Redirect, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { useCreatorGate } from '@/features/create/CreateEntry';
import { LibraryScreen } from '@/features/library/LibraryScreen';
import { useSystemBack } from '@/features/professionals/parts';

/**
 * M28 · My content (`/library`), opened from the Me menu (Z1), the Creator dashboard (M18), Sent for review (M25) and the full-uploads
 * note (M27). The Plus starts a new piece (M19); "see why" on a turned-down piece opens M26 (`/library/<id>`). Creator accounts only:
 * anyone else who opens it is sent Home.
 */
export default function LibraryRoute() {
  const router = useRouter();
  const { status } = useSession();
  const gate = useCreatorGate(status === 'signedIn');
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));
  useSystemBack(leave);
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  if (gate !== 'creator') return gate === 'checking' ? null : <Redirect href="/" />;

  return <LibraryScreen onBack={leave} onCreate={() => router.push('/create')} onSeeWhy={(id) => router.push({ pathname: '/library/[id]', params: { id } })} />;
}
