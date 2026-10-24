import type { IconName } from '@/components/icon';
import { formatMoney } from '@/components/Money';
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
  buyInstead: 'Buy points instead',
  notNow: 'Not now',
  addMoney: 'Add money',
  walletLowTitle: 'Your wallet is too low too',
  walletLowBody: 'Add money, then try again.',
  /** The note under the offer when the Hub charges nothing on top: nothing is taken before the PIN. */
  beforePin: 'Nothing is taken until you enter your PIN.',
  paying: 'Paying...',
  changed: 'The price changed. Check the new total before you confirm.',
  notReady: 'We could not get this payment ready. Try again.',
  checkFailed: 'We could not check the cost. Try again.',
  notShort: 'You have enough points now.',
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

/** "₦2,500", or "₦2,523.25" when kobo are in it: money is whole kobo on the wire, never a float. */
export const naira = (kobo: number): string => formatMoney(kobo, { decimals: kobo % 100 !== 0 });

/** The sheet the quote asks for: points short, no cap in the way. A cap wins over a shortfall (buying points would not let the job run). */
export type JobVerdict = 'ready' | 'short' | 'cap' | 'unclear';
export function verdictOf(quote: Pick<JobQuote, 'canRun' | 'shortfallPoints' | 'cap'>): JobVerdict {
  if (quote.cap) return 'cap';
  if (quote.shortfallPoints > 0) return 'short';
  // A quote that says the job cannot run and names neither a cap nor a shortfall proves nothing: it is not drawn as either.
  return quote.canRun ? 'ready' : 'unclear';
}

/** Which of the sheet's three drawn states the quote is: PT3 (the wallet pays the shortfall), PT3b (the wallet is too low for it) or PT3a (Use wallet is off). */
export type SheetState = 'wallet' | 'wallet_low' | 'buy';
export function sheetState(quote: Pick<JobQuote, 'useWallet' | 'wallet'>): SheetState {
  if (!quote.useWallet || !quote.wallet) return 'buy';
  const short = quote.wallet.payment.shortfallKobo;
  return short !== null && short !== undefined && short > 0 ? 'wallet_low' : 'wallet';
}

/** What the person pays from the wallet for the missing points: the total, the Bank charge in it (BRIEF rule 5). */
export const walletTotal = (quote: Pick<JobQuote, 'wallet'>): number => quote.wallet?.payment.totalKobo ?? 0;

/** "₦80 + ₦0.50 Bank charge" when the Hub charges a fee on top, else the line about the PIN. */
export function offerNote(quote: Pick<JobQuote, 'wallet'>): string {
  const pay = quote.wallet?.payment;
  if (!pay || pay.fee.totalFeeKobo <= 0) return SHEET_WORDS.beforePin;
  return `${naira(pay.priceKobo)} + ${naira(pay.fee.totalFeeKobo)} Bank charge`;
}

/** When the figures the person was shown are not the figures the Hub has now. */
export function quoteMoved(a: JobQuote, b: JobQuote): boolean {
  return a.costPoints !== b.costPoints || a.shortfallPoints !== b.shortfallPoints || walletTotal(a) !== walletTotal(b) || a.balancePoints !== b.balancePoints;
}

/** The PIN sheet's line: "Approve ₦80 for buying 160 points". */
export const pinPurpose = (quote: Pick<JobQuote, 'shortfallPoints'>): string => `buying ${formatPointsCount(quote.shortfallPoints)} points`;

/** The cap's own words: the Hub names the cap and when it resets. The title says which kind it is. */
export const capTitle = (cap: Pick<JobCap, 'cap'>): string => (cap.cap === 'daily' ? CAP_WORDS.dailyTitle : CAP_WORDS.jobTitle);
