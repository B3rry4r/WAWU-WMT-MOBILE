/* eslint-disable @typescript-eslint/no-require-imports */
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';

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
const { CreateScreen } = require('../CreateScreen') as typeof import('../CreateScreen');
const { FormatScreen } = require('../FormatScreen') as typeof import('../FormatScreen');
const { UploadScreen } = require('../UploadScreen') as typeof import('../UploadScreen');
const { PreviewScreen } = require('../PreviewScreen') as typeof import('../PreviewScreen');
const { CreateEntry } = require('../CreateEntry') as typeof import('../CreateEntry');
const draft = require('../draft') as typeof import('../draft');

const ALLOWANCE = '/api/hub/uploads/allowance';
const FORMATS_PATH = '/api/hub/uploads/formats';
const PRESIGN = '/api/hub/uploads/presign';
const ME = '/api/hub/users/me';
const MB = 1024 * 1024;

beforeEach(() => {
  installFetch();
  installXhr();
  mockPick.mockReset();
  draft.resetDraft();
  appClient.clear();
  hub.answers[`GET ${FORMATS_PATH}`] = ok(FORMATS);
});

describe('M19 · Create', () => {
  const open = async () => {
    const calls = { close: jest.fn(), content: jest.fn(), event: jest.fn(), service: jest.fn() };
    await renderFrame(<CreateScreen onClose={calls.close} onContent={calls.content} onEvent={calls.event} onService={calls.service} />);
    return calls;
  };

  it('a user can pick Content, Event or Service, or close', async () => {
    hub.answers[`GET ${ALLOWANCE}`] = ok(allowance(4, 5));
    const calls = await open();
    await fireEvent.press(await screen.findByTestId('create-tile-content'));
    await fireEvent.press(screen.getByTestId('create-tile-event'));
    await fireEvent.press(screen.getByTestId('create-tile-service'));
    await fireEvent.press(screen.getByLabelText('Close'));
    expect(calls.content).toHaveBeenCalledTimes(1);
    expect(calls.event).toHaveBeenCalledTimes(1);
    expect(calls.service).toHaveBeenCalledTimes(1);
    expect(calls.close).toHaveBeenCalledTimes(1);
  });

  it('shows the tile words as drawn, and no tile or link whose screen is not built', async () => {
    hub.answers[`GET ${ALLOWANCE}`] = ok(allowance(4, 5));
    await open();
    await screen.findByTestId('create-meter');
    expect(screen.getByText('Video, course, audio, PDF, image or template')).toBeTruthy();
    expect(screen.getByText('Needs a verified tick')).toBeTruthy();
    expect(screen.getByText('Get listed as a professional')).toBeTruthy();
    expect(screen.queryByTestId('create-tile-community')).toBeNull();
    expect(screen.queryByText('A room your people talk in')).toBeNull();
    expect(screen.queryByText('Get verified')).toBeNull();
  });

  it('shows the uploads used and the limits from the Hub, never typed on the screen', async () => {
    hub.answers[`GET ${ALLOWANCE}`] = ok(allowance(4, 5));
    await open();
    expect(await screen.findByText('4 of 5 used')).toBeTruthy();
    expect(screen.getByText('Get verified for up to 25 uploads and more reach.')).toBeTruthy();
  });

  it('follows a ticked account: a longer bar, its own limit and no way up to offer', async () => {
    hub.answers[`GET ${ALLOWANCE}`] = ok(allowance(7, 25, true));
    await open();
    expect(await screen.findByText('7 of 25 used')).toBeTruthy();
    expect(screen.getByText('Verified · up to 25 uploads.')).toBeTruthy();
    expect(screen.queryByText(/Get verified/)).toBeNull();
  });

  it('keeps the tiles working when the count cannot be read, says so, and asks again on Try again', async () => {
    hub.answers[`GET ${ALLOWANCE}`] = 'offline';
    const calls = await open();
    expect(await screen.findByTestId('create-meter-error')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('create-tile-content'));
    expect(calls.content).toHaveBeenCalled();
    hub.answers[`GET ${ALLOWANCE}`] = ok(allowance(2, 5));
    await fireEvent.press(screen.getByTestId('create-meter-retry'));
    expect(await screen.findByText('2 of 5 used')).toBeTruthy();
  });

  it('shows a quiet block while the count loads', async () => {
    hub.answers[`GET ${ALLOWANCE}`] = 'hang';
    await open();
    expect(await screen.findByTestId('create-meter-loading')).toBeTruthy();
  });
});

