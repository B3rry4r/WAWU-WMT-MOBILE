/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

require('react-native-gesture-handler/jestSetup');

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));
jest.mock('expo-image-picker', () => ({ launchImageLibraryAsync: jest.fn() }));
jest.mock('expo-image-manipulator', () => ({ ImageManipulator: { manipulate: jest.fn() }, SaveFormat: { JPEG: 'jpeg', PNG: 'png', WEBP: 'webp' } }));
jest.mock('expo-file-system', () => ({ File: jest.fn(), Directory: jest.fn(), Paths: { cache: { uri: 'file:///cache/' } } }));

type Answer = { status: number; body: unknown } | 'offline';
type Sent = { method: string; path: string; body: unknown };
let answers: Record<string, Answer | Answer[]> = {};
let sent: Sent[] = [];

function installFetch() {
  globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(String(input), init);
    const path = new URL(request.url).pathname;
    const text = request.method === 'GET' ? '' : await request.text();
    sent.push({ method: request.method, path, body: text ? JSON.parse(text) : undefined });
    const queued = answers[`${request.method} ${path}`];
    const answer = Array.isArray(queued) ? (queued.length > 1 ? queued.shift()! : queued[0]) : queued;
    if (!answer) return new Response(JSON.stringify({ statusCode: 404, message: 'Not Found', data: null }), { status: 404 });
    if (answer === 'offline') throw new TypeError('Network request failed');
    return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;
}

const ok = (data: unknown, status = 200) => ({ status, body: { statusCode: status, message: 'OK', data } });
const refusal = (statusCode: number, message: string) => ({ status: statusCode, body: { statusCode, message, data: null } });

const ME = '/api/hub/users/me';
const FIELDS = '/api/hub/users/me/profile-fields';
const EXPERIENCE = '/api/hub/users/me/experience';

const role = (id: string, over: Record<string, unknown> = {}) => ({
  id,
  title: 'Founder, director',
  company: 'Lennox Films',
  location: 'Lagos',
  startedOn: '2021-03',
  endedOn: null,
  current: true,
  description: null,
  ...over,
});
const profile = (experience: unknown[]) => ({
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
  experience,
});
const details = (skills: string[]) => ({ wawuUserId: 'u1', location: 'Lagos, Nigeria', skills, openTo: [], threadsHandle: null, socialOrder: [], memberSince: '2026-10-04T00:00:00.000Z' });

installFetch();
const { EditProfileScreen } = require('../EditProfileScreen') as typeof import('../EditProfileScreen');
const { RoleScreen } = require('../RoleScreen') as typeof import('../RoleScreen');
const draft = require('../draft') as typeof import('../draft');
const { addSkill } = require('../skills') as typeof import('../skills');
const { roleBody, roleChanges, roleFormFrom, roleProblems, emptyRole } = require('../experience') as typeof import('../experience');

function frame(children: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false }, mutations: { retry: false } } });
  return (
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </SafeAreaProvider>
  );
}

beforeEach(() => {
  answers = {};
  sent = [];
  draft.clearDraft();
});

