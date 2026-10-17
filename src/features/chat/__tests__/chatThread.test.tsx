/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';
import { View } from 'react-native';

import { clearClients, CHAT, enterPin, hub, ME, OTHER, REQUEST_ID, renderWith, requestMessage, requestView, resetHub, textMessage } from '../testing/hubDouble';

/*
 * A chat between two people (INBOX-19: I12, I13; INBOX-20: I16 to I19) on the real screen with the Hub as a stand-in `fetch`. The socket
 * is a stand-in too: `mockLive` carries what the Hub would say live.
 */
const mockVault = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockVault.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => void mockVault.set(key, value)),
  deleteItemAsync: jest.fn(async (key: string) => void mockVault.delete(key)),
}));
jest.mock('@/features/open-wallet/sessionAccount', () => ({ useSessionAccount: () => 'owner-1' }));
jest.mock('expo-router', () => ({ useIsFocused: () => true, useRouter: () => ({ push: jest.fn(), dismissTo: jest.fn(), back: jest.fn(), canGoBack: () => true }) }));
const mockLive = { listeners: [] as ((event: unknown) => void)[] };
jest.mock('@/features/inbox/live', () => ({
  onLiveEvent: (listener: (event: unknown) => void) => {
    mockLive.listeners.push(listener);
    return () => {
      mockLive.listeners = mockLive.listeners.filter((l) => l !== listener);
    };
  },
  onLiveSynced: () => () => undefined,
  retainLive: () => () => undefined,
}));
jest.mock('@/features/inbox/unread', () => ({ refreshInbox: jest.fn(async () => undefined) }));

const { ChatScreen } = require('../ChatScreen') as typeof import('../ChatScreen');
const { forgetAttempts } = require('@/features/money-attempt/attempts') as typeof import('@/features/money-attempt/attempts');
const { forgetIntentsInMemory } = require('@/features/send/intent') as typeof import('@/features/send/intent');
const { forgetChatSendsInMemory } = require('../sends') as typeof import('../sends');
void View;

rtl.configure({ asyncUtilTimeout: 5000 });

beforeAll(async () => {
  const warm = await rtl.render(<View />);
  warm.unmount();
});

beforeEach(() => {
  resetHub();
  mockVault.clear();
  mockLive.listeners = [];
  forgetAttempts();
  forgetIntentsInMemory();
  forgetChatSendsInMemory();
});
afterEach(() => clearClients());

function handlers() {
  return { onBack: jest.fn(), onSendMoney: jest.fn(), onOpenWallet: jest.fn(), onSetPin: jest.fn(), onForgotPin: jest.fn() };
}

async function boot(h = handlers()) {
  await renderWith(<ChatScreen chatId={CHAT} {...h} />);
  await rtl.screen.findByTestId('chat-messages');
  return h;
}

const live = (event: unknown) => rtl.act(async () => mockLive.listeners.forEach((l) => l(event)));

describe('I12: the chat', () => {
  it('a user sees who they are talking to and the messages, theirs on the left and their own on the right', async () => {
    hub.messages = [textMessage('Thanks, got it', true, '2026-10-16T17:52:00.000Z'), textMessage('Sent the invoice for the shoot. 3 edits included.', false, '2026-10-16T17:40:00.000Z')];
    await boot();
    expect(rtl.screen.getByTestId('chat-name').props.children).toBe('Femi Bankole');
    expect(rtl.screen.getByTestId('chat-sub').props.children).toBe('@femib · on Who Made This?');
    expect(rtl.screen.getByText('Sent the invoice for the shoot. 3 edits included.')).toBeTruthy();
    expect(rtl.screen.getByText('Thanks, got it')).toBeTruthy();
    expect(rtl.screen.getByTestId('chat-composer-input')).toBeTruthy();
  });

  it('a user types and sends: one message, with the app\'s own id for it', async () => {
    hub.messages = [textMessage('Hi', false)];
    await boot();
    await rtl.fireEvent.changeText(rtl.screen.getByTestId('chat-composer-input'), 'Ready when you are');
    await rtl.fireEvent.press(rtl.screen.getByTestId('chat-composer-send'));
    await rtl.screen.findByText('Ready when you are');
    expect(hub.sentTexts).toHaveLength(1);
    expect(hub.sentTexts[0].clientMessageId).toMatch(/^[A-Za-z0-9_-]{8,64}$/);
  });

  it('an answer that never comes is followed by the SAME message id, and it is posted once', async () => {
    hub.textMode = 'lost_after';
    hub.messages = [textMessage('Hi', false)];
    await boot();
    await rtl.fireEvent.changeText(rtl.screen.getByTestId('chat-composer-input'), 'Lost then found');
    await rtl.fireEvent.press(rtl.screen.getByTestId('chat-composer-send'));
    await rtl.screen.findByText('Try again');
    expect(hub.messages.filter((m) => m.text === 'Lost then found')).toHaveLength(1);
    const entryId = rtl.screen.getAllByTestId(/^bubble-local-\d+-retry$/)[0];
    await rtl.fireEvent.press(entryId);
    await rtl.waitFor(() => expect(hub.sentTexts).toHaveLength(2));
    expect(hub.sentTexts[1].clientMessageId).toBe(hub.sentTexts[0].clientMessageId);
    expect(hub.messages.filter((m) => m.text === 'Lost then found')).toHaveLength(1);
  });

  it('shows no composer where nobody can write, and says so', async () => {
    hub.canMessage = false;
    hub.messages = [textMessage('Hi', false)];
    await renderWith(<ChatScreen chatId={CHAT} {...handlers()} />);
    expect(await rtl.screen.findByTestId('chat-closed')).toBeTruthy();
    expect(rtl.screen.queryByTestId('chat-composer-input')).toBeNull();
  });
});

