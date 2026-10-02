import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/BrandMark';
import { Button } from '@/components/Button';
import { Text } from '@/components/Text';
import { font, layout, space } from '@/theme';
import { darkColors, lightColors } from '@/theme/tokens.generated';

/** design/_gen/auth.js line 8: the words sit 24 in from the sides, 14 apart; the title is 34 px bold, tracking -0.04em, line 1.05; the line under it 15 px at 80%, line 1.45; the logo is 130 wide. */
const WORDS = { side: 24, between: 14, title: 34, tracking: -0.04, leading: 1.05, line: 15, lineLeading: 1.45, lineOpacity: 0.8, logo: 130 } as const;
/**
 * design/_gen/auth.js line 8: the buttons are 10 apart, and the words end 180 above the bottom edge.
 * The buttons are 2 x 54 high with 10 between and 34 of home bar below (kit.js line 38), so the words
 * stand 180 - 118 - 34 = 28 above the buttons.
 */
const BUTTONS = { between: 10, wordsAbove: 28 } as const;
/** design/_gen/auth.js line 8: the shade over the cover, page colour at 20%, 35% at 40% down, solid at 78%. */
const SHADE = { opacities: [0.2, 0.35], locations: [0, 0.4, 0.78] } as const;

/**
 * The dark page colour at a set strength. The light theme's scrim is that colour at 45%
 * (tokens `surfaceScrim`), so its opacity is swapped for the shade's own.
 */
const shadeAt = (opacity: number): string => lightColors.surfaceScrim.replace(/[\d.]+\)$/, `${opacity})`);

export type WelcomeScreenProps = {
  /** Create an account: opens A2. */
  onCreateAccount: () => void;
  /** Sign in: opens A22. */
  onSignIn: () => void;
};

/**
 * A1: the screen a signed-out user first sees. The cover is always dark, so its
 * words, logo and status bar are always light, whatever the phone's theme. The
 * canvas's cover photo is a stand-in picture; the app draws the brand colour
 * under the same shade until the owner supplies a photo (BACKEND_GAPS G-34).
 * "and bank it all in one app" is left out of the line under the title: it
 * implies a bank account for everyone, which nothing backs (G-33).
 */
export function WelcomeScreen({ onCreateAccount, onSignIn }: WelcomeScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <View testID="welcome" style={[styles.root, { backgroundColor: darkColors.accent }]}>
      <StatusBar style="light" />
      <LinearGradient
        pointerEvents="none"
        colors={[...SHADE.opacities.map(shadeAt), darkColors.surfacePage] as [string, string, string]}
        locations={SHADE.locations}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.words}>
        <BrandMark layout="horizontal" width={WORDS.logo} surface="dark" />
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
      <View style={[styles.buttons, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>
        <Button label="Create an account" full onPress={onCreateAccount} testID="welcome-create" />
        <Button label="Sign in" full variant="glass" onPress={onSignIn} testID="welcome-sign-in" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  words: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: WORDS.side, gap: WORDS.between, paddingBottom: BUTTONS.wordsAbove },
  buttons: { paddingHorizontal: layout.gutter, gap: BUTTONS.between },
});
