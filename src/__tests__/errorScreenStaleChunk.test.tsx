import { render, screen } from '@testing-library/react-native';

import { ErrorScreen } from '@/components/ErrorScreen';

const mockReload = jest.fn();
jest.mock('@/lib/staleChunk', () => ({ reloadForNewDeploy: (error: unknown) => mockReload(error) }));
jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }));

/** WEBAPP-12 fix 1: the error screen asks for the one reload when a route file is gone, and still shows the screen if it is refused. */
describe('ErrorScreen and a missing route file', () => {
  it('asks for the reload with the error it was given, and still draws the error screen', async () => {
    const error = new Error('Loading module /x.js failed.');
    await render(<ErrorScreen error={error} retry={jest.fn()} />);
    expect(mockReload).toHaveBeenCalledWith(error);
    expect(screen.getByText('Something went wrong')).toBeTruthy();
  });
});
