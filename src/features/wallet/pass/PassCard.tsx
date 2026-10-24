import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { Text } from '@/components/Text';
import { Qr } from '@/features/events/ticketParts';
import { font, stopOf, useWawu } from '@/theme';
import { lightColors } from '@/theme/tokens.generated';

import type { MyPass } from '../api/pass';
import { eventLine } from './model';

/**
 * design/_gen/wallet.js line 96 (W44): a 28 corner, 20 all round, the parts 12 apart. The pass's name is 28 / 700 tracked
 * -0.03em; the tier under it is 13.5 at 85%; the date is 13 at 80%, 10 further down than the gap. The glow is a 220 circle 60 past the
 * right edge and 60 above the top, white-purple at 85% fading out by 70% of its radius.
 *
 * The event's name above the pass's name and the QR code beside the date are the Hub's (`eventPass.eventName` and `passCode`,
 * G-814, FIX-110): each is drawn only when the Hub sends it. The QR is a 76 white plate with a 14 corner, 14 in from the edges
 * of the card, and carries exactly the Hub's code.
 */
export const PASS = {
  radius: 28,
  pad: 20,
  stack: 12,
  title: 28,
  titleTracking: -0.03,
  tier: 13.5,
  tierOpacity: 0.85,
  date: 13,
  dateOpacity: 0.8,
  dateTop: 10,
  eventName: 12,
  eventNameTracking: 0.12,
  eventNameOpacity: 0.7,
  qrPlate: 76,
  qrCorner: 16,
  qrPad: 6,
} as const;
const GLOW = { size: 220, right: -60, top: -60, fadeAt: 0.7, strength: 0.85 } as const;

/** W44's pass: the Hub's name for it, the tier it came with and when the event is, on the deep purple ground. */
export function PassCard({ pass }: { pass: Pick<MyPass, 'name' | 'tierName' | 'eventDate' | 'eventName' | 'code'> }) {
  const { colors } = useWawu();
  const glow = stopOf(colors.tgifVerseGlow);
  const ink = colors.textOnAccent;
  return (
    <View testID="pass-card" style={[styles.card, { backgroundColor: colors.tgifVerseGround }]}>
      <Svg pointerEvents="none" width={GLOW.size} height={GLOW.size} style={styles.glow}>
        <Defs>
          <RadialGradient id="pass-card-glow" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={glow.color} stopOpacity={GLOW.strength} />
            <Stop offset={GLOW.fadeAt} stopColor={glow.color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={GLOW.size / 2} cy={GLOW.size / 2} r={GLOW.size / 2} fill="url(#pass-card-glow)" />
      </Svg>
      <View style={styles.parts}>
        {pass.eventName ? (
          <Text
            variant="body"
            testID="pass-event"
            style={[font(700), { color: ink, fontSize: PASS.eventName, letterSpacing: PASS.eventNameTracking * PASS.eventName, opacity: PASS.eventNameOpacity, textTransform: 'uppercase' }]}
          >
            {pass.eventName}
          </Text>
        ) : null}
        <Text
          variant="body"
          accessibilityRole="header"
          testID="pass-name"
          style={[font(700), { color: ink, fontSize: PASS.title, letterSpacing: PASS.titleTracking * PASS.title, lineHeight: Math.round(PASS.title * 1.15) }]}
        >
          {pass.name}
        </Text>
        {pass.tierName ? (
          <Text variant="body" testID="pass-tier" style={{ color: ink, fontSize: PASS.tier, opacity: PASS.tierOpacity }}>
            {pass.tierName}
          </Text>
        ) : null}
        <Text variant="body" testID="pass-date" style={[styles.date, { color: ink, fontSize: PASS.date, opacity: PASS.dateOpacity }]}>
          {eventLine(pass.eventDate)}
        </Text>
      </View>
      {pass.code ? (
        <View testID="pass-qr-plate" style={[styles.plate, { backgroundColor: lightColors.surfaceCard }]}>
          <Qr testID="pass-qr" label="Pass QR code" value={pass.code} size={PASS.qrPlate - PASS.qrPad * 2} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: PASS.radius, padding: PASS.pad, overflow: 'hidden' },
  glow: { position: 'absolute', right: GLOW.right, top: GLOW.top },
  parts: { gap: PASS.stack },
  plate: { position: 'absolute', right: PASS.pad, bottom: PASS.pad, width: PASS.qrPlate, height: PASS.qrPlate, borderRadius: PASS.qrCorner, alignItems: 'center', justifyContent: 'center' },
  date: { marginTop: PASS.dateTop },
});
