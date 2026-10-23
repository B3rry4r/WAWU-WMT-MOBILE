import { sendableRoomLink } from '@/lib/appLinks';

/** SWEEP-FLOWS B12: a community's share line is a full link a person can send (the referral screen's form), never `wawu/c/<slug>`. */
describe('sendableRoomLink', () => {
  it('turns the Hub\'s room link into the website address the app opens', () => {
    expect(sendableRoomLink('wawu/c/lagos-photographers')).toBe('https://wawuafrica.com/c/lagos-photographers');
    expect(sendableRoomLink('  wawu/c/Lagos-Photographers/ ')).toBe('https://wawuafrica.com/c/lagos-photographers');
  });
  it('leaves a full address as it came', () => {
    expect(sendableRoomLink('https://wawuafrica.com/c/abc')).toBe('https://wawuafrica.com/c/abc');
  });
  it('leaves a link that names no room as it came', () => {
    expect(sendableRoomLink('wawu/x/abc')).toBe('wawu/x/abc');
  });
});
