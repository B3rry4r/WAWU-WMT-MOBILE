import { StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { ink, type CardLook } from './look';

/**
 * H29's backdrop (design/_gen/home.js): the ground, a 340 glow with its centre 80 in from the right edge
 * and 100 down, and a 260 white glow at the lower left (50 in, 250 up from the bottom). Each is a
 * circle clear at 70% of its far corner, which is 0.7 of its half-width times the root of two.
 */
const glow = { x: 80, y: 100, r: 0.7 * 170 * Math.SQRT2 };
const dust = { x: 50, up: 250, r: 0.7 * 130 * Math.SQRT2, opacity: 0.08 };

export type CardBackdropProps = { look: CardLook; width: number; height: number };

/** The card's colour, drawn behind everything else and never touched. */
export function CardBackdrop({ look, width, height }: CardBackdropProps) {
  return (
    <Svg testID="tgif-backdrop" pointerEvents="none" style={StyleSheet.absoluteFill} width={width} height={height}>
      <Defs>
        {look.glows.map((g, i) => (
          <RadialGradient key={i} id={`tgifGlow${i}`} gradientUnits="userSpaceOnUse" cx={width - glow.x} cy={glow.y} r={glow.r}>
            <Stop offset="0" stopColor={g.color} stopOpacity={g.opacity} />
            <Stop offset="1" stopColor={g.color} stopOpacity={0} />
          </RadialGradient>
        ))}
        <RadialGradient id="tgifDust" gradientUnits="userSpaceOnUse" cx={dust.x} cy={height - dust.up} r={dust.r}>
          <Stop offset="0" stopColor={ink} stopOpacity={dust.opacity} />
          <Stop offset="1" stopColor={ink} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width={width} height={height} fill={look.ground} />
      {look.wash ? <Rect width={width} height={height} fill={look.wash.color} fillOpacity={look.wash.opacity} /> : null}
      {look.glows.map((_, i) => (
        <Rect key={i} width={width} height={height} fill={`url(#tgifGlow${i})`} />
      ))}
      <Rect width={width} height={height} fill="url(#tgifDust)" />
    </Svg>
  );
}
