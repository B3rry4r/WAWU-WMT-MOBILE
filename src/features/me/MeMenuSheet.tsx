import { BottomSheet } from '@/components/BottomSheet';
import { GroupedList } from '@/components/Card';
import { Icon, type IconName } from '@/components/icon';
import { IconTile } from '@/components/IconTile';
import { ListRow, rowMetrics } from '@/components/ListRow';
import { useWawu } from '@/theme';

/** design/_gen/me.js line 31 (`menu`, Z1 and M7): the sheet's rows sit 12 under its grabber. */
const SHEET_GAP = 12;

/**
 * The rows Z1 draws above Settings, in the canvas's order and with its icons. Each opens a screen another task
 * builds, named in `owner`; until that task lands the row is drawn and does nothing (R-46).
 * The line under each title on the canvas (the month's earnings, the counts, the tick state) is a figure the
 * Hub serves to that task's screen, so it is not drawn here (rule 7).
 */
export const MENU_ROWS: readonly { key: string; icon: IconName; title: string; owner: string }[] = [
  { key: 'dashboard', icon: 'LayoutDashboard', title: 'Creator dashboard', owner: 'ME-07' },
  { key: 'content', icon: 'Library', title: 'My content', owner: 'ME-07' },
  { key: 'purchases', icon: 'ShoppingBag', title: 'My purchases', owner: 'ME-14' },
  { key: 'courses', icon: 'GraduationCap', title: 'My courses', owner: 'SCHOOLS-08' },
  { key: 'saved', icon: 'Bookmark', title: 'Saved', owner: 'ME-14' },
  { key: 'notifications', icon: 'Bell', title: 'Notifications', owner: 'ME-14' },
  { key: 'verification', icon: 'BadgeCheck', title: 'Verification', owner: 'ME-12' },
];

export type MeMenuSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Settings (Z2): the one row whose screen is built. */
  onOpenSettings: () => void;
};

/**
 * Z1 · the Me menu: the sheet M1's Menu button raises over the profile. Settings opens Z2 (`/settings`).
 * The other rows are drawn as the canvas draws them, chevron included, and do nothing until the task named in
 * `MENU_ROWS` builds where they lead (ME-03 wires them with their lines).
 */
export function MeMenuSheet({ visible, onClose, onOpenSettings }: MeMenuSheetProps) {
  const { colors } = useWawu();
  return (
    <BottomSheet visible={visible} onClose={onClose} label="Menu" gap={SHEET_GAP} testID="me-menu">
      <GroupedList testID="me-menu-list">
        {MENU_ROWS.map((row) => (
          <ListRow
            key={row.key}
            testID={`me-menu-${row.key}`}
            lead={<IconTile icon={row.icon} />}
            title={row.title}
            trailing={<Icon name="ChevronRight" size={rowMetrics.chevron} color={colors.textMuted} />}
          />
        ))}
        <ListRow testID="me-menu-settings" lead={<IconTile icon="Settings" />} title="Settings" onPress={onOpenSettings} />
      </GroupedList>
    </BottomSheet>
  );
}
