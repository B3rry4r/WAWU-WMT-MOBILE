import { lazy, Suspense } from 'react';
import { LeaveDevRoute } from '@/features/shell/LeaveDevRoute';

const Gallery = lazy(() => import('@/features/abroad/Gallery').then((m) => ({ default: m.AbroadGallery })));

/** Every Send abroad screen with canned data, for pictures (NUV-11). Development only: a production build redirects to Home. Open /dev/abroad?screen=home in `npm run web`. */
export default function AbroadGalleryRoute() {
  if (!__DEV__) return <LeaveDevRoute />;
  return (
    <Suspense fallback={null}>
      <Gallery />
    </Suspense>
  );
}
