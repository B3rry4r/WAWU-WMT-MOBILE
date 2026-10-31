/* eslint-disable @typescript-eslint/no-require-imports */
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';

import { chosen, installXhr, presigned, ScriptedXhr } from '@/features/create/__helpers__/harness';
import { pricesAnswer } from '@/features/prices/__helpers__/prices';

import { calls, hub, installFetch, ok, piece, refusal, renderFrame } from '../__helpers__/hub';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));
const mockPick = jest.fn();
jest.mock('@/features/create/pickFile', () => ({ canPickFile: true, pickFile: (...args: unknown[]) => mockPick(...args) }));

/*
 * COVERS-APP (R-114): Edit details changes or removes a piece's cover. Nothing goes to the Hub until Save: a new picture's key replaces the cover
 * (`coverAsset` on PATCH /content/{id}), null takes it off, and left alone it is not sent. The phone's picker is the real handler's contract
 * (Platform.OS android; `pickFile` is given the types the Hub takes for a cover).
 */
installFetch();
const { EditDetailsScreen, changesOf } = require('../EditDetailsScreen') as typeof import('../EditDetailsScreen');

const MINE = '/api/hub/content/mine/library/r1';
const PATCH = '/api/hub/content/r1';
const PRESIGN = '/api/hub/uploads/presign';
const COVER = 'https://cdn.test/covers/c.jpg?sig=1';

const rejected = (over: Record<string, unknown> = {}) =>
  piece({ id: 'r1', title: 'Pricing playbook', description: 'Eighty pages.', contentType: 'video', category: 'business_entrepreneurship', status: 'rejected', price: 2000, salesCount: 0, rejectionReason: 'Charts were taken.', coverUrl: COVER, ...over });

beforeEach(() => {
  jest.replaceProperty(Platform, 'OS', 'android');
  installFetch();
  installXhr();
  mockPick.mockReset();
  hub.answers[`GET ${MINE}`] = ok(rejected());
  hub.answers['GET /api/hub/prices'] = pricesAnswer();
});
afterEach(() => {
  jest.restoreAllMocks();
});

const open = async () => {
  const handlers = { back: jest.fn(), saved: jest.fn() };
  const view = await renderFrame(<EditDetailsScreen id="r1" onBack={handlers.back} onSaved={handlers.saved} />);
  await screen.findByTestId('edit-cover');
  return { ...handlers, ...view };
};

describe('Edit details · the cover (Android)', () => {
  it('a user sees the piece\'s cover with Change and Remove, and Save waits for a change', async () => {
    await open();
    expect(screen.getByTestId('edit-cover-image').props.source).toEqual([{ uri: COVER }]);
    expect(screen.getByText('Your cover')).toBeTruthy();
    expect(screen.getByTestId('edit-save').props.accessibilityState.disabled).toBe(true);
  });

  it('Change picks a picture (png, jpeg or webp), sends it to content/cover and, on Save, replaces the cover', async () => {
    hub.answers[`POST ${PRESIGN}`] = presigned('content/cover', 'new.png');
    hub.answers[`PATCH ${PATCH}`] = ok(rejected());
    mockPick.mockResolvedValue(chosen('new.png', 'image/png', 3, { previewUri: 'file:///cache/new.png' }));
    const handlers = await open();
    await fireEvent.press(screen.getByTestId('edit-cover-pick'));
    expect(mockPick).toHaveBeenCalledWith(['image/png', 'image/jpeg', 'image/webp']);
    await waitFor(() => expect(ScriptedXhr.last).not.toBeNull());
    expect(calls('POST', PRESIGN)[0].body).toMatchObject({ folder: 'content/cover', contentType: 'image/png' });
    await act(async () => {
      ScriptedXhr.last?.finish(200);
    });
    expect((await screen.findByTestId('edit-cover-image')).props.source).toEqual([{ uri: 'file:///cache/new.png' }]);
    expect(screen.getByTestId('edit-save').props.accessibilityState.disabled).toBe(false);
    await fireEvent.press(screen.getByTestId('edit-save'));
    await waitFor(() => expect(handlers.saved).toHaveBeenCalledTimes(1));
    expect(calls('PATCH', PATCH)[0].body).toEqual({ coverAsset: 'https://storage.test/content/cover/u1/new.png?read=1' });
  });

  it('Remove takes the cover off on Save (coverAsset null), and the row says so before', async () => {
    hub.answers[`PATCH ${PATCH}`] = ok(rejected({ coverUrl: null }));
    const handlers = await open();
    await fireEvent.press(screen.getByTestId('edit-cover-remove'));
    expect(screen.getByText('No cover after you save')).toBeTruthy();
    expect(screen.queryByTestId('edit-cover-image')).toBeNull();
    await fireEvent.press(screen.getByTestId('edit-save'));
    await waitFor(() => expect(handlers.saved).toHaveBeenCalledTimes(1));
    expect(calls('PATCH', PATCH)[0].body).toEqual({ coverAsset: null });
  });

  it('a Hub refusal of the picture (over 5 MB) is shown in the Hub\'s own words, and the cover is left as it was', async () => {
    hub.answers[`POST ${PRESIGN}`] = refusal(400, 'That picture is over the 5 MB limit for a cover.');
    mockPick.mockResolvedValue(chosen('big.png', 'image/png', 3, { previewUri: 'file:///cache/big.png' }));
    await open();
    await fireEvent.press(screen.getByTestId('edit-cover-pick'));
    expect(await screen.findByText('That picture is over the 5 MB limit for a cover.')).toBeTruthy();
    expect(screen.getByTestId('edit-cover-image').props.source).toEqual([{ uri: COVER }]);
    expect(screen.getByTestId('edit-save').props.accessibilityState.disabled).toBe(true);
  });

  it('a piece with no cover offers Pick a picture and no Remove, and changesOf names the cover only when it changes', async () => {
    hub.answers[`GET ${MINE}`] = ok(rejected({ coverUrl: null }));
    await open();
    expect(screen.getByTestId('edit-cover-pick').props.accessibilityLabel ?? '').toBeDefined();
    expect(screen.getByText('Pick a picture')).toBeTruthy();
    expect(screen.queryByTestId('edit-cover-remove')).toBeNull();
    const p = rejected() as never;
    const start = { title: 'Pricing playbook', description: 'Eighty pages.', category: 'business_entrepreneurship', accessType: 'paid', price: '2000' } as never;
    expect(changesOf(p, start)).toBeNull();
    expect(changesOf(p, start, { kind: 'remove' })).toEqual({ coverAsset: null });
  });
});
