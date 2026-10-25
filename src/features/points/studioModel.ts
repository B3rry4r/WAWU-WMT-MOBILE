import type { IconName } from '@/components/icon';
import { formatPointsCount } from '@/components/PointsFigure';

import type { AiTool, JobCap, JobQuote } from './studioApi';

/** The copy of PT1, PT1a, PT3 and PT7 that is the design's own words (R-68: no outside name anywhere). Every figure in a line is the Hub's. */
export const STUDIO_WORDS = {
  title: 'Studio',
  /** The PT1 line the Hub's tools sit under (R-68: "AI voice tools", never the provider's name). */
  line: 'Every AI voice tool, paid in points',
  /** Under "Studio" on the Create hub when the Hub lists no tool to name. */
  sub: 'AI voice tools',
  history: 'Your points',
  buyPoints: 'Buy points',
  noPointsTitle: 'You have no points yet',
  noPointsBody: 'Buy a pack, or get them with a tier.',
  unavailable: 'Not available right now',
  noToolsTitle: 'No AI tools yet',
  noToolsBody: 'There are no AI tools to use right now. Try again later.',
  loadFailed: "We couldn't load Studio",
  tryAgain: 'Check your connection and try again.',
} as const;

export const SHEET_WORDS = {
  title: 'Not enough points',
  costs: 'This costs',
  have: 'You have',
  short: 'Short by',
  buyPoints: 'Buy points',
  notNow: 'Not now',
  checkFailed: 'We could not check the cost. Try again.',
} as const;

export const CAP_WORDS = {
  dailyTitle: "That's today's limit",
  jobTitle: 'That is too much for one go',
  back: 'Back to AI tools',
} as const;

/**
 * The mark on a tool's tile, by the Hub's id for it (`GET /ai-tools`), as PT1 draws it. These are the tools the app has a screen for
 * (R-47): a tool the Hub lists that is not here is not drawn, and the task that builds its screen adds its mark.
 */
const LOOKS: Record<string, IconName> = {
  voiceover: 'Mic',
  'quick-voice': 'Zap',
  captions: 'Captions',
  'clean-audio': 'AudioWaveform',
  music: 'Music',
  'sound-effect': 'Volume2',
  dubbing: 'Languages',
};
/** True when the app has a screen for the tool. */
export const isBuiltTool = (tool: Pick<AiTool, 'id'>): boolean => Object.prototype.hasOwnProperty.call(LOOKS, tool.id);
/**
 * True when Studio draws the tool (R-47: a tool the app cannot run is not drawn): the app has its screen, and Dubbing also has the Hub's
 * file rule and at least one language to choose from (POINTS-11). The tile and the Create hub's Studio card both ask this, and so does `toolReady`.
 */
export const isDrawnTool = (tool: Pick<AiTool, 'id' | 'input'>): boolean =>
  isBuiltTool(tool) && (tool.id !== 'dubbing' || (tool.input.file?.dubbing?.languages.length ?? 0) > 0);
export const toolIcon = (tool: Pick<AiTool, 'id'>): IconName => LOOKS[tool.id] ?? 'Sparkles';

/** "250 a minute": the Hub's cost for one unit and the unit it counts in. A flat price (a use, a track) is the count alone, as PT1 draws "75" and "500". */
export function costLine(tool: Pick<AiTool, 'costPointsPerUnit' | 'unit'> & { id?: string }): string {
  const n = formatPointsCount(tool.costPointsPerUnit);
  const per: Record<string, string> = { minute: 'a minute', message: 'a message', track: '', use: '' };
  const word = per[tool.unit as string];
  const line = word ? `${n} ${word}` : n;
  // PT1 draws Dubbing as "From 1,500 a minute": the price is for each language, so the figure on the tile is where it starts (POINTS-11).
  return tool.id === 'dubbing' ? `From ${line}` : line;
}

/** The sheet the quote asks for: points short, no cap in the way. A cap wins over a shortfall (buying points would not let the job run). */
export type JobVerdict = 'ready' | 'short' | 'cap' | 'unclear';
export function verdictOf(quote: Pick<JobQuote, 'canRun' | 'shortfallPoints' | 'cap'>): JobVerdict {
  if (quote.cap) return 'cap';
  if (quote.shortfallPoints > 0) return 'short';
  // A quote that says the job cannot run and names neither a cap nor a shortfall proves nothing: it is not drawn as either.
  return quote.canRun ? 'ready' : 'unclear';
}

/** The cap's own words: the Hub names the cap and when it resets. The title says which kind it is. */
export const capTitle = (cap: Pick<JobCap, 'cap'>): string => (cap.cap === 'daily' ? CAP_WORDS.dailyTitle : CAP_WORDS.jobTitle);

/** Four digits or more, written with thousands separators ("5000" is "5,000"). */
const grouped = (text: string): string => text.replace(/\d{4,}/g, (digits) => formatPointsCount(Number(digits)));

/** The last sentence of PT7, on every limit: reaching it never costs the person their points. */
const POINTS_SAFE = 'Your points are safe.';

/**
 * What PT7 says under the title. The daily limit is the board's three sentences from the Hub's numbers ("You've used 5,000 points
 * on AI tools today. It resets at midnight. Your points are safe."); when the Hub gave no count used, the limit is the count. A
 * per-job limit keeps the Hub's sentence, with its numbers written with thousands separators, then the same last sentence.
 */
export function capMessage(cap: Pick<JobCap, 'cap' | 'limit' | 'usedPoints' | 'message'>): string {
  if (cap.cap === 'daily') return `You've used ${formatPointsCount(cap.usedPoints ?? cap.limit)} points on AI tools today. It resets at midnight. ${POINTS_SAFE}`;
  return `${grouped(cap.message)} ${POINTS_SAFE}`;
}
