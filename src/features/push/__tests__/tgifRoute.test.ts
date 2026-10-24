import { existsSync } from 'fs';
import { join } from 'path';

import { routeForPush } from '../routes';

describe('where a tap on the morning TGIF notice goes (HOME-16)', () => {
  const tap = (target?: unknown) => routeForPush({ notificationId: 'n1', kind: 'tgif_daily', target });

  it('opens the reader on the day the notice was made for', () => {
    expect(tap({ kind: 'tgif_day', id: '2026-10-17' })).toEqual({ pathname: '/tgif', params: { date: '2026-10-17' } });
  });

  it('opens the reader on today when the notice names no day, or something that is not a day', () => {
    expect(tap()).toBe('/tgif');
    expect(tap({ kind: 'tgif_day' })).toBe('/tgif');
    expect(tap({ kind: 'community', id: '2026-10-17' })).toBe('/tgif');
    for (const id of ['yesterday', '../wallet', '2026-10-17?x=1', '17-10-2026', '2026-10-17T07:00', 20261017, null]) {
      expect(tap({ kind: 'tgif_day', id })).toBe('/tgif');
    }
    expect(tap('2026-10-17')).toBe('/tgif');
  });

  it('never follows the web path the push carries', () => {
    expect(routeForPush({ kind: 'tgif_daily', actionHref: 'https://evil.example/login', target: { kind: 'tgif_day', id: '2026-10-17' } })).toEqual({
      pathname: '/tgif',
      params: { date: '2026-10-17' },
    });
    expect(routeForPush({ kind: 'tgif_daily', actionHref: '/wallet' })).toBe('/tgif');
  });

  it('names a screen that exists', () => {
    expect(existsSync(join(__dirname, '..', '..', '..', 'app', 'tgif.tsx'))).toBe(true);
  });
});
