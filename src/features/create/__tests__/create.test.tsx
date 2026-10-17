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
const { adoptSession, signOut, resetSessionForTests } = require('@/api/session') as typeof import('@/api/session');

const RELEASE = '/api/hub/uploads/release';
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

  it('a creator can start a community from the Community tile, which opens I32 and sits before Service as drawn (INBOX-14)', async () => {
    hub.answers[`GET ${ALLOWANCE}`] = ok(allowance(4, 5));
    const onCommunity = jest.fn();
    await renderFrame(<CreateScreen onClose={jest.fn()} onContent={jest.fn()} onEvent={jest.fn()} onCommunity={onCommunity} onService={jest.fn()} />);
    await fireEvent.press(await screen.findByTestId('create-tile-community'));
    expect(onCommunity).toHaveBeenCalledTimes(1);
    expect(screen.getByText('A room your people talk in')).toBeTruthy();
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

describe('M19 · Create at "5 of 5 used"', () => {
  const open = async () => {
    const calls = { close: jest.fn(), content: jest.fn(), event: jest.fn(), service: jest.fn() };
    await renderFrame(<CreateScreen onClose={calls.close} onContent={calls.content} onEvent={calls.event} onService={calls.service} />);
    return calls;
  };

  it('says the uploads are used and does not start a piece, while Event and Service still open', async () => {
    hub.answers[`GET ${ALLOWANCE}`] = ok(allowance(5, 5));
    const calls = await open();
    expect(await screen.findByText('Your 5 free uploads are used')).toBeTruthy();
    expect(screen.getByText('Get verified for up to 25 uploads, or take something down.')).toBeTruthy();
    expect(screen.getByTestId('create-meter-count').props.children).toBe('5 of 5 used');
    await fireEvent.press(screen.getByTestId('create-tile-content'));
    expect(calls.content).not.toHaveBeenCalled();
    expect(screen.getByTestId('create-tile-content').props.accessibilityState?.disabled).toBe(true);
    await fireEvent.press(screen.getByTestId('create-tile-event'));
    await fireEvent.press(screen.getByTestId('create-tile-service'));
    expect(calls.event).toHaveBeenCalledTimes(1);
    expect(calls.service).toHaveBeenCalledTimes(1);
  });

  it('words it for a ticked account, with no way up to offer', async () => {
    hub.answers[`GET ${ALLOWANCE}`] = ok(allowance(25, 25, true));
    await open();
    expect(await screen.findByText('Your 25 uploads are used')).toBeTruthy();
    expect(screen.getByText('Take something down to make room for a new one.')).toBeTruthy();
    expect(screen.queryByText(/Get verified/)).toBeNull();
  });

  it('draws no notice and keeps Content working while there is room, or while the count is not known', async () => {
    hub.answers[`GET ${ALLOWANCE}`] = ok(allowance(4, 5));
    const calls = await open();
    await fireEvent.press(await screen.findByTestId('create-tile-content'));
    expect(calls.content).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('create-slots-full')).toBeNull();
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
    const later = jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 5000);
    await fireEvent.press(screen.getByTestId('upload-drop'));
    expect(await screen.findByText('That file type is not accepted here. Choose PDF.')).toBeTruthy();
    later.mockRestore();
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

  it('does not start an upload at "5 of 5 used", and says so', async () => {
    hub.answers[`GET ${ALLOWANCE}`] = ok(allowance(5, 5));
    mockPick.mockResolvedValue(chosen('a.pdf', 'application/pdf'));
    await start();
    expect(await screen.findByText('Your 5 free uploads are used')).toBeTruthy();
    expect(screen.getByTestId('upload-drop').props.accessibilityState?.disabled).toBe(true);
    await fireEvent.press(screen.getByTestId('upload-drop'));
    expect(mockPick).not.toHaveBeenCalled();
    expect(hub.sent.some((s) => s.path === PRESIGN)).toBe(false);
  });

  it('opens one chooser and asks for one upload link on a double tap', async () => {
    hub.answers[`POST ${PRESIGN}`] = presigned('content/full', 'a.pdf');
    mockPick.mockResolvedValue(chosen('a.pdf', 'application/pdf'));
    await start();
    const drop = await screen.findByTestId('upload-drop');
    await fireEvent.press(drop);
    await fireEvent.press(drop);
    await waitFor(() => expect(ScriptedXhr.last).not.toBeNull());
    expect(mockPick).toHaveBeenCalledTimes(1);
    expect(hub.sent.filter((s) => s.path === PRESIGN)).toHaveLength(1);
  });

  it('shows no bar and no percentage on a file whose bytes all went but did not land', async () => {
    hub.answers[`POST ${PRESIGN}`] = presigned('content/full', 'a.pdf');
    mockPick.mockResolvedValue(chosen('a.pdf', 'application/pdf'));
    await start();
    await fireEvent.press(await screen.findByTestId('upload-drop'));
    await waitFor(() => expect(ScriptedXhr.last).not.toBeNull());
    await act(async () => { ScriptedXhr.last?.progress(100, 100); });
    expect(screen.getByText('100%')).toBeTruthy();
    await act(async () => { ScriptedXhr.last?.finish(500); });
    expect(await screen.findByText('That file did not upload. Try again.')).toBeTruthy();
    expect(screen.getByText('a.pdf')).toBeTruthy();
    expect(screen.queryByTestId('create-percent')).toBeNull();
    expect(screen.queryByText('100%')).toBeNull();
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
    // Remove gives the file back to the Hub.
    await waitFor(() => expect(hub.sent.filter((s) => s.path === RELEASE).map((s) => s.body)).toEqual([{ key: 'content/preview/u1/p.pdf' }]));
  });

  it('removes the preview at once even when the Hub cannot be asked to release it', async () => {
    hub.answers[`POST ${PRESIGN}`] = presigned('content/preview', 'p.pdf');
    hub.answers[`POST ${RELEASE}`] = 'hang';
    mockPick.mockResolvedValue(chosen('p.pdf', 'application/pdf'));
    await open();
    await fireEvent.press(await screen.findByTestId('preview-drop'));
    await waitFor(() => expect(ScriptedXhr.last).not.toBeNull());
    await act(async () => { ScriptedXhr.last?.finish(200); });
    await screen.findByTestId('preview-look');
    await fireEvent.press(screen.getByTestId('create-remove'));
    expect(draft.getDraft().preview).toBeNull();
    expect(screen.getByTestId('preview-drop')).toBeTruthy();
    hub.answers[`POST ${RELEASE}`] = refusal(503, 'Could not remove that file right now. Try again in a moment.');
    await act(async () => undefined);
    expect(screen.queryByText(/Could not remove/)).toBeNull();
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

describe('the draft gives back what it lets go of', () => {
  const file = (key: string) => ({ name: `${key}.pdf`, bytes: 10, contentType: 'application/pdf', key, fileUrl: `https://storage.test/${key}` });
  const released = () => hub.sent.filter((s) => s.path === RELEASE).map((s) => (s.body as { key: string }).key);
  const settle = () => act(async () => undefined);

  it('releases the old full file and the preview that went with it when the full file is replaced', async () => {
    draft.setFormat('pdf');
    draft.setFull(file('full-1'));
    draft.setPreview(file('prev-1'));
    expect(released()).toEqual([]);
    draft.setFull(null);
    draft.setFull(file('full-2'));
    await settle();
    expect(released().sort()).toEqual(['full-1', 'prev-1']);
    expect(draft.getDraft().preview).toBeNull();
  });

  it('releases a replaced preview, and nothing when the same file is set again', async () => {
    draft.setFormat('pdf');
    draft.setFull(file('full-1'));
    draft.setPreview(file('prev-1'));
    draft.setPreview(file('prev-1'));
    draft.setPreview(file('prev-2'));
    await settle();
    expect(released()).toEqual(['prev-1']);
  });

  it('releases both files when a different format starts the piece again, and when a fresh piece is started', async () => {
    draft.setFormat('pdf');
    draft.setFull(file('full-1'));
    draft.setPreview(file('prev-1'));
    draft.setFormat('pdf');
    expect(released()).toEqual([]);
    draft.setFormat('video');
    await settle();
    expect(released().sort()).toEqual(['full-1', 'prev-1']);
    draft.setFull(file('full-2'));
    draft.abandonDraft();
    await settle();
    expect(released().sort()).toEqual(['full-1', 'full-2', 'prev-1']);
    expect(draft.getDraft()).toEqual({ format: null, full: null, preview: null });
  });

  it('empties the draft without releasing anything on resetDraft, which the create call uses once the files belong to a listing', async () => {
    draft.setFormat('pdf');
    draft.setFull(file('full-1'));
    draft.resetDraft();
    await settle();
    expect(released()).toEqual([]);
    expect(draft.getDraft().full).toBeNull();
  });

  it('is cleared when the person signs out, so the next account never meets it', async () => {
    resetSessionForTests();
    const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
    await adoptSession({ accessToken: `${b64({ alg: 'RS256' })}.${b64({ sub: 'account-ada', iat: 1000, exp: 4_000_000_000 })}.sig`, refreshToken: 'r' });
    draft.setFormat('pdf');
    draft.setFull(file('full-1'));
    await signOut();
    expect(draft.getDraft()).toEqual({ format: null, full: null, preview: null });
    // The session is over: there is no one to ask on the account's behalf.
    await settle();
    expect(released()).toEqual([]);
  });
});

describe('the Create routes are for creator accounts', () => {
  const { useCreatorGate } = require('../CreateEntry') as typeof import('../CreateEntry');
  const { Text } = require('react-native') as typeof import('react-native');
  const profile = (accountType: 'creator' | 'user' | null) => ok({ wawuUserId: 'u1', accountType });
  function Gate({ enabled = true }: { enabled?: boolean }) {
    return <Text testID="gate">{useCreatorGate(enabled)}</Text>;
  }

  it('waits for the profile, then lets a creator in', async () => {
    hub.answers[`GET ${ME}`] = profile('creator');
    await renderFrame(<Gate />);
    expect(screen.getByTestId('gate').props.children).toBe('checking');
    await waitFor(() => expect(screen.getByTestId('gate').props.children).toBe('creator'));
  });

  // A server fault is asked for again a few times first (the app's query defaults), so the refusal here is one that is not.
  it.each([['a user account', profile('user')], ['an account with no type', profile(null)], ['a profile that did not load', refusal(404, 'Not found')]])('turns away %s', async (_name, answer) => {
    hub.answers[`GET ${ME}`] = answer;
    await renderFrame(<Gate />);
    await waitFor(() => expect(screen.getByTestId('gate').props.children).toBe('other'));
  });

  it('asks the Hub nothing until the person is signed in', async () => {
    hub.answers[`GET ${ME}`] = profile('creator');
    await renderFrame(<Gate enabled={false} />);
    await act(async () => undefined);
    expect(screen.getByTestId('gate').props.children).toBe('checking');
    expect(hub.sent.some((x) => x.path === ME)).toBe(false);
  });
});
