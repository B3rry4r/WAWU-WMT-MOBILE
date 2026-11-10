import { useEffect, useSyncExternalStore } from 'react';
import { Modal, Platform } from 'react-native';

import { Toast } from '@/components/Toast';

import { WebFrame } from './WebFrame';

/** How long the "Link copied" note stays up. */
export const SHARE_NOTE_MS = 2200;

type Note = { text: string; at: number } | null;
let note: Note = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** Shows the plain note a web share leaves after it copied (WEBAPP-03). */
export function showShareNote(text: string): void {
  note = { text, at: Date.now() };
  emit();
}
export function clearShareNote(): void {
  if (note === null) return;
  note = null;
  emit();
}
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
const read = () => note;

/**
 * The note, drawn once for the whole app (the root frame mounts it). It sits in its own transparent Modal so it shows over a
 * sheet as well as over a screen, and it takes no presses. Draws nothing on a phone.
 */
export function ShareNote() {
  const current = useSyncExternalStore(subscribe, read, read);
  useEffect(() => {
    if (!current) return undefined;
    const timer = setTimeout(clearShareNote, SHARE_NOTE_MS);
    return () => clearTimeout(timer);
  }, [current]);
  if (Platform.OS !== 'web' || !current) return null;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={clearShareNote}>
      <WebFrame fill={false} testID="share-note-frame">
        <Toast message={current.text} tone="success" placement="bottom" testID="share-note" />
      </WebFrame>
    </Modal>
  );
}
