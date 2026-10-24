import * as rtl from '@testing-library/react-native';

import type { InboxItem } from '@/features/inbox/api';
import { PaidInboxRow } from '@/features/paid-answers/PaidInboxRow';
import { PaidFanRow } from '@/features/paid-ask/PaidFanRow';

import { ChatInboxRow, MoneyMoveInboxRow, MoneyRequestInboxRow, rowNameOf } from '../ChatInboxRow';

/*
 * SWEEP-APP-8 L1 (FIX-101 F1 follow-up): the Hub gives a person with no name `name: ""`. The Inbox rows used to draw that as a blank line;
 * they now call the person by their @handle, and "Someone" when there is no handle either (as the chat and the feed do).
 */
const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));

const verification = { creator: { verified: false, expiresAt: null }, professional: { verified: false, expiresAt: null } };
const unnamed = (handle: string | null) => ({ wawuId: 'u-new', name: '', handle, avatarUrl: null, verification });

const base = { lastActivityAt: '2026-10-17T09:51:00.000Z', unreadCount: 0, community: null };
const chat = (other: ReturnType<typeof unnamed>): InboxItem =>
  ({ ...base, id: 'chat:c1', kind: 'chat', preview: { text: 'Hello', mine: false, attachment: null, moneyRequest: null }, chat: { chatId: 'c1', other, canMessage: true }, paidDm: null, moneyRequest: null }) as unknown as InboxItem;
const request = (other: ReturnType<typeof unnamed>): InboxItem =>
  ({
    ...base,
    id: 'money_request:r1',
    kind: 'money_request',
    preview: null,
    chat: null,
    paidDm: null,
    moneyRequest: { requestId: 'r1', chatId: 'c1', direction: 'outgoing', other, amountKobo: 1_200_000, memo: 'Logo edits', status: 'paid', paying: false, canMessage: true },
  }) as unknown as InboxItem;
const paid = (other: ReturnType<typeof unnamed>): InboxItem =>
  ({
    ...base,
    id: 'p1',
    kind: 'paid_dm',
    preview: { text: 'Thanks', mine: true, attachment: null, moneyRequest: null },
    chat: null,
    paidDm: { side: 'fan', other, questionCount: 1, waitingCount: 0, nextDeadlineAt: null },
    moneyRequest: null,
  }) as unknown as InboxItem;

const move = (other: ReturnType<typeof unnamed>): InboxItem =>
  ({
    ...base,
    id: 'money_move:t1',
    kind: 'money_move',
    preview: null,
    chat: null,
    paidDm: null,
    moneyRequest: null,
    moneyMove: { transferId: 't1', chatId: 'c1', direction: 'incoming', other, amountKobo: 500_000, note: null, status: 'completed', canMessage: true },
  }) as unknown as InboxItem;
const paidAsked = (other: ReturnType<typeof unnamed>): InboxItem =>
  ({
    ...base,
    id: 'p2',
    kind: 'paid_dm',
    preview: { text: 'Thanks', mine: false, attachment: null, moneyRequest: null },
    chat: null,
    paidDm: { side: 'creator', other, questionCount: 1, waitingCount: 0, nextDeadlineAt: null },
    moneyRequest: null,
  }) as unknown as InboxItem;

describe('an Inbox row for a person with no name', () => {
  it('rowNameOf: the name, else the @handle, else Someone', () => {
    expect(rowNameOf({ name: 'Kemi Okafor', handle: 'kemi' })).toBe('Kemi Okafor');
    expect(rowNameOf({ name: '', handle: 'kemi' })).toBe('@kemi');
    expect(rowNameOf({ name: '   ', handle: '@kemi' })).toBe('@kemi');
    expect(rowNameOf({ name: '', handle: null })).toBe('Someone');
    expect(rowNameOf({ name: '', handle: '  ' })).toBe('Someone');
  });

  it('a chat row draws the @handle, and its avatar the handle\'s first letter (not the @)', async () => {
    await rtl.render(<ChatInboxRow item={chat(unnamed('kemi'))} />);
    expect(await rtl.screen.findByText('@kemi')).toBeTruthy();
    const hidden = { includeHiddenElements: true };
    expect(rtl.within(rtl.screen.getByTestId('row-chat:c1-avatar', hidden)).getByText('K', hidden)).toBeTruthy();
  });

  it('a chat row with no handle draws Someone', async () => {
    await rtl.render(<ChatInboxRow item={chat(unnamed(null))} />);
    expect(await rtl.screen.findByText('Someone')).toBeTruthy();
  });

  it('a money request row draws the @handle, and the line names them by it', async () => {
    await rtl.render(<MoneyRequestInboxRow item={request(unnamed('kemi'))} />);
    expect(await rtl.screen.findByText('@kemi')).toBeTruthy();
    expect(rtl.screen.getByText('@kemi paid ₦12,000 · Logo edits')).toBeTruthy();
  });

  it('a fan\'s paid question row draws the @handle', async () => {
    await rtl.render(<PaidFanRow item={paid(unnamed('kemi'))} />);
    expect(await rtl.screen.findByText('@kemi')).toBeTruthy();
  });

  it('a send between two people draws the @handle, and its avatar the handle\'s first letter (FIX-114)', async () => {
    await rtl.render(<MoneyMoveInboxRow item={move(unnamed('kemi'))} />);
    expect(await rtl.screen.findByText('@kemi')).toBeTruthy();
    const hidden = { includeHiddenElements: true };
    expect(rtl.screen.getByText('K', hidden)).toBeTruthy();
  });

  it('a send with no handle either draws Someone', async () => {
    await rtl.render(<MoneyMoveInboxRow item={move(unnamed(null))} />);
    expect(await rtl.screen.findByText('Someone')).toBeTruthy();
  });

  it('a paid question asked of the person draws the asker\'s @handle (INBOX-18)', async () => {
    await rtl.render(<PaidInboxRow item={paidAsked(unnamed('kemi'))} />);
    expect(await rtl.screen.findByText('@kemi')).toBeTruthy();
    const hidden = { includeHiddenElements: true };
    expect(rtl.screen.getByText('K', hidden)).toBeTruthy();
  });

  it('a paid question from a person with no handle draws Someone', async () => {
    await rtl.render(<PaidInboxRow item={paidAsked(unnamed(null))} />);
    expect(await rtl.screen.findByText('Someone')).toBeTruthy();
  });
});