describe('M20 · What are you making?', () => {
  it('a user can choose a format and Continue; Continue waits for a pick', async () => {
    const onContinue = jest.fn();
    await renderFrame(<FormatScreen onBack={jest.fn()} onContinue={onContinue} />);
    await screen.findByTestId('format-list');
    expect(screen.getByText('Step 1 of 5')).toBeTruthy();
    expect(screen.getByTestId('create-continue').props.accessibilityState?.disabled).toBe(true);
    await fireEvent.press(screen.getByTestId('create-continue'));
    expect(onContinue).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByTestId('format-pdf'));
    expect(screen.getByTestId('format-pdf').props.accessibilityState.selected).toBe(true);
    await fireEvent.press(screen.getByTestId('create-continue'));
    expect(onContinue).toHaveBeenCalledWith('pdf');
  });

  it('says each file type and clip length the way the Hub lists them', async () => {
    await renderFrame(<FormatScreen onBack={jest.fn()} onContinue={jest.fn()} />);
    expect(await screen.findByText('MP4 or MOV · buyers see a clip')).toBeTruthy();
    expect(screen.getByText('MP3 or WAV · 30–60 second clip')).toBeTruthy();
    expect(screen.getByText('Lessons · the first is the preview')).toBeTruthy();
    expect(screen.getByText('Guides, ebooks · give away an extract')).toBeTruthy();
  });

  it('changes a row when the Hub changes its rule', async () => {
    hub.answers[`GET ${FORMATS_PATH}`] = ok({
      formats: FORMATS.formats.map((f) => (f.id === 'audio' ? { ...f, preview: { ...f.preview, seconds: { min: 20, max: 45 } } } : f)),
    });
    await renderFrame(<FormatScreen onBack={jest.fn()} onContinue={jest.fn()} />);
    expect(await screen.findByText('MP3 or WAV · 20–45 second clip')).toBeTruthy();
    expect(screen.queryByText(/30–60/)).toBeNull();
  });

  it('shows a loading list while the rules are on their way', async () => {
    hub.answers[`GET ${FORMATS_PATH}`] = 'hang';
    await renderFrame(<FormatScreen onBack={jest.fn()} onContinue={jest.fn()} />);
    expect(await screen.findByTestId('format-loading')).toBeTruthy();
  });

  it('shows an error with Try again when the rules cannot be read, and recovers', async () => {
    hub.answers[`GET ${FORMATS_PATH}`] = 'offline';
    await renderFrame(<FormatScreen onBack={jest.fn()} onContinue={jest.fn()} />);
    expect(await screen.findByTestId('format-error')).toBeTruthy();
    hub.answers[`GET ${FORMATS_PATH}`] = ok(FORMATS);
    await fireEvent.press(screen.getByText('Try again'));
    expect(await screen.findByTestId('format-list')).toBeTruthy();
  });
});

