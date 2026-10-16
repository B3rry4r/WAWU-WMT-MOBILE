import type { ShareCard } from './api/tgif';

/** The web build has no share sheet or photo library for the card: H35 draws WhatsApp and Chat only. */
export async function canShareCard(): Promise<boolean> {
  return false;
}

export function writeCard(_card: ShareCard, _date: string): string {
  throw new Error('The card cannot be written here.');
}

export async function shareCardFile(_uri: string, _title: string): Promise<void> {
  throw new Error('The card cannot be shared here.');
}

export async function saveCardFile(_uri: string): Promise<'saved' | 'denied'> {
  throw new Error('The card cannot be saved here.');
}
