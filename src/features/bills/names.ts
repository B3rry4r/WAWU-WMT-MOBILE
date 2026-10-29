/**
 * How a company's name is drawn (BILLS-10). The provider writes its billers in its own long, upper-case words ("MTN NIGERIA",
 * "AIRTEL NIGERIA", "9MOBILE NIGERIA", "IKEJA ELECTRIC"), which a chip cannot hold and a receipt should not shout. One rule, used
 * wherever a company's name shows (the chips, the list of companies, the review, the receipt, Recent): a network is its short name,
 * a name the provider wrote in capitals is title case, and a name that already has mixed case is left as it is. It is idempotent: a
 * name that was tidied is tidied to itself, so the Hub may hold either form.
 */
const NETWORKS: readonly { test: (tokens: readonly string[]) => boolean; name: string }[] = [
  { test: (t) => t.includes('MTN'), name: 'MTN' },
  { test: (t) => t.includes('AIRTEL'), name: 'Airtel' },
  { test: (t) => t.includes('GLO') || t.includes('GLOBACOM'), name: 'Glo' },
  { test: (t) => t.includes('9MOBILE') || t.includes('ETISALAT') || (t.includes('9') && t.includes('MOBILE')), name: '9mobile' },
];

/** Brands whose own spelling is not title case. */
const BRANDS: Readonly<Record<string, string>> = { DSTV: 'DStv', GOTV: 'GOtv', STARTIMES: 'StarTimes' };

/** Letters that stay capitals in a name written in capitals: a distribution company's initials. */
const ACRONYMS: ReadonlySet<string> = new Set(['EKEDC', 'IKEDC', 'AEDC', 'IBEDC', 'KEDCO', 'EEDC', 'BEDC', 'JED', 'YEDC', 'PHED', 'TV', 'VTU', 'NEPA']);

const isCapitals = (word: string): boolean => word === word.toUpperCase() && word !== word.toLowerCase();
const isLowercase = (word: string): boolean => word === word.toLowerCase() && word !== word.toUpperCase();

/** One run of letters and digits. A word with a digit in it ("5GB") and a word that already has mixed case ("DStv") are left alone. */
function tidyWord(word: string): string {
  const upper = word.toUpperCase();
  if (BRANDS[upper]) return BRANDS[upper];
  if (/\d/.test(word)) return word;
  if (ACRONYMS.has(upper)) return upper;
  if (isCapitals(word) || isLowercase(word)) return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  return word;
}

const tokensOf = (text: string): string[] => text.toUpperCase().split(/[^A-Z0-9]+/).filter((t) => t !== '');

/**
 * A company's name as it is drawn. A network is matched on the provider's name or, failing that, its code; anything else is the
 * name in tidy title case. An empty name stays empty.
 */
export function tidyBillerName(name: string | null | undefined, code?: string | null): string {
  const raw = (name ?? '').trim().replace(/\s+/g, ' ');
  const network = NETWORKS.find((n) => n.test(tokensOf(raw))) ?? NETWORKS.find((n) => n.test(tokensOf(code ?? '')));
  if (network) return network.name;
  return raw.replace(/[A-Za-z0-9]+/g, tidyWord);
}

/** The provider's label for the number a bill is for ("SmartCard Number") as the app words its fields ("Smartcard number"). */
export function sentenceCase(label: string): string {
  const text = label.trim().replace(/\s+/g, ' ');
  return text === '' ? '' : text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}
