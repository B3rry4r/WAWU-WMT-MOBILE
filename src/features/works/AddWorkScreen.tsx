import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { AccessibilityInfo, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { BottomSheet } from '@/components/BottomSheet';
import { Text } from '@/components/Text';
import { AuthField } from '@/features/auth/AuthField';
import { Banner } from '@/features/auth/Banner';
import { EditFrame } from '@/features/profile-edit/EditFrame';

import { createWork, worksRoot } from './api';
import { saveFailure, uploadFailure, type SaveFailure } from './failure';
import { bodyOf, emptyForm, hasProblems, isComplete, isDirty, problemsOf, type FormField, type MediaItem, type PickedFile, type WorkForm } from './form';
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
export function AddWorkScreen({ onBack, onSaved }: AddWorkScreenProps) {
  const queryClient = useQueryClient();
  const scrollRef = useRef<ScrollView>(null);
  const [form, setForm] = useState<WorkForm>(emptyForm);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [failure, setFailure] = useState<SaveFailure>({});
  const [leaving, setLeaving] = useState(false);

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
    onError: (error) => setFailure(saveFailure(error)),
  });
  const busy = save.isPending;
  const canSave = isComplete(form) && !hasProblems(problems) && !uploading && !failed && !busy;

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
    const files = await pickMedia();
    if (files.length === 0) return;
    const items = files.map(newItem);
    setMedia((current) => [...current, ...items]);
    items.forEach((item) => void upload(item));
  };

  const failedMessage = media.find((item) => item.state === 'failed')?.error;
  const banner = failure.banner ?? failedMessage;
  const errorOf = (field: FormField) => (failure.field === field ? failure.message : problems[field]);

  const back = () => (dirty && !busy ? setLeaving(true) : onBack());

  return (
    <>
      <EditFrame
        testID="add-work"
        title="Add a work"
        onBack={back}
        scrollRef={scrollRef}
        gap={BODY_GAP}
        action={{ label: 'Save', onPress: () => save.mutate(), disabled: !canSave, loading: busy, testID: 'work-save' }}
      >
        {banner ? <Banner tone="danger" title="That did not work" body={banner} testID="work-banner" /> : null}
        {canPickMedia ? (
          <MediaPicker items={media} onAdd={() => void add()} onRemove={(id) => setMedia((current) => current.filter((m) => m.id !== id))} onRetry={(id) => void upload(media.find((m) => m.id === id) as MediaItem)} disabled={busy} />
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
      </EditFrame>
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
  pair: { flexDirection: 'row', gap: PAIR_GAP },
  half: { flex: 1, minWidth: 0 },
});
