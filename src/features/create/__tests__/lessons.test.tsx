/* eslint-disable @typescript-eslint/no-require-imports */
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react-native';
import { Platform } from 'react-native';

import { ScriptedXhr, FORMATS, allowance, chosen, hub, installFetch, installXhr, ok, presigned, refusal, renderFrame } from '../__helpers__/harness';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

// The phone's files are not here under jest: each test says what the person chose.
const mockPick = jest.fn();
jest.mock('../pickFile', () => ({ canPickFile: true, pickFile: (...args: unknown[]) => mockPick(...args) }));

installFetch();
const { queryClient: appClient } = require('@/api/query') as typeof import('@/api/query');
const { LessonsScreen } = require('../LessonsScreen') as typeof import('../LessonsScreen');
const { DetailsScreen } = require('../DetailsScreen') as typeof import('../DetailsScreen');
const { PriceScreen, lessonInputs } = require('../PriceScreen') as typeof import('../PriceScreen');
const lessonsModel = require('../lessons') as typeof import('../lessons');
const draft = require('../draft') as typeof import('../draft');
const details = require('../details') as typeof import('../details');

const CREATE = '/api/hub/content';
const PUT_LESSONS = '/api/hub/content/c1/lessons';
const PRESIGN = '/api/hub/uploads/presign';
const RELEASE = '/api/hub/uploads/release';
const ALLOWANCE = '/api/hub/uploads/allowance';
const FORMATS_PATH = '/api/hub/uploads/formats';
const MINE = '/api/hub/content/mine/library';

const created = (title: string) => ({ status: 201, body: { statusCode: 201, message: 'Created', data: { id: 'c1', title, status: 'pending' } } });
const file = (name: string, folder = 'content/full') => ({ name, bytes: 1000, contentType: 'video/mp4', key: `${folder}/u1/${name}`, fileUrl: `https://storage.test/${folder}/u1/${name}?read=1` });
const writes = (method: string, path: string) => hub.sent.filter((s) => s.method === method && s.path === path);

beforeEach(() => {
  installFetch();
  installXhr();
  mockPick.mockReset();
  draft.resetDraft();
  details.setSent(null);
  appClient.clear();
  hub.answers[`GET ${FORMATS_PATH}`] = ok(FORMATS);
  hub.answers[`GET ${ALLOWANCE}`] = ok(allowance(1, 5));
});

/** One lesson, through the card: a file chosen, sent, landed. */
async function uploadFor(key: string, name: string) {
  hub.answers[`POST ${PRESIGN}`] = presigned('content/full', name);
  mockPick.mockResolvedValue(chosen(name, 'video/mp4', 1000));
  await fireEvent.press(screen.getByTestId(`lesson-choose-${key}`));
  await waitFor(() => expect(ScriptedXhr.last?.url).toBe(`https://storage.test/put/${name}?sig=1`));
  await act(async () => {
    ScriptedXhr.last?.finish(200);
  });
  await waitFor(() => expect(draft.getLessons().find((l) => l.key === key)?.file?.name).toBe(name));
}

