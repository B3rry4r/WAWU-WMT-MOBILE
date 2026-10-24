/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';
import { Linking, View } from 'react-native';

import { ATTACHMENT_RULES, clearClients, CHAT, fileMessage, hub, renderWith, resetHub, textMessage } from '../testing/hubDouble';

/*
 * Photos, videos and files in a chat (FIX-104, board I13) on the real screen with the Hub as a stand-in `fetch`: the Add to chat sheet's two rows,
 * what a send asks the Hub (where to upload, the bytes, the confirmation, the message), the bubbles for what was sent and what arrived, how a
 * file opens, and every way a send is refused or lost. The phone's pickers are stand-ins: they hand back the file a person would have chosen.
 */
jest.mock('expo-router', () => ({ useIsFocused: () => true, useRouter: () => ({ push: jest.fn(), dismissTo: jest.fn(), back: jest.fn(), canGoBack: () => true }) }));
jest.mock('@/features/open-wallet/sessionAccount', () => ({ useSessionAccount: () => 'owner-1' }));
jest.mock('@/features/inbox/live', () => ({ onLiveEvent: () => () => undefined, onLiveSynced: () => () => undefined, retainLive: () => () => undefined }));
jest.mock('@/features/inbox/unread', () => ({ refreshInbox: jest.fn(async () => undefined) }));
jest.mock('../pickAttachment', () => ({ pickPhotoOrVideo: jest.fn(), pickChatFile: jest.fn() }));

const { ChatScreen } = require('../ChatScreen') as typeof import('../ChatScreen');
const picks = require('../pickAttachment') as { pickPhotoOrVideo: jest.Mock; pickChatFile: jest.Mock };
const { forgetChatSendsInMemory } = require('../sends') as typeof import('../sends');
void View;

/** The phone's own viewer for a file: the test preset already stands in for it, so each test starts from no calls. */
const opened = Linking.openURL as jest.Mock;

rtl.configure({ asyncUtilTimeout: 5000 });

beforeAll(async () => {
  const warm = await rtl.render(<View />);
  warm.unmount();
});

beforeEach(() => {
  resetHub();
  forgetChatSendsInMemory();
  picks.pickPhotoOrVideo.mockReset();
  picks.pickChatFile.mockReset();
  opened.mockReset();
  opened.mockResolvedValue(true);
});
afterEach(() => {
  clearClients();
  jest.restoreAllMocks();
});

const handlers = () => ({ onBack: jest.fn(), onSendMoney: jest.fn(), onOpenWallet: jest.fn(), onSetPin: jest.fn(), onForgotPin: jest.fn() });

async function boot() {
  await renderWith(<ChatScreen chatId={CHAT} {...handlers()} />);
  await rtl.screen.findByTestId('chat-messages');
}

const photo = () => ({ blob: new Blob(['x'.repeat(2048)], { type: 'image/jpeg' }), name: 'sunset.jpg', contentType: 'image/jpeg', previewUri: 'file:///cache/sunset.jpg', discard: jest.fn() });
const pdf = (name = 'Invoice.pdf') => ({ blob: new Blob(['y'.repeat(3000)], { type: 'application/pdf' }), name, contentType: 'application/pdf', discard: jest.fn() });

async function openSheet() {
  await rtl.fireEvent.press(await rtl.screen.findByTestId('chat-plus'));
  await rtl.screen.findByTestId('attach-sheet');
}

