import { Image } from 'expo-image';

/** Lucide outlines (ISC), the icon set the design draws, one entry per tab. */
const shapes = {
  home: [
    'M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8',
    'M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  ],
  explore: [
    'm16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z',
    'M2 12a10 10 0 1 0 20 0a10 10 0 1 0-20 0',
  ],
  inbox: ['M7.9 20A9 9 0 1 0 4 16.1L2 22Z'],
  wallet: [
    'M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1',
    'M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4',
  ],
  me: [
    'M18 20a6 6 0 0 0-12 0',
    'M8 10a4 4 0 1 0 8 0a4 4 0 1 0-8 0',
    'M2 12a10 10 0 1 0 20 0a10 10 0 1 0-20 0',
  ],
} as const;

export type TabIconName = keyof typeof shapes;

/** Some SVG renderers cannot read alpha colour functions: split a token into a hex colour and an opacity. */
function paint(token: string): { color: string; opacity: number } {
  const m = token.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/);
  if (m) {
    const hex = [m[1], m[2], m[3]].map((n) => Number(n).toString(16).padStart(2, '0')).join('');
    return { color: `#${hex}`, opacity: m[4] === undefined ? 1 : Number(m[4]) };
  }
  return { color: token, opacity: 1 };
}

type Props = {
  name: TabIconName;
  size: number;
  /** Outline colour token value. */
  color: string;
  /** Inner tint token value, drawn when the tab is active. */
  fill?: string;
  stroke: number;
};

export function TabIcon({ name, size, color, fill, stroke }: Props) {
  const line = paint(color);
  const tint = fill ? paint(fill) : null;
  const paths = shapes[name]
    .map(
      (d) =>
        `<path d="${d}" fill="${tint ? tint.color : 'none'}" fill-opacity="${tint ? tint.opacity : 0}" stroke="${line.color}" stroke-opacity="${line.opacity}" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round"/>`,
    )
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">${paths}</svg>`;
  return (
    <Image
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      source={{ uri: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}` }}
      style={{ width: size, height: size }}
    />
  );
}
