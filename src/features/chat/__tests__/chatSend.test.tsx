/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';
import { View } from 'react-native';

import { clearClients, CHAT, enterPin, hub, OTHER, renderWith, resetHub, textMessage } from '../testing/hubDouble';

/*
 * Send money in a chat (INBOX-19: I14, I15) on the real screens with the Hub as a stand-in `fetch`.
 */
const mockVault = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockVault.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => void mockVault.set(key, value)),
  deleteItemAsync: jest.fn(async (key: string) => void mockVault.delete(key)),
}));
jest.mock('@/features/open-wallet/sessionAccount', () => ({ useSessionAccount: () => 'owner-1' }));
const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useIsFocused: () => true, useRouter: () => ({ push: mockPush, dismissTo: jest.fn(), back: jest.fn(), canGoBack: () => true }) }));
jest.mock('@/features/inbox/live', () => ({ onLiveEvent: () => () => undefined, onLiveSynced: () => () => undefined, retainLive: () => () => undefined }));
jest.mock('@/features/inbox/unread', () => ({ refreshInbox: jest.fn(async () => undefined) }));

const { ChatSendScreen } = require('../ChatSendScreen') as typeof import('../ChatSendScreen');
const { ChatScreen } = require('../ChatScreen') as typeof import('../ChatScreen');
const { chatSends, addChatSend, forgetChatSendsInMemory } = require('../sends') as typeof import('../sends');
const { forgetAttempts } = require('@/features/money-attempt/attempts') as typeof import('@/features/money-attempt/attempts');
const { forgetIntentsInMemory, findIntent } = require('@/features/send/intent') as typeof import('@/features/send/intent');
void View;

rtl.configure({ asyncUtilTimeout: 5000 });
beforeAll(async () => {
  const warm = await rtl.render(<View />);
  warm.unmount();
});
beforeEach(() => {
  resetHub();
  mockVault.clear();
  mockPush.mockClear();
  forgetAttempts();
  forgetIntentsInMemory();
  forgetChatSendsInMemory();
});
afterEach(() => clearClients());

const payee = { wawuUserId: OTHER, name: 'Femi Bankole', handle: 'femib', avatarUrl: null, tick: null } as const;
const handlers = () => ({ onBack: jest.fn(), onDone: jest.fn(), onSetPin: jest.fn(), onForgotPin: jest.fn(), onAddMoney: jest.fn() });

async function boot(h = handlers()) {
  await renderWith(<ChatSendScreen chatId={CHAT} payee={payee} {...h} />);
  await rtl.screen.findByTestId('send-balance');
  return h;
}
const type = async (digits: string) => {
  for (const d of digits) await rtl.fireEvent.press(rtl.screen.getByTestId(`amount-key-${d}`));
};
const sendButton = () => rtl.screen.getByTestId('chat-send');
async function reachPin(amount = '25000') {
  await type(amount);
  await rtl.screen.findByTestId('chat-send-total');
  await rtl.fireEvent.press(sendButton());
  await rtl.screen.findByText(/^Approve /);
}

