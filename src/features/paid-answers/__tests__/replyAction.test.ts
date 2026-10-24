import { actionOf } from '@/features/notifications/model';

const actor = { wawuId: 'fan-bisi' };

describe('Reply on a paid question in Notifications (M31)', () => {
  it('opens the asker\'s conversation, on the question the notice is about', () => {
    expect(actionOf({ kind: 'dm_deadline', target: { kind: 'paid_question', id: 'q1', title: null, deadlineAt: null }, actor })).toEqual({
      label: 'Reply',
      kind: 'route',
      href: { pathname: '/paid-questions/[wawuId]', params: { wawuId: 'fan-bisi', question: 'q1' } },
    });
    expect(actionOf({ kind: 'dm_received', target: null, actor })).toEqual({
      label: 'Reply',
      kind: 'route',
      href: { pathname: '/paid-questions/[wawuId]', params: { wawuId: 'fan-bisi' } },
    });
  });

  it('draws no button when the Hub does not say who asked (R-47)', () => {
    expect(actionOf({ kind: 'dm_deadline', target: null, actor: null })).toBeNull();
    expect(actionOf({ kind: 'dm_received', target: null })).toBeNull();
  });

  it('leaves the other kinds as they were', () => {
    expect(actionOf({ kind: 'credits_low', target: null, actor })).toEqual({ label: 'Top up', kind: 'top-up' });
    expect(actionOf({ kind: 'new_follower', target: null, actor })).toBeNull();
  });
});
