import { Modal, Platform, type ModalProps } from 'react-native';

import { WebFrame } from './WebFrame';

/**
 * A `Modal` that stays in the app's column on a wide browser window (R-127, Phase 1). A browser lifts a Modal out of the
 * page to the whole window, so without this a sheet or viewer would stretch across a laptop. On a phone, and on a
 * window as narrow as a phone, it is the plain `Modal`.
 */
export function FrameModal({ children, transparent, ...rest }: ModalProps) {
  if (Platform.OS !== 'web') {
    return (
      <Modal transparent={transparent} {...rest}>
        {children}
      </Modal>
    );
  }
  // On the web every Modal is drawn transparent and the frame paints the page behind a full-screen one.
  return (
    <Modal transparent {...rest}>
      <WebFrame fill={!transparent} testID="web-frame-modal">
        {children}
      </WebFrame>
    </Modal>
  );
}
