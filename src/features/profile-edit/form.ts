import type { components } from '@/api/schema.generated';

import { HANDLE_PATTERN, limits } from './limits';
import {
  PLATFORMS,
  SOCIAL,
  bareHandle,
  emptyHandles,
  handleOf,
  orderOf,
  socialProblem,
  type SocialHandles,
  type SocialPlatform,
} from './social';

export type MyProfile = components['schemas']['UserProfileWithClaims'];
export type ProfileFields = components['schemas']['ProfileFieldsView'];
export type ProfileUpdate = components['schemas']['UpdateUserProfileDto'];
export type FieldsUpdate = components['schemas']['UpdateProfileFieldsDto'];

/** Everything M8 and M9 hold while the person edits. Text is as typed; nothing is trimmed until it is sent. */
export type ProfileForm = {
  /** One field, "Lennox Emmanuel": the Hub keeps first, middle and last name apart. */
  name: string;
  /** Without the "@". */
  handle: string;
  bio: string;
  location: string;
  /** The saved or newly uploaded picture; null when there is none. */
  avatarUrl: string | null;
  coverUrl: string | null;
  /** One bare handle (or pasted link) per platform; '' is not added. */
  handles: SocialHandles;
  /** The added platforms, first to last: what M9 draws and what the profile shows. */
  order: SocialPlatform[];
};

/** The person's name as one line: first, middle and last, whichever they have. */
export function fullName(me: Pick<MyProfile, 'firstName' | 'middleName' | 'lastName'>): string {
  return [me.firstName, me.middleName, me.lastName]
    .map((part) => (part ?? '').trim())
    .filter(Boolean)
    .join(' ');
}

/** The one-line name split the way the Hub keeps it: first word, last word, and whatever is between as the middle name. */
export function splitName(name: string): { firstName: string; middleName: string; lastName: string } | null {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return null;
  return { firstName: parts[0], middleName: parts.slice(1, -1).join(' '), lastName: parts[parts.length - 1] };
}

export function formFrom(me: MyProfile, fields: ProfileFields): ProfileForm {
  const handles = emptyHandles();
  for (const platform of PLATFORMS) {
    const meta = SOCIAL[platform];
    const stored = meta.field === 'threadsHandle' ? fields.threadsHandle : me[meta.field];
    // The Hub keeps handles bare, but an older row may still carry the "@".
    handles[platform] = bareHandle(handleOf(platform, stored));
  }
  return {
    name: fullName(me),
    handle: me.handle ?? '',
    bio: me.bio ?? '',
    location: fields.location ?? '',
    avatarUrl: me.avatarUrl,
    coverUrl: me.coverUrl,
    handles,
    order: orderOf(handles, fields.socialOrder),
  };
}

export type Problems = {
  name?: string;
  handle?: string;
  bio?: string;
  location?: string;
  /** One sentence per platform whose handle cannot be saved. */
  social: Partial<Record<SocialPlatform, string>>;
};

/** What stops the form being saved, in words the person can act on. `base` is what is saved now. */
export function problemsOf(form: ProfileForm, base: ProfileForm): Problems {
  const problems: Problems = { social: {} };
  if (form.name.trim() !== base.name.trim()) {
    const parts = splitName(form.name);
    if (!parts) problems.name = 'Enter your first and last name.';
    else if ([parts.firstName, parts.middleName, parts.lastName].some((part) => part.length > limits.namePart)) {
      problems.name = `Each part of your name can be at most ${limits.namePart} characters.`;
    }
  }
  if (form.handle !== base.handle) {
    if (form.handle === '') problems.handle = 'Choose a handle.';
    else if (!HANDLE_PATTERN.test(form.handle)) problems.handle = 'Use letters, numbers, dots and underscores.';
    else if (form.handle.length > limits.handle) problems.handle = `A handle can be at most ${limits.handle} characters.`;
  }
  if (form.bio.length > limits.bio) problems.bio = `Your bio can be at most ${limits.bio} characters.`;
  if (form.location.trim().length > limits.location) problems.location = `Your location can be at most ${limits.location} characters.`;
  for (const platform of PLATFORMS) {
    const sentence = socialProblem(platform, form.handles[platform]);
    if (sentence) problems.social[platform] = sentence;
  }
  return problems;
}

