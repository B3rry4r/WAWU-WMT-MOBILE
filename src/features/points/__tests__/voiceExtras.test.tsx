import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { queryClient } from '@/api/query';
import { ApiError } from '@/api/errors';

import { sampleAddress, setJobSaved, type SavedJob } from '../ownVoiceApi';
import { DraftPicker, OwnVoiceConsent, ResultActions, PreviewPlay } from '../VoiceExtras';
import { EXTRAS_WORDS } from '../voiceoverModel';

/*
 * VoiceOver's four added parts (AITOOLS-07), each as a person meets it: the play button on a voice row, the agreement before "Your voice",
 * PT2b's Save row, and the draft list behind "Use in a product". The Hub is a set of stand-in calls that answer in its shapes.
 */
const mockAudio = jest.fn();
jest.mock('@/features/feed/player', () => ({
  AudioSource: (props: Record<string, unknown>) => {
    mockAudio(props);
    return null;
  },
}));
jest.mock('../ownVoiceApi', () => ({ ...jest.requireActual('../ownVoiceApi'), setJobSaved: jest.fn() }));
jest.mock('@/features/verify/api', () => ({ updateDraft: jest.fn() }));
jest.mock('@/features/me/api', () => ({ draftsKey: ['profile', 'drafts'], fetchDrafts: jest.fn() }));

const { updateDraft } = jest.requireMock('@/features/verify/api') as { updateDraft: jest.Mock };
const { fetchDrafts } = jest.requireMock('@/features/me/api') as { fetchDrafts: jest.Mock };
const saved = setJobSaved as jest.Mock;

const job = (patch: Partial<SavedJob> = {}) => ({ id: 'job-1', saved: false, state: 'done', ...patch }) as SavedJob;
const draft = (id: string, title: string, mediaJobId: string | null = null) => ({ id, title, mediaJobId });
const lastAudio = () => mockAudio.mock.calls.at(-1)?.[0] as { uri: string; playing: boolean };

beforeEach(() => {
  jest.clearAllMocks();
  queryClient.clear();
});

describe('a person plays a voice before choosing it', () => {
  it('taps play and the Hub\'s sample plays from the app\'s API address, taps again and it stops', async () => {
    await render(<PreviewPlay sampleUrl="/api/hub/ai-tools/voices/ada/sample" name="Ada" />);
    expect(lastAudio().playing).toBe(false);
    await fireEvent.press(screen.getByLabelText(EXTRAS_WORDS.playSample('Ada')));
    expect(lastAudio().playing).toBe(true);
    expect(lastAudio().uri).toMatch(/^https?:\/\/.+\/api\/hub\/ai-tools\/voices\/ada\/sample$/);
    await fireEvent.press(screen.getByLabelText(EXTRAS_WORDS.stopSample('Ada')));
    expect(lastAudio().playing).toBe(false);
  });

  it('a sample link that is already a full address is kept as it is', () => {
    expect(sampleAddress('https://audio.test/ada.mp3')).toBe('https://audio.test/ada.mp3');
  });
});

