import { BottomSheet } from '@/components/BottomSheet';
import { GroupedList } from '@/components/Card';
import { IconTile } from '@/components/IconTile';
import { ListRow } from '@/components/ListRow';
import { Text } from '@/components/Text';

const SHEET_GAP = 16;

export type AttachSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** The other person's first name: "Femi pays from their wallet". */
  name: string;
  onSendMoney: () => void;
  onRequestMoney: () => void;
  /** Photo or video (FIX-104): opens the phone's library. Left out, the row is not drawn (a paid thread takes words only, FIX-109). */
  onPickMedia?: () => void;
  /** File (FIX-104): opens the phone's files. Left out, the row is not drawn. */
  onPickFile?: () => void;
  /** The File row's line, from the Hub's own rule ("PDF, up to 20 MB"). Left out until the Hub has answered. */
  fileLine?: string | null;
};

/**
 * I13 · Add to chat: a sheet over the chat with the ways to put something in it. Send money (from the person's Naira wallet) opens I14 and
 * Request money opens I16; Photo or video opens the phone's library and File its files (FIX-104), and the chat sends what is chosen. The
 * board's "instant" says what nothing here can promise and is not printed; the File line ("PDF, up to 20 MB") is the Hub's own rule.
 */
export function AttachSheet({ visible, onClose, name, onSendMoney, onRequestMoney, onPickMedia, onPickFile, fileLine }: AttachSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose} label="Add to chat" gap={SHEET_GAP} testID="attach-sheet">
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
        {onPickMedia ? (
          <ListRow
            testID="attach-photo-video"
            lead={<IconTile icon="Image" />}
            title="Photo or video"
            onPress={() => {
              onClose();
              onPickMedia();
            }}
          />
        ) : null}
        {onPickFile ? (
          <ListRow
            testID="attach-file"
            lead={<IconTile icon="Paperclip" />}
            title="File"
            subtitle={fileLine ?? undefined}
            onPress={() => {
              onClose();
              onPickFile();
            }}
          />
        ) : null}
      </GroupedList>
    </BottomSheet>
  );
}
