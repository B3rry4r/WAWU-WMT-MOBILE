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

/**
 * Tokens shaped as WAWU ID's: a header, the claims (with a person's name and
 * email), a signature. The claims are fixed, so the encoded payload is too:
 * the first holds both base64url-only characters (`-` and `_`) and has no
 * padding; the second has a non-ASCII `sub` and another padding length.
 */
const realClaims = {
  sub: '6c1f2a9e-4b7d-4e2a-9c3f-8d5e7b1a0f42',
  email: 'personx@example.test',
  firstName: 'Ngozi',
  lastName: 'Ọ̀kọ̀',
  avatarUrl: 'https://cdn.example.test/u/a.png?v=10',
  iat: 1791043200,
  exp: 1791044100,
};
const unicodeClaims = { sub: 'Ọ̀kọ̀-100', name: 'Ngozi Ọ̀kọ̀', email: 'p@example.test' };
const b64url = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
const header = b64url({ alg: 'RS256', typ: 'JWT', kid: 'wawu-id-1' });
const signature = 'MEUCIQDx-_signature_part';

describe('reading the account from a real-shaped token', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { accountOfToken } = require('../sessionAccount') as typeof import('../sessionAccount');

  it('the test payloads hold what they claim to (base64url-only characters, no padding, other lengths)', () => {
    const real = b64url(realClaims);
    expect(real).toContain('-');
    expect(real).toContain('_');
    expect(real).not.toContain('=');
    expect(real.length % 4).toBe(2);
    expect(b64url(unicodeClaims).length % 4).toBe(3);
  });

  it('a payload with - and _ and no padding gives its sub', () => {
    expect(accountOfToken(`${header}.${b64url(realClaims)}.${signature}`)).toBe(realClaims.sub);
  });

  it('the same payload with its padding written out gives the same sub', () => {
    const real = b64url(realClaims);
    expect(accountOfToken(`${header}.${real}${'='.repeat((4 - (real.length % 4)) % 4)}.${signature}`)).toBe(realClaims.sub);
  });

  it('non-ASCII text in the claims is read as UTF-8, whole', () => {
    expect(accountOfToken(`${header}.${b64url(unicodeClaims)}.${signature}`)).toBe('Ọ̀kọ̀-100');
  });

  it('a token that is not a readable three-part token yields no account', () => {
    const real = b64url(realClaims);
    const bytes = (values: number[]) => Buffer.from(values).toString('base64url');
    for (const token of [
      '',
      `${header}.${real}`, // two parts
      `${header}.${real}.${signature}.extra`, // four parts
      `${header}.${real.replace('-', '+')}.${signature}`, // base64, not base64url
      `${header}.${real.replace('_', '/')}.${signature}`,
      `${header}.${real} .${signature}`, // a space
      `${header}.${real.slice(0, 4 * Math.floor(real.length / 4) + 1)}.${signature}`, // a length base64 cannot have
      `${header}.${bytes([0xff, 0xfe, 0x7b])}.${signature}`, // bytes that are not UTF-8
      `${header}.${b64url(['not', 'claims'])}.${signature}`, // JSON that is not an object
      `${header}.${Buffer.from('null').toString('base64url')}.${signature}`,
      `${header}.${b64url({ sub: 42 })}.${signature}`, // sub not a string
      `${header}.${Buffer.from('{"sub":"a"').toString('base64url')}.${signature}`, // cut JSON
    ]) {
      expect(accountOfToken(token)).toBeNull();
    }
  });
});
