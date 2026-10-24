import type { ComponentType } from 'react';

import { LeaveDevRoute } from '@/features/shell/LeaveDevRoute';

/**
 * Every Send abroad screen with canned data, for pictures (NUV-11). Development only. A release build replaces `__DEV__` with
 * `false` and drops the branch below with the `require` in it, so the Gallery module (canned names and amounts) is not in the
 * release bundle at all (round 1, F5); the route itself then only sends the visitor to where the app opens for them.
 * Open /dev/abroad?screen=home in `npm run web`.
 */
let Gallery: ComponentType | null = null;
if (__DEV__) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Gallery = (require('@/features/abroad/Gallery') as typeof import('@/features/abroad/Gallery')).AbroadGallery;
}

export default function AbroadGalleryRoute() {
  if (!__DEV__ || !Gallery) return <LeaveDevRoute />;
  return <Gallery />;
}
