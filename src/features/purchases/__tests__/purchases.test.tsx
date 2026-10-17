/* eslint-disable @typescript-eslint/no-require-imports */
import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { calls, hub, installFetch, ok, renderFrame, type Sent } from '../../library/__helpers__/hub';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

installFetch();
const { PurchasesScreen } = require('../PurchasesScreen') as typeof import('../PurchasesScreen');

const LIST = '/api/hub/me/purchases';
const creator = (name: string | null, handle: string | null) => ({ wawuId: `w-${handle}`, displayName: name, handle, avatarUrl: null, verification: { creator: { verified: false, expiresAt: null }, professional: { verified: false, expiresAt: null } } });
const entry = (id: string, title: string, contentType: string, who: [string | null, string | null], purchasedAt: string, lessons: { total: number; done: number } | null = null, thumbnailUrl: string | null = null) => ({
  id,
  purchasedAt,
  content: { id: `c-${id}`, title, contentType, thumbnailUrl, creator: creator(who[0], who[1]) },
  lessons,
});
const year = new Date().getFullYear();
const four = [
  entry('p1', 'How I built a ₦2M a month agency', 'video', ['Chidi Eze', 'chidi'], `${year}-02-26T10:00:00.000Z`),
  entry('p2', 'The Freelancer’s Pricing Playbook', 'pdf', ['Kemi Okafor', 'kemi'], `${year}-02-21T10:00:00.000Z`),
  entry('p3', 'VFX for Beginners', 'course', ['Tife Adeola', 'tife'], `${year}-02-10T10:00:00.000Z`, { total: 12, done: 3 }),
  entry('p4', 'Golden Hour presets', 'template', [null, 'amaka'], '2020-08-14T10:00:00.000Z'),
];
const page = (items: unknown[], nextCursor: string | null = null) => ok({ items, nextCursor });

const open = async () => {
  const back = jest.fn();
  const view = await renderFrame(<PurchasesScreen onBack={back} />);
  return { back, ...view };
};

beforeEach(() => {
  installFetch();
  hub.answers[`GET ${LIST}`] = page(four);
});

describe('M29 · My purchases', () => {
  it('a user sees each piece they bought with its creator, type and date, and a course says how far they are', async () => {
    await open();
    expect(await screen.findByText('How I built a ₦2M a month agency')).toBeTruthy();
    expect(screen.getByText('Chidi Eze · Video · 26 Feb')).toBeTruthy();
    expect(screen.getByText('Kemi Okafor · PDF · 21 Feb')).toBeTruthy();
    // A course shows the Hub's count in the date's place.
    expect(screen.getByText('Tife Adeola · Course · 3 of 12 done')).toBeTruthy();
    // No display name: the handle. A date from another year carries the year.
    expect(screen.getByText('@amaka · Template · 14 Aug 2020')).toBeTruthy();
    expect(screen.getByLabelText('Search what you\'ve bought')).toBeTruthy();
  });

  it('draws no Watch, Read, Resume or Download until HOME-03 builds the piece they open (R-47)', async () => {
    await open();
    await screen.findByText('VFX for Beginners');
    for (const name of ['Watch', 'Read', 'Resume', 'Download']) expect(screen.queryByRole('button', { name })).toBeNull();
  });

  it('asks the Hub for the first page with no search and no cursor, and the next page with the cursor it gave', async () => {
    hub.answers[`GET ${LIST}`] = (sent: Sent) => (/cursor=c2/.test(sent.search) ? page([entry('p9', 'Second page piece', 'audio', ['Ada', 'ada'], `${year}-01-05T10:00:00.000Z`)]) : page(four, 'c2'));
    await open();
    await screen.findByText('VFX for Beginners');
    expect(calls('GET', LIST)[0].search).not.toMatch(/q=|cursor=/);
    await fireEvent.scroll(screen.getByTestId('purchases-screen-scroll'), { nativeEvent: { contentOffset: { y: 400 }, contentSize: { height: 900 }, layoutMeasurement: { height: 800 } } });
    expect(await screen.findByText('Second page piece')).toBeTruthy();
    expect(screen.getByText('Tife Adeola · Course · 3 of 12 done')).toBeTruthy();
    expect(calls('GET', LIST)).toHaveLength(2);
  });

  it('searches on the Hub from two characters, never for one, and says so when nothing matches', async () => {
    hub.answers[`GET ${LIST}`] = (sent: Sent) => (/q=zz/.test(sent.search) ? page([]) : /q=vfx/.test(sent.search) ? page([four[2]]) : page(four));
    await open();
    await screen.findByText('Golden Hour presets');
    await fireEvent.changeText(screen.getByTestId('purchases-search'), 'v');
    await new Promise((resolve) => setTimeout(resolve, 600));
    expect(calls('GET', LIST)).toHaveLength(1);
    await fireEvent.changeText(screen.getByTestId('purchases-search'), '  vfx ');
    await waitFor(() => expect(screen.queryByText('Golden Hour presets')).toBeNull(), { timeout: 3000 });
    expect(await screen.findByText('VFX for Beginners')).toBeTruthy();
    expect(calls('GET', LIST).at(-1)?.search).toContain('q=vfx');
    await fireEvent.changeText(screen.getByTestId('purchases-search'), 'zz');
    expect(await screen.findByText('No match', {}, { timeout: 3000 })).toBeTruthy();
    expect(screen.getByText('Nothing you bought matches “zz”.')).toBeTruthy();
  });

  it('says nothing is bought yet when the Hub lists nothing', async () => {
    hub.answers[`GET ${LIST}`] = page([]);
    await open();
    expect(await screen.findByText('Nothing bought yet')).toBeTruthy();
    expect(screen.getByText('Pieces you unlock show up here.')).toBeTruthy();
  });

  it('shows the Hub\'s refusal with Try again, and the list once it answers', async () => {
    hub.answers[`GET ${LIST}`] = { status: 500, body: { statusCode: 500, message: 'Something went wrong on our side.', data: null } };
    await open();
    expect(await screen.findByText("Couldn't load your purchases")).toBeTruthy();
    hub.answers[`GET ${LIST}`] = page(four);
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('VFX for Beginners')).toBeTruthy();
  });

  it('refuses an answer that is not a page of purchases instead of showing a blank list', async () => {
    hub.answers[`GET ${LIST}`] = ok({ items: [{ id: 'x' }], nextCursor: null });
    await open();
    expect(await screen.findByText("Couldn't load your purchases")).toBeTruthy();
    expect(screen.getByText('Your purchases could not be read. Try again.')).toBeTruthy();
  });

  it('keeps the rows and offers to try again when the next page fails', async () => {
    hub.answers[`GET ${LIST}`] = (sent: Sent) => (/cursor=c2/.test(sent.search) ? 'offline' : page(four, 'c2'));
    await open();
    await screen.findByText('VFX for Beginners');
    await fireEvent.scroll(screen.getByTestId('purchases-screen-scroll'), { nativeEvent: { contentOffset: { y: 400 }, contentSize: { height: 900 }, layoutMeasurement: { height: 800 } } });
    expect(await screen.findByTestId('purchases-more-retry')).toBeTruthy();
    expect(screen.getByText('VFX for Beginners')).toBeTruthy();
  });
});
