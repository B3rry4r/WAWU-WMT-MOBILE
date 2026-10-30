/* eslint-disable @typescript-eslint/no-require-imports */
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const { ConsentBox, SIGNUP_CONSENT_LINE } = require('../ConsentBox') as typeof import('../ConsentBox');

const frame = (children: React.ReactNode) => (
  <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>{children}</SafeAreaProvider>
);

// WALK-FIX M5 (29 Oct walk): tapping the "I agree to the Terms..." sentence opened the Legal list instead of ticking the box.
describe('sign-up\'s consent line: the sentence ticks, only the link opens the list', () => {
  const boot = async () => {
    const onToggle = jest.fn();
    const onOpenAll = jest.fn();
    await render(frame(<ConsentBox testID="c" agreed={false} busy={false} onToggle={onToggle} onOpenAll={onOpenAll} />));
    return { onToggle, onOpenAll };
  };

  it('a tap on the sentence ticks the box and opens nothing', async () => {
    const { onToggle, onOpenAll } = await boot();
    await fireEvent.press(screen.getByText(SIGNUP_CONSENT_LINE));
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onOpenAll).not.toHaveBeenCalled();
  });

  it('a tap on the box ticks it too', async () => {
    const { onToggle, onOpenAll } = await boot();
    await fireEvent.press(screen.getByTestId('c'));
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onOpenAll).not.toHaveBeenCalled();
  });

  it('"Read them" is still a link: it opens the Legal list and does not tick', async () => {
    const { onToggle, onOpenAll } = await boot();
    const link = screen.getByText('Read them');
    expect(link.props.accessibilityRole).toBe('link');
    await fireEvent.press(link);
    expect(onOpenAll).toHaveBeenCalledTimes(1);
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('the link is not part of the sentence\'s own text, so no tap on the sentence can land on it', async () => {
    await boot();
    expect(screen.getByTestId('c-line').props.children).toBe(SIGNUP_CONSENT_LINE);
    expect(screen.getByTestId('c-read')).not.toBe(screen.getByTestId('c-line'));
  });
});

describe('the wallet\'s and the movie\'s consent line keeps its inline links', () => {
  it('a tap on the sentence ticks; "terms" and "privacy policy" open their own pages', async () => {
    const onToggle = jest.fn();
    const onOpenTerms = jest.fn();
    const onOpenPrivacy = jest.fn();
    await render(frame(<ConsentBox testID="w" agreed={false} busy={false} onToggle={onToggle} onOpenTerms={onOpenTerms} onOpenPrivacy={onOpenPrivacy} />));
    await fireEvent.press(screen.getByTestId('w'));
    expect(onToggle).toHaveBeenCalledTimes(1);
    await fireEvent.press(screen.getByTestId('w-terms'));
    await fireEvent.press(screen.getByTestId('w-privacy'));
    expect(onOpenTerms).toHaveBeenCalledTimes(1);
    expect(onOpenPrivacy).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
