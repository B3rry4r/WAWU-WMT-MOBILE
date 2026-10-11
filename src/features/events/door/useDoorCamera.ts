import { useCameraPermissions } from 'expo-camera';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Linking, Platform } from 'react-native';

/**
 * What the door's camera can do right now (E19, expo-camera, SHARED-CHANGES row 8):
 * - `starting`: the phone has not said yet (or the question is on its screen);
 * - `ready`: the camera may be drawn and scanning;
 * - `askable`: the person let the question go, and the phone will ask again: `allow` asks;
 * - `blocked`: the camera is off for this app and the phone will not ask: `settings` opens the phone's settings
 *   (the browser build has none, so it is absent there) and the camera comes back when the person returns with it allowed;
 * - `unavailable`: the camera did not start (no back lens, or another app holds it).
 * Whatever the state, the code can still be typed.
 */
export type DoorCamera =
  | { kind: 'starting' }
  | { kind: 'ready' }
  | { kind: 'askable'; allow: () => void }
  | { kind: 'blocked'; settings?: () => void }
  | { kind: 'unavailable' };

export function useDoorCamera(): { camera: DoorCamera; onMountError: () => void } {
  const [permission, request, read] = useCameraPermissions();
  const asked = useRef(false);
  const [failed, setFailed] = useState(false);

  // The first time the screen opens it asks once, on its own: a person who opens the scanner wants the camera.
  // Until the phone has an answer the permission stays undetermined, and the screen says it is opening the camera.
  useEffect(() => {
    if (permission && permission.status === 'undetermined' && permission.canAskAgain && !asked.current) {
      asked.current = true;
      void request();
    }
  }, [permission, request]);

  // Back from the phone's settings: read the permission again, so the camera comes back if it was allowed there.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void read();
    });
    return () => subscription.remove();
  }, [read]);

  const onMountError = useCallback(() => setFailed(true), []);

  if (failed) return { camera: { kind: 'unavailable' }, onMountError };
  if (!permission || (permission.status === 'undetermined' && permission.canAskAgain)) return { camera: { kind: 'starting' }, onMountError };
  if (permission.granted) return { camera: { kind: 'ready' }, onMountError };
  if (!permission.canAskAgain) {
    return { camera: { kind: 'blocked', settings: Platform.OS === 'web' ? undefined : () => void Linking.openSettings() }, onMountError };
  }
  return { camera: { kind: 'askable', allow: () => void request() }, onMountError };
}
