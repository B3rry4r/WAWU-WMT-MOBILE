import * as rtl from '@testing-library/react-native';

import type { InboxItem } from '@/features/inbox/api';
import { drawableRows, inboxRowRenderers } from '@/features/inbox/rows';

import { drawsPaidFanRow, PaidFanRow } from '../PaidFanRow';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));

const person = { wawuId: 'c1', name: 'Chidi Eze', handle: 'chidi', avatarUrl: null, verification: { creator: { verified: true, expiresAt: null }, professional: { verified: false, expiresAt: null } } };
const item = (over: Partial<NonNullable<InboxItem['paidDm']>> = {}, top: Partial<InboxItem> = {}): InboxItem =>
  ({
    id: 'p1',
    kind: 'paid_dm',
    lastActivityAt: '2026-10-17T09:51:00.000Z',
    unreadCount: 1,
    preview: { text: 'Thanks, that helps', mine: true, attachment: null, moneyRequest: null },
    chat: null,
    paidDm: { side: 'fan', other: person, questionCount: 1, waitingCount: 1, nextDeadlineAt: new Date(Date.now() + 18.5 * 3_600_000).toISOString(), ...over },
    community: null,
    moneyRequest: null,
    ...top,
  }) as unknown as InboxItem;

describe('a fan\'s paid question in the Inbox (I1)', () => {
  beforeEach(() => mockPush.mockClear());

  it('draws "Paid DM · 18h left to reply" while one waits, and opens the thread', async () => {
    await rtl.render(<PaidFanRow item={item()} />);
    expect(await rtl.screen.findByText('Paid DM · 18h left to reply')).toBeTruthy();
    expect(rtl.screen.getByText('Chidi Eze')).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getByTestId('row-p1'));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/paid-thread/[wawuId]', params: { wawuId: 'c1' } });
  });

  it('says the last words once nothing waits', async () => {
    await rtl.render(<PaidFanRow item={item({ waitingCount: 0, nextDeadlineAt: null })} />);
    expect(await rtl.screen.findByText('You: Thanks, that helps')).toBeTruthy();
  });

  it('draws the fan\'s side beside INBOX-18\'s creator side, and a row with no side stays undrawn (R-47)', () => {
    expect(drawsPaidFanRow(item())).toBe(true);
    expect(drawsPaidFanRow(item({ side: 'creator' }))).toBe(false);
    const rows = drawableRows([item(), item({ side: 'creator' }, { id: 'p2' }), item({}, { id: 'p3', paidDm: null })], inboxRowRenderers);
    expect(rows.map((r) => r.id)).toEqual(['p1', 'p2']);
  });
});
