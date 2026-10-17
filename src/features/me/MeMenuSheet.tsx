import { useQuery } from '@tanstack/react-query';

import { BottomSheet } from '@/components/BottomSheet';
import { GroupedList } from '@/components/Card';
import { IconTile } from '@/components/IconTile';
import { ListRow } from '@/components/ListRow';
import { formatMoney } from '@/components/Money';
import { allowanceKey, fetchAllowance } from '@/features/create/api';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { earningsQuery } from '@/features/wallet/earnings/api';
import { showsKobo } from '@/features/wallet/earnings/model';

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
  /** Creator dashboard (ME-07, M18): a creator's row, drawn only when given. Its line is this month's earnings, the Hub's figure. */
  onOpenDashboard?: () => void;
  /** My content (ME-07, M28): a creator's row, drawn only when given. Its line is "4 of 5 uploads" from the Hub's own count. */
  onOpenLibrary?: () => void;
};

/**
 * Z1 · the Me menu: the sheet M1's Menu button raises over the profile. It holds only the rows whose screen is built
 * (R-47): Creator dashboard and My content (ME-07, a creator's: M18 and M28), My courses (SCHOOLS-08, SC8), then Verification
 * (ME-13, `/verification`) and Settings, which opens Z2 (`/settings`), with no line under Verification (the canvas's "Creator tick,
 * ID check in review" is the replaced tick, R-43). The canvas draws three more among them, in this order: My purchases (ME-14, after
 * My content), Saved and Notifications (ME-14, after My courses). The task that builds each of those screens adds its row here, as
 * drawn, with the line the canvas puts under its title (a figure the Hub serves to that screen).
 */
export function MeMenuSheet({ visible, onClose, ...rows }: MeMenuSheetProps) {
  // The rows (and the two reads behind their lines) mount only while the sheet is raised, as the sheet's Modal mounts nothing
  // otherwise: the Me tab itself needs no query client until the menu is opened.
  return (
    <BottomSheet visible={visible} onClose={onClose} label="Menu" gap={SHEET_GAP} testID="me-menu">
      <MenuRows visible={visible} {...rows} />
    </BottomSheet>
  );
}

function MenuRows({ visible, onOpenSettings, onOpenCourses, onOpenVerification, onOpenDashboard, onOpenLibrary }: Omit<MeMenuSheetProps, 'onClose'>) {
  // The two lines are the Hub's figures, read when the sheet is raised and shared with the screens they open (the same keys). The
  // month's earnings are `GET /money/earnings`, the read M18 and W39 make, so the three never say different things.
  const owner = useSessionAccount(undefined);
  const earnings = useQuery({ ...earningsQuery(owner), enabled: Boolean(owner) && visible && Boolean(onOpenDashboard) });
  const allowance = useQuery({ queryKey: allowanceKey, queryFn: fetchAllowance, enabled: visible && Boolean(onOpenLibrary) });
  const earned = earnings.data ? `${formatMoney(earnings.data.thisMonth.earnedKobo, { decimals: showsKobo(earnings.data.thisMonth.earnedKobo) })} this month` : undefined;
  const uploads = allowance.data && allowance.data.uploads.allowed > 0 ? `${allowance.data.uploads.used} of ${allowance.data.uploads.allowed} uploads` : undefined;
  return (
    <GroupedList testID="me-menu-list">
      {onOpenDashboard ? <ListRow testID="me-menu-dashboard" lead={<IconTile icon="LayoutDashboard" />} title="Creator dashboard" subtitle={earned} onPress={onOpenDashboard} /> : null}
      {onOpenLibrary ? <ListRow testID="me-menu-content" lead={<IconTile icon="Library" />} title="My content" subtitle={uploads} onPress={onOpenLibrary} /> : null}
      {onOpenCourses ? <ListRow testID="me-menu-courses" lead={<IconTile icon="GraduationCap" />} title="My courses" onPress={onOpenCourses} /> : null}
      {onOpenVerification ? <ListRow testID="me-menu-verification" lead={<IconTile icon="BadgeCheck" />} title="Verification" onPress={onOpenVerification} /> : null}
      <ListRow testID="me-menu-settings" lead={<IconTile icon="Settings" />} title="Settings" onPress={onOpenSettings} />
    </GroupedList>
  );
}
