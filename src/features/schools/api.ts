import { api, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { components, operations } from '@/api/schema.generated';

/**
 * SC1 to SC3 and SC10's calls, as the Hub's contract types them (SCHOOLS-04, public: no account is needed to browse):
 * - `GET /schools?category=&q=&limit=&cursor=`: school cards, a page at a time by cursor, each with its place, its course
 *   count and the lowest course fee. `q` matches a school's name or place, or the title of one of its shown courses;
 * - `GET /schools/{id}`: the school page, with its about text and its shown courses (each with its next shown intake);
 * - `GET /schools/courses/{id}`: the course page, with its syllabus, what it gives and every shown intake;
 * - `GET`, `PUT`, `DELETE /me/saved/courses/{courseId}`: whether the person saved the course (SC3's bookmark) and the two ways to change it (FIX-107).
 *
 * The Hub's success body is `{ statusCode, message, data }` and the contract types only `data` (SHARED-CHANGES.md row
 * 11), so each call reads `data` itself. No rating is served and none is drawn (R-32).
 */
export type SchoolCard = components['schemas']['PublicSchoolCard'];
export type IntakeView = components['schemas']['PublicIntakeView'];
export type CourseDetail = components['schemas']['PublicCourseDetail'];
type ContractCourseCard = components['schemas']['PublicSchoolCourseCard'];
type ContractSchool = components['schemas']['PublicSchoolDetail'];
type ListQuery = NonNullable<operations['SchoolsPublicController_list']['parameters']['query']>;

/** The categories the contract accepts on the list. */
export type SchoolCategory = NonNullable<ListQuery['category']>;

/**
 * A course on the school page. The Hub answers `nextIntake: null` for a course with no shown intake (the contract says
 * `nullable`, which the generated type drops beside a `$ref`: BACKEND_GAPS G-625), so it is typed as the Hub sends it.
 */
export type CourseCard = Omit<ContractCourseCard, 'nextIntake'> & { nextIntake: IntakeView | null };
export type SchoolDetail = Omit<ContractSchool, 'courses'> & { courses: CourseCard[] };

/** One page as the screen uses it. `nextCursor` is null on the last page. */
export type SchoolsPage = { items: SchoolCard[]; nextCursor: string | null };

type Envelope<T> = { data?: T | null };

/** How many schools one page asks for: the Hub's own default (1 to 50), written down so every page is the same. */
export const SCHOOLS_PAGE_SIZE = 20;

export const schoolsKeys = {
  all: ['schools'] as const,
  /** `all` is every category; anything else is one category's id. `q` is the cleaned search text, '' for none. */
  list: (category: string, q: string) => ['schools', 'list', category, q] as const,
  school: (id: string) => ['schools', 'school', id] as const,
  course: (id: string) => ['schools', 'course', id] as const,
  /** The person's own bookmark on a course; under `me` so a Saved refresh and the Me count can read it again. */
  saved: (id: string) => ['me', 'saved-course', id] as const,
};

function unreadable(what: string): ApiError {
  return new ApiError('unknown', 200, `The ${what} could not be read. Try again.`);
}

const isText = (value: unknown): value is string => typeof value === 'string';
const isList = (value: unknown): value is unknown[] => Array.isArray(value);

function readCard(raw: unknown): SchoolCard | null {
  const card = raw as Partial<SchoolCard> | null;
  if (!card || typeof card !== 'object' || !isText(card.id) || !isText(card.name) || !isText(card.location)) return null;
  if (typeof card.courseCount !== 'number' || !isList(card.expertise)) return null;
  return card as SchoolCard;
}

/**
 * One page of schools. `q` is sent only when it has text and `category` only when one is picked, so the first page of
 * All with no search is the plain list. `cursor` is the previous page's `nextCursor`, opaque and never built here.
 */
export async function fetchSchoolsPage(category: SchoolCategory | 'all', q: string, cursor: string | null): Promise<SchoolsPage> {
  const query: ListQuery = {
    limit: SCHOOLS_PAGE_SIZE,
    ...(category === 'all' ? {} : { category }),
    ...(q === '' ? {} : { q }),
    ...(cursor === null ? {} : { cursor }),
  };
  const body = (await unwrap(api.GET('/api/hub/schools', { params: { query } }))) as unknown as Envelope<Partial<SchoolsPage>>;
  const data = body?.data;
  if (!data || typeof data !== 'object' || !isList(data.items)) throw unreadable('schools');
  const next = data.nextCursor;
  if (next !== null && next !== undefined && !isText(next)) throw unreadable('schools');
  const items = data.items.map(readCard);
  if (items.some((card) => card === null)) throw unreadable('schools');
  return { items: items as SchoolCard[], nextCursor: next ?? null };
}

/** One school, for SC2. */
export async function fetchSchool(id: string): Promise<SchoolDetail> {
  const body = (await unwrap(api.GET('/api/hub/schools/{id}', { params: { path: { id } } }))) as unknown as Envelope<SchoolDetail>;
  const data = body?.data;
  if (!data || typeof data !== 'object' || !isText(data.id) || !isText(data.name) || !isList(data.courses) || !isList(data.expertise)) {
    throw unreadable('school');
  }
  return data;
}

/** One course, for SC3. */
export async function fetchCourse(id: string): Promise<CourseDetail> {
  const body = (await unwrap(api.GET('/api/hub/schools/courses/{id}', { params: { path: { id } } }))) as unknown as Envelope<CourseDetail>;
  const data = body?.data;
  if (
    !data ||
    typeof data !== 'object' ||
    !isText(data.id) ||
    !isText(data.title) ||
    typeof data.priceKobo !== 'number' ||
    !data.school ||
    !isText(data.school.name) ||
    !isList(data.intakes) ||
    !isList(data.syllabus) ||
    !isList(data.outcomes)
  ) {
    throw unreadable('course');
  }
  return data;
}

/** Whether the person saved this course. */
export async function fetchCourseSaved(courseId: string): Promise<boolean> {
  const body = (await unwrap(api.GET('/api/hub/me/saved/courses/{courseId}', { params: { path: { courseId } } }))) as unknown as Envelope<{ saved?: unknown }>;
  const saved = body?.data?.saved;
  if (typeof saved !== 'boolean') throw unreadable('saved course');
  return saved;
}

/** Saves the course (PUT) or takes the save back (DELETE); each is idempotent. Answers how it stands now. */
export async function setCourseSaved(courseId: string, saved: boolean): Promise<boolean> {
  const params = { params: { path: { courseId } } };
  const body = (await unwrap(saved ? api.PUT('/api/hub/me/saved/courses/{courseId}', params) : api.DELETE('/api/hub/me/saved/courses/{courseId}', params))) as unknown as Envelope<{ saved?: unknown }>;
  const now = body?.data?.saved;
  if (typeof now !== 'boolean') throw unreadable('saved course');
  return now;
}
