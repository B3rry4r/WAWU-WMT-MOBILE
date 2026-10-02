import { View } from 'react-native';

/*
 * The two keypad glyphs on W11, drawn with Views because the app has no icon
 * set (no SVG renderer is installed). Proportions follow the canvas's lucide
 * paths on a 24 unit grid ("scan-face" and "delete"), scaled to `size`.
 * Stroke 1.8 on that grid, as drawn.
 */

const GRID = 24;
const STROKE = 1.8;

type GlyphProps = { size: number; color: string };

/** lucide "scan-face": four corner brackets, two eyes, a smile. */
export function FaceScanGlyph({ size, color }: GlyphProps) {
  const u = size / GRID;
  const stroke = STROKE * u;
  // Paths are stroked on their centre line; a View's border sits inside its
  // box, so each box grows by half a stroke on every side to land on the path.
  const half = stroke / 2;
  const arm = 4 * u + stroke; // M3 7V5a2 2 0 0 1 2-2h2: 4 units, plus the caps
  const corner = 2 * u + half;
  const inset = 3 * u - half;
  const bracket = { position: 'absolute' as const, width: arm, height: arm, borderColor: color };
  const eye = {
    position: 'absolute' as const,
    width: stroke,
    height: stroke,
    borderRadius: half,
    backgroundColor: color,
    top: 9 * u - half,
  };
  return (
    <View style={{ width: size, height: size }} accessible={false}>
      <View style={[bracket, { left: inset, top: inset, borderLeftWidth: stroke, borderTopWidth: stroke, borderTopLeftRadius: corner }]} />
      <View style={[bracket, { right: inset, top: inset, borderRightWidth: stroke, borderTopWidth: stroke, borderTopRightRadius: corner }]} />
      <View style={[bracket, { left: inset, bottom: inset, borderLeftWidth: stroke, borderBottomWidth: stroke, borderBottomLeftRadius: corner }]} />
      <View style={[bracket, { right: inset, bottom: inset, borderRightWidth: stroke, borderBottomWidth: stroke, borderBottomRightRadius: corner }]} />
      <View style={[eye, { left: 9 * u - half }]} />
      <View style={[eye, { left: 15 * u - half }]} />
      <View
        style={{
          position: 'absolute',
          left: 8 * u - half,
          top: 13 * u - half,
          width: 8 * u + stroke,
          height: 3 * u + stroke,
          borderColor: color,
          borderLeftWidth: stroke,
          borderRightWidth: stroke,
          borderBottomWidth: stroke,
          borderBottomLeftRadius: 3 * u + stroke,
          borderBottomRightRadius: 3 * u + stroke,
          borderTopWidth: 0,
        }}
      />
    </View>
  );
}

/** lucide "delete": a key outline pointing left, with an x inside. */
export function DeleteGlyph({ size, color }: GlyphProps) {
  const u = size / GRID;
  const stroke = STROKE * u;
  const half = stroke / 2;
  // Grown by half a stroke each side to sit on the path, as in FaceScanGlyph.
  const top = 5 * u - half;
  const height = 14 * u + stroke;
  // The point is a square turned 45 degrees with two sides drawn. Its
  // diagonal is the body height, so its tip sits half the height left of
  // where it meets the body.
  const shoulderX = 9 * u;
  const side = (height / 2) * Math.SQRT2;
  const cross = 8.5 * u;
  const bar = {
    position: 'absolute' as const,
    left: 15 * u - cross / 2,
    top: 12 * u - half,
    width: cross,
    height: stroke,
    borderRadius: half,
    backgroundColor: color,
  };
  return (
    <View style={{ width: size, height: size }} accessible={false}>
      <View
        style={{
          position: 'absolute',
          left: shoulderX,
          right: 2 * u - half,
          top,
          height,
          borderColor: color,
          borderTopWidth: stroke,
          borderRightWidth: stroke,
          borderBottomWidth: stroke,
          borderTopRightRadius: 2 * u,
          borderBottomRightRadius: 2 * u,
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: side,
          height: side,
          left: shoulderX - side / 2,
          top: top + height / 2 - side / 2,
          borderColor: color,
          borderLeftWidth: stroke,
          borderBottomWidth: stroke,
          transform: [{ rotate: '45deg' }],
        }}
      />
      <View style={[bar, { transform: [{ rotate: '45deg' }] }]} />
      <View style={[bar, { transform: [{ rotate: '-45deg' }] }]} />
    </View>
  );
}