describe('I13: Add to chat carries Photo or video and File', () => {
  it('a user sees the two rows, and the File row says what the Hub takes, in the Hub\'s own numbers', async () => {
    hub.messages = [textMessage('Hi', false)];
    await boot();
    await openSheet();
    expect(rtl.screen.getByTestId('attach-photo-video')).toBeTruthy();
    expect(rtl.screen.getByText('Photo or video')).toBeTruthy();
    expect(rtl.screen.getByTestId('attach-file')).toBeTruthy();
    expect(await rtl.screen.findByText(`PDF, up to ${ATTACHMENT_RULES.file.maxBytes / (1024 * 1024)} MB`)).toBeTruthy();
    // "instant" is not printed: nothing here can promise it.
    expect(rtl.screen.queryByText(/instant/)).toBeNull();
  });

  it('a user picks a photo: it shows at once as sending, is uploaded once, and becomes a sent photo', async () => {
    hub.messages = [textMessage('Hi', false)];
    const file = photo();
    picks.pickPhotoOrVideo.mockResolvedValue(file);
    await boot();
    await openSheet();
    await rtl.fireEvent.press(rtl.screen.getByTestId('attach-photo-video'));
    await rtl.waitFor(() => expect(hub.sentFiles).toHaveLength(1));
    expect(hub.presigns).toEqual([{ contentType: 'image/jpeg', contentLength: 2048 }]);
    expect(hub.puts).toHaveLength(1);
    expect(hub.puts[0]).toMatchObject({ contentType: 'image/jpeg', bytes: 2048 });
    expect(hub.sentFiles[0].key).toBe(hub.puts[0].key);
    // A photo carries no name: its own is where it was taken.
    expect(hub.sentFiles[0].name).toBeNull();
    expect(hub.sentFiles[0].clientMessageId).toMatch(/^[A-Za-z0-9_-]{8,64}$/);
    expect(await rtl.screen.findByTestId(/^bubble-m\d+-image$/)).toBeTruthy();
    expect(rtl.screen.queryByText('Sending')).toBeNull();
    expect(file.discard).toHaveBeenCalledTimes(1);
  });

  it('a user picks a PDF: its name and size show on a file bubble, and the Hub gets the name', async () => {
    hub.messages = [textMessage('Hi', false)];
    picks.pickChatFile.mockResolvedValue(pdf());
    await boot();
    await openSheet();
    await rtl.fireEvent.press(rtl.screen.getByTestId('attach-file'));
    await rtl.waitFor(() => expect(hub.sentFiles).toHaveLength(1));
    // The picker was asked for the Hub's own list of types.
    expect(picks.pickChatFile).toHaveBeenCalledWith(['application/pdf']);
    expect(hub.presigns).toEqual([{ contentType: 'application/pdf', contentLength: 3000 }]);
    expect(hub.sentFiles[0].name).toBe('Invoice.pdf');
    expect(await rtl.screen.findByText('Invoice.pdf')).toBeTruthy();
    expect(rtl.screen.getByText('PDF · 3 KB')).toBeTruthy();
  });

  it('closing the picker without choosing sends nothing', async () => {
    hub.messages = [textMessage('Hi', false)];
    picks.pickPhotoOrVideo.mockResolvedValue(null);
    await boot();
    await openSheet();
    await rtl.fireEvent.press(rtl.screen.getByTestId('attach-photo-video'));
    await rtl.waitFor(() => expect(picks.pickPhotoOrVideo).toHaveBeenCalled());
    expect(hub.presigns).toHaveLength(0);
    expect(rtl.screen.queryByText('Sending')).toBeNull();
  });

  it('a file the phone cannot read says so, and nothing is sent', async () => {
    hub.messages = [textMessage('Hi', false)];
    picks.pickPhotoOrVideo.mockRejectedValue(new Error('unreadable'));
    await boot();
    await openSheet();
    await rtl.fireEvent.press(rtl.screen.getByTestId('attach-photo-video'));
    expect(await rtl.screen.findByText('That file could not be read. Choose another.')).toBeTruthy();
    expect(hub.presigns).toHaveLength(0);
  });
});

