import { maskedNumber } from '@/features/geo/phone';

/**
 * A phone number as Z2's header card shows it, the middle hidden. A Nigerian number reads the way it is dialled at home,
 * "0803 ••• 4412"; any other keeps its own country code and its last four digits, "+44 ••• 3456" (GEO-03, R-85).
 * The first four are the network prefix, not the person's number, and Z2 draws exactly "0803 ••• 4412": the canvas
 * is the authority for what the card shows (SETTINGS-01 round 2, Phone mask: kept as drawn, owner may override).
 */
export function maskPhone(phone: string | null | undefined): string {
  return maskedNumber(phone);
}