describe('I14: the amount', () => {
  it('a user types an amount and a note and sees what it costs: the bank charge, WAWU\'s fee, the total, what the other gets, and a button with the total', async () => {
    await boot();
    expect(rtl.screen.getByText('Send to Femi')).toBeTruthy();
    expect(rtl.screen.getByTestId('chat-send-payee').props.children).toBe('Femi Bankole');
    expect(sendButton().props.accessibilityState.disabled).toBe(true);
    await type('25000');
    await rtl.fireEvent.changeText(rtl.screen.getByTestId('send-note'), 'For the shoot, thank you');
    await rtl.screen.findByTestId('chat-send-total');
    expect(rtl.screen.getByText('Bank charge ₦15.75 + WAWU’s fee ₦10 = ₦25.75')).toBeTruthy();
    expect(rtl.screen.getByTestId('chat-send-total').props.children).toBe('Total ₦25,025.75');
    expect(rtl.screen.getByTestId('chat-send-gets').props.children).toBe('Femi gets ₦25,000');
    expect(rtl.screen.getByText('Send ₦25,025.75')).toBeTruthy();
    expect(rtl.screen.queryByText(/Fintava/)).toBeNull();
    // W9's quick amounts are not on this board.
    expect(rtl.screen.queryByTestId('send-presets')).toBeNull();
  });

  it('a user sends with the PIN: one payment with the note, the chat is told, and the send is kept for I15\'s bubble', async () => {
    const h = await boot();
    await type('25000');
    await rtl.fireEvent.changeText(rtl.screen.getByTestId('send-note'), 'For the shoot, thank you');
    await rtl.screen.findByTestId('chat-send-total');
    await rtl.fireEvent.press(sendButton());
    await rtl.screen.findByText(/^Approve /);
    await enterPin('4829');
    await rtl.waitFor(() => expect(h.onDone).toHaveBeenCalledTimes(1));
    expect(hub.payments).toBe(1);
    expect(hub.pays).toHaveLength(1);
    expect(hub.pays[0].pin).toBe('4829');
    expect(hub.pays[0].body).toMatchObject({ amountKobo: 2_500_000, expectedTotalKobo: 2_502_575, recipientWawuUserId: OTHER, note: 'For the shoot, thank you' });
    expect((await chatSends('owner-1', CHAT)).map((s) => s.transferId)).toEqual(['tr-1']);
  });

  it('a double tap on Send asks for one fresh quote and opens one PIN sheet, and one payment follows', async () => {
    const h = await boot();
    await type('25000');
    await rtl.screen.findByTestId('chat-send-total');
    const before = hub.quotes.length;
    let release: () => void = () => undefined;
    hub.holdQuote = new Promise<void>((resolve) => {
      release = resolve;
    });
    await rtl.fireEvent.press(sendButton());
    await rtl.fireEvent.press(sendButton());
    release();
    await rtl.screen.findByText(/^Approve /);
    expect(hub.quotes.length - before).toBe(1);
    expect(rtl.screen.getAllByText(/^Approve /)).toHaveLength(1);
    await enterPin('4829');
    await rtl.waitFor(() => expect(h.onDone).toHaveBeenCalledTimes(1));
    expect(hub.payments).toBe(1);
    expect(hub.pays).toHaveLength(1);
  });

  it('a wrong PIN says so and moves nothing; the right PIN then sends once', async () => {
    hub.wrongFirst = true;
    const h = await boot();
    await reachPin();
    await enterPin('1111');
    await rtl.screen.findByText(/Wrong PIN/);
    expect(hub.payments).toBe(0);
    await enterPin('4829');
    await rtl.waitFor(() => expect(h.onDone).toHaveBeenCalledTimes(1));
    expect(hub.payments).toBe(1);
  });

  it('a wallet too short is told so before the PIN, with Add money, and nothing is sent', async () => {
    hub.balanceKobo = 50_000;
    const h = await boot();
    await type('25000');
    await rtl.screen.findByTestId('chat-send-total');
    await rtl.fireEvent.press(sendButton());
    await rtl.screen.findByText(/Not enough in your Naira wallet/);
    expect(hub.pays).toHaveLength(0);
    await rtl.fireEvent.press(rtl.screen.getByText(/^Add /));
    expect(h.onAddMoney).toHaveBeenCalledWith(2_502_575 - 50_000);
  });

  it('a refusal for a short wallet after the PIN shows the bank balance and keeps the key free', async () => {
    hub.mode = 'short';
    const h = await boot();
    await reachPin();
    await enterPin('4829');
    await rtl.screen.findByText(/Not enough in your Naira wallet/);
    expect(hub.payments).toBe(0);
    expect(h.onDone).not.toHaveBeenCalled();
  });

  it('an answer that never comes is followed by the SAME request: one debit', async () => {
    hub.mode = 'lost_after';
    const h = await boot();
    await reachPin();
    await enterPin('4829');
    await rtl.screen.findByText(/^Approve /);
    // The line says the payment may have gone through and that the retry happens once (SWEEP-APP-3, SWEEP-APP-2 #1).
    expect(await rtl.screen.findByText("We didn't get an answer. Try again: it will only happen once.")).toBeTruthy();
    expect(hub.payments).toBe(1);
    expect(h.onDone).not.toHaveBeenCalled();
    await enterPin('4829');
    await rtl.waitFor(() => expect(h.onDone).toHaveBeenCalledTimes(1));
    expect(hub.payments).toBe(1);
    expect(hub.pays).toHaveLength(2);
    expect(hub.pays[1].key).toBe(hub.pays[0].key);
    expect(hub.pays[1].body).toEqual(hub.pays[0].body);
  });

  it('a lost answer, then the screen left and opened again, sends the same key and the same quote', async () => {
    hub.mode = 'lost_before';
    const first = await renderWith(<ChatSendScreen chatId={CHAT} payee={payee} {...handlers()} />);
    await rtl.screen.findByTestId('send-balance');
    await reachPin();
    await enterPin('4829');
    await rtl.screen.findByText(/^Approve /);
    await first.unmount();
    const quotesBefore = hub.quotes.length;
    const h = handlers();
    await renderWith(<ChatSendScreen chatId={CHAT} payee={payee} {...h} />);
    await rtl.screen.findByTestId('send-balance');
    await type('25000');
    await rtl.waitFor(() => expect(rtl.screen.getByTestId('chat-send').props.accessibilityState.disabled).toBe(false));
    await rtl.fireEvent.press(sendButton());
    await rtl.screen.findByText(/^Approve /);
    // A send already made is asked again as it was: no new quote is made for it.
    expect(hub.quotes.length).toBe(quotesBefore);
    await enterPin('4829');
    await rtl.waitFor(() => expect(h.onDone).toHaveBeenCalledTimes(1));
    expect(hub.payments).toBe(1);
    expect(hub.pays[1].key).toBe(hub.pays[0].key);
  });

  it('a person with no wallet is led to Open your wallet', async () => {
    hub.mode = 'no_wallet';
    await boot();
    await reachPin();
    await enterPin('4829');
    await rtl.waitFor(() => expect(mockPush).toHaveBeenCalledWith('/open-wallet'));
    expect(hub.payments).toBe(0);
  });

  it('a send the provider has not confirmed goes back to the chat, is kept as pending, and is not sent again', async () => {
    hub.mode = 'pending';
    const h = await boot();
    await reachPin();
    await enterPin('4829');
    await rtl.waitFor(() => expect(h.onDone).toHaveBeenCalledTimes(1));
    expect(hub.payments).toBe(1);
    const kept = await findIntent('owner-1', OTHER, 2_500_000);
    expect(kept?.phase).toBe('pending');
    expect(kept?.transferId).toBe('tr-1');
  });

  it('a send that fails says why and moves nothing', async () => {
    hub.mode = 'failed';
    const h = await boot();
    await reachPin();
    await enterPin('4829');
    await rtl.screen.findByText('The bank did not take it.');
    expect(h.onDone).not.toHaveBeenCalled();
  });
});

