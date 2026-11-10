import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/client';
import { Banner } from '@/components/Banner';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { IconTile } from '@/components/IconTile';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { useKeyboardLift } from '@/features/feedpay/useKeyboardLift';
import { space } from '@/theme';

import { DangerButton } from './organiserParts';
import type { CancelAnswer } from './organiserApi';
import { REASON, outcomeLines, reasonError, refundLine } from './organiserFormat';

export type CancelSheetProps = {
  visible: boolean;
  /** Keep the event: closes the sheet and changes nothing. */
  onClose: () => void;
  /** How many people the call-off refunds, from the Hub (`GET /events/{id}/call-off`); null while it has not arrived. */
  buyers: number | null;
  /** Calls it off. Rejects with the Hub's own refusal; resolves with its answer. */
  onCancel: (reason: string) => Promise<CancelAnswer>;
  /** The host has read what happened. */
  onDone: () => void;
};

/**
 * E25 · Call it off: a sheet over the dashboard that asks for a reason and says plainly that this moves real money. Once it is sent the
 * sheet becomes what happened (refunds sent, refunds still going out, refunds that need a person), from the Hub's answer.
 */
export function CancelSheet({ visible, onClose, buyers, onCancel, onDone }: CancelSheetProps) {
  // R-117 part B: the sheet is a modal the keyboard covers, so it adds the keyboard's height under its last row (Android draws edge to edge).
  const lift = useKeyboardLift();
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [failure, setFailure] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [answer, setAnswer] = useState<CancelAnswer | null>(null);
  const inFlight = useRef(false);
  const mounted = useRef(true);
  useEffect(() => () => void (mounted.current = false), []);

  const send = async () => {
    if (inFlight.current) return;
    const problem = reasonError(reason);
    setError(problem);
    if (problem) return;
    inFlight.current = true;
    setBusy(true);
    setFailure(null);
    try {
      const done = await onCancel(reason.trim());
      if (mounted.current) setAnswer(done);
    } catch (e) {
      if (mounted.current) setFailure(isApiError(e) ? e.message : 'The event was not called off. Try again.');
    } finally {
      inFlight.current = false;
      if (mounted.current) setBusy(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={answer ? onDone : onClose} dismissible={!busy} label="Cancel this event" testID="cancel-sheet">
      {answer ? (
        <View testID="cancel-result" style={styles.result}>
          <IconTile icon="CalendarX" tone="danger" size={64} />
          <Text variant="sheetTitleSm" accessibilityRole="header">
            Event called off
          </Text>
          <View style={styles.lines}>
            {outcomeLines(answer).map((line) => (
              <Text key={line} variant="muted" style={styles.centered}>
                {line}
              </Text>
            ))}
          </View>
          <Button testID="cancel-done" label="Done" full onPress={onDone} />
        </View>
      ) : (
        <>
          <Text variant="sheetTitleSm" accessibilityRole="header">
            Cancel this event
          </Text>
          <Banner tone="danger" icon="TriangleAlert" title="This refunds real money" body={refundLine(buyers)} testID="cancel-warning" />
          <TextField
            testID="cancel-reason"
            label="Why"
            placeholder="Why are you calling it off?"
            value={reason}
            onChangeText={(v) => {
              setReason(v);
              setError(undefined);
              setFailure(null);
            }}
            maxLength={REASON.max}
            error={error}
          />
          {failure ? (
            <Text variant="errorLine" tone="danger" accessibilityRole="alert" testID="cancel-failure">
              {failure}
            </Text>
          ) : null}
          <View style={styles.buttons}>
            <DangerButton testID="cancel-confirm" label="Cancel and refund everyone" loading={busy} onPress={() => void send()} />
            <Button testID="cancel-keep" label="Keep the event" variant="secondary" size="lg" full disabled={busy} onPress={onClose} />
          </View>
          {lift > 0 ? <View testID="cancel-keyboard-lift" style={{ height: lift }} /> : null}
        </>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  buttons: { gap: space.md },
  result: { alignItems: 'center', gap: space.md },
  lines: { gap: space.xs },
  centered: { textAlign: 'center' },
});