describe('skills typed on M8 (G-292)', () => {
  it('adds a trimmed skill, and refuses a repeat, an over-long one and a full list in words', () => {
    expect(addSkill(['Brand film'], '  Colour   grading ').list).toEqual(['Brand film', 'Colour grading']);
    expect(addSkill(['Brand film'], '   ').list).toEqual(['Brand film']);
    expect(addSkill(['Brand film'], 'brand FILM')).toEqual({ list: ['Brand film'], problem: 'That skill is already on your list.' });
    expect(addSkill([], 'a'.repeat(41)).problem).toMatch(/40 characters/);
    expect(addSkill(Array.from({ length: 30 }, (_, i) => `s${i}`), 'one more').problem).toMatch(/up to 30 skills/);
  });

  it('a user can add a skill and take one off, and Save sends the list to the profile details', async () => {
    answers = { [`GET ${ME}`]: ok(profile([])), [`GET ${FIELDS}`]: ok(details(['Pricing'])), [`PATCH ${FIELDS}`]: ok(details(['Pricing', 'Pitch decks'])) };
    const onSaved = jest.fn();
    await render(frame(<EditProfileScreen onBack={jest.fn()} onOpenSocial={jest.fn()} onSaved={onSaved} ownNotice={false} />));
    expect(await screen.findByTestId('edit-skill-Pricing')).toBeTruthy();
    expect(screen.getByTestId('edit-save').props.accessibilityState?.disabled).toBe(true);
    const input = screen.getByTestId('edit-skill-input');
    await fireEvent.changeText(input, 'Pitch decks');
    await fireEvent(input, 'submitEditing');
    expect(screen.getByTestId('edit-skill-Pitch decks')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('edit-skill-Pricing'));
    expect(screen.queryByTestId('edit-skill-Pricing')).toBeNull();
    await fireEvent.changeText(input, 'Pricing');
    await fireEvent(input, 'submitEditing');
    await fireEvent.press(screen.getByTestId('edit-save'));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    const patch = sent.filter((s) => s.method === 'PATCH');
    expect(patch).toHaveLength(1);
    expect(patch[0].path).toBe(FIELDS);
    expect(patch[0].body).toEqual({ skills: ['Pitch decks', 'Pricing'] });
  });

  it('says why a repeated skill was not added and leaves the list alone', async () => {
    answers = { [`GET ${ME}`]: ok(profile([])), [`GET ${FIELDS}`]: ok(details(['Pricing'])) };
    await render(frame(<EditProfileScreen onBack={jest.fn()} onOpenSocial={jest.fn()} onSaved={jest.fn()} />));
    const input = await screen.findByTestId('edit-skill-input');
    await fireEvent.changeText(input, 'pricing');
    await fireEvent(input, 'submitEditing');
    expect(await screen.findByText('That skill is already on your list.')).toBeTruthy();
    expect(screen.getByTestId('edit-save').props.accessibilityState?.disabled).toBe(true);
  });
});

describe('a skill typed and not added when Save is pressed (SWEEP-APP-8 L5, FIX-113)', () => {
  it('is added and saved with the rest: Save is on as soon as something is typed, and the PATCH carries the skill', async () => {
    answers = { [`GET ${ME}`]: ok(profile([])), [`GET ${FIELDS}`]: ok(details(['Pricing'])), [`PATCH ${FIELDS}`]: ok(details(['Pricing', 'Pitch decks'])) };
    const onSaved = jest.fn();
    await render(frame(<EditProfileScreen onBack={jest.fn()} onOpenSocial={jest.fn()} onSaved={onSaved} ownNotice={false} />));
    const input = await screen.findByTestId('edit-skill-input');
    expect(screen.getByTestId('edit-save').props.accessibilityState?.disabled).toBe(true);
    await fireEvent.changeText(input, '  Pitch   decks ');
    expect(screen.getByTestId('edit-save').props.accessibilityState?.disabled).toBeFalsy();
    await fireEvent.press(screen.getByTestId('edit-save'));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    const patch = sent.filter((s) => s.method === 'PATCH');
    expect(patch).toHaveLength(1);
    expect(patch[0].body).toEqual({ skills: ['Pricing', 'Pitch decks'] });
  });

  it('is added beside another change too, in the one PATCH of each part', async () => {
    answers = { [`GET ${ME}`]: ok(profile([])), [`GET ${FIELDS}`]: ok(details([])), [`PATCH ${FIELDS}`]: ok(details(['Pitch decks', 'Colour grading'])) };
    const onSaved = jest.fn();
    await render(frame(<EditProfileScreen onBack={jest.fn()} onOpenSocial={jest.fn()} onSaved={onSaved} ownNotice={false} />));
    const input = await screen.findByTestId('edit-skill-input');
    await fireEvent.changeText(input, 'Pitch decks');
    await fireEvent(input, 'submitEditing');
    await fireEvent.changeText(input, 'Colour grading');
    await fireEvent.press(screen.getByTestId('edit-save'));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    const patch = sent.filter((s) => s.method === 'PATCH');
    expect(patch).toHaveLength(1);
    expect(patch[0].body).toEqual({ skills: ['Pitch decks', 'Colour grading'] });
  });

  it('that cannot be added (a repeat) is asked about in words and nothing is saved', async () => {
    answers = { [`GET ${ME}`]: ok(profile([])), [`GET ${FIELDS}`]: ok(details(['Pricing'])) };
    const onSaved = jest.fn();
    await render(frame(<EditProfileScreen onBack={jest.fn()} onOpenSocial={jest.fn()} onSaved={onSaved} ownNotice={false} />));
    const input = await screen.findByTestId('edit-skill-input');
    await fireEvent.changeText(input, 'pricing');
    await fireEvent.press(screen.getByTestId('edit-save'));
    expect(await screen.findByText('That skill is already on your list.')).toBeTruthy();
    expect(sent.filter((s) => s.method === 'PATCH')).toHaveLength(0);
    expect(onSaved).not.toHaveBeenCalled();
  });
});