describe('what arrives, and opening it', () => {
  it('a user sees the other person\'s photo, video and file, and the text after them', async () => {
    hub.messages = [
      textMessage('That is all', false, '2026-10-16T17:55:00.000Z'),
      fileMessage('file', false, { createdAt: '2026-10-16T17:50:00.000Z' }),
      fileMessage('video', false, { createdAt: '2026-10-16T17:45:00.000Z' }),
      fileMessage('image', false, { createdAt: '2026-10-16T17:40:00.000Z' }),
    ];
    await boot();
    expect(rtl.screen.getByTestId(/^bubble-m\d+-image$/)).toBeTruthy();
    expect(rtl.screen.getByText('Video · 2.3 MB')).toBeTruthy();
    expect(rtl.screen.getByText('Invoice.pdf')).toBeTruthy();
    expect(rtl.screen.getByText('PDF · 2.3 MB')).toBeTruthy();
    expect(rtl.screen.getByText('That is all')).toBeTruthy();
  });

  it('a user opens a file: the Hub is asked for a fresh link for that message, and the phone opens it', async () => {
    const message = fileMessage('file', false);
    hub.messages = [message];
    await boot();
    await rtl.fireEvent.press(rtl.screen.getByTestId(`bubble-${message.id}-open`));
    await rtl.waitFor(() => expect(opened).toHaveBeenCalledTimes(1));
    expect(hub.linkReads).toEqual([message.id]);
    expect(opened).toHaveBeenCalledWith(`https://storage.test/read/${message.id}?X-Amz-Expires=900`);
  });

  it('a user opens a video the same way', async () => {
    const message = fileMessage('video', true);
    hub.messages = [message];
    await boot();
    await rtl.fireEvent.press(rtl.screen.getByTestId(`bubble-${message.id}-open`));
    await rtl.waitFor(() => expect(opened).toHaveBeenCalledTimes(1));
    expect(hub.linkReads).toEqual([message.id]);
  });

  it('a user opens a photo: it shows at full size over the chat, from a fresh link, and closes', async () => {
    const message = fileMessage('image', false);
    hub.messages = [message];
    await boot();
    await rtl.fireEvent.press(rtl.screen.getByTestId(`bubble-${message.id}-open`));
    const big = await rtl.screen.findByTestId('photo-viewer-image');
    expect(big.props.source).toEqual([{ uri: `https://storage.test/read/${message.id}?X-Amz-Expires=900` }]);
    await rtl.fireEvent.press(rtl.screen.getByTestId('photo-viewer-close'));
    await rtl.waitFor(() => expect(rtl.screen.queryByTestId('photo-viewer-image')).toBeNull());
  });

  it('a link the Hub cannot make is said in the Hub\'s words, and nothing opens', async () => {
    hub.linkMode = 'fails';
    const message = fileMessage('file', false);
    hub.messages = [message];
    await boot();
    await rtl.fireEvent.press(rtl.screen.getByTestId(`bubble-${message.id}-open`));
    expect(await rtl.screen.findByText('We could not open that file just now. Try again.')).toBeTruthy();
    expect(opened).not.toHaveBeenCalled();
  });

  it('a file sent with words shows the words under it', async () => {
    hub.messages = [fileMessage('file', false, { text: 'The contract, please sign' })];
    await boot();
    expect(rtl.screen.getByText('The contract, please sign')).toBeTruthy();
    expect(rtl.screen.getByText('Invoice.pdf')).toBeTruthy();
  });
});

