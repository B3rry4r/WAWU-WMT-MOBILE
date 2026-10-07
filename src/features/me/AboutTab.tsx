import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/Card';
import { useFocusRing } from '@/components/focusRing';
import { Icon, type IconName } from '@/components/icon';
import { Text } from '@/components/Text';
import { canvasNormalLineHeight, font, radius, space, useWawu } from '@/theme';
import type { Work } from '@/features/works/api';
import { stillOf } from '@/features/works/model';
import { WorkCover } from '@/features/works/WorkCover';

import type { RoleLine } from './model';
import { readableLink } from './model';

/**
 * design/_gen/me.js line 31, `about`: cards 10 apart, 14 by 16 inside. Works: a 14.5 at 700 heading with
 * "+ Add" (13.5 at 700, accent, a 15 plus at 2.4, 4 between), three 72 high pictures 8 apart with 12 corners,
 * 10 below the heading. The about card: 14 at 1.5 secondary, then 15 muted icons 8 from 13.5 words, 9 apart.
 * Experience (line 30, `role`): a 10 accent dot 5 down, a 2 wide hairline under it 4 below, 12 to the words,
 * 14 under each role but the last, 14.5 at 600 and 13 muted 2 under. Skills: 30 high outlined chips, 12 in,
 * 13 at 600, 6 apart (the chip's ring is a 1 border here, so 11 of the 12 is padding).
 */
const aboutMetrics = {
  between: 10,
  padV: 14,
  padH: 16,
  heading: 14.5,
  add: 13.5,
  addIcon: 15,
  addStroke: 2.4,
  addGap: 4,
  stack: 10,
  thumbH: 72,
  thumbGap: 8,
  thumbRadius: 12,
  bio: 14,
  bioLine: 1.5,
  factIcon: 15,
  factGap: 8,
  factStack: 9,
  fact: 13.5,
  dot: 10,
  dotTop: 5,
  rail: 2,
  railTop: 4,
  roleGap: 12,
  roleUnder: 14,
  roleTitle: 14.5,
  roleSub: 13,
  roleSubGap: 2,
  expStack: 12,
  chipH: 30,
  chipPad: 11,
  chipRing: 1,
  chip: 13,
  chipGap: 6,
} as const;

export type AboutFacts = { bio: string | null; location: string | null; memberSince: string | null; website: string | null };

export type AboutTabProps = {
  works: readonly Work[];
  facts: AboutFacts;
  roles: readonly RoleLine[];
  skills: readonly string[];
  onAddWork: () => void;
  onOpenWork: (workId: string) => void;
  onOpenWebsite: (url: string) => void;
};

/** M4: featured works with Add, the about card, experience and skills. A card with nothing in it is left out, except the works card, which is where Add lives. */
export function AboutTab({ works, facts, roles, skills, onAddWork, onOpenWork, onOpenWebsite }: AboutTabProps) {
  const hasFacts = Boolean(facts.bio || facts.location || facts.memberSince || facts.website);
  return (
    <View testID="me-about" style={styles.list}>
      <Card testID="me-works" style={styles.card}>
        <View style={styles.stack}>
          <View style={styles.headingRow}>
            <Text variant="body" accessibilityRole="header" style={[styles.heading, styles.grow]}>
              Featured works
            </Text>
            <AddLink onPress={onAddWork} />
          </View>
          {works.length > 0 ? (
            <View style={styles.thumbs}>
              {works.map((work) => (
                <WorkThumb key={work.id} work={work} onPress={() => onOpenWork(work.id)} />
              ))}
            </View>
          ) : (
            <Text variant="meta" testID="me-works-empty">
              Add a work and it shows on your profile.
            </Text>
          )}
        </View>
      </Card>

      {hasFacts ? (
        <Card testID="me-facts" style={styles.card}>
          <View style={styles.facts}>
            {facts.bio ? (
              <Text variant="body" tone="textSecondary" style={styles.bio} testID="me-about-bio">
                {facts.bio}
              </Text>
            ) : null}
            {facts.location ? <Fact icon="MapPin" text={facts.location} testID="me-about-location" /> : null}
            {facts.memberSince ? <Fact icon="Calendar" text={facts.memberSince} testID="me-about-since" /> : null}
            {facts.website ? <WebsiteFact url={facts.website} onPress={() => onOpenWebsite(facts.website as string)} /> : null}
          </View>
        </Card>
      ) : null}

      {roles.length > 0 ? (
        <Card testID="me-experience" style={styles.card}>
          <View style={styles.experience}>
            <Text variant="body" accessibilityRole="header" style={styles.heading}>
              Experience
            </Text>
            {roles.map((role, i) => (
              <RoleRow key={role.id} role={role} last={i === roles.length - 1} />
            ))}
          </View>
        </Card>
      ) : null}

      {skills.length > 0 ? (
        <Card testID="me-skills" style={styles.card}>
          <View style={styles.stack}>
            <Text variant="body" accessibilityRole="header" style={styles.heading}>
              Skills and expertise
            </Text>
            <View style={styles.chips}>
              {skills.map((skill) => (
                <SkillChip key={skill} label={skill} />
              ))}
            </View>
          </View>
        </Card>
      ) : null}
    </View>
  );
}

