/* eslint-disable @typescript-eslint/no-require-imports */
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react-native';

import { ScriptedXhr, FORMATS, chosen, hub, installFetch, installXhr, ok, presigned, refusal, renderFrame } from '../../create/__helpers__/harness';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

// The phone's files are not here under jest: each test says what the person chose.
const mockPick = jest.fn();
jest.mock('../../create/pickFile', () => ({ canPickFile: true, pickFile: (...args: unknown[]) => mockPick(...args) }));

installFetch();
const { queryClient: appClient } = require('@/api/query') as typeof import('@/api/query');
const { LessonsEditScreen, lessonBody, rowReady } = require('../LessonsEditScreen') as typeof import('../LessonsEditScreen');

const PIECE = '/api/hub/content/mine/library/course-1';
const DETAIL = '/api/hub/content/course-1/detail';
const PUT_LESSONS = '/api/hub/content/course-1/lessons';
const PRESIGN = '/api/hub/uploads/presign';
const FORMATS_PATH = '/api/hub/uploads/formats';

const lesson = (id: string, title: string, durationLabel: string | null, hasFile: boolean, order: number) => ({ id, title, order, durationLabel, isFree: order === 1, hasFile });
const HELD = [lesson('l1', 'Welcome', '3:10', true, 1), lesson('l2', 'Setup', null, true, 2), lesson('l3', 'Coming soon', null, false, 3)];

const libraryPiece = { id: 'course-1', title: 'VFX for Beginners', status: 'live', price: 8000, contentType: 'course', previewAssetUrl: '', salesCount: 0, rejectionReason: null };
const detail = (lessons: unknown[]) => ({ contentId: 'course-1', contentType: 'course', updatedAt: '2026-10-01T10:00:00Z', purchasedAt: null, buyerCount: 0, studentCount: null, freePreview: { pages: null, seconds: null, lessons: null }, lessons, parentCourse: null, rating: { average: null, count: 0, myRating: null, canRate: false, cannotRateReason: 'own_content' }, creator: {} });
const puts = () => hub.sent.filter((s) => s.method === 'PUT' && s.path === PUT_LESSONS);

beforeEach(() => {
  installFetch();
  installXhr();
  mockPick.mockReset();
  appClient.clear();
  hub.answers[`GET ${FORMATS_PATH}`] = ok(FORMATS);
  hub.answers[`GET ${PIECE}`] = ok(libraryPiece);
  hub.answers[`GET ${DETAIL}`] = ok(detail(HELD));
  hub.answers[`PUT ${PUT_LESSONS}`] = ok({ lessons: [] });
});

const open = async () => {
  const calls = { back: jest.fn(), saved: jest.fn() };
  await renderFrame(<LessonsEditScreen id="course-1" onBack={calls.back} onSaved={calls.saved} />);
  await screen.findByTestId('lesson-card-l1');
  return calls;
};
const save = () => screen.getByTestId('lessons-save');

