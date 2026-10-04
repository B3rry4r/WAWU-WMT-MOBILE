import { addressLine, birthDate, detailsProblems, fullName, genderWord, NIGERIAN_STATES, openingName, tidyDetails } from '../details';
import { expireKeptCheck, forgetKeptCheck, isKeptFor, keepAddress, keepCheck, readAddress, readHandle, readKeptCheck, readOccupation, ticketFor, useCheckNotice } from '../keptCheck';
import { act, renderHook } from '@testing-library/react-native';

import { flowDepth, useOpenWalletWay } from '../leave';
import { isSendableSelfie, SELFIE_MIN_BASE64_CHARS } from '../api/opening';

const mockRouter = { dismiss: jest.fn(), replace: jest.fn(), dismissTo: jest.fn() };
let mockRoutes: { name: string }[] = [];
jest.mock('expo-router', () => ({ useRouter: () => mockRouter, useNavigation: () => ({ getState: () => ({ routes: mockRoutes }) }) }));

const OWNER = '00000000-0000-4000-8000-0000000000b1';
const check = {
  identity: { bvn: { last4: '0111', verifiedAt: '2026-10-03T10:00:00.000Z' }, ninLast4: '0999', occupation: null, checksLeft: 2 },
  prefill: { firstName: 'Ada', middleName: 'B', lastName: 'Eze', dateOfBirth: '1992-10-04', gender: 'female' as const },
  checkHandle: 'v1.k03-test-handle',
};
const typed = { street: '14 Admiralty Way', city: 'Lekki', state: 'Lagos', occupation: 'Filmmaker', agreed: true };

describe('A5: what the person types', () => {
  it('a user who fills in the address, occupation and consent has nothing missing', () => {
    expect(detailsProblems(typed)).toEqual({});
  });

  it('a user is told what is missing, field by field, in words they can act on', () => {
    expect(detailsProblems({ street: ' ', city: '', state: null, occupation: '', agreed: false })).toEqual({
      street: 'Enter your street address.',
      city: 'Enter your city or town.',
      state: 'Choose your state.',
      occupation: 'Enter your occupation.',
      agreed: 'Tick the box to agree before you continue.',
    });
  });

  it('an address or occupation of digits only is refused here, as the server would refuse it after a charged selfie', () => {
    expect(detailsProblems({ ...typed, street: '14 15' }).street).toBe('Enter your street address with the street name.');
    expect(detailsProblems({ ...typed, city: '123' }).city).toBe('Enter the name of your city or town.');
    expect(detailsProblems({ ...typed, occupation: '7' }).occupation).toBe('Enter your occupation in words.');
    expect(detailsProblems({ ...typed, occupation: 'a'.repeat(81) }).occupation).toBe('Keep your occupation to 80 characters.');
    expect(detailsProblems({ ...typed, state: 'Atlantis' }).state).toBe('Choose your state.');
  });

  it('the address goes in the one line the account opening takes: street, city or town, state', () => {
    expect(addressLine({ street: ' 14  Admiralty Way ', city: 'Lekki\nPhase 1', state: 'Lagos' })).toBe('14 Admiralty Way, Lekki Phase 1, Lagos');
    const longest = addressLine({ street: 'a'.repeat(120), city: 'b'.repeat(50), state: 'Federal Capital Territory' });
    expect(longest.length).toBeLessThanOrEqual(200);
    expect(tidyDetails({ ...typed, occupation: '  Film  maker ' }).occupation).toBe('Film maker');
  });

  it('the state picker lists the 36 states and the FCT, once each', () => {
    expect(NIGERIAN_STATES).toHaveLength(37);
    expect(new Set(NIGERIAN_STATES).size).toBe(37);
    expect(NIGERIAN_STATES).toContain('Federal Capital Territory');
  });
});

describe('A5: the "From your BVN" card', () => {
  it('a user sees the BVN’s name, date of birth and gender as A5 draws them', () => {
    expect(fullName(check.prefill)).toBe('Ada B Eze');
    expect(fullName({ ...check.prefill, middleName: null })).toBe('Ada Eze');
    expect(birthDate('1994-03-14')).toBe('14 Mar 1994');
    expect(birthDate('1992-10-04')).toBe('4 Oct 1992');
    expect(birthDate('14-Mar-1994')).toBe('14-Mar-1994');
    expect(genderWord('male')).toBe('Male');
    expect(genderWord('female')).toBe('Female');
    expect(genderWord(null)).toBeNull();
  });

  it('the opening needs a first name, last name and date of birth from the BVN; without one the account cannot open', () => {
    expect(openingName(check.prefill)).toEqual({ firstName: 'Ada', lastName: 'Eze', dateOfBirth: '1992-10-04' });
    expect(openingName({ ...check.prefill, dateOfBirth: null })).toBeNull();
    expect(openingName({ ...check.prefill, lastName: ' ' })).toBeNull();
    expect(openingName({ ...check.prefill, dateOfBirth: '04/10/1992' })).toBeNull();
  });
});

