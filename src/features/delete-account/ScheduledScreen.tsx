import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Text } from '@/components/Text';
import { AuthFrame } from '@/features/auth/AuthFrame';
import { sentenceOf } from '@/features/settings/failure';
import { signOutOfThisPhone } from '@/features/settings/signOutFlow';
import { STORE_REFUSED } from '@/features/settings/SettingsScreen';
import { canvasNormalLineHeight, space } from '@/theme';

import { scheduledLine } from './model';

/**
 * design/_gen/kit.js line 67 (`result`) in design/_gen/settings.js line 17 (Z8): the parts 10 apart in a body that starts 160 down, the
 * title at 30 / 700 with 8 more above it, tracking -0.035em, the line at 14.5. The board's 88 tile uses a tone the design has no colour for
 * (`neutral`), so it draws no circle and no mark; the room it takes is kept, so the title sits where the board puts it.
 */
const LOOK = { top: 160, between: 10, tile: 88, titleExtra: 8, title: 30, tracking: -0.035, line: 14.5 } as const;

export type ScheduledScreenProps = {
  /** The Hub's date (`deletionScheduledAt`), as it sent it. */
  at: string;
  /** The phone has signed out: leaves for the welcome screen. */
  onSignedOut: () => void;
  now?: Date;
};

/**
 * Z8 · Scheduled. The Hub's date, and Done signs this phone out (the account is being deleted, and signing in again before the date cancels it,
 * which WAWU ID does, SETTINGS-08). One sign-out at a time; if the phone cannot clear its saved sign-in the screen says so and Done tries again.
 */
export function ScheduledScreen({ at, onSignedOut, now = new Date() }: ScheduledScreenProps) {
  const [leaving, setLeaving] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const signingOut = useRef(false);

  const done = async () => {
    if (signingOut.current) return;
    signingOut.current = true;
    setLeaving(true);
    setProblem(null);
    try {
      const { storeCleared } = await signOutOfThisPhone();
      if (storeCleared) onSignedOut();
      else setProblem(STORE_REFUSED);
    } catch (error) {
      setProblem(sentenceOf(error, 'You could not be signed out. Try again.'));
    } finally {
      signingOut.current = false;
      setLeaving(false);
    }
  };

  return (
    <AuthFrame
      bare
      testID="scheduled-screen"
      contentTop={LOOK.top}
      footer={
        <View style={styles.foot}>
          {problem ? (
            <Text variant="errorLine" tone="danger" accessibilityRole="alert" accessibilityLiveRegion="polite" testID="scheduled-problem" style={styles.centre}>
              {problem}
            </Text>
          ) : null}
          <Button testID="scheduled-done" label="Done" full loading={leaving} onPress={() => void done()} />
        </View>
      }
    >
      <View style={styles.head}>
        <View style={styles.tile} />
        <Text
          variant="h1"
          accessibilityRole="header"
          testID="scheduled-title"
          style={[styles.centre, { fontSize: LOOK.title, lineHeight: canvasNormalLineHeight(LOOK.title), letterSpacing: LOOK.tracking * LOOK.title, marginTop: LOOK.titleExtra }]}
        >
          Scheduled for deletion
        </Text>
        <Text variant="secondary" tone="textSecondary" testID="scheduled-line" style={[styles.centre, { fontSize: LOOK.line }]}>
          {scheduledLine(at, now)}
        </Text>
      </View>
    </AuthFrame>
  );
}

const styles = StyleSheet.create({
  head: { alignItems: 'center', gap: LOOK.between },
  tile: { width: LOOK.tile, height: LOOK.tile },
  centre: { textAlign: 'center' },
  foot: { gap: space.sm },
});
