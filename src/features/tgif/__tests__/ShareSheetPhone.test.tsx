/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import { Linking } from 'react-native';

const mockCount = jest.fn();
jest.mock('../useTgif', () => ({ ...jest.requireActual('../useTgif'), useCountShare: () => ({ mutate: mockCount }) }));

const mockCard = jest.fn();
jest.mock('../api/tgif', () => ({ ...jest.requireActual('../api/tgif'), fetchShareCard: (date: string) => mockCard(date) }));

const mockFile = {
  canShareCard: jest.fn(),
  writeCard: jest.fn(),
  shareCardFile: jest.fn(),
  saveCardFile: jest.fn(),
};
jest.mock('../cardFile', () => ({
  canShareCard: () => mockFile.canShareCard(),
  writeCard: (card: unknown, date: string) => mockFile.writeCard(card, date),
  shareCardFile: (uri: string, title: string) => mockFile.shareCardFile(uri, title),
  saveCardFile: (uri: string) => mockFile.saveCardFile(uri),
}));

const DATE = '2025-09-26';
const day = {
  date: DATE,
  series: 'SONS, NOT SLAVES',
  seriesTheme: 'Who you are',
  verse: 'This is the day which the LORD hath made; we will rejoice and be glad in it.',
  verseReference: 'Psalm 118:24 (KJV)',
  reality: 'r',
  remember: 'm',
  prayer: 'p',
  takeaway: 't',
  shareLink: 'wawu/tgif' as string | null,
};
const card = { blob: { size: 10 } as Blob, uri: 'data:image/png;base64,AAAA' };
const FILE = 'file:///cache/TGIF-2025-09-26.png';

const clients: QueryClient[] = [];
let open: jest.SpyInstance;

async function boot() {
  const { ShareSheet } = require('../ShareSheet') as typeof import('../ShareSheet');
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } } });
  clients.push(client);
  await rtl.render(
    <QueryClientProvider client={client}>
      <ShareSheet visible date={DATE} day={day} onClose={jest.fn()} />
    </QueryClientProvider>,
  );
  await rtl.screen.findByTestId('tgif-share-chat');
}

const press = async (id: string) => {
  await rtl.fireEvent.press(await rtl.screen.findByTestId(id));
};

beforeEach(() => {
  mockCount.mockReset();
  mockCard.mockReset().mockResolvedValue(card);
  mockFile.canShareCard.mockReset().mockResolvedValue(true);
  mockFile.writeCard.mockReset().mockReturnValue(FILE);
  mockFile.shareCardFile.mockReset().mockResolvedValue(undefined);
  mockFile.saveCardFile.mockReset().mockResolvedValue('saved');
  open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
});

afterEach(async () => {
  await rtl.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  open.mockRestore();
  clients.splice(0).forEach((c) => c.clear());
});

