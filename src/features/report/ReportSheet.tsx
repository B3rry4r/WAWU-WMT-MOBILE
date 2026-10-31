import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { GroupedList } from '@/components/Card';
import { Icon } from '@/components/icon';
import { ListRow } from '@/components/ListRow';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { space, useWawu } from '@/theme';

import { sendReport, type ReportKind, type ReportReason } from './api';
import { REPORT_REASONS, REPORT_WORDS } from './reasons';

export type ReportSheetProps = {
  visible: boolean;
  /** Close without sending (the backdrop, Cancel, the Android back button). */
  onClose: () => void;
  /** What is being reported; the Hub takes this and the id. */
  kind: ReportKind;
  /** The piece, comment, message or paid question's id; a profile's is the person's wawuId. */
  targetId: string;
  /** After the Hub took the report: the caller says the thanks and takes the item out of the reporter's view. */
  onReported: (kind: ReportKind, targetId: string) => void;
  testID?: string;
};

/**
 * The one report sheet (REPORT-UGC). A reason from the Hub's short list, an optional note, Report. It is the paid-question
 * report of the paid thread (G-INBOX-18-3) made general: that screen and every other place a thing is seen draw this
 * and pass what kind it is. After the Hub answers the caller closes it, says "Thanks. We'll review this." and hides the
 * item. A report that cannot be sent keeps the sheet open with the reason (the network, or a refusal in the Hub's words).
 */
export function ReportSheet({ visible, onClose, kind, targetId, onReported, testID = 'report-sheet' }: ReportSheetProps) {
  const { colors } = useWawu();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const busy = useRef(false);
  const words = REPORT_WORDS[kind];

  const close = () => {
    if (busy.current) return;
    setReason(null);
    setNote('');
    setProblem(null);
    onClose();
  };
  const send = async () => {
    if (busy.current || !reason) return;
    busy.current = true;
    setSending(true);
    setProblem(null);
    try {
      await sendReport({ kind, targetId, reason, note });
      busy.current = false;
      setReason(null);
      setNote('');
      onReported(kind, targetId);
    } catch (error) {
      busy.current = false;
      setProblem(isApiError(error) && (error.kind === 'network' || error.status === 429 || error.status === 400 || error.status === 404) ? error.message : 'Could not send the report. Try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={close} label={words.title} gap={space.md} testID={testID}>
      <View style={styles.body} testID={`${testID}-body`}>
        <Text variant="h2" accessibilityRole="header">
          {words.title}
        </Text>
        <Text variant="body" tone="textSecondary">
          Tell us what is wrong. We will look at it and you will not see it again.
        </Text>
        <GroupedList testID={`${testID}-reasons`}>
          {REPORT_REASONS.map((r) => (
            <ListRow
              key={r.reason}
              testID={`${testID}-reason-${r.reason}`}
              title={r.label}
              onPress={() => setReason(r.reason)}
              accessibilityLabel={reason === r.reason ? `${r.label}, selected` : r.label}
              trailing={reason === r.reason ? <Icon name="Check" size={20} color={colors.accentFg} /> : <View style={styles.hole} />}
            />
          ))}
        </GroupedList>
        <TextField label="Anything else? (optional)" value={note} onChangeText={setNote} multiline max={500} testID={`${testID}-note`} />
        {problem ? (
          <Text variant="body" tone="danger" accessibilityRole="alert" testID={`${testID}-failed`}>
            {problem}
          </Text>
        ) : null}
        <Button testID={`${testID}-send`} label="Report" variant="primary" disabled={!reason} loading={sending} onPress={() => void send()} full />
        <Button testID={`${testID}-cancel`} label="Cancel" variant="secondary" onPress={close} full />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: space.md },
  hole: { width: 20, height: 20 },
});
