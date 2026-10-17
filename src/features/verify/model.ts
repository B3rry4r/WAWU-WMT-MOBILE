import { formatMoney } from '@/components/Money';
import { formatPoints } from '@/components/PointsFigure';
import type { IconName } from '@/components/icon';
import { nairaToKobo } from '@/api/kobo';
import { FORMAT_IDS, type FormatId } from '@/features/create/model';

import type { DraftBody, DraftChanges, PlanAction, PlansView, PlanTier, ProductDraft } from './api';

/** The tier the Hub marks as the one offered first (`preselected`). VF1 draws what that tier gives; with none marked it draws nothing of its own. */
export const preselectedTier = (plans: PlansView): PlanTier | null => plans.tiers.find((tier) => tier.preselected) ?? null;

export type BonusRow = { id: 'points' | 'voice' | 'event'; icon: IconName; title: string; sub: string | null };

/** The names the points screens give two of the Hub's priced actions (`GET /plans` `actions[].id`). A tool is named only when the Hub prices it. */
const TOOL_NAMES: readonly { id: string; name: string }[] = [
  { id: 'voiceover_per_min', name: 'VoiceOver' },
  { id: 'captions_per_min', name: 'Captions' },
];

/** "For AI tools like VoiceOver and Captions", naming only the tools the Hub prices; "For AI tools" when it prices none of those two. */
export function pointsLine(actions: readonly PlanAction[]): string {
  const names = TOOL_NAMES.filter((tool) => actions.some((action) => action.id === tool.id)).map((tool) => tool.name);
  if (names.length === 0) return 'For AI tools';
  return `For AI tools like ${names.join(' and ')}`;
}

/**
 * VF1's three rows, from the preselected tier: the points (`bonusPoints`), the Voice Intro (`firstVoiceIntroIncluded`) and the event
 * pass (`eventPass`). A row the tier does not give is not drawn. `null` means the Hub marked no tier, so there is nothing to show.
 */
export function bonusRowsOf(plans: PlansView): BonusRow[] | null {
  const tier = preselectedTier(plans);
  if (!tier) return null;
  const rows: BonusRow[] = [];
  if (tier.bonusPoints > 0) rows.push({ id: 'points', icon: 'Sparkles', title: `Up to ${formatPoints(tier.bonusPoints)}`, sub: pointsLine(plans.actions ?? []) });
  if (tier.firstVoiceIntroIncluded) rows.push({ id: 'voice', icon: 'AudioLines', title: 'Your Voice Intro', sub: 'In your own voice, first one included' });
  const pass = tier.eventPass;
  if (pass?.name) rows.push({ id: 'event', icon: 'Ticket', title: pass.name, sub: pass.benefits && pass.benefits.length > 0 ? pass.benefits.join(' · ') : null });
  return rows;
}

/** "1 draft", "3 drafts", "0 drafts". */
export const draftCount = (count: number): string => `${count} ${count === 1 ? 'draft' : 'drafts'}`;

/** What a draft still has to say before it is a product: the four things the form collects (the title is always there). */
function fieldsFilled(draft: ProductDraft): number {
  const priced = draft.accessType === 'free' || (draft.accessType === 'paid' && draft.price !== null && draft.price > 0);
  return [draft.title.trim().length > 0, draft.contentType !== null, (draft.description ?? '').trim().length > 0, priced].filter(Boolean).length;
}

const READY_FIELDS = 4;

/**
 * "Shop ready", worked out here from the drafts (the Hub serves no such figure): how far the most finished draft has come, as a whole
 * percentage. A shop is ready to publish once one product is, so a new empty draft never lowers it. No drafts is 0.
 */
export function shopReady(drafts: readonly ProductDraft[]): number {
  if (drafts.length === 0) return 0;
  const best = Math.max(...drafts.map(fieldsFilled));
  return Math.round((best / READY_FIELDS) * 100);
}

/** The price words under a draft's title: the price, "Free", or what is missing. */
export function priceWords(draft: ProductDraft): string {
  if (draft.accessType === 'free') return 'Free';
  if (draft.accessType === 'paid' && draft.price !== null && draft.price > 0) return formatMoney(nairaToKobo(draft.price), { decimals: false });
  return 'No price yet';
}

/** VF2's line under a draft's title: "No file yet · ₦4,500". A draft never has a file (publishing adds them, VERIFY-04). */
export const draftLine = (draft: ProductDraft): string => `No file yet · ${priceWords(draft)}`;

/** What the form holds. `price` is the digits typed, in whole naira (a product's price on the Hub is whole naira). */
export type Form = { title: string; kind: FormatId | null; description: string; access: 'paid' | 'free'; price: string };

export const emptyForm: Form = { title: '', kind: null, description: '', access: 'paid', price: '' };

/** The longest price the field takes: the digits of the Hub's own ceiling are checked by the Hub, which answers in words. */
export const PRICE_DIGITS = 8;

const isFormat = (value: string | null): value is FormatId => value !== null && (FORMAT_IDS as readonly string[]).includes(value);

export function formOf(draft: ProductDraft): Form {
  return {
    title: draft.title,
    kind: isFormat(draft.contentType) ? draft.contentType : null,
    description: draft.description ?? '',
    access: draft.accessType === 'free' ? 'free' : 'paid',
    price: draft.accessType === 'paid' && draft.price !== null ? String(draft.price) : '',
  };
}

/** Digits only, no leading zeros, at most `PRICE_DIGITS`. */
export const cleanPrice = (typed: string): string => typed.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, PRICE_DIGITS);

/** The sentence under a title that is blank, or null. A draft needs only a title (the Hub requires it). */
export const titleProblem = (title: string): string | null => (title.trim().length === 0 ? 'Give your product a title.' : null);

/** The body of a new draft: the title, and whatever else was filled in. */
export function createBodyOf(form: Form): DraftBody {
  const body: DraftBody = { title: form.title.trim(), accessType: form.access };
  if (form.kind) body.contentType = form.kind;
  if (form.description.trim()) body.description = form.description.trim();
  if (form.access === 'free') body.price = 0;
  else if (form.price !== '') body.price = Number(form.price);
  return body;
}

/** Only what changed since the draft was read, or null when nothing did. A description cannot be emptied (the Hub takes a non-empty one), so clearing it sends nothing. */
export function changesOf(form: Form, was: Form): DraftChanges | null {
  const changes: DraftChanges = {};
  if (form.title.trim() !== was.title.trim()) changes.title = form.title.trim();
  if (form.kind !== was.kind && form.kind) changes.contentType = form.kind;
  if (form.description.trim() !== was.description.trim() && form.description.trim()) changes.description = form.description.trim();
  if (form.access !== was.access || form.price !== was.price) {
    changes.accessType = form.access;
    if (form.access === 'free') changes.price = 0;
    else if (form.price !== '') changes.price = Number(form.price);
  }
  return Object.keys(changes).length > 0 ? changes : null;
}
