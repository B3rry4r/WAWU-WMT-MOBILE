import { Image } from 'expo-image';
import { useIsFocused } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
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
 * The picture's size in points: the mark is 190 wide and 207 high with 80 of glow on every side (the 1x file's
 * own pixels). `maxWidth` keeps it inside a phone narrower than the picture.
 */
const MARK = { width: 350, height: 367, mark: 207, pad: 80 } as const;
/** The least room kept between the mark's lower edge and the headline, for a short phone. */
const MARK_ABOVE_WORDS = 16;

export type WelcomeScreenProps = {
  /** Create an account: opens A2. */
  onCreateAccount: () => void;
  /** Sign in: opens A22. */
  onSignIn: () => void;
};

/**
 * A1: the screen a signed-out user first sees (R-90, owner, 26 Oct 2026): the vertical mark centred on the
 * dark page with a purple glow, and the words and buttons below. The page is always dark, so the words and
 * the status bar are always light, whatever the phone's theme. No horizontal logo and no photo.
 * "and bank it all in one app" is left out of the line under the title: it
 * implies a bank account for everyone, which nothing backs (G-34).
 */
export function WelcomeScreen({ onCreateAccount, onSignIn }: WelcomeScreenProps) {
  const insets = useSafeAreaInsets();
  /** The welcome screen stays mounted under the screens pushed on it; its light bar must not outlive its turn on screen. */
  const focused = useIsFocused();
  const [height, setHeight] = useState(0);
  const [wordsTop, setWordsTop] = useState(0);
  /**
   * The mark sits at the middle of the screen. On a phone too short for that (its lower edge would touch the
   * headline) it moves up, never past the status bar.
   */
  const middleTop = height / 2 - MARK.mark / 2;
  const lift = height > 0 && wordsTop > 0 ? Math.max(Math.min(0, wordsTop - MARK_ABOVE_WORDS - (middleTop + MARK.mark)), insets.top - middleTop) : 0;
  return (
    <View testID="welcome" style={[styles.root, { backgroundColor: darkColors.surfacePage }]} onLayout={(e: LayoutChangeEvent) => setHeight(e.nativeEvent.layout.height)}>
      {focused ? <StatusBar style="light" /> : null}
      <View pointerEvents="none" style={styles.stage}>
        <View
          testID="welcome-mark"
          accessible
          accessibilityRole="image"
          accessibilityLabel={APP_NAME}
          style={[styles.mark, { transform: [{ translateY: lift }] }]}
        >
          <Image testID="welcome-mark-art" source={WELCOME_MARK} contentFit="contain" accessible={false} style={styles.markArt} />
        </View>
      </View>
      <View style={styles.words}>
        <View testID="welcome-words" style={styles.wordsText} onLayout={(e: LayoutChangeEvent) => setWordsTop(e.nativeEvent.layout.y)}>
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
  stage: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
  mark: { width: MARK.width, maxWidth: '100%', aspectRatio: MARK.width / MARK.height },
  markArt: { width: '100%', height: '100%' },
  words: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: WORDS.side, paddingBottom: BUTTONS.wordsAbove },
  wordsText: { gap: WORDS.between },
  buttons: { paddingHorizontal: layout.gutter, gap: BUTTONS.between },
});
