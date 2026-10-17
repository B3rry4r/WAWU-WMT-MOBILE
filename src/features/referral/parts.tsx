import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, View } from 'react-native';

import { Banner } from '@/components/Banner';
import { Button, IconButton } from '@/components/Button';
import { Card } from '@/components/Card';
import { Icon, type IconName } from '@/components/icon';
import { IconTile } from '@/components/IconTile';
import { PointsFigure } from '@/components/PointsFigure';
import { Text } from '@/components/Text';
import { copyText } from '@/features/open-wallet/copy';
import { font, layout, radius, space, useWawu } from '@/theme';

import { formatCount, formatMultiplier, levelPills, NOBODY_YET, nextCard, type LevelPill } from './model';
import type { Referrals } from './api';

/**
 * design/_gen/referral.js, "Referral (RF)": the parts of RF1 to RF4, each as the board sets it.
 * - `linkCard`: a 16 card, the label, the link at 16 / 700 with Copy, the code at 13.5 with Copy, a medium Share button, 10 apart;
 * - `stat`: a sunken 16 tile, 10 by 12, the figure 18 / 700 over the word at 11.5, 2 apart, four across 8 apart;
 * - `levels`: five pills 34 high, 13 / 700, 6 apart (solid for the level, tinted behind it, outlined ahead);
 * - the next-milestone card: 12 by 14, a 40 accent trophy, 12 gap, the title 14.5 / 600 over a 12.5 line.
 */
export const inviteMetrics = {
  body: 14,
  linkGap: 10,
  linkSize: 16,
  codeSize: 13.5,
  codeTracking: 0.06,
  statsPadV: 14,
  statsGap: 14,
  tilesGap: 8,
  tilePadV: 10,
  tilePadH: 12,
  tileValue: 18,
  /** The Points tile's figure sets its line at 1.2 (PointsFigure); the other three tiles follow it so the four sit on one line. */
  tileLeading: 1.2,
  tileWord: 11.5,
  tileWordGap: 2,
  levelHead: 14,
  levelNote: 13,
  levelGap: 8,
  pillGap: 6,
  pill: 34,
  pillFont: 13,
  nextPadV: 12,
  nextPadH: 14,
  nextIcon: 40,
  nextGap: 12,
  nextTitle: 14.5,
  nextLine: 12.5,
  nextLineGap: 2,
} as const;

/** design/_gen/kit.js line 34, `nav`: a 56 bar, 20 sides, 12 gap, a 42 round button at each end, a 17 bold title. */
const navMetrics = { height: 56, button: 42, title: 17, titleTracking: -0.02 } as const;
/** kit.js line 61, `copyBtn`: 32 high, 12 at the sides, a pill on the sunken surface, the Copy glyph 14, the word 13 / 600, 6 between. */
const COPY = { height: 32, padX: 12, icon: 14, label: 13, iconGap: 6 } as const;
/** How long a Copy button says "Copied" before it reads "Copy" again (the wallet's own, A8). Default (agent), owner may override. */
const COPIED_MS = 2000;
/** The outlined pill's edge: the board's `inset 0 0 0 1px`. */
const pillEdge = 1;

export type NavBarProps = {
  title: string;
  onBack: () => void;
  /** The left button: a chevron (back) by default, a cross on the share card. */
  backIcon?: IconName;
  backLabel?: string;
  /** The control at the right end; an empty 42 square keeps the title centred when there is none. */
  right?: ReactNode;
  idPrefix: string;
};

/** The top bar of RF1, RF2 and RF4: a round button, the title, and a round button or nothing. */
export function NavBar({ title, onBack, backIcon = 'ChevronLeft', backLabel = 'Back', right, idPrefix }: NavBarProps) {
  return (
    <View style={styles.nav}>
      <IconButton icon={backIcon} label={backLabel} onPress={onBack} testID={`${idPrefix}-back`} />
      <Text variant="body" accessibilityRole="header" numberOfLines={1} style={[font(700), styles.navTitle]}>
        {title}
      </Text>
      {right ?? <View style={styles.navSpacer} />}
    </View>
  );
}

export type CopyPillProps = { value: string; label: string; testID: string };

