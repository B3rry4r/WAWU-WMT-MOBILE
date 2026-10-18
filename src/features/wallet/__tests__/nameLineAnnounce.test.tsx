import * as rtl from '@testing-library/react-native';

import { TextField } from '@/components/TextField';

import { nameLineHint } from '../nameLine';

/**
 * SWEEP-APP-3 row 91 (SHARED-06 L1): A21's "Checking the account with the bank" and "We could not check the name now..." lines were a polite
 * live region before the field drew them as plain hints; the plain hint is not announced, so those two lines ask the field to announce.
 */
describe('A21 · the lines under the account number', () => {
  it('asks to be announced for the checking line and the could-not-check line, on both ways to the field', () => {
    expect(nameLineHint({ kind: 'checking' })).toMatchObject({ hint: 'Checking the account with the bank', announce: true });
    expect(nameLineHint({ kind: 'unchecked' })).toMatchObject({ announce: true });
    expect(nameLineHint({ kind: 'unchecked' }, 'send')).toMatchObject({ hint: 'We could not check the name now.', announce: true });
  });

  it('leaves the result lines to their tone, which is already a live region', () => {
    expect(nameLineHint({ kind: 'resolved', name: 'ADA EZE', match: true })).toEqual({ hint: 'ADA EZE · matches your BVN', tone: 'ok' });
  });

  it('the field reads a hint out as it changes only when it is asked to', async () => {
    const live = (_props: { announce?: boolean }) => rtl.screen.getByText('Checking the account with the bank').props.accessibilityLiveRegion;
    await rtl.render(<TextField label="Account number" value="" onChangeText={() => undefined} hint="Checking the account with the bank" />);
    expect(live({})).toBe('none');
    await rtl.screen.unmount();
    await rtl.render(<TextField label="Account number" value="" onChangeText={() => undefined} hint="Checking the account with the bank" announce />);
    expect(live({ announce: true })).toBe('polite');
  });
});
