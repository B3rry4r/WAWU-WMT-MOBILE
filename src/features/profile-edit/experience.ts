import { isApiError } from '@/api/errors';

import type { NewRole, Role, RoleUpdate } from './api';

/** The most roles one profile lists (`MAX_EXPERIENCE_ROWS` on the Hub). */
export const MAX_ROLES = 15;
/** The Hub's lengths on a role (the contract's own `maxLength`s). */
export const roleLimits = { title: 120, company: 120, location: 120, description: 1000 } as const;

/** Everything the role screen holds while the person types. Months and years are digits as typed. */
export type RoleForm = {
  title: string;
  company: string;
  location: string;
  fromMonth: string;
  fromYear: string;
  toMonth: string;
  toYear: string;
  /** "I work here now": the role has no end. */
  current: boolean;
  description: string;
};

export const emptyRole: RoleForm = { title: '', company: '', location: '', fromMonth: '', fromYear: '', toMonth: '', toYear: '', current: false, description: '' };

const pad = (month: string) => month.trim().padStart(2, '0');
const monthOf = (value: string | null | undefined) => {
  const match = /^(\d{4})-(\d{2})$/.exec(value ?? '');
  return match ? { year: match[1], month: match[2] } : { year: '', month: '' };
};

/** The role as it is saved now, as boxes. */
export function roleFormFrom(role: Role): RoleForm {
  const from = monthOf(role.startedOn);
  const to = monthOf(role.endedOn);
  return {
    title: role.title,
    company: role.company,
    location: role.location ?? '',
    fromMonth: from.month,
    fromYear: from.year,
    toMonth: to.month,
    toYear: to.year,
    current: role.current,
    description: role.description ?? '',
  };
}

const validMonth = (month: string, year: string) => /^\d{1,2}$/.test(month.trim()) && Number(month) >= 1 && Number(month) <= 12 && /^\d{4}$/.test(year.trim());
const startedOn = (form: RoleForm) => `${form.fromYear.trim()}-${pad(form.fromMonth)}`;
const endedOn = (form: RoleForm) => `${form.toYear.trim()}-${pad(form.toMonth)}`;

export type RoleProblems = Partial<Record<'title' | 'company' | 'location' | 'started' | 'ended' | 'description', string>>;

/** What is wrong before anything is sent. A box left empty is not "wrong": Save simply stays off until it is filled. */
export function roleProblems(form: RoleForm): RoleProblems {
  const problems: RoleProblems = {};
  for (const key of ['title', 'company', 'location', 'description'] as const) {
    if (form[key].trim().length > roleLimits[key]) problems[key] = `Too long. Use ${roleLimits[key]} characters or fewer.`;
  }
  const started = form.fromMonth.trim() !== '' || form.fromYear.trim() !== '';
  if (started && !validMonth(form.fromMonth, form.fromYear)) problems.started = 'Enter a month from 1 to 12 and a year of four digits.';
  const ended = !form.current && (form.toMonth.trim() !== '' || form.toYear.trim() !== '');
  if (ended && !validMonth(form.toMonth, form.toYear)) problems.ended = 'Enter a month from 1 to 12 and a year of four digits.';
  if (!problems.started && !problems.ended && started && ended && endedOn(form) < startedOn(form)) problems.ended = 'The end cannot be before the start.';
  return problems;
}

export const hasRoleProblems = (problems: RoleProblems) => Object.values(problems).some(Boolean);

/** A role needs a title, a company and a start; the end is a month, or "I work here now". */
export function isRoleComplete(form: RoleForm): boolean {
  return form.title.trim() !== '' && form.company.trim() !== '' && validMonth(form.fromMonth, form.fromYear) && (form.current || validMonth(form.toMonth, form.toYear));
}

/** `POST /users/me/experience`: an empty optional box is left out. */
export function roleBody(form: RoleForm): NewRole {
  const body: NewRole = { title: form.title.trim(), company: form.company.trim(), startedOn: startedOn(form) };
  if (form.location.trim()) body.location = form.location.trim();
  if (!form.current) body.endedOn = endedOn(form);
  if (form.description.trim()) body.description = form.description.trim();
  return body;
}

/** `PATCH /users/me/experience/{id}`: only what differs from the saved role; an optional box emptied is sent as `null`. `null` when nothing differs. */
export function roleChanges(form: RoleForm, base: RoleForm): RoleUpdate | null {
  const out: RoleUpdate = {};
  if (form.title.trim() !== base.title.trim()) out.title = form.title.trim();
  if (form.company.trim() !== base.company.trim()) out.company = form.company.trim();
  if (form.location.trim() !== base.location.trim()) out.location = form.location.trim() === '' ? null : form.location.trim();
  if (form.description.trim() !== base.description.trim()) out.description = form.description.trim() === '' ? null : form.description.trim();
  if (startedOn(form) !== startedOn(base)) out.startedOn = startedOn(form);
  const endNow = form.current ? null : endedOn(form);
  const endWas = base.current ? null : endedOn(base);
  if (endNow !== endWas) out.endedOn = endNow;
  return Object.keys(out).length > 0 ? out : null;
}

/** The sentence for a role that would not save: the Hub's own for its cap, our words for the rest. */
export function roleFailure(error: unknown): string {
  if (isApiError(error)) {
    if (error.kind === 'network') return error.message;
    if (error.kind === 'validation' && /at most \d+ roles/i.test(error.message)) return error.message;
    if (error.kind === 'validation' && /before/i.test(error.message)) return 'The end cannot be before the start.';
  }
  return 'Your role did not save. Try again.';
}
