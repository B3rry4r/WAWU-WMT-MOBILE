import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/client';
import { ApiError } from '@/api/errors';
import { Button, IconButton } from '@/components/Button';
import { Card } from '@/components/Card';
import { StatusPill } from '@/components/StatusPill';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { font, space } from '@/theme';

import { refusalFor, type ChosenFile } from './chosen';
import type { UploadedFile } from './draft';
import { durationOk } from './lessons';
import type { FileRule } from './model';
import { FileRow, useFirstTap } from './parts';
import { canPickFile, pickFile } from './pickFile';
import { UPLOAD_CANCELLED, uploadFile } from './upload';

/** The card of one lesson: a number and its Free tag, move up and remove, the title, the length, and the lesson's file. */
const cardMetrics = { between: space.md, head: space.sm } as const;

type Stage = { state: 'idle' } | { state: 'uploading'; file: ChosenFile; share: number } | { state: 'failed'; file: ChosenFile | null; message: string; retry: boolean };

/** A failed upload is worth asking again for when nothing about the file is wrong: no answer, a server fault, or the bytes themselves not landing. */
const retryable = (error: unknown): boolean => !isApiError(error) || error.status === 0 || error.status >= 500 || error.code === 'upload_failed';

export type LessonCardProps = {
  /** The screen's handle for the card; the test ids end in it. */
  id: string;
  index: number;
  title: string;
  duration: string;
  /** The file that has landed for this lesson, or null. */
  file: UploadedFile | null;
  /** A lesson the Hub already holds with a file: shown as saved, with no way to choose another here. */
  savedFile?: boolean;
  /** The Free tag (the first lesson of a course with more than one). */
  free: boolean;
  /** What a lesson's file may be: the course format's rule, as the Hub serves it. Null until it has loaded. */
  rule: FileRule | null;
  /** Nothing may be uploaded now (every place is used, or the rule has not loaded). */
  blocked?: boolean;
  onTitle: (title: string) => void;
  onDuration: (duration: string) => void;
  onFile: (file: UploadedFile | null) => void;
  onMoveUp?: () => void;
  onRemove: () => void;
  /** The upload was refused in a way that is not a sentence (402 `tier_required`, `product_limit_reached`): the screen decides where that leads. */
  onRefused?: (error: unknown) => void;
  /** Reports an upload under way, so the screen can hold Continue and Save until it ends. */
  onBusy?: (busy: boolean) => void;
};

export function LessonCard({ id, index, title, duration, file, savedFile, free, rule, blocked, onTitle, onDuration, onFile, onMoveUp, onRemove, onRefused, onBusy }: LessonCardProps) {
  const [stage, setStage] = useState<Stage>({ state: 'idle' });
  const abort = useRef<AbortController | null>(null);
  const firstTap = useFirstTap();

  // Leaving the screen, or taking the lesson out, stops a transfer that is still going.
  useEffect(
    () => () => {
      abort.current?.abort();
      onBusy?.(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const send = async (chosen: ChosenFile) => {
    if (!rule) return;
    const refusal = refusalFor(chosen, rule);
    if (refusal) {
      setStage({ state: 'failed', file: chosen, message: refusal, retry: false });
      return;
    }
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    onFile(null);
    setStage({ state: 'uploading', file: chosen, share: 0 });
    onBusy?.(true);
    try {
      const uploaded = await uploadFile(chosen, { folder: 'content/full', format: 'course' }, (share) => setStage((s) => (s.state === 'uploading' ? { ...s, share } : s)), controller.signal);
      if (controller.signal.aborted) return;
      onFile(uploaded);
      setStage({ state: 'idle' });
      onBusy?.(false);
    } catch (error) {
      onBusy?.(false);
      if (error instanceof ApiError && error.code === UPLOAD_CANCELLED) return;
      if (isApiError(error) && (error.code === 'tier_required' || error.code === 'product_limit_reached') && onRefused) {
        setStage({ state: 'idle' });
        onRefused(error);
        return;
      }
      setStage({ state: 'failed', file: chosen, message: isApiError(error) ? error.message : 'That file did not upload. Try again.', retry: retryable(error) });
    }
  };

  const choose = async () => {
    if (!rule || blocked || stage.state === 'uploading' || !firstTap()) return;
    try {
      const chosen = await pickFile(rule.contentTypes);
      if (chosen) await send(chosen);
    } catch {
      setStage({ state: 'failed', file: null, message: "We couldn't open your files. Try again.", retry: false });
    }
  };

  const bad = duration.trim() !== '' && !durationOk(duration);
  const uploading = stage.state === 'uploading';

  return (
    <Card padded testID={`lesson-card-${id}`} style={styles.card}>
      <View style={styles.head}>
        <Text variant="body" style={[font(700), styles.number]}>{`Lesson ${index + 1}`}</Text>
        {free ? <StatusPill label="Free" tone="positive" testID={`lesson-free-${id}`} /> : null}
        <View style={styles.grow} />
        {onMoveUp ? <IconButton icon="ArrowUp" label={`Move lesson ${index + 1} up`} onPress={onMoveUp} size={36} testID={`lesson-up-${id}`} /> : null}
        <IconButton icon="Trash2" label={`Remove lesson ${index + 1}`} onPress={onRemove} size={36} testID={`lesson-remove-${id}`} />
      </View>
      <TextField testID={`lesson-title-${id}`} label="Title" value={title} onChangeText={onTitle} maxLength={120} autoCapitalize="sentences" returnKeyType="next" />
      <TextField
        testID={`lesson-length-${id}`}
        label="Length"
        placeholder="4:12"
        value={duration}
        onChangeText={(t) => onDuration(t.replace(/[^\d:]/g, ''))}
        keyboardType="numbers-and-punctuation"
        maxLength={8}
        error={bad ? 'Write it as 4:12 or 1:20:05' : undefined}
        hint={bad ? undefined : 'Optional'}
      />
      {stage.state === 'uploading' ? (
        <FileRow testID={`lesson-file-${id}`} icon="FileText" name={stage.file.name} progress={stage.share} />
      ) : file ? (
        <FileRow testID={`lesson-file-${id}`} icon="FileCheck2" tone="in" name={file.name} meta="Uploaded" onRemove={() => onFile(null)} removeLabel={`Remove the file of lesson ${index + 1}`} />
      ) : savedFile ? (
        <FileRow testID={`lesson-file-${id}`} icon="FileCheck2" tone="in" name="File saved" meta="Already on this lesson" />
      ) : (
        <Button
          testID={`lesson-choose-${id}`}
          label="Choose the lesson file"
          icon="FileUp"
          variant="secondary"
          full
          disabled={!rule || blocked || !canPickFile || uploading}
          onPress={() => void choose()}
        />
      )}
      {stage.state === 'failed' ? (
        <View style={styles.failure}>
          <Text variant="errorLine" tone="danger" accessibilityRole="alert" testID={`lesson-failure-${id}`}>
            {stage.message}
          </Text>
          {stage.retry && stage.file ? <Button testID={`lesson-retry-${id}`} label="Try again" variant="secondary" size="sm" onPress={() => stage.file && void send(stage.file)} /> : null}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: cardMetrics.between },
  head: { flexDirection: 'row', alignItems: 'center', gap: cardMetrics.head },
  number: { fontSize: 15 },
  grow: { flex: 1 },
  failure: { gap: space.sm, alignItems: 'flex-start' },
});