describe('the course step 2: the lessons, one by one', () => {
  const open = async () => {
    const calls = { back: jest.fn(), next: jest.fn() };
    await renderFrame(<LessonsScreen onBack={calls.back} onContinue={calls.next} />);
    await screen.findByText('Add the lessons');
    // The cards come once the Hub's upload rules have loaded.
    await screen.findByTestId('lessons-add');
    await waitFor(() => expect(draft.getLessons()).toHaveLength(1));
    return calls;
  };
  const next = () => screen.getByTestId('create-continue');
  const keys = () => draft.getLessons().map((l) => l.key);

  // WALK1031-FIX F2 (R-118): step 2's line used to say "The first lesson is free. The rest unlock when someone buys the course." beside step 3's
  // "Your preview is the first 30 seconds of your first lesson". No test pinned the old line; this one pins what is true (the Hub's rule in
  // `freeLessonCount`: with two lessons or more the first plays free, a course of one has none free) in step 3's words for the preview.
  it.each(['android', 'ios'] as const)('says what a buyer sees: the first 30 seconds as the preview, and which lessons play free (%s)', async (os) => {
    const platform = jest.replaceProperty(Platform, 'OS', os);
    await open();
    const line = screen.getByTestId('lessons-line');
    expect(line.props.children).toBe(
      'Your preview is the first 30 seconds of your first lesson, made for you. With two or more lessons, the first plays free and the rest unlock when someone buys the course.',
    );
    expect(screen.queryByText('The first lesson is free. The rest unlock when someone buys the course.')).toBeNull();
    const [first] = keys();
    await uploadFor(first, 'l1.mp4');
    expect(screen.getByTestId('lessons-line').props.children).toBe(line.props.children);
    platform.restore();
  });

  it('a creator fills a lesson (title, length, a file each), adds a second, and Continue waits for every lesson', async () => {
    const calls = await open();
    expect(screen.getByText('New Course')).toBeTruthy();
    expect(screen.getByText('Step 2 of 5')).toBeTruthy();
    const [first] = keys();
    // A course of one lesson has none free (the Hub's rule), so no tag yet.
    expect(screen.queryByTestId(`lesson-free-${first}`)).toBeNull();
    expect(next().props.accessibilityState.disabled).toBe(true);

    await fireEvent.changeText(screen.getByTestId(`lesson-title-${first}`), 'Welcome');
    await fireEvent.changeText(screen.getByTestId(`lesson-length-${first}`), '4:12');
    expect(next().props.accessibilityState.disabled).toBe(true);
    await uploadFor(first, 'l1.mp4');
    // The request names the course format, the lesson folder and the file's own type and size.
    expect(writes('POST', PRESIGN)[0].body).toEqual({ folder: 'content/full', format: 'course', contentType: 'video/mp4', extension: 'mp4', contentLength: 1000 });
    expect(next().props.accessibilityState.disabled).toBe(false);

    await fireEvent.press(screen.getByTestId('lessons-add'));
    const [, second] = keys();
    // With a second lesson the first is the free one.
    expect(within(screen.getByTestId(`lesson-card-${first}`)).getByText('Free')).toBeTruthy();
    expect(screen.queryByTestId(`lesson-free-${second}`)).toBeNull();
    expect(next().props.accessibilityState.disabled).toBe(true);
    await fireEvent.changeText(screen.getByTestId(`lesson-title-${second}`), 'The first job');
    await uploadFor(second, 'l2.mp4');
    expect(next().props.accessibilityState.disabled).toBe(false);
    await fireEvent.press(next());
    expect(calls.next).toHaveBeenCalledTimes(1);
    expect(draft.getLessons().map((l) => [l.title, l.duration, l.file?.key])).toEqual([
      ['Welcome', '4:12', 'content/full/u1/l1.mp4'],
      ['The first job', '', 'content/full/u1/l2.mp4'],
    ]);
  });

  it('stops a file the Hub rule would refuse, in the Hub numbers, before it goes up', async () => {
    await open();
    const [first] = keys();
    mockPick.mockResolvedValue(chosen('notes.zip', 'application/zip', 5));
    await fireEvent.press(screen.getByTestId(`lesson-choose-${first}`));
    expect(await screen.findByText('That file type is not accepted here. Choose MP4 or PDF.')).toBeTruthy();
    expect(writes('POST', PRESIGN)).toEqual([]);
    expect(draft.getLessons()[0].file).toBeNull();
  });

  it('a length must read as 4:12 or 1:20:05, and a wrong one holds Continue', async () => {
    await open();
    const [first] = keys();
    await fireEvent.changeText(screen.getByTestId(`lesson-title-${first}`), 'Welcome');
    await uploadFor(first, 'l1.mp4');
    expect(next().props.accessibilityState.disabled).toBe(false);
    await fireEvent.changeText(screen.getByTestId(`lesson-length-${first}`), '4:1');
    expect(screen.getByText('Write it as 4:12 or 1:20:05')).toBeTruthy();
    expect(next().props.accessibilityState.disabled).toBe(true);
    await fireEvent.changeText(screen.getByTestId(`lesson-length-${first}`), '1:20:05');
    expect(next().props.accessibilityState.disabled).toBe(false);
  });

  it('takes a lesson out and gives its file back to the Hub', async () => {
    hub.answers[`POST ${RELEASE}`] = ok({});
    await open();
    await fireEvent.press(screen.getByTestId('lessons-add'));
    const [first, second] = keys();
    await fireEvent.changeText(screen.getByTestId(`lesson-title-${first}`), 'Welcome');
    await uploadFor(first, 'l1.mp4');
    await fireEvent.press(screen.getByTestId(`lesson-remove-${first}`));
    expect(keys()).toEqual([second]);
    await waitFor(() => expect(writes('POST', RELEASE)).toHaveLength(1));
    expect(writes('POST', RELEASE)[0].body).toEqual({ key: 'content/full/u1/l1.mp4' });
  });

  it('moves a lesson up, and the first lesson has no Move up', async () => {
    await open();
    await fireEvent.press(screen.getByTestId('lessons-add'));
    const [first, second] = keys();
    await fireEvent.changeText(screen.getByTestId(`lesson-title-${first}`), 'One');
    await fireEvent.changeText(screen.getByTestId(`lesson-title-${second}`), 'Two');
    expect(screen.queryByTestId(`lesson-up-${first}`)).toBeNull();
    await fireEvent.press(screen.getByTestId(`lesson-up-${second}`));
    expect(draft.getLessons().map((l) => l.title)).toEqual(['Two', 'One']);
    expect(within(screen.getByTestId(`lesson-card-${second}`)).getByText('Free')).toBeTruthy();
  });

  it('a different format starts again: the files of the lessons are given back', async () => {
    hub.answers[`POST ${RELEASE}`] = ok({});
    draft.setFormat('course');
    draft.addLesson();
    const [key] = draft.getLessons().map((l) => l.key);
    draft.setLessonFile(key, file('l1.mp4'));
    draft.setFormat('video');
    expect(draft.getLessons()).toEqual([]);
    await waitFor(() => expect(writes('POST', RELEASE).map((s) => s.body)).toEqual([{ key: 'content/full/u1/l1.mp4' }]));
  });

  it('lessonsReady needs a lesson, and a title and a file on each; the first of two is the free one', () => {
    expect(lessonsModel.lessonsReady([])).toBe(false);
    expect(lessonsModel.lessonsReady([{ title: 'A', duration: '', file: file('a.mp4') }])).toBe(true);
    expect(lessonsModel.lessonsReady([{ title: 'A', duration: '', file: file('a.mp4') }, { title: ' ', duration: '', file: file('b.mp4') }])).toBe(false);
    expect(lessonsModel.isFreeLesson(0, 1)).toBe(false);
    expect(lessonsModel.isFreeLesson(0, 2)).toBe(true);
    expect(lessonsModel.isFreeLesson(1, 2)).toBe(false);
  });
});

