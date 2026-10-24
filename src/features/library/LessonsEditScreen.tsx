import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useRef, useState } from 'react';

import { isApiError } from '@/api/client';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { detailKey, fetchPieceDetail, pieceKey as pageKey } from '@/features/content-detail/api';
import { fetchFormats, formatsKey, releaseUpload, saveLessons, type LessonInput } from '@/features/create/api';
import { CreateFrame } from '@/features/create/CreateFrame';
import type { UploadedFile } from '@/features/create/draft';
import { LessonCard } from '@/features/create/LessonCard';
import { durationOk, isFreeLesson } from '@/features/create/lessons';
import { space } from '@/theme';

import { fetchPiece, libraryKey, pieceKey } from './api';

/** One lesson on the screen: one the Hub holds (it has an `id`) or one added here. `file` is a file uploaded here, not yet saved. */
type Row = { key: string; id?: string; title: string; duration: string; file: UploadedFile | null; saved: boolean };

let rowCounter = 0;
const blankRow = (): Row => ({ key: `new-${(rowCounter += 1)}`, title: '', duration: '', file: null, saved: false });

/** A new lesson needs a file (a lesson with none plays nothing); one the Hub holds keeps what it has. Every title is filled, every length reads right. */
export const rowReady = (r: Row): boolean => r.title.trim().length > 0 && durationOk(r.duration) && (r.id !== undefined || r.file !== null);

/** The Hub's list for these rows: a kept lesson sends its `id` (and keeps its file unless a new one went up), a new one sends its file. */
export function lessonBody(rows: readonly Row[]): LessonInput[] {
  return rows.map((r) => ({
    ...(r.id ? { id: r.id } : {}),
    title: r.title.trim(),
    ...(r.duration.trim() ? { durationLabel: r.duration.trim() } : {}),
    ...(r.file ? { assetKey: r.file.key } : {}),
  }));
}

export type LessonsEditScreenProps = {
  /** The course's id. */
  id: string;
  onBack: () => void;
  /** The Hub took the lessons. */
  onSaved: () => void;
};

/**
 * Edit lessons (`/library/<id>/lessons`), from the creator's own course (FIX-111): add a lesson, put them in order, change a title or a
 * length, take one out, or give a lesson that has no file its file. It is the create flow's own lesson card, so a lesson is made the same
 * way in both places; the lessons are saved together (`PUT /content/{id}/lessons`), and the Hub refuses to take a lesson out of a course
 * people have bought, in its own words. No board draws it (G-FIX111-1).
 */
export function LessonsEditScreen({ id, onBack, onSaved }: LessonsEditScreenProps) {
  const client = useQueryClient();
  const course = useQuery({ queryKey: pieceKey(id), queryFn: () => fetchPiece(id) });
  const detail = useQuery({ queryKey: detailKey(id), queryFn: () => fetchPieceDetail(id) });
  const formats = useQuery({ queryKey: formatsKey, queryFn: fetchFormats });
  const rule = formats.data?.find((r) => r.id === 'course')?.full ?? null;
  // The lessons the Hub holds, read once they arrive; edits live in `edited` until Save, and take over from there.
  const base = useMemo(() => {
    if (!detail.data) return null;
    const held: Row[] = detail.data.lessons.map((l) => ({ key: l.id, id: l.id, title: l.title, duration: l.durationLabel ?? '', file: null, saved: l.hasFile }));
    return { start: held.length > 0 ? held : [blankRow()], snapshot: JSON.stringify(lessonBody(held)) };
  }, [detail.data]);
  const [edited, setEdited] = useState<Row[] | null>(null);
  const rows = edited ?? base?.start ?? null;
  const setRows = (change: (rs: Row[]) => Row[]) => setEdited(change(rows ?? []));
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [failure, setFailure] = useState<string | null>(null);
  const saving = useRef(false);

  const save = useMutation({
    mutationFn: (body: LessonInput[]) => saveLessons(id, body),
    onMutate: () => setFailure(null),
    onSettled: () => {
      saving.current = false;
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: pageKey(id) });
      void client.invalidateQueries({ queryKey: libraryKey });
      onSaved();
    },
    onError: (error) => setFailure(isApiError(error) && error.message ? error.message : 'We could not save the lessons. Check your connection and try again.'),
  });

  const change = (key: string, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const uploading = Object.values(busy).some(Boolean);
  const ready = rows !== null && rows.length > 0 && rows.every(rowReady);
  const dirty = rows !== null && JSON.stringify(lessonBody(rows)) !== base?.snapshot;

  const onSave = () => {
    if (!rows || !ready || saving.current) return;
    saving.current = true;
    save.mutate(lessonBody(rows));
  };

  const foot = rows ? (
    <>
      {failure ? <Banner testID="lessons-edit-failure" tone="danger" title="Lessons not saved" body={failure} /> : null}
      <Button testID="lessons-save" label="Save lessons" full loading={save.isPending} disabled={!ready || !dirty || uploading} onPress={onSave} />
    </>
  ) : undefined;

  return (
    <CreateFrame testID="lessons-edit-screen" title="Lessons" subtitle={course.data?.title} onLeave={onBack} foot={foot}>
      {rows ? (
        <>
          {rows.map((row, i) => (
            <LessonCard
              key={row.key}
              id={row.key}
              index={i}
              title={row.title}
              duration={row.duration}
              file={row.file}
              savedFile={row.saved && !row.file}
              free={isFreeLesson(i, rows.length)}
              rule={rule}
              onTitle={(title) => change(row.key, { title })}
              onDuration={(duration) => change(row.key, { duration })}
              onFile={(file) => change(row.key, { file })}
              onMoveUp={
                i > 0
                  ? () =>
                      setRows((rs) => {
                        const next = [...rs];
                        [next[i - 1], next[i]] = [next[i], next[i - 1]];
                        return next;
                      })
                  : undefined
              }
              onRemove={() => {
                // A file that went up here and was never saved is given back; one the Hub holds stays with the Hub.
                if (row.file) void releaseUpload(row.file.key).catch(() => undefined);
                setRows((rs) => rs.filter((r) => r.key !== row.key));
              }}
              onBusy={(b) => setBusy((s) => (s[row.key] === b ? s : { ...s, [row.key]: b }))}
            />
          ))}
          <Button testID="lessons-edit-add" label="Add a lesson" icon="Plus" variant="secondary" full onPress={() => setRows((rs) => [...rs, blankRow()])} />
        </>
      ) : detail.isError || course.isError ? (
        <ErrorState
          testID="lessons-edit-error"
          title="Couldn't open the lessons"
          message={isApiError(detail.error ?? course.error) ? (detail.error ?? course.error)!.message : 'Check your connection and try again.'}
          onRetry={() => {
            void detail.refetch();
            void course.refetch();
          }}
        />
      ) : (
        <Skeleton testID="lessons-edit-loading" height={220} radius={space.xl} />
      )}
    </CreateFrame>
  );
}
