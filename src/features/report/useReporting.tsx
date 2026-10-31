import { useCallback, useState, type ReactNode } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Toast } from '@/components/Toast';
import { space } from '@/theme';

import type { ReportKind } from './api';
import { REPORT_THANKS } from './reasons';
import { ReportSheet } from './ReportSheet';

/**
 * REPORT-UGC. Every place a thing is seen holds one of these: `ask(kind, id)` opens the shared report sheet for that thing;
 * once the Hub took the report the sheet closes, "Thanks. We'll review this." is said, and `onReported` lets the screen
 * take the item out of the reporter's view (a list refetch, or leaving the page). Draw `element` once on the screen.
 */
export function useReporting(onReported?: (kind: ReportKind, targetId: string) => void): {
  ask: (kind: ReportKind, targetId: string) => void;
  element: ReactNode;
} {
  const insets = useSafeAreaInsets();
  const [target, setTarget] = useState<{ kind: ReportKind; id: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const ask = useCallback((kind: ReportKind, id: string) => setTarget({ kind, id }), []);
  const element = (
    <>
      {target ? (
        <ReportSheet
          visible
          kind={target.kind}
          targetId={target.id}
          onClose={() => setTarget(null)}
          onReported={(kind, id) => {
            setTarget(null);
            setToast(REPORT_THANKS);
            onReported?.(kind, id);
          }}
        />
      ) : null}
      <Toast message={toast} tone="success" placement="bottom" offset={insets.bottom + space.xl} duration={3000} onHide={() => setToast(null)} testID="report-toast" />
    </>
  );
  return { ask, element };
}