describe('I13: Add to chat', () => {
  it('the + opens the sheet with Send money and Request money, and nothing the app cannot do yet', async () => {
    hub.messages = [textMessage('Hi', false)];
    const h = await boot();
    await rtl.fireEvent.press(rtl.screen.getByTestId('chat-plus'));
    expect(await rtl.screen.findByText('Add to chat')).toBeTruthy();
    expect(rtl.screen.getByText('From your Naira wallet')).toBeTruthy();
    expect(rtl.screen.getByText('Femi pays from their wallet')).toBeTruthy();
    expect(rtl.screen.queryByText('Photo or video')).toBeNull();
    expect(rtl.screen.queryByText('File')).toBeNull();
    expect(rtl.screen.queryByText(/instant/)).toBeNull();
    await rtl.fireEvent.press(rtl.screen.getByTestId('attach-send-money'));
    expect(h.onSendMoney).toHaveBeenCalledWith(expect.objectContaining({ wawuId: OTHER, name: 'Femi Bankole' }));
  });
});

describe('I16 and I17: asking for money', () => {
  async function openRequest() {
    hub.messages = [textMessage('Hi', false)];
    const h = await boot();
    await rtl.fireEvent.press(rtl.screen.getByTestId('chat-plus'));
    await rtl.fireEvent.press(await rtl.screen.findByTestId('attach-request-money'));
    await rtl.screen.findByText('Request from Femi');
    return h;
  }
  const fill = async () => {
    await rtl.fireEvent.changeText(rtl.screen.getByTestId('request-amount'), '12000');
    await rtl.fireEvent.changeText(rtl.screen.getByTestId('request-memo'), 'Logo edits, round 2');
  };

  it('a user enters an amount and what it is for, taps Request, and the bubble waits for the other person', async () => {
    await openRequest();
    expect(rtl.screen.getByText('Femi gets a request in this chat and pays from their wallet. Nothing moves until they tap Pay.')).toBeTruthy();
    expect(rtl.screen.getByTestId('request-send').props.accessibilityState.disabled).toBe(true);
    await fill();
    expect(rtl.screen.getByTestId('request-amount').props.value).toBe('₦12,000');
    expect((rtl.screen.getByTestId('request-send').props.accessibilityLabel ?? '') + rtl.screen.getByText('Request ₦12,000').props.children).toContain('Request ₦12,000');
    await rtl.fireEvent.press(rtl.screen.getByTestId('request-send'));
    await rtl.screen.findByText('You requested');
    expect(hub.requests).toHaveLength(1);
    expect(hub.requests[0].body).toMatchObject({ amountKobo: 1_200_000, memo: 'Logo edits, round 2' });
    expect(rtl.screen.getByText('Waiting for Femi')).toBeTruthy();
  });

  it('an answer that never comes is followed by the SAME request id, so it is asked once', async () => {
    hub.requestMode = 'lost_before';
    await openRequest();
    await fill();
    await rtl.fireEvent.press(rtl.screen.getByTestId('request-send'));
    await rtl.screen.findByTestId('request-error');
    await rtl.fireEvent.press(rtl.screen.getByTestId('request-send'));
    await rtl.screen.findByText('You requested');
    expect(hub.requests).toHaveLength(2);
    expect(hub.requests[1].body.clientRequestId).toBe(hub.requests[0].body.clientRequestId);
  });

  it('a person with no wallet is led to Open your wallet', async () => {
    hub.requestMode = 'no_wallet';
    const h = await openRequest();
    await fill();
    await rtl.fireEvent.press(rtl.screen.getByTestId('request-send'));
    await rtl.waitFor(() => expect(h.onOpenWallet).toHaveBeenCalledTimes(1));
  });
});

