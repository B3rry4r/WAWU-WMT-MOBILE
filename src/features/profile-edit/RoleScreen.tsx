import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { Banner } from '@/components/Banner';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { GroupedList } from '@/components/Card';
import { useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { ScreenFrame } from '@/components/ScreenFrame';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { SwitchRow } from '@/components/SwitchRow';
import { Text } from '@/components/Text';
import { TextField, fieldMetrics } from '@/components/TextField';
import { AuthField } from '@/features/auth/AuthField';
import { font, layout, space, useWawu } from '@/theme';

import { createRole, deleteRole, fetchMe, meKey, updateRole, type Role } from './api';
import {
  emptyRole,
  hasRoleProblems,
  isRoleComplete,
  roleBody,
  roleChanges,
  roleFailure,
  roleFormFrom,
  roleLimits,
  roleProblems,
  type RoleForm,
} from './experience';
import { readFailure } from './failure';

/** The same 14 between the parts as M8 and M36, the month and the year side by side 10 apart. */
const BODY_GAP = 14;
const PAIR_GAP = 10;

export type RoleScreenProps = {
  /** The role being changed; absent for a new one. */
  roleId?: string;
  onBack: () => void;
  /** After Save or Remove landed: back to M8, whose list has been told to read again. */
  onDone: () => void;
};

/**
 * Add a role, or change one (FIX-113, G-292; no board draws it, so it is built from M8's and M36's fields: R-29, BACKEND_GAPS).
 * A role saves on its own, straight to the Hub (`POST` and `PATCH /users/me/experience`), not with M8's Save. The roles come with
 * `GET /users/me`, which M8 already holds, so a role being changed is read from it.
 */
export function RoleScreen({ roleId, onBack, onDone }: RoleScreenProps) {
  const me = useQuery({ queryKey: meKey, queryFn: fetchMe, enabled: roleId !== undefined });
  if (roleId === undefined) return <RoleForm_ role={null} onBack={onBack} onDone={onDone} />;
  const role = me.data?.experience?.find((one) => one.id === roleId) ?? null;
  if (role) return <RoleForm_ role={role} onBack={onBack} onDone={onDone} />;
  const gone = me.data !== undefined;
  if (me.isError || gone) {
    return (
      <ScreenFrame idPrefix="edit" keyboard titleLines={1} title="Edit role" onBack={onBack} gap={BODY_GAP} testID="role-problem">
        <ErrorState
          testID="role-error"
          title={gone ? 'This role is not here' : 'The role did not load'}
          message={gone ? 'It may have been removed.' : readFailure(me.error)}
          onRetry={gone ? undefined : () => void me.refetch()}
        />
      </ScreenFrame>
    );
  }
  return (
    <ScreenFrame idPrefix="edit" keyboard titleLines={1} title="Edit role" onBack={onBack} gap={BODY_GAP} testID="role-loading">
      <LoadingView label="Loading the role">
        <View style={{ gap: BODY_GAP }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={fieldMetrics.height} radius={fieldMetrics.radius} />
          ))}
        </View>
      </LoadingView>
    </ScreenFrame>
  );
}

