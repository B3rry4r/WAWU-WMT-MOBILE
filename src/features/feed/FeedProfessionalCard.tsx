import { StyleSheet, Text, View } from 'react-native';

import { radius } from '@/theme';

import { askButtonLabel } from '@/features/paid-ask/model';
import type { AskTarget } from '@/features/paid-ask/useAsk';
import { useShownPrice } from '@/features/store/ladder/usePrice';

import type { ProfessionalCardData } from './api';
import { ButtonRow, CardButton, CardFrame, CardName, Stat, StatsPanel } from './CardFrame';
import { cardMetrics as m, media, words } from './look';
import { CARD_SERVICE_CHIPS, cardTick, hueFor, placeLine, refundNote, reviewsText, usualReply } from './model';
import { Pill } from './parts';
import { useProfessionalAsk } from './useProfessionalAsk';

export type FeedProfessionalCardProps = {
  card: ProfessionalCardData;
  width: number;
  height: number;
  chromeTop: number;
  /** Profile opens the professional's page (P2) with the listing's id. Left out, the card has no Profile button. */
  onOpenProfile?: (id: string) => void;
  /**
   * Message · price opens the paid question (I3) for this professional. Left out, the card has no Message button (R-47), and it is also
   * left out when the professional has paid messages off or paused (their listing and the Hub say so).
   */
  onMessage?: (target: AskTarget) => void;
};

/**
 * H10: a professional among the posts, one screen. Their portrait fills it; over it, their name and
 * tick, their headline and city, their rating and reviews and how fast they usually reply (each only
 * when the Hub has the figure, and no Trust Score: R-18, BRIEF H10), their services, the line that the money
 * comes back when they do not reply in their window, and Profile. The tag says "Professional": the Hub does not
 * know where the viewer is, so it makes no claim of distance (G-100), and it does not know who is online, so
 * "Online now" is not drawn (G-101). Message with the professional's own price (the Hub's, `dmPrice`) opens the same paid question as their
 * profile (I3, R2-SOCIAL3); it and the refund line are left out while the professional has paid messages off.
 */
export function FeedProfessionalCard({ card, width, height, chromeTop, onOpenProfile, onMessage }: FeedProfessionalCardProps) {
  const terms = useProfessionalAsk(card, Boolean(onMessage));
  // R-101 point 10: on a phone with a store the button says the store's price, never the list price, and a missed reply is a question credit, not money back.
  const shown = useShownPrice();
  const off = terms?.kind === 'off';
  const name = card.displayName?.trim() ?? '';
  const reply = usualReply(card.usualReplyMinutes);
  const rated = card.ratingAvg !== null && card.reviewCount > 0;
  const chips = card.services.slice(0, CARD_SERVICE_CHIPS);
  return (
    <CardFrame
      testID={`professional-card-${card.id}`}
      width={width}
      height={height}
      chromeTop={chromeTop}
      portrait={card.coverUrl ?? card.avatarUrl}
      wawuId={card.wawuId}
      pill={<Pill icon="BriefcaseBusiness" text="Professional" light testID={`professional-card-${card.id}-pill`} />}
    >
      <CardName name={name} tick={cardTick(card.verification, 'pro')} line={placeLine(card.headline, card.city)} testID="card-name" />
      {rated || reply ? (
        <StatsPanel testID="card-stats">
          {rated && card.ratingAvg !== null ? <Stat star value={card.ratingAvg.toFixed(1)} label={reviewsText(card.reviewCount)} testID="stat-rating" /> : null}
          {reply ? <Stat value={reply} label="usual reply" testID="stat-reply" /> : null}
        </StatsPanel>
      ) : null}
      {chips.length > 0 ? (
        <View testID="card-services" style={styles.chips}>
          {chips.map((service) => (
            <View key={service} style={[styles.chip, { borderColor: media.chipEdge }]}>
              <Text style={[words.chip, { color: media.ink }]}>{service}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {off ? null : (
        <View testID="card-note" style={[styles.note, { backgroundColor: media.infoTint }]}>
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.noteEdge, { borderColor: media.info }]} />
          <Text style={[words.note, { color: media.ink }]}>{refundNote(card.dmPrice, card.dmResponseHours, shown.native)}</Text>
        </View>
      )}
      {onOpenProfile || (onMessage && terms?.kind === 'on') ? (
        <ButtonRow>
          {onMessage && terms?.kind === 'on' ? (
            <CardButton
              testID="card-message"
              tone="light"
              icon="MessageCircle"
              label={askButtonLabel(shown.forKobo(terms.priceKobo))}
              grow={2}
              onPress={() =>
                onMessage({
                  wawuId: card.wawuId,
                  name: card.displayName,
                  avatarUrl: card.avatarUrl,
                  hue: hueFor(card.wawuId),
                  tick: cardTick(card.verification, 'pro') ?? undefined,
                  priceKobo: terms.priceKobo,
                  windowHours: terms.windowHours,
                })
              }
            />
          ) : null}
          {onOpenProfile ? <CardButton testID="card-profile" tone="glass" label="Profile" onPress={() => onOpenProfile(card.id)} /> : null}
        </ButtonRow>
      ) : null}
    </CardFrame>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: m.chipGap },
  chip: { height: m.chipH, paddingHorizontal: m.chipPad, borderRadius: radius.chip, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  note: { paddingVertical: m.notePadV, paddingHorizontal: m.notePadH, borderRadius: m.noteRadius },
  noteEdge: { borderWidth: 1, borderRadius: m.noteRadius, opacity: 0.35 },
});
