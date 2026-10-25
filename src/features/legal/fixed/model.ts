import type { IconName } from '@/components/icon';

/** The mark on the service's tile: the business building for the registration, a document for the rest. */
export const iconOf = (service: { code: string }): IconName => (service.code === 'cac-registration' ? 'Building2' : 'FileText');

/** A name choice with something in it, trimmed; the Hub keeps it with the request. */
export function nameChoice(typed: string): string | null {
  const name = typed.trim().replace(/\s+/g, ' ');
  return name.length >= 2 ? name : null;
}
