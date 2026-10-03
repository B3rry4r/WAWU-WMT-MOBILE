import { ApiError } from '@/api/errors';

import { retryAfterOf } from '../api/check';
import { checkFailure } from '../checkFailure';
import { isNoWallet, OPEN_WALLET_PATH, useOpenWalletEntry } from '../entry';
import { forgetKeptCheck, keepCheck, readKeptCheck, ticketFor } from '../keptCheck';
import { groupIdNumber, idDigits, isWholeIdNumber, localPhone, maskedIdNumber } from '../numbers';
import { waitPhrase } from '../wait';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('react', () => ({ ...jest.requireActual('react'), useMemo: (make: () => unknown) => make() }));

const refusal = (status: number, code: string, message: string) =>
  new ApiError(status === 409 ? 'conflict' : status === 429 ? 'rate_limited' : status >= 500 ? 'server' : 'validation', status, message, code);

describe('the numbers A26 takes and shows', () => {
  it('a user typing or pasting a BVN sees it grouped as A3 draws it, never more than 11 digits', () => {
    expect(groupIdNumber('2')).toBe('2');
    expect(groupIdNumber('22345')).toBe('2234 5');
    expect(groupIdNumber('22345678901')).toBe('2234 5678 901');
    expect(groupIdNumber(' 2234-5678-9012345 ')).toBe('2234 5678 901');
    expect(idDigits('2234 5678 901')).toBe('22345678901');
  });

  it('only a whole 11-digit number counts', () => {
    expect(isWholeIdNumber('2234 5678 901')).toBe(true);
    expect(isWholeIdNumber('2234 5678 90')).toBe(false);
    expect(isWholeIdNumber('')).toBe(false);
  });

  it('a number shown back carries only the last 4 digits the server answered', () => {
    expect(maskedIdNumber('8901')).toBe('•••• ••• 8901');
  });

  it('the account phone is written as A3 draws it; anything else is shown as stored', () => {
    expect(localPhone('+2348031234412')).toBe('0803 123 4412');
    expect(localPhone('+447700900123')).toBe('+447700900123');
  });
});

describe('where a refused BVN check shows', () => {
  it('A14 goes on the phone and an unknown BVN on the BVN, in the server’s words', () => {
    expect(checkFailure(refusal(422, 'bvn_phone_mismatch', "This isn't the number on your BVN. Use that one."))).toEqual({
      kind: 'field',
      field: 'phone',
      message: "This isn't the number on your BVN. Use that one.",
    });
    expect(checkFailure(refusal(422, 'bvn_not_confirmed', 'Not confirmed.'))).toMatchObject({ kind: 'field', field: 'bvn' });
  });

  it('a non-Nigerian account ends at "not available yet", and an open wallet ends the step', () => {
    expect(checkFailure(refusal(422, 'phone_not_nigerian', 'Nigerian phone needed.'))).toMatchObject({ kind: 'end', end: 'not_available' });
    expect(checkFailure(refusal(409, 'wallet_already_open', 'Open.'))).toMatchObject({ kind: 'end', end: 'wallet_open' });
  });

  it('a used-up day, a check that could not run, no connection and the address limit are banners', () => {
    expect(checkFailure(refusal(429, 'identity_checks_exhausted', 'Later.'))).toMatchObject({ kind: 'banner', tone: 'warning', body: 'Later.' });
    expect(checkFailure(refusal(503, 'provider_unreachable', 'Down.'))).toMatchObject({ kind: 'banner', tone: 'danger', body: 'Down.' });
    expect(checkFailure(new ApiError('network', 0, 'No connection.'))).toMatchObject({ kind: 'banner', title: 'No connection' });
    expect(checkFailure(new ApiError('rate_limited', 429, 'ThrottlerException: Too Many Requests'))).toMatchObject({
      kind: 'banner',
      title: 'Too many tries',
    });
    expect(checkFailure(new Error('boom'))).toMatchObject({ kind: 'banner', tone: 'danger' });
  });
});

