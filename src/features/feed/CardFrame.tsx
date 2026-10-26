import { LinearGradient } from 'expo-linear-gradient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Children, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useFocusRing } from '@/components/focusRing';
import { PositionedImage } from '@/components/PositionedImage';
import { useIsCreator } from '@/features/create/CreateEntry';
import { Icon, VerifiedTick, type IconName } from '@/components/icon';
import { setFollowing } from '@/features/home/api';
import { radius, useWawu, type ColorToken } from '@/theme';

import { feedKey, followingCountKey } from './api';
import { cardMetrics as m, media, metrics, words } from './look';
import { hueFor } from './model';
import { fromTop } from './PostFrame';
import { fromPostBottom } from './parts';

/**
 * What the creator card (H9) and the professional card (H10) share: a full-screen frame with the
 * person's portrait behind it, a pill at the top and the words stacked from the foot, and the
 * pieces those words are made of (a stats panel, buttons). The two cards draw the same in the
 * light and the dark theme, as every post does: they sit over a picture.
 */
export type CardFrameProps = {
  width: number;
  height: number;
  chromeTop: number;
  /** The portrait: the person's cover, else their photo. Without one the frame is their colour. */
  portrait: string | null;
  wawuId: string;
  pill: ReactNode;
  children: ReactNode;
  testID?: string;
};

function Portrait({ uri, wawuId, chromeTop }: { uri: string | null; wawuId: string; chromeTop: number }) {
  const { colors } = useWawu();
  if (uri) return <PositionedImage testID="card-portrait" uri={uri} />;
  const hue = hueFor(wawuId);
  const token = `hue${hue.charAt(0).toUpperCase()}${hue.slice(1)}` as ColorToken;
  return (
    <View testID="card-portrait-none" style={[StyleSheet.absoluteFill, { backgroundColor: colors[token] }]}>
      <View style={[styles.disc, { top: fromTop(chromeTop, m.discTop), backgroundColor: media.chipEdge }]} />
    </View>
  );
}

export function CardFrame({ width, height, chromeTop, portrait, wawuId, pill, children, testID }: CardFrameProps) {
  return (
    <View testID={testID} style={[styles.page, { width, height, backgroundColor: media.black }]}>
      <Portrait uri={portrait} wawuId={wawuId} chromeTop={chromeTop} />
      <LinearGradient
        pointerEvents="none"
        colors={media.cardScrim.colors as unknown as [string, string, ...string[]]}
        locations={media.cardScrim.locations as unknown as [number, number, ...number[]]}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={[styles.pill, { top: fromTop(chromeTop, m.pillTop) }]}>
        {pill}
      </View>
      <View pointerEvents="box-none" style={[styles.foot, { bottom: fromPostBottom(metrics.captionBottom) }]}>
        {children}
      </View>
    </View>
  );
}

/** The name at 32, its tick, and the line under it. */
export function CardName({ name, tick, line, testID }: { name: string; tick: 'creator' | 'pro' | null; line: string; testID?: string }) {
  return (
    <View style={styles.nameBlock}>
      <View style={styles.nameRow}>
        <Text testID={testID} numberOfLines={2} style={[words.cardName, styles.shrink, { color: media.ink }]}>
          {name}
        </Text>
        {tick ? <VerifiedTick kind={tick} size={m.tick} /> : null}
      </View>
      {line ? <Text style={[words.cardLine, { color: media.ink }]}>{line}</Text> : null}
    </View>
  );
}

/** The glass panel the stats sit in. */
export function StatsPanel({ children, testID }: { children: ReactNode; testID?: string }) {
  return (
    <View testID={testID} style={[styles.panel, { backgroundColor: media.glass, borderColor: media.glassEdge }]}>
      {children}
    </View>
  );
}

/** One stat: a bold figure (with a star before it, for a rating) over a small label. */
export function Stat({ value, label, star = false, testID }: { value: string; label: string; star?: boolean; testID?: string }) {
  return (
    <View style={styles.stat} testID={testID} accessible accessibilityLabel={`${value} ${label}`}>
      <View style={styles.statValue}>
        {star ? <Icon name="Star" size={m.star} color={media.star} fill={media.star} strokeWidth={1.8} /> : null}
        <Text style={[words.statValue, { color: media.ink }]}>{value}</Text>
      </View>
      <Text style={[words.statLabel, { color: media.ink }]}>{label}</Text>
    </View>
  );
}

