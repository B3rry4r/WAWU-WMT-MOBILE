import type { ChipItem } from '@/components/FilterChips';
import type { ProField } from '@/features/pro-listing/api';
import { CREDENTIAL_KINDS } from '@/features/pro-listing/model';

import type { DirectoryEntry, DirectoryPage, DirectoryProfile, FieldId } from './api';

export type FieldChoice = FieldId | 'all';

/** P1's chips: All, then each field the Hub serves, in its order. */
export function fieldChips(fields: readonly ProField[]): ChipItem<FieldChoice>[] {
  return [{ value: 'all', label: 'All' }, ...fields.map((f) => ({ value: f.id as FieldId, label: f.label }))];
}

/** The field a route asked for, when it is one the Hub serves; All otherwise. */
export function chosenField(initial: string | string[] | undefined, fields: readonly ProField[]): FieldChoice {
  const asked = Array.isArray(initial) ? initial[0] : initial;
  return asked && fields.some((f) => f.id === asked) ? (asked as FieldId) : 'all';
}

/**
 * Every row of the pages read so far, once each. The Hub pages by offset, so a listing approved while the person scrolls
 * moves the rest down one and the next page repeats a row; the first one shown stays.
 */
export function rowsOf(pages: readonly DirectoryPage[] | undefined): DirectoryEntry[] {
  const seen = new Set<string>();
  const out: DirectoryEntry[] = [];
  for (const page of pages ?? []) {
    for (const row of page.items) {
      if (seen.has(row.id)) continue;
      seen.add(row.id);
      out.push(row);
    }
  }
  return out;
}

/** P4, and its All twin: what the empty list says, naming the field. */
export function emptyCopy(choice: FieldChoice, fields: readonly ProField[]): { title: string; message: string } {
  const label = choice === 'all' ? undefined : fields.find((f) => f.id === choice)?.label;
  return {
    title: label ? `Nobody listed in ${label} yet` : 'Nobody listed yet',
    message: 'If you do this work, apply to be listed here.',
  };
}

/**
 * The price of a message, in kobo, or null when there is none to show: the professional is not taking messages, or the
 * Hub has no price for them. Never a default.
 */
export function messagePrice(entry: Pick<DirectoryEntry, 'dmEnabled' | 'messagePriceKobo'>): number | null {
  if (!entry.dmEnabled) return null;
  const kobo = entry.messagePriceKobo;
  return typeof kobo === 'number' && Number.isFinite(kobo) && kobo > 0 ? kobo : null;
}

/** P2 or P3: whether the profile takes messages. */
export function takesMessages(profile: Pick<DirectoryProfile, 'dmEnabled'>): boolean {
  return profile.dmEnabled === true;
}

/** The verified professional's tick, when the Hub says they are verified. */
export function hasProTick(entry: Pick<DirectoryEntry, 'verification'>): boolean {
  return entry.verification?.professional?.verified === true;
}

/** The credential's name as P5 and P6 offered it ("Practising licence"), or null for a kind the app does not know. */
export function credentialTitle(kind: string): string | null {
  return CREDENTIAL_KINDS.find((k) => k.value === kind)?.label ?? null;
}

/**
 * The line under the credential: who issued it, and that a person at WAWU checked it. Only an approved application is
 * listed (the Hub's directory reads `status: approved`), and approving is a person's review in admin, so the check is a
 * fact for every listing shown.
 */
export function credentialLine(issuingBody: string | null | undefined): string {
  const issuer = issuingBody?.trim();
  return issuer ? `Issued by ${issuer} · checked by WAWU` : 'Checked by WAWU';
}
