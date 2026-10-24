/* eslint-disable @typescript-eslint/no-require-imports */
import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { allowance, calls, hub, installFetch, noContent, ok, piece, refusal, renderFrame } from '../__helpers__/hub';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

installFetch();
const { allowanceKey } = require('@/features/create/api') as typeof import('@/features/create/api');
const { RejectedScreen } = require('../RejectedScreen') as typeof import('../RejectedScreen');
const details = require('@/features/create/details') as typeof import('@/features/create/details');

const REASON = 'Charts on pages 22 to 24 were taken from another publisher. Replace them or credit the source, then send it again.';
const MINE = '/api/hub/content/mine/library/r1';
const RESUBMIT = '/api/hub/content/r1/resubmit';
const REMOVE = '/api/hub/content/r1';
const ALLOWANCE = '/api/hub/uploads/allowance';

const rejected = (over: Record<string, unknown> = {}) =>
  piece({ id: 'r1', title: 'The Freelancer’s Pricing Playbook', contentType: 'pdf', status: 'rejected', salesCount: 0, rejectionReason: REASON, rejectedAt: new Date().toISOString(), ...over });

const open = async () => {
  const handlers = { back: jest.fn(), replace: jest.fn(), edit: jest.fn(), deleted: jest.fn(), sent: jest.fn() };
  const view = await renderFrame(
    <RejectedScreen id="r1" onBack={handlers.back} onReplace={handlers.replace} onEdit={handlers.edit} onDeleted={handlers.deleted} onSent={handlers.sent} />,
  );
  return { ...handlers, ...view };
};

beforeEach(() => {
  installFetch();
  details.setSent(null);
  hub.answers[`GET ${MINE}`] = ok(rejected());
  hub.answers[`GET ${ALLOWANCE}`] = ok(allowance(4, 5));
});

