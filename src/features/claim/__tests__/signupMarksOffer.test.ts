import { confirmEmailCode, confirmPhone } from '@/features/auth/signupFlow';

const order: string[] = [];
let mockEmailConfirm: () => Promise<unknown> = async () => ({ inSequence: true, step: 'creator_setup' });
jest.mock('@/api/identity', () => ({
  ...jest.requireActual('@/api/identity'),
  phoneVerifyConfirmRequest: jest.fn(async () => ({ accessToken: 'new-access', refreshToken: 'new-refresh' })),
  signupEmailConfirmRequest: jest.fn(() => mockEmailConfirm()),
}));
jest.mock('@/api/session', () => ({
  ...jest.requireActual('@/api/session'),
  adoptSession: jest.fn(async () => {
    order.push('adopt');
  }),
}));
jest.mock('../offerStep', () => ({
  ...jest.requireActual('../offerStep'),
  markOfferPending: jest.fn(async (token: string) => {
    order.push(`mark:${token}`);
  }),
}));
jest.mock('../freshToken', () => ({
  ...jest.requireActual('../freshToken'),
  noteContactProved: jest.fn(async () => {
    order.push('proved');
  }),
}));
jest.mock('@/features/auth/signupApi', () => ({
  authed: async (run: (token: string) => Promise<unknown>) => run('token'),
}));
jest.mock('@/features/auth/signupStore', () => ({
  ...jest.requireActual('@/features/auth/signupStore'),
  heldSignup: () => ({ phone: '+2348031234567', attempt: 'secret' }),
  clearSignup: jest.fn(async () => {
    order.push('clear');
  }),
}));

beforeEach(() => {
  order.length = 0;
  mockEmailConfirm = async () => ({ inSequence: true, step: 'creator_setup' });
});

describe('sign-up hands the new account to the "Have an access code?" step (JOIN-03 round 2)', () => {
  it('marks the account from its first token before the session is adopted, so the first signed-in screen is the step', async () => {
    await confirmPhone('123456', '');
    expect(order).toEqual(['clear', 'mark:new-access', 'adopt']);
  });
});

describe('the email step tells the claim a contact was just proven (JOIN-03 round 2, N1)', () => {
  it('notes the proof once the right code was accepted', async () => {
    await confirmEmailCode('123456');
    expect(order).toEqual(['proved']);
  });

  it('notes nothing when the code was not accepted', async () => {
    mockEmailConfirm = async () => {
      throw new Error('wrong code');
    };
    await expect(confirmEmailCode('000000')).rejects.toThrow('wrong code');
    expect(order).toEqual([]);
  });
});
