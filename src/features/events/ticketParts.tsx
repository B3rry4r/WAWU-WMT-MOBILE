import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { Button, IconButton } from '@/components/Button';
import { BrandMark } from '@/components/BrandMark';
import { useFocusRing } from '@/components/focusRing';
import { Icon, type IconName } from '@/components/icon';
import { gradientEnds } from '@/components/MediaCard';
import { StatusPill } from '@/components/StatusPill';
import { Text } from '@/components/Text';
import { canvasNormalLineHeight, font, layout, radius, space, useWawu } from '@/theme';
import { lightColors } from '@/theme/tokens.generated';

import { DateBadge } from './parts';
import { qrModules } from './qr';
import { groupLine, holderLine, ticketHeadline, ticketToOpen } from './ticketFormat';
import type { HeldGroup, HeldTicket } from './ticketsApi';

/** design/_gen/kit.js `nav`: a 56 bar, 20 sides, a 42 round button, a 17 bold title between, a 42 spacer after. */
export const navMetrics = { height: 56, button: 42, title: 17, titleTracking: -0.02, titleNudge: 2 } as const;

/** design/_gen/events.js `myTickets`: 8 above the body, 12 between the chips and each row; a row is 12 in, 12 between, 20 round. */
export const listMetrics = { top: 8, stack: 12, bottom: 40, rowPad: 12, between: 12, title: 15, line: 12.5, lineGap: 3, qrIcon: 22 } as const;

/**
 * design/_gen/events.js `ticketCard` and kit.js `qr`: a card 28 round (no radius token has 28: the nearest, `money` 26, is used),
 * a 110 high picture with its words 16 in and 12 up, 18 padding, 12 between, the plate 190 square and 24 round,
 * the logo a fifth of it, the code 15 bold at 0.08em, the tier line 13.
 */
export const cardMetrics = {
  banner: 110,
  wordsInset: 16,
  wordsBottom: 12,
  name: 17,
  line: 12.5,
  lineOpacity: 0.8,
  /** The whole card greyed, E11 (a called-off event). */
  dimmed: 0.45,
  lineGap: 2,
  pad: 18,
  stack: 12,
  plate: 190,
  plateCorner: 24,
  logoShare: 0.12,
  logoWidth: 0.85,
  logoCorner: 14,
  code: 15,
  codeTracking: 0.08,
  holder: 13,
} as const;

/** design/_gen/kit.js `banner`: 14 above and below, the icon 1 down, 3 between title and text. */
const noteMetrics = { padV: 14, iconNudge: 1, inner: 3 } as const;

/** The top bar: a back button, the title, and a spacer that keeps the title centred. */
export function TicketNav({ title, onBack, backTestID }: { title: string; onBack: () => void; backTestID: string }) {
  return (
    <View style={styles.nav}>
      <IconButton icon="ChevronLeft" label="Back" onPress={onBack} testID={backTestID} />
      <Text variant="body" accessibilityRole="header" numberOfLines={1} style={[styles.navTitle, font(700)]}>
        {title}
      </Text>
      <View style={styles.navSpacer} />
    </View>
  );
}

/** design/_gen/kit.js `banner` in its info and warning tones: 18 round, 14 by 16 in, a 19 icon, 12 between, 3 between title and text. */
export function Note({ tone, icon, title, body, testID }: { tone: 'info' | 'warning'; icon: IconName; title: string; body: string; testID?: string }) {
  const { colors } = useWawu();
  return (
    <View
      testID={testID}
      accessibilityRole="summary"
      style={[styles.note, { backgroundColor: tone === 'info' ? colors.infoTint : colors.warningTint }]}
    >
      <View style={styles.noteIcon}>
        <Icon name={icon} size={19} color={tone === 'info' ? colors.info : colors.warning} strokeWidth={2.2} />
      </View>
      <View style={styles.noteText}>
        <Text variant="kvValue">{title}</Text>
        <Text variant="bannerBody">{body}</Text>
      </View>
    </View>
  );
}

/** The standard's quiet zone: four empty squares all round. */
const QUIET = 4;

