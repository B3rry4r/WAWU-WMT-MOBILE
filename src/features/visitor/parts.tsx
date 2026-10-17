import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button, IconButton } from '@/components/Button';
import { Card } from '@/components/Card';
import { useFocusRing } from '@/components/focusRing';
import { IconTile } from '@/components/IconTile';
import { Icon } from '@/components/icon';
import { gradientEnds } from '@/components/MediaCard';
import { StatusPill } from '@/components/StatusPill';
import { Text } from '@/components/Text';
import { RoleRow, SkillChip } from '@/features/me/AboutTab';
import { coverHeight, headerMetrics } from '@/features/me/ProfileHeader';
import type { RoleLine } from '@/features/me/model';
import type { Work } from '@/features/works/api';
import { WorkCard } from '@/features/works/WorkCard';
import { canvasNormalLineHeight, font, layout, radius, space, useWawu } from '@/theme';

import { SEE_ALL, educationLine } from './model';
import type { Education } from './api';

/**
 * design/_gen/me.js line 20 (`profTop`, a visitor's: Back on the left, Share and the three dots on the right) and line 24
 * (`pubActions`): Follow 1 part, Message 1.3, the 44 round "₦" (18 at 700) on the card colour with a hairline ring, 8 between.
 * Message is drawn only when the screen it opens is wired (R-47); until then Follow and the tip button share the row.
 */
const actionMetrics = { gap: space.sm, tip: 44, tipFont: 18, messageGrow: 1.3 } as const;
const noop = () => undefined;

export type VisitorTopProps = {
  coverUrl: string | null;
  top: number;
  canShare: boolean;
  onBack: () => void;
  onShare: () => void;
  /** The three dots: the menu with Block (SETTINGS-04). Drawn only once the profile is loaded, since it acts on that person. */
  onOpenMenu?: () => void;
};

/** The cover, and the glass buttons over it: Back, Share and the menu. */
export function VisitorTop({ coverUrl, top, canShare, onBack, onShare, onOpenMenu }: VisitorTopProps) {
  const { colors } = useWawu();
  const ends = gradientEnds(180);
  return (
    <>
      <View testID="visitor-cover" style={[styles.cover, { height: coverHeight(top), backgroundColor: colors.surfaceSunken }]}>
        {coverUrl ? <Image source={{ uri: coverUrl }} contentFit="cover" style={StyleSheet.absoluteFill} /> : null}
        <LinearGradient
          pointerEvents="none"
          colors={[colors.mediaBlack30, colors.mediaBlack0]}
          locations={[0, headerMetrics.scrimEnd]}
          start={ends.start}
          end={ends.end}
          style={StyleSheet.absoluteFill}
        />
      </View>
      <View style={[styles.buttons, { top: top + headerMetrics.buttonsTop }]}>
        <IconButton icon="ChevronLeft" label="Back" tone="glass" size={headerMetrics.buttons} onPress={onBack} testID="visitor-back" />
        <View style={styles.right}>
          <IconButton icon="Share" label="Share this profile" tone="glass" size={headerMetrics.buttons} disabled={!canShare} onPress={onShare} testID="visitor-share" />
          {onOpenMenu ? <IconButton icon="Ellipsis" label="More" tone="glass" size={headerMetrics.buttons} onPress={onOpenMenu} testID="visitor-menu-button" /> : null}
        </View>
      </View>
    </>
  );
}

export type ActionsProps = {
  following: boolean;
  busy: boolean;
  onToggleFollow: () => void;
  /** The ₦ button opens the tip sheet (H26); not drawn when the route gives the page no way to pay (R-47). */
  onTip?: () => void;
  /** M33's pinned bar: Follow takes the whole row. */
  wide?: boolean;
  /**
   * Message with its price (I2), or "Messages off" (I8) when the Hub says the creator is not taking paid questions. Left out, nothing is
   * drawn: the route has not wired the ask sheet, or the Hub has not said yet (R-47).
   */
  ask?: { kind: 'on'; label: string; onPress: () => void } | { kind: 'off' };
};

