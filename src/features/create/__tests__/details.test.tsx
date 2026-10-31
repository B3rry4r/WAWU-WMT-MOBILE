/* eslint-disable @typescript-eslint/no-require-imports */
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';

import { LIST, PRICES_PATH, servePrices } from '@/features/prices/__helpers__/prices';

import { allowance, hub, installFetch, ok, refusal, renderFrame } from '../__helpers__/harness';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

installFetch();
const { queryClient: appClient } = require('@/api/query') as typeof import('@/api/query');
const { DetailsScreen } = require('../DetailsScreen') as typeof import('../DetailsScreen');
const { PriceScreen, pieceMeta } = require('../PriceScreen') as typeof import('../PriceScreen');
const { ReviewScreen, usedLine } = require('../ReviewScreen') as typeof import('../ReviewScreen');
const draft = require('../draft') as typeof import('../draft');
const details = require('../details') as typeof import('../details');

const CREATE = '/api/hub/content';
const ALLOWANCE = '/api/hub/uploads/allowance';
const RELEASE = '/api/hub/uploads/release';
const TITLE = 'The Freelancer’s Pricing Playbook';

const created = (title = TITLE) => ({ status: 201, body: { statusCode: 201, message: 'Created', data: { id: 'c1', title, status: 'pending' } } });
const posts = () => hub.sent.filter((s) => s.method === 'POST' && s.path === CREATE);

/** A piece with its full file up, as step 2 leaves it. R-118: nobody uploads a preview, so the draft holds none. */
function haveFiles() {
  draft.setFormat('pdf');
  draft.setFull({ name: 'full.pdf', bytes: 5000, contentType: 'application/pdf', key: 'content/full/u1/f.pdf', fileUrl: 'https://storage.test/content/full/u1/f.pdf?read=1', pages: 84 });
}
const filled = () => details.setDetails({ title: TITLE, description: '84 pages on anchoring your rate.', category: 'business_entrepreneurship' });

beforeEach(() => {
  installFetch();
  draft.resetDraft();
  details.setSent(null);
  appClient.clear();
});

describe('M23 · Details', () => {
  const open = async () => {
    const calls = { back: jest.fn(), next: jest.fn() };
    await renderFrame(<DetailsScreen format="pdf" onBack={calls.back} onContinue={calls.next} />);
    return calls;
  };

  it('a user can enter a title and a description and pick what it is, and Continue waits for all three', async () => {
    const calls = await open();
    expect(screen.getByText('Step 4 of 5')).toBeTruthy();
    const next = () => screen.getByTestId('create-continue');
    expect(next().props.accessibilityState.disabled).toBe(true);

    await fireEvent.changeText(screen.getByTestId('details-title'), `  ${TITLE}`);
    await fireEvent.changeText(screen.getByTestId('details-description'), '84 pages on anchoring your rate.');
    expect(next().props.accessibilityState.disabled).toBe(true);

    await fireEvent.press(screen.getByTestId('details-category'));
    await fireEvent.press(await screen.findByTestId('category-business_entrepreneurship'));
    expect(screen.getByText('Business & Entrepreneurship')).toBeTruthy();
    expect(next().props.accessibilityState.disabled).toBe(false);

    await fireEvent.press(next());
    expect(calls.next).toHaveBeenCalledTimes(1);
    expect(details.getDetails()).toMatchObject({ description: '84 pages on anchoring your rate.', category: 'business_entrepreneurship' });
  });

  // SWEEP-APP-4 row 146: M23 has no "38 / 5000" counter under the description (the board draws none); the box stops at the Hub's limit.
  it('M23 draws no character counter under the description and the box stops at the Hub limit', async () => {
    await open();
    await fireEvent.changeText(screen.getByTestId('details-description'), '84 pages on anchoring your rate.');
    expect(screen.queryByText(/ \/ 5000/)).toBeNull();
    expect(screen.queryByLabelText(/characters/)).toBeNull();
    expect(screen.getByTestId('details-description').props.maxLength).toBe(5000);
  });

  it('lists the 25 categories the Hub takes, ticks the chosen one and lets a person change it', async () => {
    details.setDetails({ category: 'finance' });
    await open();
    await fireEvent.press(screen.getByTestId('details-category'));
    expect(await screen.findByTestId('category-finance')).toBeTruthy();
    expect(screen.getByLabelText('Finance & Financial Services, chosen')).toBeTruthy();
    expect(details.CONTENT_CATEGORIES).toHaveLength(25);
    await fireEvent.press(screen.getByTestId('category-technology'));
    expect(details.getDetails().category).toBe('technology');
  });

  it('keeps what was typed when the person goes back and returns, and a new piece starts blank', async () => {
    await open();
    await fireEvent.changeText(screen.getByTestId('details-title'), 'Half written');
    expect(details.getDetails().title).toBe('Half written');
    await act(async () => draft.abandonDraft());
    expect(details.getDetails()).toMatchObject({ title: '', description: '', category: null, accessType: 'paid', price: '' });
  });

  it('a user can go back', async () => {
    const calls = await open();
    await fireEvent.press(screen.getByLabelText('Back'));
    expect(calls.back).toHaveBeenCalledTimes(1);
  });
});