describe('I18 and I19: a request someone made of the person', () => {
  async function bootIncoming(h = handlers()) {
    hub.messages = [requestMessage('incoming', { createdAt: '2026-10-16T16:21:00.000Z' }), textMessage('Round 2 of the logo edits is done.', false, '2026-10-16T16:20:00.000Z')];
    await boot(h);
    await rtl.screen.findByTestId(`request-${REQUEST_ID}-pay`);
    return h;
  }
  const tapPay = async () => rtl.fireEvent.press(rtl.screen.getByTestId(`request-${REQUEST_ID}-pay`));
  const reachPin = async () => {
    await tapPay();
    await rtl.screen.findByTestId('wallet-balance');
    await rtl.fireEvent.press(await rtl.screen.findByTestId('request-pay'));
    await rtl.screen.findByText(/^Approve /);
  };

  it('a user sees Decline and Pay on the request, and the review shows the bank charge, WAWU\'s fee, the total and what the other gets', async () => {
    await bootIncoming();
    expect(rtl.screen.getByText('Requested from you')).toBeTruthy();
    expect(rtl.screen.getByText('Decline')).toBeTruthy();
    expect(rtl.screen.getByText('Pay ₦12,000')).toBeTruthy();
    await tapPay();
    await rtl.screen.findByTestId('request-pay-sheet');
    expect(rtl.screen.getByText('Bank charge')).toBeTruthy();
    expect(rtl.screen.getByText('WAWU’s fee')).toBeTruthy();
    expect(rtl.screen.queryByText(/Fintava/)).toBeNull();
    expect(rtl.screen.getByLabelText('25 naira 75 kobo')).toBeTruthy();
    expect(rtl.screen.getByLabelText('12,025 naira 75 kobo')).toBeTruthy();
    expect(rtl.screen.getByTestId('request-gets').props.children).toBe('Femi gets ₦12,000');
    expect(rtl.screen.getByText('Pay ₦12,025.75')).toBeTruthy();
  });

  it('a user pays with the PIN: one payment, and the bubble flips to Paid', async () => {
    await bootIncoming();
    await reachPin();
    await enterPin('4829');
    await rtl.screen.findByTestId(`request-${REQUEST_ID}-state`);
    expect(rtl.screen.getByText('Paid')).toBeTruthy();
    expect(hub.payments).toBe(1);
    expect(hub.pays).toHaveLength(1);
    expect(hub.pays[0].pin).toBe('4829');
    expect(hub.pays[0].key).toBeTruthy();
    expect(hub.pays[0].body).toMatchObject({ expectedTotalKobo: 1_202_575 });
  });

  it('Decline says no: the bubble shows Declined and nothing is paid', async () => {
    await bootIncoming();
    await rtl.fireEvent.press(rtl.screen.getByTestId(`request-${REQUEST_ID}-decline`));
    await rtl.screen.findByText('Declined');
    expect(hub.declines).toBe(1);
    expect(hub.payments).toBe(0);
  });

  it('a double tap on Pay asks for one quote and opens one sheet, and one payment follows', async () => {
    await bootIncoming();
    let release: () => void = () => undefined;
    hub.holdQuote = new Promise<void>((resolve) => {
      release = resolve;
    });
    const button = rtl.screen.getByTestId(`request-${REQUEST_ID}-pay`);
    await rtl.fireEvent.press(button);
    await rtl.fireEvent.press(button);
    release();
    await rtl.screen.findByTestId('request-pay-sheet');
    expect(hub.quotes).toHaveLength(1);
    await rtl.screen.findByTestId('wallet-balance');
    await rtl.fireEvent.press(rtl.screen.getByTestId('request-pay'));
    await rtl.screen.findByText(/^Approve /);
    await enterPin('4829');
    await rtl.screen.findByText('Paid');
    expect(hub.payments).toBe(1);
    expect(hub.pays).toHaveLength(1);
  });

  it('a wrong PIN says so and moves nothing; the right PIN then pays once', async () => {
    hub.wrongFirst = true;
    await bootIncoming();
    await reachPin();
    await enterPin('1111');
    await rtl.screen.findByText(/Wrong PIN/);
    expect(hub.payments).toBe(0);
    await enterPin('4829');
    await rtl.screen.findByText('Paid');
    expect(hub.payments).toBe(1);
  });

  it('a wallet too short is told so with no Add button (Add money is WALLET-05’s, R-47), and nothing is paid', async () => {
    hub.balanceKobo = 50_000;
    await bootIncoming();
    await tapPay();
    await rtl.screen.findByText(/Not enough in your Naira wallet/);
    // The short sheet is headed as the review is: "Pay Femi", not "Request from Femi".
    expect(rtl.screen.getByText('Pay Femi')).toBeTruthy();
    expect(rtl.screen.queryByText('Request from Femi')).toBeNull();
    expect(hub.pays).toHaveLength(0);
    expect(rtl.screen.queryByText(/^Add /)).toBeNull();
    expect(rtl.screen.getByText('Cancel')).toBeTruthy();
  });

  it('an answer that never comes is followed by the SAME request: one debit', async () => {
    hub.mode = 'lost_after';
    await bootIncoming();
    await reachPin();
    await enterPin('4829');
    // The Hub took the payment and its answer was lost: the PIN is asked for again, the screen does not say it failed.
    await rtl.screen.findByText(/^Approve /);
    expect(hub.payments).toBe(1);
    await enterPin('4829');
    await rtl.screen.findByText('Paid');
    expect(hub.payments).toBe(1);
    expect(hub.pays).toHaveLength(2);
    expect(hub.pays[1].key).toBe(hub.pays[0].key);
    expect(hub.pays[1].body).toEqual(hub.pays[0].body);
  });

  it('a request paid by someone else at the same moment says so and charges nothing more', async () => {
    hub.mode = 'paid_elsewhere';
    await bootIncoming();
    await reachPin();
    await enterPin('4829');
    await rtl.screen.findByText('This request was already paid.');
    expect(hub.payments).toBe(0);
    expect(rtl.screen.getByText('Paid')).toBeTruthy();
  });

  it('a request cancelled while it is being paid says so, shows Cancelled and moves nothing', async () => {
    hub.mode = 'not_pending';
    await bootIncoming();
    await reachPin();
    await enterPin('4829');
    await rtl.screen.findByText('This request is no longer open.');
    expect(hub.payments).toBe(0);
    await rtl.screen.findByText('Cancelled');
  });

  it('a payment the provider has not confirmed is read, never paid again, and the bubble flips when it is done', async () => {
    hub.mode = 'pending';
    await bootIncoming();
    await reachPin();
    await enterPin('4829');
    await rtl.screen.findByText('Still confirming');
    expect(hub.payments).toBe(1);
    await rtl.fireEvent.press(await rtl.screen.findByText('Refresh'));
    await rtl.screen.findByText('Paid');
    expect(hub.payments).toBe(1);
    expect(hub.pays).toHaveLength(1);
  });

  it('a payment that fails says why, and the request is still open to pay again', async () => {
    hub.mode = 'failed';
    await bootIncoming();
    await reachPin();
    await enterPin('4829');
    await rtl.screen.findByText('The bank did not take it.');
    expect(rtl.screen.queryByText('Paid')).toBeNull();
  });

  it('the person who asked sees the bubble flip to Paid the moment the Hub says so, live', async () => {
    hub.messages = [requestMessage('outgoing')];
    await boot();
    expect(await rtl.screen.findByText('Waiting for Femi')).toBeTruthy();
    await live({ type: 'money_request.updated', chatId: CHAT, cursor: 'c1', message: requestMessage('outgoing', { moneyRequest: requestView('outgoing', { status: 'paid' }) }) });
    expect(await rtl.screen.findByText('Paid')).toBeTruthy();
    expect(rtl.screen.queryByText('Waiting for Femi')).toBeNull();
  });

  it('a request cancelled by the asker shows Cancelled, live', async () => {
    await bootIncoming();
    await live({ type: 'money_request.updated', chatId: CHAT, cursor: 'c2', message: requestMessage('incoming', { moneyRequest: requestView('incoming', { status: 'cancelled' }) }) });
    expect(await rtl.screen.findByText('Cancelled')).toBeTruthy();
    expect(rtl.screen.queryByTestId(`request-${REQUEST_ID}-pay`)).toBeNull();
  });
});

void ME;