/** Follow, then Following once the Hub holds the follow (M6); and the ₦ tip button. */
export function Actions({ following, busy, onToggleFollow, onTip, wide, ask }: ActionsProps) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <View style={styles.actions} testID="visitor-actions">
      <Button
        testID="visitor-follow"
        label={following ? 'Following' : 'Follow'}
        variant={following ? 'secondary' : 'primary'}
        size="md"
        selected={following}
        disabled={busy}
        onPress={onToggleFollow}
        style={styles.followButton}
      />
      {ask && !wide ? (
        ask.kind === 'on' ? (
          <Button testID="visitor-message" label={ask.label} icon="MessageCircle" variant="secondary" size="md" onPress={ask.onPress} style={styles.messageButton} />
        ) : (
          <Button testID="visitor-message-off" label="Messages off" icon="MessageCircleOff" variant="secondary" size="md" disabled onPress={noop} style={styles.messageButton} />
        )
      ) : null}
      {onTip && !wide ? (
        <Pressable
          testID="visitor-tip"
          accessibilityRole="button"
          accessibilityLabel="Tip"
          onPress={onTip}
          {...ring.handlers}
          style={({ pressed }) => [
            styles.tip,
            {
              backgroundColor: pressed ? colors.surfaceSunken : colors.surfaceCard,
              boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 1, color: colors.borderHairline, inset: true }],
            },
            ring.style,
          ]}
        >
          <Text variant="body" style={styles.tipMark}>
            ₦
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** design/_gen/kit.js line 38 (`foot`): 12 above, 20 at the sides, over the page colour, the buttons 10 apart. */
export function FootBar({ children, bottom }: { children: React.ReactNode; bottom: number }) {
  const { colors } = useWawu();
  return (
    <View testID="visitor-foot" style={[styles.foot, { backgroundColor: colors.surfacePage, paddingBottom: bottom + space.md }]}>
      {children}
    </View>
  );
}

/**
 * design/_gen/me.js line 57 and 61 to 64 (M33): cards with 16 inside, a 16 at 700 heading and a 13.5 at 600 accent link on the
 * right, 12 between the heading and what is under it, 10 between cards (kit `card`).
 */
const aboutMetrics = {
  cardPad: 16,
  between: 12,
  heading: 16,
  headline: 16,
  headlineLine: 1.3,
  more: 13.5,
  place: 13.5,
  placeIcon: 14,
  workWidth: 150,
  workGap: 10,
  stack: 10,
  schoolName: 14.5,
  schoolSub: 12.5,
  schoolSubGap: 2,
} as const;

export type IntroProps = { headline: string | null; place: string | null; openTo: readonly { label: string; lead: boolean }[] };

/** The first card: headline · company, where and since when, and the open-to chips. */
export function IntroCard({ headline, place, openTo }: IntroProps) {
  const { colors } = useWawu();
  if (!headline && !place && openTo.length === 0) return null;
  return (
    <Card testID="visitor-intro" style={styles.card}>
      <View style={styles.stack}>
        {headline ? (
          <Text variant="body" style={styles.headline} testID="visitor-headline">
            {headline}
          </Text>
        ) : null}
        {place ? (
          <View style={styles.place} testID="visitor-place">
            <Icon name="MapPin" size={aboutMetrics.placeIcon} color={colors.textMuted} />
            <Text variant="body" tone="textSecondary" style={styles.placeText}>
              {place}
            </Text>
          </View>
        ) : null}
        {openTo.length > 0 ? (
          <View style={styles.pills} testID="visitor-open-to">
            {openTo.map((chip) => (
              <StatusPill key={chip.label} label={chip.label} tone={chip.lead ? 'positive' : 'accent'} />
            ))}
          </View>
        ) : null}
      </View>
    </Card>
  );
}

function Block({ title, more, onMore, testID, children }: { title: string; more?: string; onMore?: () => void; testID: string; children: React.ReactNode }) {
  return (
    <Card testID={testID} style={styles.card}>
      <View style={styles.block}>
        <View style={styles.headingRow}>
          <Text variant="body" accessibilityRole="header" style={[styles.heading, styles.grow]}>
            {title}
          </Text>
          {more && onMore ? <MoreLink label={more} onPress={onMore} testID={`${testID}-more`} /> : null}
        </View>
        {children}
      </View>
    </Card>
  );
}

function MoreLink({ label, onPress, testID }: { label: string; onPress: () => void; testID: string }) {
  const ring = useFocusRing();
  return (
    <Pressable testID={testID} accessibilityRole="button" onPress={onPress} hitSlop={space.md} {...ring.handlers} style={ring.style}>
      <Text variant="body" tone="accentFg" style={styles.moreText}>
        {label}
      </Text>
    </Pressable>
  );
}

export type WorksCardProps = { works: readonly Work[]; count: number; onSeeAll: () => void; onOpenWork: (workId: string) => void };

