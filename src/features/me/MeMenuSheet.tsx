import { useQuery } from '@tanstack/react-query';

import { BottomSheet } from '@/components/BottomSheet';
import { GroupedList } from '@/components/Card';
import { IconTile } from '@/components/IconTile';
import { ListRow } from '@/components/ListRow';
import { formatMoney } from '@/components/Money';
import { allowanceKey, fetchAllowance } from '@/features/create/api';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { countsKey, fetchCounts } from '@/features/me/counts';
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
  /** My purchases (ME-14, M29): drawn only when given. Its line is the Hub's count of what the person bought. */
  onOpenPurchases?: () => void;
  /** Saved (ME-14, M30): drawn only when given. Its line is the Hub's count of what the person saved. */
  onOpenSaved?: () => void;
  /** Notifications (ME-14, M31): drawn only when given. Its line is how many are new, from the Hub. */
  onOpenNotifications?: () => void;
};

/**
 * Z1 · the Me menu: the sheet M1's Menu button raises over the profile. It holds only the rows whose screen is built
 * (R-47): Creator dashboard and My content (ME-07, a creator's: M18 and M28), My purchases (ME-14, M29), My courses (SCHOOLS-08, SC8),
 * Saved (ME-14, M30) and Notifications (ME-14, M31), then Verification (ME-13, `/verification`) and Settings, which opens Z2
 * (`/settings`), with no line under Verification (the canvas's "Creator tick, ID check in review" is the replaced tick, R-43). The
 * task that builds each screen adds its row here, as drawn, with the line the canvas puts under its title (a figure the Hub serves
 * to that screen).
 */
export function MeMenuSheet({ visible, onClose, ...rows }: MeMenuSheetProps) {
  // The rows (and the reads behind their lines) mount only while the sheet is raised, as the sheet's Modal mounts nothing
  // otherwise: the Me tab itself needs no query client until the menu is opened.
  return (
    <BottomSheet visible={visible} onClose={onClose} label="Menu" gap={SHEET_GAP} testID="me-menu">
      <MenuRows visible={visible} {...rows} />
    </BottomSheet>
  );
}

function MenuRows({ visible, onOpenSettings, onOpenCourses, onOpenVerification, onOpenDashboard, onOpenLibrary, onOpenPurchases, onOpenSaved, onOpenNotifications }: Omit<MeMenuSheetProps, 'onClose'>) {
  // The two lines are the Hub's figures, read when the sheet is raised and shared with the screens they open (the same keys). The
  // month's earnings are `GET /money/earnings`, the read M18 and W39 make, so the three never say different things.
  const owner = useSessionAccount(undefined);
  const earnings = useQuery({ ...earningsQuery(owner), enabled: Boolean(owner) && visible && Boolean(onOpenDashboard) });
  const allowance = useQuery({ queryKey: allowanceKey, queryFn: fetchAllowance, enabled: visible && Boolean(onOpenLibrary) });
  // The three counts are one read of the Hub (`GET /me/counts`), the figures the bell on Explore shares. A row without its figure is drawn
  // with its title alone; a count of nothing says nothing.
  const counts = useQuery({ queryKey: countsKey, queryFn: fetchCounts, enabled: visible && Boolean(onOpenPurchases || onOpenSaved || onOpenNotifications), staleTime: 0 });
  const earned = earnings.data ? `${formatMoney(earnings.data.thisMonth.earnedKobo, { decimals: showsKobo(earnings.data.thisMonth.earnedKobo) })} this month` : undefined;
  const uploads = allowance.data && allowance.data.uploads.allowed > 0 ? `${allowance.data.uploads.used} of ${allowance.data.uploads.allowed} uploads` : undefined;
  const bought = counts.data && counts.data.purchases > 0 ? String(counts.data.purchases) : undefined;
  const saved = counts.data && counts.data.saved > 0 ? String(counts.data.saved) : undefined;
  const fresh = counts.data && counts.data.unreadNotifications > 0 ? `${counts.data.unreadNotifications} new` : undefined;
  return (
    <GroupedList testID="me-menu-list">
      {onOpenDashboard ? <ListRow testID="me-menu-dashboard" lead={<IconTile icon="LayoutDashboard" />} title="Creator dashboard" subtitle={earned} onPress={onOpenDashboard} /> : null}
      {onOpenLibrary ? <ListRow testID="me-menu-content" lead={<IconTile icon="Library" />} title="My content" subtitle={uploads} onPress={onOpenLibrary} /> : null}
      {onOpenPurchases ? <ListRow testID="me-menu-purchases" lead={<IconTile icon="ShoppingBag" />} title="My purchases" subtitle={bought} onPress={onOpenPurchases} /> : null}
      {onOpenCourses ? <ListRow testID="me-menu-courses" lead={<IconTile icon="GraduationCap" />} title="My courses" onPress={onOpenCourses} /> : null}
      {onOpenSaved ? <ListRow testID="me-menu-saved" lead={<IconTile icon="Bookmark" />} title="Saved" subtitle={saved} onPress={onOpenSaved} /> : null}
      {onOpenNotifications ? <ListRow testID="me-menu-notifications" lead={<IconTile icon="Bell" />} title="Notifications" subtitle={fresh} onPress={onOpenNotifications} /> : null}
      {onOpenVerification ? <ListRow testID="me-menu-verification" lead={<IconTile icon="BadgeCheck" />} title="Verification" onPress={onOpenVerification} /> : null}
      <ListRow testID="me-menu-settings" lead={<IconTile icon="Settings" />} title="Settings" onPress={onOpenSettings} />
    </GroupedList>
  );
}