describe('M24 · Price and M37 · Free piece', () => {
  const open = async () => {
    haveFiles();
    filled();
    servePrices();
    const calls = { back: jest.fn(), sent: jest.fn() };
    await renderFrame(<PriceScreen format="pdf" onBack={calls.back} onSent={calls.sent} />);
    return calls;
  };
  const send = () => screen.getByTestId('create-send');
  /** A user picks a list price from the strip, once the Hub's list has loaded. */
  const pick = async (naira: number) => fireEvent.press(await screen.findByTestId(`price-stop-${naira}`));

  it('a user can pick a price from the list, and Send for review sends the piece with that price, its full file and a request for the Hub to make the preview (R-118)', async () => {
    hub.answers[`POST ${CREATE}`] = created();
    const calls = await open();
    expect(screen.getByText('Step 5 of 5')).toBeTruthy();
    // Lead ruling (PREVIEWS-APP round 1, named test fix): this line asserted `disabled` straight after render and raced the answer of
    // GET /prices, which seeds the list's start price (PriceScreen) and so enables Send. It now waits for the list first.
    expect((await screen.findByTestId('price-stop-2500')).props.accessibilityState.selected).toBe(true);
    await waitFor(() => expect(send().props.accessibilityState.disabled).toBe(false));

    await pick(3000);
    expect(screen.queryByTestId('price-input')).toBeNull();
    expect(screen.getByTestId('price-picker-earn').props.accessibilityLabel).toBe('You earn 2,550 naira a sale');
    expect(send().props.accessibilityState.disabled).toBe(false);
    await fireEvent.press(send());

    await waitFor(() => expect(calls.sent).toHaveBeenCalledTimes(1));
    expect(posts()).toHaveLength(1);
    expect(posts()[0].body).toEqual({
      contentType: 'pdf',
      title: TITLE,
      description: '84 pages on anchoring your rate.',
      category: 'business_entrepreneurship',
      accessType: 'paid',
      price: 3000,
      previewFromFile: true,
      fullAsset: 'https://storage.test/content/full/u1/f.pdf?read=1',
    });
    expect(details.getSent()).toEqual({ title: TITLE });
  });

  it('hands the files to the piece: nothing is given back to the Hub and the draft is empty', async () => {
    hub.answers[`POST ${CREATE}`] = created();
    await open();
    await pick(2500);
    await fireEvent.press(send());
    await waitFor(() => expect(details.getSent()).not.toBeNull());
    expect(hub.sent.filter((s) => s.path === RELEASE)).toEqual([]);
    expect(draft.getDraft()).toEqual({ format: null, full: null, preview: null });
    expect(details.getDetails().title).toBe('');
  });

  it('shows the piece card with its title and what was uploaded, from the files themselves', async () => {
    await open();
    expect(screen.getByTestId('price-piece')).toBeTruthy();
    expect(screen.getByText(TITLE)).toBeTruthy();
    expect(screen.getByText('PDF · 84 pages')).toBeTruthy();
    expect(pieceMeta('video', { name: 'a', bytes: 5 * 1024 * 1024, contentType: 'video/mp4', key: 'k', fileUrl: 'u' })).toBe('Video · 5 MB');
  });

  it('says the review happens, and draws nothing the Hub does not back: no currency picker, presets, share or listing fee', async () => {
    await open();
    expect(screen.getByText('Who Made This? checks every piece before it goes live')).toBeTruthy();
    for (const absent of ['Dollar', 'USDT', 'Buyers abroad see it in dollars', 'You earn per sale', 'Your share', 'Listing fee']) {
      expect(screen.queryByText(new RegExp(absent))).toBeNull();
    }
  });

  it('a user can pick Free (M37), see what it means, and Send for review sends a free piece at 0', async () => {
    hub.answers[`POST ${CREATE}`] = created();
    const calls = await open();
    await pick(5000);
    await fireEvent.press(screen.getByLabelText('Free'));

    expect(screen.getByText('Free for everyone')).toBeTruthy();
    expect(screen.getByText('Anyone can open it. Fans can still tip.')).toBeTruthy();
    expect(screen.getByText('Free pieces count toward your uploads.')).toBeTruthy();
    expect(screen.queryByTestId('price-input')).toBeNull();
    // PREVIEWS-APP (lead brief, rank 5): the piece card is the piece, not the price, so a free piece shows it too (this line asserted it away).
    expect(screen.getByTestId('price-piece')).toBeTruthy();
    expect(screen.queryByTestId('price-note')).toBeNull();
    expect(send().props.accessibilityState.disabled).toBe(false);

    await fireEvent.press(send());
    await waitFor(() => expect(calls.sent).toHaveBeenCalledTimes(1));
    expect(posts()[0].body).toMatchObject({ accessType: 'free', price: 0 });
  });

  it('keeps the picked price when the person flips to Free and back', async () => {
    await open();
    await pick(1500);
    await fireEvent.press(screen.getByLabelText('Free'));
    await fireEvent.press(screen.getByLabelText('Paid'));
    expect((await screen.findByTestId('price-stop-1500')).props.accessibilityState.selected).toBe(true);
    expect(details.getDetails().price).toBe('1500');
  });

  it('starts on 2,500 so there is always a list price to send, and sends only a price that is on the Hub\'s list', async () => {
    hub.answers[`POST ${CREATE}`] = created();
    const calls = await open();
    expect((await screen.findByTestId('price-stop-2500')).props.accessibilityState.selected).toBe(true);
    await waitFor(() => expect(send().props.accessibilityState.disabled).toBe(false));
    expect(details.getDetails().price).toBe('2500');
    await fireEvent.press(send());
    await waitFor(() => expect(calls.sent).toHaveBeenCalledTimes(1));
    expect(LIST).toContain((posts()[0].body as { price: number }).price);
  });

  it('a 400 price_not_on_list (an admin changed the list meanwhile) reads the list again and shows the Hub\'s sentence', async () => {
    const sentence = 'That price is not on the price list. The nearest are ₦2,000 and ₦2,500.';
    hub.answers[`POST ${CREATE}`] = { status: 400, body: { statusCode: 400, message: sentence, data: null, reason: { code: 'price_not_on_list', message: sentence, nearestLowerNaira: 2000, nearestHigherNaira: 2500 } } };
    await open();
    await pick(3000);
    const reads = () => hub.sent.filter((s) => s.method === 'GET' && s.path === PRICES_PATH).length;
    const before = reads();
    await fireEvent.press(send());
    expect(await screen.findByText(sentence)).toBeTruthy();
    await waitFor(() => expect(reads()).toBeGreaterThan(before));
  });

  it('sends once when the button is tapped twice', async () => {
    hub.answers[`POST ${CREATE}`] = 'hang';
    await open();
    await pick(3000);
    await fireEvent.press(send());
    await fireEvent.press(send());
    await act(async () => undefined);
    expect(posts()).toHaveLength(1);
  });

  it('says why in the Hub\'s words when publishing needs a tier, keeps the piece, and lets the person send again', async () => {
    hub.answers[`POST ${CREATE}`] = {
      status: 402,
      body: { statusCode: 402, message: 'Publishing needs a tier. Pick one to send this.', data: null, reason: { code: 'tier_required', message: 'Publishing needs a tier. Pick one to send this.' } },
    };
    const calls = await open();
    await pick(3000);
    await fireEvent.press(send());
    expect(await screen.findByText('Publishing needs a tier. Pick one to send this.')).toBeTruthy();
    expect(calls.sent).not.toHaveBeenCalled();
    expect(details.getSent()).toBeNull();
    expect(draft.getDraft().full).not.toBeNull();
    expect(details.getDetails().title).toBe(TITLE);

    hub.answers[`POST ${CREATE}`] = created();
    await fireEvent.press(send());
    await waitFor(() => expect(calls.sent).toHaveBeenCalledTimes(1));
    expect(posts()).toHaveLength(2);
  });

  it('says it could not send when the Hub cannot be reached, and keeps the piece', async () => {
    hub.answers[`POST ${CREATE}`] = 'offline';
    const calls = await open();
    await pick(3000);
    await fireEvent.press(send());
    expect(await screen.findByTestId('price-failure')).toBeTruthy();
    expect(calls.sent).not.toHaveBeenCalled();
    expect(send().props.accessibilityState.disabled).toBe(false);
  });

  it('shows a refusal of the details in the Hub\'s words (a 400)', async () => {
    hub.answers[`POST ${CREATE}`] = refusal(400, 'Paid content must have a price greater than ₦0.');
    await open();
    await pick(3000);
    await fireEvent.press(send());
    expect(await screen.findByText('Paid content must have a price greater than ₦0.')).toBeTruthy();
  });

  it('a user can go back', async () => {
    const calls = await open();
    await fireEvent.press(screen.getByLabelText('Back'));
    expect(calls.back).toHaveBeenCalledTimes(1);
  });
});