describe('Edit lessons (FIX-111): from the creator\'s own course', () => {
  it('shows the lessons the Hub holds, in order, the first Free, and Save waits for a change', async () => {
    await open();
    expect(screen.getByText('VFX for Beginners')).toBeTruthy();
    expect(screen.getByDisplayValue('Welcome')).toBeTruthy();
    expect(screen.getByDisplayValue('3:10')).toBeTruthy();
    expect(within(screen.getByTestId('lesson-card-l1')).getByText('Free')).toBeTruthy();
    expect(within(screen.getByTestId('lesson-card-l2')).queryByText('Free')).toBeNull();
    // A lesson that already has its file shows it as saved; one with none offers to choose it.
    expect(within(screen.getByTestId('lesson-card-l1')).getByText('File saved')).toBeTruthy();
    expect(screen.getByTestId('lesson-choose-l3')).toBeTruthy();
    expect(save().props.accessibilityState.disabled).toBe(true);
  });

  it('renaming a lesson saves the whole list; a kept lesson sends its id and no file, so the Hub keeps the file it has', async () => {
    const calls = await open();
    await fireEvent.changeText(screen.getByTestId('lesson-title-l2'), 'Setup your machine');
    expect(save().props.accessibilityState.disabled).toBe(false);
    await fireEvent.press(save());
    await waitFor(() => expect(calls.saved).toHaveBeenCalledTimes(1));
    expect(puts()).toHaveLength(1);
    expect(puts()[0].body).toEqual({
      lessons: [{ id: 'l1', title: 'Welcome', durationLabel: '3:10' }, { id: 'l2', title: 'Setup your machine' }, { id: 'l3', title: 'Coming soon' }],
    });
  });

  it('puts a lesson earlier, and the order sent is the order shown', async () => {
    await open();
    await fireEvent.press(screen.getByTestId('lesson-up-l3'));
    await fireEvent.press(save());
    await waitFor(() => expect(puts()).toHaveLength(1));
    expect((puts()[0].body as { lessons: { id: string }[] }).lessons.map((l) => l.id)).toEqual(['l1', 'l3', 'l2']);
  });

  it('takes a lesson out, and the list sent leaves it out', async () => {
    await open();
    await fireEvent.press(screen.getByTestId('lesson-remove-l2'));
    expect(screen.queryByTestId('lesson-card-l2')).toBeNull();
    await fireEvent.press(save());
    await waitFor(() => expect(puts()).toHaveLength(1));
    expect((puts()[0].body as { lessons: { id: string }[] }).lessons.map((l) => l.id)).toEqual(['l1', 'l3']);
  });

  it('adds a lesson: it needs a title and a file, and it goes at the end with its file key and no id', async () => {
    await open();
    await fireEvent.press(screen.getByTestId('lessons-edit-add'));
    const added = screen.getAllByTestId(/^lesson-card-new-/)[0];
    const key = added.props.testID.replace('lesson-card-', '');
    expect(save().props.accessibilityState.disabled).toBe(true);
    await fireEvent.changeText(screen.getByTestId(`lesson-title-${key}`), 'Bonus');
    expect(save().props.accessibilityState.disabled).toBe(true);
    hub.answers[`POST ${PRESIGN}`] = presigned('content/full', 'bonus.mp4');
    mockPick.mockResolvedValue(chosen('bonus.mp4', 'video/mp4', 1000));
    await fireEvent.press(screen.getByTestId(`lesson-choose-${key}`));
    await waitFor(() => expect(ScriptedXhr.last).not.toBeNull());
    await act(async () => {
      ScriptedXhr.last?.finish(200);
    });
    await waitFor(() => expect(save().props.accessibilityState.disabled).toBe(false));
    await fireEvent.press(save());
    await waitFor(() => expect(puts()).toHaveLength(1));
    const lessons = (puts()[0].body as { lessons: Record<string, unknown>[] }).lessons;
    expect(lessons).toHaveLength(4);
    expect(lessons[3]).toEqual({ title: 'Bonus', assetKey: 'content/full/u1/bonus.mp4' });
  });

  it('gives a lesson that has no file its file, and that lesson sends the new key', async () => {
    await open();
    hub.answers[`POST ${PRESIGN}`] = presigned('content/full', 'soon.mp4');
    mockPick.mockResolvedValue(chosen('soon.mp4', 'video/mp4', 1000));
    await fireEvent.press(screen.getByTestId('lesson-choose-l3'));
    await waitFor(() => expect(ScriptedXhr.last).not.toBeNull());
    await act(async () => {
      ScriptedXhr.last?.finish(200);
    });
    await waitFor(() => expect(save().props.accessibilityState.disabled).toBe(false));
    await fireEvent.press(save());
    await waitFor(() => expect(puts()).toHaveLength(1));
    expect((puts()[0].body as { lessons: unknown[] }).lessons[2]).toEqual({ id: 'l3', title: 'Coming soon', assetKey: 'content/full/u1/soon.mp4' });
  });

  it('shows the Hub\'s own words when it refuses (a course people bought never loses a lesson), and keeps the edits', async () => {
    hub.answers[`PUT ${PUT_LESSONS}`] = refusal(409, 'People have bought this course, so a lesson cannot be taken out of it.');
    const calls = await open();
    await fireEvent.press(screen.getByTestId('lesson-remove-l2'));
    await fireEvent.press(save());
    const banner = await screen.findByTestId('lessons-edit-failure');
    expect(within(banner).getByText('People have bought this course, so a lesson cannot be taken out of it.')).toBeTruthy();
    expect(calls.saved).not.toHaveBeenCalled();
    expect(screen.queryByTestId('lesson-card-l2')).toBeNull();
    expect(save().props.accessibilityState.disabled).toBe(false);
  });

  it('a course with no lesson yet opens on one blank lesson', async () => {
    hub.answers[`GET ${DETAIL}`] = ok(detail([]));
    await renderFrame(<LessonsEditScreen id="course-1" onBack={jest.fn()} onSaved={jest.fn()} />);
    expect(await screen.findAllByTestId(/^lesson-card-new-/)).toHaveLength(1);
  });

  it('lessonBody and rowReady follow the Hub: a kept lesson needs no file, a new one does, and an empty length is left out', () => {
    expect(rowReady({ key: 'a', id: 'l1', title: 'A', duration: '', file: null, saved: true })).toBe(true);
    expect(rowReady({ key: 'n', title: 'A', duration: '', file: null, saved: false })).toBe(false);
    expect(rowReady({ key: 'a', id: 'l1', title: ' ', duration: '', file: null, saved: true })).toBe(false);
    expect(lessonBody([{ key: 'a', id: 'l1', title: ' A ', duration: ' ', file: null, saved: true }])).toEqual([{ id: 'l1', title: 'A' }]);
  });
});
