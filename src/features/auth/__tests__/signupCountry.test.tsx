import { fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ApiError } from '@/api/errors';
import type { GeoCountry } from '@/features/geo/geoApi';

import { SignUpScreen, type SignUpScreenProps, type SignUpValues } from '../SignUpScreen';
import { maskedPhone } from '../signupFlow';
import { signupFailure, TEXT_REACH_LINE } from '../signupFailure';

const country = (code: string, name: string, dialCode: string | null, flag: string, exampleNational: string | null): GeoCountry => ({
  code,
  name,
  dialCode,
  flag,
  exampleNumber: null,
  exampleNational,
  hasRegions: true,
});
/** The Hub's list in its own shape (`GET /geo/countries`, A to Z by name), cut to the countries these cases use. */
const COUNTRIES: GeoCountry[] = [
  country('AQ', 'Antarctica', null, '🇦🇶', null),
  country('GH', 'Ghana', '+233', '🇬🇭', '024 123 4567'),
  country('NG', 'Nigeria', '+234', '🇳🇬', '0802 123 4567'),
  country('GB', 'United Kingdom', '+44', '🇬🇧', '07400 123456'),
  country('US', 'United States', '+1', '🇺🇸', '(201) 555-0123'),
];

function frame(props: Partial<SignUpScreenProps> = {}) {
  return (
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <SignUpScreen onContinue={jest.fn(async (_values: SignUpValues) => undefined)} countries={COUNTRIES} region={null} channel="email" {...props} />
    </SafeAreaProvider>
  );
}

async function fillAll(phone: string) {
  await fireEvent.changeText(screen.getByTestId('sign-up-first-name'), 'Ama');
  await fireEvent.changeText(screen.getByTestId('sign-up-last-name'), 'Mensah');
  await fireEvent.changeText(screen.getByTestId('sign-up-username'), '@ama_m');
  await fireEvent.changeText(screen.getByTestId('sign-up-email'), 'ama@example.com');
  await fireEvent.changeText(screen.getByTestId('sign-up-phone'), phone);
  await fireEvent.changeText(screen.getByTestId('sign-up-password'), 'hunter2hunter2');
  await fireEvent.press(screen.getByTestId('sign-up-consent'));
}

