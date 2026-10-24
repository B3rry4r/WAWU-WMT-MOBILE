/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));
jest.mock('expo-image-picker', () => ({ launchImageLibraryAsync: jest.fn() }));
jest.mock('expo-image-manipulator', () => ({ ImageManipulator: { manipulate: jest.fn() }, SaveFormat: { JPEG: 'jpeg', PNG: 'png', WEBP: 'webp' } }));
jest.mock('expo-file-system', () => ({ File: jest.fn(), Directory: jest.fn(), Paths: { cache: { uri: 'file:///cache/' } } }));

type Answer = { status: number; body: unknown };
type Sent = { method: string; path: string; body: unknown };

let answers: Record<string, Answer> = {};
let sent: Sent[] = [];

function installFetch() {
  globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(String(input), init);
    const path = new URL(request.url).pathname;
    const text = request.method === 'GET' ? '' : await request.text();
    sent.push({ method: request.method, path, body: text ? JSON.parse(text) : undefined });
    const answer = answers[`${request.method} ${path}`];
    if (!answer) return new Response(JSON.stringify({ statusCode: 404, message: 'Not Found', data: null }), { status: 404 });
    return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;
}

const ok = (data: unknown) => ({ status: 200, body: { statusCode: 200, message: 'OK', data } });
const refusal = (statusCode: number, message: string) => ({ status: statusCode, body: { statusCode, message, data: null } });

const ME = '/api/hub/users/me';
const FIELDS = '/api/hub/users/me/profile-fields';
const COUNTRIES = '/api/hub/geo/countries';

const profile = {
  wawuUserId: 'u1',
  firstName: 'Lennox',
  middleName: null,
  lastName: 'Emmanuel',
  handle: 'lennox',
  bio: 'Filmmaker.',
  avatarUrl: null,
  coverUrl: null,
  instagramHandle: null,
  tiktokHandle: null,
  xHandle: null,
  youtubeUrl: null,
  facebookUrl: null,
  linkedinUrl: null,
};
const place = { countryCode: 'NG', countryName: 'Nigeria', regionCode: 'NG-LA', regionName: 'Lagos', city: 'Ikeja' };
const details = { wawuUserId: 'u1', location: 'Lagos, Nigeria', ...place, skills: [], openTo: [], threadsHandle: null, socialOrder: [], memberSince: '2026-10-04T00:00:00.000Z' };

/** The Hub's lists in their own shape (`GET /geo/countries`, `GET /geo/countries/{code}/regions`), cut to the cases here. */
const country = (code: string, name: string, flag: string, hasRegions: boolean) => ({ code, name, dialCode: '+1', flag, exampleNumber: null, exampleNational: null, hasRegions });
const countryList = [country('GH', 'Ghana', '🇬🇭', true), country('NG', 'Nigeria', '🇳🇬', true), country('VA', 'Vatican City', '🇻🇦', false)];
const nigeria = { countryCode: 'NG', items: [{ code: 'NG-KN', name: 'Kano', type: 'State' }, { code: 'NG-LA', name: 'Lagos', type: 'State' }] };
const ghana = { countryCode: 'GH', items: [{ code: 'GH-AA', name: 'Greater Accra', type: 'Region' }, { code: 'GH-AH', name: 'Ashanti', type: 'Region' }] };

installFetch();
const { EditProfileScreen } = require('../EditProfileScreen') as typeof import('../EditProfileScreen');
const draft = require('../draft') as typeof import('../draft');

function serve(overrides: Record<string, Answer> = {}, fields: Record<string, unknown> = details) {
  answers = {
    [`GET ${ME}`]: ok(profile),
    [`GET ${FIELDS}`]: ok(fields),
    [`PATCH ${FIELDS}`]: ok(fields),
    [`GET ${COUNTRIES}`]: ok({ items: countryList }),
    [`GET ${COUNTRIES}/NG/regions`]: ok(nigeria),
    [`GET ${COUNTRIES}/GH/regions`]: ok(ghana),
    [`GET ${COUNTRIES}/VA/regions`]: ok({ countryCode: 'VA', items: [] }),
    ...overrides,
  };
}

async function boot() {
  const onSaved = jest.fn();
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false } } });
  await render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <QueryClientProvider client={client}>
        <EditProfileScreen onBack={jest.fn()} onOpenSocial={jest.fn()} onSaved={onSaved} ownNotice={false} />
      </QueryClientProvider>
    </SafeAreaProvider>,
  );
  return { onSaved };
}

beforeEach(() => {
  answers = {};
  sent = [];
  draft.clearDraft();
});

const fieldPatches = () => sent.filter((s) => s.method === 'PATCH' && s.path === FIELDS).map((s) => s.body);

