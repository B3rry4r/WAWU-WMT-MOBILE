import type { ReactNode } from 'react';
import { Pressable } from 'react-native';

/**
 * Press and hold to report (REPORT-UGC). With no handler it draws its children as they are, so a message, comment or bubble that
 * cannot be reported (the person's own) is unchanged. With one, a hold of 350 ms calls it, and a screen reader gets a
 * "Report" action on the same thing.
 */
export function LongPressable({ onLongPress, children, label = 'Report' }: { onLongPress?: () => void; children: ReactNode; label?: string }) {
  if (!onLongPress) return <>{children}</>;
  return (
    <Pressable
      onLongPress={onLongPress}
      delayLongPress={350}
      accessible={false}
      accessibilityActions={[{ name: 'longpress', label }]}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === 'longpress') onLongPress();
      }}
    >
      {children}
    </Pressable>
  );
}
