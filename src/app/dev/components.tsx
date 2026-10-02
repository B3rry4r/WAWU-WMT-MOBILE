import { Redirect } from 'expo-router';
import { lazy, Suspense } from 'react';

const Showcase = lazy(() => import('@/features/showcase/Showcase').then((m) => ({ default: m.Showcase })));

/**
 * Every shared component on one page, for pictures against the design. Development
 * only: a production build redirects to Home, and no tab or link points here.
 * Open /dev/components in `npm run web`.
 */
export default function ComponentsRoute() {
  if (!__DEV__) return <Redirect href="/" />;
  return (
    <Suspense fallback={null}>
      <Showcase />
    </Suspense>
  );
}
