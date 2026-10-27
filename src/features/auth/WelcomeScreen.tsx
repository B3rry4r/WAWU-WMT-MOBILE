import { LinearGradient } from 'expo-linear-gradient';
import { useIsFocused } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect } from 'react';
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
 * The approved loop (R-98, owner, 27 Oct 2026): `assets/video/welcome-loop.mp4`, 1080 x 1920, 15 s, no sound, played as it
 * came (never re-encoded or trimmed). It carries the mark, so the screen draws no logo of its own.
 */
export const WELCOME_VIDEO = require('../../../assets/video/welcome-loop.mp4') as number;
/**
 * The fade laid over the video behind the words and buttons (R-98): clear at its top, the dark page colour at its foot, so that
 * area is darker and the words read on every frame of the loop. It starts `rise` above the headline (the words and the buttons
 * under them take their own room) and each stop is [place from its top (0 to 1), strength of the page colour]. Measured on the
 * loop's frames at 390 x 844 and 360 x 640, the brightest 1 in 100 pixels behind the headline and the line under it keep white
 * text at a contrast of 7.9 or more (with no fade: 1.0).
 */
const FADE = {
  rise: 180,
  stops: [
    [0, 0],
    [0.2, 0.3],
    [0.4, 0.75],
    [0.55, 0.9],
    [0.75, 0.97],
    [1, 1],
  ],
} as const;
/** The page colour at a strength from 0 to 1, built from the token (the word "transparent" blends through black on iOS). */
const pageAt = (strength: number) => `${darkColors.surfacePage}${Math.round(strength * 255).toString(16).padStart(2, '0').toUpperCase()}`;
const FADE_COLORS = FADE.stops.map(([, strength]) => pageAt(strength)) as unknown as readonly [string, string, ...string[]];
const FADE_LOCATIONS = FADE.stops.map(([place]) => place) as unknown as readonly [number, number, ...number[]];

export type WelcomeScreenProps = {
  /** Create an account: opens A2. */
  onCreateAccount: () => void;
  /** Sign in: opens A22. */
  onSignIn: () => void;
};

/**
 * A1: the screen a signed-out user first sees (R-98, owner, 27 Oct 2026): the approved loop plays full screen behind everything
 * (edge to edge, under the status bar, cropped to fill and never stretched, silent, looping, and only while A1 is the screen in
 * front), and the words and buttons sit at the bottom over a fade from clear to the dark page colour. The app draws no logo: the
 * video carries the mark. The page under the video is always the dark page colour, so nothing flashes before the first frame,
 * and the words and the status bar are always light, whatever the phone's theme.
 * "and bank it all in one app" is left out of the line under the title: it
 * implies a bank account for everyone, which nothing backs (G-34).
 */
export function WelcomeScreen({ onCreateAccount, onSignIn }: WelcomeScreenProps) {
  const insets = useSafeAreaInsets();
  /** The welcome screen stays mounted under the screens pushed on it; its light bar and its video must not outlive its turn on screen. */
  const focused = useIsFocused();
  const player = useVideoPlayer(WELCOME_VIDEO, (p) => {
    p.loop = true;
    p.muted = true;
    p.staysActiveInBackground = false;
    p.showNowPlayingNotification = false;
  });
  useEffect(() => {
    if (focused) player.play();
    else player.pause();
  }, [player, focused]);
  return (
    <View testID="welcome" style={[styles.root, { backgroundColor: darkColors.surfacePage }]}>
      {focused ? <StatusBar style="light" /> : null}
      <View testID="welcome-video" pointerEvents="none" accessible accessibilityRole="image" accessibilityLabel={APP_NAME} style={StyleSheet.absoluteFill}>
        <VideoView
          testID="welcome-video-view"
          player={player}
          contentFit="cover"
          nativeControls={false}
          allowsPictureInPicture={false}
          playsInline
          // A texture view, as the feed's: it moves with the screen when another is pushed on this one.
          surfaceType="textureView"
          pointerEvents="none"
          style={styles.video}
        />
      </View>
      <View testID="welcome-bottom" style={styles.bottom}>
        <LinearGradient
          testID="welcome-fade"
          pointerEvents="none"
          colors={FADE_COLORS}
          locations={FADE_LOCATIONS}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.fade}
        />
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
    </View>
  );
}

const styles = StyleSheet.create({
  /** The words and buttons sit at the foot of the screen, as they always have; the video fills the rest behind them. */
  root: { flex: 1, justifyContent: 'flex-end' },
  /** Edge to edge. The 100% is for the web build: its `<video>` is a replaced element, which keeps its own size unless it is given one. */
  video: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, width: '100%', height: '100%' },
  bottom: { position: 'relative' },
  /** From `rise` above the headline to the screen's foot, behind the words and the buttons. */
  fade: { position: 'absolute', top: -FADE.rise, left: 0, right: 0, bottom: 0 },
  words: { paddingHorizontal: WORDS.side, paddingBottom: BUTTONS.wordsAbove },
  wordsText: { gap: WORDS.between },
  buttons: { paddingHorizontal: layout.gutter, gap: BUTTONS.between },
});