describe('Experience on M8 (G-292)', () => {
  it('lists the person\'s roles and "Add a role", and each opens the role screen', async () => {
    answers = { [`GET ${ME}`]: ok(profile([role('r1'), role('r2', { title: 'Brand strategist', company: 'Noah Agency', location: 'Lagos', startedOn: '2018-01', endedOn: '2021-02', current: false })])), [`GET ${FIELDS}`]: ok(details([])) };
    const onOpenRole = jest.fn();
    await render(frame(<EditProfileScreen onBack={jest.fn()} onOpenSocial={jest.fn()} onOpenRole={onOpenRole} onSaved={jest.fn()} />));
    expect(await screen.findByText('Founder, director')).toBeTruthy();
    expect(screen.getByText('Lennox Films, Lagos · 2021 to now')).toBeTruthy();
    expect(screen.getByText('Noah Agency, Lagos · 2018 to 2021')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('edit-role-r2'));
    expect(onOpenRole).toHaveBeenLastCalledWith('r2');
    await fireEvent.press(screen.getByTestId('edit-experience-add'));
    expect(onOpenRole).toHaveBeenLastCalledWith();
  });

  it('draws no Experience where there is no role screen to open (R-47)', async () => {
    answers = { [`GET ${ME}`]: ok(profile([role('r1')])), [`GET ${FIELDS}`]: ok(details([])) };
    await render(frame(<EditProfileScreen onBack={jest.fn()} onOpenSocial={jest.fn()} onSaved={jest.fn()} />));
    await screen.findByTestId('edit-skills');
    expect(screen.queryByTestId('edit-experience')).toBeNull();
  });
});

