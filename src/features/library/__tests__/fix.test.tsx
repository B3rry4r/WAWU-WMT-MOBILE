/* eslint-disable @typescript-eslint/no-require-imports */
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';

import { chosen, FORMATS, installXhr, presigned, ScriptedXhr } from '@/features/create/__helpers__/harness';

import { calls, hub, installFetch, ok, piece, refusal, renderFrame } from '../__helpers__/hub';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));
const mockPick = jest.fn();
jest.mock('@/features/create/pickFile', () => ({ canPickFile: true, pickFile: (...args: unknown[]) => mockPick(...args) }));

installFetch();
const { EditDetailsScreen, changesOf, startingDetails } = require('../EditDetailsScreen') as typeof import('../EditDetailsScreen');
const { ReplaceFileScreen } = require('../ReplaceFileScreen') as typeof import('../ReplaceFileScreen');

const MINE = '/api/hub/content/mine/library/r1';
const PATCH = '/api/hub/content/r1';
const FORMATS_PATH = '/api/hub/uploads/formats';
const PRESIGN = '/api/hub/uploads/presign';

const rejected = (over: Record<string, unknown> = {}) =>
  piece({
    id: 'r1',
    title: 'Pricing playbook',
    description: 'Eighty pages on anchoring your rate.',
    contentType: 'pdf',
    category: 'business_entrepreneurship',
    status: 'rejected',
    price: 2000,
    salesCount: 0,
    rejectionReason: 'Charts were taken from another publisher.',
    ...over,
  });

beforeEach(() => {
  installFetch();
  installXhr();
  mockPick.mockReset();
  hub.answers[`GET ${MINE}`] = ok(rejected());
  hub.answers[`GET ${FORMATS_PATH}`] = ok(FORMATS);
});

describe('Edit details (from M26)', () => {
  const open = async () => {
    const handlers = { back: jest.fn(), saved: jest.fn() };
    const view = await renderFrame(<EditDetailsScreen id="r1" onBack={handlers.back} onSaved={handlers.saved} />);
    return { ...handlers, ...view };
  };

  it('starts from the piece as the Hub holds it, and Save waits for a change', async () => {
    await open();
    expect(await screen.findByDisplayValue('Pricing playbook')).toBeTruthy();
    expect(screen.getByDisplayValue('Eighty pages on anchoring your rate.')).toBeTruthy();
    expect(screen.getByText('Business & Entrepreneurship')).toBeTruthy();
    expect(screen.getByDisplayValue('2,000')).toBeTruthy();
    expect(screen.getByTestId('edit-save').props.accessibilityState.disabled).toBe(true);
  });

  it('a user can change the title and the price, and only what changed goes to the Hub', async () => {
    const saved = rejected({ title: 'The Freelancer’s Pricing Playbook', price: 3500 });
    hub.answers[`PATCH ${PATCH}`] = ok(saved);
    const handlers = await open();
    await screen.findByDisplayValue('Pricing playbook');
    // From here the Hub holds the saved piece, as it does.
    hub.answers[`GET ${MINE}`] = ok(saved);
    await fireEvent.changeText(await screen.findByTestId('edit-title'), '  The Freelancer’s Pricing Playbook ');
    await fireEvent.changeText(screen.getByTestId('price-input'), '3500');
    await fireEvent.press(screen.getByTestId('edit-save'));
    await waitFor(() => expect(handlers.saved).toHaveBeenCalledTimes(1));
    expect(calls('PATCH', PATCH)[0].body).toEqual({ title: 'The Freelancer’s Pricing Playbook', accessType: 'paid', price: 3500 });
    // M26 holds the saved piece, and asks the Hub for it again.
    await waitFor(() => expect(handlers.queryClient.getQueryData(['library', 'piece', 'r1'])).toMatchObject({ price: 3500 }));
  });

  it('a user can change the category from the Hub’s 25, and make the piece free (price 0 goes with it)', async () => {
    hub.answers[`PATCH ${PATCH}`] = ok(rejected({ category: 'finance', accessType: 'free', price: 0 }));
    const handlers = await open();
    await fireEvent.press(await screen.findByTestId('edit-category'));
    await fireEvent.press(await screen.findByTestId('category-finance'));
    await fireEvent.press(screen.getByText('Free'));
    expect(screen.getByText('Free for everyone')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('edit-save'));
    await waitFor(() => expect(handlers.saved).toHaveBeenCalledTimes(1));
    expect(calls('PATCH', PATCH)[0].body).toEqual({ category: 'finance', accessType: 'free', price: 0 });
  });

  it('does not let a paid piece go without a price, or a piece without a title', async () => {
    await open();
    await fireEvent.changeText(await screen.findByTestId('price-input'), '');
    expect(screen.getByTestId('edit-save').props.accessibilityState.disabled).toBe(true);
    await fireEvent.changeText(screen.getByTestId('price-input'), '2500');
    expect(screen.getByTestId('edit-save').props.accessibilityState.disabled).toBe(false);
    await fireEvent.changeText(screen.getByTestId('edit-title'), '   ');
    expect(screen.getByTestId('edit-save').props.accessibilityState.disabled).toBe(true);
  });

  it('shows the Hub’s own sentence when it will not save, and keeps what was typed', async () => {
    hub.answers[`PATCH ${PATCH}`] = refusal(409, 'This piece was reviewed a moment ago. Open it again to see where it stands.');
    const handlers = await open();
    await fireEvent.changeText(await screen.findByTestId('edit-title'), 'A better title');
    await fireEvent.press(screen.getByTestId('edit-save'));
    expect(await screen.findByText('This piece was reviewed a moment ago. Open it again to see where it stands.')).toBeTruthy();
    expect(handlers.saved).not.toHaveBeenCalled();
    expect(screen.getByDisplayValue('A better title')).toBeTruthy();
  });

  it('says why the piece did not open, and shows a loading state first', async () => {
    hub.answers[`GET ${MINE}`] = 'hang';
    await open();
    expect(await screen.findByTestId('edit-loading')).toBeTruthy();
  });

  it('builds the changes from the piece: a category the Hub no longer lists starts empty and is not sent', () => {
    const p = rejected({ category: 'a_category_that_is_gone' }) as never;
    const start = startingDetails(p);
    expect(start.category).toBeNull();
    expect(changesOf(p, { ...start, title: 'New' })).toEqual({ title: 'New' });
    expect(changesOf(p, start)).toBeNull();
  });
});

