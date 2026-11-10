import { fireEvent, render, screen } from '@testing-library/react-native';
import { readFileSync } from 'fs';
import { join } from 'path';

import { StyleSheet } from 'react-native';

import { copyFor, InstallView, IOS_STEPS } from '@/features/install/InstallView';
import { InstallAskScreen, useInstallAsk } from '@/features/install/InstallAsk';
import type { InstallContext } from '@/features/install/detect';

const noop = () => undefined;
const draw = (context: InstallContext, extra: Partial<React.ComponentProps<typeof InstallView>> = {}) =>
  render(<InstallView context={context} canPrompt={false} installed={false} copied={false} onInstall={noop} onCopy={noop} onContinue={noop} {...extra} />);

describe('the install screen says the right thing for each place (R-131)', () => {
  it('iPhone Safari: the Share, Add to Home Screen steps and Continue', async () => {
    await draw({ kind: 'ios-safari' });
    expect(screen.getByTestId('install-steps')).toBeTruthy();
    expect(screen.getAllByText(/Step \d/)).toHaveLength(IOS_STEPS.length);
    expect(screen.getByText(/Add to Home Screen/)).toBeTruthy();
    expect(screen.getByTestId('install-continue')).toBeTruthy();
    expect(screen.queryByTestId('install-button')).toBeNull();
  });
  it('Chrome with the browser offer: an Install button that calls the install, and no steps', async () => {
    const onInstall = jest.fn();
    await draw({ kind: 'chromium', os: 'android' }, { canPrompt: true, onInstall });
    await fireEvent.press(screen.getByTestId('install-button'));
    expect(onInstall).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('install-steps')).toBeNull();
  });
  it('Chrome with no offer yet: the menu steps, no Install button', async () => {
    await draw({ kind: 'chromium', os: 'android' });
    expect(screen.getByTestId('install-steps')).toBeTruthy();
    expect(screen.queryByTestId('install-button')).toBeNull();
  });
  it.each([
    ['Instagram', 'ios', 'Safari'],
    ['WhatsApp', 'android', 'Chrome'],
  ] as const)('%s on %s: told to open it in %s, with a copy-link button', async (app, os, browser) => {
    const onCopy = jest.fn();
    await draw({ kind: 'inapp', app, os }, { onCopy });
    expect(screen.getByTestId('install-title').props.children).toBe(`Open this link in ${browser}`);
    await fireEvent.press(screen.getByTestId('install-copy'));
    expect(onCopy).toHaveBeenCalledTimes(1);
  });
  it('Continue in the browser is on every state', async () => {
    const onContinue = jest.fn();
    await draw({ kind: 'cannot' }, { onContinue });
    await fireEvent.press(screen.getByTestId('install-continue'));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });
  it('after the install it says so and still lets the person carry on', async () => {
    await draw({ kind: 'chromium', os: 'desktop' }, { installed: true, canPrompt: true });
    expect(screen.getByTestId('install-title').props.children).toBe('Who Made This is on your device');
    expect(screen.queryByTestId('install-button')).toBeNull();
    expect(screen.getByTestId('install-continue')).toBeTruthy();
  });
  it('no copy carries an em-dash', () => {
    const src = readFileSync(join(__dirname, '../features/install/InstallView.tsx'), 'utf8');
    expect(src.includes('—')).toBe(false);
  });
});

describe('round 1', () => {
  it('M1: the steps card has the shared card padding all round (not the rows card 2)', async () => {
    await draw({ kind: 'ios-safari' });
    const style = StyleSheet.flatten(screen.getByTestId('install-steps').props.style);
    expect(style.padding).toBe(16);
    expect(style.paddingVertical).toBeUndefined();
  });
  it('an iPad is told the Share button is at the top; an iPhone at the bottom', () => {
    expect(copyFor({ kind: 'ios-safari' }, false, false, true).steps[0].text).toMatch(/top of Safari/);
    expect(copyFor({ kind: 'ios-safari' }, false, false, false).steps[0].text).toMatch(/bottom of Safari/);
  });
  it('Safari on a Mac gets File, Add to Dock', async () => {
    await draw({ kind: 'mac-safari' });
    expect(screen.getByText('Choose File in the menu bar.')).toBeTruthy();
    expect(screen.getByText('Choose Add to Dock.')).toBeTruthy();
    expect(screen.getByTestId('install-continue')).toBeTruthy();
  });
  it('words on a computer never say home screen', () => {
    const states: [InstallContext, boolean, boolean][] = [
      [{ kind: 'chromium', os: 'desktop' }, true, false],
      [{ kind: 'chromium', os: 'desktop' }, false, false],
      [{ kind: 'chromium', os: 'desktop' }, true, true],
      [{ kind: 'mac-safari' }, false, false],
    ];
    for (const [ctx, can, done] of states) {
      const c = copyFor(ctx, can, done);
      expect(JSON.stringify(c)).not.toMatch(/home screen/i);
    }
  });
});

describe('the phone never runs it', () => {
  it('on the phone the install screen is never asked for and draws nothing', async () => {
    expect(useInstallAsk()).toBe(false);
    expect(InstallAskScreen()).toBeNull();
  });
  it('the phone file imports nothing', () => {
    const src = readFileSync(join(__dirname, '../features/install/InstallAsk.tsx'), 'utf8');
    expect(/^\s*import\s/m.test(src)).toBe(false);
  });
});
