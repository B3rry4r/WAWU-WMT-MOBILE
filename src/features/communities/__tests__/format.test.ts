import type { CostsByKind } from '../api';
import { chatLine, clockTime, dayKey, dayLabel, firstName, lastLine, memberCostLine, membersFull, membersShort, creditCostLine, outOfCreditsLine, priceLine, rowTime, wawuCredits } from '../format';

const NOW = new Date('2026-10-07T12:00:00');

describe('the time on a row', () => {
  it('is the clock for today, "Yest." for yesterday, the weekday inside a week, then the date', () => {
    expect(rowTime('2026-10-07T09:12:00', NOW)).toBe('09:12');
    expect(rowTime('2026-10-06T23:59:00', NOW)).toBe('Yest.');
    expect(rowTime('2026-10-05T08:00:00', NOW)).toBe('Mon');
    expect(rowTime('2026-10-01T08:00:00', NOW)).toBe('Thu');
    expect(rowTime('2026-09-12T08:00:00', NOW)).toBe('12 Sep');
  });

  it('is empty for a room with no activity or a time nobody can read', () => {
    expect(rowTime(null, NOW)).toBe('');
    expect(rowTime('not a time', NOW)).toBe('');
  });

  it('writes the clock with two digits', () => {
    expect(clockTime('2026-10-07T07:05:00')).toBe('07:05');
  });
});

describe('the day above a run of messages', () => {
  it('says Today, Yesterday, the weekday and then the full date', () => {
    expect(dayLabel('2026-10-07T00:01:00', NOW)).toBe('Today');
    expect(dayLabel('2026-10-06T10:00:00', NOW)).toBe('Yesterday');
    expect(dayLabel('2026-10-03T10:00:00', NOW)).toBe('Sat');
    expect(dayLabel('2026-08-30T10:00:00', NOW)).toBe('30 Aug 2026');
  });

  it('groups messages by the phone\'s own calendar day', () => {
    expect(dayKey('2026-10-07T00:01:00')).toBe(dayKey('2026-10-07T23:59:00'));
    expect(dayKey('2026-10-07T23:59:00')).not.toBe(dayKey('2026-10-08T00:00:00'));
  });
});

describe('head counts and credits', () => {
  it('shortens a head count in the list and writes it in full in the header', () => {
    expect(membersShort(640)).toBe('640 members');
    expect(membersShort(2100)).toBe('2.1K members');
    expect(membersShort(1)).toBe('1 member');
    expect(membersShort(0)).toBe('0 members');
    expect(membersShort(1_200_000)).toBe('1.2M members');
    expect(membersFull(1204)).toBe('1,204 members');
    expect(membersFull(1)).toBe('1 member');
    expect(membersFull(0)).toBe('0 members');
  });

  it('writes WAWU Credits as a count, never as money', () => {
    expect(wawuCredits(48)).toBe('48 WAWU Credits');
    expect(wawuCredits(1)).toBe('1 WAWU Credit');
    expect(wawuCredits(0)).toBe('0 WAWU Credits');
    expect(wawuCredits(1250)).toBe('1,250 WAWU Credits');
    expect(wawuCredits(48)).not.toMatch(/₦|NGN|naira/i);
  });
});

describe('the line under a room\'s name', () => {
  it('names who spoke by first name, or says "You"', () => {
    expect(firstName('Tolu Balogun')).toBe('Tolu');
    expect(lastLine({ text: 'who’s at the meetup Sat?', hasPhoto: false, mine: false, senderName: 'Tolu Balogun' })).toBe('Tolu: who’s at the meetup Sat?');
    expect(lastLine({ text: 'Thanks', hasPhoto: false, mine: true, senderName: 'Ada Obi' })).toBe('You: Thanks');
  });

  it('says "Photo" for a photo with no words, and "No messages yet" for a quiet room', () => {
    expect(lastLine({ text: null, hasPhoto: true, mine: false, senderName: 'Kemi Okafor' })).toBe('Kemi: Photo');
    expect(lastLine({ text: null, hasPhoto: false, mine: false, senderName: null })).toBe('No messages yet');
    expect(lastLine({ text: '   ', hasPhoto: false, mine: false, senderName: 'Kemi' })).toBe('No messages yet');
  });

  it('leaves the name out when the sender has none', () => {
    expect(lastLine({ text: 'hi', hasPhoto: false, mine: false, senderName: null })).toBe('hi');
  });
});