describe('the course step 5: the piece, then its lessons', () => {
  const haveCourse = () => {
    draft.setFormat('course');
    draft.addLesson();
    draft.addLesson();
    const [a, b] = draft.getLessons().map((l) => l.key);
    draft.setLessonText(a, { title: 'Welcome', duration: '4:12' });
    draft.setLessonFile(a, file('l1.mp4'));
    draft.setLessonText(b, { title: 'The first job' });
    draft.setLessonFile(b, file('l2.mp4'));
    details.setDetails({ title: 'VFX for Beginners', description: 'Twelve lessons.', category: 'media_communications', accessType: 'paid', price: '8000' });
  };
  const open = async () => {
    haveCourse();
    const calls = { back: jest.fn(), sent: jest.fn() };
    await renderFrame(<PriceScreen format="course" onBack={calls.back} onSent={calls.sent} />);
    return calls;
  };

  it('Send for review makes the course with its first lesson as the full file, then saves the lessons in order', async () => {
    hub.answers[`POST ${CREATE}`] = created('VFX for Beginners');
    hub.answers[`PUT ${PUT_LESSONS}`] = ok({ lessons: [] });
    const calls = await open();
    await fireEvent.press(screen.getByTestId('create-send'));
    await waitFor(() => expect(calls.sent).toHaveBeenCalledTimes(1));
    const order = hub.sent.filter((s) => s.path === CREATE || s.path === PUT_LESSONS).map((s) => `${s.method} ${s.path}`);
    expect(order).toEqual([`POST ${CREATE}`, `PUT ${PUT_LESSONS}`]);
    expect(writes('POST', CREATE)[0].body).toMatchObject({
      contentType: 'course',
      price: 8000,
      previewFromFile: true,
      fullAsset: 'https://storage.test/content/full/u1/l1.mp4?read=1',
    });
    expect(writes('PUT', PUT_LESSONS)[0].body).toEqual({
      lessons: [
        { title: 'Welcome', durationLabel: '4:12', assetKey: 'content/full/u1/l1.mp4' },
        { title: 'The first job', assetKey: 'content/full/u1/l2.mp4' },
      ],
    });
    expect(details.getSent()).toEqual({ title: 'VFX for Beginners' });
    expect(draft.getLessons()).toEqual([]);
    expect(draft.getMade()).toBeNull();
    // The files belong to the course now: nothing is given back.
    expect(writes('POST', RELEASE)).toEqual([]);
  });

  it('when the lessons do not save, the course stays in review and Save the lessons tries only them again, never a second course', async () => {
    hub.answers[`POST ${CREATE}`] = created('VFX for Beginners');
    hub.answers[`PUT ${PUT_LESSONS}`] = refusal(400, 'Every lesson file must be a file you uploaded.');
    const calls = await open();
    await fireEvent.press(screen.getByTestId('create-send'));
    const banner = await screen.findByTestId('price-failure');
    expect(within(banner).getByText('Your course is in review, but its lessons did not save. Every lesson file must be a file you uploaded.')).toBeTruthy();
    expect(screen.getByText('Save the lessons')).toBeTruthy();
    expect(calls.sent).not.toHaveBeenCalled();
    expect(draft.getMade()).toEqual({ id: 'c1', title: 'VFX for Beginners' });
    // The draft is still whole, so the screen does not send the person back a step.
    expect(draft.getLessons()).toHaveLength(2);

    hub.answers[`PUT ${PUT_LESSONS}`] = ok({ lessons: [] });
    await fireEvent.press(screen.getByTestId('create-send'));
    await waitFor(() => expect(calls.sent).toHaveBeenCalledTimes(1));
    expect(writes('POST', CREATE)).toHaveLength(1);
    expect(writes('PUT', PUT_LESSONS)).toHaveLength(2);
    expect(draft.getMade()).toBeNull();
    expect(draft.getLessons()).toEqual([]);
  });

  it('lessonInputs sends a length only when one was typed, and the file key of each lesson', () => {
    expect(lessonInputs([{ key: 'a', title: ' Welcome ', duration: ' 4:12 ', file: file('a.mp4') }, { key: 'b', title: 'Two', duration: '', file: file('b.mp4') }])).toEqual([
      { title: 'Welcome', durationLabel: '4:12', assetKey: 'content/full/u1/a.mp4' },
      { title: 'Two', assetKey: 'content/full/u1/b.mp4' },
    ]);
  });
});

