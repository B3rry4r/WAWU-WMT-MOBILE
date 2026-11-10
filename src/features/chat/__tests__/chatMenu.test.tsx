/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';
import { Platform, StyleSheet, View } from 'react-native';

import { clearClients, CHAT, hub, OTHER, renderWith, resetHub, textMessage } from '../testing/hubDouble';

/*
 * REPORT-UGC round 1 (store gap A, MEDIUM 3, LOW 5), on Platform.OS android with the real handlers: a free chat's "..." menu
 * (Report above Block), Block through the existing route and the chat closing, the thanks drawn above the composer, and the
 * "Report" accessibility action on a message. The Hub's two routes are stand-ins here; the screen is the real one.
 */
const mockVault = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockVault.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => void mockVault.set(key, value)),
  deleteItemAsync: jest.fn(async (key: string) => void mockVault.delete(key)),
}));
jest.mock('@/features/open-wallet/sessionAccount', () => ({ useSessionAccount: () => 'owner-1' }));
jest.mock('expo-router', () => ({ useIsFocused: () => true, useRouter: () => ({ push: jest.fn(), dismissTo: jest.fn(), back: jest.fn(), canGoBack: () => true }) }));
jest.mock('@/features/inbox/live', () => ({ onLiveEvent: () => () => undefined, onLiveSynced: () => () => undefined, retainLive: () => () => undefined }));
jest.mock('@/features/inbox/unread', () => ({ refreshInbox: jest.fn(async () => undefined) }));
jest.mock('@/features/visitor/api', () => ({ blockPerson: jest.fn(async () => undefined) }));
jest.mock('@/features/report/api', () => ({ sendReport: jest.fn(async () => ({ id: 'r1', alreadyReported: false })) }));

const { ChatScreen } = require('../ChatScreen') as typeof import('../ChatScreen');
const { blockPerson } = require('@/features/visitor/api') as { blockPerson: jest.Mock };
const { sendReport } = require('@/features/report/api') as { sendReport: jest.Mock };

rtl.configure({ asyncUtilTimeout: 5000 });
beforeAll(async () => {
  const warm = await rtl.render(<View />);
  warm.unmount();
});
beforeEach(() => {
  jest.replaceProperty(Platform, 'OS', 'android');
  resetHub();
  mockVault.clear();
  blockPerson.mockReset().mockResolvedValue(undefined);
  sendReport.mockReset().mockResolvedValue({ id: 'r1', alreadyReported: false });
});
afterEach(() => {
  clearClients();
  jest.restoreAllMocks();
});

const handlers = () => ({ onBack: jest.fn(), onSendMoney: jest.fn(), onOpenWallet: jest.fn(), onSetPin: jest.fn(), onForgotPin: jest.fn(), onAddMoney: jest.fn() });
async function boot(h = handlers()) {
  await renderWith(<ChatScreen chatId={CHAT} {...h} />);
  await rtl.screen.findByTestId('chat-messages');
  return h;
}