describe('what each kind of message costs, in the Hub\'s words (R-62)', () => {
  const costs = (over: Partial<CostsByKind> = {}): CostsByKind => ({ text: 0, photo: 1, video: 3, voice: 3, ...over });

  it('I24\'s line names the kinds the Hub prices and says chat is free', () => {
    expect(chatLine(costs())).toBe('Chat free · photos, video, voice use credits');
    expect(chatLine(costs({ photo: 0 }))).toBe('Chat free · video, voice use credits');
    expect(chatLine(costs({ photo: 0, video: 0, voice: 0 }))).toBe('Chat free');
  });

  it('I33\'s line says what the Hub prices and that reading is free; the board\'s words only while text costs a credit', () => {
    expect(memberCostLine(costs())).toBe('Chat and reading are free. Credits are for photos, video and voice notes.');
    expect(memberCostLine(costs({ photo: 0 }))).toBe('Chat and reading are free. Credits are for video and voice notes.');
    expect(memberCostLine(costs({ photo: 0, video: 0 }))).toBe('Chat and reading are free. Credits are for voice notes.');
    expect(memberCostLine(costs({ photo: 0, video: 0, voice: 0 }))).toBe('Chat and reading are free.');
    expect(memberCostLine(costs({ text: 1 }))).toBe('Members pay 1 credit a message and reading is free.');
    expect(memberCostLine(costs({ text: 2 }))).toBe('Members pay 2 credits a message and reading is free.');
  });

  it('I28\'s line says what a photo costs and what a video or voice note costs, only for what the Hub prices', () => {
    expect(creditCostLine(costs())).toBe('A photo is 1 credit, a video or voice note 3.');
    expect(creditCostLine(costs({ photo: 2, video: 5, voice: 4 }))).toBe('A photo is 2 credits, a video 5, a voice note 4.');
    expect(creditCostLine(costs({ photo: 0 }))).toBe('A video or voice note 3.');
    expect(creditCostLine(costs({ photo: 0, video: 0, voice: 0 }))).toBeNull();
  });

  it('I38\'s line gives photos their credits and a video and voice note that cost the same one clause', () => {
    expect(priceLine(costs())).toBe('Photos 1 credit · video and voice notes 3');
    expect(priceLine(costs({ photo: 2, video: 5, voice: 4 }))).toBe('Photos 2 credits · video 5 · voice notes 4');
    expect(priceLine(costs({ photo: 0 }))).toBe('Video and voice notes 3');
    expect(priceLine(costs({ photo: 0, video: 0, voice: 0 }))).toBeNull();
  });

  it('I27\'s words list what there is to buy credits for, and nothing when the Hub prices nothing', () => {
    expect(outOfCreditsLine(costs())).toBe('Text and emoji stay free. Buy credits to send photos, video and voice notes.');
    expect(outOfCreditsLine(costs({ video: 0, voice: 0 }))).toBe('Text and emoji stay free. Buy credits to send photos.');
    expect(outOfCreditsLine(costs({ photo: 0, video: 0, voice: 0 }))).toBeNull();
  });

  it('a room\'s last line names a video or a voice note that has no words', () => {
    const base = { text: null, hasPhoto: false, mine: false, senderName: 'Tolu Balogun' };
    expect(lastLine({ ...base, hasVideo: true })).toBe('Tolu: Video');
    expect(lastLine({ ...base, hasVoice: true })).toBe('Tolu: Voice note');
    expect(lastLine({ ...base, hasPhoto: true })).toBe('Tolu: Photo');
  });
});
