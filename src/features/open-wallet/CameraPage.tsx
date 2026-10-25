import { useIsFocused } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Ellipse, Path } from 'react-native-svg';

import { IconButton } from '@/components/Button';
import { Text } from '@/components/Text';
import { canvasNormalLineHeight, font, layout, space } from '@/theme';
import { darkColors, lightColors } from '@/theme/tokens.generated';

import type { SelfieCapture } from './selfie/types';

const NAV_TITLE = 'Selfie';
export type Ring = 'idle' | 'matched' | 'refused';

/*
 * The dark camera page of Open your wallet's selfie (A6, A7, A16): shared by the camera step and the hosted step (Nuvion's page), so the
 * refused state of both is the one board layout (RELEASE-02 second pass, M-4).
 */
/**
 * design/_gen/auth.js line 44, `selfie`: the camera page is dark in both
 * themes (`#0B0A0D`, the dark page colour), the bar's title white; a 240 by 310
 * oval with a 4 px ring (white; green when matched; red when not, the light
 * theme's positive and danger, as the canvas draws them in both themes) and
 * the page dimmed to 70% outside it; 22 between the oval and the words, the
 * middle lifted 120 off the bottom; the title 18 / 700 white, the line 13.5 at
 * 70% white, 4 under it; the button row 20 in from the sides, 48 above the
 * bottom edge.
 */
const OVAL = { width: 240, height: 310, ring: 4 } as const;
const PAGE = { between: 22, lift: 120, title: 18, line: 13.5, lineOpacity: 0.7, lineGap: 4, footBottom: 48 } as const;
/**
 * kit.js line 15, `Btn` large: 54 high. The button row keeps that height on
 * every state (the spinner on A7 stands in it), so the oval sits where A16
 * draws it and does not jump between states. The 48 under it holds the
 * home indicator, so a taller system inset replaces it.
 */
const FOOT_ROW = 54;
export const CAMERA = {
  page: darkColors.surfacePage,
  frame: darkColors.surfaceCard,
  ink: darkColors.textOnAccent,
  idle: darkColors.textOnAccent,
  matched: lightColors.positive,
  refused: lightColors.danger,
} as const;

/** The dark camera page: the bar with X and "Selfie", the oval, the words under it, the button row. */
export function CameraPage({ onClose, ring, words, foot, Preview, testID }: { onClose: () => void; ring: Ring; words: ReactNode; foot?: ReactNode; Preview?: SelfieCaptureReady['Preview']; testID?: string }) {
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  return (
    <View testID={testID} style={[styles.page, { paddingTop: insets.top }]}>
      {focused ? <StatusBar style="light" /> : null}
      <View style={styles.nav}>
        <IconButton icon="X" label="Close" tone="glass" onPress={onClose} testID="open-wallet-selfie-close" />
        <Text variant="body" tone="textOnAccent" numberOfLines={1} accessibilityRole="header" style={styles.navTitle}>
          {NAV_TITLE}
        </Text>
        <View style={styles.navSide} />
      </View>
      <View style={styles.middle}>
        <Oval ring={ring} Preview={Preview} />
        {words}
      </View>
      <View style={[styles.foot, { marginBottom: Math.max(insets.bottom, PAGE.footBottom) }]}>{foot}</View>
    </View>
  );
}

type SelfieCaptureReady = Extract<SelfieCapture, { kind: 'ready' }>;

/**
 * The page colour over the corners of the camera's rectangle, leaving an
 * ellipse of `rx` by `ry` open in the middle of a `width` by `height` box: the
 * live picture shows only inside the oval (the even-odd rule cuts the ellipse
 * out of the rectangle).
 */
export function ovalMask(width: number, height: number, rx: number, ry: number): string {
  const cx = width / 2;
  const cy = height / 2;
  return `M0 0H${width}V${height}H0Z M${cx - rx} ${cy}A${rx} ${ry} 0 1 0 ${cx + rx} ${cy}A${rx} ${ry} 0 1 0 ${cx - rx} ${cy}Z`;
}

/** The oval the face goes in: the live camera inside it where the platform has one, the ring's colour saying how the match went. */
function Oval({ ring, Preview }: { ring: Ring; Preview?: SelfieCaptureReady['Preview'] }) {
  const color = ring === 'matched' ? CAMERA.matched : ring === 'refused' ? CAMERA.refused : CAMERA.idle;
  const outer = { width: OVAL.width + 2 * OVAL.ring, height: OVAL.height + 2 * OVAL.ring };
  const rx = OVAL.width / 2 + OVAL.ring / 2;
  const ry = OVAL.height / 2 + OVAL.ring / 2;
  return (
    <View testID={`open-wallet-oval-${ring}`} style={outer} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {Preview ? (
        <View style={[styles.preview, { width: OVAL.width, height: OVAL.height }]}>
          <Preview />
        </View>
      ) : null}
      <Svg width={outer.width} height={outer.height} style={StyleSheet.absoluteFill}>
        {Preview ? <Path testID="open-wallet-oval-mask" d={ovalMask(outer.width, outer.height, rx, ry)} fill={CAMERA.page} fillRule="evenodd" /> : null}
        <Ellipse
          cx={outer.width / 2}
          cy={outer.height / 2}
          rx={rx}
          ry={ry}
          fill={Preview ? 'transparent' : CAMERA.frame}
          stroke={color}
          strokeWidth={OVAL.ring}
        />
      </Svg>
    </View>
  );
}

export function Words({ title, line, live }: { title: string; line: string; live?: boolean }) {
  return (
    <View style={styles.words} accessibilityLiveRegion={live ? 'polite' : 'none'}>
      <Text variant="body" tone="textOnAccent" style={styles.wordsTitle} testID="open-wallet-selfie-title">
        {title}
      </Text>
      <Text variant="body" tone="textOnAccent" style={styles.wordsLine} testID="open-wallet-selfie-line">
        {line}
      </Text>
    </View>
  );
}

/** kit.js line 34, `nav`: 56 high, a 42 round button, the title 17 / 700 at -0.02em, 12 between the parts. */
const NAV = { height: 56, button: 42, title: 17, tracking: -0.02 } as const;

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: CAMERA.page },
  nav: { height: NAV.height, flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: layout.gutter },
  navSide: { width: NAV.button },
  navTitle: { ...font(700), flex: 1, textAlign: 'center', fontSize: NAV.title, letterSpacing: NAV.tracking * NAV.title },
  middle: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: PAGE.between, paddingBottom: PAGE.lift },
  preview: { position: 'absolute', left: OVAL.ring, top: OVAL.ring, overflow: 'hidden' },
  words: { alignItems: 'center', paddingHorizontal: layout.gutter },
  wordsTitle: { ...font(700), fontSize: PAGE.title, lineHeight: canvasNormalLineHeight(PAGE.title), textAlign: 'center' },
  wordsLine: { fontSize: PAGE.line, lineHeight: canvasNormalLineHeight(PAGE.line), opacity: PAGE.lineOpacity, marginTop: PAGE.lineGap, textAlign: 'center' },
  foot: { minHeight: FOOT_ROW, justifyContent: 'center', paddingHorizontal: layout.gutter },
});
