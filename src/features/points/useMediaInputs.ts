import { useCallback, useEffect, useRef, useState } from 'react';

import { isApiError } from '@/api/errors';
import type { ChosenFile } from '@/features/create/chosen';
import { pickFile } from '@/features/create/pickFile';

import { fetchSpeechQuote, releaseInput, type SpeechQuote, type Voice } from './mediaToolApi';
import { MEDIA_WORDS, photoRefusal, photoRuleOf, speechRefusal, speechRuleOf } from './mediaToolModel';
import { takePhoto } from './photoPick';
import { uploadRecording } from './fileToolApi';
import type { AiTool } from './studioApi';

/** A photo the person chose: where it is (going up, or up), and the `key` the upload gave. `previewUri` is the thumbnail, and the original beside an edited result. */
export type PhotoState = { name: string; bytes: number; previewUri?: string; phase: 'uploading' | 'ready'; share: number; key: string | null };
/** The voice of a Talking photo: a recording going up and being measured, or ready; or one of the person's finished results. */
export type VoiceState =
  | { source: 'file'; name: string; bytes: number; phase: 'uploading' | 'checking' | 'ready'; share: number; audioKey: string | null }
  | { source: 'job'; jobId: string; label: string; phase: 'checking' | 'ready' };
export type Refusal = { title: string; body: string };

/**
 * What the photo row and the voice row of the picture and video tools hold, and what they do (POINTS-14, POINTS-15): pick (library or
 * camera), check against the Hub's rule for the tool, upload to the Hub's folder, and for a voice ask the Hub for its length (the
 * quote). The phone works out no length and states no limit of its own: the rule and the seconds are the Hub's. A photo or recording
 * that is replaced or taken away is released, so the Hub frees the space.
 */