describe('Replace the file (from M26)', () => {
  const open = async () => {
    const handlers = { back: jest.fn(), replaced: jest.fn() };
    const view = await renderFrame(<ReplaceFileScreen id="r1" onBack={handlers.back} onReplaced={handlers.replaced} />);
    return { ...handlers, ...view };
  };

  it('a user can pick a fixed file: it goes up under the format’s rule, is put on the piece, and M26 comes back', async () => {
    hub.answers[`POST ${PRESIGN}`] = presigned('content/full', 'fixed.pdf');
    hub.answers[`PATCH ${PATCH}`] = ok(rejected({ fullAssetUrl: 'https://storage.test/content/full/u1/fixed.pdf?read=1' }));
    mockPick.mockResolvedValue(chosen('fixed.pdf', 'application/pdf', 4000));
    const handlers = await open();
    expect(await screen.findByText('Replace the PDF')).toBeTruthy();
    await fireEvent.press(await screen.findByTestId('upload-drop'));
    await waitFor(() => expect(ScriptedXhr.last).not.toBeNull());
    expect(calls('POST', PRESIGN)[0].body).toMatchObject({ folder: 'content/full', format: 'pdf', contentType: 'application/pdf', extension: 'pdf' });
    expect(mockPick).toHaveBeenCalledWith(['application/pdf']);
    await act(async () => {
      ScriptedXhr.last?.progress(2000, 4000);
    });
    expect(screen.getByTestId('create-percent')).toHaveTextContent('50%');
    await act(async () => {
      ScriptedXhr.last?.finish(200);
    });
    await waitFor(() => expect(handlers.replaced).toHaveBeenCalledTimes(1));
    expect(calls('PATCH', PATCH)[0].body).toEqual({ fullAsset: 'https://storage.test/content/full/u1/fixed.pdf?read=1' });
  });

  it('stops at the edge when the file is not one the format takes, in the Hub’s own numbers', async () => {
    mockPick.mockResolvedValue(chosen('picture.png', 'image/png', 10));
    await open();
    await fireEvent.press(await screen.findByTestId('upload-drop'));
    expect(await screen.findByText('That file type is not accepted here. Choose PDF.')).toBeTruthy();
    expect(calls('POST', PRESIGN)).toHaveLength(0);
  });

  it('keeps a file that went up when the piece would not take it, and Try again repeats only that step', async () => {
    hub.answers[`POST ${PRESIGN}`] = presigned('content/full', 'fixed.pdf');
    hub.answers[`PATCH ${PATCH}`] = refusal(402, 'You need a plan to send a file.', { reason: { code: 'tier_required' } });
    mockPick.mockResolvedValue(chosen('fixed.pdf', 'application/pdf', 4000));
    const handlers = await open();
    await fireEvent.press(await screen.findByTestId('upload-drop'));
    await waitFor(() => expect(ScriptedXhr.last).not.toBeNull());
    await act(async () => {
      ScriptedXhr.last?.finish(200);
    });
    expect(await screen.findByText('You need a plan to send a file.')).toBeTruthy();
    expect(handlers.replaced).not.toHaveBeenCalled();
    hub.answers[`PATCH ${PATCH}`] = ok(rejected());
    await fireEvent.press(screen.getByTestId('replace-retry'));
    await waitFor(() => expect(handlers.replaced).toHaveBeenCalledTimes(1));
    expect(calls('POST', PRESIGN)).toHaveLength(1);
    expect(calls('PATCH', PATCH)).toHaveLength(2);
  });

  it('says why the upload rules did not load, and shows a quiet block while they do', async () => {
    hub.answers[`GET ${FORMATS_PATH}`] = 'hang';
    await open();
    expect(await screen.findByTestId('replace-loading')).toBeTruthy();
  });
});
