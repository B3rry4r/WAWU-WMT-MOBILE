import { BottomSheet } from '@/components/BottomSheet';
import { GroupedList } from '@/components/Card';
import { IconTile } from '@/components/IconTile';
import { ListRow } from '@/components/ListRow';
import { Text } from '@/components/Text';

export type AttachSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** The other person's first name: "Femi pays from their wallet". */
  name: string;
  onSendMoney: () => void;
  onRequestMoney: () => void;
};

/**
 * I13 · Add to chat: a sheet over the chat with the ways to put something in it. Send money (from the person's Naira wallet) opens I14 and
 * Request money opens I16. Photo or video and File are not drawn: nothing in the app sends one yet (R-47), and the board's "instant" and
 * "PDF, up to 20 MB" say what nothing here can promise.
 */
export function AttachSheet({ visible, onClose, name, onSendMoney, onRequestMoney }: AttachSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose} label="Add to chat" gap={16} testID="attach-sheet">
      <Text variant="sheetTitleSm">Add to chat</Text>
      <GroupedList>
        <ListRow
          testID="attach-send-money"
          lead={<IconTile icon="ArrowUpRight" tone="accent" />}
          title="Send money"
          subtitle="From your Naira wallet"
          onPress={() => {
            onClose();
            onSendMoney();
          }}
        />
        <ListRow
          testID="attach-request-money"
          lead={<IconTile icon="HandCoins" />}
          title="Request money"
          subtitle={`${name} pays from their wallet`}
          onPress={() => {
            onClose();
            onRequestMoney();
          }}
        />
      </GroupedList>
    </BottomSheet>
  );
}
