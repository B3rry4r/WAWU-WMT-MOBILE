import { Redirect } from 'expo-router';

/**
 * PT6 · Convert to cash (`/points-convert`) is gone from the app (R-103, owner, 30 Oct 2026: the stores do not allow points to be
 * turned into cash). Nothing opens it any more; this file stays only so a link or a notification from an older build lands on Your
 * points and not on a missing page. The Hub's convert routes stay until the removal task.
 */
export default function PointsConvertRoute() {
  return <Redirect href="/points" />;
}