describe('M21 · Upload', () => {
  const start = async (onContinue = jest.fn()) => {
    await renderFrame(<UploadScreen format="pdf" onBack={jest.fn()} onContinue={onContinue} />);
    return onContinue;
  };

  it('says the limit the Hub sets for the format', async () => {
    await start();
    expect(await screen.findByText('Upload the full PDF')).toBeTruthy();
    expect(screen.getByText('Up to 100 MB. It stays locked until someone buys.')).toBeTruthy();
    expect(screen.getByText('New PDF')).toBeTruthy();
    expect(screen.getByText('Step 2 of 5')).toBeTruthy();
    expect(screen.getByTestId('create-continue').props.accessibilityState?.disabled).toBe(true);
  });

  it('a user can pick a file, watch it go up, and Continue once it has landed', async () => {
    hub.answers[`POST ${PRESIGN}`] = presigned('content/full', 'a.pdf');
    mockPick.mockResolvedValue(chosen('pricing-playbook-v3.pdf', 'application/pdf', 1000));
    const onContinue = await start();
    await fireEvent.press(await screen.findByTestId('upload-drop'));
    await waitFor(() => expect(ScriptedXhr.last).not.toBeNull());
    // The request names the format and the file's own type and size.
    const presign = hub.sent.find((s) => s.path === PRESIGN);
    expect(presign?.body).toEqual({ folder: 'content/full', format: 'pdf', contentType: 'application/pdf', extension: 'pdf', contentLength: 1000 });
    expect(ScriptedXhr.last?.url).toBe('https://storage.test/put/a.pdf?sig=1');
    expect(ScriptedXhr.last?.headers['content-type']).toBe('application/pdf');
    expect(screen.getByText('pricing-playbook-v3.pdf')).toBeTruthy();
    await act(async () => { ScriptedXhr.last?.progress(64, 100); });
    expect(screen.getByText('64%')).toBeTruthy();
    expect(screen.getByTestId('create-continue').props.accessibilityState?.disabled).toBe(true);
    await act(async () => { ScriptedXhr.last?.finish(200); });
    await waitFor(() => expect(screen.getByText('100%')).toBeTruthy());
    expect(draft.getDraft().full).toMatchObject({ name: 'pricing-playbook-v3.pdf', key: 'content/full/u1/a.pdf', bytes: 1000 });
    await fireEvent.press(screen.getByTestId('create-continue'));
    expect(onContinue).toHaveBeenCalled();
  });

  it('stops a file the Hub rule would refuse, with the Hub numbers, before it goes up', async () => {
    mockPick.mockResolvedValue(chosen('big.pdf', 'application/pdf', 5, { blob: { size: 101 * MB } as Blob }));
    await start();
    await fireEvent.press(await screen.findByTestId('upload-drop'));
    expect(await screen.findByText('That file is over the 100 MB limit.')).toBeTruthy();
    expect(hub.sent.some((s) => s.path === PRESIGN)).toBe(false);
    mockPick.mockResolvedValue(chosen('clip.mp4', 'video/mp4', 5));
    await fireEvent.press(screen.getByTestId('upload-drop'));
    expect(await screen.findByText('That file type is not accepted here. Choose PDF.')).toBeTruthy();
  });

  it("shows the Hub's own sentence when it refuses the upload (the limit), without offering the same file again", async () => {
    hub.answers[`POST ${PRESIGN}`] = refusal(403, 'You have used all 5 of your free uploads.');
    mockPick.mockResolvedValue(chosen('a.pdf', 'application/pdf'));
    await start();
    await fireEvent.press(await screen.findByTestId('upload-drop'));
    expect(await screen.findByText('You have used all 5 of your free uploads.')).toBeTruthy();
    expect(screen.queryByTestId('upload-retry')).toBeNull();
    expect(screen.getByTestId('create-continue').props.accessibilityState?.disabled).toBe(true);
  });

  it('offers Try again when the bytes did not land, and sends the same file again', async () => {
    hub.answers[`POST ${PRESIGN}`] = presigned('content/full', 'a.pdf');
    mockPick.mockResolvedValue(chosen('a.pdf', 'application/pdf'));
    await start();
    await fireEvent.press(await screen.findByTestId('upload-drop'));
    await waitFor(() => expect(ScriptedXhr.last).not.toBeNull());
    await act(async () => { ScriptedXhr.last?.finish(500); });
    expect(await screen.findByText('That file did not upload. Try again.')).toBeTruthy();
    ScriptedXhr.last = null;
    await fireEvent.press(screen.getByTestId('upload-retry'));
    await waitFor(() => expect(ScriptedXhr.last).not.toBeNull());
    await act(async () => { ScriptedXhr.last?.finish(200); });
    await waitFor(() => expect(screen.getByText('100%')).toBeTruthy());
    expect(draft.getDraft().full).not.toBeNull();
  });

  it('says there is no connection when the request cannot be made, and keeps Continue off', async () => {
    hub.answers[`POST ${PRESIGN}`] = 'offline';
    mockPick.mockResolvedValue(chosen('a.pdf', 'application/pdf'));
    await start();
    await fireEvent.press(await screen.findByTestId('upload-drop'));
    expect(await screen.findByText('No connection. Check your internet and try again.')).toBeTruthy();
    expect(screen.getByTestId('create-continue').props.accessibilityState?.disabled).toBe(true);
  });

  it('shows an error with Try again when the rules cannot be read', async () => {
    hub.answers[`GET ${FORMATS_PATH}`] = 'offline';
    await start();
    expect(await screen.findByTestId('upload-error')).toBeTruthy();
  });
});

