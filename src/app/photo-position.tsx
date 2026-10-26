import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { updateDraft, useDraft } from '@/features/profile-edit/draft';
import { PhotoPositionScreen, type PhotoKind } from '@/features/profile-edit/PhotoPositionScreen';

/**
 * Position the profile picture or the cover (`/photo-position?kind=avatar|cover`, R-96). It edits the form M8 holds, so it opens
 * only from M8: a visit with no form open (a link, a reload), or for a picture the form does not have, goes to M8. Done puts the
 * picture's link, with its position, back in the form; M8's Save sends it. Signed in only, by the route graph.
 */
export default function PhotoPositionRoute() {
  const router = useRouter();
  const draft = useDraft();
  const { kind } = useLocalSearchParams<{ kind?: string }>();
  const photo: PhotoKind | null = kind === 'avatar' || kind === 'cover' ? kind : null;
  const link = photo === 'avatar' ? draft?.form.avatarUrl : photo === 'cover' ? draft?.form.coverUrl : null;
  if (!draft || !photo || !link) return <Redirect href="/edit-profile" />;

  const close = () => (router.canGoBack() ? router.back() : router.replace('/edit-profile'));
  return (
    <PhotoPositionScreen
      kind={photo}
      link={link}
      onClose={close}
      onDone={(next) => {
        updateDraft((form) => ({ ...form, [photo === 'avatar' ? 'avatarUrl' : 'coverUrl']: next }));
        close();
      }}
    />
  );
}
