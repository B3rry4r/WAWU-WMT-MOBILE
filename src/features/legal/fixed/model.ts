import type { IconName } from '@/components/icon';

import type { CatalogueService } from './api';

/**
 * Which catalogue service a conversation's matter is about, for the matters the Hub starts as a fixed-price service. The thread carries the matter's code
 * (`business_registration`) and the catalogue the service's (`cac-registration`), and nothing the Hub serves joins them, so the join is held here until it
 * does (BACKEND_GAPS G-880). PROVISIONAL(LEGAL-FIXED-MATTERS, owner=LEGAL-06, why=the Hub's MATTER_TO_SERVICE_CODE is not served; the Hub's table is the authority).
 */
export const FIXED_PRICE_MATTERS: Readonly<Record<string, string>> = { business_registration: 'cac-registration' };

/**
 * A service that can be started from S26: priced by WAWU (R-14), a fixed-price path, and needing nothing S26 does not ask for. The Hub refuses a
 * request for a service that `requiresDocuments` without them (it names the documents on the web's own form), so such a service is not offered here:
 * a Start button that always fails would be a dead button (R-47).
 */
export function startable(service: CatalogueService | undefined): service is CatalogueService & { priceNaira: number } {
  return Boolean(service && service.path === 'simple' && typeof service.priceNaira === 'number' && service.priceNaira > 0 && service.requiresDocuments !== true);
}

/** The fixed-price service a conversation about `matter` can start, or null. */
export function fixedPriceFor(matter: string, services: readonly CatalogueService[] | undefined): (CatalogueService & { priceNaira: number }) | null {
  const code = FIXED_PRICE_MATTERS[matter];
  const service = code ? services?.find((s) => s.code === code) : undefined;
  return startable(service) ? service : null;
}

/** The mark on the service's tile: the business building for the registration, a document for the rest. */
export const iconOf = (service: Pick<CatalogueService, 'code'>): IconName => (service.code === 'cac-registration' ? 'Building2' : 'FileText');

/** A name choice with something in it, trimmed; the Hub keeps it with the request. */
export function nameChoice(typed: string): string | null {
  const name = typed.trim().replace(/\s+/g, ' ');
  return name.length >= 2 ? name : null;
}