/** Copy: puts `value` on the clipboard, then reads "Copied" for a moment, so it never says so when the phone refused. */
export function CopyPill({ value, label, testID }: CopyPillProps) {
  const { colors } = useWawu();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const copy = async () => {
    const done = await copyText(value);
    AccessibilityInfo.announceForAccessibility(done ? `${label} copied` : `Couldn't copy the ${label.toLowerCase()}`);
    if (!done) return;
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), COPIED_MS);
  };
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={copied ? 'Copied' : `Copy ${label.toLowerCase()}`}
      onPress={() => void copy()}
      hitSlop={space.sm}
      testID={testID}
      style={({ pressed }) => [styles.copy, { backgroundColor: pressed ? colors.borderHairline : colors.surfaceSunken }]}
    >
      <Icon name={copied ? 'Check' : 'Copy'} size={COPY.icon} color={colors.textPrimary} />
      <Text variant="body" style={[font(600), styles.copyLabel]}>
        {copied ? 'Copied' : 'Copy'}
      </Text>
    </Pressable>
  );
}

/** "Your link": the link and the code, each with Copy, and Share. */
export function LinkCard({ link, code, onShare }: { link: string; code: string; onShare: () => void }) {
  return (
    <Card padded testID="invite-link-card">
      <View style={styles.linkStack}>
        <Text variant="label">Your link</Text>
        <View style={styles.linkRow}>
          <Text variant="body" numberOfLines={1} style={[font(700), styles.link]} testID="invite-link">
            {link}
          </Text>
          <CopyPill value={link} label="Link" testID="invite-copy-link" />
        </View>
        <View style={styles.linkRow}>
          <Text variant="secondary" numberOfLines={1} style={styles.codeLine}>
            {'Code '}
            <Text variant="secondary" tone="textPrimary" style={[font(700), styles.code]} testID="invite-code">
              {code}
            </Text>
          </Text>
          <CopyPill value={code} label="Code" testID="invite-copy-code" />
        </View>
        <Button label="Share" icon="Share" size="md" full onPress={onShare} testID="invite-share" />
      </View>
    </Card>
  );
}

function Tile({ word, children, testID }: { word: string; children: ReactNode; testID: string }) {
  const { colors } = useWawu();
  return (
    <View testID={testID} style={[styles.tile, { backgroundColor: colors.surfaceSunken }]}>
      {children}
      <Text variant="caption" style={styles.tileWord}>
        {word}
      </Text>
    </View>
  );
}

function TileFigure({ value }: { value: number }) {
  return (
    <Text variant="body" numberOfLines={1} adjustsFontSizeToFit style={[font(700), styles.tileValue]}>
      {formatCount(value)}
    </Text>
  );
}

function Pill({ pill }: { pill: LevelPill }) {
  const { colors } = useWawu();
  const ahead = { boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: pillEdge, color: colors.borderStrong, inset: true }] };
  const look =
    pill.state === 'current'
      ? { ground: { backgroundColor: colors.accent }, ink: colors.textOnAccent }
      : pill.state === 'done'
        ? { ground: { backgroundColor: colors.accentTint }, ink: colors.accentFg }
        : { ground: ahead, ink: colors.textMuted };
  return (
    <View
      accessible
      accessibilityLabel={pill.state === 'current' ? `${pill.label}, your level` : pill.label}
      testID={`invite-level-${pill.state}`}
      style={[styles.pill, look.ground]}
    >
      <Text variant="body" numberOfLines={1} style={[font(700), styles.pillText, { color: look.ink }]}>
        {pill.label}
      </Text>
    </View>
  );
}

/** Brought, Verified, Points and Pending apart, then the level row. */
export function StatsCard({ view }: { view: Referrals }) {
  const pills = levelPills(view.ladder);
  return (
    <Card padded style={styles.statsCard} testID="invite-stats">
      <View style={styles.tiles}>
        <Tile word="Brought" testID="invite-brought">
          <TileFigure value={view.brought} />
        </Tile>
        <Tile word="Verified" testID="invite-verified">
          <TileFigure value={view.verified} />
        </Tile>
        <Tile word="Points" testID="invite-points">
          <PointsFigure count={view.pointsEarned} size="tile" fit testID="invite-points-figure" />
        </Tile>
        <Tile word="Pending" testID="invite-pending">
          <TileFigure value={view.pending} />
        </Tile>
      </View>
      <View style={styles.levels}>
        <View style={styles.levelHead}>
          <Text variant="body" style={[font(600), styles.levelTitle]}>
            Your level
          </Text>
          <Text variant="body" tone="textMuted" style={styles.levelNote} testID="invite-multiplier">
            {`Points earned ${formatMultiplier(view.multiplier)}`}
          </Text>
        </View>
        <View style={styles.pills}>
          {pills.map((pill, at) => (
            <Pill key={at} pill={pill} />
          ))}
        </View>
      </View>
    </Card>
  );
}

