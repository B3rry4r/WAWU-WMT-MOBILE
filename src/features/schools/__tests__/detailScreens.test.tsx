/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { Share } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

type Answer = { status: number; body: unknown } | 'offline' | 'hold';
let answers: Record<string, Answer[]> = {};
let sent: string[] = [];
let held: (() => void)[] = [];

const ok = (data: unknown): Answer => ({ status: 200, body: { statusCode: 200, message: 'OK', data } });
const failed = (status: number, message: string): Answer => ({ status, body: { statusCode: status, message } });

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const key = `${request.method} ${url.pathname.replace(/^\/api\/hub/, '')}`;
  sent.push(`${key}${url.search}`);
  const queue = answers[key];
  const answer = queue?.[0];
  if (queue && queue.length > 1) queue.shift();
  if (!answer) throw new Error(`no answer for ${key}`);
  if (answer === 'hold') return new Promise<Response>((resolve) => held.push(() => resolve(new Response(JSON.stringify({ statusCode: 500, message: 'Released.' }), { status: 500, headers: { 'content-type': 'application/json' } }))));
  if (answer === 'offline') throw new TypeError('Network request failed');
  return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

const { queryClient } = require('@/api/query') as typeof import('@/api/query');
const { SchoolScreen } = require('../SchoolScreen') as typeof import('../SchoolScreen');
const { CourseScreen } = require('../CourseScreen') as typeof import('../CourseScreen');

/** A day as the Hub writes it, this many days from today on the phone's calendar. */
function inDays(days: number): string {
  const at = new Date();
  at.setDate(at.getDate() + days);
  return `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, '0')}-${String(at.getDate()).padStart(2, '0')}`;
}

/**
 * Makes `new Date()` (no arguments) read as a phone whose own calendar day is `local` while its UTC day is another, whatever
 * zone the test runs in (under TZ=UTC no real clock can disagree with itself). Dates built from arguments are the real ones.
 */
const RealDate = Date;
function phoneDay(local: { year: number; month: number; day: number }, utcIso: string): () => void {
  class PhoneDate extends RealDate {
    constructor(...args: unknown[]) {
      super(...(args as [number]));
      if (args.length === 0) {
        const utc = new RealDate(utcIso);
        Object.defineProperties(this, {
          getFullYear: { value: () => local.year },
          getMonth: { value: () => local.month - 1 },
          getDate: { value: () => local.day },
          getUTCFullYear: { value: () => utc.getUTCFullYear() },
          getUTCMonth: { value: () => utc.getUTCMonth() },
          getUTCDate: { value: () => utc.getUTCDate() },
          toISOString: { value: () => utcIso },
        });
      }
    }
  }
  globalThis.Date = PhoneDate as unknown as DateConstructor;
  return () => {
    globalThis.Date = RealDate;
  };
}
/** Lagos just after midnight (the phone says 10 October, UTC still says 9 October), and Honolulu (UTC-10) late in its day (31 December here, 1 January in UTC). */
const PHONE_DAYS = [
  { name: 'Lagos just after midnight', local: { year: 2026, month: 10, day: 10 }, utcIso: '2026-10-09T23:30:00.000Z', started: '2026-10-09', today: '2026-10-10' },
  { name: 'Honolulu late in its day', local: { year: 2026, month: 12, day: 31 }, utcIso: '2027-01-01T09:30:00.000Z', started: '2026-12-30', today: '2026-12-31' },
] as const;

const intake = (startDate: string, over: Record<string, unknown> = {}) => ({
  id: `i-${startDate}`,
  startDate,
  schedule: 'Saturdays',
  location: 'Yaba',
  capacity: 20,
  seatsLeft: 8,
  full: false,
  ...over,
});

function course(id: string, title: string, over: Record<string, unknown> = {}) {
  return { id, title, weeks: 12, mode: 'online', priceKobo: 15000000, nextIntake: intake(inDays(30)), ...over };
}

