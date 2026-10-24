import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { AccessibilityInfo, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { BottomSheet } from '@/components/BottomSheet';
import { Text } from '@/components/Text';
import { AuthField } from '@/features/auth/AuthField';
import { Banner } from '@/components/Banner';
import { ScreenFrame } from '@/components/ScreenFrame';

import { createWork, fetchMyWorks, myWorksKey, worksRoot } from './api';
import { PROFILE_FULL, saveFailure, uploadFailure, type SaveFailure } from './failure';
import {
  bodyOf,
  emptyForm,
  hasProblems,
  isComplete,
  isDirty,
  MEDIA_LIBRARY_FAILED,
  mediaHint,
  mediaRefused,
  mediaRoom,
  mediaUnreadable,
  problemsOf,
  type FormField,
  type MediaItem,
  type MediaKind,
  type PickedFile,
  type WorkForm,
} from './form';
import { WORK_LIMITS } from './limits';
import { MediaPicker } from './MediaPicker';
import { canPickMedia, pickMedia } from './pickMedia';
import { uploadWorkFile } from './upload';

/** design/_gen/me.js line 72 (M36): the body stacks its parts 14 apart, and the role and the year sit side by side 10 apart. */
const BODY_GAP = 14;
const PAIR_GAP = 10;

export type AddWorkScreenProps = {
  onBack: () => void;
  /** After the work is saved. The route decides where to go: back to where the person came from. */
  onSaved: () => void;
  /** Opens M34 for the person's own works, where a work's Remove makes room when the profile is full. */
  onOpenWorks: (wawuId: string) => void;
};

let nextItem = 0;
const newItem = (file: PickedFile): MediaItem => ({ id: `media-${(nextItem += 1)}`, file, state: 'uploading' });

/**
 * M36 · Add a work. Photos or a video are uploaded as they are chosen (`POST /uploads/presign`, folder
 * `profile/work`); Save sends the work with the keys that landed (`POST /users/me/featured-works`, the
 * first file the cover). Title, role and year are needed; Save stays off while a file is still going up
 * or has failed, so nothing the person chose is dropped quietly. The Hub's own sentence for a field it
 * refuses (a year out of range, a link that is not a web address) shows under that field.
 */
export function AddWorkScreen({ onBack, onSaved, onOpenWorks }: AddWorkScreenProps) {
  const queryClient = useQueryClient();
  const scrollRef = useRef<ScrollView>(null);
  const [form, setForm] = useState<WorkForm>(emptyForm);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [failure, setFailure] = useState<SaveFailure>({});
  const [leaving, setLeaving] = useState(false);
  const [pickNotice, setPickNotice] = useState<string | null>(null);
  // How many works the person has, against the Hub's cap. A read that fails leaves this empty, and the Hub's own refusal still says it.
  const mine = useQuery({ queryKey: myWorksKey, queryFn: fetchMyWorks, refetchOnMount: 'always' });

  const problems = problemsOf(form);
  const uploading = media.some((item) => item.state === 'uploading');
  const failed = media.some((item) => item.state === 'failed');
  const dirty = isDirty(form, media);

  const save = useMutation({
    mutationFn: () => createWork(bodyOf(form, media.flatMap((item) => (item.key ? [item.key] : [])))),
    onMutate: () => setFailure({}),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: worksRoot });
      void queryClient.invalidateQueries({ queryKey: ['profile'] });
      AccessibilityInfo.announceForAccessibility('Work added');
      onSaved();
    },
    onError: (error) => {
      const next = saveFailure(error);
      setFailure(next);
      if (next.full) void mine.refetch();
    },
  });
  const profileFull = mine.data ? mine.data.count >= WORK_LIMITS.works : failure.full === true;
  const busy = save.isPending;
  const canSave = isComplete(form) && !hasProblems(problems) && !uploading && !failed && !busy && !profileFull;

  const edit = (field: FormField, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (failure.field === field || failure.banner) setFailure({});
  };

  const upload = async (item: MediaItem) => {
    setMedia((current) => current.map((m) => (m.id === item.id ? { ...m, state: 'uploading', error: undefined } : m)));
    try {
      const key = await uploadWorkFile(item.file);
      setMedia((current) => current.map((m) => (m.id === item.id ? { ...m, state: 'ready', key } : m)));
    } catch (error) {
      setMedia((current) => current.map((m) => (m.id === item.id ? { ...m, state: 'failed', error: uploadFailure(error) } : m)));
    }
  };

  const add = async () => {
    let unreadable: MediaKind[] = [];
    let picked: PickedFile[];
    try {
      picked = await pickMedia((kinds) => {
        unreadable = kinds;
      });
    } catch {
      // The photo library itself failed: said plainly. A cancel stays silent.
      setPickNotice(MEDIA_LIBRARY_FAILED);
      return;
    }
    if (picked.length === 0 && unreadable.length === 0) return;
    // A work carries up to the Hub's limit: what fits is added in the order chosen, the rest is refused here, in words, never sent.
    const files = picked.slice(0, mediaRoom(media.length));
    picked.slice(files.length).forEach((file) => file.discard?.());
    // A file that could not be read is counted for the person (D1), before any that did not fit.
    const notices = [unreadable.length > 0 ? mediaUnreadable(unreadable) : null, files.length < picked.length ? mediaRefused(picked.length - files.length) : null];
    const notice = notices.filter((line): line is string => line !== null).join(' ');
    setPickNotice(notice === '' ? null : notice);
    if (files.length === 0) return;
    const items = files.map(newItem);
    setMedia((current) => [...current, ...items]);
    items.forEach((item) => void upload(item));
  };

  const failedMessage = media.find((item) => item.state === 'failed')?.error;
  const banner = failure.full ? undefined : (failure.banner ?? failedMessage);
  const errorOf = (field: FormField) => (failure.field === field ? failure.message : problems[field]);

  const back = () => (dirty && !busy ? setLeaving(true) : onBack());

  return (
    <>
      <ScreenFrame idPrefix="edit" keyboard titleLines={1}
        testID="add-work"
        title="Add a work"
        onBack={back}
        scrollRef={scrollRef}
        gap={BODY_GAP}
        action={{ label: 'Save', onPress: () => save.mutate(), disabled: !canSave, loading: busy, testID: 'work-save' }}
      >
        {banner ? <Banner tone="danger" title="That did not work" body={banner} testID="work-banner" /> : null}
        {profileFull ? (
          <View testID="work-full" style={styles.full}>
            <Banner tone="warning" title="Your works are full" body={PROFILE_FULL} testID="work-full-banner" />
            {mine.data ? <Button label="Open your works" variant="secondary" full onPress={() => onOpenWorks(mine.data.owner.wawuId)} testID="work-open-works" /> : null}
          </View>
        ) : null}
        {canPickMedia ? (
          <MediaPicker
            items={media}
            onAdd={() => void add()}
            onRemove={(id) => {
              setPickNotice(null);
              setMedia((current) => current.filter((m) => m.id !== id));
            }}
            onRetry={(id) => void upload(media.find((m) => m.id === id) as MediaItem)}
            disabled={busy}
            hint={mediaHint}
            notice={pickNotice}
            full={mediaRoom(media.length) === 0}
          />
        ) : null}
        <AuthField scrollRef={scrollRef} label="Title" testID="work-title" value={form.title} onChangeText={(v) => edit('title', v)} error={errorOf('title')} autoCapitalize="sentences" disabled={busy} />
        <View style={styles.pair}>
          <View style={styles.half}>
            <AuthField scrollRef={scrollRef} label="Your role" testID="work-role" value={form.role} onChangeText={(v) => edit('role', v)} error={errorOf('role')} autoCapitalize="sentences" disabled={busy} />
          </View>
          <View style={styles.half}>
            <AuthField
              scrollRef={scrollRef}
              label="Year"
              testID="work-year"
              value={form.year}
              onChangeText={(v) => edit('year', v.replace(/\D/g, '').slice(0, 4))}
              error={errorOf('year')}
              keyboardType="number-pad"
              maxLength={4}
              disabled={busy}
            />
          </View>
        </View>
        <AuthField scrollRef={scrollRef} label="Client" testID="work-client" value={form.client} onChangeText={(v) => edit('client', v)} error={errorOf('client')} autoCapitalize="words" disabled={busy} />
        <AuthField
          scrollRef={scrollRef}
          label="Link"
          testID="work-link"
          value={form.link}
          onChangeText={(v) => edit('link', v)}
          hint="Optional"
          error={errorOf('link')}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          disabled={busy}
        />
        <AuthField
          scrollRef={scrollRef}
          label="Category"
          testID="work-category"
          value={form.category}
          onChangeText={(v) => edit('category', v)}
          hint="Optional. Works with the same category are grouped under one filter."
          error={errorOf('category')}
          autoCapitalize="sentences"
          disabled={busy}
        />
      </ScreenFrame>
      <BottomSheet visible={leaving} onClose={() => setLeaving(false)} label="Discard this work?" testID="work-discard">
        <Text variant="sheetTitleSm">Discard this work?</Text>
        <Text variant="muted">What you added has not been saved.</Text>
        <Button label="Keep editing" full onPress={() => setLeaving(false)} testID="work-keep" />
        <Button
          label="Discard"
          variant="secondary"
          full
          onPress={() => {
            setLeaving(false);
            onBack();
          }}
          testID="work-discard-confirm"
        />
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  full: { gap: PAIR_GAP },
  pair: { flexDirection: 'row', gap: PAIR_GAP },
  half: { flex: 1, minWidth: 0 },
});
