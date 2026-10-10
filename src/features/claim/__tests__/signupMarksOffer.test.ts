import { confirmPhone } from '@/features/auth/signupFlow';

const order: string[] = [];
jest.mock('@/api/identity', () => ({
  ...jest.requireActual('@/api/identity'),
  phoneVerifyConfirmRequest: jest.fn(async () => ({ accessToken: 'new-access', refreshToken: 'new-refresh' })),
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
jest.mock('@/features/auth/signupStore', () => ({
  ...jest.requireActual('@/features/auth/signupStore'),
  heldSignup: () => ({ phone: '+2348031234567', attempt: 'secret' }),
  clearSignup: jest.fn(async () => {
    order.push('clear');
  }),
}));


describe('sign-up hands the new account to the "Have an access code?" step (JOIN-03 round 2)', () => {
  it('marks the account from its first token before the session is adopted, so the first signed-in screen is the step', async () => {
    order.length = 0;
    await confirmPhone('123456', '');
    expect(order).toEqual(['clear', 'mark:new-access', 'adopt']);
  });
});
