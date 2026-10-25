import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/client';
import { Button } from '@/components/Button';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { StatusPill } from '@/components/StatusPill';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { AudioSource, type SeekRequest } from '@/features/feed/player';
import { nameOf } from '@/features/me/model';
import { fetchMe, meKey } from '@/features/profile-edit/api';
import { space, useWawu } from '@/theme';

import { ShopFrame } from './parts';
import { fetchMyVoice, previewName, saveNameSpelling, PHONETIC_MAX, voiceKey } from './voiceApi';
import { voiceFailure, voicesUnavailable } from './voiceModel';
import { NameWave, PlayDisc } from './voiceParts';

/** design/_gen/verify.js line 91: the centred block's parts are 18 apart; the foot's two buttons are 10 apart. */
const board = { centreGap: 18, pairGap: 10 } as const;

export type HearNameScreenProps = {
  onBack: () => void;
  /** "Write my Voice Intro" (VF3b's button, shown after "Sounds right" or a saved spelling): on to VF4. */
  onWriteIntro: () => void;
};

type Mode = 'hear' | 'edit' | 'saved';

/** The audio the Hub made, and the spelling it was made from ('' for the plain name), so a spelling that changed is never played from an older clip. */
type Clip = { uri: string; spelling: string };

/**
 * VF3 · Hear your name, VF3a · Phonetic edit and VF3b · Name saved. The person's name (`GET /profile`), said in the studio voice
 * (`POST /me/voice/name-preview`, free), plays as the screen opens. "Sounds right" shows VF3b (Saved, then "Write my Voice Intro", which goes on to VF4); "Not quite right?"
 * opens the spelling field, where "Play again" says the name the way it is spelled and "Save" keeps that spelling (`PUT /me/voice/name`).
 * Voices off on the Hub, the hourly limit on previews and a failed preview each say so in the Hub's own words; a name that cannot be
 * made keeps the disc, which tries again. Nothing here names or calls a voice provider: the Hub makes the audio.
 */
