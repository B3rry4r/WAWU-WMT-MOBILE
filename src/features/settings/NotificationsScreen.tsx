import { ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';

import { fetchNotifications, patchNotifications, settingsKeys, type NotificationSettings } from './api/hub';
import { loadProblem } from './failure';
import { NOTIFICATION_GROUPS, notificationOn, type NotificationKey } from './groups';
import { ScreenFrame } from '@/components/ScreenFrame';
import { SwitchGroups } from './SwitchGroups';
import { SwitchesLoading } from './SwitchesLoading';
import { useSwitches } from './useSwitches';

/** design/_gen/settings.js line 14 (Z3): groups 16 apart. */
const BODY_GAP = 16;

/** How many switches each Z3 card holds (Money, Messages, Content). */
const CARD_SIZES = NOTIFICATION_GROUPS.map((group) => group.switches.length);

export type NotificationsScreenProps = { onBack: () => void };

/**
 * Z3 · Notifications. Every switch is one key of `GET` and `PATCH /settings/notifications`, saved the
 * moment it is tapped. A key the Hub has never held is on (nothing was ever switched off).
 */
export function NotificationsScreen({ onBack }: NotificationsScreenProps) {
  const switches = useSwitches<NotificationKey, NotificationSettings>({
    queryKey: settingsKeys.notifications,
    read: fetchNotifications,
    write: patchNotifications,
    valueOf: notificationOn,
  });
  const { query } = switches;
  const problem = loadProblem(query.error);

  return (
    <ScreenFrame idPrefix="settings" title="Notifications" onBack={onBack} gap={BODY_GAP} testID="notifications-screen">
      {query.data ? (
        <>
          <SwitchGroups
            groups={NOTIFICATION_GROUPS}
            valueOf={switches.isOn}
            busy={switches.busy}
            onChange={(key, next) => void switches.set(key, next)}
            testIDPrefix="notify"
          />
          {switches.failure ? (
            <Text variant="errorLine" accessibilityRole="alert" accessibilityLiveRegion="polite" testID="notify-problem">
              {switches.failure}
            </Text>
          ) : null}
        </>
      ) : query.isError ? (
        <ErrorState
          testID="notify-error"
          icon={problem.icon}
          title={problem.title}
          message={problem.message}
          onRetry={() => void query.refetch()}
        />
      ) : (
        <SwitchesLoading cards={CARD_SIZES} testID="notify-loading" />
      )}
    </ScreenFrame>
  );
}
