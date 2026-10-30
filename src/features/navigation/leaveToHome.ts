/** The parts of expo-router's `router` that leaving to Home uses. */
export type HomeRouter = {
  canDismiss: () => boolean;
  dismissAll: () => void;
  navigate: (href: '/') => void;
  replace: (href: '/') => void;
};

/**
 * Done on a "Sent" screen (WALK-FIX M3, B10): always lands on Home, whatever the stack holds. `dismissTo('/')` did nothing on the web export
 * and where Home was not in the stack, so Done was a dead button and the phone's Back (which does what Done does) was swallowed. With a
 * stack behind this screen the flow is closed back to its first screen and Home is brought up on it; with none (a reload, a link) Home
 * takes this screen's place.
 */
export function leaveToHome(router: HomeRouter): void {
  if (router.canDismiss()) {
    router.dismissAll();
    router.navigate('/');
    return;
  }
  router.replace('/');
}
