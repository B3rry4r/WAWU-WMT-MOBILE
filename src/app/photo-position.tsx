import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

import { dropPendingPhoto, readPendingPhoto, releasePendingPhoto, updateDraft, useDraft } from '@/features/profile-edit/draft';
import { PhotoPositionScreen, type PhotoKind } from '@/features/profile-edit/PhotoPositionScreen';
import { splitPhotoLink } from '@/lib/photoPosition';

/**
 * Position the profile picture or the cover (`/photo-position?kind=avatar|cover`, R-96). It works on the form M8 holds, so it opens
 * only from M8: a visit with no form open (a link, a reload), or for a picture there is none of, goes to M8.
 * - A photo just chosen from the phone is shown from the phone. Save hands its position to M8, which uploads it; Cancel drops it and
 *   the old picture stays.
 * - A picture already set ("Reposition") is shown from the form's link. Save puts the link back in the form with its position;
 *   Cancel changes nothing. M8's own Save sends the form either way.
 * Signed in only, by the route graph.
 */
export default function PhotoPositionRoute() {
  const router = useRouter();
  const draft = useDraft();
  const { kind } = useLocalSearchParams<{ kind?: string }>();
  const photo: PhotoKind | null = kind === 'avatar' || kind === 'cover' ? kind : null;
  // Settled once, when the screen opens: Save and Cancel let go of the photo, and the screen must not change its mind while it closes.
  const [chosen] = useState(() => {
    const waiting = readPendingPhoto();
    return waiting && waiting.kind === photo ? waiting : null;
  });
  const held = photo === 'avatar' ? draft?.form.avatarUrl : photo === 'cover' ? draft?.form.coverUrl : null;
  const link = chosen ? chosen.picked.previewUri : held;
  if (!draft || !photo || !link) return <Redirect href="/edit-profile" />;

  const close = () => (router.canGoBack() ? router.back() : router.replace('/edit-profile'));
  return (
    <PhotoPositionScreen
      kind={photo}
      link={link}
      onCancel={() => {
        if (chosen) dropPendingPhoto();
        close();
      }}
      onSave={(next) => {
        if (chosen) {
          releasePendingPhoto();
          chosen.place(splitPhotoLink(next).position);
        } else {
          updateDraft((form) => ({ ...form, [photo === 'avatar' ? 'avatarUrl' : 'coverUrl']: next }));
        }
        close();
      }}
    />
  );
}
