import type { RefObject } from 'react';
import { StyleSheet, View, type ScrollView } from 'react-native';

import { TextField } from '@/components/TextField';
import { AuthField } from '@/features/auth/AuthField';

import type { FormField, WorkForm } from './form';
import { WORK_LIMITS } from './limits';

/** design/_gen/me.js line 72 (M36): the role and the year sit side by side 10 apart. */
const PAIR_GAP = 10;

export type WorkFieldsProps = {
  form: WorkForm;
  /** The sentence to show under a field, if any. */
  errorOf: (field: FormField) => string | undefined;
  onChange: (field: FormField, value: string) => void;
  disabled: boolean;
  scrollRef: RefObject<ScrollView | null>;
};

/**
 * M36's text fields: title, role and year, client, link, category and the description. Add a work and Edit a work (FIX-113)
 * draw the same ones, so neither forks the other. The description is the shared multi-line field (SHARED-CHANGES ME-11 #2) with
 * the Hub's own count (`WORK_LIMITS.description`).
 */
export function WorkFields({ form, errorOf, onChange, disabled, scrollRef }: WorkFieldsProps) {
  return (
    <>
      <AuthField scrollRef={scrollRef} label="Title" testID="work-title" value={form.title} onChangeText={(v) => onChange('title', v)} error={errorOf('title')} autoCapitalize="sentences" disabled={disabled} />
      <View style={styles.pair}>
        <View style={styles.half}>
          <AuthField scrollRef={scrollRef} label="Your role" testID="work-role" value={form.role} onChangeText={(v) => onChange('role', v)} error={errorOf('role')} autoCapitalize="sentences" disabled={disabled} />
        </View>
        <View style={styles.half}>
          <AuthField
            scrollRef={scrollRef}
            label="Year"
            testID="work-year"
            value={form.year}
            onChangeText={(v) => onChange('year', v.replace(/\D/g, '').slice(0, 4))}
            error={errorOf('year')}
            keyboardType="number-pad"
            maxLength={4}
            disabled={disabled}
          />
        </View>
      </View>
      <AuthField scrollRef={scrollRef} label="Client" testID="work-client" value={form.client} onChangeText={(v) => onChange('client', v)} error={errorOf('client')} autoCapitalize="words" disabled={disabled} />
      <AuthField
        scrollRef={scrollRef}
        label="Link"
        testID="work-link"
        value={form.link}
        onChangeText={(v) => onChange('link', v)}
        hint="Optional"
        error={errorOf('link')}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        disabled={disabled}
      />
      <AuthField
        scrollRef={scrollRef}
        label="Category"
        testID="work-category"
        value={form.category}
        onChangeText={(v) => onChange('category', v)}
        hint="Optional. Works with the same category are grouped under one filter."
        error={errorOf('category')}
        autoCapitalize="sentences"
        disabled={disabled}
      />
      <TextField
        multiline
        label="Description"
        testID="work-description-field"
        value={form.description}
        onChangeText={(v) => onChange('description', v)}
        max={WORK_LIMITS.description}
        error={errorOf('description')}
        placeholder="What was it, and what did you do?"
        autoCapitalize="sentences"
        disabled={disabled}
      />
    </>
  );
}

const styles = StyleSheet.create({
  pair: { flexDirection: 'row', gap: PAIR_GAP },
  half: { flex: 1, minWidth: 0 },
});