describe('M23: From a course (FIX-111, H24)', () => {
  const COURSES = [
    { id: 'c1', title: 'VFX for Beginners', status: 'live', contentType: 'course' },
    { id: 'c2', title: 'Sound for Film', status: 'pending', contentType: 'course' },
    { id: 'c3', title: 'Turned down', status: 'rejected', contentType: 'course' },
  ];
  const open = async (format: 'video' | 'course' = 'video') => {
    await renderFrame(<DetailsScreen format={format} onBack={jest.fn()} onContinue={jest.fn()} />);
  };

  it('a creator with a course can name it: the field lists live and waiting courses and not a turned-down one, and None clears it', async () => {
    hub.answers[`GET ${MINE}`] = ok(COURSES);
    await open();
    await fireEvent.press(await screen.findByTestId('details-course'));
    expect(await screen.findByTestId('course-c1')).toBeTruthy();
    expect(screen.getByTestId('course-c2')).toBeTruthy();
    expect(screen.getByText('In review')).toBeTruthy();
    expect(screen.queryByTestId('course-c3')).toBeNull();
    // The request asks for courses only.
    expect(writes('GET', MINE)[0]).toBeTruthy();
    await fireEvent.press(screen.getByTestId('course-c1'));
    expect(details.getDetails().parentCourse).toEqual({ id: 'c1', title: 'VFX for Beginners' });
    expect(within(screen.getByTestId('details-course')).getByText('VFX for Beginners')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('details-course'));
    expect(screen.getByLabelText('VFX for Beginners, chosen')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('course-none'));
    expect(details.getDetails().parentCourse).toBeNull();
  });

  it('draws no field for a creator with no course', async () => {
    hub.answers[`GET ${MINE}`] = ok([]);
    await open();
    await waitFor(() => expect(writes('GET', MINE)).toHaveLength(1));
    expect(screen.queryByTestId('details-course')).toBeNull();
  });

  it('draws no field for a course itself, and does not even ask for the courses', async () => {
    hub.answers[`GET ${MINE}`] = ok(COURSES);
    await open('course');
    expect(await screen.findByTestId('details-title')).toBeTruthy();
    expect(screen.queryByTestId('details-course')).toBeNull();
    expect(writes('GET', MINE)).toEqual([]);
  });

  it('a piece that names a course sends it as parentCourseId, and one that names none sends no such key', async () => {
    draft.setFormat('video');
    draft.setFull(file('full.mp4'));
    details.setDetails({ title: 'Orbit shot', description: 'One take.', category: 'media_communications', accessType: 'free', parentCourse: { id: 'c1', title: 'VFX for Beginners' } });
    hub.answers[`POST ${CREATE}`] = created('Orbit shot');
    const onSent = jest.fn();
    await renderFrame(<PriceScreen format="video" onBack={jest.fn()} onSent={onSent} />);
    await fireEvent.press(screen.getByTestId('create-send'));
    await waitFor(() => expect(onSent).toHaveBeenCalledTimes(1));
    expect(writes('POST', CREATE)[0].body).toMatchObject({ contentType: 'video', accessType: 'free', price: 0, parentCourseId: 'c1' });
    // No lessons call for a piece that is not a course.
    expect(writes('PUT', PUT_LESSONS)).toEqual([]);
  });

  it('a piece with no course sends no parentCourseId', async () => {
    draft.setFormat('video');
    draft.setFull(file('full.mp4'));
    details.setDetails({ title: 'Orbit shot', description: 'One take.', category: 'media_communications', accessType: 'free' });
    hub.answers[`POST ${CREATE}`] = created('Orbit shot');
    const onSent = jest.fn();
    await renderFrame(<PriceScreen format="video" onBack={jest.fn()} onSent={onSent} />);
    await fireEvent.press(screen.getByTestId('create-send'));
    await waitFor(() => expect(onSent).toHaveBeenCalledTimes(1));
    expect(Object.keys(writes('POST', CREATE)[0].body as object)).not.toContain('parentCourseId');
  });
});
