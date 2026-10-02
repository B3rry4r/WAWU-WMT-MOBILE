import { Image } from 'expo-image';

/** Lucide outlines (ISC), the icon set the design draws. Every shape is path data, so one renderer draws them all. */
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
  /** Lucide ChevronLeft, the back icon W9 and A3 draw. */
  back: ['m15 18-6-6 6-6'],
  forward: ['m9 18 6-6-6-6'],
  send: ['M7 7h10v10', 'M7 17 17 7'],
  plus: ['M5 12h14', 'M12 5v14'],
  check: ['M20 6 9 17l-5-5'],
  close: ['M18 6 6 18', 'm6 6 12 12'],
  search: ['M3 11a8 8 0 1 0 16 0a8 8 0 1 0-16 0', 'm21 21-4.3-4.3'],
  eye: [
    'M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0',
    'M9 12a3 3 0 1 0 6 0a3 3 0 1 0-6 0',
  ],
  eyeOff: [
    'M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49',
    'M14.084 14.158a3 3 0 0 1-4.242-4.242',
    'M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143',
    'm2 2 20 20',
  ],
  lock: ['M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z', 'M7 11V7a5 5 0 0 1 10 0v4'],
  copy: [
    'M10 8h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z',
    'M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2',
  ],
  edit: [
    'M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z',
    'm15 5 4 4',
  ],
  backspace: [
    'M10 5a2 2 0 0 0-1.344.519l-6.328 5.74a1 1 0 0 0 0 1.481l6.328 5.741A2 2 0 0 0 10 19h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z',
    'm12 9 6 6',
    'm18 9-6 6',
  ],
  alert: ['M2 12a10 10 0 1 0 20 0a10 10 0 1 0-20 0', 'M12 8v4', 'M12 16h.01'],
} as const;

export type IconName = keyof typeof shapes;

/** Some SVG renderers cannot read alpha colour functions: split a token into a hex colour and an opacity. */
function paint(token: string): { color: string; opacity: number } {
  const m = token.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/);
  if (m) {
    const hex = [m[1], m[2], m[3]].map((n) => Number(n).toString(16).padStart(2, '0')).join('');
    return { color: `#${hex}`, opacity: m[4] === undefined ? 1 : Number(m[4]) };
  }
  return { color: token, opacity: 1 };
}

const defaultStroke = 1.8;

type Props = {
  name: IconName;
  size: number;
  /** Outline colour token value. */
  color: string;
  /** Inner tint token value, drawn when the tab is active. */
  fill?: string;
  /** Stroke width in the 24 unit drawing. */
  stroke?: number;
};

export function Icon({ name, size, color, fill, stroke = defaultStroke }: Props) {
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
