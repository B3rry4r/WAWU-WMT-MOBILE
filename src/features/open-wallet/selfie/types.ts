import type { ComponentType } from 'react';

/**
 * What one tap on "Take selfie" gave:
 * - `image`: the capture as plain base64 JPEG, re-encoded on the phone (no
 *   bytes after the image's end, under the server's size limits), ready to
 *   send once and then dropped;
 * - `cancelled`: the person backed out, nothing was taken;
 * - `unusable`: something was taken but could not be made into a selfie the
 *   server takes (unreadable, or too small or too large after re-encoding).
 */
export type CaptureResult = { kind: 'image'; image: string } | { kind: 'cancelled' } | { kind: 'unusable' };

/**
 * How this build takes A6's selfie. `ready`: `take` captures one, and
 * `Preview`, when the platform has a live camera, fills the oval. `unavailable`:
 * this build cannot take one, and A6 says so instead of a capture button.
 */
export type SelfieCapture =
  | { kind: 'ready'; take: () => Promise<CaptureResult>; Preview?: ComponentType }
  | { kind: 'unavailable' };
