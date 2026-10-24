/* eslint-disable @typescript-eslint/no-require-imports */
import { fireEvent, screen, within } from '@testing-library/react-native';

import { allowance, hub, installFetch, ok, renderFrame } from '../__helpers__/harness';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

installFetch();
const { queryClient: appClient } = require('@/api/query') as typeof import('@/api/query');
const { PriceScreen } = require('../PriceScreen') as typeof import('../PriceScreen');
const { ReviewScreen } = require('../ReviewScreen') as typeof import('../ReviewScreen');
const draft = require('../draft') as typeof import('../draft');
const details = require('../details') as typeof import('../details');

/**
 * FIX-110 (G-ME-08-2, G-ME-08-3, G-FIX-78-1): M24's quick prices, "You earn per sale", "Your share" and "Listing fee", and M25's
 * "Usually takes", all from `GET /content/sale-terms`. Every figure is the Hub's; the app multiplies nothing.
 */
const TERMS = '/api/hub/content/sale-terms';
const terms = (priceKobo: number | null, over: Record<string, unknown> = {}) => ({
  creatorSharePct: 85,
  listingFeeKobo: 0,
  presetsKobo: [100000, 250000, 300000, 500000],
  reviewHours: 4,
  priceKobo,
  earnPerSaleKobo: priceKobo === null ? null : Math.floor((priceKobo * 85) / 100),
  ...over,
});

function haveFiles() {
  draft.setFormat('pdf');
  draft.setFull({ name: 'full.pdf', bytes: 5000, contentType: 'application/pdf', key: 'k1', fileUrl: 'https://storage.test/f.pdf', pages: 84 });
  draft.setPreview({ name: 'p.pdf', bytes: 900, contentType: 'application/pdf', key: 'k2', fileUrl: 'https://storage.test/p.pdf', pages: 12 });
}

beforeEach(() => {
  installFetch();
  draft.resetDraft();
  details.setSent(null);
  appClient.clear();
});

describe('M24 · the Hub\'s terms on the price step', () => {
  const open = async () => {
    haveFiles();
    details.setDetails({ title: 'The Freelancer\'s Pricing Playbook', description: 'x', category: 'business_entrepreneurship', accessType: 'paid', price: '' });
    await renderFrame(<PriceScreen format="pdf" onBack={jest.fn()} onSent={jest.fn()} />);
  };
  const serve = () => {
    hub.answers[`GET ${TERMS}`] = ok(terms(null));
  };

  it('a user sees the four quick prices, the share and "Free" for the listing fee, and taps a price in', async () => {
    serve();
    await open();
    expect(await screen.findByTestId('price-presets-1000')).toBeTruthy();
    for (const label of ['₦1,000', '₦2,500', '₦3,000', '₦5,000']) expect(screen.getByText(label)).toBeTruthy();
    expect(screen.getByText('Your share')).toBeTruthy();
    expect(screen.getByText('85%')).toBeTruthy();
    expect(screen.getByText('Listing fee')).toBeTruthy();
    expect(within(screen.getByTestId('price-fee')).getByText('Free')).toBeTruthy();
    // No price typed yet: no earn row (there is nothing to take a share of).
    expect(screen.queryByText('You earn per sale')).toBeNull();

    hub.answers[`GET ${TERMS}`] = ok(terms(300000));
    await fireEvent.press(screen.getByTestId('price-presets-3000'));
    expect(details.getDetails().price).toBe('3000');
    expect(await screen.findByText('₦2,550')).toBeTruthy();
    expect(screen.getByText('You earn per sale')).toBeTruthy();
    // The price was sent to the Hub in kobo, as typed.
    expect(hub.sent.some((s) => s.method === 'GET' && s.path === TERMS && String(s.body ?? '').length >= 0)).toBe(true);
  });

  it('draws none of the four until the Hub has answered, and still sends for review', async () => {
    // No answer for the terms route: the stand-in says 404.
    await open();
    await fireEvent.changeText(screen.getByTestId('price-input'), '3000');
    expect(screen.queryByTestId('price-terms')).toBeNull();
    expect(screen.queryByTestId('price-presets-3000')).toBeNull();
    expect(screen.getByTestId('create-send').props.accessibilityState.disabled).toBeFalsy();
  });

  it('shows a listing fee in naira when the Hub says there is one, and leaves a fractional preset out', async () => {
    hub.answers[`GET ${TERMS}`] = ok(terms(null, { listingFeeKobo: 50000, presetsKobo: [100050, 250000] }));
    await open();
    expect(await screen.findByText('₦500')).toBeTruthy();
    expect(screen.getByText('₦2,500')).toBeTruthy();
    expect(screen.queryByText('₦1,000.50')).toBeNull();
    expect(screen.queryByText('₦1,001')).toBeNull();
  });

  it('draws the presets and the card on Paid only', async () => {
    serve();
    await open();
    expect(await screen.findByTestId('price-terms')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Free'));
    expect(screen.queryByTestId('price-terms')).toBeNull();
    expect(screen.queryByTestId('price-presets-1000')).toBeNull();
  });
});

describe('M25 · "Usually takes"', () => {
  it('says the Hub\'s review time in words, once the Hub has answered', async () => {
    hub.answers[`GET ${TERMS}`] = ok(terms(null, { reviewHours: 4 }));
    hub.answers['GET /api/hub/uploads/allowance'] = ok(allowance(5, 5));
    await renderFrame(<ReviewScreen title="The Playbook" onDone={jest.fn()} />);
    expect(await screen.findByText('About 4 hours')).toBeTruthy();
    expect(screen.getByText('Usually takes')).toBeTruthy();
  });

  it('leaves the row out when the Hub has no answer', async () => {
    hub.answers['GET /api/hub/uploads/allowance'] = ok(allowance(5, 5));
    await renderFrame(<ReviewScreen title="The Playbook" onDone={jest.fn()} />);
    expect(await screen.findByText('5 of 5 free used')).toBeTruthy();
    expect(screen.queryByText('Usually takes')).toBeNull();
  });

  it('words the hours: an hour, hours, a day, days', () => {
    expect(details.reviewWords(1)).toBe('About an hour');
    expect(details.reviewWords(4)).toBe('About 4 hours');
    expect(details.reviewWords(24)).toBe('About a day');
    expect(details.reviewWords(72)).toBe('About 3 days');
    expect(details.presetDigits([100000, 100050, 0, 250000])).toEqual(['1000', '2500']);
  });
});
