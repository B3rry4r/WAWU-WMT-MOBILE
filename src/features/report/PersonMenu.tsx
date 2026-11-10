import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { GroupedList } from '@/components/Card';
import { IconTile } from '@/components/IconTile';
import { ListRow } from '@/components/ListRow';
import { Text } from '@/components/Text';
import { space } from '@/theme';

export type PersonMenuProps = {
  visible: boolean;
  onClose: () => void;
  /** The person's name, as the Block row and its question say it. */
  name: string;
  /** The Report row (above Block): its words and what it does. No row when left out. */
  report?: { title: string; onPress: () => void };
  /**
   * Blocks them through the existing block route. It throws when the Hub did not take it, and the menu shows why and stays;
   * it resolves when the block is done, and the caller then leaves the screen, as Block does everywhere else.
   */
  onBlock: () => Promise<void>;
  testID?: string;
};

/**
 * REPORT-UGC round 1 (store gap A and B). The "..." menu a free chat and the asker's side of a paid thread draw: the same two
 * rows the profile's menu and the creator's side of a paid thread have (Report above Block), and the same Block question
 * ("You will not see each other's profiles, and any follow between you ends.") with Block and Cancel. Nothing here is
 * new to the person: it is the profile menu's sheet, drawn from one place for the screens that have no profile page of their own.
 */
export function PersonMenu({ visible, onClose, name, report, onBlock, testID = 'person-menu' }: PersonMenuProps) {
  const [confirm, setConfirm] = useState(false);
  const [acting, setActing] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const busy = useRef(false);

  const close = () => {
    setConfirm(false);
    setProblem(null);
    onClose();
  };
  const block = async () => {
    if (busy.current) return;
    busy.current = true;
    setActing(true);
    setProblem(null);
    try {
      await onBlock();
      setConfirm(false);
      onClose();
    } catch (error) {
      setProblem(isApiError(error) && error.kind === 'network' ? error.message : 'Could not block them. Try again.');
    } finally {
      busy.current = false;
      setActing(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={close} dismissible={!acting} label="More" gap={space.md} testID={testID}>
      {confirm ? (
        <View style={styles.confirm} testID={`${testID}-block-confirm`}>
          <Text variant="h2" accessibilityRole="header">{`Block ${name}?`}</Text>
          <Text variant="body" tone="textSecondary">
            You will not see each other&rsquo;s profiles, and any follow between you ends.
          </Text>
          {problem ? (
            <Text variant="body" tone="danger" accessibilityRole="alert" testID={`${testID}-block-failed`}>
              {problem}
            </Text>
          ) : null}
          <Button testID={`${testID}-block-yes`} label="Block" variant="primary" loading={acting} onPress={() => void block()} full />
          <Button testID={`${testID}-block-no`} label="Cancel" variant="secondary" onPress={() => { setConfirm(false); setProblem(null); }} full />
        </View>
      ) : (
        <GroupedList testID={`${testID}-list`}>
          {report ? (
            <ListRow
              testID={`${testID}-report`}
              lead={<IconTile icon="Flag" />}
              title={report.title}
              onPress={() => {
                close();
                report.onPress();
              }}
            />
          ) : null}
          <ListRow testID={`${testID}-block`} lead={<IconTile icon="Ban" />} title={`Block ${name}`} onPress={() => setConfirm(true)} />
        </GroupedList>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  confirm: { gap: space.md },
});
