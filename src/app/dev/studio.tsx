import type { ComponentType } from 'react';

import { LeaveDevRoute } from '@/features/shell/LeaveDevRoute';

/**
 * The picture and video tools of Studio with canned data, for pictures (POINTS-14, POINTS-15). Development only: a release build replaces
 * `__DEV__` with `false` and drops the branch below with the `require` in it, so the gallery (and the tools' canned text) is not in the
 * release bundle at all; the route then only sends the visitor to where the app opens for them. Open
 * `/dev/studio?tool=image&view=done&creator=1` in `npm run web` (tool: image, photo-edit, video, talking-photo, voiceover; view: input,
 * working, done, failed).
 */
let Gallery: ComponentType | null = null;
if (__DEV__) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Gallery = (require('@/features/points/Gallery') as typeof import('@/features/points/Gallery')).PointsGallery;
}

export default function StudioGalleryRoute() {
  if (!__DEV__ || !Gallery) return <LeaveDevRoute />;
  return <Gallery />;
}
