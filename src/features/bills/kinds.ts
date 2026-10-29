import type { IconName } from '@/components/icon';

import type { BillCategory } from './api';

/**
 * The four kinds of bill S2 draws (R-102): Airtime, Data, Electricity and Cable TV, in the board's order. The provider lists its own
 * categories (the website draws every one it lists); each kind here is matched to the category whose code, else name, says it, so
 * a kind the provider does not list is not drawn at all (R-47) and the app keeps no category code of its own.
 */
export type BillKind = 'airtime' | 'data' | 'electricity' | 'cable';

export type KindInfo = {
  kind: BillKind;
  /** The tile's word, and the "Paying for" chip. */
  label: string;
  icon: IconName;
  /** The field's label, and what S10 names ("We couldn't find this meter"). */
  numberLabel: string;
  numberWord: string;
  /** The word before the number in Recent ("Meter 0412 3456 789"). */
  recentWord: string;
  /** S3's label over the companies. */
  pickBiller: string;
  /** The words over the packages, bundles and plans. */
  pickItem: string;
  /** What a route to this kind is. */
  path: '/bills/airtime' | '/bills/data' | '/bills/electricity' | '/bills/cable';
};

export const KINDS: readonly KindInfo[] = [
  { kind: 'airtime', label: 'Airtime', icon: 'Smartphone', numberLabel: 'Phone number', numberWord: 'number', recentWord: '', pickBiller: 'Network', pickItem: 'Which one?', path: '/bills/airtime' },
  { kind: 'data', label: 'Data', icon: 'Wifi', numberLabel: 'Phone number', numberWord: 'number', recentWord: '', pickBiller: 'Network', pickItem: 'Which bundle?', path: '/bills/data' },
  { kind: 'electricity', label: 'Electricity', icon: 'Zap', numberLabel: 'Meter number', numberWord: 'meter', recentWord: 'Meter', pickBiller: 'Who are you paying?', pickItem: 'Which plan?', path: '/bills/electricity' },
  { kind: 'cable', label: 'Cable TV', icon: 'Tv', numberLabel: 'Smartcard number', numberWord: 'smartcard', recentWord: 'Smartcard', pickBiller: 'Who are you paying?', pickItem: 'Which package?', path: '/bills/cable' },
];

export const kindInfo = (kind: BillKind): KindInfo => KINDS.find((k) => k.kind === kind) as KindInfo;

/** Letters only, upper case: "Mobile Data Service" and MOBILE_DATA are both MOBILEDATASERVICE-like and compare alike. */
const plain = (text: string | null | undefined): string => (text ?? '').toUpperCase().replace(/[^A-Z]/g, '');

const MATCHERS: Record<BillKind, (word: string) => boolean> = {
  airtime: (w) => w.includes('AIRTIME') && !w.includes('DATA'),
  data: (w) => w.includes('DATA'),
  electricity: (w) => w.includes('POWER') || w.includes('ELECTRIC') || w.includes('UTILIT'),
  cable: (w) => w.includes('CABLE'),
};

/** The kind a provider category is, by its code first and its name second; null for one the app does not sell. */
export function kindOfCategory(category: Pick<BillCategory, 'code' | 'name'>): BillKind | null {
  for (const { kind } of KINDS) {
    if (MATCHERS[kind](plain(category.code))) return kind;
  }
  for (const { kind } of KINDS) {
    if (MATCHERS[kind](plain(category.name))) return kind;
  }
  return null;
}

/** The category that is this kind in the provider's list, or undefined when it lists none. */
export function categoryOfKind(kind: BillKind, categories: readonly BillCategory[]): BillCategory | undefined {
  return categories.find((c) => kindOfCategory(c) === kind);
}

/** What the Hub calls the category: its code (the provider matches billers on it), else its name. */
export const categoryCodeOf = (category: Pick<BillCategory, 'code' | 'name'>): string => category.code ?? category.name;

/** The kinds the provider lists, in the board's order. */
export function kindsListed(categories: readonly BillCategory[]): KindInfo[] {
  return KINDS.filter((k) => categoryOfKind(k.kind, categories) !== undefined);
}

/** The kind a recorded bill was (its category is the display name the app sent); electricity when nothing says otherwise is never guessed. */
export function kindOfRecord(category: string): BillKind | null {
  return kindOfCategory({ code: null, name: category });
}

/** A recorded number as Recent draws it: a meter in full, a phone or smartcard with its middle hidden ("0803 ••• 4412", "7021 ••• 88"). */
export function recentNumber(kind: BillKind | null, ref: string): string {
  const digits = ref.replace(/\D/g, '');
  if (kind === 'electricity') return `Meter ${digits.replace(/(\d{4})(?=\d)/g, '$1 ')}`;
  if (digits.length < 8) return ref;
  if (kind === 'cable') return `Smartcard ${digits.slice(0, 4)} ••• ${digits.slice(-2)}`;
  return `${digits.slice(0, 4)} ••• ${digits.slice(-4)}`;
}
