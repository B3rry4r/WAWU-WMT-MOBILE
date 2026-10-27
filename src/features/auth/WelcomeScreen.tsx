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
 * The approved loop (R-98, owner, 27 Oct 2026): `assets/video/welcome-loop.mp4`, 1080 x 1920, 8 s, no sound, played as it
 * came (never re-encoded or trimmed). It carries the mark, so the screen draws no logo of its own.
 */
export const WELCOME_VIDEO = require('../../../assets/video/welcome-loop.mp4') as number;
/**
 * The panel under the video (R-98, round 2): the words and the buttons sit in a solid panel in the video's own base purple
 * (`surfaceWelcomeVideoBase`), so the loop's mark and its orbit are never under the words and the screen still reads as one
 * full-screen video. The video's box is the room above the panel from the top of the screen, and `overlap` more behind the panel's
 * top edge (the panel's negative top margin), so no sliver of the page shows between them. `top` is the room above the headline
 * inside the panel. A short fade of `fade` from clear to the panel's colour lies on the video's last rows, ending at the panel's
 * top edge; the loop's own edge is already that purple, so the seam does not show.
 */
const PANEL = { top: 20, overlap: 8, fade: 16 } as const;
/** The fade's stops: [place from its top (0 to 1), strength of the panel's colour]. */
const FADE_STOPS = [
  [0, 0],
  [0.4, 0.35],
  [0.75, 0.8],
  [1, 1],
] as const;
/** The panel's colour at a strength from 0 to 1, built from the token (the word "transparent" blends through black on iOS). */
const baseAt = (strength: number) => `${darkColors.surfaceWelcomeVideoBase}${Math.round(strength * 255).toString(16).padStart(2, '0').toUpperCase()}`;
const FADE_COLORS = FADE_STOPS.map(([, strength]) => baseAt(strength)) as unknown as readonly [string, string, ...string[]];
const FADE_LOCATIONS = FADE_STOPS.map(([place]) => place) as unknown as readonly [number, number, ...number[]];

export type WelcomeScreenProps = {
  /** Create an account: opens A2. */
  onCreateAccount: () => void;
  /** Sign in: opens A22. */
  onSignIn: () => void;
};

/**
 * A1: the screen a signed-out user first sees (R-98, owner, 27 Oct 2026): the approved loop plays above a solid panel in its own
 * base purple that holds the words and the buttons. The video fills the room from the top of the screen (under the status bar) to
 * the panel, cropped to fill and never stretched, silent, looping, and only while A1 is the screen in front, so the mark and its
 * orbit are fully in view above the headline on every phone and the screen reads as one full-screen video. The app draws no logo:
 * the video carries the mark. The screen is that purple behind everything, so nothing flashes before the first frame, and the words
 * and the status bar are always light, whatever the phone's theme.
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
    <View testID="welcome" style={[styles.root, { backgroundColor: darkColors.surfaceWelcomeVideoBase }]}>
      {focused ? <StatusBar style="light" /> : null}
      <View testID="welcome-stage" style={styles.stage}>
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
      </View>
      <View testID="welcome-panel" style={[styles.panel, { backgroundColor: darkColors.surfaceWelcomeVideoBase }]}>
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
  root: { flex: 1 },
  /** The video's box: all the room above the panel, from the top of the screen, and the panel's overlap under its top edge. */
  stage: { flex: 1 },
  /** Fills the box. The 100% is for the web build: its `<video>` is a replaced element, which keeps its own size unless it is given one. */
  video: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, width: '100%', height: '100%' },
  /** Solid, over the video; the negative top margin gives the video's box `overlap` more under its top edge. */
  panel: { marginTop: -PANEL.overlap, paddingTop: PANEL.top, zIndex: 1 },
  /** Lies on the video's last rows, ending at the panel's top edge. */
  fade: { position: 'absolute', top: -PANEL.fade, left: 0, right: 0, height: PANEL.fade },
  words: { paddingHorizontal: WORDS.side, paddingBottom: BUTTONS.wordsAbove },
  wordsText: { gap: WORDS.between },
  buttons: { paddingHorizontal: layout.gutter, gap: BUTTONS.between },
});
