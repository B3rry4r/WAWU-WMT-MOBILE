import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { Text } from '@/components/Text';
import { TextField, fieldMetrics } from '@/components/TextField';
import { aboutMetrics } from '@/features/me/AboutTab';
import type { RoleLine } from '@/features/me/model';
import { canvasNormalLineHeight, font, radius, space, useWawu } from '@/theme';

import { MAX_ROLES } from './experience';
import { limits } from './limits';
import { addSkill, removeSkill } from './skills';

/** M8's own row: 52 high, 16 corner, 14 in from the sides, a 15 type (me.js line 35, `socField`), as the social links draw theirs. */
const rowMetrics = { minHeight: 52, padH: 14, padV: 8, between: 10, icon: 18, title: 15, sub: 12.5, subGap: 2 } as const;

export type ExperienceSectionProps = {
  roles: readonly RoleLine[];
  /** A role opens the role screen for it; `undefined` is a new one. */
  onOpen: (roleId?: string) => void;
  disabled?: boolean;
};

/**
 * M8's Experience (FIX-113, G-292; the board draws no such section, so it is built from M8's social rows: R-29, BACKEND_GAPS). Each
 * role is a row that opens it, and "Add a role" opens a new one. They save on their own screen, not with M8's Save.
 */
export function ExperienceSection({ roles, onOpen, disabled }: ExperienceSectionProps) {
  return (
    <View style={styles.section} testID="edit-experience">
      <Text variant="secondary" tone="textSecondary" style={styles.label}>
        Experience
      </Text>
      {roles.map((role) => (
        <RoleRow key={role.id} role={role} onPress={() => onOpen(role.id)} disabled={disabled} />
      ))}
      {roles.length < MAX_ROLES ? <AddRow label="Add a role" testID="edit-experience-add" onPress={() => onOpen()} disabled={disabled} /> : null}
    </View>
  );
}

function RoleRow({ role, onPress, disabled }: { role: RoleLine; onPress: () => void; disabled?: boolean }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID={`edit-role-${role.id}`}
      accessibilityRole="button"
      accessibilityLabel={[role.title, role.detail].filter(Boolean).join(', ')}
      accessibilityHint="Opens this role"
      disabled={disabled}
      onPress={onPress}
      {...ring.handlers}
      style={[styles.row, { backgroundColor: colors.surfaceInput, borderColor: colors.borderHairline }, ring.style]}
    >
      <View style={styles.words}>
        <Text variant="body" numberOfLines={1} style={[font(600), styles.rowTitle]}>
          {role.title}
        </Text>
        {role.detail ? (
          <Text variant="meta" numberOfLines={1} style={styles.rowSub}>
            {role.detail}
          </Text>
        ) : null}
      </View>
      <Icon name="ChevronRight" size={rowMetrics.icon} color={colors.textMuted} />
    </Pressable>
  );
}

function AddRow({ label, testID, onPress, disabled }: { label: string; testID: string; onPress: () => void; disabled?: boolean }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      {...ring.handlers}
      style={[styles.row, { backgroundColor: colors.surfaceInput, borderColor: colors.borderHairline }, ring.style]}
    >
      <Icon name="Plus" size={rowMetrics.icon} color={colors.textMuted} />
      <Text variant="body" tone="textMuted" style={styles.addText}>
        {label}
      </Text>
    </Pressable>
  );
}

export type SkillsSectionProps = {
  skills: readonly string[];
  onChange: (skills: string[]) => void;
  disabled?: boolean;
};

/**
 * M8's Skills and expertise (FIX-113, G-292; built from the kit's field and M4's skill chips: R-29, BACKEND_GAPS). Typing a skill and
 * pressing return adds it as a chip, and a chip taps off. They are saved with M8's Save (`PATCH /users/me/profile-fields`).
 */
export function SkillsSection({ skills, onChange, disabled }: SkillsSectionProps) {
  const [typed, setTyped] = useState('');
  const [problem, setProblem] = useState<string | undefined>();
  const add = () => {
    if (typed.trim() === '') return;
    const next = addSkill(skills, typed);
    setProblem(next.problem);
    if (next.problem === undefined) {
      setTyped('');
      onChange(next.list);
    }
  };
  return (
    <View style={styles.section} testID="edit-skills">
      <TextField
        label="Skills and expertise"
        testID="edit-skill-input"
        value={typed}
        onChangeText={(value) => {
          setTyped(value);
          if (problem) setProblem(undefined);
        }}
        onSubmitEditing={add}
        returnKeyType="done"
        blurOnSubmit={false}
        error={problem}
        hint={skills.length > 0 ? 'Press return to add. Tap a skill to remove it.' : 'Press return to add a skill.'}
        placeholder="Add a skill"
        maxLength={limits.skill + 1}
        autoCapitalize="sentences"
        disabled={disabled}
      />
      {skills.length > 0 ? (
        <View style={styles.chips} testID="edit-skill-chips">
          {skills.map((skill) => (
            <SkillChip key={skill} label={skill} onRemove={() => onChange(removeSkill(skills, skill))} disabled={disabled} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function SkillChip({ label, onRemove, disabled }: { label: string; onRemove: () => void; disabled?: boolean }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID={`edit-skill-${label}`}
      accessibilityRole="button"
      accessibilityLabel={`Remove ${label}`}
      disabled={disabled}
      onPress={onRemove}
      {...ring.handlers}
      style={[styles.chip, { borderColor: colors.borderStrong }, ring.style]}
    >
      <Text variant="body" style={styles.chipText}>
        {label}
      </Text>
      <Icon name="X" size={aboutMetrics.chip} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: { gap: space.sm },
  label: { ...font(600), fontSize: fieldMetrics.label },
  row: {
    minHeight: rowMetrics.minHeight,
    borderRadius: radius.input,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: rowMetrics.between,
    paddingHorizontal: rowMetrics.padH,
    paddingVertical: rowMetrics.padV,
  },
  words: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: rowMetrics.title },
  rowSub: { fontSize: rowMetrics.sub, marginTop: rowMetrics.subGap },
  addText: { flex: 1, fontSize: rowMetrics.title },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: aboutMetrics.chipGap },
  chip: {
    height: aboutMetrics.chipH,
    paddingHorizontal: aboutMetrics.chipPad,
    borderRadius: radius.chip,
    borderWidth: aboutMetrics.chipRing,
    flexDirection: 'row',
    alignItems: 'center',
    gap: aboutMetrics.chipGap,
  },
  chipText: { ...font(600), fontSize: aboutMetrics.chip, lineHeight: canvasNormalLineHeight(aboutMetrics.chip) },
});
