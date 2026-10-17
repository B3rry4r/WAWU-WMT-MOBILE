/* eslint-disable @typescript-eslint/no-require-imports */
import { fireEvent, screen } from '@testing-library/react-native';

import { allowance, hub, installFetch, ok, renderFrame } from '../__helpers__/hub';
import { FORMATS } from '@/features/create/__helpers__/harness';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

installFetch();
const { FormatScreen } = require('@/features/create/FormatScreen') as typeof import('@/features/create/FormatScreen');
const { CreateScreen } = require('@/features/create/CreateScreen') as typeof import('@/features/create/CreateScreen');
const { ReviewScreen } = require('@/features/create/ReviewScreen') as typeof import('@/features/create/ReviewScreen');
const draft = require('@/features/create/draft') as typeof import('@/features/create/draft');

const ALLOWANCE = '/api/hub/uploads/allowance';
const FORMATS_PATH = '/api/hub/uploads/formats';

beforeEach(() => {
  installFetch();
  draft.resetDraft();
  hub.answers[`GET ${FORMATS_PATH}`] = ok(FORMATS);
});

describe('M27 · every upload used (M20 when the Hub says so)', () => {
  const open = async () => {
    const handlers = { back: jest.fn(), next: jest.fn(), library: jest.fn() };
    await renderFrame(<FormatScreen onBack={handlers.back} onContinue={handlers.next} onOpenLibrary={handlers.library} />);
    return handlers;
  };

  it('says the uploads are used with Open library, draws the list faded and cannot be picked, and Continue stays off', async () => {
    hub.answers[`GET ${ALLOWANCE}`] = ok(allowance(5, 5));
    const handlers = await open();
    expect(await screen.findByText('Your 5 free uploads are used')).toBeTruthy();
    expect(screen.getByText('Get verified for up to 25 uploads, or take something down.')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('create-slots-full-library'));
    expect(handlers.library).toHaveBeenCalledTimes(1);
    expect(await screen.findByTestId('format-video')).toBeTruthy();
    expect(screen.getByTestId('format-faded').props.style).toMatchObject({ opacity: 0.45 });
    expect(screen.getByTestId('format-faded').props.pointerEvents).toBe('none');
    expect(screen.getByTestId('create-continue').props.accessibilityState.disabled).toBe(true);
    // The Get verified button waits for ME-12's tiers (R-47).
    expect(screen.queryByRole('button', { name: 'Get verified' })).toBeNull();
  });

  it('is the ordinary format list while there is room, or while the count is not known', async () => {
    hub.answers[`GET ${ALLOWANCE}`] = ok(allowance(4, 5));
    await open();
    expect(await screen.findByTestId('format-video')).toBeTruthy();
    expect(screen.queryByTestId('create-slots-full')).toBeNull();
    expect(screen.getByTestId('format-faded').props.pointerEvents).toBe('auto');
    await fireEvent.press(screen.getByTestId('format-video'));
    expect(screen.getByTestId('create-continue').props.accessibilityState.disabled).toBe(false);
  });

  it('draws no Open library button without a place to open it (the notice on M19 as before)', async () => {
    hub.answers[`GET ${ALLOWANCE}`] = ok(allowance(5, 5));
    await renderFrame(<CreateScreen onClose={jest.fn()} onContent={jest.fn()} onEvent={jest.fn()} onService={jest.fn()} />);
    expect(await screen.findByText('Your 5 free uploads are used')).toBeTruthy();
    expect(screen.queryByTestId('create-slots-full-library')).toBeNull();
  });

  it('opens the library from the note on M19 too', async () => {
    hub.answers[`GET ${ALLOWANCE}`] = ok(allowance(5, 5));
    const library = jest.fn();
    await renderFrame(<CreateScreen onClose={jest.fn()} onContent={jest.fn()} onEvent={jest.fn()} onService={jest.fn()} onOpenLibrary={library} />);
    await fireEvent.press(await screen.findByTestId('create-slots-full-library'));
    expect(library).toHaveBeenCalledTimes(1);
  });
});

describe('M25 · Sent for review', () => {
  it('a user can tap View in library to reach My content, or Done', async () => {
    hub.answers[`GET ${ALLOWANCE}`] = ok(allowance(5, 5));
    const handlers = { done: jest.fn(), library: jest.fn() };
    await renderFrame(<ReviewScreen title="Pricing playbook" onDone={handlers.done} onOpenLibrary={handlers.library} />);
    await fireEvent.press(screen.getByTestId('review-library'));
    await fireEvent.press(screen.getByTestId('review-done'));
    expect(handlers.library).toHaveBeenCalledTimes(1);
    expect(handlers.done).toHaveBeenCalledTimes(1);
    expect(screen.getByText('View in library')).toBeTruthy();
  });

  it('draws only Done when there is nowhere to open the library', async () => {
    hub.answers[`GET ${ALLOWANCE}`] = ok(allowance(5, 5));
    await renderFrame(<ReviewScreen title="Pricing playbook" onDone={jest.fn()} />);
    expect(screen.queryByTestId('review-library')).toBeNull();
    expect(screen.getByTestId('review-done')).toBeTruthy();
  });
});
