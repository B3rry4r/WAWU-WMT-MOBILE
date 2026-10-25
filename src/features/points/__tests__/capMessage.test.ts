import { capMessage } from '../studioModel';

describe('PT7 · what the limit sheet says', () => {
  it('the daily limit is the board\'s three sentences from the Hub numbers, with thousands separators', () => {
    expect(capMessage({ cap: 'daily', limit: 5000, usedPoints: 5000, message: "That is over today's limit of 5000 points for AI tools." })).toBe(
      "You've used 5,000 points on AI tools today. It resets at midnight. Your points are safe.",
    );
    expect(capMessage({ cap: 'daily', limit: 50000, usedPoints: 49250, message: '' })).toBe("You've used 49,250 points on AI tools today. It resets at midnight. Your points are safe.");
  });

  it('with no count used the limit is the count, and a small count has no separator', () => {
    expect(capMessage({ cap: 'daily', limit: 5000, usedPoints: null, message: '' })).toBe("You've used 5,000 points on AI tools today. It resets at midnight. Your points are safe.");
    expect(capMessage({ cap: 'daily', limit: 500, usedPoints: 500, message: '' })).toBe("You've used 500 points on AI tools today. It resets at midnight. Your points are safe.");
  });

  it('a per-job limit keeps the Hub sentence, with its figures written with separators, and ends with the points line', () => {
    expect(capMessage({ cap: 'characters_per_job', limit: 5000, usedPoints: null, message: 'One job can take up to 5000 characters. This one has 12000.' })).toBe(
      'One job can take up to 5,000 characters. This one has 12,000. Your points are safe.',
    );
    expect(capMessage({ cap: 'minutes_per_job', limit: 30, usedPoints: null, message: 'One job can take up to 30 minutes.' })).toBe('One job can take up to 30 minutes. Your points are safe.');
  });
});
