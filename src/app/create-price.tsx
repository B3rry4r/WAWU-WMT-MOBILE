import { Redirect, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { useCreatorGate } from '@/features/create/CreateEntry';
import { detailsReady, useDetails, useSent } from '@/features/create/details';
import { fullFileOf, useCover, useDraft, useLessons } from '@/features/create/draft';
import { coverRequired, previewWayOf } from '@/features/create/model';
import { PriceScreen } from '@/features/create/PriceScreen';

/**
 * M24 · Price (`/create-price`), step 5 of 5, and M37 when Free is picked. Opened without the steps before it, it goes back to the
 * one it is missing. Send for review opens M25 (`/create-review`); the draw in between is empty so the guards below never see
 * the emptied draft as a reason to go back.
 */
export default function CreatePriceRoute() {
  const router = useRouter();
  const { status } = useSession();
  const draft = useDraft();
  const { format } = draft;
  const lessons = useLessons();
  const full = fullFileOf(draft, lessons);
  const details = useDetails();
  const sent = useSent();
  const cover = useCover();
  const gate = useCreatorGate(status === 'signedIn');
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  if (gate !== 'creator') return gate === 'checking' ? null : <Redirect href="/" />;
  if (sent) return null;
  if (!format) return <Redirect href="/create-format" />;
  if (!full) return <Redirect href="/create-upload" />;
  // A paid template, or a paid course with no video first, previews as its cover (R-118): the cover step holds it until there is one.
  if (coverRequired(previewWayOf(format, full), details.accessType === 'free') && !(cover.mode === 'picture' && cover.file)) return <Redirect href="/create-preview" />;
  if (!detailsReady(details)) return <Redirect href="/create-details" />;

  return (
    <PriceScreen
      format={format}
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/create-details'))}
      onSent={() => router.replace('/create-review')}
    />
  );
}