export function hasProblems(problems: Problems): boolean {
  return Object.keys(problems.social).length > 0 || Boolean(problems.name ?? problems.handle ?? problems.bio ?? problems.location);
}

const sameOrder = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((key, i) => key === b[i]);

/** The social part of the form that has been added (M9's order), as handles in that order. */
const filledOrder = (form: ProfileForm) => form.order.filter((p) => form.handles[p] !== '');

export type Changes = {
  /** The body for `PATCH /users/me`, or null when nothing it holds changed. */
  profile: ProfileUpdate | null;
  /** The body for `PATCH /users/me/profile-fields`, or null when nothing it holds changed. */
  fields: FieldsUpdate | null;
};

/** What differs from what is saved, as the two bodies the Hub takes. Only what changed is sent. */
export function changesOf(form: ProfileForm, base: ProfileForm): Changes {
  const profile: ProfileUpdate = {};
  if (form.name.trim() !== base.name.trim()) {
    const parts = splitName(form.name);
    if (parts) Object.assign(profile, parts);
  }
  if (form.handle !== base.handle) profile.handle = form.handle === '' ? null : form.handle;
  if (form.bio.trim() !== base.bio.trim()) profile.bio = form.bio.trim() === '' ? null : form.bio.trim();
  if (form.avatarUrl !== base.avatarUrl) profile.avatarUrl = form.avatarUrl;
  if (form.coverUrl !== base.coverUrl) profile.coverUrl = form.coverUrl;

  const fields: FieldsUpdate = {};
  if (form.location.trim() !== base.location.trim()) fields.location = form.location.trim() === '' ? null : form.location.trim();

  for (const platform of PLATFORMS) {
    if (form.handles[platform] === base.handles[platform]) continue;
    const meta = SOCIAL[platform];
    // An empty string clears it: the Hub stores null for a handle with nothing in it.
    if (meta.field === 'threadsHandle') fields.threadsHandle = form.handles[platform];
    else profile[meta.field] = form.handles[platform];
  }
  const order = filledOrder(form);
  if (!sameOrder(order, filledOrder(base))) fields.socialOrder = order;

  return {
    profile: Object.keys(profile).length > 0 ? profile : null,
    fields: Object.keys(fields).length > 0 ? fields : null,
  };
}

export function isDirty(form: ProfileForm, base: ProfileForm): boolean {
  const { profile, fields } = changesOf(form, base);
  return profile !== null || fields !== null;
}

/**
 * The saved form after `part` of it reached the Hub: the form's own values for
 * that part, the base's for the rest. A save is two requests; when the second
 * fails the first stays saved, and a retry sends only what is left.
 */
export function rebased(base: ProfileForm, form: ProfileForm, part: 'profile' | 'fields'): ProfileForm {
  if (part === 'fields') {
    const handles = { ...base.handles, threads: form.handles.threads };
    return { ...base, location: form.location, handles, order: form.order };
  }
  const handles = { ...form.handles, threads: base.handles.threads };
  return { ...base, name: form.name, handle: form.handle, bio: form.bio, avatarUrl: form.avatarUrl, coverUrl: form.coverUrl, handles };
}

/** The platforms that have a handle, in order: M8's rows, and what the profile shows. A row just added on M9 and still empty is not one yet. */
export function addedOf(form: ProfileForm): SocialPlatform[] {
  return filledOrder(form);
}

/** M9's rows: the handles typed so far, the empty ones dropped from the order and from the profile. */
export function withHandle(form: ProfileForm, platform: SocialPlatform, typed: string): ProfileForm {
  return { ...form, handles: { ...form.handles, [platform]: bareHandle(typed) } };
}