function RoleForm_({ role, onBack, onDone }: { role: Role | null; onBack: () => void; onDone: () => void }) {
  const queryClient = useQueryClient();
  const scrollRef = useRef<ScrollView>(null);
  // What is saved now: the form is compared with this, so Save stays off until something differs.
  const [base] = useState<RoleForm>(() => (role ? roleFormFrom(role) : emptyRole));
  const [form, setForm] = useState<RoleForm>(base);
  const [banner, setBanner] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [asking, setAsking] = useState(false);

  const problems = roleProblems(form);
  const changes = role ? roleChanges(form, base) : null;
  const dirty = role ? changes !== null : (Object.keys(emptyRole) as (keyof RoleForm)[]).some((key) => form[key] !== emptyRole[key]);

  const finish = (announce: string) => {
    void queryClient.invalidateQueries({ queryKey: ['profile'] });
    AccessibilityInfo.announceForAccessibility(announce);
    onDone();
  };
  const save = useMutation({
    mutationFn: () => (role ? updateRole(role.id, changes ?? {}) : createRole(roleBody(form))),
    onMutate: () => setBanner(null),
    onSuccess: () => finish(role ? 'Role saved' : 'Role added'),
    onError: (error) => setBanner(roleFailure(error)),
  });
  const remove = useMutation({
    mutationFn: () => deleteRole((role as Role).id),
    onMutate: () => setBanner(null),
    onSuccess: () => {
      setAsking(false);
      finish('Role removed');
    },
    onError: (error) => {
      // Already gone (removed on another device): the same result as removing it here.
      if (isApiError(error) && error.kind === 'not_found') {
        setAsking(false);
        finish('Role removed');
        return;
      }
      setBanner(isApiError(error) && error.kind === 'network' ? error.message : 'The role was not removed. Try again.');
    },
  });

  const busy = save.isPending || remove.isPending;
  const canSave = isRoleComplete(form) && !hasRoleProblems(problems) && dirty && !busy;
  const change = (patch: Partial<RoleForm>) => {
    setForm((current) => ({ ...current, ...patch }));
    if (banner) setBanner(null);
  };
  const digits = (value: string, max: number) => value.replace(/\D/g, '').slice(0, max);
  const back = () => (dirty && !busy ? setLeaving(true) : onBack());

  return (
    <>
      <ScreenFrame
        idPrefix="edit"
        keyboard
        titleLines={1}
        testID="role-screen"
        title={role ? 'Edit role' : 'Add a role'}
        onBack={back}
        scrollRef={scrollRef}
        gap={BODY_GAP}
        action={{ label: 'Save', onPress: () => save.mutate(), disabled: !canSave, loading: save.isPending, testID: 'role-save' }}
      >
        {banner ? <Banner tone="danger" title="That did not work" body={banner} testID="role-banner" /> : null}
        <AuthField scrollRef={scrollRef} label="Role" testID="role-title" value={form.title} onChangeText={(title) => change({ title })} error={problems.title} placeholder="Founder, director" autoCapitalize="sentences" disabled={busy} />
        <AuthField scrollRef={scrollRef} label="Company" testID="role-company" value={form.company} onChangeText={(company) => change({ company })} error={problems.company} autoCapitalize="words" disabled={busy} />
        <AuthField scrollRef={scrollRef} label="Location" testID="role-location" value={form.location} onChangeText={(location) => change({ location })} error={problems.location} hint="Optional" placeholder="City, country" autoCapitalize="words" disabled={busy} />
        <View style={styles.group}>
          <View style={styles.pair}>
            <View style={styles.half}>
              <AuthField scrollRef={scrollRef} label="Start month" testID="role-from-month" value={form.fromMonth} onChangeText={(v) => change({ fromMonth: digits(v, 2) })} placeholder="MM" keyboardType="number-pad" maxLength={2} invalid={Boolean(problems.started)} disabled={busy} />
            </View>
            <View style={styles.half}>
              <AuthField scrollRef={scrollRef} label="Start year" testID="role-from-year" value={form.fromYear} onChangeText={(v) => change({ fromYear: digits(v, 4) })} placeholder="YYYY" keyboardType="number-pad" maxLength={4} invalid={Boolean(problems.started)} disabled={busy} />
            </View>
          </View>
          {problems.started ? (
            <Text variant="errorLine" testID="role-started-error">
              {problems.started}
            </Text>
          ) : null}
        </View>
        <GroupedList testID="role-current">
          <SwitchRow title="I work here now" on={form.current} onChange={(current) => change({ current })} busy={busy} testID="role-current-switch" />
        </GroupedList>
        {form.current ? null : (
          <View style={styles.group}>
            <View style={styles.pair}>
              <View style={styles.half}>
                <AuthField scrollRef={scrollRef} label="End month" testID="role-to-month" value={form.toMonth} onChangeText={(v) => change({ toMonth: digits(v, 2) })} placeholder="MM" keyboardType="number-pad" maxLength={2} invalid={Boolean(problems.ended)} disabled={busy} />
              </View>
              <View style={styles.half}>
                <AuthField scrollRef={scrollRef} label="End year" testID="role-to-year" value={form.toYear} onChangeText={(v) => change({ toYear: digits(v, 4) })} placeholder="YYYY" keyboardType="number-pad" maxLength={4} invalid={Boolean(problems.ended)} disabled={busy} />
              </View>
            </View>
            {problems.ended ? (
              <Text variant="errorLine" testID="role-ended-error">
                {problems.ended}
              </Text>
            ) : null}
          </View>
        )}
        <TextField
          multiline
          label="Description"
          testID="role-description"
          value={form.description}
          onChangeText={(description) => change({ description })}
          max={roleLimits.description}
          error={problems.description}
          placeholder="What did you do there?"
          autoCapitalize="sentences"
          disabled={busy}
        />
        {role ? <RemoveRow onPress={() => setAsking(true)} disabled={busy} /> : null}
      </ScreenFrame>
      <BottomSheet visible={leaving} onClose={() => setLeaving(false)} label="Discard your changes?" testID="role-discard">
        <Text variant="sheetTitleSm">Discard your changes?</Text>
        <Text variant="muted">What you changed has not been saved.</Text>
        <Button label="Keep editing" full onPress={() => setLeaving(false)} testID="role-keep" />
        <Button
          label="Discard changes"
          variant="secondary"
          full
          onPress={() => {
            setLeaving(false);
            onBack();
          }}
          testID="role-discard-confirm"
        />
      </BottomSheet>
      <BottomSheet visible={asking} onClose={() => setAsking(false)} dismissible={!remove.isPending} label="Remove this role?" testID="role-remove-sheet">
        <Text variant="sheetTitleSm">Remove this role?</Text>
        <Text variant="muted">It stops showing on your profile. This cannot be undone.</Text>
        {banner ? <Banner tone="danger" title="That did not work" body={banner} testID="role-remove-error" /> : null}
        <Button label="Keep this role" full onPress={() => setAsking(false)} disabled={remove.isPending} testID="role-remove-keep" />
        <Button label="Remove" variant="secondary" full loading={remove.isPending} onPress={() => remove.mutate()} testID="role-remove-confirm" />
      </BottomSheet>
    </>
  );
}

/** The quiet danger row under a role, the same one M35 has under a work: it asks before it does anything. */
function RemoveRow({ onPress, disabled }: { onPress: () => void; disabled?: boolean }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable testID="role-remove" accessibilityRole="button" accessibilityLabel="Remove this role" disabled={disabled} onPress={onPress} {...ring.handlers} style={[styles.remove, ring.style]}>
      <Icon name="Trash2" size={18} color={colors.danger} />
      <Text variant="body" style={[font(600), { color: colors.danger, fontSize: 14.5 }]}>
        Remove this role
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  group: { gap: space.sm },
  pair: { flexDirection: 'row', gap: PAIR_GAP },
  half: { flex: 1, minWidth: 0 },
  remove: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm, minHeight: layout.tapMin },
});
