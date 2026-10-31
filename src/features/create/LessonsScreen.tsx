import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/client';
import { Button } from '@/components/Button';
import { Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';

import { allowanceKey, fetchAllowance, fetchFormats, formatsKey } from './api';
import { CreateFrame } from './CreateFrame';
import { addLesson, moveLesson, removeLesson, setLessonFile, setLessonText, useLessons } from './draft';
import { LessonCard } from './LessonCard';
import { isFreeLesson, lessonsReady } from './lessons';
import { labelOf, lessonsLine } from './model';
import { Stepper } from './parts';
import { SlotsFullNotice, slotsFull } from './UploadsMeter';

export type LessonsScreenProps = {
  onBack: () => void;
  onContinue: () => void;
  onOpenLibrary?: () => void;
  onGetVerified?: () => void;
  /** The Hub refused an upload because no tier is running (`402 tier_required`): VF5. */
  onNeedTier?: () => void;
  /** The Hub refused it because every place is used (`402 product_limit_reached`): VF13. */
  onProductsFull?: () => void;
};

/**
 * Step 2 of 5 for a course: the lessons, added one by one (a title, a length, a file each). No board draws this step: M21 draws one
 * file, and a course is lessons ("Lessons · the first is the preview", M20), so the step is built from M21's own parts (the step
 * frame, the file card with its bar) and the form's fields (G-FIX111-1). The first lesson is the free one (H25); the rest unlock when
 * someone buys. Each file is a `content/full` upload under the course format's rule. Continue waits for every lesson to be whole.
 */
export function LessonsScreen({ onBack, onContinue, onOpenLibrary, onGetVerified, onNeedTier, onProductsFull }: LessonsScreenProps) {
  const formats = useQuery({ queryKey: formatsKey, queryFn: fetchFormats });
  const allowance = useQuery({ queryKey: allowanceKey, queryFn: fetchAllowance });
  const lessons = useLessons();
  const rule = formats.data?.find((r) => r.id === 'course')?.full ?? null;
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const noRoom = allowance.data ? slotsFull(allowance.data) : false;
  const uploading = Object.values(busy).some(Boolean);

  // The step opens with the first lesson ready to fill.
  useEffect(() => {
    if (lessons.length === 0) addLesson();
  }, [lessons.length]);

  const refused = (error: unknown) => {
    if (isApiError(error) && error.code === 'tier_required') onNeedTier?.();
    else if (isApiError(error) && error.code === 'product_limit_reached') onProductsFull?.();
  };

  const foot = <Button testID="create-continue" label="Continue" full disabled={!lessonsReady(lessons) || uploading} onPress={onContinue} />;

  return (
    <CreateFrame testID="lessons-screen" title={`New ${labelOf('course')}`} subtitle="Step 2 of 5" onLeave={onBack} foot={foot}>
      <Stepper active={0} />
      <View style={styles.heading}>
        <Text variant="h2" style={styles.title}>
          Add the lessons
        </Text>
        <Text testID="lessons-line" variant="muted">
          {lessonsLine(lessons[0]?.file ?? null)}
        </Text>
      </View>
      {formats.isError && !rule ? (
        <ErrorState
          testID="lessons-error"
          title="Couldn't load the upload rules"
          message={isApiError(formats.error) ? formats.error.message : 'Check your connection and try again.'}
          onRetry={() => void formats.refetch()}
        />
      ) : !rule ? (
        <Skeleton testID="lessons-loading" height={220} radius={24} />
      ) : (
        <>
          {allowance.data && noRoom ? <SlotsFullNotice allowance={allowance.data} onOpenLibrary={onOpenLibrary} onGetVerified={onGetVerified} /> : null}
          {lessons.map((lesson, i) => (
            <LessonCard
              key={lesson.key}
              id={lesson.key}
              index={i}
              title={lesson.title}
              duration={lesson.duration}
              file={lesson.file}
              free={isFreeLesson(i, lessons.length)}
              rule={rule}
              blocked={noRoom}
              onTitle={(title) => setLessonText(lesson.key, { title })}
              onDuration={(duration) => setLessonText(lesson.key, { duration })}
              onFile={(file) => setLessonFile(lesson.key, file)}
              onMoveUp={i > 0 ? () => moveLesson(lesson.key, -1) : undefined}
              onRemove={() => removeLesson(lesson.key)}
              onRefused={refused}
              onBusy={(b) => setBusy((s) => (s[lesson.key] === b ? s : { ...s, [lesson.key]: b }))}
            />
          ))}
          <Button testID="lessons-add" label="Add a lesson" icon="Plus" variant="secondary" full onPress={addLesson} />
        </>
      )}
    </CreateFrame>
  );
}

/** me.js `previewStep`'s heading, as M22 draws it: the title at 20, 6 above its line. */
const headMetrics = { title: 20, titleGap: 6 } as const;

const styles = StyleSheet.create({
  heading: { gap: headMetrics.titleGap },
  title: { fontSize: headMetrics.title },
});
