import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { ProfileScreen } from '@/features/professionals/ProfileScreen';
import { useSystemBack } from '@/features/professionals/parts';

/** P2 · Profile and P3 · Not taking messages (`/professionals/<id>`). Opened from P1; on its own, back goes to P1. */
export default function ProfessionalRoute() {
  const router = useRouter();
  const { status } = useSession();
  const { id } = useLocalSearchParams<{ id: string }>();
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/professionals'));
  useSystemBack(leave);
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  if (typeof id !== 'string' || id === '') return <Redirect href="/professionals" />;

  return <ProfileScreen id={id} onBack={leave} />;
}