describe('the way in from anything that moves money', () => {
  beforeEach(() => mockPush.mockClear());

  it('a user with no wallet whose payment is refused lands on A26; any other refusal is left to the payer', () => {
    const entry = useOpenWalletEntry();
    const noWallet = new ApiError('conflict', 409, "You don't have a wallet yet. Open your wallet to continue.", 'wallet_not_open');
    expect(isNoWallet(noWallet)).toBe(true);
    expect(entry.leadIfNoWallet(noWallet)).toBe(true);
    expect(mockPush).toHaveBeenCalledWith(OPEN_WALLET_PATH);

    mockPush.mockClear();
    for (const other of [
      new ApiError('conflict', 409, 'Your account is still being opened.', 'wallet_opening'),
      new ApiError('validation', 402, 'Short.', 'insufficient_funds'),
      new Error('wallet_not_open'),
    ]) {
      expect(entry.leadIfNoWallet(other)).toBe(false);
    }
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('the pay sheet’s no-wallet state opens A26', () => {
    useOpenWalletEntry().open();
    expect(mockPush).toHaveBeenCalledWith('/open-wallet');
  });
});

describe('the passed check kept for A5', () => {
  const check = {
    identity: { bvn: { last4: '0111', verifiedAt: '2026-10-03T10:00:00.000Z' }, ninLast4: '0999', occupation: null, checksLeft: 2 },
    prefill: { firstName: 'Ada', middleName: null, lastName: 'Eze', dateOfBirth: '1992-10-04', gender: 'female' as const },
  };

  it('belongs to the account that ran it, and is gone once forgotten', () => {
    expect(keepCheck(ticketFor('owner-a'), check)).toBe(true);
    expect(readKeptCheck('owner-a')?.prefill.firstName).toBe('Ada');
    expect(readKeptCheck('owner-b')).toBeNull();
    expect(readKeptCheck(undefined)).toBeNull();
    forgetKeptCheck();
    expect(readKeptCheck('owner-a')).toBeNull();
  });

  it('a check answer that arrives after anything was forgotten is refused, never kept', () => {
    const early = ticketFor('owner-a');
    forgetKeptCheck();
    expect(keepCheck(early, check)).toBe(false);
    expect(readKeptCheck('owner-a')).toBeNull();
    const ticket = ticketFor('owner-a');
    expect(keepCheck(ticket, check)).toBe(true);
    forgetKeptCheck();
    // A ticket writes only until the next forget; after it, never again.
    expect(keepCheck(ticket, check)).toBe(false);
    expect(readKeptCheck('owner-a')).toBeNull();
  });
});

describe('how long a limit says to wait', () => {
  it('a user is told the server’s wait in words, and "later" when it gave none', () => {
    expect(waitPhrase(null)).toBe('later');
    expect(waitPhrase(0)).toBe('later');
    expect(waitPhrase(42)).toBe('in under a minute');
    expect(waitPhrase(60)).toBe('in a minute');
    expect(waitPhrase(150)).toBe('in 3 minutes');
    expect(waitPhrase(300)).toBe('in about 5 minutes');
    expect(waitPhrase(1260)).toBe('in about 20 minutes');
    expect(waitPhrase(3448)).toBe('in about an hour');
    expect(waitPhrase(5400)).toBe('in about 2 hours');
    expect(waitPhrase(86400)).toBe('in about 24 hours');
  });

  it('the wait is the body’s reason.retryAfterSeconds, else the longest Retry-After header', () => {
    expect(retryAfterOf({ reason: { code: 'identity_checks_exhausted', message: 'x', retryAfterSeconds: 18000 } }, new Headers({ 'Retry-After-short': '60' }))).toBe(18000);
    expect(retryAfterOf({ statusCode: 429 }, new Headers({ 'Retry-After-short': '60', 'Retry-After-medium': '3448' }))).toBe(3448);
    expect(retryAfterOf(null, new Headers({ 'Retry-After': '120' }))).toBe(120);
    expect(retryAfterOf(undefined, new Headers({ 'Retry-After-short': 'soon' }))).toBeNull();
    expect(retryAfterOf({}, new Headers())).toBeNull();
  });

  it('the address limit with no figure says "Try again later.", never a made-up time', () => {
    expect(checkFailure(new ApiError('rate_limited', 429, 'ThrottlerException: Too Many Requests'))).toMatchObject({ body: 'Try again later.' });
    const counted = Object.assign(new ApiError('rate_limited', 429, 'Used.', 'identity_checks_exhausted'), { retryAfterSeconds: 7200 });
    expect(checkFailure(counted)).toMatchObject({ title: "You've used today's checks", body: 'Try again in about 2 hours.' });
    expect(checkFailure(new ApiError('rate_limited', 429, 'You have used today’s BVN checks. Try again later.', 'identity_checks_exhausted'))).toMatchObject({
      body: 'You have used today’s BVN checks. Try again later.',
    });
  });
});

describe('whose session it is', () => {
  it('reads the account id from the token’s sub claim, and nothing from a token it cannot read', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { accountOfToken } = require('../sessionAccount') as typeof import('../sessionAccount');
    const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
    expect(accountOfToken(`${part({ alg: 'RS256' })}.${part({ sub: 'acc-1', email: 'é@x' })}.sig`)).toBe('acc-1');
    expect(accountOfToken(null)).toBeNull();
    expect(accountOfToken('not-a-token')).toBeNull();
    expect(accountOfToken(`a.${part({ sub: '' })}.c`)).toBeNull();
    expect(accountOfToken(`a.${part({ email: 'x' })}.c`)).toBeNull();
    expect(accountOfToken('a.%%%.c')).toBeNull();
  });
});
