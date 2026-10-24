import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { IconButton } from '@/components/Button';
import { useWawu } from '@/theme';

/**
 * The notifications bell with its unread dot (M31's entry), one component for every bar that draws it. ME-14 built it inside
 * Explore's bar; HOME-18 lifts it out so Today's bar draws the same bell, never a copy of it. The dot is data: it shows while
 * the Hub's unread count (`GET /me/counts`, `unreadNotifications`) is above nothing, and it is 8 across, ringed 2 in the card colour,
 * as the canvas draws it. What differs between bars is only the button's size and where the dot sits on it:
 * - `explore`: X1's bar (design/_gen/explore.js `topBar`), a 44 round button, the dot 10 from its top and 11 from its right;
 * - `today`: H1, H11 and H36's bar (design/_gen/_today.js `todayHead`), a 40 round button, the dot 9 from its top and 10 from its right.
 */
export const bellFits = {
  explore: { size: 44, dotTop: 10, dotRight: 11 },
  today: { size: 40, dotTop: 9, dotRight: 10 },
} as const;
export type BellVariant = keyof typeof bellFits;

export const bellDot = { size: 8, ring: 2 } as const;

export type NotificationsBellProps = {
  variant: BellVariant;
  /** The bell was pressed: it opens Notifications (M31, `/notifications`). */
  onPress: () => void;
  /** How many notifications are unread, from the Hub: the dot shows while it is above nothing. */
  unread?: number;
  /** The button's test id. The dot's is the same with `-dot` after it. */
  testID: string;
  /** Where the bar puts the bell (for example `marginLeft: 'auto'`). */
  style?: StyleProp<ViewStyle>;
};

export function NotificationsBell({ variant, onPress, unread = 0, testID, style }: NotificationsBellProps) {
  const { colors } = useWawu();
  const fit = bellFits[variant];
  return (
    <View style={[sheets[variant].box, style]}>
      <IconButton icon="Bell" label={unread > 0 ? 'Notifications, new ones waiting' : 'Notifications'} size={fit.size} onPress={onPress} testID={testID} />
      {unread > 0 ? (
        <View
          testID={`${testID}-dot`}
          pointerEvents="none"
          style={[
            styles.dot,
            sheets[variant].dot,
            { backgroundColor: colors.accent, boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: bellDot.ring, color: colors.surfaceCard }] },
          ]}
        />
      ) : null}
    </View>
  );
}

const sheets = {
  explore: StyleSheet.create({
    box: { width: bellFits.explore.size, height: bellFits.explore.size },
    dot: { top: bellFits.explore.dotTop, right: bellFits.explore.dotRight },
  }),
  today: StyleSheet.create({
    box: { width: bellFits.today.size, height: bellFits.today.size },
    dot: { top: bellFits.today.dotTop, right: bellFits.today.dotRight },
  }),
} as const;

const styles = StyleSheet.create({
  dot: { position: 'absolute', width: bellDot.size, height: bellDot.size, borderRadius: bellDot.size / 2 },
});