describe('H35 · share the verse on a phone with a share sheet', () => {
  it('draws WhatsApp, Story, Chat and Save in the canvas order, and says the card goes out as an image', async () => {
    await boot();
    expect(await rtl.screen.findByTestId('tgif-share-story')).toBeTruthy();
    const labels = ['WhatsApp', 'Story', 'Chat', 'Save'];
    labels.forEach((label) => expect(rtl.screen.getByText(label)).toBeTruthy());
    const ids = ['tgif-share-whatsapp', 'tgif-share-story', 'tgif-share-chat', 'tgif-share-save'];
    const drawn = rtl.screen.getAllByRole('button').map((b) => b.props.testID).filter((id) => ids.includes(id));
    expect(drawn).toEqual(ids);
    expect(rtl.screen.getByText('The card goes out as an image. Chat adds the link under it.')).toBeTruthy();
  });

  it('draws no Story or Save when the phone has no share sheet', async () => {
    mockFile.canShareCard.mockResolvedValue(false);
    await boot();
    await rtl.act(async () => undefined);
    expect(rtl.screen.queryByTestId('tgif-share-story')).toBeNull();
    expect(rtl.screen.queryByTestId('tgif-share-save')).toBeNull();
  });

  it('a user can share the picture to a story: it goes to the phone share sheet as a file, and the share is counted once', async () => {
    await boot();
    await press('tgif-share-story');
    await rtl.waitFor(() => expect(mockFile.shareCardFile).toHaveBeenCalledWith(FILE, 'Share to your story'));
    expect(mockFile.writeCard).toHaveBeenCalledWith(card, DATE);
    await rtl.waitFor(() => expect(mockCount).toHaveBeenCalledTimes(1));
    expect(rtl.screen.queryByTestId('tgif-share-problem')).toBeNull();
  });

  it('says so, and counts no share, when the story cannot be shared', async () => {
    mockFile.shareCardFile.mockRejectedValue(new Error('no sheet'));
    await boot();
    await press('tgif-share-story');
    expect(await rtl.screen.findByText('The card could not be shared. Try again.')).toBeTruthy();
    expect(mockCount).not.toHaveBeenCalled();
  });

  it('a user can save the picture: it goes to their photos, they are told, and no share is counted', async () => {
    await boot();
    await press('tgif-share-save');
    expect(await rtl.screen.findByText('Saved to your photos.')).toBeTruthy();
    expect(mockFile.saveCardFile).toHaveBeenCalledWith(FILE);
    expect(mockCount).not.toHaveBeenCalled();
  });

  it('tells a person who does not allow photos what to do, and says nothing was saved', async () => {
    mockFile.saveCardFile.mockResolvedValue('denied');
    await boot();
    await press('tgif-share-save');
    expect(await rtl.screen.findByText('Saving needs permission to add to your photos. Allow it in your phone settings, then try again.')).toBeTruthy();
    expect(rtl.screen.queryByText('Saved to your photos.')).toBeNull();
  });

  it('says so when the picture cannot be saved', async () => {
    mockFile.saveCardFile.mockRejectedValue(new Error('disk'));
    await boot();
    await press('tgif-share-save');
    expect(await rtl.screen.findByText('The card could not be saved. Try again.')).toBeTruthy();
  });

  it('fetches the picture again when the preview never got it, so Save and Story still work', async () => {
    mockCard.mockRejectedValueOnce(new Error('offline')).mockResolvedValue(card);
    await boot();
    await press('tgif-share-save');
    await rtl.waitFor(() => expect(mockFile.saveCardFile).toHaveBeenCalledWith(FILE));
    expect(mockCard).toHaveBeenCalledTimes(2);
  });

  it('WhatsApp posts the picture through the share sheet, not the verse as text, and counts the share once', async () => {
    await boot();
    await press('tgif-share-whatsapp');
    await rtl.waitFor(() => expect(mockFile.shareCardFile).toHaveBeenCalledWith(FILE, 'Share on WhatsApp'));
    await rtl.waitFor(() => expect(mockCount).toHaveBeenCalledTimes(1));
    expect(open).not.toHaveBeenCalled();
  });

  it('gives WhatsApp the verse as text when the share sheet cannot open with the picture', async () => {
    mockFile.shareCardFile.mockRejectedValue(new Error('no sheet'));
    await boot();
    await press('tgif-share-whatsapp');
    await rtl.waitFor(() => expect(open).toHaveBeenCalledTimes(1));
    expect(String(open.mock.calls[0][0])).toContain('wa.me');
    await rtl.waitFor(() => expect(mockCount).toHaveBeenCalledTimes(1));
  });

  it('ignores a second tap while the first is still working', async () => {
    let release: () => void = () => undefined;
    mockFile.shareCardFile.mockImplementation(() => new Promise<void>((resolve) => (release = resolve)));
    await boot();
    await press('tgif-share-story');
    await press('tgif-share-story');
    await rtl.act(async () => undefined);
    expect(mockFile.shareCardFile).toHaveBeenCalledTimes(1);
    await rtl.act(async () => release());
    await rtl.waitFor(() => expect(mockCount).toHaveBeenCalledTimes(1));
  });
});
