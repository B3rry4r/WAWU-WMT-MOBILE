import * as rtl from '@testing-library/react-native';
import { Linking, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { PdfReader } from '../reader';
import { FAILED, PDFJS_SCRIPT, PDFJS_VERSION, READY } from '../reader/pdfPage';

const URI = 'https://files.example/books/free-pages.pdf';
let open: jest.SpyInstance;

const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, left: 0, right: 0, bottom: 34 } };

function reader(over: Partial<React.ComponentProps<typeof PdfReader>> = {}) {
  return (
    <SafeAreaProvider initialMetrics={metrics}>
      <PdfReader uri={URI} title="Free pages" visible onClose={jest.fn()} testID="reader" {...over} />
    </SafeAreaProvider>
  );
}

const web = () => rtl.screen.getByTestId('reader-pages');
const message = (data: string) => rtl.act(async () => web().props.onMessage({ nativeEvent: { data } }));

beforeEach(() => {
  open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
});

afterEach(() => {
  open.mockRestore();
  jest.restoreAllMocks();
});

describe('H4 · the phone reads the free pages in place', () => {
  describe('on iOS, where the web view shows a PDF itself', () => {
    it('opens the file in a web view under the title, and a user can close it', async () => {
      const onClose = jest.fn();
      await rtl.render(reader({ onClose }));
      expect(web().props.source).toEqual({ uri: URI });
      expect(rtl.screen.getByText('Free pages')).toBeTruthy();
      await rtl.fireEvent.press(rtl.screen.getByLabelText('Close'));
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(open).not.toHaveBeenCalled();
    });

    it('shows a spinner until the file has loaded, then only the pages', async () => {
      await rtl.render(reader());
      expect(rtl.screen.getByTestId('reader-loading')).toBeTruthy();
      await rtl.act(async () => web().props.onLoadEnd());
      expect(rtl.screen.queryByTestId('reader-loading')).toBeNull();
    });

    it('draws nothing while it is closed', async () => {
      await rtl.render(reader({ visible: false }));
      expect(rtl.screen.queryByTestId('reader-pages')).toBeNull();
    });

    it('lets the first load happen and refuses any later one, so a link in the file goes nowhere', async () => {
      await rtl.render(reader());
      expect(web().props.onShouldStartLoadWithRequest({ url: URI })).toBe(true);
      await rtl.act(async () => web().props.onLoadEnd());
      expect(web().props.onShouldStartLoadWithRequest({ url: 'https://elsewhere.example/' })).toBe(false);
    });

    it('opens the phone own PDF viewer and goes back to the feed when the file cannot be loaded', async () => {
      const onClose = jest.fn();
      await rtl.render(reader({ onClose }));
      await rtl.act(async () => web().props.onError());
      await rtl.waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
      expect(open).toHaveBeenCalledWith(URI);
    });

    it('does the same when the storage host answers with an error', async () => {
      const onClose = jest.fn();
      await rtl.render(reader({ onClose }));
      await rtl.act(async () => web().props.onHttpError({ nativeEvent: { statusCode: 403 } }));
      await rtl.waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
      expect(open).toHaveBeenCalledWith(URI);
    });
  });

  describe('on Android, where the web view has no PDF viewer of its own', () => {
    beforeEach(() => {
      jest.replaceProperty(Platform, 'OS', 'android');
    });

    it('draws the pages through a page of its own, loaded from the file own host so it can read the file', async () => {
      await rtl.render(reader());
      const source = web().props.source as { html: string; baseUrl: string };
      expect(source.baseUrl).toBe('https://files.example');
      expect(source.html).toContain(PDFJS_SCRIPT);
      expect(source.html).toContain(JSON.stringify(URI));
      expect(PDFJS_SCRIPT).toContain(`pdf.js/${PDFJS_VERSION}/`);
    });

    it('keeps the spinner until the page says its pages are ready', async () => {
      await rtl.render(reader());
      await rtl.act(async () => web().props.onLoadEnd());
      expect(rtl.screen.getByTestId('reader-loading')).toBeTruthy();
      await message(READY);
      expect(rtl.screen.queryByTestId('reader-loading')).toBeNull();
    });

    it('opens the phone own PDF viewer and goes back to the feed when the page cannot draw the file', async () => {
      const onClose = jest.fn();
      await rtl.render(reader({ onClose }));
      await message(FAILED);
      await rtl.waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
      expect(open).toHaveBeenCalledWith(URI);
    });

    it('sends an address that is not a web address straight to the phone viewer, without opening the reader', async () => {
      const onClose = jest.fn();
      await rtl.render(reader({ uri: 'file:///cache/a.pdf', onClose }));
      expect(rtl.screen.queryByTestId('reader-pages')).toBeNull();
      await rtl.waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
      expect(open).toHaveBeenCalledWith('file:///cache/a.pdf');
    });
  });
});
