import {
  addedOf,
  changesOf,
  formFrom,
  fullName,
  hasProblems,
  isDirty,
  problemsOf,
  rebased,
  splitName,
  withHandle,
  type MyProfile,
  type ProfileFields,
} from '../form';
import { PLATFORMS, handleOf, moved, orderOf, unaddedOf, emptyHandles } from '../social';

const me = {
  wawuUserId: 'u1',
  firstName: 'Lennox',
  middleName: null,
  lastName: 'Emmanuel',
  handle: 'lennox',
  bio: 'Filmmaker and brand strategist.',
  avatarUrl: null,
  coverUrl: null,
  instagramHandle: 'lennox.films',
  tiktokHandle: '@lennox',
  xHandle: null,
  youtubeUrl: 'https://youtube.com/@LennoxFilms',
  facebookUrl: null,
  linkedinUrl: 'https://www.linkedin.com/in/lennox-e/',
} as unknown as MyProfile;

const fields: ProfileFields = {
  wawuUserId: 'u1',
  location: 'Lagos, Nigeria',
  skills: [],
  openTo: [],
  threadsHandle: null,
  socialOrder: ['tiktok', 'instagram'],
  memberSince: '2026-10-04T00:00:00.000Z',
  badge: null,
};

describe('M8 form from the profile', () => {
  it('shows the three name parts as one name', () => {
    expect(fullName({ firstName: 'Ada', middleName: 'Ngozi', lastName: 'Okafor' })).toBe('Ada Ngozi Okafor');
    expect(fullName({ firstName: 'Ada', middleName: null, lastName: 'Okafor' })).toBe('Ada Okafor');
  });

  it('shows a stored link as the handle it was built from, and drops a stray "@"', () => {
    const form = formFrom(me, fields);
    expect(form.handles.youtube).toBe('LennoxFilms');
    expect(form.handles.tiktok).toBe('lennox');
    expect(form.handles.instagram).toBe('lennox.films');
    // A link that is not the one the Hub builds stays whole.
    expect(form.handles.linkedin).toBe('https://www.linkedin.com/in/lennox-e/');
    expect(handleOf('facebook', 'https://facebook.com/lennox')).toBe('lennox');
  });

  it('orders the links as the Hub keeps them, then any other added link in the default order', () => {
    const form = formFrom(me, fields);
    expect(form.order).toEqual(['tiktok', 'instagram', 'youtube', 'linkedin']);
    expect(orderOf(form.handles, [])).toEqual(['instagram', 'tiktok', 'youtube', 'linkedin']);
    expect(unaddedOf(form.order)).toEqual(['x', 'threads', 'facebook']);
  });
});

describe('what Save sends', () => {
  const base = formFrom(me, fields);

  it('sends nothing when nothing changed', () => {
    expect(changesOf(base, base)).toEqual({ profile: null, fields: null });
    expect(isDirty(base, base)).toBe(false);
  });

  it('sends only the fields that changed, to the route that holds each', () => {
    const form = { ...base, bio: 'New bio', location: 'Abuja', handle: 'lennox_e' };
    expect(changesOf(form, base)).toEqual({ profile: { bio: 'New bio', handle: 'lennox_e' }, fields: { location: 'Abuja' } });
  });

  it('splits one name into first, middle and last', () => {
    expect(splitName('Lennox Emmanuel')).toEqual({ firstName: 'Lennox', middleName: '', lastName: 'Emmanuel' });
    expect(splitName('Ada Ngozi Mary Okafor')).toEqual({ firstName: 'Ada', middleName: 'Ngozi Mary', lastName: 'Okafor' });
    expect(splitName('Lennox')).toBeNull();
    expect(changesOf({ ...base, name: 'Lennox E Emmanuel' }, base).profile).toEqual({ firstName: 'Lennox', middleName: 'E', lastName: 'Emmanuel' });
  });

  it('clears a field the person emptied', () => {
    const form = { ...base, bio: '  ', location: '', handles: { ...base.handles, tiktok: '' } };
    const out = changesOf(form, base);
    expect(out.profile).toEqual({ bio: null, tiktokHandle: '' });
    expect(out.fields).toEqual({ location: null, socialOrder: ['instagram', 'youtube', 'linkedin'] });
  });

  it('sends the Threads handle with the details and the other handles with the profile', () => {
    const form = { ...base, handles: { ...base.handles, threads: 'lennox.t', x: 'lennoxe' } };
    const next = { ...form, order: [...form.order, 'threads', 'x'] as typeof form.order };
    const out = changesOf(next, base);
    expect(out.profile).toEqual({ xHandle: 'lennoxe' });
    expect(out.fields).toEqual({ threadsHandle: 'lennox.t', socialOrder: ['tiktok', 'instagram', 'youtube', 'linkedin', 'threads', 'x'] });
  });

  it('sends a new order when a link was moved and no handle changed', () => {
    const out = changesOf({ ...base, order: moved(base.order, 0, 3) }, base);
    expect(out.profile).toBeNull();
    expect(out.fields).toEqual({ socialOrder: ['instagram', 'youtube', 'linkedin', 'tiktok'] });
  });

  it('does not send a link added on M9 and left empty', () => {
    const form = { ...base, order: [...base.order, 'threads' as const] };
    expect(addedOf(form)).toEqual(base.order);
    expect(changesOf(form, base)).toEqual({ profile: null, fields: null });
  });

  it('after the profile part reached the Hub, a retry sends only the details', () => {
    const form = { ...base, bio: 'New bio', location: 'Abuja' };
    const after = rebased(base, form, 'profile');
    expect(changesOf(form, after)).toEqual({ profile: null, fields: { location: 'Abuja' } });
    expect(changesOf(form, rebased(after, form, 'fields'))).toEqual({ profile: null, fields: null });
  });
});

describe('what stops a save', () => {
  const base = formFrom(me, fields);

  it('asks for a first and last name', () => {
    expect(problemsOf({ ...base, name: 'Lennox' }, base).name).toBe('Enter your first and last name.');
    expect(problemsOf({ ...base, name: '' }, base).name).toBeTruthy();
  });

  it('refuses a handle with a space or a hyphen, an empty one once set, and one over 30 characters', () => {
    expect(problemsOf({ ...base, handle: 'len nox' }, base).handle).toMatch(/letters, numbers/);
    expect(problemsOf({ ...base, handle: 'len-nox' }, base).handle).toMatch(/letters, numbers/);
    expect(problemsOf({ ...base, handle: '' }, base).handle).toBe('Choose a handle.');
    expect(problemsOf({ ...base, handle: 'a'.repeat(31) }, base).handle).toMatch(/30/);
  });

  it('leaves a saved handle alone when the person has not touched it', () => {
    const odd = formFrom({ ...me, handle: 'chidi-creates' } as MyProfile, fields);
    expect(hasProblems(problemsOf(odd, odd))).toBe(false);
  });

  it('refuses a bio over the Hub’s 500 and a social handle with a space', () => {
    expect(problemsOf({ ...base, bio: 'x'.repeat(501) }, base).bio).toMatch(/500/);
    expect(problemsOf(withHandle(base, 'x', 'len nox'), base).social.x).toMatch(/no spaces/);
    expect(hasProblems(problemsOf(base, base))).toBe(false);
  });

  it('knows every platform M9 lists', () => {
    expect(PLATFORMS).toHaveLength(7);
    expect(Object.keys(emptyHandles())).toEqual([...PLATFORMS]);
  });
});