/** The code as a picture, dark on white in either theme so a door scanner can read it. It draws exactly the text it is given. */
export function Qr({ value, size, testID, label = 'Ticket QR code' }: { value: string; size: number; testID?: string; label?: string }) {
  const path = useMemo(() => {
    const modules = qrModules(value);
    let d = '';
    modules.forEach((row, y) => {
      row.forEach((dark, x) => {
        if (dark) d += `M${x + QUIET} ${y + QUIET}h1v1h-1z`;
      });
    });
    return { d, count: modules.length };
  }, [value]);
  const span = path.count + QUIET * 2;
  return (
    <Svg testID={testID} accessibilityLabel={label} width={size} height={size} viewBox={`0 0 ${span} ${span}`}>
      <Rect width={span} height={span} fill={lightColors.surfaceCard} />
      <Path d={path.d} fill={lightColors.textPrimary} />
    </Svg>
  );
}

/** E7 and E12: the event's picture and name, the QR plate, the code, and who it is for. */
/** `dimmed` greys the whole card, as E11 draws the ticket of an event that was called off (the board's .45). */
export function TicketCard({ ticket, showCode, now, dimmed }: { ticket: HeldTicket; showCode: boolean; now?: number; dimmed?: boolean }) {
  const { colors, gradients } = useWawu();
  const ends = gradientEnds(gradients.scrimCard.angle);
  const { event } = ticket;
  const logo = cardMetrics.plate * cardMetrics.logoShare;
  return (
    <View testID="ticket-card" style={[styles.card, { backgroundColor: colors.surfaceCard }, dimmed ? { opacity: cardMetrics.dimmed } : null]}>
      <View style={[styles.banner, { backgroundColor: colors.surfaceCardInk }]}>
        {event.bannerUrl ? <Image source={event.bannerUrl} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityElementsHidden /> : null}
        <LinearGradient
          pointerEvents="none"
          colors={gradients.scrimCard.colors as unknown as readonly [string, string, ...string[]]}
          locations={gradients.scrimCard.locations as unknown as readonly [number, number, ...number[]]}
          start={ends.start}
          end={ends.end}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.bannerWords}>
          <Text variant="body" tone="textOnAccent" numberOfLines={2} style={[font(700), styles.bannerName]}>
            {event.name}
          </Text>
          <Text variant="body" tone="textOnAccent" numberOfLines={2} style={styles.bannerLine}>
            {ticketHeadline(event, now)}
          </Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        {showCode ? (
          <View style={[styles.plate, { backgroundColor: lightColors.surfaceCard, borderColor: lightColors.borderHairline }]}>
            <Qr value={ticket.code} size={cardMetrics.plate} testID="ticket-qr" />
            <View style={[styles.logo, { width: logo, height: logo, borderRadius: cardMetrics.logoCorner, backgroundColor: lightColors.surfaceCard }]}>
              <BrandMark layout="submark" surface="light" width={logo * cardMetrics.logoWidth} decorative />
            </View>
          </View>
        ) : null}
        {showCode ? (
          <Text variant="body" selectable testID="ticket-code" style={[font(700), styles.code]}>
            {ticket.code}
          </Text>
        ) : null}
        <Text variant="body" tone="textMuted" testID="ticket-holder" style={styles.holder}>
          {holderLine(ticket)}
        </Text>
      </View>
      <View pointerEvents="none" style={[styles.edge, { borderRadius: radius.money, borderColor: colors.borderHairline }]} />
    </View>
  );
}

/** Shown above data that is already on screen when a refetch fails: the data stays, and this says so with a retry. */
export function RefreshFailed({ message, onRetry, testID }: { message: string; onRetry: () => void; testID: string }) {
  return (
    <View testID={testID} accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.refresh}>
      <Text variant="secondary" tone="textSecondary" style={styles.refreshText}>
        {message}
      </Text>
      <Button label="Try again" variant="secondary" size="md" onPress={onRetry} />
    </View>
  );
}

/**
 * E6's row: the date, the event, "2 × VIP", and a QR mark; it opens the first ticket that can still be scanned. A called-off event's row
 * says so in the mark's place (a ticket that cannot be scanned has no use for the QR), and opens E11, which says what came back.
 */