export function HearNameScreen({ onBack, onWriteIntro }: HearNameScreenProps) {
  const { colors } = useWawu();
  const queryClient = useQueryClient();
  const me = useQuery({ queryKey: meKey, queryFn: fetchMe });
  const voice = useQuery({ queryKey: voiceKey, queryFn: fetchMyVoice });
  const plain = me.data ? nameOf(me.data) : '';
  const saved = voice.data?.namePhonetic ?? null;
  const available = voice.data?.available ?? false;

  const [mode, setMode] = useState<Mode>('hear');
  const [spelling, setSpelling] = useState('');
  const [clip, setClip] = useState<Clip | null>(null);
  const [fetching, setFetching] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [off, setOff] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [length, setLength] = useState(0);
  const [seek, setSeek] = useState<SeekRequest>(null);
  const [saving, setSaving] = useState(false);
  const [saveFailure, setSaveFailure] = useState<string | null>(null);
  const [keptSpelling, setKeptSpelling] = useState<string | null>(null);
  // The newest request wins: an answer that arrives after a newer press is dropped.
  const latest = useRef(0);
  const opened = useRef(false);

  const say = useCallback(
    async (spellingToSay: string) => {
      if (!plain) return;
      const mine = ++latest.current;
      setFetching(true);
      setFailure(null);
      setPlaying(false);
      try {
        const preview = await previewName(plain, spellingToSay.trim() || undefined);
        if (mine !== latest.current) return;
        setClip({ uri: preview.audioUrl, spelling: spellingToSay.trim() });
        setPosition(0);
        setSeek({ to: 0, at: Date.now() });
        setPlaying(true);
      } catch (error) {
        if (mine !== latest.current) return;
        if (voicesUnavailable(error)) setOff(true);
        else setFailure(voiceFailure(error));
      } finally {
        if (mine === latest.current) setFetching(false);
      }
    },
    [plain],
  );

  // VF3 plays as it opens: the name, said the way the person last kept it (the plain spelling when they kept none).
  useEffect(() => {
    if (opened.current || !plain || !voice.data || !available) return;
    opened.current = true;
    void say(saved ?? '');
  }, [plain, voice.data, available, saved, say]);

  const onTime = useCallback((at: number, total: number) => {
    setPosition(at);
    setLength(total);
  }, []);
  const onEnded = useCallback(() => {
    setPlaying(false);
    setPosition(0);
    setSeek({ to: 0, at: Date.now() });
  }, []);

  /** The spelling the disc plays: the one being typed in VF3a, the one just kept in VF3b, else the one the person kept before. */
  const current = mode === 'edit' ? spelling.trim() : mode === 'saved' ? (keptSpelling ?? '') : (saved ?? '');
  const press = () => {
    if (fetching) return;
    if (!clip || failure || clip.spelling !== current) {
      void say(current);
      return;
    }
    setPlaying((on) => !on);
  };

  const openEdit = () => {
    setPlaying(false);
    setSaveFailure(null);
    setSpelling(saved ?? plain);
    setMode('edit');
  };

  /** "Sounds right": the name as it stands is the one kept (the spelling saved before, else the plain one), so VF3b shows it with Saved and "Write my Voice Intro". Nothing is sent. */
  const soundsRight = () => {
    setPlaying(false);
    setKeptSpelling(saved ?? '');
    setMode('saved');
    AccessibilityInfo.announceForAccessibility('Saved');
  };

  const save = async () => {
    const value = spelling.trim();
    if (!value || saving) return;
    setSaving(true);
    setSaveFailure(null);
    try {
      const view = await saveNameSpelling(value);
      queryClient.setQueryData(voiceKey, view);
      setKeptSpelling(value);
      setPlaying(false);
      setMode('saved');
      AccessibilityInfo.announceForAccessibility('Saved');
    } catch (error) {
      setSaveFailure(voiceFailure(error));
    } finally {
      setSaving(false);
    }
  };

  const failed = Boolean(failure) && !fetching;
  const title = mode === 'edit' ? spelling.trim() || plain : plain;
  const progress = length > 0 ? position / length : 0;

  const readError = me.error ?? voice.error;
  const body = (() => {
    if ((me.isError && !me.data) || (voice.isError && !voice.data)) {
      return (
        <ErrorState
          testID="hear-name-error"
          title="Your name did not load"
          message={isApiError(readError) ? readError.message : 'Check your connection and try again.'}
          onRetry={() => {
            if (me.isError) void me.refetch();
            if (voice.isError) void voice.refetch();
          }}
        />
      );
    }
    if (!me.data || !voice.data) {
      return (
        <LoadingView label="Loading your name" testID="hear-name-loading">
          <View style={styles.loading}>
            <Skeleton width={84} height={84} radius={42} />
            <Skeleton width={220} height={30} radius={8} />
          </View>
        </LoadingView>
      );
    }
    if (!available || off) {
      return (
        <EmptyState
          testID="hear-name-off"
          icon="AudioLines"
          title="Voices are not available right now"
          message="Hearing your name is switched off for the moment. Try again later."
        />
      );
    }
    if (!plain) {
      return <EmptyState testID="hear-name-noname" icon="UserRound" title="Add your name first" message="Your name is empty on your profile, so there is nothing to say yet." />;
    }
    return (
      <>
        <View style={styles.centre}>
          <PlayDisc testID="hear-name-disc" playing={playing} busy={fetching} failed={failed} onPress={press} label="Play your name" />
          <Text variant="title" accessibilityRole="header" testID="hear-name-name" style={styles.name}>
            {title}
          </Text>
          {mode === 'hear' && playing ? <NameWave testID="hear-name-wave" progress={progress} /> : null}
          {mode === 'saved' ? (
            <View style={styles.pillBox}>
              <StatusPill testID="hear-name-saved" label="Saved" tone="positive" icon="Check" />
            </View>
          ) : failed ? (
            <Text variant="errorLine" accessibilityRole="alert" testID="hear-name-failure" style={styles.centred}>
              {failure}
            </Text>
          ) : (
            <Text variant="muted" style={styles.centred}>
              Said in a studio voice. Free.
            </Text>
          )}
        </View>
        {mode === 'edit' ? (
          <TextField
            testID="hear-name-spelling"
            label="Spell it how it sounds"
            hint="Use hyphens between sounds"
            value={spelling}
            onChangeText={(next) => {
              setSpelling(next);
              setSaveFailure(null);
            }}
            maxLength={PHONETIC_MAX}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            error={saveFailure ?? undefined}
          />
        ) : (
          <Pressable testID="hear-name-wrong" accessibilityRole="button" accessibilityLabel="Not quite right?" onPress={openEdit} hitSlop={space.md} style={styles.wrong}>
            <Text variant="kvValue" tone="accentFg" style={styles.centred}>
              Not quite right?
            </Text>
          </Pressable>
        )}
      </>
    );
  })();

  const ready = Boolean(me.data && voice.data && available && !off && plain);
  const foot = !ready ? undefined : mode === 'edit' ? (
    <View style={styles.pair}>
      <View style={styles.half}>
        <Button testID="hear-name-again" label="Play again" variant="secondary" icon="Play" full disabled={fetching || spelling.trim().length === 0} onPress={() => void say(spelling.trim())} />
      </View>
      <View style={styles.half}>
        <Button testID="hear-name-save" label="Save" full loading={saving} disabled={spelling.trim().length === 0} onPress={() => void save()} />
      </View>
    </View>
  ) : mode === 'saved' ? (
    <Button testID="hear-name-write" label="Write my Voice Intro" full onPress={onWriteIntro} />
  ) : (
    <Button testID="hear-name-right" label="Sounds right" full onPress={soundsRight} />
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.root, { backgroundColor: colors.surfacePage }]}>
      <ShopFrame testID="hear-name-screen" title="Hear your name" onBack={onBack} foot={foot}>
        {clip ? <AudioSource uri={clip.uri} playing={playing} seek={seek} onTime={onTime} onEnded={onEnded} /> : null}
        {body}
      </ShopFrame>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.lg },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: board.centreGap },
  name: { textAlign: 'center' },
  centred: { textAlign: 'center' },
  pillBox: { alignSelf: 'center' },
  wrong: { alignSelf: 'center', minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  pair: { flexDirection: 'row', gap: board.pairGap },
  half: { flex: 1 },
});
