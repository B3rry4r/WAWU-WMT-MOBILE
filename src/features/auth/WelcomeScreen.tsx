import { Image } from 'expo-image';
import { useIsFocused } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { APP_NAME } from '@/components/BrandMark';
import { Button } from '@/components/Button';
import { Text } from '@/components/Text';
import { font, layout, space } from '@/theme';
import { darkColors } from '@/theme/tokens.generated';

/** design/_gen/auth.js line 8: the words sit 24 in from the sides, 14 apart; the title is 34 px bold, tracking -0.04em, line 1.05; the line under it 15 px at 80%, line 1.45; */
const WORDS = { side: 24, between: 14, title: 34, tracking: -0.04, leading: 1.05, line: 15, lineLeading: 1.45, lineOpacity: 0.8 } as const;
/**
 * design/_gen/auth.js line 8: the buttons are 10 apart, and the words end 180 above the bottom edge.
 * The buttons are 2 x 54 high (kit.js line 15, `Btn` large) with 10 between and 34 of home bar below (kit.js line 38), so the words
 * stand 180 - 118 - 34 = 28 above the buttons.
 */
const BUTTONS = { between: 10, wordsAbove: 28 } as const;
/**
 * The mark (R-90): the vertical logo in white with the purple drop, and a purple glow around it, drawn
 * once into three pictures (`scripts/design/make_welcome_mark.py` makes them from
 * `assets/brand/source/vertical-white.svg`, glow colour from the accent token). The glow is part of
 * the picture, so iOS, Android and the web draw the same light; nothing is blurred at run time.
 */
export const WELCOME_MARK = require('../../../assets/images/welcome-mark.png') as number;
/**
 * The pictures' size in points (the 1x file's own pixels): the mark itself is 190 wide and 207 high, with 80 of
 * glow on every side. Only the mark takes room in the layout; the glow is drawn out past its box.
 */
const MARK = { width: 350, height: 367, markWidth: 190, markHeight: 207, pad: 80 } as const;
/** The least room kept between the mark's lower edge and the headline, for a short phone. */
const MARK_ABOVE_WORDS = 16;

export type WelcomeScreenProps = {
  /** Create an account: opens A2. */
  onCreateAccount: () => void;
  /** Sign in: opens A22. */
  onSignIn: () => void;
};

/**
 * A1: the screen a signed-out user first sees (R-90, owner, 26 Oct 2026): the vertical mark in the middle of the
 * dark page with a purple glow, and the words and buttons below. The page is always dark, so the words and
 * the status bar are always light, whatever the phone's theme. No horizontal logo and no photo.
 * The mark is centred in the room between the top safe area and the headline, so the gap above it equals the gap
 * below it; on a phone too short for that, the gap below stays at least 16 and the mark moves up.
 * "and bank it all in one app" is left out of the line under the title: it
 * implies a bank account for everyone, which nothing backs (G-34).
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
        <View testID="welcome-mark" accessible accessibilityRole="image" accessibilityLabel={APP_NAME} style={styles.mark}>
          <Image testID="welcome-mark-art" source={WELCOME_MARK} contentFit="contain" accessible={false} style={styles.markArt} />
        </View>
        <View testID="welcome-below" style={styles.below} />
      </View>
      <View testID="welcome-words" style={styles.words}>
        <View style={styles.wordsText}>
          <Text
            variant="display"
            tone="textOnAccent"
            style={[font(700), { fontSize: WORDS.title, lineHeight: WORDS.title * WORDS.leading, letterSpacing: WORDS.tracking * WORDS.title }]}
          >
            Get paid for what you know
          </Text>
          <Text
            variant="body"
            tone="textOnAccent"
            style={{ opacity: WORDS.lineOpacity, lineHeight: WORDS.line * WORDS.lineLeading }}
          >
            Sell your work and answer paid questions.
          </Text>
        </View>
      </View>
      <View style={[styles.buttons, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>
        <Button label="Create an account" full onPress={onCreateAccount} testID="welcome-create" />
        <Button label="Sign in" full variant="glass" onPress={onSignIn} testID="welcome-sign-in" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  /** Fills the room above the words; the mark and its two equal spacers share it. */
  stage: { flex: 1, alignItems: 'center' },
  above: { flex: 1 },
  below: { flex: 1, minHeight: MARK_ABOVE_WORDS },
  mark: { width: MARK.markWidth, height: MARK.markHeight, flexShrink: 0 },
  markArt: { position: 'absolute', top: -MARK.pad, left: -MARK.pad, width: MARK.width, height: MARK.height },
  words: { paddingHorizontal: WORDS.side, paddingBottom: BUTTONS.wordsAbove },
  wordsText: { gap: WORDS.between },
  buttons: { paddingHorizontal: layout.gutter, gap: BUTTONS.between },
});
