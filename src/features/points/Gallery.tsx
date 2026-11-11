import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';

import { queryClient } from '@/api/query';
import { meKey } from '@/features/profile-edit/api';

import { CloneVoiceScreen } from './CloneVoiceScreen';
import { ReceptionistScreen } from './ReceptionistScreen';
import { Tool } from './ToolScreen';
import { receptionistKey, savedVoiceKey } from './voiceToolsApi';
import type { AiTool } from './studioApi';
import type { VoiceJob } from './voiceoverApi';
import { voiceJobQuery } from './voiceoverApi';

/**
 * The picture and video tools' screens with canned data, for pictures (POINTS-13 to POINTS-15, owner hard rule 1). Development only
 * (`/dev/studio?tool=image&view=done&creator=1`): a release build leaves the route (`app/dev/studio.tsx` requires this file only under
 * `__DEV__`), so none of these tools' canned text is in the bundle and the tools stay switched off for everyone until the Hub lists
 * them. The Hub's answers to the uploads, quotes and lists are stood in by the picture script (`page.route`), not here.
 */
const OWNER = 'preview';
const ME = { wawuId: 'WAWU-PREVIEW', accountType: 'creator' };

const photo = (use: 'required' | 'optional') => ({ use, folder: 'ai/input-image', accepts: ['image/jpeg', 'image/png', 'image/webp'], maxBytes: 26_214_400 });
const SHAPES = ['1:1', '4:5', '9:16', '16:9'];
const VOICES: AiTool['voices'] = [
  { id: 'ada', name: 'Ada', description: 'Warm and clear' },
  { id: 'tunde', name: 'Tunde', description: 'Deep and calm' },
  { id: 'zara', name: 'Zara', description: 'Bright and quick' },
];
const file = (over: Record<string, unknown>) => ({ folders: { audio: 'ai/input-audio', video: 'ai/input-video' }, accepts: { audio: ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/aac'], video: ['video/mp4', 'video/quicktime'] }, maxBytes: 524_288_000, maxMinutes: 10, languageCode: false, ...over });
const base = { description: '', voices: [] as AiTool['voices'], enabled: true };
const TOOLS: Record<string, AiTool> = {
  image: { ...base, id: 'image', action: 'image_per_use', name: 'Make an image', description: 'Describe a picture and see it.', unit: 'use', costPointsPerUnit: 100, input: { kind: 'image', maxCharacters: 1000, charactersPerUnit: 0, options: { shapes: SHAPES } } },
  'photo-edit': { ...base, id: 'photo-edit', action: 'photo_edit_per_use', name: 'Edit a photo', description: 'Say what to change in your photo.', unit: 'use', costPointsPerUnit: 100, input: { kind: 'image', maxCharacters: 1000, charactersPerUnit: 0, options: { shapes: SHAPES, photo: photo('required') } } },
  video: { ...base, id: 'video', action: 'video_per_sec', name: 'Make a video', description: 'Describe a short clip and watch it.', unit: 'second', costPointsPerUnit: 250, input: { kind: 'video', maxCharacters: 1000, charactersPerUnit: 0, options: { shapes: ['16:9', '9:16'], lengths: [4, 6, 8], photo: photo('optional') } } },
  'talking-photo': { ...base, id: 'talking-photo', action: 'talking_photo_per_sec', name: 'Talking photo', description: 'Make your photo speak with a voice.', unit: 'second', costPointsPerUnit: 200, input: { kind: 'video', maxCharacters: 0, charactersPerUnit: 0, options: { shapes: [], photo: photo('required'), speech: { audioFolder: 'ai/input-audio', accepts: ['audio/mpeg', 'audio/wav'], maxSeconds: 60, fromJob: true } } } },
  'voice-changer': { ...base, id: 'voice-changer', action: 'voice_changer_per_min', name: 'Voice changer', description: 'Say it again in another voice.', unit: 'minute', costPointsPerUnit: 400, voices: VOICES, input: { kind: 'file', maxCharacters: 0, charactersPerUnit: 0, file: file({ only: 'audio', voice: true }) } },
  dialogue: { ...base, id: 'dialogue', action: 'dialogue_per_min', name: 'Dialogue', description: 'Write a scene and hear it in several voices.', unit: 'minute', costPointsPerUnit: 250, voices: VOICES, input: { kind: 'dialogue', maxCharacters: 2000, charactersPerUnit: 900, dialogue: { maxVoices: 10 } } },
  'my-voice': { ...base, id: 'my-voice', action: 'voice_clone_once', name: 'Clone your own voice', description: 'Keep a copy of your voice for your voice tools.', unit: 'use', costPointsPerUnit: 100, input: { kind: 'file', maxCharacters: 0, charactersPerUnit: 0, file: file({ only: 'audio', clone: true, maxSeconds: 180 }) } },
  'video-music': { ...base, id: 'video-music', action: 'video_music_per_track', name: 'Music for a video', description: 'Get music made for your video.', unit: 'track', costPointsPerUnit: 500, input: { kind: 'file', maxCharacters: 0, charactersPerUnit: 0, file: file({ only: 'video', maxSeconds: 120, description: { maxCharacters: 1000 } }) } },
  stems: { ...base, id: 'stems', action: 'stems_per_song', name: 'Split a song', description: 'Pull a song apart into its voice and instruments.', unit: 'use', costPointsPerUnit: 300, input: { kind: 'file', maxCharacters: 0, charactersPerUnit: 0, file: file({ only: 'audio', maxSeconds: 600, parts: [2, 6] }) } },
  audiobook: { ...base, id: 'audiobook', action: 'audiobook_per_min', name: 'Audiobook', description: 'Turn a long text into an audiobook.', unit: 'minute', costPointsPerUnit: 250, voices: VOICES, input: { kind: 'text', maxCharacters: 100000, charactersPerUnit: 900 } },
  podcast: {
    ...base,
    id: 'podcast',
    action: 'podcast_standard',
    name: 'Podcast maker',
    description: 'Turn a text or a web page into a podcast.',
    unit: 'use',
    costPointsPerUnit: 1250,
    voices: VOICES,
    input: {
      kind: 'podcast',
      maxCharacters: 20000,
      charactersPerUnit: 0,
      podcast: {
        modes: ['conversation', 'bulletin'],
        maxVoices: 2,
        durations: [
          { id: 'short', action: 'podcast_short', costPoints: 750 },
          { id: 'standard', action: 'podcast_standard', costPoints: 1250 },
          { id: 'long', action: 'podcast_long', costPoints: 2500 },
        ],
        maxLinkCharacters: 2000,
        languages: [{ code: 'en', name: 'English' }],
      },
    },
  },
  receptionist: { ...base, id: 'receptionist', action: 'receptionist_message', name: 'Receptionist', description: 'Your own agent that answers from what you give it.', unit: 'message', costPointsPerUnit: 20, input: { kind: 'chat', maxCharacters: 2000, charactersPerUnit: 2000 } },
  voiceover: { ...base, id: 'voiceover', action: 'voiceover_per_min', name: 'VoiceOver', description: 'Turn words into a voice.', unit: 'minute', costPointsPerUnit: 250, voices: [{ id: 'tunde', name: 'Tunde', description: 'Warm' }], input: { kind: 'text', maxCharacters: 5000, charactersPerUnit: 1000 } },
} as unknown as Record<string, AiTool>;

const PIC = 'https://preview.test/picture.png';
const CLIP = 'https://preview.test/clip.mp4';
const AUDIO = 'https://preview.test/voice.mp3';

const job = (toolId: string, state: VoiceJob['state'], outputs: VoiceJob['outputs'], cost: number): VoiceJob => ({
  id: `job-${toolId}-${state}`,
  tool: toolId as VoiceJob['tool'],
  state,
  voiceId: '',
  targetLanguage: null,
  characters: 0,
  units: 1,
  costPoints: cost,
  audioUrl: outputs.find((o) => o.kind === 'audio')?.url ?? null,
  outputs,
  message: state === 'failed' ? "That didn't work. No points were taken. Try again." : null,
  saved: false,
  createdAt: new Date().toISOString(),
  finishedAt: state === 'working' ? null : new Date().toISOString(),
});
const out = (kind: 'image' | 'video' | 'audio', url: string, type: string, name: string) => ({ kind, url, contentType: type, bytes: 480_000, name, downloadUrl: `${url}?download=1`, pieceFormat: kind });

export function PointsGallery() {
  const router = useRouter();
  const { tool = 'image', view = 'input', creator = '1' } = useLocalSearchParams<{ tool?: string; view?: string; creator?: string }>();
  const entry = TOOLS[tool] ?? TOOLS.image;
  const jobId = view === 'input' ? undefined : `job-${entry.id}-${view === 'done' ? 'done' : view === 'failed' ? 'failed' : 'working'}`;
  useMemo(() => {
    queryClient.setQueryData(meKey, { ...ME, accountType: creator === '0' ? 'buyer' : 'creator' });
    const audioTools = ['voiceover', 'voice-changer', 'dialogue', 'video-music', 'audiobook', 'podcast'];
    const parts = ['Voice', 'Drums', 'Bass', 'Guitar', 'Piano', 'The rest'].map((name, i) => out('audio', `https://preview.test/part-${i}.mp3`, 'audio/mpeg', name));
    const result =
      entry.id === 'video' || entry.id === 'talking-photo'
        ? [out('video', CLIP, 'video/mp4', 'Video')]
        : entry.id === 'stems'
          ? parts
          : audioTools.includes(entry.id)
            ? [out('audio', AUDIO, 'audio/mpeg', entry.name)]
            : [out('image', PIC, 'image/png', 'Picture')];
    const states: Record<string, VoiceJob> = {
      done: job(entry.id, 'done', result as VoiceJob['outputs'], entry.costPointsPerUnit),
      failed: job(entry.id, 'failed', [], 0),
      working: job(entry.id, 'working', [], entry.costPointsPerUnit),
    };
    for (const state of Object.keys(states)) queryClient.setQueryData(voiceJobQuery(OWNER, states[state].id).queryKey, states[state]);
    // The cost lines the Hub would quote for the sample input (one use, or the chosen seconds).
    for (const units of [1, 4, 6, 8, 12]) {
      queryClient.setQueryData(['points', 'job-quote', OWNER, entry.action, units], {
        action: entry.action,
        title: entry.name,
        per: entry.unit,
        units,
        languages: 1,
        perUnitPoints: entry.costPointsPerUnit,
        costPoints: entry.costPointsPerUnit * units,
        balancePoints: 1250,
        shortfallPoints: 0,
        useWallet: false,
        quoteToken: 'preview-token',
        canRun: true,
        cap: null,
        wallet: null,
        walletNote: null,
      });
    }
  }, [entry, creator]);
  // The Receptionist and the voice clone are screens of their own; the Hub's answers for them are canned here.
  if (entry.id === 'receptionist' || entry.id === 'my-voice') {
    const back = () => router.back();
    if (entry.id === 'my-voice') {
      queryClient.setQueryData(savedVoiceKey(OWNER), {
        available: entry.enabled,
        state: view === 'done' ? 'ready' : view === 'working' ? 'making' : 'none',
        name: view === 'done' ? 'My voice' : null,
        createdAt: null,
        consent: { line: 'I, Ada Obi, agree that my voice may be kept for my own voice tools.' },
        recording: { folder: 'ai/input-audio', accepts: ['audio/mp4'], minSeconds: 10, maxSeconds: 180, maxBytes: 20_971_520 },
      });
      return <CloneVoiceScreen key={view} owner={OWNER} tool={entry} balance={1250} onBack={back} onBuyPoints={() => router.push('/points-buy')} onLeave={back} />;
    }
    const know = (id: string, kind: 'text' | 'url' | 'file', name: string, bytes: number) => ({ id, kind, name, bytes, createdAt: new Date().toISOString() });
    queryClient.setQueryData(receptionistKey(OWNER), {
      available: entry.enabled,
      setUp: view !== 'input',
      details: view === 'input' ? null : { businessName: 'Ada Soaps', offer: 'Handmade soap. Open nine to five, Monday to Saturday.', replyStyle: 'Short and friendly', language: 'en', voiceId: 'ada' },
      knowledge: view === 'input' ? [] : [know('k1', 'text', 'Prices', 420), know('k2', 'url', 'Shop page', 0), know('k3', 'file', 'Delivery policy.pdf', 90_000)],
      limits: { docsMax: 10, docMaxBytes: 5_242_880, textMaxChars: 20000, messageMaxChars: 2000, voiceMaxMinutes: 5, languages: [{ code: 'en', name: 'English' }] },
      voices: [],
    });
    return <ReceptionistScreen key={view} owner={OWNER} tool={entry} balance={1250} onBack={back} onBuyPoints={() => router.push('/points-buy')} onLeave={back} />;
  }
  return <Tool key={`${entry.id}-${view}-${creator}`} toolId={entry.id} owner={OWNER} tool={entry} balance={1250} onBack={() => router.back()} onBuyPoints={() => router.push('/points-buy')} onLeave={() => router.back()} openJobId={jobId} />;
}