function school(over: Record<string, unknown> = {}) {
  return {
    id: 's1',
    name: 'Greenfield Tech Academy',
    category: 'tech',
    location: 'Yaba, Lagos',
    logo: null,
    foundedYear: 2016,
    expertise: ['Product design', 'Software', 'Data', 'Cloud'],
    courseCount: 3,
    fromPriceKobo: 4500000,
    matchedCourses: [],
    about: 'Hands-on tech training with weekend and online classes.',
    applyUrl: 'https://greenfield.example/apply',
    courses: [course('c1', 'Product Design Bootcamp', { mode: 'hybrid' }), course('c2', 'Frontend Development', { weeks: 16, priceKobo: 18000000 }), course('c3', 'Data Analysis with Excel', { weeks: 4, mode: 'in_person', priceKobo: 4500000, nextIntake: null })],
    ...over,
  };
}

function courseDetail(over: Record<string, unknown> = {}) {
  return {
    id: 'c1',
    title: 'Product Design Bootcamp',
    weeks: 12,
    mode: 'online',
    syllabus: ['Research and problem framing', 'Wireframes to high fidelity', 'Prototyping and testing', 'Building a portfolio'],
    outcomes: ['Certificate', 'mentor', 'portfolio'],
    priceKobo: 15000000,
    school: { id: 's1', name: 'Greenfield Tech Academy', category: 'tech', location: 'Yaba, Lagos', logo: null, applyUrl: 'https://greenfield.example/apply' },
    intakes: [intake(inDays(30)), intake(inDays(120), { schedule: 'Weekday evenings' })],
    ...over,
  };
}

function wrap(children: ReactNode) {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, left: 0, right: 0, bottom: 34 } }}>{children}</SafeAreaProvider>
    </QueryClientProvider>
  );
}

const settle = (ms = 50) =>
  rtl.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });

beforeEach(() => {
  answers = {};
  sent = [];
  queryClient.clear();
});

afterEach(async () => {
  globalThis.Date = RealDate;
  held.splice(0).forEach((release) => release());
  await queryClient.cancelQueries();
  await settle(10);
  rtl.cleanup();
  queryClient.clear();
  jest.restoreAllMocks();
});

const openSchool = (props: Partial<import('../SchoolScreen').SchoolScreenProps> = {}) =>
  rtl.render(wrap(<SchoolScreen id="s1" onBack={jest.fn()} onOpenCourse={jest.fn()} {...props} />));
const openCourse = (props: Partial<import('../CourseScreen').CourseScreenProps> = {}) => rtl.render(wrap(<CourseScreen id="c1" onBack={jest.fn()} {...props} />));

