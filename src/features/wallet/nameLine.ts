import type { NameLine } from './payoutForm';

/**
 * What A21 says under the account number once the bank has answered (kit.js `field` hint): the bank's name for the account, and whether
 * it is the name on the BVN. `ok` and `warning` are the field's result tones; the other lines are plain hints. `none` and `unconfirmed`
 * say nothing here (the field shows its own error). `way` is where the field is drawn: A21 saves the account, W8 sends to it.
 */
export type NameHint = { hint: string; tone?: 'ok' | 'warning' };

export function nameLineHint(line: NameLine, way: 'save' | 'send' = 'save'): NameHint | null {
  switch (line.kind) {
    case 'resolved':
      if (line.match === true) return { hint: `${line.name} · matches your BVN`, tone: 'ok' };
      if (line.match === false) return { hint: `${line.name} · not the name on your BVN`, tone: 'warning' };
      return { hint: line.name, tone: 'ok' };
    case 'checking':
      return { hint: 'Checking the account with the bank' };
    case 'unchecked':
      // Saving checks the name with the bank. Send has nothing to save and stays off until the name is checked, so it says no more.
      return { hint: way === 'send' ? 'We could not check the name now.' : 'We could not check the name now. Saving checks it with the bank.' };
    default:
      return null;
  }
}
