import { BottomSheet } from '@/components/BottomSheet';
import { GroupedList } from '@/components/Card';
import { IconTile } from '@/components/IconTile';
import { ListRow } from '@/components/ListRow';

/** design/_gen/me.js line 31 (`menu`, Z1 and M7): the sheet's rows sit 12 under its grabber. */
const SHEET_GAP = 12;

export type MeMenuSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Settings (Z2): the row whose screen is built. */
  onOpenSettings: () => void;
  /** My courses (SCHOOLS-08, SC8): drawn once its screen can be opened, so a caller with none draws no row. */
  onOpenCourses?: () => void;
  /** Verification (ME-13): drawn once its screen can be opened, so a caller with none draws no row. */
  onOpenVerification?: () => void;
};

/**
 * Z1 · the Me menu: the sheet M1's Menu button raises over the profile. It holds only the rows whose screen is built
 * (R-47): Settings, which opens Z2 (`/settings`), and Verification (ME-13, `/verification`) above it, with no line under
 * it (the canvas's "Creator tick, ID check in review" is the replaced tick, R-43). The canvas draws six more above them,
 * in this order: Creator dashboard and My content (ME-07), My purchases (ME-14), My courses (SCHOOLS-08), Saved and
 * Notifications (ME-14). The task that builds each of those screens adds its row here, as drawn, with the line the
 * canvas puts under its title (a figure the Hub serves to that screen).
 */
export function MeMenuSheet({ visible, onClose, onOpenSettings, onOpenCourses, onOpenVerification }: MeMenuSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose} label="Menu" gap={SHEET_GAP} testID="me-menu">
      <GroupedList testID="me-menu-list">
        {onOpenCourses ? <ListRow testID="me-menu-courses" lead={<IconTile icon="GraduationCap" />} title="My courses" onPress={onOpenCourses} /> : null}
        {onOpenVerification ? <ListRow testID="me-menu-verification" lead={<IconTile icon="BadgeCheck" />} title="Verification" onPress={onOpenVerification} /> : null}
        <ListRow testID="me-menu-settings" lead={<IconTile icon="Settings" />} title="Settings" onPress={onOpenSettings} />
      </GroupedList>
    </BottomSheet>
  );
}