describe('SC2 · School', () => {
  it('a user can read the profile: name, place and year, expertise, about and the courses with their length, mode and fee', async () => {
    answers['GET /schools/s1'] = [ok(school())];
    await openSchool();
    expect(await rtl.screen.findByText('Greenfield Tech Academy')).toBeTruthy();
    expect(rtl.screen.getByText('Yaba, Lagos · Since 2016')).toBeTruthy();
    for (const tag of ['Product design', 'Software', 'Data', 'Cloud']) expect(rtl.within(rtl.screen.getByTestId('school-expertise')).getByText(tag)).toBeTruthy();
    expect(rtl.screen.getByText('Hands-on tech training with weekend and online classes.')).toBeTruthy();
    expect(rtl.screen.getByRole('header', { name: 'Courses' })).toBeTruthy();
    expect(rtl.screen.getByTestId('school-course-count').props.children).toBe(3);
    expect(rtl.screen.getByText('Product Design Bootcamp')).toBeTruthy();
    // The days come from each course's next class: after the mode with " + ", after a hybrid's "online + in person" with " · ".
    expect(rtl.screen.getByText('12 weeks · online + in person · Saturdays')).toBeTruthy();
    expect(rtl.screen.getByText('16 weeks · online + Saturdays')).toBeTruthy();
    expect(rtl.screen.getByText('4 weeks · in person')).toBeTruthy();
    expect(rtl.screen.getByLabelText('150,000 naira')).toBeTruthy();
    expect(rtl.screen.getByLabelText('180,000 naira')).toBeTruthy();
    expect(rtl.screen.getByLabelText('45,000 naira')).toBeTruthy();
    expect(sent).toEqual(['GET /schools/s1']);
  });

  it('shows no rating, no placement or graduate count of its own, and no Enroll or apply entry', async () => {
    answers['GET /schools/s1'] = [ok(school())];
    await openSchool();
    await rtl.screen.findByText('Greenfield Tech Academy');
    expect(rtl.screen.queryByText(/\b[0-5]\.\d\b/)).toBeNull();
    expect(rtl.screen.queryByText(/rating|review|graduates/i)).toBeNull();
    expect(rtl.screen.queryByRole('button', { name: /enroll|apply/i })).toBeNull();
  });

  it('every value is the API’s: another school draws another name, place and about text', async () => {
    answers['GET /schools/s1'] = [ok(school({ name: 'Aba Fashion Institute', location: 'Aba', foundedYear: null, expertise: ['Tailoring'], about: 'Fashion training.', courseCount: 1, courses: [course('c9', 'Pattern Cutting Basics', { weeks: 6, priceKobo: 3000000 })] }))];
    await openSchool();
    expect(await rtl.screen.findByText('Aba Fashion Institute')).toBeTruthy();
    expect(rtl.screen.getByText('Aba')).toBeTruthy();
    expect(rtl.screen.queryByText(/Since/)).toBeNull();
    expect(rtl.screen.getByText('Tailoring')).toBeTruthy();
    expect(rtl.screen.getByText('Fashion training.')).toBeTruthy();
    expect(rtl.screen.getByTestId('school-course-count').props.children).toBe(1);
    expect(rtl.screen.queryByText('Greenfield Tech Academy')).toBeNull();
    expect(rtl.screen.queryByText('Product Design Bootcamp')).toBeNull();
  });

  it('a user can tap a course and its id goes to SC3', async () => {
    answers['GET /schools/s1'] = [ok(school())];
    const onOpenCourse = jest.fn();
    await openSchool({ onOpenCourse });
    await rtl.act(async () => rtl.fireEvent.press(await rtl.screen.findByTestId('school-course-c2')));
    expect(onOpenCourse).toHaveBeenCalledWith('c2');
    expect(rtl.screen.getByRole('button', { name: 'Frontend Development, 16 weeks · online + Saturdays, ₦180,000' })).toBeTruthy();
  });

  it('a school with no expertise, no about text or no course leaves that part out and says so for the courses', async () => {
    answers['GET /schools/s1'] = [ok(school({ expertise: [], about: '  ', courseCount: 0, courses: [], foundedYear: null }))];
    await openSchool();
    await rtl.screen.findByText('Greenfield Tech Academy');
    expect(rtl.screen.queryByTestId('school-expertise')).toBeNull();
    expect(rtl.screen.queryByTestId('school-about')).toBeNull();
    expect(rtl.screen.getByTestId('school-course-count').props.children).toBe(0);
    expect(rtl.screen.getByText('No courses listed yet.')).toBeTruthy();
  });

  it('a course with no class coming still lists, with its length and mode', async () => {
    answers['GET /schools/s1'] = [ok(school())];
    await openSchool();
    expect(await rtl.screen.findByText('Data Analysis with Excel')).toBeTruthy();
    expect(rtl.screen.getByText('4 weeks · in person')).toBeTruthy();
  });

  it('a course row carries the days of its next class as the school wrote them, and another school’s course carries its own', async () => {
    answers['GET /schools/s1'] = [
      ok(
        school({
          courses: [
            course('c1', 'Pattern Cutting Basics', { weeks: 6, mode: 'in_person', nextIntake: intake(inDays(9), { schedule: 'Weekday evenings' }) }),
            course('c2', 'Hybrid Welding', { weeks: 10, mode: 'hybrid', nextIntake: intake(inDays(9), { schedule: 'weekends' }) }),
          ],
        }),
      ),
    ];
    await openSchool();
    expect(await rtl.screen.findByText('6 weeks · in person + Weekday evenings')).toBeTruthy();
    expect(rtl.screen.getByText('10 weeks · online + in person · weekends')).toBeTruthy();
    expect(rtl.screen.queryByText(/Saturdays/)).toBeNull();
    expect(rtl.screen.getByRole('button', { name: 'Pattern Cutting Basics, 6 weeks · in person + Weekday evenings, ₦150,000' })).toBeTruthy();
  });

  it('a course whose class has started, or whose class has no days, or that has no class, reads its length and mode only', async () => {
    answers['GET /schools/s1'] = [
      ok(
        school({
          courses: [
            course('c1', 'Started Course', { nextIntake: intake(inDays(-3), { schedule: 'Saturdays' }) }),
            course('c2', 'No Days Course', { nextIntake: intake(inDays(9), { schedule: '  ' }) }),
            course('c3', 'No Class Course', { nextIntake: null }),
            course('c4', 'Starts Today Course', { nextIntake: intake(inDays(0), { schedule: 'Mondays' }) }),
          ],
        }),
      ),
    ];
    await openSchool();
    await rtl.screen.findByText('Started Course');
    expect(rtl.screen.getAllByText('12 weeks · online')).toHaveLength(3);
    expect(rtl.screen.getByText('12 weeks · online + Mondays')).toBeTruthy();
    expect(rtl.screen.queryByText(/Saturdays/)).toBeNull();
  });

  it.each(PHONE_DAYS)('reads today as the phone’s own day ($name): a class that started on the day before is not coming, one on the phone’s day is', async ({ local, utcIso, started, today }) => {
    answers['GET /schools/s1'] = [
      ok(
        school({
          courses: [
            course('c1', 'Started Yesterday', { nextIntake: intake(started, { schedule: 'Old days' }) }),
            course('c2', 'Starts Today', { nextIntake: intake(today, { schedule: 'New days' }) }),
          ],
        }),
      ),
    ];
    const restore = phoneDay(local, utcIso);
    try {
      await openSchool();
      expect(await rtl.screen.findByText('12 weeks · online + New days')).toBeTruthy();
      expect(rtl.screen.queryByText(/Old days/)).toBeNull();
      expect(rtl.screen.getByText('12 weeks · online')).toBeTruthy();
    } finally {
      restore();
    }
  });

  it('a fee with kobo keeps its kobo on the course row and a whole-naira fee drops its .00, neither floored nor rounded', async () => {
    answers['GET /schools/s1'] = [ok(school({ courses: [course('c1', 'Research Methods', { priceKobo: 1234567 }), course('c2', 'Bootcamp', { priceKobo: 15000000 }), course('c3', 'Workshop', { priceKobo: 1234600 })] }))];
    await openSchool();
    await rtl.screen.findByText('Research Methods');
    const part = rtl.within(rtl.screen.getByTestId('school-course-price-c1'));
    expect(rtl.screen.getByTestId('school-course-price-c1').props.accessibilityLabel).toBe('12,345 naira 67 kobo');
    expect(part.getByText('.67')).toBeTruthy();
    expect(rtl.screen.getByRole('button', { name: 'Research Methods, 12 weeks · online + Saturdays, ₦12,345.67' })).toBeTruthy();
    expect(rtl.screen.getByTestId('school-course-price-c2').props.accessibilityLabel).toBe('150,000 naira');
    expect(rtl.within(rtl.screen.getByTestId('school-course-price-c2')).queryByText('.00')).toBeNull();
    // A whole-naira fee that is not a round number of kobo still has no .00.
    expect(rtl.screen.getByTestId('school-course-price-c3').props.accessibilityLabel).toBe('12,346 naira');
    expect(rtl.within(rtl.screen.getByTestId('school-course-price-c3')).queryByText('.00')).toBeNull();
  });

  it('a course with a fee of 99 kobo is a price on its row, not "Free" (SCHOOLS-03 V2-1)', async () => {
    answers['GET /schools/s1'] = [ok(school({ courses: [course('c1', 'Open Evening Workshop', { priceKobo: 99 })] }))];
    await openSchool();
    await rtl.screen.findByText('Open Evening Workshop');
    expect(rtl.within(rtl.screen.getByTestId('school-course-c1')).queryByText('Free')).toBeNull();
    expect(rtl.screen.getByTestId('school-course-price-c1').props.accessibilityLabel).toBe('0 naira 99 kobo');
  });

  it('a course with a fee of 0 reads "Free" on its row, with no naira sign', async () => {
    answers['GET /schools/s1'] = [ok(school({ courses: [course('c1', 'Open Evening Workshop', { priceKobo: 0 }), course('c2', 'Bootcamp', { priceKobo: 15000000 })] }))];
    await openSchool();
    await rtl.screen.findByText('Open Evening Workshop');
    const row = rtl.within(rtl.screen.getByTestId('school-course-c1'));
    expect(row.getByText('Free')).toBeTruthy();
    expect(row.queryByText('₦')).toBeNull();
    expect(rtl.screen.getByTestId('school-course-price-c1').props.accessibilityLabel).toBe('Free');
    expect(rtl.screen.getByRole('button', { name: 'Open Evening Workshop, 12 weeks · online + Saturdays, Free' })).toBeTruthy();
    expect(rtl.screen.queryByLabelText('0 naira')).toBeNull();
    expect(rtl.within(rtl.screen.getByTestId('school-course-price-c2')).getByText('₦')).toBeTruthy();
  });

  it('the logo is the school’s initials when it has no picture', async () => {
    answers['GET /schools/s1'] = [ok(school())];
    await openSchool();
    await rtl.screen.findByText('Greenfield Tech Academy');
    expect(rtl.within(rtl.screen.getByTestId('school-logo')).getByText('GT')).toBeTruthy();
    expect(rtl.screen.queryByTestId('school-logo-image')).toBeNull();
  });

  it('the logo is the school’s picture when it has one', async () => {
    answers['GET /schools/s1'] = [ok(school({ logo: 'https://files.example/gt.png' }))];
    await openSchool();
    await rtl.screen.findByText('Greenfield Tech Academy');
    expect(rtl.screen.getByTestId('school-logo-image')).toBeTruthy();
    expect(rtl.within(rtl.screen.getByTestId('school-logo')).queryByText('GT')).toBeNull();
  });

  it('back is the glass button, and Share opens the phone’s share sheet with the school’s name and place', async () => {
    answers['GET /schools/s1'] = [ok(school())];
    const share = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' });
    const onBack = jest.fn();
    await openSchool({ onBack });
    await rtl.screen.findByText('Greenfield Tech Academy');
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('school-back')));
    expect(onBack).toHaveBeenCalledTimes(1);
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Share this school' })));
    expect(share).toHaveBeenCalledWith({ message: 'Greenfield Tech Academy\nYaba, Lagos' });
  });

  it('a share the person cancels or the phone refuses is not an error on the screen', async () => {
    answers['GET /schools/s1'] = [ok(school())];
    jest.spyOn(Share, 'share').mockRejectedValue(new Error('no share'));
    await openSchool();
    await rtl.screen.findByText('Greenfield Tech Academy');
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('school-share')));
    expect(rtl.screen.queryByTestId('school-error')).toBeNull();
  });

  it('while the school is on its way, a user sees its shapes under a bar with a back button', async () => {
    answers['GET /schools/s1'] = ['hold'];
    const onBack = jest.fn();
    await openSchool({ onBack });
    expect(await rtl.screen.findByTestId('school-loading')).toBeTruthy();
    expect(rtl.screen.queryByTestId('school-gone')).toBeNull();
    expect(rtl.screen.queryByTestId('school-error')).toBeNull();
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('school-back')));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['a hidden or removed school', failed(404, 'School not found')],
    ['a link that is not a school id', failed(400, 'Validation failed (uuid is expected)')],
  ])('%s says the school is not available', async (_what, answer) => {
    answers['GET /schools/s1'] = [answer];
    await openSchool();
    expect(await rtl.screen.findByTestId('school-gone')).toBeTruthy();
    expect(rtl.screen.getByText('This school is not available')).toBeTruthy();
    expect(rtl.screen.queryByTestId('school-error')).toBeNull();
  });

  it('a failure to read the school says why and can be tried again', async () => {
    answers['GET /schools/s1'] = [failed(500, 'Something went wrong on our side'), failed(500, 'Something went wrong on our side'), failed(500, 'Something went wrong on our side'), ok(school())];
    await openSchool();
    expect(await rtl.screen.findByTestId('school-error', {}, { timeout: 8000 })).toBeTruthy();
    expect(rtl.screen.getByText('Couldn’t load this school')).toBeTruthy();
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Try again' })));
    expect(await rtl.screen.findByText('Greenfield Tech Academy')).toBeTruthy();
  }, 15000);

  it('with no connection a user is told so', async () => {
    answers['GET /schools/s1'] = ['offline', 'offline', 'offline'];
    await openSchool();
    expect(await rtl.screen.findByText('No connection. Check your internet and try again.', {}, { timeout: 8000 })).toBeTruthy();
  }, 15000);

  it('a body that is not a school reads as a failure', async () => {
    answers['GET /schools/s1'] = [ok({ nope: 1 }), ok({ nope: 1 }), ok({ nope: 1 })];
    await openSchool();
    expect(await rtl.screen.findByTestId('school-error', {}, { timeout: 8000 })).toBeTruthy();
  }, 15000);
});