describe('M8 · Edit profile: Country, then Region, then City (GEO-03, R-85)', () => {
  it('a user sees the country, the region in that country\'s own word, and the city they saved', async () => {
    serve();
    await boot();
    expect((await screen.findByTestId('edit-country')).props.accessibilityLabel).toContain('Nigeria');
    await waitFor(() => expect(screen.getByText('State')).toBeTruthy());
    expect(screen.getByTestId('edit-region').props.accessibilityLabel).toContain('Lagos');
    expect(screen.getByTestId('edit-city').props.value).toBe('Ikeja');
    expect(screen.queryByTestId('edit-location')).toBeNull();
  });

  it('a user picks another region from the country\'s list, and only the region and the line the web reads are sent', async () => {
    serve();
    const { onSaved } = await boot();
    await screen.findByText('State');
    await fireEvent.press(screen.getByTestId('edit-region'));
    const sheet = await screen.findByTestId('edit-region-sheet');
    expect(within(sheet).getByText('Choose your state')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('edit-region-sheet-row-NG-KN'));
    expect(screen.getByTestId('edit-region').props.accessibilityLabel).toContain('Kano');
    await fireEvent.press(screen.getByTestId('edit-save'));
    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(fieldPatches()).toEqual([{ regionCode: 'NG-KN', regionName: 'Kano', location: 'Ikeja, Kano, Nigeria' }]);
  });

  it('a user who changes the country loses the old region, picks one of the new country\'s, and the field says Region for Ghana', async () => {
    serve();
    const { onSaved } = await boot();
    await fireEvent.press(await screen.findByTestId('edit-country'));
    await fireEvent.changeText(await screen.findByTestId('edit-country-sheet-search'), 'gha');
    await fireEvent.press(screen.getByTestId('edit-country-sheet-row-GH'));
    await screen.findByText('Region');
    await waitFor(() => expect(screen.getByTestId('edit-region').props.accessibilityLabel).toContain('Choose your region'));
    expect(screen.getByTestId('edit-region').props.accessibilityLabel).not.toContain('Lagos');
    await fireEvent.press(screen.getByTestId('edit-region'));
    await fireEvent.press(await screen.findByTestId('edit-region-sheet-row-GH-AA'));
    await fireEvent.press(screen.getByTestId('edit-save'));
    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(fieldPatches()).toEqual([{ countryCode: 'GH', regionCode: 'GH-AA', regionName: 'Greater Accra', location: 'Ikeja, Greater Accra, Ghana' }]);
  });

  it('a country the Hub lists no regions for takes the region as text', async () => {
    serve();
    const { onSaved } = await boot();
    await fireEvent.press(await screen.findByTestId('edit-country'));
    await fireEvent.press(await screen.findByTestId('edit-country-sheet-row-VA'));
    const region = await screen.findByTestId('edit-region');
    await waitFor(() => expect(screen.getByTestId('edit-region').props.editable).toBe(true));
    await fireEvent.changeText(region, 'Vatican');
    await fireEvent.press(screen.getByTestId('edit-save'));
    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(fieldPatches()).toEqual([{ countryCode: 'VA', regionCode: null, regionName: 'Vatican', location: 'Ikeja, Vatican, Vatican City' }]);
  });

  it('a user who only types a city sends the city and the line, and nothing of the country', async () => {
    serve();
    const { onSaved } = await boot();
    await fireEvent.changeText(await screen.findByTestId('edit-city'), 'Surulere');
    await fireEvent.press(screen.getByTestId('edit-save'));
    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(fieldPatches()).toEqual([{ city: 'Surulere', location: 'Surulere, Lagos, Nigeria' }]);
  });

  it('a user with no place yet sees the region waiting on a country, and a city too long is stopped', async () => {
    serve({}, { ...details, countryCode: null, countryName: null, regionCode: null, regionName: null, city: null });
    await boot();
    expect((await screen.findByTestId('edit-region')).props.placeholder).toBe('Choose a country first');
    await fireEvent.changeText(screen.getByTestId('edit-city'), 'x'.repeat(81));
    expect(await screen.findByText('A city can be at most 80 characters.')).toBeTruthy();
    expect(screen.getByTestId('edit-save')).toBeDisabled();
  });

  it('the Hub\'s refusal of a place is said in the banner and what was chosen stays', async () => {
    serve({ [`PATCH ${FIELDS}`]: refusal(400, 'Choose a region of that country from the list.') });
    await boot();
    await fireEvent.changeText(await screen.findByTestId('edit-city'), 'Surulere');
    await fireEvent.press(screen.getByTestId('edit-save'));
    expect(await screen.findByText('Choose a region of that country from the list.')).toBeTruthy();
    expect(screen.getByTestId('edit-city').props.value).toBe('Surulere');
  });

  it('when the list of countries did not load, the sheet says so and offers to try again', async () => {
    serve({ [`GET ${COUNTRIES}`]: refusal(500, 'boom') });
    await boot();
    await fireEvent.press(await screen.findByTestId('edit-country'));
    expect(await screen.findByText('The list did not load')).toBeTruthy();
    answers[`GET ${COUNTRIES}`] = ok({ items: countryList });
    await fireEvent.press(screen.getByText('Try again'));
    expect(await screen.findByTestId('edit-country-sheet-row-GH')).toBeTruthy();
  });
});