describe('the role screen (G-292)', () => {
  it('turns the boxes into the Hub\'s body, and only what changed into a PATCH', () => {
    const base = roleFormFrom(role('r1'));
    expect(roleBody({ ...emptyRole, title: ' Editor ', company: 'Kora', fromMonth: '3', fromYear: '2021', current: true })).toEqual({ title: 'Editor', company: 'Kora', startedOn: '2021-03' });
    expect(roleBody({ ...base, current: false, toMonth: '11', toYear: '2023', description: ' Cut films. ' })).toMatchObject({ endedOn: '2023-11', description: 'Cut films.', location: 'Lagos' });
    expect(roleChanges(base, base)).toBeNull();
    expect(roleChanges({ ...base, location: '', current: false, toMonth: '5', toYear: '2024' }, base)).toEqual({ location: null, endedOn: '2024-05' });
    expect(roleChanges({ ...roleFormFrom(role('r1', { current: false, endedOn: '2022-01' })), current: true }, roleFormFrom(role('r1', { current: false, endedOn: '2022-01' })))).toEqual({ endedOn: null });
  });

  it('refuses a month out of range and an end before the start, in words', () => {
    expect(roleProblems({ ...emptyRole, fromMonth: '13', fromYear: '2021' }).started).toMatch(/1 to 12/);
    expect(roleProblems({ ...emptyRole, fromMonth: '5', fromYear: '2021', toMonth: '4', toYear: '2021' }).ended).toBe('The end cannot be before the start.');
    expect(roleProblems({ ...emptyRole, fromMonth: '5', fromYear: '2021', current: true, toMonth: '1', toYear: '1999' }).ended).toBeUndefined();
  });

  it('a user can add a role: Save stays off until the role is complete, then one POST', async () => {
    answers = { [`POST ${EXPERIENCE}`]: ok(role('r9'), 201) };
    const onDone = jest.fn();
    await render(frame(<RoleScreen onBack={jest.fn()} onDone={onDone} />));
    expect(screen.getByTestId('role-save').props.accessibilityState?.disabled).toBe(true);
    await fireEvent.changeText(screen.getByTestId('role-title'), 'Founder, director');
    await fireEvent.changeText(screen.getByTestId('role-company'), 'Lennox Films');
    await fireEvent.changeText(screen.getByTestId('role-from-month'), '03');
    await fireEvent.changeText(screen.getByTestId('role-from-year'), '2021');
    expect(screen.getByTestId('role-save').props.accessibilityState?.disabled).toBe(true);
    await fireEvent.press(screen.getByTestId('role-current-switch'));
    expect(screen.queryByTestId('role-to-month')).toBeNull();
    await fireEvent.changeText(screen.getByTestId('role-description'), 'Brand films for African founders.');
    await fireEvent.press(screen.getByTestId('role-save'));
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    const posts = sent.filter((s) => s.method === 'POST');
    expect(posts).toHaveLength(1);
    expect(posts[0].body).toEqual({ title: 'Founder, director', company: 'Lennox Films', startedOn: '2021-03', description: 'Brand films for African founders.' });
  });

  it('a user can change a role and remove one, each asking the Hub for that role only', async () => {
    answers = {
      [`GET ${ME}`]: ok(profile([role('r1')])),
      [`PATCH ${EXPERIENCE}/r1`]: ok(role('r1', { company: 'Lennox Studio' })),
      [`DELETE ${EXPERIENCE}/r1`]: ok({ deleted: true }),
    };
    const onDone = jest.fn();
    await render(frame(<RoleScreen roleId="r1" onBack={jest.fn()} onDone={onDone} />));
    expect((await screen.findByTestId('role-company')).props.value).toBe('Lennox Films');
    expect(screen.getByTestId('role-from-year').props.value).toBe('2021');
    await fireEvent.changeText(screen.getByTestId('role-company'), 'Lennox Studio');
    await fireEvent.press(screen.getByTestId('role-save'));
    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(sent.find((s) => s.method === 'PATCH')?.body).toEqual({ company: 'Lennox Studio' });

    await fireEvent.press(screen.getByTestId('role-remove'));
    await fireEvent.press(await screen.findByTestId('role-remove-confirm'));
    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(2));
    expect(sent.filter((s) => s.method === 'DELETE').map((s) => s.path)).toEqual([`${EXPERIENCE}/r1`]);
  });

  it('a role the Hub refuses stays on the screen with a sentence', async () => {
    answers = { [`POST ${EXPERIENCE}`]: refusal(400, 'A profile can list at most 15 roles. Remove one to add another.') };
    const onDone = jest.fn();
    await render(frame(<RoleScreen onBack={jest.fn()} onDone={onDone} />));
    await fireEvent.changeText(screen.getByTestId('role-title'), 'Editor');
    await fireEvent.changeText(screen.getByTestId('role-company'), 'Kora');
    await fireEvent.changeText(screen.getByTestId('role-from-month'), '1');
    await fireEvent.changeText(screen.getByTestId('role-from-year'), '2020');
    await fireEvent.press(screen.getByTestId('role-current-switch'));
    await fireEvent.press(screen.getByTestId('role-save'));
    expect(await screen.findByText('A profile can list at most 15 roles. Remove one to add another.')).toBeTruthy();
    expect(onDone).not.toHaveBeenCalled();
  });
});
