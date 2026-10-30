import { useIsFocused } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { APP_NAME } from '@/components/BrandMark';
import { Button } from '@/components/Button';
import { Text } from '@/components/Text';
import { font, layout, space } from '@/theme';
import { darkColors } from '@/theme/tokens.generated';

/** design/_gen/auth.js line 8: the words sit 24 in from the sides, 14 apart; the title is bold, tracking -0.04em, line 1.05, 34 px in the design and 24 px since WELCOME-TEXT (the longer words must sit on two lines on a 360 and a 390 wide phone so the video's orbit stays clear, R-98); the line under it 15 px at 80%, line 1.45; */
const WORDS = { side: 24, between: 14, title: 24, tracking: -0.04, leading: 1.05, line: 15, lineLeading: 1.45, lineOpacity: 0.8 } as const;
/**
 * design/_gen/auth.js line 8: the buttons are 10 apart, and the words end 180 above the bottom edge.
 * The buttons are 2 x 54 high (kit.js line 15, `Btn` large) with 10 between and 34 of home bar below (kit.js line 38), so the words
 * stand 180 - 118 - 34 = 28 above the buttons.
 */
const BUTTONS = { between: 10, wordsAbove: 28 } as const;
/**
 * The approved loop (R-98, owner, 27 Oct 2026): `assets/video/welcome-loop.mp4`, 1080 x 1920, 15 s, no sound (the owner's file of 29 Oct 2026,
 * replacing the 8 s one), played as it came (never re-encoded or trimmed). It carries the mark, so the screen draws no logo of its own.
 */
export const WELCOME_VIDEO = require('../../../assets/video/welcome-loop.mp4') as number;
/**
 * Where the loop's mark and its orbit sit, as a share of the video's own height, measured on `assets/video/welcome-loop.mp4`
 * (R-111; 90 frames, 6 a second, every pixel more than 220 away from the base purple in the sum of its three channels: the logo, the
 * stickers on its orbit and the bright rings): from 0.260 (top of the highest sticker) to 0.729 (foot of the lowest). `foot` is the
 * lowest with a little over for a sticker's soft edge. The faint outer glow reaches further down and is not counted.
 */
const ORBIT = { foot: 0.74 } as const;
/** Room kept between the foot of the orbit and the top of the title, when the video has to be lifted. */
const LIFT_GAP = 12;
/** The loop's own size (1080 x 1920): `cover` scales it to the screen by whichever side leaves no gap. */
const LOOP = { width: 1080, height: 1920 } as const;

/**
 * R-111 (owner, 30 Oct 2026): the video is the whole screen, and the words and buttons sit over its lower part with no panel, no
 * shade and no gradient. A phone that is tall and narrow shows the loop at the screen's height, so the foot of the orbit (0.74 of it)
 * can land on the title. When it would, the video's layer is lifted by exactly the room that is missing (never lowered), so the mark
 * and its orbit end `LIFT_GAP` above the title. The lift is a translation, never a crop or a scale: the loop keeps its size, the
 * lifted layer gives up its foot, and the screen behind it is the base purple the loop's own bottom rows already are (at most 4
 * levels apart in each channel on every frame, measured). `contentPosition` would also move it but is iOS only.
 * `wordsTop` is the title's top edge from the top of the screen.
 */
export function welcomeLift({ width, height, wordsTop }: { width: number; height: number; wordsTop: number }): number {
  const shown = Math.max(height, (width * LOOP.height) / LOOP.width);
  const foot = (height - shown) / 2 + ORBIT.foot * shown;
  return Math.max(0, Math.ceil(foot - (wordsTop - LIFT_GAP)));
}

export type WelcomeScreenProps = {
  /** Create an account: opens A2. */
  onCreateAccount: () => void;
  /** Sign in: opens A22. */
  onSignIn: () => void;
};

/**
 * A1: the screen a signed-out user first sees (R-111, owner, 30 Oct 2026, replacing R-98's panel): the approved loop plays over the
 * whole screen, edge to edge and under the status bar, cropped to fill and never stretched, silent, looping, and only while A1 is the
 * screen in front. The headline, the line under it and both buttons sit over its lower part, white, with no panel, no shade and no
 * gradient behind them. The loop's mark and its orbit stay above the headline on every phone (`welcomeLift`). The app draws no logo:
 * the video carries the mark. The screen is the loop's base purple behind everything, so nothing flashes before the first frame, and
 * the words and the status bar are always light, whatever the phone's theme.
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
  /** The screen's size and the title's top edge, from layout; until both are known the video sits at the top, unlifted. */
  const [screen, setScreen] = useState<{ width: number; height: number } | null>(null);
  const [wordsTop, setWordsTop] = useState<number | null>(null);
  const onRootLayout = (e: LayoutChangeEvent) => setScreen({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height });
  const onWordsLayout = (e: LayoutChangeEvent) => setWordsTop(e.nativeEvent.layout.y);
  const lift = screen && wordsTop !== null ? welcomeLift({ ...screen, wordsTop }) : 0;
  return (
    <View testID="welcome" onLayout={onRootLayout} style={[styles.root, { backgroundColor: darkColors.surfaceWelcomeVideoBase }]}>
      {focused ? <StatusBar style="light" /> : null}
      <View
        testID="welcome-video"
        pointerEvents="none"
        accessible
        accessibilityRole="image"
        accessibilityLabel={APP_NAME}
        style={[StyleSheet.absoluteFill, lift > 0 ? { transform: [{ translateY: -lift }] } : null]}
      >
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
      <View testID="welcome-content" style={styles.content}>
        <View testID="welcome-words" onLayout={onWordsLayout} style={styles.words}>
          <View style={styles.wordsText}>
            <Text
              variant="display"
              tone="textOnAccent"
              style={[font(700), { fontSize: WORDS.title, lineHeight: WORDS.title * WORDS.leading, letterSpacing: WORDS.tracking * WORDS.title }]}
            >
              The creators and professionals ecosystem.
            </Text>
            <Text
              variant="body"
              tone="textOnAccent"
              style={{ opacity: WORDS.lineOpacity, lineHeight: WORDS.line * WORDS.lineLeading }}
            >
              Create. Sell. Get paid. Grow.
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
  /** Fills the video's layer. The 100% is for the web build: its `<video>` is a replaced element, which keeps its own size unless it is given one. */
  video: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, width: '100%', height: '100%' },
  /** The words and the buttons, over the lower part of the video: the whole screen's height, the words pushed to its foot. */
  content: { flex: 1, justifyContent: 'flex-end' },
  words: { paddingHorizontal: WORDS.side, paddingBottom: BUTTONS.wordsAbove },
  wordsText: { gap: WORDS.between },
  buttons: { paddingHorizontal: layout.gutter, gap: BUTTONS.between },
});
