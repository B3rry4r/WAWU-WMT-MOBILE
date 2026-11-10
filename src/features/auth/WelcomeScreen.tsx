import { useIsFocused } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/BrandMark';
import { Button } from '@/components/Button';
import { Text } from '@/components/Text';
import { layout, space } from '@/theme';
import { darkColors } from '@/theme/tokens.generated';

/**
 * R-119: the one line under the mark, 15 at line 1.45 (the body size), centred, in white. design/_gen/auth.js line 8 put the words 24 in
 * from the sides; they still sit 24 in so the line wraps the way it always did on a narrow phone.
 */
const WORDS = { side: 24, line: 15, lineLeading: 1.45 } as const;
/**
 * design/_gen/auth.js line 8: the buttons are 10 apart, and the words end 180 above the bottom edge.
 * The buttons are 2 x 54 high (kit.js line 15, `Btn` large) with 10 between and 34 of home bar below (kit.js line 38), so the words
 * stand 180 - 118 - 34 = 28 above the buttons.
 */
const BUTTONS = { between: 10, wordsAbove: 28 } as const;
/**
 * The mark's drawn width in points: the owner's reference picture (31 Oct 2026) shows it a little under a third of the screen's width
 * (359 of 1125 pixels). The height follows the artwork (`BrandMark`, the sticker cut for a dark page).
 */
const MARK_WIDTH = 120;
/** The least room kept between the mark's lower edge and the words, so a short phone moves the mark up and never onto them. */
const MARK_ABOVE_WORDS = 16;
/** The words' text, the one line the owner's reference shows (R-119). */
export const WELCOME_LINE = 'Create. Sell. Get paid. Connect. Grow.';

export type WelcomeScreenProps = {
  /** Create an account: opens A2. */
  onCreateAccount: () => void;
  /** Sign in: opens A22. */
  onSignIn: () => void;
};

/**
 * A1: the screen a signed-out user first sees (R-119, owner, 31 Oct 2026, replacing R-98's and R-111's video): the app's own mark
 * (`BrandMark`, the sticker cut) on the darkest page, one line under it, and both buttons at the foot. No video and no headline.
 * The mark is centred across, and centred down in the room between the top safe area and the words (the same two spacers as
 * ONBOARD-LOGO, R-90: an equal gap above and below, and on a phone too short for that the gap below stays at least 16 and the mark
 * moves up), so it sits higher than the middle of the screen, where the words and buttons made it look low. The page is always dark,
 * so the words and the status bar are always light, whatever the phone's theme.
 * "and bank it all in one app" is left out of the line: it implies a bank account for everyone, which nothing backs (G-34).
 */
export function WelcomeScreen({ onCreateAccount, onSignIn }: WelcomeScreenProps) {
  const insets = useSafeAreaInsets();
  /** The welcome screen stays mounted under the screens pushed on it; its light bar must not outlive its turn on screen. */
  const focused = useIsFocused();
  return (
    <View testID="welcome" style={[styles.root, { backgroundColor: darkColors.surfacePage }]}>
      {focused ? <StatusBar style="light" /> : null}
      <View testID="welcome-stage" pointerEvents="none" style={[styles.stage, { paddingTop: insets.top }]}>
        <View testID="welcome-above" style={styles.above} />
        <BrandMark layout="submark" surface="dark" width={MARK_WIDTH} testID="welcome-mark" style={styles.mark} />
        <View testID="welcome-below" style={styles.below} />
      </View>
      <View testID="welcome-content">
        <View testID="welcome-words" style={styles.words}>
          <Text variant="body" tone="textOnAccent" style={styles.line}>
            {WELCOME_LINE}
          </Text>
        </View>
        <View testID="welcome-buttons" style={[styles.buttons, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>
          <Button label="Create an account" full onPress={onCreateAccount} testID="welcome-create" />
          <Button label="Sign in" full variant="glass" onPress={onSignIn} testID="welcome-sign-in" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  /** The room above the words: the layout gives it everything the words and buttons leave. The mark and its two spacers share it. */
  stage: { flex: 1, alignItems: 'center' },
  above: { flex: 1 },
  below: { flex: 1, minHeight: MARK_ABOVE_WORDS },
  mark: { flexShrink: 0 },
  words: { paddingHorizontal: WORDS.side, paddingBottom: BUTTONS.wordsAbove },
  line: { textAlign: 'center', lineHeight: WORDS.line * WORDS.lineLeading },
  buttons: { paddingHorizontal: layout.gutter, gap: BUTTONS.between },
});