describe('M25 · Sent for review', () => {
  const open = async () => {
    const onDone = jest.fn();
    await renderFrame(<ReviewScreen title={TITLE} onDone={onDone} />);
    return onDone;
  };

  it('names the piece, counts it against the uploads from the Hub, and says it will tell the person when it goes live', async () => {
    hub.answers[`GET ${ALLOWANCE}`] = ok(allowance(5, 5));
    await open();
    expect(screen.getByText('Sent for review')).toBeTruthy();
    expect(screen.getByText(TITLE)).toBeTruthy();
    expect(await screen.findByText('5 of 5 free used')).toBeTruthy();
    expect(screen.getByText("We'll tell you")).toBeTruthy();
    expect(screen.getByText('When it goes live')).toBeTruthy();
    expect(screen.getByText('You can edit it while it waits. It goes live on its own once approved.')).toBeTruthy();
  });

  it('drops the word free once the account holds a tick, with the limit the Hub gives it', async () => {
    hub.answers[`GET ${ALLOWANCE}`] = ok(allowance(6, 25, true));
    await open();
    expect(await screen.findByText('6 of 25 used')).toBeTruthy();
    expect(usedLine(allowance(6, 25, true))).toBe('6 of 25 used');
    // A tier holder is not on the free allowance: the word is not said to them.
    expect(usedLine(allowance(7, 7))).toBe('7 of 7 used');
  });

  it('leaves the uploads line out while the Hub has not said, and does not draw a review time or a library link', async () => {
    hub.answers[`GET ${ALLOWANCE}`] = 'hang';
    await open();
    expect(screen.queryByTestId('review-uploads')).toBeNull();
    expect(screen.queryByText('Usually takes')).toBeNull();
    expect(screen.queryByText('A few hours')).toBeNull();
    expect(screen.queryByText('View in library')).toBeNull();
  });

  it('a user can tap Done', async () => {
    hub.answers[`GET ${ALLOWANCE}`] = ok(allowance(5, 5));
    const onDone = await open();
    await fireEvent.press(screen.getByTestId('review-done'));
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
