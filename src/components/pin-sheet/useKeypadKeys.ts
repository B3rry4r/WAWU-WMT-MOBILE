import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

/**
 * A laptop's keyboard for the keypads (WEBAPP-05, R-127): on the web, the digit keys, Backspace and Enter do what a tap on the
 * keypad does. Nothing is listened to on a phone. The keys are never stored, drawn or logged here: a key goes straight to the
 * keypad's own handlers, and the PIN stays in the sheet's state (there is no input element for the browser to remember).
 *
 * Only the keypad that mounted last listens, so a keypad on a screen left open under a sheet (a stack keeps its screens)
 * hears nothing while the sheet is up. A keypad whose keys are off (a check running, a lock) still takes the keys and
 * drops them, so a digit never reaches the field or the button behind it.
 */
export type KeypadKeys = {
  /** Keys are off (submitting, locked, approved): they are swallowed, not acted on. */
  inactive: boolean;
  onDigit: (digit: string) => void;
  onDelete: () => void;
  onEnter?: () => void;
  /** "." and "," press the decimal point (the amount keypad). */
  onPoint?: () => void;
  /** Let a focused text field keep its own keys (the amount screen has a note field; the PIN sheet has none). */
  yieldToFields?: boolean;
};

const live: symbol[] = [];

/** A button the person reached inside the sheet (Tab, or a click): Enter and Space press it as a browser does. */
function isButtonLike(target: EventTarget | null): boolean {
  const el = target as { tagName?: string; getAttribute?: (name: string) => string | null } | null;
  return el?.tagName?.toLowerCase() === 'button' || el?.getAttribute?.('role') === 'button';
}

function isField(target: EventTarget | null): boolean {
  const el = target as { tagName?: string; isContentEditable?: boolean } | null;
  const tag = el?.tagName?.toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select' || el?.isContentEditable === true;
}

export function useKeypadKeys(keys: KeypadKeys): void {
  const latest = useRef(keys);
  useEffect(() => {
    latest.current = keys;
  });

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || typeof window.addEventListener !== 'function') return;
    const me = Symbol('keypad');
    live.push(me);

    // Focus stays in the sheet: a button left focused behind it (Pay, Continue) would take Enter or Space as a tap.
    const focused = typeof document === 'undefined' ? null : (document.activeElement as HTMLElement | null);
    if (focused && focused !== document.body && !isField(focused)) focused.blur();

    const onKeyDown = (event: KeyboardEvent) => {
      if (live[live.length - 1] !== me) return;
      if (event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return;
      const k = latest.current;
      if (k.yieldToFields && isField(event.target)) return;
      const key = event.key;
      const take = () => {
        event.preventDefault();
        event.stopPropagation();
      };
      if (/^[0-9]$/.test(key)) {
        take();
        if (!k.inactive && !event.repeat) k.onDigit(key);
      } else if ((key === '.' || key === ',') && k.onPoint) {
        take();
        if (!k.inactive && !event.repeat) k.onPoint();
      } else if (key === 'Backspace' || key === 'Delete') {
        take();
        if (!k.inactive) k.onDelete();
      } else if (key === 'Enter' || key === ' ') {
        if (isButtonLike(event.target)) return;
        // Enter and Space never press a button left focused behind the keypad.
        take();
        if (key === 'Enter' && !k.inactive && !event.repeat) k.onEnter?.();
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      const at = live.indexOf(me);
      if (at >= 0) live.splice(at, 1);
    };
  }, []);
}
