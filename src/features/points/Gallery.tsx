import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';

import { queryClient } from '@/api/query';
import { meKey } from '@/features/profile-edit/api';

import { Tool } from './ToolScreen';
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
const base = { description: '', voices: [] as AiTool['voices'], enabled: true };
const TOOLS: Record<string, AiTool> = {
  image: { ...base, id: 'image', action: 'image_per_use', name: 'Make an image', description: 'Describe a picture and see it.', unit: 'use', costPointsPerUnit: 100, input: { kind: 'image', maxCharacters: 1000, charactersPerUnit: 0, options: { shapes: SHAPES } } },
  'photo-edit': { ...base, id: 'photo-edit', action: 'photo_edit_per_use', name: 'Edit a photo', description: 'Say what to change in your photo.', unit: 'use', costPointsPerUnit: 100, input: { kind: 'image', maxCharacters: 1000, charactersPerUnit: 0, options: { shapes: SHAPES, photo: photo('required') } } },
  video: { ...base, id: 'video', action: 'video_per_sec', name: 'Make a video', description: 'Describe a short clip and watch it.', unit: 'second', costPointsPerUnit: 250, input: { kind: 'video', maxCharacters: 1000, charactersPerUnit: 0, options: { shapes: ['16:9', '9:16'], lengths: [4, 6, 8], photo: photo('optional') } } },
  'talking-photo': { ...base, id: 'talking-photo', action: 'talking_photo_per_sec', name: 'Talking photo', description: 'Make your photo speak with a voice.', unit: 'second', costPointsPerUnit: 200, input: { kind: 'video', maxCharacters: 0, charactersPerUnit: 0, options: { shapes: [], photo: photo('required'), speech: { audioFolder: 'ai/input-audio', accepts: ['audio/mpeg', 'audio/wav'], maxSeconds: 60, fromJob: true } } } },
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
    const result =
      entry.id === 'video' || entry.id === 'talking-photo' ? [out('video', CLIP, 'video/mp4', 'Video')] : entry.id === 'voiceover' ? [out('audio', AUDIO, 'audio/mpeg', 'Voiceover')] : [out('image', PIC, 'image/png', 'Picture')];
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
  return <Tool key={`${entry.id}-${view}-${creator}`} toolId={entry.id} owner={OWNER} tool={entry} balance={1250} onBack={() => router.back()} onBuyPoints={() => router.push('/points-buy')} onLeave={() => router.back()} openJobId={jobId} />;
}
