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
 * `Preview`, when the platform has a live camera, fills the oval; `settings`
 * is there only while the person has turned the camera off for this app and
 * the phone will not ask again: it opens the phone's settings, and A6 offers
 * it in place of the capture button. `unavailable`: this build cannot take
 * one (the phone's camera did not start), and A6 says so instead of a
 * capture button.
 */
export type SelfieCapture =
  | { kind: 'ready'; take: () => Promise<CaptureResult>; Preview?: ComponentType; settings?: () => void }
  | { kind: 'unavailable' };
