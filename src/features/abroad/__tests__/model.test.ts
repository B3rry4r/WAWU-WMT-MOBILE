import {
  approvalPurpose,
  fieldProblem,
  fieldsOf,
  formatMinor,
  isSettled,
  overBalanceLine,
  rangeLine,
  readHeldQuote,
  speedLine,
  statusLook,
  totalFromAccount,
  typedAmountLine,
  wawuFeeText,
  type Field,
  type Rail,
} from '../model';

const digits = (key: string, pattern: string | null): Field => ({
  key,
  label: 'Sort code',
  kind: 'digits',
  pattern,
  hint: '6 digits',
  options: null,
});

describe('send abroad · what the screens say', () => {
  it('a user sees every figure with its currency and the decimals the Hub names', () => {
    expect(formatMinor(1234, 'USD')).toBe('$12.34');
    expect(formatMinor(100361, 'GHS')).toBe('GH₵1,003.61');
    expect(formatMinor(632844, 'KES')).toBe('KES 6,328.44');
    expect(formatMinor(98523, 'NGN')).toBe('₦985.23');
    expect(formatMinor(5, 'GBP')).toBe('£0.05');
    expect(formatMinor(1200, 'JPY', 0)).toBe('JPY 1,200');
  });

  it("a field is checked against the Hub's own pattern, ignoring spaces in a number", () => {
    const f = digits('sort_code', '^[0-9]{6}$');
    expect(fieldProblem(f, '04 00 04')).toBeNull();
    expect(fieldProblem(f, '0400')).toBe('Sort code: 6 digits.');
    expect(fieldProblem(f, '  ')).toBe('Enter the sort code.');
    const choice: Field = {
      key: 'account_type',
      label: 'Account type',
      kind: 'choice',
      pattern: null,
      hint: null,
      options: [{ value: 'checking', label: 'Checking' }],
    };
    expect(fieldProblem(choice, 'current')).toBe('Choose the account type.');
    expect(fieldProblem(choice, 'checking')).toBeNull();
  });

  it("the fields of a way are the chosen scheme's, else the first", () => {
    const rail = {
      method: 'bank',
      label: 'Bank account',
      directory: false,
      minReceiveMinor: null,
      maxReceiveMinor: null,
      schemes: [
        {
          id: 'eft',
          label: 'EFT',
          speed: 'Same day',
          fields: [digits('a', null)],
        },
        {
          id: 'interac_email',
          label: 'Interac',
          speed: 'Instant',
          fields: [digits('email', null)],
        },
      ],
    } as Rail;
    expect(fieldsOf(rail, 'interac_email').map((f) => f.key)).toEqual(['email']);
    expect(fieldsOf(rail, null).map((f) => f.key)).toEqual(['a']);
  });

  it('a send says where it stands in words that never name the partner, and only a decided one stops being read', () => {
    expect(statusLook('pending').label).toBe('On its way');
    expect(statusLook('sending').line).toContain('do not need to send it again');
    expect(statusLook('needs_review').line).toContain('do not need to send it again');
    expect(statusLook('failed').tone).toBe('danger');
    for (const s of ['pending', 'sending', 'needs_review'] as const) expect(isSettled(s)).toBe(false);
    for (const s of ['completed', 'failed', 'reversed', 'cancelled'] as const) expect(isSettled(s)).toBe(true);
    for (const s of ['pending', 'sending', 'needs_review', 'completed', 'failed', 'reversed', 'cancelled'] as const) {
      const look = statusLook(s);
      expect(`${look.label} ${look.line}`).not.toMatch(/Nuvion|Fintava|—/);
    }
    expect(speedLine('Instant')).toBe('Arrives in minutes');
    expect(speedLine('Same day')).toBe('Arrives: same day');
  });

  it('the PIN sheet says what is being approved, in the currency sent', () => {
    expect(
      approvalPurpose({ amountFromMinor: 10000, fromCurrency: 'USD', fromDecimals: 2 }, { holderName: 'Ama Mensah', countryName: 'Ghana' }),
    ).toBe('Send $100.00 to Ama Mensah in Ghana');
  });

  it('a held quote read from an address must be whole; anything else is refused', () => {
    const quote = {
      id: 'q',
      recipientId: 'r',
      fromCurrency: 'USD',
      toCurrency: 'GHS',
      fromDecimals: 2,
      toDecimals: 2,
      amountFromMinor: 5000,
      amountToMinor: 50180,
      converted: true,
      rate: '10.036105',
      providerFeeMinor: null,
      wawuFeeKobo: 0,
      speed: 'Same day',
      expiresAt: '2026-10-24T12:00:00.000Z',
      validForSeconds: 179,
    };
    expect(readHeldQuote(JSON.stringify(quote))?.id).toBe('q');
    expect(readHeldQuote(JSON.stringify({ ...quote, amountFromMinor: 50.5 }))).toBeNull();
    expect(readHeldQuote(JSON.stringify({ ...quote, providerFeeMinor: 150 }))?.providerFeeMinor).toBe(150);
    expect(readHeldQuote(JSON.stringify({ ...quote, providerFeeMinor: 1.5 }))).toBeNull();
    expect(readHeldQuote(JSON.stringify({ ...quote, providerFeeMinor: '150' }))).toBeNull();
    expect(readHeldQuote('not json')).toBeNull();
    expect(readHeldQuote(undefined)).toBeNull();
  });

  it("the total that leaves the account: the amount and the partner's fee, WAWU's naira fee only from the naira wallet, nothing when no fee is named (R-10)", () => {
    const usd = {
      fromCurrency: 'USD',
      amountFromMinor: 10_000,
      providerFeeMinor: 150,
      wawuFeeKobo: 2_500,
    };
    expect(totalFromAccount(usd)).toBe(10_150);
    expect(
      totalFromAccount({
        ...usd,
        fromCurrency: 'NGN',
        amountFromMinor: 1_000_000,
        providerFeeMinor: 0,
      }),
    ).toBe(1_002_500);
    expect(totalFromAccount({ ...usd, providerFeeMinor: null })).toBeNull();
  });
});

