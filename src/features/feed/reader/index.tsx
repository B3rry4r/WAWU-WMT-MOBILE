import { useEffect, useRef } from 'react';
import { Linking } from 'react-native';

import type { ReaderProps } from './types';

export type { ReaderProps } from './types';

/**
 * A phone build has no PDF view installed yet (SHARED-CHANGES HOME-02 #2 asks for one), so
 * the free pages open in the phone's own PDF viewer, and the feed stays where it was.
 */
export function PdfReader({ uri, visible, onClose }: ReaderProps) {
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });
  useEffect(() => {
    if (!visible) return;
    Linking.openURL(uri)
      .catch(() => undefined)
      .finally(() => close.current());
  }, [visible, uri]);
  return null;
}
