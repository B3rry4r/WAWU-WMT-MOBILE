import { StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

/**
 * A soft round glow as the canvas draws it: a CSS `radial-gradient(circle, colour, transparent 70%)`
 * filling a square of `size`, so the colour fades out at 70% of the distance to the square's far
 * corner (half the size times the root of two). `x` and `y` are the square's centre on the card.
 */
export type GlowSpot = { x: number; y: number; size: number; color: string; strength: number };

const fadeAt = 0.7;

export function glowRadius(size: number): number {
  return fadeAt * (size / 2) * Math.SQRT2;
}

/** Glows laid over a card, behind its words. `id` keeps two cards' gradients apart on one page. */
export function CardGlows({ id, width, height, spots }: { id: string; width: number; height: number; spots: readonly GlowSpot[] }) {
  if (width <= 0 || height <= 0) return null;
  return (
    <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width={width} height={height}>
      <Defs>
        {spots.map((s, i) => (
          <RadialGradient key={i} id={`${id}${i}`} gradientUnits="userSpaceOnUse" cx={s.x} cy={s.y} r={glowRadius(s.size)}>
            <Stop offset="0" stopColor={s.color} stopOpacity={s.strength} />
            <Stop offset="1" stopColor={s.color} stopOpacity={0} />
          </RadialGradient>
        ))}
      </Defs>
      {spots.map((_, i) => (
        <Rect key={i} width={width} height={height} fill={`url(#${id}${i})`} />
      ))}
    </Svg>
  );
}