export type CardButtonTone = 'primary' | 'glass' | 'light';

/** A card's button: the accent Follow, the white Message, or the glass Profile. */
export function CardButton({
  label,
  icon,
  tone,
  onPress,
  busy = false,
  grow = 1,
  testID,
}: {
  label: string;
  icon?: IconName;
  tone: CardButtonTone;
  onPress: () => void;
  busy?: boolean;
  grow?: number;
  testID?: string;
}) {
  const ring = useFocusRing();
  const ink = tone === 'light' ? media.inkOnLight : media.ink;
  const background = tone === 'primary' ? media.accent : tone === 'light' ? media.ink : media.glass;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ busy }}
      onPress={busy ? undefined : onPress}
      {...ring.handlers}
      style={[styles.button, { flexGrow: grow, backgroundColor: background, borderColor: tone === 'glass' ? media.glassEdge : background }, busy && styles.busy, ring.style]}
    >
      {icon ? <Icon name={icon} size={m.buttonIcon} color={ink} strokeWidth={2.4} /> : null}
      <Text style={[words.button, { color: ink }]}>{label}</Text>
    </Pressable>
  );
}

/**
 * The row of buttons at the foot, stopping short of the Create button as the boards draw it (Message and Profile, Follow and Profile).
 * A lone button (the other is hidden: Message off, no Profile wired) fills that same row for a viewer who sees the Create button, so
 * it never runs under it, and the whole row for anyone else (SWEEP-R3, R2-SOCIAL3 verifier low 1, lead ruling).
 */
export function ButtonRow({ children }: { children: ReactNode }) {
  if (Children.toArray(children).length !== 1) return <View testID="card-buttons" style={styles.buttons}>{children}</View>;
  return <LoneButtonRow>{children}</LoneButtonRow>;
}

/** Only a lone button asks who is looking: `useIsCreator` is the answer that decides the Create button, so the two always agree. */
function LoneButtonRow({ children }: { children: ReactNode }) {
  const clearOfCreate = useIsCreator();
  return (
    <View testID="card-buttons" style={[styles.buttons, !clearOfCreate && styles.buttonsAlone]}>
      {children}
    </View>
  );
}

/**
 * Follow and Following on a card. The change is drawn at once and put right by the Hub's answer
 * (or put back, with a line saying so, when the Hub refuses). A follow also marks the Following feed
 * and its count as out of date, so they are read again the next time they are shown.
 */
export function useCardFollow(wawuId: string, initial: boolean) {
  const client = useQueryClient();
  const [on, setOn] = useState(initial);
  const [failed, setFailed] = useState(false);
  const change = useMutation({
    mutationFn: (next: boolean) => setFollowing(wawuId, next),
    onSuccess: (following) => {
      setOn(following);
      void client.invalidateQueries({ queryKey: feedKey('following'), refetchType: 'none' });
      void client.invalidateQueries({ queryKey: followingCountKey, refetchType: 'none' });
    },
    onError: (_error, next) => {
      setOn(!next);
      setFailed(true);
    },
  });
  return {
    on,
    busy: change.isPending,
    failed,
    toggle: () => {
      if (change.isPending) return;
      setFailed(false);
      const next = !on;
      setOn(next);
      change.mutate(next);
    },
  };
}

const styles = StyleSheet.create({
  page: { overflow: 'hidden' },
  disc: { position: 'absolute', alignSelf: 'center', width: m.disc, height: m.disc, borderRadius: radius.chip },
  pill: { position: 'absolute', left: m.side, zIndex: 6 },
  foot: { position: 'absolute', left: m.side, right: m.side, gap: m.stack, zIndex: 6 },
  nameBlock: { gap: m.nameStack },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: m.nameGap },
  shrink: { flexShrink: 1 },
  panel: { flexDirection: 'row', gap: m.panelGap, paddingVertical: m.panelPadV, paddingHorizontal: m.panelPadH, borderRadius: m.panelRadius, borderWidth: 1 },
  stat: { flex: 1, gap: m.statGap },
  statValue: { flexDirection: 'row', alignItems: 'center', gap: m.starGap },
  buttons: { flexDirection: 'row', gap: m.buttonGap, marginRight: m.buttonRight },
  buttonsAlone: { marginRight: 0 },
  button: {
    flexBasis: 0,
    height: m.buttonH,
    borderRadius: radius.chip,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m.buttonInner,
  },
  busy: { opacity: 0.6 },
});
