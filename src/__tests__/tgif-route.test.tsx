import * as rtl from '@testing-library/react-native';

const mockParams: { date?: string | string[] } = {};
const mockReader = jest.fn((_props: Record<string, unknown>) => null);

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({ canGoBack: () => true, back: jest.fn(), replace: jest.fn(), push: jest.fn() }),
  useLocalSearchParams: () => mockParams,
}));
jest.mock('@/features/tgif/TgifReader', () => ({
  TgifReader: (props: Record<string, unknown>) => mockReader(props),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const TgifRoute = (require('../app/tgif') as typeof import('../app/tgif')).default;

describe('/tgif opened by the morning notice (HOME-16)', () => {
  beforeEach(() => {
    mockReader.mockClear();
    delete mockParams.date;
  });

  it('hands the notice day to the reader', async () => {
    mockParams.date = '2026-10-17';
    await rtl.render(<TgifRoute />);
    expect(mockReader).toHaveBeenCalledWith(expect.objectContaining({ date: '2026-10-17' }));
  });

  it('hands the reader no day when the route has none, so it reads today', async () => {
    await rtl.render(<TgifRoute />);
    expect(mockReader).toHaveBeenCalledWith(expect.objectContaining({ date: undefined }));
  });

  it('ignores a day that arrives as a list', async () => {
    mockParams.date = ['2026-10-17', '2026-10-18'];
    await rtl.render(<TgifRoute />);
    expect(mockReader).toHaveBeenCalledWith(expect.objectContaining({ date: undefined }));
  });
});
