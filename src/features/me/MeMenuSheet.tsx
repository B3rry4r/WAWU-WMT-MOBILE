import { BottomSheet } from '@/components/BottomSheet';
import { GroupedList } from '@/components/Card';
import { IconTile } from '@/components/IconTile';
import { ListRow } from '@/components/ListRow';

/** design/_gen/me.js line 31 (`menu`, Z1 and M7): the sheet's rows sit 12 under its grabber. */
const SHEET_GAP = 12;

export type MeMenuSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Settings (Z2): the one row whose screen is built. */
  onOpenSettings: () => void;
};

/**
 * Z1 · the Me menu: the sheet M1's Menu button raises over the profile. It holds only the rows whose screen is built
 * (R-47), and today that is Settings, which opens Z2 (`/settings`). The canvas draws seven more above it, in this order:
 * Creator dashboard and My content (ME-07), My purchases (ME-14), My courses (SCHOOLS-08), Saved and Notifications (ME-14)
 * and Verification (ME-12). The task that builds each of those screens adds its row here, as drawn, with the line the
 * canvas puts under its title (a figure the Hub serves to that screen).
 */
export function MeMenuSheet({ visible, onClose, onOpenSettings }: MeMenuSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose} label="Menu" gap={SHEET_GAP} testID="me-menu">
      <GroupedList testID="me-menu-list">
        <ListRow testID="me-menu-settings" lead={<IconTile icon="Settings" />} title="Settings" onPress={onOpenSettings} />
      </GroupedList>
    </BottomSheet>
  );
}