export function useMediaInputs(tool: AiTool, busy: boolean) {
  const photoRule = photoRuleOf(tool);
  const speechRule = speechRuleOf(tool);
  const [photo, setPhoto] = useState<PhotoState | null>(null);
  const [photoRefused, setPhotoRefused] = useState<Refusal | null>(null);
  const [cameraOff, setCameraOff] = useState(false);
  const [voice, setVoice] = useState<VoiceState | null>(null);
  const [speech, setSpeech] = useState<SpeechQuote | null>(null);
  const [voiceRefused, setVoiceRefused] = useState<Refusal | null>(null);
  const photoTurn = useRef(0);
  const voiceTurn = useRef(0);
  const held = useRef({ photo: null as string | null, voice: null as string | null });
  const voiceRef = useRef<VoiceState | null>(null);
  useEffect(() => {
    voiceRef.current = voice;
  });

  // The keys the Hub holds for the person while the screen is open; leaving without running lets them go.
  useEffect(
    () => () => {
      photoTurn.current += 1;
      voiceTurn.current += 1;
    },
    [],
  );

  const takeOffPhoto = useCallback(() => {
    photoTurn.current += 1;
    if (held.current.photo) releaseInput(held.current.photo);
    held.current.photo = null;
    setPhoto(null);
    setPhotoRefused(null);
  }, []);

  const choosePhoto = useCallback(
    async (from: 'library' | 'camera') => {
      if (!photoRule || busy) return;
      const turn = ++photoTurn.current;
      const live = () => photoTurn.current === turn;
      setPhotoRefused(null);
      setCameraOff(false);
      let picked: ChosenFile | null | 'refused';
      try {
        picked = from === 'camera' ? await takePhoto() : await pickFile(photoRule.accepts);
      } catch {
        if (live()) setPhotoRefused({ title: MEDIA_WORDS.photoPickFailedTitle, body: MEDIA_WORDS.photoPickFailedBody });
        return;
      }
      if (picked === 'refused') {
        if (live()) setCameraOff(true);
        return;
      }
      if (!picked || !live()) {
        picked?.discard?.();
        return;
      }
      const refusal = photoRefusal({ contentType: picked.contentType, bytes: picked.blob.size }, photoRule);
      if (refusal) {
        picked.discard?.();
        setPhotoRefused({ title: MEDIA_WORDS.photoRefusedTitle, body: refusal });
        return;
      }
      // Replacing a photo lets the old upload go.
      if (held.current.photo) releaseInput(held.current.photo);
      held.current.photo = null;
      const base = { name: picked.name, bytes: picked.blob.size, previewUri: picked.previewUri };
      setPhoto({ ...base, phase: 'uploading', share: 0, key: null });
      try {
        const up = await uploadRecording(picked, photoRule.folder, (share) => live() && setPhoto((p) => (p && p.phase === 'uploading' ? { ...p, share } : p)));
        if (!live()) {
          releaseInput(up.key);
          return;
        }
        held.current.photo = up.key;
        setPhoto({ ...base, phase: 'ready', share: 1, key: up.key });
      } catch (error) {
        if (!live()) return;
        setPhoto(null);
        setPhotoRefused({ title: MEDIA_WORDS.photoUploadFailedTitle, body: isApiError(error) && error.message ? error.message : MEDIA_WORDS.photoUploadFailedBody });
      }
    },
    [photoRule, busy],
  );

  /** The Hub reads the voice and prices its seconds; a voice it cannot read or that is too long is refused in its own sentence. */
  const quoteVoice = useCallback(async (ask: Voice, turn: number, keep: () => void) => {
    try {
      const quote = await fetchSpeechQuote(ask);
      if (voiceTurn.current !== turn) return;
      if (quote.cap && quote.cap.cap === 'minutes_per_job') {
        setVoice(null);
        setVoiceRefused({ title: MEDIA_WORDS.voiceRefusedTitle, body: quote.cap.message });
        return;
      }
      keep();
      setSpeech(quote);
    } catch (error) {
      if (voiceTurn.current !== turn) return;
      setVoice(null);
      setSpeech(null);
      setVoiceRefused({ title: MEDIA_WORDS.voiceRefusedTitle, body: isApiError(error) && error.message ? error.message : MEDIA_WORDS.voiceFailedBody });
    }
  }, []);

  const chooseRecording = useCallback(async () => {
    if (!speechRule || busy) return;
    const turn = ++voiceTurn.current;
    const live = () => voiceTurn.current === turn;
    setVoiceRefused(null);
    let picked: ChosenFile | null;
    try {
      picked = await pickFile(speechRule.accepts);
    } catch {
      if (live()) setVoiceRefused({ title: MEDIA_WORDS.voiceRefusedTitle, body: MEDIA_WORDS.voiceFailedBody });
      return;
    }
    if (!picked || !live()) {
      picked?.discard?.();
      return;
    }
    const refusal = speechRefusal({ contentType: picked.contentType, bytes: picked.blob.size }, speechRule);
    if (refusal) {
      picked.discard?.();
      setVoiceRefused({ title: MEDIA_WORDS.voiceRefusedTitle, body: refusal });
      return;
    }
    if (held.current.voice) releaseInput(held.current.voice);
    held.current.voice = null;
    setSpeech(null);
    const base = { source: 'file' as const, name: picked.name, bytes: picked.blob.size };
    setVoice({ ...base, phase: 'uploading', share: 0, audioKey: null });
    try {
      const up = await uploadRecording(picked, speechRule.audioFolder, (share) => live() && setVoice((v) => (v && v.source === 'file' && v.phase === 'uploading' ? { ...v, share } : v)));
      if (!live()) {
        releaseInput(up.key);
        return;
      }
      held.current.voice = up.key;
      setVoice({ ...base, phase: 'checking', share: 1, audioKey: up.key });
      await quoteVoice({ audioKey: up.key }, turn, () => setVoice({ ...base, phase: 'ready', share: 1, audioKey: up.key }));
    } catch (error) {
      if (!live()) return;
      setVoice(null);
      setVoiceRefused({ title: MEDIA_WORDS.photoUploadFailedTitle, body: isApiError(error) && error.message ? error.message : MEDIA_WORDS.photoUploadFailedBody });
    }
  }, [speechRule, busy, quoteVoice]);

  const useResult = useCallback(
    async (jobId: string, label: string) => {
      if (busy) return;
      const turn = ++voiceTurn.current;
      setVoiceRefused(null);
      if (held.current.voice) releaseInput(held.current.voice);
      held.current.voice = null;
      setSpeech(null);
      setVoice({ source: 'job', jobId, label, phase: 'checking' });
      await quoteVoice({ sourceJobId: jobId }, turn, () => setVoice({ source: 'job', jobId, label, phase: 'ready' }));
    },
    [busy, quoteVoice],
  );

  const clearVoice = useCallback(() => {
    voiceTurn.current += 1;
    if (held.current.voice) releaseInput(held.current.voice);
    held.current.voice = null;
    setVoice(null);
    setSpeech(null);
    setVoiceRefused(null);
  }, []);

  /**
   * The Hub lets the inputs of a job go when the job settles (the photo, and a recording uploaded for it), so the rows ask again for the
   * next run. A voice that is one of the person's own results is not the job's to remove: it stays, with the length the Hub read.
   */
  const settled = useCallback(() => {
    held.current = { photo: null, voice: null };
    photoTurn.current += 1;
    setPhoto(null);
    if (voiceRef.current?.source !== 'job') {
      voiceTurn.current += 1;
      setVoice(null);
      setSpeech(null);
    }
  }, []);

  /** A job found again after the screen was left: only the chosen keys come back, so the row can say a photo is in. */
  const restore = useCallback((m: { photoKey?: string; audioKey?: string; sourceJobId?: string }) => {
    if (m.photoKey) setPhoto({ name: MEDIA_WORDS.photo, bytes: 0, phase: 'ready', share: 1, key: m.photoKey });
    if (m.audioKey) setVoice({ source: 'file', name: MEDIA_WORDS.voice, bytes: 0, phase: 'ready', share: 1, audioKey: m.audioKey });
    else if (m.sourceJobId) setVoice({ source: 'job', jobId: m.sourceJobId, label: MEDIA_WORDS.voice, phase: 'ready' });
  }, []);

  return { photoRule, speechRule, photo, photoRefused, cameraOff, choosePhoto, takeOffPhoto, voice, speech, voiceRefused, chooseRecording, useResult, clearVoice, settled, restore };
}
