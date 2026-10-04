import type { SelfieCapture } from './types';

/**
 * A6's camera on the phone. It needs `expo-camera` (the live preview in the
 * oval, the front lens) and `expo-image-manipulator` (downscale and re-encode
 * the capture so it fits the server's limits and carries nothing after the
 * image), and neither is in this build: `package.json` is fenced, and the
 * request is SHARED-CHANGES row 8 (expo-camera) and KYC-03 #1 (both, with
 * their config plugin and the camera permission text). Until they are
 * installed this build cannot take a selfie, and A6 says so plainly instead
 * of pretending to. The browser build has its own file (`capture.web.ts`).
 */
export function useSelfieCapture(): SelfieCapture {
  return { kind: 'unavailable' };
}
