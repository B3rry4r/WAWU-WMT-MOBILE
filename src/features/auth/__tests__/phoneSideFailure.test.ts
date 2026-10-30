import { ApiError, CLIENT_HELP, CLIENT_TITLE, failureOf } from '@/api/errors';

import { resetFailure, signInFailure } from '../signInFailure';
import { emailOutcome, phoneOutcome, signupFailure } from '../signupFailure';

// WALK-FIX H4: a throw on the phone is not "No connection" and is not "our side" either.
describe('sign-in and sign-up say the phone threw, in their own words', () => {
  const phone = () => failureOf(new TypeError('serializer blew up'));
  const offline = () => failureOf(new TypeError('Network request failed'));
  beforeEach(() => jest.spyOn(console, 'error').mockImplementation(() => undefined));
  afterEach(() => jest.restoreAllMocks());

  it('sign-in and the reset request', () => {
    for (const read of [signInFailure, resetFailure]) {
      expect(read(phone())).toMatchObject({ title: CLIENT_TITLE, body: CLIENT_HELP, credentials: false });
      expect(read(offline())).toMatchObject({ title: 'No connection' });
      expect(read(new ApiError('server', 500, 'x'))).toMatchObject({ title: 'Something went wrong on our side' });
    }
  });

  it('the phone and email code steps, and the sign-up Continue', () => {
    expect(phoneOutcome(phone())).toMatchObject({ kind: 'notice', failure: { title: CLIENT_TITLE, body: CLIENT_HELP } });
    expect(emailOutcome(phone())).toMatchObject({ kind: 'notice', failure: { title: CLIENT_TITLE, body: CLIENT_HELP } });
    expect(signupFailure(phone())).toMatchObject({ title: CLIENT_TITLE, body: CLIENT_HELP });
    expect(signupFailure(offline())).toMatchObject({ title: 'No connection' });
  });
});