/** Featured works: the first few as pictures with their role and year, running off the card's right edge, and "See all N". */
export function WorksCard({ works, count, onSeeAll, onOpenWork }: WorksCardProps) {
  if (works.length === 0) return null;
  return (
    <Block title="Featured works" more={SEE_ALL(count)} onMore={onSeeAll} testID="visitor-works">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.worksScroll} contentContainerStyle={styles.works}>
        {works.map((work) => (
          <View key={work.id} style={styles.workSlot}>
            <WorkCard work={work} onPress={() => onOpenWork(work.id)} testID={`visitor-work-${work.id}`} />
          </View>
        ))}
      </ScrollView>
    </Block>
  );
}

export function ExperienceCard({ roles }: { roles: readonly RoleLine[] }) {
  if (roles.length === 0) return null;
  return (
    <Block title="Experience" testID="visitor-experience">
      <View>
        {roles.map((role, i) => (
          <RoleRow key={role.id} role={role} last={i === roles.length - 1} />
        ))}
      </View>
    </Block>
  );
}

export function SkillsCard({ skills }: { skills: readonly string[] }) {
  if (skills.length === 0) return null;
  return (
    <Block title="Skills" testID="visitor-skills">
      <View style={styles.pills}>
        {skills.map((skill) => (
          <SkillChip key={skill} label={skill} />
        ))}
      </View>
    </Block>
  );
}

export function EducationCard({ rows }: { rows: readonly Education[] }) {
  if (rows.length === 0) return null;
  return (
    <Block title="Education" testID="visitor-education">
      <View style={styles.stack}>
        {rows.map((row) => (
          <View key={row.id} style={styles.school} testID={`visitor-school-${row.id}`}>
            <IconTile icon="GraduationCap" />
            <View style={styles.grow}>
              <Text variant="body" style={styles.schoolName}>
                {row.school}
              </Text>
              {educationLine(row) ? (
                <Text variant="meta" style={styles.schoolSub}>
                  {educationLine(row)}
                </Text>
              ) : null}
            </View>
          </View>
        ))}
      </View>
    </Block>
  );
}

const styles = StyleSheet.create({
  cover: { position: 'absolute', top: 0, left: 0, right: 0 },
  buttons: { position: 'absolute', left: layout.gutter, right: layout.gutter, flexDirection: 'row', justifyContent: 'space-between', zIndex: 1 },
  right: { flexDirection: 'row', gap: headerMetrics.buttonGap },
  actions: { flexDirection: 'row', alignItems: 'center', gap: actionMetrics.gap },
  followButton: { flex: 1 },
  messageButton: { flex: actionMetrics.messageGrow },
  tip: { width: actionMetrics.tip, height: actionMetrics.tip, borderRadius: radius.chip, alignItems: 'center', justifyContent: 'center' },
  tipMark: { ...font(700), fontSize: actionMetrics.tipFont, lineHeight: canvasNormalLineHeight(actionMetrics.tipFont) },
  foot: { paddingTop: space.md, paddingHorizontal: layout.gutter, gap: space.sm },
  // `Card` sets its own vertical padding, which a `padding` here would not beat.
  card: { paddingVertical: aboutMetrics.cardPad, paddingHorizontal: aboutMetrics.cardPad },
  stack: { gap: aboutMetrics.stack },
  block: { gap: aboutMetrics.between },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  grow: { flex: 1, minWidth: 0 },
  heading: { ...font(700), fontSize: aboutMetrics.heading, lineHeight: canvasNormalLineHeight(aboutMetrics.heading) },
  moreText: { ...font(600), fontSize: aboutMetrics.more, lineHeight: canvasNormalLineHeight(aboutMetrics.more) },
  headline: { ...font(700), fontSize: aboutMetrics.headline, lineHeight: aboutMetrics.headline * aboutMetrics.headlineLine },
  place: { flexDirection: 'row', alignItems: 'center', gap: space.xs + 2 },
  placeText: { fontSize: aboutMetrics.place, lineHeight: canvasNormalLineHeight(aboutMetrics.place), flexShrink: 1 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs + 2 },
  worksScroll: { marginRight: -aboutMetrics.cardPad },
  works: { gap: aboutMetrics.workGap, paddingRight: aboutMetrics.cardPad },
  workSlot: { width: aboutMetrics.workWidth },
  school: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  schoolName: { ...font(600), fontSize: aboutMetrics.schoolName, lineHeight: canvasNormalLineHeight(aboutMetrics.schoolName) },
  schoolSub: { fontSize: aboutMetrics.schoolSub, marginTop: aboutMetrics.schoolSubGap },
});
