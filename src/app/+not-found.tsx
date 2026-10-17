import { LeaveDevRoute } from '@/features/shell/LeaveDevRoute';

/**
 * An address the app has no screen for (a mistyped link, an old one): the visitor goes to where the app opens for them, the same as a
 * development-only route in a release build. Expo's own "Unmatched Route" page is never drawn (CHECK-1 F-1).
 */
export default function NotFound() {
  return <LeaveDevRoute />;
}