describe('send abroad from a foreign account · WAWU fee (WALLET-42)', () => {
  const base = {
    amountFromMinor: 300,
    providerFeeMinor: 112,
    wawuFeeKobo: 0,
    fromCurrency: 'GBP',
    fromDecimals: 2,
  };
  it('counts WAWU fee taken from the sending account in the total, and the naira fee only from the naira wallet', () => {
    expect(totalFromAccount({ ...base, wawuFeeMinor: 150 })).toBe(562);
    expect(totalFromAccount(base)).toBe(412);
    expect(totalFromAccount({ ...base, fromCurrency: 'NGN', wawuFeeKobo: 2500 })).toBe(2912);
    expect(totalFromAccount({ ...base, providerFeeMinor: null, wawuFeeMinor: 150 })).toBeNull();
  });

  it('says the fee in the currency it is taken in, and never a naira figure for a foreign account with no fee', () => {
    expect(wawuFeeText({ ...base, wawuFeeMinor: 150 })).toBe('£1.50');
    expect(wawuFeeText({ ...base, wawuFeeKobo: 2500, fromCurrency: 'USD' })).toBe('₦25.00');
    expect(wawuFeeText(base)).toBe('£0.00');
    expect(wawuFeeText({ ...base, fromCurrency: 'NGN' })).toBe('₦0.00');
  });

  it('reads a held quote with or without the foreign fee, and refuses one that is not a whole number', () => {
    const quote = {
      id: 'q',
      recipientId: 'r',
      fromCurrency: 'GBP',
      toCurrency: 'GHS',
      amountFromMinor: 300,
      amountToMinor: 4026,
      fromDecimals: 2,
      toDecimals: 2,
      wawuFeeKobo: 0,
      providerFeeMinor: null,
      expiresAt: '2026-10-24T10:00:00.000Z',
      speed: 'Instant',
      converted: true,
    };
    expect(readHeldQuote(JSON.stringify({ ...quote, wawuFeeMinor: 150 }))?.wawuFeeMinor).toBe(150);
    expect(readHeldQuote(JSON.stringify(quote))).not.toBeNull();
    expect(readHeldQuote(JSON.stringify({ ...quote, wawuFeeMinor: 1.5 }))).toBeNull();
  });
});

describe('send abroad · the amount as it is typed (FX-POLISH P6)', () => {
  it('groups the whole part by thousands and pads the places to the currency once a point is typed', () => {
    expect(typedAmountLine('NGN', '', 2)).toBe('₦0');
    expect(typedAmountLine('NGN', '1000', 2)).toBe('₦1,000');
    expect(typedAmountLine('GBP', '0.5', 2)).toBe('£0.50');
    expect(typedAmountLine('GBP', '1250.', 2)).toBe('£1,250.00');
    expect(typedAmountLine('GHS', '1234567.25', 2)).toBe('GH₵1,234,567.25');
    expect(typedAmountLine('KES', '6328', 0)).toBe('KES 6,328');
  });
});

describe('send abroad · the right sentence for an amount that does not go (FX-POLISH P3)', () => {
  const refusal = (over: Partial<Parameters<typeof rangeLine>[0]>) => ({
    code: 'amount_out_of_range',
    message: 'That is more than this corridor can deliver.',
    fields: [],
    minimumMinor: 500,
    maximumMinor: 2_500_000,
    currency: 'GHS',
    ...over,
  });

  it('says it is over the most when the corridor says more, and never quotes the least then', () => {
    expect(rangeLine(refusal({}), 'send', 99_000_000, 'GHS')).toBe('That is more than this corridor can deliver. The most they can get is GH₵25,000.00.');
  });

  it('says it is under the least when the corridor says less', () => {
    expect(rangeLine(refusal({ message: 'That is less than this corridor can deliver.' }), 'send', 10, 'GHS')).toBe(
      'That is less than this corridor can deliver. The least they can get is GH₵5.00.',
    );
  });

  it('reads the direction from what was typed when they receive that amount', () => {
    expect(rangeLine(refusal({ message: 'x' }), 'receive', 100, 'GHS')).toContain('The least they can get is GH₵5.00.');
    expect(rangeLine(refusal({ message: 'x' }), 'receive', 99_000_000, 'GHS')).toContain('The most they can get is GH₵25,000.00.');
  });

  it('with no most, a corridor can only have been under its least', () => {
    expect(rangeLine(refusal({ message: '', maximumMinor: null }), 'send', 10, 'GHS')).toBe('That is less than this corridor can deliver. The least they can get is GH₵5.00.');
  });

  it('with no word on which way, it gives the whole range', () => {
    expect(rangeLine(refusal({ message: 'Out of range.' }), 'send', 10, 'GHS')).toBe('Out of range. This corridor delivers from GH₵5.00 to GH₵25,000.00.');
  });

  it('says an amount over the balance is over the balance, with the balance', () => {
    expect(overBalanceLine('British pound account', 73, 'GBP', 2)).toBe('That is more than the £0.73 in your British pound account.');
  });
});
