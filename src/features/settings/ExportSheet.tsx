import { StyleSheet, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { Text } from '@/components/Text';
import { space } from '@/theme';

import type { ExportState } from './exportState';

export type ExportSheetProps = {
  visible: boolean;
  state: ExportState;
  busy: boolean;
  /** What went wrong asking, in the server's words; null when nothing did. */
  problem: string | null;
  onSend: () => void;
  onClose: () => void;
};

/**
 * Z4's "Download my data": asks before it emails a person's data, and says so when a request is
 * already on its way (the Hub keeps one pending request, so a second tap would add nothing).
 */
export function ExportSheet({ visible, state, busy, problem, onSend, onClose }: ExportSheetProps) {
  const pending = state === 'pending';
  return (
    <BottomSheet visible={visible} onClose={onClose} label="Download my data" dismissible={!busy} testID="export-sheet">
      <View style={styles.words}>
        <Text variant="sheetTitleSm">Download my data</Text>
        <Text variant="muted">
          {pending
            ? 'Your data is already on its way to your email. Check your inbox soon.'
            : // MECHANISM: the Hub's DataExportFulfilmentService (SETTINGS-04) asks WAWU ID to email the link; WAWU ID's route is G-131.
              'We will email you a link to a file with your data. The file says what it leaves out.'}
        </Text>
        {problem ? (
          <Text variant="errorLine" accessibilityRole="alert" accessibilityLiveRegion="polite" testID="export-problem">
            {problem}
          </Text>
        ) : null}
      </View>
      {pending ? (
        <Button label="Done" full variant="secondary" onPress={onClose} testID="export-done" />
      ) : (
        <View style={styles.actions}>
          <Button label="Email it to me" full loading={busy} onPress={onSend} testID="export-send" />
          <Button label="Cancel" full variant="secondary" disabled={busy} onPress={onClose} testID="export-cancel" />
        </View>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  words: { gap: space.sm },
  actions: { gap: space.sm },
});