describe('SC3 · Course', () => {
  it('a user can read the course: the school, the title, length, classes, start date, what they get and the syllabus', async () => {
    const start = inDays(30);
    answers['GET /schools/courses/c1'] = [ok(courseDetail({ intakes: [intake(start)] }))];
    await openCourse();
    expect(await rtl.screen.findByText('Product Design Bootcamp')).toBeTruthy();
    expect(rtl.screen.getByTestId('course-school').props.children).toBe('Greenfield Tech Academy');
    const facts = rtl.screen.getByTestId('course-facts');
    expect(rtl.within(facts).getByText('Length')).toBeTruthy();
    expect(rtl.within(facts).getByText('12 weeks')).toBeTruthy();
    expect(rtl.within(facts).getByText('Classes')).toBeTruthy();
    expect(rtl.within(facts).getByText('Online, Saturdays in Yaba')).toBeTruthy();
    expect(rtl.within(facts).getByText('Starts')).toBeTruthy();
    const { dayLabel } = require('../model') as typeof import('../model');
    expect(rtl.within(facts).getByText(dayLabel(start) as string)).toBeTruthy();
    expect(rtl.within(facts).getByText('You get')).toBeTruthy();
    expect(rtl.within(facts).getByText('Certificate, mentor, portfolio')).toBeTruthy();
    expect(rtl.screen.getByText('What you learn')).toBeTruthy();
    ['Research and problem framing', 'Wireframes to high fidelity', 'Prototyping and testing', 'Building a portfolio'].forEach((line, i) => {
      expect(rtl.within(rtl.screen.getByTestId(`course-step-${i + 1}`)).getByText(line)).toBeTruthy();
      expect(rtl.within(rtl.screen.getByTestId(`course-step-${i + 1}`)).getByText(String(i + 1))).toBeTruthy();
    });
    expect(sent).toEqual(['GET /schools/courses/c1']);
  });

  it('the fee in the bar at the foot is the course’s, in naira', async () => {
    answers['GET /schools/courses/c1'] = [ok(courseDetail({ priceKobo: 4500000 }))];
    await openCourse();
    await rtl.screen.findByText('Product Design Bootcamp');
    const foot = rtl.within(rtl.screen.getByTestId('course-foot'));
    expect(foot.getByLabelText('45,000 naira')).toBeTruthy();
    // Whole naira: no kobo drawn after the figure.
    expect(foot.queryByText('.00')).toBeNull();
    expect(foot.getByText('₦')).toBeTruthy();
  });

  it('a fee with kobo keeps its kobo in the bar at the foot, neither floored nor rounded', async () => {
    answers['GET /schools/courses/c1'] = [ok(courseDetail({ priceKobo: 1234567 }))];
    await openCourse();
    await rtl.screen.findByText('Product Design Bootcamp');
    const price = rtl.screen.getByTestId('course-price');
    expect(price.props.accessibilityLabel).toBe('12,345 naira 67 kobo');
    expect(rtl.within(price).getByText('.67')).toBeTruthy();
    expect(rtl.within(rtl.screen.getByTestId('course-foot')).queryByLabelText('12,345 naira')).toBeNull();
  });

  it('a course with a fee of 0 reads "Free" in the bar at the foot, with no naira sign', async () => {
    answers['GET /schools/courses/c1'] = [ok(courseDetail({ priceKobo: 0 }))];
    await openCourse();
    await rtl.screen.findByText('Product Design Bootcamp');
    const foot = rtl.within(rtl.screen.getByTestId('course-foot'));
    expect(foot.getByText('Free')).toBeTruthy();
    expect(foot.queryByText('₦')).toBeNull();
    expect(foot.queryByLabelText('0 naira')).toBeNull();
  });

  it.each(PHONE_DAYS)('reads today as the phone’s own day ($name): Starts skips a class from the day before and counts one on the phone’s day', async ({ local, utcIso, started, today }) => {
    answers['GET /schools/courses/c1'] = [ok(courseDetail({ intakes: [intake(started, { schedule: 'Old days' }), intake(today, { schedule: 'New days' })] }))];
    const restore = phoneDay(local, utcIso);
    try {
      await openCourse();
      await rtl.screen.findByText('Product Design Bootcamp');
      const { dayLabel } = require('../model') as typeof import('../model');
      expect(rtl.within(rtl.screen.getByTestId('course-fact-starts')).getByText(dayLabel(today) as string)).toBeTruthy();
      expect(rtl.screen.getByText('Online, New days in Yaba')).toBeTruthy();
      expect(rtl.screen.queryByText(/Old days/)).toBeNull();
    } finally {
      restore();
    }
  });

  it('draws no Enroll, no "Or apply on ... website" and no payment claim until the tasks that build them land (R-47)', async () => {
    answers['GET /schools/courses/c1'] = [ok(courseDetail())];
    await openCourse();
    await rtl.screen.findByText('Product Design Bootcamp');
    expect(rtl.screen.queryByRole('button', { name: /enroll/i })).toBeNull();
    expect(rtl.screen.queryByText(/apply on|enroll|one payment/i)).toBeNull();
    expect(rtl.screen.queryAllByRole('button').map((b) => b.props.accessibilityLabel)).toEqual(['Back']);
    expect(rtl.screen.queryByLabelText(/bookmark|save/i)).toBeNull();
  });

  it('every value is the API’s: another course draws its own length, classes, outcomes and steps', async () => {
    answers['GET /schools/courses/c1'] = [
      ok(courseDetail({ title: 'Arc Welding', weeks: 10, mode: 'in_person', outcomes: ['Certificate', 'toolkit'], syllabus: ['Safety', 'Joints'], intakes: [intake(inDays(10), { schedule: 'Weekends', location: 'Kano' })], school: { id: 's5', name: 'Kano Skills Workshop', category: 'vocational', location: 'Kano', logo: null, applyUrl: null } })),
    ];
    await openCourse();
    expect(await rtl.screen.findByText('Arc Welding')).toBeTruthy();
    expect(rtl.screen.getByText('10 weeks')).toBeTruthy();
    expect(rtl.screen.getByText('In person, Weekends in Kano')).toBeTruthy();
    expect(rtl.screen.getByText('Certificate, toolkit')).toBeTruthy();
    expect(rtl.screen.getByText('Joints')).toBeTruthy();
    expect(rtl.screen.getByText('Kano Skills Workshop')).toBeTruthy();
    expect(rtl.screen.queryByText('Product Design Bootcamp')).toBeNull();
    expect(rtl.screen.queryByText('Greenfield Tech Academy')).toBeNull();
  });

  it('Starts is the soonest class that has not started, not one that already has', async () => {
    const past = inDays(-20);
    const soon = inDays(15);
    answers['GET /schools/courses/c1'] = [ok(courseDetail({ intakes: [intake(past, { schedule: 'Old class' }), intake(soon, { schedule: 'Next class' }), intake(inDays(100), { schedule: 'Later class' })] }))];
    await openCourse();
    await rtl.screen.findByText('Product Design Bootcamp');
    const { dayLabel } = require('../model') as typeof import('../model');
    expect(rtl.within(rtl.screen.getByTestId('course-fact-starts')).getByText(dayLabel(soon) as string)).toBeTruthy();
    expect(rtl.screen.getByText('Online, Next class in Yaba')).toBeTruthy();
    expect(rtl.screen.queryByText(/Old class|Later class/)).toBeNull();
  });

  it('a class that is full still gives its start date (the full banner is SCHOOLS-06’s)', async () => {
    const start = inDays(12);
    answers['GET /schools/courses/c1'] = [ok(courseDetail({ intakes: [intake(start, { seatsLeft: 0, full: true })] }))];
    await openCourse();
    await rtl.screen.findByText('Product Design Bootcamp');
    expect(rtl.screen.getByTestId('course-fact-starts')).toBeTruthy();
  });

  it('with every class started, there is no Starts row and Classes says how it is taught', async () => {
    answers['GET /schools/courses/c1'] = [ok(courseDetail({ intakes: [intake(inDays(-5))] }))];
    await openCourse();
    await rtl.screen.findByText('Product Design Bootcamp');
    expect(rtl.screen.queryByTestId('course-fact-starts')).toBeNull();
    expect(rtl.within(rtl.screen.getByTestId('course-fact-classes')).getByText('Online')).toBeTruthy();
  });

  it('with no class at all, there is no Starts row either', async () => {
    answers['GET /schools/courses/c1'] = [ok(courseDetail({ intakes: [] }))];
    await openCourse();
    await rtl.screen.findByText('Product Design Bootcamp');
    expect(rtl.screen.queryByTestId('course-fact-starts')).toBeNull();
    expect(rtl.within(rtl.screen.getByTestId('course-fact-classes')).getByText('Online')).toBeTruthy();
  });

  it('a course that lists nothing it gives and no steps leaves those parts out', async () => {
    answers['GET /schools/courses/c1'] = [ok(courseDetail({ outcomes: [], syllabus: [' '] }))];
    await openCourse();
    await rtl.screen.findByText('Product Design Bootcamp');
    expect(rtl.screen.queryByTestId('course-fact-you-get')).toBeNull();
    expect(rtl.screen.queryByTestId('course-syllabus')).toBeNull();
    expect(rtl.screen.queryByText('What you learn')).toBeNull();
    expect(rtl.screen.getByTestId('course-fact-length')).toBeTruthy();
  });

  it('back is the bar’s back button', async () => {
    answers['GET /schools/courses/c1'] = [ok(courseDetail())];
    const onBack = jest.fn();
    await openCourse({ onBack });
    await rtl.screen.findByText('Product Design Bootcamp');
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('course-back')));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('while the course is on its way, a user sees its shapes under a bar with a back button', async () => {
    answers['GET /schools/courses/c1'] = ['hold'];
    await openCourse();
    expect(await rtl.screen.findByTestId('course-loading')).toBeTruthy();
    expect(rtl.screen.queryByTestId('course-gone')).toBeNull();
    expect(rtl.screen.queryByTestId('course-foot')).toBeNull();
    expect(rtl.screen.getByTestId('course-back')).toBeTruthy();
  });

  it.each([
    ['a hidden or removed course', failed(404, 'Course not found')],
    ['a link that is not a course id', failed(400, 'Validation failed (uuid is expected)')],
  ])('%s says the course is not available', async (_what, answer) => {
    answers['GET /schools/courses/c1'] = [answer];
    await openCourse();
    expect(await rtl.screen.findByTestId('course-gone')).toBeTruthy();
    expect(rtl.screen.getByText('This course is not available')).toBeTruthy();
    expect(rtl.screen.queryByTestId('course-error')).toBeNull();
  });

  it('a failure says why and can be tried again', async () => {
    answers['GET /schools/courses/c1'] = [failed(500, 'Something went wrong on our side'), failed(500, 'Something went wrong on our side'), failed(500, 'Something went wrong on our side'), ok(courseDetail())];
    await openCourse();
    expect(await rtl.screen.findByTestId('course-error', {}, { timeout: 8000 })).toBeTruthy();
    expect(rtl.screen.getByText('Couldn’t load this course')).toBeTruthy();
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Try again' })));
    expect(await rtl.screen.findByText('Product Design Bootcamp')).toBeTruthy();
  }, 15000);

  it('with no connection a user is told so', async () => {
    answers['GET /schools/courses/c1'] = ['offline', 'offline', 'offline'];
    await openCourse();
    expect(await rtl.screen.findByText('No connection. Check your internet and try again.', {}, { timeout: 8000 })).toBeTruthy();
  }, 15000);

  it('a body that is not a course reads as a failure', async () => {
    answers['GET /schools/courses/c1'] = [ok({ id: 'c1' }), ok({ id: 'c1' }), ok({ id: 'c1' })];
    await openCourse();
    expect(await rtl.screen.findByTestId('course-error', {}, { timeout: 8000 })).toBeTruthy();
  }, 15000);
});
