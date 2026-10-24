import { StyleSheet, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { Text } from '@/components/Text';
import { space } from '@/theme';

export type ReviewSheetProps = {
  visible: boolean;
  /** Keep editing: closes the sheet and sends nothing. */
  onClose: () => void;
  /** Save and send for review. */
  onConfirm: () => void;
  /** The save is on its way: the sheet cannot be dismissed and the button waits. */
  busy: boolean;
};

/**
 * What a host is told before an edit is sent (R-79 (c)): the Hub puts every edit of a sent event back in review, so the event leaves the
 * calendar until a person approves it again. No board draws it (G-EVENTS-14-1): the sheet is the app's shared bottom sheet, title, one
 * line and two buttons.
 */
export function ReviewSheet({ visible, onClose, onConfirm, busy }: ReviewSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose} dismissible={!busy} label="Send for review again" testID="review-sheet">
      <Text variant="sheetTitleSm" accessibilityRole="header">
        Send it for review again?
      </Text>
      <Text variant="muted" testID="review-sheet-words">
        Your event goes back to review and comes off the calendar until a person approves it again.
      </Text>
      <View style={styles.buttons}>
        <Button testID="review-confirm" label="Save and send for review" full loading={busy} onPress={onConfirm} />
        <Button testID="review-keep" label="Keep editing" variant="secondary" size="lg" full disabled={busy} onPress={onClose} />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  buttons: { gap: space.md },
});
