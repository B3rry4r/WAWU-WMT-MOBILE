import { failedLine, FAILED_LINE, MONEY_BACK_LINE } from '../enrolModel';

describe('failedLine: what the pay sheet says when a payment the Hub was confirming then failed', () => {
  it('is the Hub’s reason alone when it gave one', () => {
    expect(failedLine('The bank did not take it.')).toBe('The bank did not take it.');
    expect(failedLine('No money left your wallet.')).toBe('No money left your wallet.');
  });

  it('puts a full stop on a reason that has none, and adds nothing of the app’s', () => {
    expect(failedLine('  The bank did not take it  ')).toBe('The bank did not take it.');
  });

  it('is the app’s own two lines only when the Hub gave no reason', () => {
    const own = `${FAILED_LINE} ${MONEY_BACK_LINE}`;
    expect(failedLine(null)).toBe(own);
    expect(failedLine(undefined)).toBe(own);
    expect(failedLine('   ')).toBe(own);
  });
});