describe('M22 · Preview', () => {
  const pdfBytes = '%PDF-1.4\n2 0 obj << /Type /Pages /Kids [3 0 R] /Count 12 >> endobj\n3 0 obj << /Type /Page >> endobj\n%%EOF';
  const open = (format: 'pdf' | 'audio' = 'pdf', onContinue?: () => void) => renderFrame(<PreviewScreen format={format} onBack={jest.fn()} onContinue={onContinue} />);

  it('a user can upload a preview file, see how it will look, and remove it', async () => {
    hub.answers[`POST ${PRESIGN}`] = presigned('content/preview', 'p.pdf');
    mockPick.mockResolvedValue(chosen('chapter-1-free.pdf', 'application/pdf', 5, { blob: new Blob([pdfBytes]) }));
    await open();
    expect(await screen.findByText('Add a preview')).toBeTruthy();
    expect(await screen.findByText('Buyers see this before paying. For a PDF, upload the extract you want to give away.')).toBeTruthy();
    expect(screen.getByText('Step 3 of 5')).toBeTruthy();
    expect(screen.queryByTestId('preview-look')).toBeNull();
    await fireEvent.press(await screen.findByTestId('preview-drop'));
    await waitFor(() => expect(ScriptedXhr.last).not.toBeNull());
    const presign = hub.sent.find((s) => s.path === PRESIGN);
    expect(presign?.body).toMatchObject({ folder: 'content/preview', format: 'pdf', contentType: 'application/pdf' });
    await act(async () => { ScriptedXhr.last?.finish(200); });
    expect(await screen.findByText('chapter-1-free.pdf')).toBeTruthy();
    expect(screen.getByText('12 pages · public')).toBeTruthy();
    expect(screen.getByText('How it will look')).toBeTruthy();
    expect(screen.getAllByTestId('preview-tile')).toHaveLength(2);
    expect(screen.getByTestId('preview-tile-locked')).toBeTruthy();
    expect(draft.getDraft().preview).toMatchObject({ name: 'chapter-1-free.pdf', pages: 12, key: 'content/preview/u1/p.pdf' });
    await fireEvent.press(screen.getByTestId('create-remove'));
    expect(draft.getDraft().preview).toBeNull();
    expect(screen.queryByTestId('preview-look')).toBeNull();
    expect(screen.getByTestId('preview-drop')).toBeTruthy();
  });

  it('leaves the page count out when the file does not say how many pages it has', async () => {
    hub.answers[`POST ${PRESIGN}`] = presigned('content/preview', 'p.pdf');
    mockPick.mockResolvedValue(chosen('extract.pdf', 'application/pdf', 5, { blob: new Blob(['%PDF-1.5 packed']) }));
    await open();
    await fireEvent.press(await screen.findByTestId('preview-drop'));
    await waitFor(() => expect(ScriptedXhr.last).not.toBeNull());
    await act(async () => { ScriptedXhr.last?.finish(200); });
    expect(await screen.findByText('1 KB \u00b7 public')).toBeTruthy();
  });

  it('asks for the clip length the Hub sets on an audio piece', async () => {
    await open('audio');
    expect(await screen.findByText('Buyers see this before paying. Upload a 30–60 second clip.')).toBeTruthy();
  });

  it('draws no Continue until the details step exists, and then waits for the preview to land', async () => {
    hub.answers[`POST ${PRESIGN}`] = presigned('content/preview', 'p.pdf');
    mockPick.mockResolvedValue(chosen('p.pdf', 'application/pdf'));
    const first = await open();
    await screen.findByText('Add a preview');
    expect(screen.queryByTestId('create-continue')).toBeNull();
    await first.unmount();

    const onContinue = jest.fn();
    await open('pdf', onContinue);
    expect(await screen.findByTestId('create-continue')).toBeTruthy();
    expect(screen.getByTestId('create-continue').props.accessibilityState?.disabled).toBe(true);
    await fireEvent.press(await screen.findByTestId('preview-drop'));
    await waitFor(() => expect(ScriptedXhr.last).not.toBeNull());
    await act(async () => { ScriptedXhr.last?.finish(200); });
    await screen.findByTestId('preview-look');
    await fireEvent.press(screen.getByTestId('create-continue'));
    expect(onContinue).toHaveBeenCalled();
  });

  it("shows the Hub's sentence when a preview is refused", async () => {
    hub.answers[`POST ${PRESIGN}`] = refusal(400, 'video/webm is not allowed in content/preview.');
    mockPick.mockResolvedValue(chosen('p.pdf', 'application/pdf'));
    await open();
    await fireEvent.press(await screen.findByTestId('preview-drop'));
    expect(await screen.findByText('video/webm is not allowed in content/preview.')).toBeTruthy();
    expect(draft.getDraft().preview).toBeNull();
  });
});

describe('the Create button on Home, Explore and Me', () => {
  const profile = (accountType: 'creator' | 'user' | null) => ok({ wawuUserId: 'u1', accountType });

  it('is drawn for a creator account and opens Create', async () => {
    hub.answers[`GET ${ME}`] = profile('creator');
    const onPress = jest.fn();
    await renderFrame(<CreateEntry onPress={onPress} />);
    await fireEvent.press(await screen.findByTestId('explore-create'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it.each([['a user account', profile('user')], ['an account with no type', profile(null)], ['a profile that did not load', refusal(500, 'Boom')]])('is not drawn for %s', async (_name, answer) => {
    hub.answers[`GET ${ME}`] = answer;
    await renderFrame(<CreateEntry onPress={jest.fn()} />);
    await waitFor(() => expect(hub.sent.some((s) => s.path === ME)).toBe(true));
    await act(async () => undefined);
    expect(screen.queryByTestId('explore-create')).toBeNull();
  });
});