describe('A3: the phone field has a country, and sign-up asks the country of residence (GEO-03, R-85)', () => {
  it('a user with no country set on the phone starts on Nigeria, types 0803... and Continue sends +234 with Nigeria as the country', async () => {
    const onContinue = jest.fn(async (_values: SignUpValues) => undefined);
    await render(frame({ onContinue }));
    expect(screen.getByTestId('sign-up-phone-country')).toHaveTextContent(/\+234/);
    await fireEvent.changeText(screen.getByTestId('sign-up-phone'), '08031234412');
    expect(screen.getByTestId('sign-up-phone').props.value).toBe('0803 123 4412');
    await fillAll('08031234412');
    await fireEvent.press(screen.getByText('Continue'));
    await waitFor(() => expect(onContinue).toHaveBeenCalledTimes(1));
    expect(onContinue).toHaveBeenCalledWith({
      firstName: 'Ama',
      lastName: 'Mensah',
      username: 'ama_m',
      email: 'ama@example.com',
      phone: '+2348031234412',
      countryCode: 'NG',
      password: 'hunter2hunter2',
    });
  });

  it('a phone set to Ghana starts the field on Ghana, and the country of residence is Ghana too', async () => {
    const onContinue = jest.fn(async (_values: SignUpValues) => undefined);
    await render(frame({ onContinue, region: 'GH' }));
    expect(screen.getByTestId('sign-up-phone-country')).toHaveTextContent(/\+233/);
    expect(screen.getByTestId('sign-up-country')).toHaveTextContent(/Ghana/);
    expect(screen.getByTestId('sign-up-phone').props.placeholder).toBe('024 123 4567');
    await fillAll('024 123 4567');
    await fireEvent.press(screen.getByText('Continue'));
    await waitFor(() => expect(onContinue).toHaveBeenCalledTimes(1));
    expect(onContinue).toHaveBeenCalledWith(expect.objectContaining({ phone: '+233241234567', countryCode: 'GH' }));
  });

  it('a user picks a country from the list by searching its name, and the field is read in that country', async () => {
    const onContinue = jest.fn(async (_values: SignUpValues) => undefined);
    await render(frame({ onContinue }));
    await fireEvent.press(screen.getByTestId('sign-up-phone-country'));
    const sheet = await screen.findByTestId('sign-up-phone-sheet');
    // A country with no calling code (Antarctica) is not offered for a phone.
    expect(within(sheet).queryByText('Antarctica')).toBeNull();
    await fireEvent.changeText(screen.getByTestId('sign-up-phone-sheet-search'), 'united k');
    expect(screen.getByTestId('sign-up-phone-sheet-row-GB')).toBeTruthy();
    expect(screen.queryByTestId('sign-up-phone-sheet-row-GH')).toBeNull();
    await fireEvent.press(screen.getByTestId('sign-up-phone-sheet-row-GB'));
    expect(screen.getByTestId('sign-up-phone-country')).toHaveTextContent(/\+44/);
    // The residence follows the phone until the person chooses their own.
    expect(screen.getByTestId('sign-up-country')).toHaveTextContent(/United Kingdom/);
    await fillAll('07911 123456');
    expect(screen.getByTestId('sign-up-phone').props.value).toBe('07911 123456');
    await fireEvent.press(screen.getByText('Continue'));
    await waitFor(() => expect(onContinue).toHaveBeenCalledTimes(1));
    expect(onContinue).toHaveBeenCalledWith(expect.objectContaining({ phone: '+447911123456', countryCode: 'GB' }));
  });

  it('a user can search by calling code', async () => {
    await render(frame());
    await fireEvent.press(screen.getByTestId('sign-up-phone-country'));
    await fireEvent.changeText(await screen.findByTestId('sign-up-phone-sheet-search'), '+23');
    expect(screen.getByTestId('sign-up-phone-sheet-row-GH')).toBeTruthy();
    expect(screen.getByTestId('sign-up-phone-sheet-row-NG')).toBeTruthy();
    expect(screen.queryByTestId('sign-up-phone-sheet-row-GB')).toBeNull();
  });

  it('a pasted number written with its country code moves the country to it', async () => {
    await render(frame());
    await fireEvent.changeText(screen.getByTestId('sign-up-phone'), '+233241234567');
    expect(screen.getByTestId('sign-up-phone-country')).toHaveTextContent(/\+233/);
    expect(screen.getByTestId('sign-up-country')).toHaveTextContent(/Ghana/);
  });

  it('a user who chooses a different country of residence keeps it when the phone changes', async () => {
    const onContinue = jest.fn(async (_values: SignUpValues) => undefined);
    await render(frame({ onContinue }));
    await fireEvent.press(screen.getByTestId('sign-up-country'));
    await fireEvent.press(await screen.findByTestId('sign-up-country-sheet-row-US'));
    expect(screen.getByTestId('sign-up-country')).toHaveTextContent(/United States/);
    await fireEvent.press(screen.getByTestId('sign-up-phone-country'));
    await fireEvent.press(await screen.findByTestId('sign-up-phone-sheet-row-GH'));
    expect(screen.getByTestId('sign-up-country')).toHaveTextContent(/United States/);
    await fillAll('024 123 4567');
    await fireEvent.press(screen.getByText('Continue'));
    await waitFor(() => expect(onContinue).toHaveBeenCalledTimes(1));
    expect(onContinue).toHaveBeenCalledWith(expect.objectContaining({ phone: '+233241234567', countryCode: 'US' }));
  });

  it('a number that is not valid for its country is stopped on the phone, naming the country and how its numbers are written', async () => {
    const onContinue = jest.fn(async (_values: SignUpValues) => undefined);
    await render(frame({ onContinue, region: 'GH' }));
    await fillAll('12 345');
    await fireEvent.press(screen.getByText('Continue'));
    expect(await screen.findByText('Enter a valid Ghana number, like 024 123 4567.')).toBeTruthy();
    expect(onContinue).not.toHaveBeenCalled();
  });

  it('with the list of countries still on its way, a Nigerian number can be typed and sent without a country of residence', async () => {
    const onContinue = jest.fn(async (_values: SignUpValues) => undefined);
    await render(frame({ onContinue, countries: undefined }));
    await fillAll('0803 123 4412');
    await fireEvent.press(screen.getByText('Continue'));
    await waitFor(() => expect(onContinue).toHaveBeenCalledTimes(1));
    expect(onContinue).toHaveBeenCalledWith(expect.objectContaining({ phone: '+2348031234412' }));
    expect(onContinue.mock.calls[0][0]).not.toHaveProperty('countryCode');
  });

  it('when the list did not load, the country sheet says so and offers to try again', async () => {
    const onRetryCountries = jest.fn();
    await render(frame({ countries: undefined, countriesFailed: true, onRetryCountries }));
    await fireEvent.press(screen.getByTestId('sign-up-phone-country'));
    expect(await screen.findByText('The list did not load')).toBeTruthy();
    await fireEvent.press(screen.getByText('Try again'));
    expect(onRetryCountries).toHaveBeenCalledTimes(1);
  });

  it('a texted code says plainly which numbers it reaches when the number is from outside Nigeria, and says nothing for a mailed one', async () => {
    await render(frame({ channel: 'phone', region: 'NG' }));
    expect(screen.queryByText(TEXT_REACH_LINE)).toBeNull();
    await fireEvent.press(screen.getByTestId('sign-up-phone-country'));
    await fireEvent.press(await screen.findByTestId('sign-up-phone-sheet-row-GH'));
    expect(screen.getByText(TEXT_REACH_LINE)).toBeTruthy();
  });

  it.each([['email'], [null]] as const)('with the channel %s, a Ghanaian number is told nothing about texts (the line is only for a texted code)', async (channel) => {
    await render(frame({ channel, region: 'NG' }));
    await fireEvent.press(screen.getByTestId('sign-up-phone-country'));
    await fireEvent.press(await screen.findByTestId('sign-up-phone-sheet-row-GH'));
    // Ghana really is the phone's country now, so a hint that ignored the channel would show.
    expect(screen.getByTestId('sign-up-phone-country')).toHaveTextContent(/\+233/);
    expect(screen.queryByText(TEXT_REACH_LINE)).toBeNull();
  });

  it('the Hub\'s refusals of a number say what the rule is, never "Nigerian number"', async () => {
    const refused = (code: string) => new ApiError('validation', 400, 'x', code);
    const notSupported = signupFailure(refused('PHONE_NOT_SUPPORTED'));
    expect(notSupported).toMatchObject({ title: "We can't use that number yet", body: TEXT_REACH_LINE, field: 'phone' });
    expect(`${notSupported.title} ${notSupported.body}`).not.toMatch(/Nigerian/);
    expect(signupFailure(refused('PHONE_INVALID'), { name: 'Ghana', exampleNational: '024 123 4567' })).toMatchObject({
      body: 'Enter a valid Ghana number, like 024 123 4567, or choose another country.',
      field: 'phone',
    });
    expect(signupFailure(refused('PHONE_INVALID')).body).toBe('Check it and try again.');
    expect(signupFailure(refused('COUNTRY_INVALID'))).toMatchObject({ title: 'Choose a country from the list', field: 'country' });
  });

  it('the number on the code screen keeps its own country code', () => {
    expect(maskedPhone('+2348031234412')).toBe('0803 ••• 4412');
    expect(maskedPhone('+233241234567')).toBe('+233 ••• 4567');
    expect(maskedPhone('+447911123456')).toBe('+44 ••• 3456');
  });
});
