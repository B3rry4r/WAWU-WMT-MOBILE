import * as rtl from '@testing-library/react-native';
import { Keyboard, Platform, StyleSheet, TextInput } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ApiError } from '@/api/errors';

import { passwordsMatch, readResetLink, resetPasswordOutcome, resetPasswordProblems } from '../resetPassword';
import { ResetPasswordScreen, type ResetPasswordScreenProps } from '../ResetPasswordScreen';

/**
 * RESET-APP (R-123): the New password screen the emailed reset link opens, as a person uses it, on the Android phone and on the iPhone.
 * The link's address is read the way WAWU ID writes it; the form checks before it sends; a refusal says why where it belongs; the
 * keyboard, the show/hide button and the return keys do what a phone's do.
 */

const TOKEN = 'a'.repeat(64);
const KEYBOARD = 336;
const SCREEN_H = 844;
const OSES = ['android', 'ios'] as const;
type Phone = (typeof OSES)[number];
const showEvent = (os: Phone) => (os === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow');
const hideEvent = (os: Phone) => (os === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide');
const keyboardEvent = { endCoordinates: { screenY: SCREEN_H - KEYBOARD, height: KEYBOARD, screenX: 0, width: 390 }, duration: 0, easing: 'keyboard' as const };

describe('RESET-APP · the link\'s address', () => {
  it('reads the token and the email the way WAWU ID writes them', () => {
    expect(readResetLink({ token: TOKEN, email: 'ada@example.test' })).toEqual({ token: TOKEN, email: 'ada@example.test' });
    // WAWU ID writes encodeURIComponent(email); the router hands it back decoded, and a plus sign survives.
    expect(readResetLink({ token: TOKEN, email: 'Ada+wawu@Example.test ' })).toEqual({ token: TOKEN, email: 'ada+wawu@example.test' });
    expect(readResetLink({ token: [TOKEN, 'x'], email: ['ada@example.test'] })).toEqual({ token: TOKEN, email: 'ada@example.test' });
  });

  it('refuses an address the server could not have mailed: no token, no email, an email that is not one, a token with a space', () => {
    expect(readResetLink({})).toBeNull();
    expect(readResetLink({ token: TOKEN })).toBeNull();
    expect(readResetLink({ email: 'ada@example.test' })).toBeNull();
    expect(readResetLink({ token: '  ', email: 'ada@example.test' })).toBeNull();
    expect(readResetLink({ token: TOKEN, email: 'not-an-email' })).toBeNull();
    expect(readResetLink({ token: 'abc def', email: 'ada@example.test' })).toBeNull();
    expect(readResetLink({ token: 'a'.repeat(513), email: 'ada@example.test' })).toBeNull();
  });
});

describe('RESET-APP · the form\'s own checks and the server\'s answers', () => {
  it('asks for the password, 8 to 128 characters, and the same again', () => {
    expect(resetPasswordProblems('', '')).toEqual({ next: 'Enter a new password.', confirm: 'Enter the new password again.' });
    expect(resetPasswordProblems('short', 'short').next).toBe('Use at least 8 characters.');
    expect(resetPasswordProblems('x'.repeat(129), 'x'.repeat(129)).next).toBe('Use no more than 128 characters.');
    expect(resetPasswordProblems('long-enough-1', 'long-enough-2').confirm).toBe("The two passwords don't match.");
    expect(resetPasswordProblems('long-enough-1', 'long-enough-1')).toEqual({ next: undefined, confirm: undefined });
    expect(passwordsMatch('long-enough-1', 'long-enough-1')).toBe(true);
    expect(passwordsMatch('short', 'short')).toBe(false);
    expect(passwordsMatch('long-enough-1', '')).toBe(false);
  });

  it('a 401 (wrong, expired or used token) is the spent-link screen; a 400 is a line on the password; the rest is a banner', () => {
    expect(resetPasswordOutcome(new ApiError('unauthorized', 401, 'Invalid or expired reset token'))).toEqual({ kind: 'invalid' });
    expect(resetPasswordOutcome(new ApiError('validation', 400, 'password must be longer'))).toEqual({ kind: 'field', message: 'Use 8 to 128 characters.' });
    const offline = resetPasswordOutcome(new ApiError('network', 0, 'No connection.'));
    expect(offline.kind === 'banner' && offline.failure.title).toBe('No connection');
    const busy = resetPasswordOutcome(new ApiError('rate_limited', 429, 'Too many requests', 'RATE_LIMITED', 30));
    expect(busy.kind === 'banner' && busy.failure.title).toBe('Too many tries');
    const server = resetPasswordOutcome(new ApiError('server', 500, 'Internal server error'));
    expect(server.kind === 'banner' && server.failure.title).toBe('Something went wrong on our side');
    expect(resetPasswordOutcome(new Error('boom')).kind).toBe('banner');
  });
});

let os: jest.ReplaceProperty<typeof Platform.OS>;
let listeners: Map<string, ((e: unknown) => void)[]>;
function phone(name: Phone) {
  os = jest.replaceProperty(Platform, 'OS', name);
  listeners = new Map();
  jest.spyOn(Keyboard, 'addListener').mockImplementation(((event: string, fn: (e: unknown) => void) => {
    listeners.set(event, [...(listeners.get(event) ?? []), fn]);
    return { remove: () => listeners.set(event, (listeners.get(event) ?? []).filter((l) => l !== fn)) };
  }) as never);
  jest.spyOn(Keyboard, 'isVisible').mockReturnValue(false);
}
afterEach(() => {
  os?.restore();
  jest.restoreAllMocks();
  rtl.cleanup();
});
const say = (event: string, payload?: unknown) => rtl.act(async () => (listeners.get(event) ?? []).forEach((l) => l(payload)));
const area = (node: React.ReactElement) => (
  <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: SCREEN_H }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>{node}</SafeAreaProvider>
);
const typeInto = async (testID: string, text: string) => rtl.act(async () => rtl.fireEvent.changeText(rtl.screen.getByTestId(testID), text));

function props(over: Partial<ResetPasswordScreenProps> = {}): ResetPasswordScreenProps {
  return {
    email: 'ada@example.test',
    onSave: jest.fn(async () => undefined),
    onBack: jest.fn(),
    onSignIn: jest.fn(),
    onAskForNewLink: jest.fn(),
    askLabel: 'Back to Forgot password',
    ...over,
  };
}
const draw = async (over: Partial<ResetPasswordScreenProps> = {}) => {
  const p = props(over);
  await rtl.render(area(<ResetPasswordScreen {...p} />));
  return p;
};
const save = () => rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('reset-submit')));