function AddLink({ onPress }: { onPress: () => void }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable testID="me-works-add" accessibilityRole="button" accessibilityLabel="Add a featured work" onPress={onPress} hitSlop={space.md} {...ring.handlers} style={[styles.add, ring.style]}>
      <Icon name="Plus" size={aboutMetrics.addIcon} color={colors.accentFg} strokeWidth={aboutMetrics.addStroke} />
      <Text variant="body" tone="accentFg" style={styles.addText}>
        Add
      </Text>
    </Pressable>
  );
}

function WorkThumb({ work, onPress }: { work: Work; onPress: () => void }) {
  const ring = useFocusRing();
  const { colors } = useWawu();
  return (
    <Pressable
      testID={`me-work-${work.id}`}
      accessibilityRole="button"
      accessibilityLabel={`Open ${work.title}`}
      onPress={onPress}
      {...ring.handlers}
      style={[styles.thumb, { backgroundColor: colors.surfaceSunken }, ring.style]}
    >
      <WorkCover media={stillOf(work)} />
    </Pressable>
  );
}

function Fact({ icon, text, testID }: { icon: IconName; text: string; testID: string }) {
  const { colors } = useWawu();
  return (
    <View style={styles.fact} testID={testID}>
      <Icon name={icon} size={aboutMetrics.factIcon} color={colors.textMuted} />
      <Text variant="body" style={styles.factText}>
        {text}
      </Text>
    </View>
  );
}

function WebsiteFact({ url, onPress }: { url: string; onPress: () => void }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const shown = readableLink(url);
  return (
    <Pressable testID="me-about-website" accessibilityRole="link" accessibilityLabel={`Open ${shown}`} onPress={onPress} {...ring.handlers} style={[styles.fact, ring.style]}>
      <Icon name="Globe" size={aboutMetrics.factIcon} color={colors.textMuted} />
      <Text variant="body" style={styles.factText}>
        {shown}
      </Text>
    </Pressable>
  );
}

function RoleRow({ role, last }: { role: RoleLine; last: boolean }) {
  const { colors } = useWawu();
  return (
    <View style={styles.role} testID={`me-role-${role.id}`}>
      <View style={styles.railCol}>
        <View style={[styles.dot, { backgroundColor: colors.accent }]} />
        {last ? null : <View style={[styles.rail, { backgroundColor: colors.borderHairline }]} />}
      </View>
      <View style={last ? undefined : styles.roleBody}>
        <Text variant="body" style={styles.roleTitle}>
          {role.title}
        </Text>
        {role.detail ? (
          <Text variant="meta" style={styles.roleSub}>
            {role.detail}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function SkillChip({ label }: { label: string }) {
  const { colors } = useWawu();
  return (
    <View style={[styles.chip, { borderColor: colors.borderStrong }]}>
      <Text variant="body" style={styles.chipText}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: aboutMetrics.between },
  card: { paddingVertical: aboutMetrics.padV, paddingHorizontal: aboutMetrics.padH },
  stack: { gap: aboutMetrics.stack },
  headingRow: { flexDirection: 'row', alignItems: 'center' },
  grow: { flex: 1 },
  heading: { ...font(700), fontSize: aboutMetrics.heading, lineHeight: canvasNormalLineHeight(aboutMetrics.heading) },
  add: { flexDirection: 'row', alignItems: 'center', gap: aboutMetrics.addGap },
  addText: { ...font(700), fontSize: aboutMetrics.add, lineHeight: canvasNormalLineHeight(aboutMetrics.add) },
  thumbs: { flexDirection: 'row', gap: aboutMetrics.thumbGap },
  thumb: { flex: 1, height: aboutMetrics.thumbH, borderRadius: aboutMetrics.thumbRadius, overflow: 'hidden' },
  facts: { gap: aboutMetrics.factStack },
  bio: { fontSize: aboutMetrics.bio, lineHeight: aboutMetrics.bio * aboutMetrics.bioLine },
  fact: { flexDirection: 'row', alignItems: 'center', gap: aboutMetrics.factGap },
  factText: { fontSize: aboutMetrics.fact, lineHeight: canvasNormalLineHeight(aboutMetrics.fact), flexShrink: 1 },
  experience: { gap: aboutMetrics.expStack },
  role: { flexDirection: 'row', gap: aboutMetrics.roleGap },
  railCol: { alignItems: 'center' },
  dot: { width: aboutMetrics.dot, height: aboutMetrics.dot, borderRadius: radius.chip, marginTop: aboutMetrics.dotTop },
  rail: { flex: 1, width: aboutMetrics.rail, marginTop: aboutMetrics.railTop },
  roleBody: { paddingBottom: aboutMetrics.roleUnder },
  roleTitle: { ...font(600), fontSize: aboutMetrics.roleTitle, lineHeight: canvasNormalLineHeight(aboutMetrics.roleTitle) },
  roleSub: { fontSize: aboutMetrics.roleSub, marginTop: aboutMetrics.roleSubGap },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: aboutMetrics.chipGap },
  chip: { height: aboutMetrics.chipH, paddingHorizontal: aboutMetrics.chipPad, borderRadius: radius.chip, borderWidth: aboutMetrics.chipRing, justifyContent: 'center' },
  chipText: { ...font(600), fontSize: aboutMetrics.chip, lineHeight: canvasNormalLineHeight(aboutMetrics.chip) },
});