/** The next milestone: the trophy card, or the info note when one more person reaches it. Nothing once every milestone is reached. */
export function NextBlock({ view }: { view: Pick<Referrals, 'nextMilestone' | 'milestones'> }) {
  const { colors } = useWawu();
  const card = nextCard(view);
  if (!card) return null;
  if (card.kind === 'close') return <Banner tone="info" icon="Trophy" title={card.title} body={card.body} testID="invite-next-close" />;
  return (
    <Card padded style={styles.nextCard} testID="invite-next">
      <View style={styles.nextRow}>
        <IconTile icon="Trophy" tone="accent" size={inviteMetrics.nextIcon} />
        <View style={styles.nextText}>
          <Text variant="body" style={[font(600), styles.nextTitle]}>
            {card.title}
          </Text>
          <Text variant="caption" style={[styles.nextLine, { color: colors.textMuted }]}>
            {card.line}
          </Text>
        </View>
      </View>
    </Card>
  );
}

/** RF1a's line, drawn only while nobody has used the link. */
export function NobodyYet() {
  return (
    <Text variant="muted" style={styles.nobody} testID="invite-nobody">
      {NOBODY_YET}
    </Text>
  );
}

const styles = StyleSheet.create({
  nav: { height: navMetrics.height, paddingHorizontal: layout.gutter, flexDirection: 'row', alignItems: 'center', gap: space.md },
  navTitle: { flex: 1, textAlign: 'center', fontSize: navMetrics.title, letterSpacing: navMetrics.titleTracking * navMetrics.title },
  navSpacer: { width: navMetrics.button },
  copy: { height: COPY.height, paddingHorizontal: COPY.padX, borderRadius: radius.chip, flexDirection: 'row', alignItems: 'center', gap: COPY.iconGap, flexShrink: 0 },
  copyLabel: { fontSize: COPY.label },
  linkStack: { gap: inviteMetrics.linkGap },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: inviteMetrics.linkGap },
  link: { flex: 1, fontSize: inviteMetrics.linkSize },
  codeLine: { flex: 1, fontSize: inviteMetrics.codeSize },
  code: { fontSize: inviteMetrics.codeSize, letterSpacing: inviteMetrics.codeTracking * inviteMetrics.codeSize },
  statsCard: { paddingVertical: inviteMetrics.statsPadV, gap: inviteMetrics.statsGap },
  tiles: { flexDirection: 'row', gap: inviteMetrics.tilesGap },
  tile: { flex: 1, minWidth: 0, borderRadius: radius.input, paddingVertical: inviteMetrics.tilePadV, paddingHorizontal: inviteMetrics.tilePadH },
  tileValue: { fontSize: inviteMetrics.tileValue, lineHeight: Math.round(inviteMetrics.tileValue * inviteMetrics.tileLeading) },
  tileWord: { fontSize: inviteMetrics.tileWord, marginTop: inviteMetrics.tileWordGap },
  levels: { gap: inviteMetrics.levelGap },
  levelHead: { flexDirection: 'row', alignItems: 'center', gap: inviteMetrics.levelGap },
  levelTitle: { flex: 1, fontSize: inviteMetrics.levelHead },
  levelNote: { fontSize: inviteMetrics.levelNote },
  pills: { flexDirection: 'row', gap: inviteMetrics.pillGap },
  pill: { flex: 1, height: inviteMetrics.pill, borderRadius: radius.chip, alignItems: 'center', justifyContent: 'center' },
  pillText: { fontSize: inviteMetrics.pillFont },
  nextCard: { paddingVertical: inviteMetrics.nextPadV, paddingHorizontal: inviteMetrics.nextPadH },
  nextRow: { flexDirection: 'row', alignItems: 'center', gap: inviteMetrics.nextGap },
  nextText: { flex: 1 },
  nextTitle: { fontSize: inviteMetrics.nextTitle },
  nextLine: { fontSize: inviteMetrics.nextLine, marginTop: inviteMetrics.nextLineGap },
  nobody: { textAlign: 'center' },
});