describe('A5’s address, kept beside the passed check for A7', () => {
  beforeEach(() => forgetKeptCheck());

  it('the check handle is kept beside the check, for that account only, never inside the check itself, and goes on every forget', () => {
    keepCheck(ticketFor(OWNER), check);
    expect(readHandle(OWNER)).toBe('v1.k03-test-handle');
    expect(readHandle('someone-else')).toBeNull();
    expect(readKeptCheck(OWNER)).not.toHaveProperty('checkHandle');
    forgetKeptCheck();
    expect(readHandle(OWNER)).toBeNull();
  });

  it('is kept for the account whose check passed, and read by no one else', () => {
    expect(keepCheck(ticketFor(OWNER), check)).toBe(true);
    expect(keepAddress(ticketFor(OWNER), { street: '14 Admiralty Way', city: 'Lekki', state: 'Lagos' })).toBe(true);
    expect(readAddress(OWNER)).toEqual({ street: '14 Admiralty Way', city: 'Lekki', state: 'Lagos' });
    expect(readAddress('someone-else')).toBeNull();
  });

  it('goes with the check on every forget, and an answer under a voided ticket keeps nothing', () => {
    keepCheck(ticketFor(OWNER), check);
    const ticket = ticketFor(OWNER);
    forgetKeptCheck();
    expect(keepAddress(ticket, { street: 'x st', city: 'Ikeja', state: 'Lagos' })).toBe(false);
    expect(readAddress(OWNER)).toBeNull();
    expect(readKeptCheck(OWNER)).toBeNull();
  });

  it('an answer under a ticket from before a forget keeps nothing, even once a new check is kept', () => {
    keepCheck(ticketFor(OWNER), check);
    const stale = ticketFor(OWNER);
    forgetKeptCheck();
    keepCheck(ticketFor(OWNER), check);
    expect(keepAddress(stale, { street: 'x st', city: 'Ikeja', state: 'Lagos' })).toBe(false);
    expect(readAddress(OWNER)).toBeNull();
  });

  it('is never kept without a passed check for the same account', () => {
    expect(keepAddress(ticketFor(OWNER), { street: 'x st', city: 'Ikeja', state: 'Lagos' })).toBe(false);
    keepCheck(ticketFor(OWNER), check);
    expect(keepAddress(ticketFor('someone-else'), { street: 'x st', city: 'Ikeja', state: 'Lagos' })).toBe(false);
  });

  it('a new check that passes for the same account keeps what was typed on A5; one for another account starts empty', () => {
    keepCheck(ticketFor(OWNER), check);
    keepAddress(ticketFor(OWNER), { street: 'x st', city: 'Ikeja', state: 'Lagos' }, 'Tailor');
    keepCheck(ticketFor(OWNER), check);
    expect(readAddress(OWNER)).toEqual({ street: 'x st', city: 'Ikeja', state: 'Lagos' });
    expect(readOccupation(OWNER)).toBe('Tailor');
    keepCheck(ticketFor('someone-else'), check);
    expect(readAddress('someone-else')).toBeNull();
    expect(readOccupation('someone-else')).toBeNull();
    expect(readAddress(OWNER)).toBeNull();
  });
});

describe('a check whose handle the server refused (409 bvn_not_checked)', () => {
  beforeEach(() => forgetKeptCheck());
  const home = { street: '14 Admiralty Way', city: 'Lekki', state: 'Lagos' };

  it('forgets the check and the handle, keeps the address and occupation with the server’s sentence, and voids every ticket out', () => {
    keepCheck(ticketFor(OWNER), check);
    keepAddress(ticketFor(OWNER), home, 'Filmmaker');
    const before = ticketFor(OWNER);
    expireKeptCheck('Check your BVN again to continue.');
    expect(readKeptCheck(OWNER)).toBeNull();
    expect(readHandle(OWNER)).toBeNull();
    expect(readAddress(OWNER)).toEqual(home);
    expect(readOccupation(OWNER)).toBe('Filmmaker');
    expect(isKeptFor(OWNER)).toBe(true);
    // An answer from before (a late selfie match, a late check) writes nothing.
    expect(keepCheck(before, check)).toBe(false);
    expect(keepAddress(before, { ...home, street: 'late st' })).toBe(false);
    expect(readAddress(OWNER)).toEqual(home);
  });

  it('a second restart without a sentence (the closing screen seeing nothing kept) keeps the server’s sentence', async () => {
    keepCheck(ticketFor(OWNER), check);
    keepAddress(ticketFor(OWNER), home, 'Filmmaker');
    expireKeptCheck('Check your BVN again to continue.');
    expireKeptCheck(null);
    const { result } = await renderHook(() => useCheckNotice(OWNER));
    expect(result.current).toEqual({ notice: 'Check your BVN again to continue.', addressKept: true });
  });

  it('nothing can be typed in beside no check: the address waits for a new one to pass', () => {
    keepCheck(ticketFor(OWNER), check);
    expireKeptCheck(null);
    expect(keepAddress(ticketFor(OWNER), home)).toBe(false);
  });

  it('a new check that passes brings A5’s address and occupation back, and the sentence goes', async () => {
    keepCheck(ticketFor(OWNER), check);
    keepAddress(ticketFor(OWNER), home, 'Filmmaker');
    expireKeptCheck('Check your BVN again to continue.');
    const { result } = await renderHook(() => useCheckNotice(OWNER));
    expect(result.current).toEqual({ notice: 'Check your BVN again to continue.', addressKept: true });
    await act(async () => {
      keepCheck(ticketFor(OWNER), { ...check, checkHandle: 'v1.k03-test-handle-2' });
    });
    expect(result.current).toBeNull();
    expect(readHandle(OWNER)).toBe('v1.k03-test-handle-2');
    expect(readAddress(OWNER)).toEqual(home);
    expect(readOccupation(OWNER)).toBe('Filmmaker');
  });

  it('the sentence is for this account only, and says nothing of an address when none was typed', async () => {
    keepCheck(ticketFor(OWNER), check);
    expireKeptCheck('Check your BVN again to continue.');
    const mine = await renderHook(() => useCheckNotice(OWNER));
    expect(mine.result.current).toEqual({ notice: 'Check your BVN again to continue.', addressKept: false });
    const theirs = await renderHook(() => useCheckNotice('someone-else'));
    expect(theirs.result.current).toBeNull();
  });

  it('the session end, or leaving the flow, still forgets it all', () => {
    keepCheck(ticketFor(OWNER), check);
    keepAddress(ticketFor(OWNER), home, 'Filmmaker');
    expireKeptCheck('Check your BVN again to continue.');
    forgetKeptCheck();
    expect(readAddress(OWNER)).toBeNull();
    expect(readOccupation(OWNER)).toBeNull();
    expect(isKeptFor(OWNER)).toBe(false);
  });
});

