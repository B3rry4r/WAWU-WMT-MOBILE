import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, ScrollView, View } from 'react-native';

import { Banner } from '@/components/Banner';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { ScreenFrame } from '@/components/ScreenFrame';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { fieldMetrics } from '@/components/TextField';

import { fetchMyId, fetchWork, myIdKey, updateWork, workKey, worksRoot, type WorkDetail } from './api';
import { readFailure, saveFailure, type SaveFailure } from './failure';
import { changesOf, formOf, hasProblems, isComplete, problemsOf, type FormField, type WorkForm } from './form';
import { WorkFields } from './WorkFields';

/** The same 14 between the parts as M36 (design/_gen/me.js line 72). */
const BODY_GAP = 14;

export type EditWorkScreenProps = {
  /** The owner's WAWU ID and the work: what M35 was opened with. */
  wawuId: string;
  workId: string;
  onBack: () => void;
  /** After the change is saved: the route goes back to M35, which has already been told to read again. */
  onSaved: () => void;
  /**
   * The work is somebody else's (SWEEP-APP-8 L5): the route sends the person to the work's page (M35) instead. Without it the screen says
   * the work is not theirs to change. The form is never drawn for another person's work.
   */
  onNotOwner?: () => void;
};

/**
 * Edit a work (FIX-113, G-252; no board draws it, so it is M36 with its fields filled: R-29, BACKEND_GAPS). Reads the work as M35 does,
 * and Save sends only what changed (`PATCH /users/me/featured-works/{id}`; an optional field emptied is cleared). A work's photos and
 * videos are not changed here: the box that picks them is left out (R-47) and the work keeps the ones it has.
 */
export function EditWorkScreen({ wawuId, workId, onBack, onSaved, onNotOwner }: EditWorkScreenProps) {
  const work = useQuery({ queryKey: workKey(wawuId, workId), queryFn: () => fetchWork(wawuId, workId) });
  // Whose work this is decides whether the form is drawn: only the person who made it may change it. Until that is known (or if it cannot be read) it is not.
  const me = useQuery({ queryKey: myIdKey, queryFn: fetchMyId });
  const theirs = work.data !== undefined && me.data !== undefined && me.data !== work.data.owner.wawuId;
  useEffect(() => {
    if (theirs) onNotOwner?.();
  }, [theirs, onNotOwner]);

  if (work.data && me.data !== undefined && !theirs) return <EditForm work={work.data} workId={workId} onBack={onBack} onSaved={onSaved} />;

  if (theirs && !onNotOwner) {
    return (
      <ScreenFrame idPrefix="edit" keyboard titleLines={1} title="Edit work" onBack={onBack} gap={BODY_GAP} testID="edit-work-problem">
        <ErrorState testID="edit-work-not-yours" icon="Lock" title="This is not your work" message="Only the person who made a work can change it." />
      </ScreenFrame>
    );
  }

  if (work.isError || (work.data && me.isError)) {
    const failed = work.isError ? work : me;
    return (
      <ScreenFrame idPrefix="edit" keyboard titleLines={1} title="Edit work" onBack={onBack} gap={BODY_GAP} testID="edit-work-problem">
        <ErrorState testID="edit-work-error" title="The work did not load" message={readFailure(failed.error)} onRetry={() => void failed.refetch()} />
      </ScreenFrame>
    );
  }

  return (
    <ScreenFrame idPrefix="edit" keyboard titleLines={1} title="Edit work" onBack={onBack} gap={BODY_GAP} testID="edit-work-loading">
      <LoadingView label="Loading the work">
        <View style={{ gap: BODY_GAP }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={fieldMetrics.height} radius={fieldMetrics.radius} />
          ))}
        </View>
      </LoadingView>
    </ScreenFrame>
  );
}

function EditForm({ work, workId, onBack, onSaved }: { work: WorkDetail; workId: string; onBack: () => void; onSaved: () => void }) {
  const queryClient = useQueryClient();
  const scrollRef = useRef<ScrollView>(null);
  // What is saved now: the form is compared with this, so Save stays off until something differs.
  const [base, setBase] = useState<WorkForm>(() => formOf(work));
  const [form, setForm] = useState<WorkForm>(base);
  const [failure, setFailure] = useState<SaveFailure>({});
  const [leaving, setLeaving] = useState(false);

  const changes = changesOf(form, base);
  const problems = problemsOf(form);

  const save = useMutation({
    mutationFn: () => updateWork(workId, changes ?? {}),
    onMutate: () => setFailure({}),
    onSuccess: (saved) => {
      setBase(formOf(saved));
      void queryClient.invalidateQueries({ queryKey: worksRoot });
      void queryClient.invalidateQueries({ queryKey: ['profile'] });
      AccessibilityInfo.announceForAccessibility('Work saved');
      onSaved();
    },
    onError: (error) => setFailure(saveFailure(error)),
  });
  const busy = save.isPending;
  const canSave = changes !== null && isComplete(form) && !hasProblems(problems) && !busy;

  const edit = (field: FormField, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (failure.field === field || failure.banner) setFailure({});
  };
  const errorOf = (field: FormField) => (failure.field === field ? failure.message : problems[field]);
  const back = () => (changes !== null && !busy ? setLeaving(true) : onBack());

  return (
    <>
      <ScreenFrame
        idPrefix="edit"
        keyboard
        titleLines={1}
        testID="edit-work"
        title="Edit work"
        onBack={back}
        scrollRef={scrollRef}
        gap={BODY_GAP}
        action={{ label: 'Save', onPress: () => save.mutate(), disabled: !canSave, loading: busy, testID: 'work-save' }}
      >
        {failure.banner ? <Banner tone="danger" title="That did not work" body={failure.banner} testID="work-banner" /> : null}
        <WorkFields form={form} errorOf={errorOf} onChange={edit} disabled={busy} scrollRef={scrollRef} />
      </ScreenFrame>
      <BottomSheet visible={leaving} onClose={() => setLeaving(false)} label="Discard your changes?" testID="work-discard">
        <Text variant="sheetTitleSm">Discard your changes?</Text>
        <Text variant="muted">What you changed has not been saved.</Text>
        <Button label="Keep editing" full onPress={() => setLeaving(false)} testID="work-keep" />
        <Button
          label="Discard changes"
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