export function GroupRow({ group, onOpen }: { group: HeldGroup; onOpen: (ticketId: string) => void }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const target = ticketToOpen(group.tickets);
  const calledOff = group.event.cancelledAt != null;
  return (
    <Pressable
      testID={`ticket-group-${group.orderId}-${group.ticketTypeId}`}
      accessibilityRole="button"
      accessibilityLabel={calledOff ? `${group.event.name}, ${groupLine(group)}, called off` : `${group.event.name}, ${groupLine(group)}`}
      accessibilityHint={calledOff ? 'Shows the ticket and what came back' : "Shows the ticket's QR code"}
      onPress={() => target && onOpen(target.id)}
      {...ring.handlers}
      style={[styles.row, { backgroundColor: colors.surfaceCard }, ring.style]}
    >
      <DateBadge startsAt={group.event.startsAt} zone={group.event} />
      <View style={styles.rowWords}>
        <Text variant="body" numberOfLines={1} style={[font(600), styles.rowTitle]}>
          {group.event.name}
        </Text>
        <Text variant="body" tone="textMuted" numberOfLines={1} style={styles.rowLine}>
          {groupLine(group)}
        </Text>
      </View>
      {calledOff ? (
        <StatusPill label="Called off" tone="danger" testID={`ticket-group-${group.orderId}-${group.ticketTypeId}-called-off`} />
      ) : (
        <Icon name="QrCode" size={listMetrics.qrIcon} color={colors.textSecondary} />
      )}
      <View pointerEvents="none" style={[styles.edge, { borderRadius: radius.media, borderColor: colors.borderHairline }]} />
    </Pressable>
  );
}

/** The page frame both screens share: the page colour, centred at the phone's width, under the status bar. */
export function Page({ children, testID, insetTop }: { children: ReactNode; testID: string; insetTop: number }) {
  const { colors } = useWawu();
  return (
    <View testID={testID} style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: insetTop }]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignSelf: 'center', width: '100%', maxWidth: layout.screenW },
  nav: { height: navMetrics.height, paddingHorizontal: layout.gutter, flexDirection: 'row', alignItems: 'center', gap: space.md },
  navTitle: { flex: 1, textAlign: 'center', fontSize: navMetrics.title, paddingTop: navMetrics.titleNudge, letterSpacing: navMetrics.titleTracking * navMetrics.title },
  navSpacer: { width: navMetrics.button },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md, borderRadius: radius.tile, paddingVertical: noteMetrics.padV, paddingHorizontal: space.lg },
  noteIcon: { paddingTop: noteMetrics.iconNudge },
  noteText: { flex: 1, gap: noteMetrics.inner },
  card: { borderRadius: radius.money, overflow: 'hidden' },
  edge: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderWidth: StyleSheet.hairlineWidth },
  refresh: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md },
  refreshText: { flex: 1 },
  banner: { height: cardMetrics.banner, justifyContent: 'flex-end' },
  bannerWords: { paddingHorizontal: cardMetrics.wordsInset, paddingBottom: cardMetrics.wordsBottom, gap: cardMetrics.lineGap },
  bannerName: { fontSize: cardMetrics.name, lineHeight: canvasNormalLineHeight(cardMetrics.name) },
  bannerLine: { fontSize: cardMetrics.line, opacity: cardMetrics.lineOpacity, lineHeight: canvasNormalLineHeight(cardMetrics.line) },
  cardBody: { padding: cardMetrics.pad, alignItems: 'center', gap: cardMetrics.stack },
  plate: {
    borderWidth: StyleSheet.hairlineWidth,
    width: cardMetrics.plate,
    height: cardMetrics.plate,
    borderRadius: cardMetrics.plateCorner,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  code: {
    fontSize: cardMetrics.code,
    letterSpacing: cardMetrics.codeTracking * cardMetrics.code,
    lineHeight: canvasNormalLineHeight(cardMetrics.code),
    fontVariant: ['tabular-nums'],
  },
  holder: { fontSize: cardMetrics.holder, lineHeight: canvasNormalLineHeight(cardMetrics.holder) },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: listMetrics.between,
    padding: listMetrics.rowPad,
    borderRadius: radius.media,
  },
  rowWords: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: listMetrics.title, lineHeight: canvasNormalLineHeight(listMetrics.title) },
  rowLine: { fontSize: listMetrics.line, marginTop: listMetrics.lineGap, lineHeight: canvasNormalLineHeight(listMetrics.line) },
});