describe('the selfie the server takes', () => {
  it('is plain base64 from 1 KB of image up to the server’s 100,000 characters', () => {
    expect(SELFIE_MIN_BASE64_CHARS).toBe(1368);
    expect(isSendableSelfie('A'.repeat(1368))).toBe(true);
    expect(isSendableSelfie('A'.repeat(1364))).toBe(false);
    expect(isSendableSelfie('A'.repeat(100_000))).toBe(true);
    expect(isSendableSelfie('A'.repeat(100_004))).toBe(false);
    expect(isSendableSelfie(`data:image/jpeg;base64,${'A'.repeat(2000)}`)).toBe(false);
  });
});

describe('leaving Open your wallet', () => {
  it('dismisses every Open your wallet screen at once, and knows when nothing is under them', () => {
    const route = (name: string) => ({ name });
    expect(flowDepth({ routes: [route('(tabs)'), route('open-wallet'), route('open-wallet-details'), route('open-wallet-selfie')] })).toEqual({ depth: 3, below: true });
    expect(flowDepth({ routes: [route('(tabs)'), route('payout-account'), route('open-wallet')] })).toEqual({ depth: 1, below: true });
    expect(flowDepth({ routes: [route('open-wallet-selfie')] })).toEqual({ depth: 1, below: false });
    expect(flowDepth(undefined)).toEqual({ depth: 0, below: false });
  });
});

describe('the ways out of A5 and A6', () => {
  beforeEach(() => Object.values(mockRouter).forEach((fn) => fn.mockClear()));
  const route = (name: string) => ({ name });

  it('leaving goes back to whatever opened Open your wallet, dismissing all of its screens', async () => {
    mockRoutes = [route('(tabs)'), route('open-wallet'), route('open-wallet-details'), route('open-wallet-selfie')];
    const { result } = await renderHook(() => useOpenWalletWay());
    result.current.leave();
    expect(mockRouter.dismiss).toHaveBeenCalledWith(3);
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('with nothing under the flow (a link, a reload), every flow screen goes and Home takes their place', async () => {
    mockRoutes = [route('open-wallet'), route('open-wallet-details'), route('open-wallet-selfie')];
    const { result } = await renderHook(() => useOpenWalletWay());
    result.current.leave();
    expect(mockRouter.dismiss).toHaveBeenCalledWith(2);
    expect(mockRouter.replace).toHaveBeenCalledWith('/');
  });

  it('starting again forgets the kept check and its handle, keeps the address with the server’s sentence, and goes down to A26', async () => {
    keepCheck(ticketFor(OWNER), check);
    keepAddress(ticketFor(OWNER), { street: '14 Admiralty Way', city: 'Lekki', state: 'Lagos' }, 'Filmmaker');
    const { result } = await renderHook(() => useOpenWalletWay());
    result.current.restart('Check your BVN again to continue.');
    expect(readKeptCheck(OWNER)).toBeNull();
    expect(readHandle(OWNER)).toBeNull();
    expect(readAddress(OWNER)).toEqual({ street: '14 Admiralty Way', city: 'Lekki', state: 'Lagos' });
    expect(readOccupation(OWNER)).toBe('Filmmaker');
    const notice = await renderHook(() => useCheckNotice(OWNER));
    expect(notice.result.current?.notice).toBe('Check your BVN again to continue.');
    expect(mockRouter.dismissTo).toHaveBeenCalledWith('/open-wallet');
  });
});