describe('a free chat has the profile menu: Report above Block', () => {
  it('"..." opens a menu with Report this profile above Block, and Block asks, blocks through the existing route and closes the chat', async () => {
    hub.messages = [textMessage('Hello from Femi', false)];
    const h = await boot();
    await rtl.fireEvent.press(rtl.screen.getByTestId('chat-menu'));
    const report = await rtl.screen.findByTestId('chat-person-menu-report');
    const block = rtl.screen.getByTestId('chat-person-menu-block');
    expect(rtl.screen.getByText('Report this profile')).toBeTruthy();
    expect(rtl.screen.getByText('Block Femi')).toBeTruthy();
    // Report is the row above Block.
    const rows = rtl.screen.getAllByTestId(/^chat-person-menu-(report|block)$/).map((n) => n.props.testID);
    expect(rows).toEqual(['chat-person-menu-report', 'chat-person-menu-block']);
    expect(report).toBeTruthy();

    await rtl.fireEvent.press(block);
    expect(await rtl.screen.findByText('Block Femi?')).toBeTruthy();
    expect(rtl.screen.getByText('You will not see each other’s profiles, and any follow between you ends.')).toBeTruthy();
    expect(blockPerson).not.toHaveBeenCalled();
    await rtl.fireEvent.press(rtl.screen.getByTestId('chat-person-menu-block-yes'));
    await rtl.waitFor(() => expect(blockPerson).toHaveBeenCalledWith(OTHER));
    await rtl.waitFor(() => expect(h.onBack).toHaveBeenCalledTimes(1));
  });

  it('a Block the Hub refuses keeps the menu open and says so; the chat is not closed', async () => {
    hub.messages = [textMessage('Hello from Femi', false)];
    const h = await boot();
    blockPerson.mockRejectedValue(new Error('down'));
    await rtl.fireEvent.press(rtl.screen.getByTestId('chat-menu'));
    await rtl.fireEvent.press(await rtl.screen.findByTestId('chat-person-menu-block'));
    await rtl.fireEvent.press(await rtl.screen.findByTestId('chat-person-menu-block-yes'));
    expect(await rtl.screen.findByText('Could not block them. Try again.')).toBeTruthy();
    expect(h.onBack).not.toHaveBeenCalled();
  });

  it('Report this profile opens the shared sheet for the person, and after sending the chat closes', async () => {
    hub.messages = [textMessage('Hello from Femi', false)];
    const h = await boot();
    await rtl.fireEvent.press(rtl.screen.getByTestId('chat-menu'));
    await rtl.fireEvent.press(await rtl.screen.findByTestId('chat-person-menu-report'));
    expect(await rtl.screen.findByTestId('report-sheet')).toBeTruthy();
    await rtl.fireEvent.press(await rtl.screen.findByTestId('report-sheet-reason-harassment'));
    await rtl.fireEvent.press(rtl.screen.getByTestId('report-sheet-send'));
    await rtl.waitFor(() => expect(sendReport).toHaveBeenCalledWith(expect.objectContaining({ kind: 'profile', targetId: OTHER, reason: 'harassment' })));
    await rtl.waitFor(() => expect(h.onBack).toHaveBeenCalledTimes(1));
  });

  it('the Android back button closes the menu without blocking anyone', async () => {
    hub.messages = [textMessage('Hello from Femi', false)];
    const h = await boot();
    await rtl.fireEvent.press(rtl.screen.getByTestId('chat-menu'));
    await rtl.screen.findByTestId('chat-person-menu-block');
    await rtl.fireEvent(rtl.screen.getByTestId('chat-person-menu'), 'requestClose');
    await rtl.waitFor(() => expect(rtl.screen.queryByTestId('chat-person-menu-block')).toBeNull());
    expect(blockPerson).not.toHaveBeenCalled();
    expect(h.onBack).not.toHaveBeenCalled();
  });

  it('the support thread has no menu: the app\'s own account is neither reported nor blocked', async () => {
    hub.supportThread = true;
    hub.messages = [textMessage('We can see it. Looking now.', false)];
    await boot();
    expect(rtl.screen.queryByTestId('chat-menu')).toBeNull();
  });
});

describe('the thanks is drawn above the composer, and a message has a Report action', () => {
  it('after Report on a message the thanks sits above the composer, not behind it', async () => {
    hub.messages = [textMessage('Rude words', false)];
    await boot();
    // The phone tells the screen how tall its composer is.
    await rtl.fireEvent(rtl.screen.getByTestId('chat-bottom'), 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 390, height: 84 } } });
    await rtl.fireEvent(rtl.screen.getByText('Rude words'), 'longPress');
    await rtl.fireEvent.press(await rtl.screen.findByTestId('report-sheet-reason-spam'));
    await rtl.fireEvent.press(rtl.screen.getByTestId('report-sheet-send'));
    const toast = await rtl.screen.findByTestId('report-toast');
    expect(rtl.within(toast).getByText('Thanks. We’ll review this.')).toBeTruthy();
    // 84 for the composer and a gap above it.
    expect(StyleSheet.flatten(toast.props.style).bottom).toBeGreaterThanOrEqual(84);
  });

  it('a screen reader has a "Report" action on the other person\'s message and none on the person\'s own', async () => {
    const theirs = textMessage('Rude words', false);
    const mine = textMessage('My own words', true);
    hub.messages = [theirs, mine];
    await boot();
    const row = rtl.screen.getByTestId(`bubble-${theirs.id}`);
    expect(row.props.accessibilityActions).toEqual([{ name: 'report', label: 'Report' }]);
    expect(rtl.screen.getByTestId(`bubble-${mine.id}`).props.accessibilityActions).toBeUndefined();
    await rtl.fireEvent(row, 'accessibilityAction', { nativeEvent: { actionName: 'report' } });
    expect(await rtl.screen.findByTestId('report-sheet-reason-spam')).toBeTruthy();
  });
});