describe('a send that is refused or lost', () => {
  const sendPdf = async (file = pdf('Contract.pdf')) => {
    hub.messages = [textMessage('Hi', false)];
    picks.pickChatFile.mockResolvedValue(file);
    await boot();
    await openSheet();
    await rtl.fireEvent.press(rtl.screen.getByTestId('attach-file'));
  };

  it('a type the chat cannot hold is refused in the Hub\'s words on the file\'s own bubble, and nothing is posted', async () => {
    hub.attachmentMode = 'bad_type';
    await sendPdf({ ...pdf('notes.zip'), contentType: 'application/zip' });
    expect(await rtl.screen.findByText('A chat can hold a photo (PNG, JPEG or WebP), a video (MP4 or MOV) or a PDF.')).toBeTruthy();
    expect(hub.puts).toHaveLength(0);
    expect(hub.sentFiles).toHaveLength(0);
    expect(rtl.screen.getByText('notes.zip')).toBeTruthy();
  });

  it('a file over the size limit is refused in the Hub\'s words, and Delete takes the bubble away', async () => {
    hub.attachmentMode = 'too_large';
    await sendPdf();
    expect(await rtl.screen.findByText('A file in a chat can be up to 20 MB.')).toBeTruthy();
    expect(hub.puts).toHaveLength(0);
    await rtl.fireEvent.press(rtl.screen.getAllByTestId(/^bubble-local-\d+-discard$/)[0]);
    await rtl.waitFor(() => expect(rtl.screen.queryByText('Contract.pdf')).toBeNull());
  });

  it('a full storage is refused in the Hub\'s words', async () => {
    hub.attachmentMode = 'storage_full';
    await sendPdf();
    expect(await rtl.screen.findByText('This file needs 3 MB, but only 1 MB of your 1 GB storage is free.')).toBeTruthy();
    expect(hub.sentFiles).toHaveLength(0);
  });

  it('an upload the storage host turns away says so, and Try again uploads it again and sends it once', async () => {
    hub.attachmentMode = 'upload_fails';
    await sendPdf();
    expect(await rtl.screen.findByText('That file did not upload. Try again.')).toBeTruthy();
    expect(hub.sentFiles).toHaveLength(0);
    hub.attachmentMode = 'ok';
    await rtl.fireEvent.press(rtl.screen.getAllByTestId(/^bubble-local-\d+-retry$/)[0]);
    await rtl.waitFor(() => expect(hub.sentFiles).toHaveLength(1));
    expect(hub.presigns).toHaveLength(2);
    expect(hub.messages.filter((m) => m.kind === 'file')).toHaveLength(1);
    expect(await rtl.screen.findByTestId(/^bubble-m\d+-open$/)).toBeTruthy();
  });

  /** What the Hub still counts: every key it signed that the app did not give back. */
  const charged = () => {
    const signed = hub.puts.length === 0 ? [] : [...new Set(hub.puts.map((put) => put.key))];
    return signed.filter((key) => !hub.releases.includes(key));
  };

  it('Try again after a failed upload gives the dead upload back first: one message, one charge (round 2)', async () => {
    hub.attachmentMode = 'upload_fails';
    await sendPdf();
    expect(await rtl.screen.findByText('That file did not upload. Try again.')).toBeTruthy();
    const dead = hub.puts[0].key;
    expect(charged()).toEqual([dead]);
    hub.attachmentMode = 'ok';
    await rtl.fireEvent.press(rtl.screen.getAllByTestId(/^bubble-local-\d+-retry$/)[0]);
    await rtl.waitFor(() => expect(hub.sentFiles).toHaveLength(1));
    expect(hub.releases).toEqual([dead]);
    expect(hub.presigns).toHaveLength(2);
    expect(hub.sentFiles[0].key).not.toBe(dead);
    expect(charged()).toEqual([hub.sentFiles[0].key]);
    expect(hub.messages.filter((m) => m.kind === 'file')).toHaveLength(1);
  });

  it('a send that did not find the file gives that upload back before it uploads again (round 2)', async () => {
    hub.attachmentMode = 'send_not_found_once';
    await sendPdf();
    expect(await rtl.screen.findByText('That file did not finish uploading. Try sending it again.')).toBeTruthy();
    const dead = hub.sentFiles[0].key;
    await rtl.fireEvent.press(rtl.screen.getAllByTestId(/^bubble-local-\d+-retry$/)[0]);
    await rtl.waitFor(() => expect(hub.sentFiles).toHaveLength(2));
    expect(hub.releases).toEqual([dead]);
    expect(hub.sentFiles[1].key).not.toBe(dead);
    expect(hub.sentFiles[1].clientMessageId).toBe(hub.sentFiles[0].clientMessageId);
    expect(hub.messages.filter((m) => m.kind === 'file')).toHaveLength(1);
  });

  it('Delete on a failed bubble gives its upload back, whether it landed or not (round 2)', async () => {
    // Landed, the send refused: the file is the Hub's to count until it is given back.
    hub.attachmentMode = 'send_refused_once';
    await sendPdf();
    expect(await rtl.screen.findByText('You can no longer message this person.')).toBeTruthy();
    const landed = hub.sentFiles[0].key;
    expect(charged()).toEqual([landed]);
    await rtl.fireEvent.press(rtl.screen.getAllByTestId(/^bubble-local-\d+-discard$/)[0]);
    await rtl.waitFor(() => expect(hub.releases).toEqual([landed]));
    expect(charged()).toEqual([]);
    expect(hub.messages.filter((m) => m.kind === 'file')).toHaveLength(0);
  });

  it('Delete on a failed upload gives the reserved key back, and Delete on a refused type calls nothing (round 2)', async () => {
    hub.attachmentMode = 'upload_fails';
    await sendPdf();
    expect(await rtl.screen.findByText('That file did not upload. Try again.')).toBeTruthy();
    const reserved = hub.puts[0].key;
    await rtl.fireEvent.press(rtl.screen.getAllByTestId(/^bubble-local-\d+-discard$/)[0]);
    await rtl.waitFor(() => expect(hub.releases).toEqual([reserved]));

    hub.attachmentMode = 'bad_type';
    picks.pickChatFile.mockResolvedValue({ ...pdf('notes.zip'), contentType: 'application/zip' });
    await openSheet();
    await rtl.fireEvent.press(rtl.screen.getByTestId('attach-file'));
    expect(await rtl.screen.findByText('A chat can hold a photo (PNG, JPEG or WebP), a video (MP4 or MOV) or a PDF.')).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getAllByTestId(/^bubble-local-\d+-discard$/)[0]);
    await rtl.waitFor(() => expect(rtl.screen.queryByText('notes.zip')).toBeNull());
    expect(hub.releases).toEqual([reserved]);
  });

  it('a refused 21,000,009 byte PDF is drawn visibly over the 20 MB the Hub names (round 2)', async () => {
    hub.attachmentMode = 'too_large';
    const big = { blob: new Blob([new Uint8Array(21_000_009)], { type: 'application/pdf' }), name: 'Big.pdf', contentType: 'application/pdf', discard: jest.fn() };
    await sendPdf(big);
    expect(await rtl.screen.findByText('A file in a chat can be up to 20 MB.')).toBeTruthy();
    expect(rtl.screen.getByText('PDF · 20.1 MB')).toBeTruthy();
    expect(rtl.screen.queryByText('PDF · 20.0 MB')).toBeNull();
  });

  it('a send the Hub refuses after the upload is tried again with the same message id and the same upload', async () => {
    hub.attachmentMode = 'send_refused_once';
    await sendPdf();
    expect(await rtl.screen.findByText('You can no longer message this person.')).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getAllByTestId(/^bubble-local-\d+-retry$/)[0]);
    await rtl.waitFor(() => expect(hub.sentFiles).toHaveLength(2));
    expect(hub.presigns).toHaveLength(1);
    expect(hub.puts).toHaveLength(1);
    expect(hub.sentFiles[1].key).toBe(hub.sentFiles[0].key);
    expect(hub.sentFiles[1].clientMessageId).toBe(hub.sentFiles[0].clientMessageId);
    expect(hub.messages.filter((m) => m.kind === 'file')).toHaveLength(1);
  });

  it('a file on its way never holds up the next message', async () => {
    hub.messages = [textMessage('Hi', false)];
    let release: () => void = () => undefined;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    const real = globalThis.fetch;
    globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).startsWith('https://storage.test/chat/')) await held;
      return real(input, init);
    }) as typeof fetch;
    try {
      picks.pickChatFile.mockResolvedValue(pdf());
      await boot();
      await openSheet();
      await rtl.fireEvent.press(rtl.screen.getByTestId('attach-file'));
      await rtl.screen.findByText('Sending');
      await rtl.fireEvent.changeText(rtl.screen.getByTestId('chat-composer-input'), 'While that goes up');
      await rtl.fireEvent.press(rtl.screen.getByTestId('chat-composer-send'));
      await rtl.waitFor(() => expect(hub.sentTexts).toHaveLength(1));
      release();
      await rtl.waitFor(() => expect(hub.sentFiles).toHaveLength(1));
    } finally {
      release();
      globalThis.fetch = real;
    }
  });
});
