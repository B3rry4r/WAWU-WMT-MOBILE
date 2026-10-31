import type { ReactNode } from 'react';
import { Pressable, type AccessibilityActionEvent } from 'react-native';

/**
 * Press and hold to report (REPORT-UGC). With no handler it draws its children as they are, so a message, comment or bubble that
 * cannot be reported (the person's own) is unchanged. With one, a hold of 350 ms calls it.
 *
 * A screen reader has no hold, so the row's own accessible element also carries a "Report" action (`reportAction`): the
 * Pressable here is a plain wrapper and is not itself an accessibility element, so the action goes where the reader's focus lands.
 */
export function LongPressable({ onLongPress, children }: { onLongPress?: () => void; children: ReactNode }) {
  if (!onLongPress) return <>{children}</>;
  return (
    <Pressable onLongPress={onLongPress} delayLongPress={350} accessible={false}>
      {children}
    </Pressable>
  );
}

/** The accessibility action every report row has: `Report`, for TalkBack's and VoiceOver's actions menu. Spread it on the row's accessible element. */
export const REPORT_ACTION = 'report';
export function reportAction(onReport: (() => void) | undefined, label = 'Report'): {
  accessibilityActions?: { name: string; label: string }[];
  onAccessibilityAction?: (event: AccessibilityActionEvent) => void;
} {
  if (!onReport) return {};
  return {
    accessibilityActions: [{ name: REPORT_ACTION, label }],
    onAccessibilityAction: (event) => {
      if (event.nativeEvent.actionName === REPORT_ACTION) onReport();
    },
  };
}
