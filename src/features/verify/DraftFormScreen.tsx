import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/client';
import { Button } from '@/components/Button';
import { PricePicker } from '@/components/PricePicker';
import { FilterChips } from '@/components/FilterChips';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { SegmentedTabs } from '@/components/SegmentedTabs';
import { ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { FORMATS, type FormatId } from '@/features/create/model';
import { refetchIfNotOnList } from '@/features/prices/api';
import { digitsOfNaira, nairaOfDigits } from '@/features/prices/model';
import { radius, space } from '@/theme';

import { createDraft, deleteDraft, draftKey, draftsKey, fetchDraft, updateDraft } from './api';
import { changesOf, createBodyOf, emptyForm, formOf, titleProblem, type Form } from './model';
import { ShopFrame } from './parts';

const ACCESS = [
  { value: 'paid', label: 'Paid' },
  { value: 'free', label: 'Free' },
] as const;
const KIND_ITEMS = FORMATS.map((format) => ({ value: format.id, label: format.label, icon: format.icon }));

export type DraftFormScreenProps = {
  /** A draft to edit. Left out, the form starts a new one. */
  draftId?: string;
  onBack: () => void;
  /** The draft is saved: back to VF2. */
  onSaved: () => void;
  /** The draft is deleted: back to VF2. */
  onDeleted: () => void;
  /** Publish (VERIFY-04): a saved draft opens the publish step (VF12), or the tiers when no tier is running. Not drawn without it, and not for a new draft. */
  onPublish?: (draftId: string) => void | Promise<void>;
};

const failure = (error: unknown, fallback: string): string => (isApiError(error) && error.message ? error.message : fallback);

/**
 * The Create product form without its file step (VF2's "Add a product" and a draft's edit): a title, how it looks (the kind of
 * product), a description and a price picked from the Hub's list (PRICE-PICKER), saved to `POST` or `PATCH /product-drafts`. Only the title is needed; the rest can come later.
 * A draft with no file saves free. Delete asks once (`DELETE /product-drafts/{id}`). The Hub's own words are shown when it refuses a
 * save, as when the next draft would pass the number it keeps (G-662).
 */
export function DraftFormScreen({ draftId, onBack, onSaved, onDeleted, onPublish }: DraftFormScreenProps) {
  const cache = useQueryClient();
  const editing = draftId !== undefined;
  const loaded = useQuery({ queryKey: draftKey(draftId ?? 'new'), queryFn: () => fetchDraft(draftId as string), enabled: editing, retry: false });
  // The form is the draft as the Hub holds it with what the person has typed over it, so there is nothing to copy in and a refetch
  // never overwrites what is being typed.
  const base: Form | null = editing ? (loaded.data ? formOf(loaded.data) : null) : emptyForm;
  const [edits, setEdits] = useState<Partial<Form>>({});
  const form: Form | null = base ? { ...base, ...edits } : null;
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState<'saving' | 'deleting' | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const set = (patch: Partial<Form>) => {
    setProblem(null);
    setEdits((current) => ({ ...current, ...patch }));
  };

  const save = async () => {
    if (!form || busy) return;
    setTouched(true);
    if (titleProblem(form.title)) return;
    const changes = editing && base ? changesOf(form, base) : null;
    if (editing && !changes) return;
    setBusy('saving');
    setProblem(null);
    try {
      if (editing) {
        const saved = await updateDraft(draftId, changes!);
        cache.setQueryData(draftKey(draftId), saved);
        // What the Hub now holds is the new starting point, so a second Save with nothing changed sends nothing.
        setEdits({});
        setBusy(null);
      } else {
        // A new draft keeps the form locked until the screen is left: a second tap must not save a second draft.
        await createDraft(createBodyOf(form));
      }
      await cache.invalidateQueries({ queryKey: draftsKey });
      onSaved();
    } catch (error) {
      // An admin changed the price list while the picker was open: read it again; the Hub's own sentence is shown below.
      refetchIfNotOnList(cache, error);
      setProblem(failure(error, 'We could not save this draft. Try again.'));
      setBusy(null);
    }
  };

  const remove = async () => {
    if (!editing || busy) return;
    setBusy('deleting');
    setProblem(null);
    try {
      await deleteDraft(draftId);
      cache.removeQueries({ queryKey: draftKey(draftId) });
      await cache.invalidateQueries({ queryKey: draftsKey });
      onDeleted();
    } catch (error) {
      setProblem(failure(error, 'We could not delete this draft. Try again.'));
      setBusy(null);
      setConfirming(false);
    }
  };

  const title = editing ? 'Edit draft' : 'New draft';
  if (editing && form === null) {
    // A draft that is not the person's (404) and an id that is no draft's at all (400: a typed or old link) are the same to them: it is gone.
    const gone = loaded.isError && isApiError(loaded.error) && (loaded.error.status === 404 || loaded.error.status === 400);
    return (
      <ShopFrame testID="draft-form" title={title} onBack={onBack}>
        {loaded.isError ? (
          <ErrorState
            testID={gone ? 'draft-gone' : 'draft-error'}
            title={gone ? 'This draft is gone' : 'Your draft did not load'}
            message={gone ? 'It may have been deleted on another phone.' : failure(loaded.error, 'Check your connection and try again.')}
            onRetry={gone ? undefined : () => void loaded.refetch()}
          />
        ) : (
          <LoadingView label="Loading your draft" testID="draft-loading">
            <View style={styles.fields}>
              <Skeleton height={76} radius={radius.input} />
              <Skeleton height={76} radius={radius.input} />
              <Skeleton height={120} radius={radius.input} />
            </View>
          </LoadingView>
        )}
      </ShopFrame>
    );
  }
  const current = form ?? emptyForm;
  const titleError = touched ? titleProblem(current.title) : null;
  const changed = editing && base ? changesOf(current, base) !== null : true;
  const canSave = !busy && changed && titleProblem(current.title) === null;

  return (
    <ShopFrame
      testID="draft-form"
      title={title}
      onBack={onBack}
      foot={
        <>
          {problem ? (
            <Text variant="errorLine" tone="danger" accessibilityRole="alert" testID="draft-problem">
              {problem}
            </Text>
          ) : null}
          {confirming ? (
            <View testID="draft-confirm" style={styles.confirm}>
              <Text variant="body" style={styles.confirmWords}>
                Delete this draft? It cannot be undone.
              </Text>
              <View style={styles.confirmButtons}>
                <Button testID="draft-keep" label="Keep it" variant="secondary" onPress={() => setConfirming(false)} disabled={busy === 'deleting'} />
                <Button testID="draft-delete-yes" label="Delete" variant="outline" icon="Trash2" onPress={() => void remove()} loading={busy === 'deleting'} />
              </View>
            </View>
          ) : (
            <>
              {editing && onPublish ? (
                // What is published is the draft as the Hub holds it, so a form with unsaved changes asks to be saved first.
                <Button testID="draft-publish" label="Publish" full onPress={() => void onPublish(draftId)} disabled={busy !== null || changed} />
              ) : null}
              <Button testID="draft-save" label="Save draft" full variant={editing && onPublish ? 'secondary' : undefined} onPress={() => void save()} disabled={!canSave} loading={busy === 'saving'} />
              {editing ? <Button testID="draft-delete" label="Delete draft" variant="outline" icon="Trash2" full onPress={() => setConfirming(true)} disabled={busy !== null} /> : null}
            </>
          )}
        </>
      }
    >
      <TextField
        testID="draft-title"
        label="Title"
        value={current.title}
        onChangeText={(title) => set({ title })}
        placeholder="Name your product"
        error={titleError ?? undefined}
        returnKeyType="next"
      />
      <View style={styles.group}>
        <Text variant="secondary" tone="textSecondary">
          How it looks
        </Text>
        <FilterChips<FormatId | 'none'>
          testID="draft-kind"
          label="What kind of product it is"
          variant="option"
          inset={0}
          items={KIND_ITEMS}
          value={current.kind ?? 'none'}
          onChange={(value) => set({ kind: value === 'none' ? null : value })}
        />
      </View>
      <TextField testID="draft-description" label="Description" value={current.description} onChangeText={(description) => set({ description })} placeholder="What buyers get" multiline />
      <View style={styles.group}>
        <SegmentedTabs testID="draft-access" label="Paid or free" items={ACCESS} value={current.access} onChange={(access) => set({ access })} />
        {current.access === 'paid' ? (
          <PricePicker
            testID="draft-price"
            value={nairaOfDigits(current.price)}
            onChange={(naira) => set({ price: digitsOfNaira(naira) })}
            label="Your price"
            earnSuffix="a sale"
          />
        ) : (
          <Text variant="muted" testID="draft-free-note">
            Free for everyone. Anyone can open it.
          </Text>
        )}
      </View>
    </ShopFrame>
  );
}

const styles = StyleSheet.create({
  fields: { gap: space.lg },
  group: { gap: space.sm },
  confirm: { gap: space.md },
  confirmWords: { textAlign: 'center' },
  confirmButtons: { flexDirection: 'row', justifyContent: 'center', gap: space.md },
});
