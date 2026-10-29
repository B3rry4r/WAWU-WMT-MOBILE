import { allowsLoad, checkoutHtml, parseCheckoutMessage } from '../checkoutPage';

const config = { txRef: 'wawu-bill-1', amount: 10000, currency: 'NGN', publicKey: 'FLWPUBK_TEST-abc-X' };

describe('the payment window’s page', () => {
  it('carries the Hub’s own parameters and nothing else of the payment', () => {
    const html = checkoutHtml(config, { email: 'ada@example.com', name: 'Ada Eze', phone: '+2348031234412' }, { title: 'Ikeja Electric', description: 'Prepaid for 04123456789' });
    expect(html).toContain('https://checkout.flutterwave.com/v3.js');
    expect(html).toContain('"publicKey":"FLWPUBK_TEST-abc-X"');
    expect(html).toContain('"txRef":"wawu-bill-1"');
    expect(html).toContain('"amount":10000');
    expect(html).toContain('"currency":"NGN"');
    expect(html).toContain('"email":"ada@example.com"');
    expect(html).toContain("payment_options: 'card,banktransfer,ussd'");
  });

  it('cannot be broken out of by a value that holds markup', () => {
    const html = checkoutHtml(config, { email: 'a@b.co' }, { title: '</script><script>alert(1)</script>', description: 'x\u2028y' });
    expect(html).not.toContain('</script><script>alert(1)');
    expect(html).toContain('\\u003c/script>');
    expect(html).not.toContain('\u2028');
  });

  it('reads the four things the page can say and nothing else', () => {
    expect(parseCheckoutMessage(JSON.stringify({ type: 'callback', status: 'successful', transactionId: '4471' }))).toEqual({ kind: 'paid', transactionId: '4471' });
    expect(parseCheckoutMessage(JSON.stringify({ type: 'callback', status: 'COMPLETED', transactionId: '4471' }))).toEqual({ kind: 'paid', transactionId: '4471' });
    // A success with no transaction id is nothing to verify.
    expect(parseCheckoutMessage(JSON.stringify({ type: 'callback', status: 'successful', transactionId: null }))).toEqual({ kind: 'notConfirmed', transactionId: null });
    expect(parseCheckoutMessage(JSON.stringify({ type: 'callback', status: 'failed', transactionId: '9' }))).toEqual({ kind: 'notConfirmed', transactionId: '9' });
    expect(parseCheckoutMessage(JSON.stringify({ type: 'close' }))).toEqual({ kind: 'closed' });
    expect(parseCheckoutMessage(JSON.stringify({ type: 'unavailable' }))).toEqual({ kind: 'unavailable' });
    expect(parseCheckoutMessage(JSON.stringify({ type: 'something-else' }))).toBeNull();
    expect(parseCheckoutMessage('not json')).toBeNull();
    expect(parseCheckoutMessage('42')).toBeNull();
    expect(parseCheckoutMessage('null')).toBeNull();
  });

  it('lets only https pages load', () => {
    expect(allowsLoad('https://checkout.flutterwave.com/v3/hosted/pay/abc')).toBe(true);
    expect(allowsLoad('about:blank')).toBe(true);
    expect(allowsLoad('http://insecure.example')).toBe(false);
    expect(allowsLoad('intent://pay#Intent;scheme=bank;end')).toBe(false);
    expect(allowsLoad('javascript:alert(1)')).toBe(false);
  });
});
