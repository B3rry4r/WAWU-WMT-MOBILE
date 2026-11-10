/* eslint-disable @typescript-eslint/no-require-imports */
import { fireEvent, screen, waitFor, within } from '@testing-library/react-native';

import { servePrices } from '@/features/prices/__helpers__/prices';

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
 * FIX-110: M25's "Usually takes" comes from `GET /content/sale-terms`. M24's quick prices, "Your share" and "Listing fee" were retired
 * by PRICE-PICKER (R-101): the price is picked from `GET /prices` and "You earn" is 85% of the list price (R-5).
 */
const TERMS = '/api/hub/content/sale-terms';
const terms = (priceKobo: number | null, over: Record<string, unknown> = {}) => ({
  creatorSharePct: 85,
  listingFeeKobo: 0,
  presets: [100000, 250000, 300000, 500000].map((priceKobo) => ({ priceKobo })),
  reviewHours: 4,
  priceKobo,
  earnPerSaleKobo: priceKobo === null ? null : Math.floor((priceKobo * 85) / 100),
  ...over,
});

function haveFiles() {
  draft.setFormat('pdf');
  draft.setFull({ name: 'full.pdf', bytes: 5000, contentType: 'application/pdf', key: 'k1', fileUrl: 'https://storage.test/f.pdf', pages: 84 });
}

beforeEach(() => {
  installFetch();
  draft.resetDraft();
  details.setSent(null);
  appClient.clear();
});

describe('M24 · the price step no longer reads the sale terms', () => {
  it('draws the picker from the price list, and draws none of the old quick prices, share or listing fee', async () => {
    servePrices();
    hub.answers[`GET ${TERMS}`] = ok(terms(null));
    haveFiles();
    details.setDetails({ title: 'The Freelancer\'s Pricing Playbook', description: 'x', category: 'business_entrepreneurship', accessType: 'paid', price: '' });
    await renderFrame(<PriceScreen format="pdf" onBack={jest.fn()} onSent={jest.fn()} />);
    expect(await screen.findByTestId('price-stop-2500')).toBeTruthy();
    for (const absent of ['Your share', 'You earn per sale']) expect(screen.queryByText(absent)).toBeNull();
    expect(screen.queryByTestId('price-presets-1000')).toBeNull();
    // The earn figure is the picker's own (85% of the list price); the sale terms are read for the listing fee only.
    expect(await screen.findByTestId('price-fee')).toBeTruthy();
  });

  it('draws the Listing fee as "Free" once the Hub has answered', async () => {
    servePrices();
    hub.answers[`GET ${TERMS}`] = ok(terms(null));
    haveFiles();
    details.setDetails({ title: 'The Playbook', description: 'x', category: 'business_entrepreneurship', accessType: 'paid', price: '' });
    await renderFrame(<PriceScreen format="pdf" onBack={jest.fn()} onSent={jest.fn()} />);
    expect(await screen.findByText('Listing fee')).toBeTruthy();
    expect(within(screen.getByTestId('price-fee')).getByText('Free')).toBeTruthy();
  });

  it('draws the Listing fee in naira when the Hub names one', async () => {
    servePrices();
    hub.answers[`GET ${TERMS}`] = ok(terms(null, { listingFeeKobo: 50000 }));
    haveFiles();
    details.setDetails({ title: 'The Playbook', description: 'x', category: 'business_entrepreneurship', accessType: 'paid', price: '' });
    await renderFrame(<PriceScreen format="pdf" onBack={jest.fn()} onSent={jest.fn()} />);
    expect(await within(await screen.findByTestId('price-fee')).findByText('₦500')).toBeTruthy();
  });

  it('draws no Listing fee until the Hub has answered, and still sends for review', async () => {
    servePrices();
    haveFiles();
    details.setDetails({ title: 'The Playbook', description: 'x', category: 'business_entrepreneurship', accessType: 'paid', price: '' });
    await renderFrame(<PriceScreen format="pdf" onBack={jest.fn()} onSent={jest.fn()} />);
    await screen.findByTestId('price-stop-2500');
    expect(screen.queryByTestId('price-terms')).toBeNull();
    expect(screen.queryByText('Listing fee')).toBeNull();
    await waitFor(() => expect(screen.getByTestId('create-send').props.accessibilityState.disabled).toBeFalsy());
  });

  it('draws the Listing fee on Paid only', async () => {
    servePrices();
    hub.answers[`GET ${TERMS}`] = ok(terms(null));
    haveFiles();
    details.setDetails({ title: 'The Playbook', description: 'x', category: 'business_entrepreneurship', accessType: 'paid', price: '' });
    await renderFrame(<PriceScreen format="pdf" onBack={jest.fn()} onSent={jest.fn()} />);
    expect(await screen.findByTestId('price-fee')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Free'));
    expect(screen.queryByTestId('price-terms')).toBeNull();
  });

  it('draws the picker on Paid only', async () => {
    servePrices();
    haveFiles();
    details.setDetails({ title: 'The Playbook', description: 'x', category: 'business_entrepreneurship', accessType: 'paid', price: '' });
    await renderFrame(<PriceScreen format="pdf" onBack={jest.fn()} onSent={jest.fn()} />);
    expect(await screen.findByTestId('price-picker')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Free'));
    expect(screen.queryByTestId('price-picker')).toBeNull();
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
  });
});
