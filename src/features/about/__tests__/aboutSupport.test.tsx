/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/**
 * SWEEP-FLOWS B8: Z9's "Contact support" opens the support chat (R-30) for a signed-in person, as Wallet settings' "Help with a payment"
 * does, and is never the dead "Not available yet" row (R-47).
 */
let mockStatus: 'signedIn' | 'signedOut' = 'signedIn';
jest.mock('@/api/session', () => ({
  ...jest.requireActual('@/api/session'),
  useSession: () => ({ status: mockStatus }),
}));
const mockOpenSupport = jest.fn<Promise<void>, [unknown?]>();
let mockSupportError: string | null = null;
jest.mock('@/features/support/useOpenSupport', () => ({
  useOpenSupport: () => ({ open: (reference?: unknown) => mockOpenSupport(reference), opening: false, error: mockSupportError, clearError: () => undefined }),
}));
const mockOpenLink = jest.fn<Promise<boolean>, [string]>();
jest.mock('../links', () => ({
  ...jest.requireActual('../links'),
  openLink: (url: string) => mockOpenLink(url),
  rateUrl: () => null,
}));

let aboutAnswer: unknown = { bankName: 'Test Bank', licenceLine: null, supportEmail: null };
globalThis.fetch = jest.fn(async () => new Response(JSON.stringify({ statusCode: 200, message: 'OK', data: aboutAnswer }), { status: 200, headers: { 'content-type': 'application/json' } })) as typeof fetch;

async function boot() {
  const { AboutScreen } = require('../AboutScreen') as typeof import('../AboutScreen');
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  await rtl.render(
    <QueryClientProvider client={client}>
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
        <AboutScreen onBack={jest.fn()} onOpenTerms={jest.fn()} onOpenPrivacy={jest.fn()} />
      </SafeAreaProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  mockStatus = 'signedIn';
  mockSupportError = null;
  aboutAnswer = { bankName: 'Test Bank', licenceLine: null, supportEmail: null };
  mockOpenSupport.mockReset().mockResolvedValue(undefined);
  mockOpenLink.mockReset().mockResolvedValue(true);
});

describe('Z9 · Contact support', () => {
  it('a signed-in person taps Contact support and the support chat opens, with nothing attached, even when the owner set no address', async () => {
    await boot();
    await rtl.fireEvent.press(await rtl.screen.findByTestId('about-support'));
    expect(mockOpenSupport).toHaveBeenCalledTimes(1);
    expect(mockOpenSupport).toHaveBeenCalledWith(undefined);
    expect(mockOpenLink).not.toHaveBeenCalled();
    expect(rtl.screen.queryByText('Not available yet')).toBeNull();
  });

  it('with an address set, a signed-in person still gets the chat and the address stays under the title', async () => {
    aboutAnswer = { bankName: 'Test Bank', licenceLine: null, supportEmail: 'help@example.test' };
    await boot();
    await rtl.fireEvent.press(await rtl.screen.findByTestId('about-support'));
    expect(mockOpenSupport).toHaveBeenCalledTimes(1);
    expect(mockOpenLink).not.toHaveBeenCalled();
    expect(rtl.screen.getByText('help@example.test')).toBeTruthy();
  });

  it('a chat the Hub will not open says so under the rows', async () => {
    mockSupportError = 'We couldn’t open the support chat. Try again.';
    await boot();
    await rtl.screen.findByTestId('about-support');
    expect(rtl.screen.getByTestId('about-problem')).toBeTruthy();
    expect(rtl.screen.getByText(mockSupportError)).toBeTruthy();
  });

  it('a signed-out visitor with an address gets the mail app, and without one the row is not drawn', async () => {
    mockStatus = 'signedOut';
    aboutAnswer = { bankName: 'Test Bank', licenceLine: null, supportEmail: 'help@example.test' };
    await boot();
    await rtl.fireEvent.press(await rtl.screen.findByTestId('about-support'));
    expect(mockOpenLink).toHaveBeenCalledWith('mailto:help@example.test');
    expect(mockOpenSupport).not.toHaveBeenCalled();
  });
});