describe('M26 · Rejected', () => {
  it('shows the reviewer’s own reason, the piece with its Rejected mark, and the four ways to fix it', async () => {
    await open();
    expect(await screen.findByText('Not approved')).toBeTruthy();
    expect(screen.getByText(REASON)).toBeTruthy();
    expect(screen.getAllByText('The Freelancer’s Pricing Playbook').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Rejected')).toBeTruthy();
    expect(screen.getByText('Replace the file')).toBeTruthy();
    expect(screen.getByText('Upload a fixed version')).toBeTruthy();
    expect(screen.getByText('Edit details')).toBeTruthy();
    expect(screen.getByText('Delete')).toBeTruthy();
    expect(screen.getByText('Send again')).toBeTruthy();
  });

  it('does not promise a freed slot: the Hub already returned it when the piece was turned down', async () => {
    await open();
    await screen.findByText('Not approved');
    expect(screen.queryByText(/free the slot/i)).toBeNull();
  });

  it('says what to do when the Hub holds no reason, and never invents one', async () => {
    hub.answers[`GET ${MINE}`] = ok(rejected({ rejectionReason: null }));
    await open();
    expect(await screen.findByText('Replace the file or edit the details, then send it again.')).toBeTruthy();
  });

  it('a user can open Replace the file and Edit details', async () => {
    const handlers = await open();
    await fireEvent.press(await screen.findByTestId('rejected-replace'));
    await fireEvent.press(screen.getByTestId('rejected-edit'));
    expect(handlers.replace).toHaveBeenCalledTimes(1);
    expect(handlers.edit).toHaveBeenCalledTimes(1);
  });

  it('a user can Send again: the Hub takes the piece for review, M25 is told its title, and the lists are asked again', async () => {
    hub.answers[`POST ${RESUBMIT}`] = ok(rejected({ status: 'pending', rejectionReason: null }));
    const handlers = await open();
    // The uploads and the library are held by the screens that show them: the Hub's answer marks them out of date.
    handlers.queryClient.setQueryData(allowanceKey, ok(allowance(4, 5)).body.data);
    handlers.queryClient.setQueryData(['library', 'counts'], { all: 6, live: 4, pending: 0, rejected: 2 });
    await fireEvent.press(await screen.findByTestId('rejected-send'));
    await waitFor(() => expect(handlers.sent).toHaveBeenCalledTimes(1));
    expect(calls('POST', RESUBMIT)).toHaveLength(1);
    expect(details.getSent()).toEqual({ title: 'The Freelancer\u2019s Pricing Playbook' });
    expect(handlers.queryClient.getQueryState(allowanceKey)?.isInvalidated).toBe(true);
    expect(handlers.queryClient.getQueryState(['library', 'counts'])?.isInvalidated).toBe(true);
  });

  it('shows the Hub’s own sentence when it refuses to take the piece again, and lets the person try once more', async () => {
    hub.answers[`POST ${RESUBMIT}`] = refusal(402, 'You have used every upload your account allows.', { reason: { code: 'product_limit_reached' } });
    const handlers = await open();
    await fireEvent.press(await screen.findByTestId('rejected-send'));
    expect(await screen.findByText('You have used every upload your account allows.')).toBeTruthy();
    expect(handlers.sent).not.toHaveBeenCalled();
    expect(details.getSent()).toBeNull();
    hub.answers[`POST ${RESUBMIT}`] = ok(rejected({ status: 'pending' }));
    await fireEvent.press(screen.getByTestId('rejected-send'));
    await waitFor(() => expect(handlers.sent).toHaveBeenCalledTimes(1));
    expect(screen.queryByTestId('rejected-failure')).toBeNull();
  });

  it('sends once when the button is pressed twice', async () => {
    // The Hub is slow to answer: both taps land before it does.
    let answer: () => void = () => undefined;
    hub.answers[`POST ${RESUBMIT}`] = new Promise((resolve) => {
      answer = () => resolve(ok(rejected({ status: 'pending' })));
    });
    const handlers = await open();
    const send = await screen.findByTestId('rejected-send');
    await fireEvent.press(send);
    await fireEvent.press(send);
    answer();
    await waitFor(() => expect(handlers.sent).toHaveBeenCalledTimes(1));
    expect(calls('POST', RESUBMIT)).toHaveLength(1);
  });

  it('a user can Delete after being asked: the piece goes, the lists are asked again, and My content opens', async () => {
    hub.answers[`DELETE ${REMOVE}`] = noContent;
    const handlers = await open();
    handlers.queryClient.setQueryData(allowanceKey, ok(allowance(4, 5)).body.data);
    await fireEvent.press(await screen.findByTestId('rejected-delete'));
    expect(await screen.findByText('Delete this piece?')).toBeTruthy();
    expect(calls('DELETE', REMOVE)).toHaveLength(0);
    await fireEvent.press(screen.getByTestId('rejected-delete-confirm'));
    await waitFor(() => expect(handlers.deleted).toHaveBeenCalledTimes(1));
    expect(calls('DELETE', REMOVE)).toHaveLength(1);
    expect(handlers.queryClient.getQueryState(allowanceKey)?.isInvalidated).toBe(true);
  });

  it('keeps the piece when the person says Keep it, and says so when the Hub will not delete', async () => {
    hub.answers[`DELETE ${REMOVE}`] = refusal(409, 'This piece changed while you removed it. Try again.');
    const handlers = await open();
    await fireEvent.press(await screen.findByTestId('rejected-delete'));
    await fireEvent.press(screen.getByTestId('rejected-delete-keep'));
    expect(calls('DELETE', REMOVE)).toHaveLength(0);
    await fireEvent.press(screen.getByTestId('rejected-delete'));
    await fireEvent.press(screen.getByTestId('rejected-delete-confirm'));
    expect(await screen.findByText('This piece changed while you removed it. Try again.')).toBeTruthy();
    expect(handlers.deleted).not.toHaveBeenCalled();
  });

  it('tells a piece that is no longer turned down where it stands, with no way to fix it', async () => {
    hub.answers[`GET ${MINE}`] = ok(rejected({ status: 'pending' }));
    await open();
    expect(await screen.findByText('This piece is in review')).toBeTruthy();
    expect(screen.queryByTestId('rejected-send')).toBeNull();
    expect(screen.queryByTestId('rejected-delete')).toBeNull();
  });

  it('says why the piece did not open, and asks again on Try again', async () => {
    hub.answers[`GET ${MINE}`] = refusal(404, 'Content not found');
    await open();
    expect(await screen.findByTestId('rejected-error')).toBeTruthy();
    expect(screen.getByText('Content not found')).toBeTruthy();
    hub.answers[`GET ${MINE}`] = ok(rejected());
    await fireEvent.press(screen.getByText('Try again'));
    expect(await screen.findByText('Not approved')).toBeTruthy();
  });

  it('shows a loading state while the Hub has not answered', async () => {
    hub.answers[`GET ${MINE}`] = 'hang';
    await open();
    expect(await screen.findByTestId('rejected-loading')).toBeTruthy();
    expect(screen.queryByTestId('rejected-send')).toBeNull();
  });
});