describe('I15: the bubble in the chat', () => {
  it('a send made from the chat is there as "You sent", with its note and that it was delivered', async () => {
    hub.messages = [textMessage('Thanks, got it', true)];
    await addChatSend('owner-1', CHAT, 'tr-1', Date.parse('2026-10-17T10:42:00.000Z'));
    await renderWith(
      <ChatScreen chatId={CHAT} onBack={jest.fn()} onSendMoney={jest.fn()} onOpenWallet={jest.fn()} onSetPin={jest.fn()} onForgotPin={jest.fn()} onAddMoney={jest.fn()} />,
    );
    await rtl.screen.findByTestId('sent-tr-1');
    expect(rtl.screen.getByText('You sent')).toBeTruthy();
    expect(rtl.screen.getByLabelText('25,000 naira')).toBeTruthy();
    expect(rtl.screen.getByText('For the shoot, thank you')).toBeTruthy();
    expect(rtl.screen.getByText('Delivered to Femi')).toBeTruthy();
  });

  it('a send still being confirmed reads "Sending to Femi", then "Delivered to Femi" once the Hub decides', async () => {
    hub.mode = 'pending';
    hub.messages = [textMessage('Thanks, got it', true)];
    await addChatSend('owner-1', CHAT, 'tr-1');
    await renderWith(
      <ChatScreen chatId={CHAT} onBack={jest.fn()} onSendMoney={jest.fn()} onOpenWallet={jest.fn()} onSetPin={jest.fn()} onForgotPin={jest.fn()} onAddMoney={jest.fn()} />,
    );
    expect(await rtl.screen.findByText('Sending to Femi')).toBeTruthy();
    await rtl.waitFor(() => expect(rtl.screen.getByText('Delivered to Femi')).toBeTruthy(), { timeout: 8000 });
  });
});