describe.each(OSES)('RESET-APP · the New password screen (%s)', (name) => {
  beforeEach(() => phone(name));

  it('opens on the board\'s two fields with the email above them, read only', async () => {
    await draw();
    // The bar's title and the field's label.
    expect(rtl.screen.getAllByText('New password')).toHaveLength(2);
    const email = rtl.screen.getByTestId('reset-email');
    expect(email.props.value).toBe('ada@example.test');
    expect(email.props.editable).toBe(false);
    expect(rtl.screen.getByTestId('reset-new').props.secureTextEntry).toBe(true);
    expect(rtl.screen.getByTestId('reset-confirm').props.secureTextEntry).toBe(true);
    expect(rtl.screen.getByText('At least 8 characters')).toBeTruthy();
    expect(rtl.screen.getByText('Save password')).toBeTruthy();
    // The email is not a field the person can change: no show/hide button on it.
    expect(rtl.screen.getAllByLabelText('Show password')).toHaveLength(2);
  });

  it('shows or hides each password with its own eye button', async () => {
    await draw();
    const [first, second] = rtl.screen.getAllByLabelText('Show password');
    await rtl.act(async () => rtl.fireEvent.press(first));
    expect(rtl.screen.getByTestId('reset-new').props.secureTextEntry).toBe(false);
    expect(rtl.screen.getByTestId('reset-confirm').props.secureTextEntry).toBe(true);
    await rtl.act(async () => rtl.fireEvent.press(second));
    expect(rtl.screen.getByTestId('reset-confirm').props.secureTextEntry).toBe(false);
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getAllByLabelText('Hide password')[0]));
    expect(rtl.screen.getByTestId('reset-new').props.secureTextEntry).toBe(true);
  });

  it('says "Passwords match" as soon as the two agree, and not before', async () => {
    await draw();
    await typeInto('reset-new', 'new-password-1');
    await typeInto('reset-confirm', 'new-password');
    expect(rtl.screen.queryByText('Passwords match')).toBeNull();
    await typeInto('reset-confirm', 'new-password-1');
    expect(rtl.screen.getByText('Passwords match')).toBeTruthy();
  });

  it('sends nothing for an empty form and says what is missing under each field', async () => {
    const p = await draw();
    await save();
    expect(p.onSave).not.toHaveBeenCalled();
    expect(rtl.screen.getByText('Enter a new password.')).toBeTruthy();
    expect(rtl.screen.getByText('Enter the new password again.')).toBeTruthy();
  });

  it('sends nothing for a short password or two that differ, and the line goes when the person types again', async () => {
    const p = await draw();
    await typeInto('reset-new', 'short');
    await typeInto('reset-confirm', 'short');
    await save();
    expect(rtl.screen.getByText('Use at least 8 characters.')).toBeTruthy();
    await typeInto('reset-new', 'new-password-1');
    expect(rtl.screen.queryByText('Use at least 8 characters.')).toBeNull();
    await typeInto('reset-confirm', 'new-password-2');
    await save();
    expect(rtl.screen.getByText("The two passwords don't match.")).toBeTruthy();
    expect(p.onSave).not.toHaveBeenCalled();
  });

  it('Save sends the password once, even when it is tapped twice in one frame, then says it is changed', async () => {
    let release: () => void = () => undefined;
    const onSave = jest.fn(() => new Promise<void>((resolve) => (release = resolve)));
    const p = await draw({ onSave });
    await typeInto('reset-new', 'new-password-1');
    await typeInto('reset-confirm', 'new-password-1');
    await rtl.act(async () => {
      rtl.fireEvent.press(rtl.screen.getByTestId('reset-submit'));
      rtl.fireEvent.press(rtl.screen.getByTestId('reset-submit'));
    });
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith('new-password-1');
    // While it saves, the fields and the form stay (the person sees nothing jump).
    expect(rtl.screen.getByTestId('reset-password')).toBeTruthy();
    await rtl.act(async () => release());
    expect(rtl.screen.getByTestId('reset-done')).toBeTruthy();
    expect(rtl.screen.getByText('Password changed')).toBeTruthy();
    expect(rtl.screen.getByText('Sign in with your new password.')).toBeTruthy();
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByText('Sign in')));
    expect(p.onSignIn).toHaveBeenCalledTimes(1);
  });

  it('a spent link (401) after Save is one plain screen with the way back to Forgot password', async () => {
    const p = await draw({ onSave: jest.fn(async () => Promise.reject(new ApiError('unauthorized', 401, 'Invalid or expired reset token'))) });
    await typeInto('reset-new', 'new-password-1');
    await typeInto('reset-confirm', 'new-password-1');
    await save();
    expect(rtl.screen.getByTestId('reset-invalid')).toBeTruthy();
    expect(rtl.screen.getByText('This link no longer works')).toBeTruthy();
    expect(rtl.screen.getByText('It has expired or was already used. Ask for a new one.')).toBeTruthy();
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByText('Back to Forgot password')));
    expect(p.onAskForNewLink).toHaveBeenCalledTimes(1);
  });

  it('opens straight on that screen when the address held no usable token or email, with nothing to send', async () => {
    const p = await draw({ linkUsable: false, email: '' });
    expect(rtl.screen.getByTestId('reset-invalid')).toBeTruthy();
    expect(rtl.screen.queryByTestId('reset-new')).toBeNull();
    expect(p.onSave).not.toHaveBeenCalled();
  });

  it.each([
    ['offline', new ApiError('network', 0, 'No connection.'), 'No connection'],
    ['rate limited', new ApiError('rate_limited', 429, 'Too many requests', 'RATE_LIMITED'), 'Too many tries'],
    ['server', new ApiError('server', 500, 'Internal server error'), 'Something went wrong on our side'],
  ])('%s: a banner above the form, what was typed stays, and Save can be tried again', async (_label, error, title) => {
    const onSave = jest.fn().mockRejectedValueOnce(error).mockResolvedValueOnce(undefined);
    await draw({ onSave });
    await typeInto('reset-new', 'new-password-1');
    await typeInto('reset-confirm', 'new-password-1');
    await save();
    expect(rtl.screen.getByTestId('reset-banner')).toBeTruthy();
    expect(rtl.screen.getByText(title)).toBeTruthy();
    expect(rtl.screen.getByTestId('reset-new').props.value).toBe('new-password-1');
    expect(rtl.screen.getByTestId('reset-confirm').props.value).toBe('new-password-1');
    await save();
    expect(onSave).toHaveBeenCalledTimes(2);
    expect(rtl.screen.getByTestId('reset-done')).toBeTruthy();
  });

  it('a 400 from the server is a line on the New password field', async () => {
    await draw({ onSave: jest.fn(async () => Promise.reject(new ApiError('validation', 400, 'password must be longer than or equal to 8 characters'))) });
    await typeInto('reset-new', 'new-password-1');
    await typeInto('reset-confirm', 'new-password-1');
    await save();
    expect(rtl.screen.getByText('Use 8 to 128 characters.')).toBeTruthy();
    expect(rtl.screen.queryByTestId('reset-banner')).toBeNull();
  });

  it('the return keys move on and send: Next on the new password focuses Confirm, Go on Confirm saves', async () => {
    const onSave = jest.fn(async () => undefined);
    await draw({ onSave });
    // The input's own focus() is what the Next key calls; watch it on the input component, and see which input it was called on.
    const focusCall = jest.spyOn(TextInput.prototype as unknown as { focus: () => void }, 'focus');
    await typeInto('reset-new', 'new-password-1');
    await typeInto('reset-confirm', 'new-password-1');
    expect(rtl.screen.getByTestId('reset-new').props.returnKeyType).toBe('next');
    expect(rtl.screen.getByTestId('reset-new').props.submitBehavior).toBe('submit');
    focusCall.mockClear();
    await rtl.act(async () => rtl.fireEvent(rtl.screen.getByTestId('reset-new'), 'submitEditing'));
    expect(focusCall).toHaveBeenCalledTimes(1);
    expect((focusCall.mock.contexts[0] as { props: { testID: string } }).props.testID).toBe('reset-confirm');
    expect(rtl.screen.getByTestId('reset-confirm').props.returnKeyType).toBe('go');
    await rtl.act(async () => rtl.fireEvent(rtl.screen.getByTestId('reset-confirm'), 'submitEditing'));
    expect(onSave).toHaveBeenCalledWith('new-password-1');
  });

  it('the keyboard comes up over the fields: the screen pads its foot by it, so Save sits on the keyboard, and gives it back', async () => {
    await draw();
    const root = () => StyleSheet.flatten(rtl.screen.getByTestId('reset-password').props.style);
    await rtl.act(async () => rtl.screen.getByTestId('reset-password').props.onLayout({ nativeEvent: { layout: { x: 0, y: 0, width: 390, height: SCREEN_H } }, persist: () => undefined }));
    expect(root().paddingBottom ?? 0).toBe(0);
    await say(showEvent(name), keyboardEvent);
    await rtl.act(async () => void (await new Promise((r) => setTimeout(r, 0))));
    expect(StyleSheet.flatten(rtl.screen.getByTestId('reset-password').props.style).paddingBottom).toBe(KEYBOARD);
    // Save is inside that padded frame, not outside it.
    expect(rtl.screen.getByTestId('reset-submit')).toBeTruthy();
    await say(hideEvent(name));
    await rtl.act(async () => void (await new Promise((r) => setTimeout(r, 0))));
    expect(StyleSheet.flatten(rtl.screen.getByTestId('reset-password').props.style).paddingBottom ?? 0).toBe(0);
  });

  it('the New password field takes the focus when the screen opens (the board draws it focused)', async () => {
    await draw();
    expect(rtl.screen.getByTestId('reset-new').props.autoFocus).toBe(true);
  });

  it('the round back button goes back', async () => {
    const p = await draw();
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('auth-back')));
    expect(p.onBack).toHaveBeenCalledTimes(1);
  });

  it('asks the password manager for a new password for this email: username on the email, new-password on both', async () => {
    await draw();
    expect(rtl.screen.getByTestId('reset-email').props.textContentType).toBe('username');
    expect(rtl.screen.getByTestId('reset-new').props.textContentType).toBe('newPassword');
    expect(rtl.screen.getByTestId('reset-new').props.autoComplete).toBe('new-password');
    expect(rtl.screen.getByTestId('reset-confirm').props.autoComplete).toBe('new-password');
  });
});