describe('a person agrees before their own voice reads a VoiceOver', () => {
  it('reads the Hub\'s words exactly, agrees, or says not now', async () => {
    const onAgree = jest.fn();
    const onCancel = jest.fn();
    const line = 'I am Ada Obi. I agree that Who Made This? may create an AI version of my voice for my VoiceOver.';
    await render(<OwnVoiceConsent line={line} busy={false} failure={null} onAgree={onAgree} onCancel={onCancel} />);
    expect(screen.getByTestId('own-voice-consent-line').props.children).toBe(line);
    await fireEvent.press(screen.getByTestId('own-voice-agree'));
    expect(onAgree).toHaveBeenCalledTimes(1);
    await fireEvent.press(screen.getByTestId('own-voice-cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('is told why when the Hub refused the agreement', async () => {
    await render(<OwnVoiceConsent line="x" busy={false} failure="Those are not the words we showed you." onAgree={jest.fn()} onCancel={jest.fn()} />);
    expect(screen.getByTestId('own-voice-consent-failure')).toBeTruthy();
    expect(screen.getByText('Those are not the words we showed you.')).toBeTruthy();
  });
});

describe('a person saves a result to their library', () => {
  it('taps Save, sees it saved, taps again and takes it out', async () => {
    saved.mockResolvedValueOnce(job({ saved: true })).mockResolvedValueOnce(job({ saved: false }));
    await render(<ResultActions owner="o1" job={job()} onUse={jest.fn()} />);
    expect(screen.getByText('To your library')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('result-save'));
    await waitFor(() => expect(screen.getByText(EXTRAS_WORDS.savedTitle)).toBeTruthy());
    expect(saved).toHaveBeenLastCalledWith('job-1', true);
    await fireEvent.press(screen.getByTestId('result-save'));
    await waitFor(() => expect(screen.getByText('To your library')).toBeTruthy());
    expect(saved).toHaveBeenLastCalledWith('job-1', false);
  });

  it('a result already saved reads as saved, and a refused save says so and stays unsaved', async () => {
    const { unmount } = await render(<ResultActions owner="o1" job={job({ saved: true })} onUse={jest.fn()} />);
    expect(screen.getByText(EXTRAS_WORDS.savedTitle)).toBeTruthy();
    await unmount();
    saved.mockRejectedValueOnce(new ApiError('unknown', 409, 'Only a finished result can be saved or used.'));
    await render(<ResultActions owner="o1" job={job()} onUse={jest.fn()} />);
    await fireEvent.press(screen.getByTestId('result-save'));
    await waitFor(() => expect(screen.getByTestId('result-save-failure')).toBeTruthy());
    expect(screen.getByText('Only a finished result can be saved or used.')).toBeTruthy();
    expect(screen.getByText('To your library')).toBeTruthy();
  });

  it('taps Use in a product and is taken to the drafts', async () => {
    const onUse = jest.fn();
    await render(<ResultActions owner="o1" job={job()} onUse={onUse} />);
    await fireEvent.press(screen.getByTestId('result-use'));
    expect(onUse).toHaveBeenCalledTimes(1);
  });
});

describe('a person attaches a result to a draft', () => {
  it('picks a draft and the Hub is asked to attach this result to it', async () => {
    fetchDrafts.mockResolvedValue([draft('d1', 'Pricing course'), draft('d2', 'Brand deck', 'older-job')]);
    updateDraft.mockResolvedValue({});
    const onAttached = jest.fn();
    await render(<DraftPicker jobId="job-1" onAttached={onAttached} onCancel={jest.fn()} onStartDraft={jest.fn()} />);
    await waitFor(() => expect(screen.getByTestId('draft-pick-d1')).toBeTruthy());
    expect(screen.getByText(EXTRAS_WORDS.hasAudio)).toBeTruthy();
    await act(async () => {
      await fireEvent.press(screen.getByTestId('draft-pick-d1'));
    });
    expect(updateDraft).toHaveBeenCalledWith('d1', { mediaJobId: 'job-1' });
    expect(onAttached).toHaveBeenCalledWith('Pricing course');
  });

  it('with no drafts is pointed at starting one, and can cancel', async () => {
    fetchDrafts.mockResolvedValue([]);
    const onStart = jest.fn();
    const onCancel = jest.fn();
    await render(<DraftPicker jobId="job-1" onAttached={jest.fn()} onCancel={onCancel} onStartDraft={onStart} />);
    await waitFor(() => expect(screen.getByTestId('draft-picker-empty')).toBeTruthy());
    await fireEvent.press(screen.getByTestId('draft-picker-start'));
    expect(onStart).toHaveBeenCalledTimes(1);
    await fireEvent.press(screen.getByTestId('draft-picker-cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('a draft the Hub refused to attach to says why and attaches nothing', async () => {
    fetchDrafts.mockResolvedValue([draft('d1', 'Pricing course')]);
    updateDraft.mockRejectedValue(new ApiError('unknown', 409, 'Only a finished result with audio can be used in a product.'));
    const onAttached = jest.fn();
    await render(<DraftPicker jobId="job-1" onAttached={onAttached} onCancel={jest.fn()} onStartDraft={jest.fn()} />);
    await waitFor(() => expect(screen.getByTestId('draft-pick-d1')).toBeTruthy());
    await act(async () => {
      await fireEvent.press(screen.getByTestId('draft-pick-d1'));
    });
    expect(screen.getByTestId('draft-picker-failure')).toBeTruthy();
    expect(onAttached).not.toHaveBeenCalled();
  });

  it('drafts that cannot be loaded say so', async () => {
    fetchDrafts.mockRejectedValue(new ApiError('network', 0, 'No connection.'));
    await render(<DraftPicker jobId="job-1" onAttached={jest.fn()} onCancel={jest.fn()} onStartDraft={jest.fn()} />);
    // A lost connection is tried again twice (api/query.ts, one then two seconds) before the banner shows.
    await waitFor(() => expect(screen.getByTestId('draft-picker-error')).toBeTruthy(), { timeout: 8000 });
  });
});
