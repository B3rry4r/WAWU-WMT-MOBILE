import { CameraView, useCameraPermissions, type PictureRef } from 'expo-camera';
import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { createElement, useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import { AppState, Linking, StyleSheet } from 'react-native';

import { SELFIE_MAX_BASE64_CHARS } from '@/api/walletIdentity';

import { isSendableSelfie } from '../api/opening';
import { isWholeJpeg, SELFIE_MAX_SIDE, SELFIE_QUALITIES, selfieResize } from './encoding';
import type { CaptureResult, SelfieCapture } from './types';

/**
 * A6's camera on the phone (`expo-camera`, `expo-image-manipulator`;
 * SHARED-CHANGES KYC-03 #1, applied by SHARED-04). The browser build has its
 * own file (`capture.web.ts`).
 *
 * - **The camera.** The front lens's live picture fills the oval (`Preview`)
 *   once the person has let the app use the camera. The first tap on "Take
 *   selfie" asks for it and takes nothing: the person sees themselves in the
 *   oval, then taps again. If they have turned the camera off for this app
 *   and the phone will not ask again, `settings` opens the phone's settings,
 *   and the camera comes back when they return with it allowed.
 * - **The capture.** Held in memory as the camera's own image (never written
 *   at full size), brought down to `SELFIE_LONGEST_SIDE` on its long side and
 *   re-encoded as JPEG, stepping the quality down until it fits the server's
 *   `SELFIE_MAX_BASE64_CHARS`. The encoder writes a fresh file whose last
 *   bytes are the image's end marker, so nothing follows the image (KYC-02
 *   refuses such files); that, the size, the server's 2,048 pixels a side and
 *   the smallest photo it takes are checked here before anything is sent.
 * - **Nothing is kept.** The manipulator can only answer through a file in
 *   the app's cache, which is deleted as soon as its base64 is read; the
 *   native images are released. The base64 lives in the returned value only.
 */

/** Deletes a file the manipulator wrote; one that is already gone is fine. */
function forget(uri: string) {
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // Nothing to remove, or the cache was cleared under us: either way the file is not kept.
  }
}

/** Brings one capture down to the server's limits: plain base64 JPEG, or null when it cannot fit them. */
export async function encodeSelfie(picture: PictureRef): Promise<string | null> {
  const context = ImageManipulator.manipulate(picture);
  try {
    const size = selfieResize(picture.width, picture.height);
    if (size) context.resize(size);
    const image = await context.renderAsync();
    try {
      if (Math.max(image.width, image.height) > SELFIE_MAX_SIDE) return null;
      for (const quality of SELFIE_QUALITIES) {
        const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: quality, base64: true });
        forget(saved.uri);
        const base64 = saved.base64 ?? '';
        if (base64.length <= SELFIE_MAX_BASE64_CHARS) return isWholeJpeg(base64) && isSendableSelfie(base64) ? base64 : null;
      }
      return null;
    } finally {
      image.release();
    }
  } finally {
    context.release();
  }
}

export function useSelfieCapture(): SelfieCapture {
  const [permission, requestPermission, readPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  /** True from the camera's `onCameraReady` until it goes away: a picture taken before it has started would fail. */
  const started = useRef(false);
  /** The camera could not start (no front lens, or another app holds it). */
  const [failed, setFailed] = useState(false);
  const granted = permission?.granted === true;

  // Back from the phone's settings: read the permission again, so the camera comes back if it was allowed there.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void readPermission();
    });
    return () => subscription.remove();
  }, [readPermission]);

  const Preview = useMemo<ComponentType | undefined>(() => {
    if (!granted) return undefined;
    return function SelfiePreview() {
      useEffect(
        () => () => {
          started.current = false;
        },
        [],
      );
      return createElement(CameraView, {
        ref: camera,
        facing: 'front',
        style: StyleSheet.absoluteFill,
        testID: 'open-wallet-selfie-camera',
        onCameraReady: () => {
          started.current = true;
        },
        onMountError: () => {
          started.current = false;
          setFailed(true);
        },
      });
    };
  }, [granted]);

  if (failed) return { kind: 'unavailable' };

  const take = async (): Promise<CaptureResult> => {
    if (!granted) {
      // This tap only asks: once allowed, the oval shows the camera and the next tap takes the selfie.
      await requestPermission();
      return { kind: 'cancelled' };
    }
    const view = camera.current;
    if (!view || !started.current) return { kind: 'cancelled' };
    let picture: PictureRef;
    try {
      picture = await view.takePictureAsync({ pictureRef: true });
    } catch {
      return { kind: 'unusable' };
    }
    try {
      const image = await encodeSelfie(picture);
      return image ? { kind: 'image', image } : { kind: 'unusable' };
    } catch {
      return { kind: 'unusable' };
    } finally {
      picture.release();
    }
  };

  const blocked = Boolean(permission) && !permission?.granted && !permission?.canAskAgain;
  return { kind: 'ready', take, Preview, settings: blocked ? () => void Linking.openSettings() : undefined };
}
