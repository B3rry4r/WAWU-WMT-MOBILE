import { asksSelfie, dayOf, identityRow, tierRow } from '../model';

describe('Verification: the identity row is the wallet as the Hub says it (R-6)', () => {
  it('no wallet and nothing sent is M16, Not started, and leads into Open your wallet', () => {
    const row = identityRow({ wallet: 'not_open', review: null, selfieStopped: false });
    expect(row).toMatchObject({ kind: 'not_started', pill: 'Not started', line: 'Needed to get paid', opensWallet: true });
  });

  it('a selfie step that used every try with no match is M17, Not approved', () => {
    expect(identityRow({ wallet: 'not_open', review: null, selfieStopped: true })).toMatchObject({ kind: 'not_approved', pill: 'Not approved', line: 'Send your ID again' });
  });

  it('a selfie read that was not asked, or did not answer, never makes it Not approved', () => {
    expect(identityRow({ wallet: 'not_open', review: null, selfieStopped: null }).kind).toBe('not_started');
  });

  it.each(['rejected', 'stopped', 'expired'] as const)('a review that is %s is Not approved', (review) => {
    expect(identityRow({ wallet: 'not_open', review, selfieStopped: false }).kind).toBe('not_approved');
  });

  it('a review under way, or the bank making the account, is Checking; documents still to come is Not finished', () => {
    expect(identityRow({ wallet: 'not_open', review: 'checking', selfieStopped: null }).kind).toBe('checking');
    expect(identityRow({ wallet: 'opening', review: null, selfieStopped: null }).kind).toBe('checking');
    expect(identityRow({ wallet: 'not_open', review: 'needs_documents', selfieStopped: null }).kind).toBe('unfinished');
  });

  it('an open wallet has nothing to open from here, and a frozen one says so', () => {
    expect(identityRow({ wallet: 'open', review: 'approved', selfieStopped: null })).toMatchObject({ kind: 'open', pill: 'Open', opensWallet: false });
    expect(identityRow({ wallet: 'frozen', review: null, selfieStopped: null })).toMatchObject({ kind: 'frozen', opensWallet: false });
  });

  it('the selfie is asked about only for a wallet not open whose review has nothing to say', () => {
    expect(asksSelfie('not_open', null)).toBe(true);
    expect(asksSelfie('not_open', 'rejected')).toBe(false);
    expect(asksSelfie('open', null)).toBe(false);
    expect(asksSelfie('opening', null)).toBe(false);
  });
});

describe('Verification: the tier row', () => {
  it('reads the Hub tier name and the day it runs out, in Lagos time', () => {
    expect(dayOf('2026-10-12T22:30:00.000Z')).toBe('12 Oct 2026');
    expect(dayOf('2026-10-12T23:30:00.000Z')).toBe('13 Oct 2026');
    expect(dayOf(null)).toBeNull();
    expect(dayOf('not a date')).toBeNull();
    expect(tierRow({ state: 'active', name: 'Founding Maker', until: '2026-10-12T10:00:00.000Z' })).toEqual({ title: 'Founding Maker', line: 'Active until 12 Oct 2026', pill: 'Active', pillTone: 'positive' });
  });

  it('says when it ends and when it ended, and never draws a date the Hub did not send', () => {
    expect(tierRow({ state: 'ending', name: null, until: '2026-11-01T10:00:00.000Z' })).toMatchObject({ title: 'Your tier', line: 'Ends 1 Nov 2026', pill: 'Ending' });
    expect(tierRow({ state: 'ended', name: 'Plus', until: null })).toMatchObject({ line: null, pill: 'Ended' });
  });
});
