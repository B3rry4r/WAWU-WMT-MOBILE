import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { Text } from '@/components/Text';
import { canvasNormalLineHeight, font, layout, radius, space, useWawu } from '@/theme';

import type { AiTool } from './studioApi';
import { HOME_WORDS, recentLabel, recentLook, type RecentLook } from './studioHomeModel';
import type { VoiceJob } from './voiceoverApi';

/** A Recent card: the result's picture, a clip's tile or a waveform, 132 across and 100 high with the tool's words under it. */
const CARD = { width: 132, media: 100, between: 10, label: 13, bars: 18, barW: 3, barGap: 2, play: 34 } as const;

export type StudioRecentProps = {
  /** The person's finished results, newest first, up to ten. Null while they are being read or could not be read. */
  jobs: readonly VoiceJob[] | null;
  failed: boolean;
  tools: readonly AiTool[];
  onOpen: (job: VoiceJob) => void;
};

/**
 * "Recent" (R-113): the person's last results as cards. Tapping one opens that result's done view, where "Make it a piece" is. Nothing before
 * they are read; with none, one line and no placeholder art (R-47); a list that cannot be read is one line too.
 */
export function StudioRecent({ jobs, failed, tools, onOpen }: StudioRecentProps) {
  if (jobs === null && !failed) return null;
  return (
    <View testID="studio-recent" style={styles.wrap}>
      <Text variant="body" accessibilityRole="header" style={[font(700), styles.heading]}>
        {HOME_WORDS.recent}
      </Text>
      {jobs === null ? (
        <Text variant="body" tone="textMuted" testID="studio-recent-failed" style={styles.line}>
          {HOME_WORDS.recentFailed}
        </Text>
      ) : jobs.length === 0 ? (
        <Text variant="body" tone="textMuted" testID="studio-recent-empty" style={styles.line}>
          {HOME_WORDS.recentEmpty}
        </Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} testID="studio-recent-list" style={styles.scroll} contentContainerStyle={styles.cards}>
          {jobs.map((job) => (
            <RecentCard key={job.id} job={job} label={recentLabel(job, tools)} onPress={() => onOpen(job)} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function RecentCard({ job, label, onPress }: { job: VoiceJob; label: string; onPress: () => void }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const look = recentLook(job);
  return (
    <Pressable testID={`studio-recent-${job.id}`} accessibilityRole="button" accessibilityLabel={`${label}, open`} onPress={onPress} {...ring.handlers} style={[styles.card, ring.style]}>
      <View style={[styles.media, { backgroundColor: colors.surfaceSunken, boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 1, color: colors.borderHairline, inset: true }] }]}>
        <Media look={look} />
      </View>
      <Text variant="body" numberOfLines={1} style={[font(600), { fontSize: CARD.label, lineHeight: canvasNormalLineHeight(CARD.label) }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function Media({ look }: { look: RecentLook }) {
  const { colors } = useWawu();
  if (look.kind === 'image') return <Image testID="studio-recent-picture" source={{ uri: look.url }} contentFit="cover" style={styles.fill} accessibilityIgnoresInvertColors />;
  if (look.kind === 'video') {
    return (
      <View testID="studio-recent-clip" style={[styles.play, { backgroundColor: colors.accentTint }]}>
        <Icon name="Play" size={18} color={colors.accentFg} strokeWidth={2.2} />
      </View>
    );
  }
  if (look.kind === 'audio') {
    return (
      <View testID="studio-recent-wave" style={styles.bars}>
        {look.bars.map((h, i) => (
          <View key={i} style={{ width: CARD.barW, height: Math.round(h * CARD.media * 0.62), borderRadius: CARD.barW / 2, backgroundColor: colors.accentFg }} />
        ))}
      </View>
    );
  }
  return <Icon name="FileText" size={26} color={colors.textSecondary} strokeWidth={1.6} />;
}

const styles = StyleSheet.create({
  wrap: { gap: space.md },
  heading: { fontSize: 17 },
  line: { fontSize: 14, lineHeight: canvasNormalLineHeight(14) },
  scroll: { marginHorizontal: -layout.gutter, flexGrow: 0 },
  cards: { paddingHorizontal: layout.gutter, gap: CARD.between },
  card: { width: CARD.width, gap: space.sm },
  media: { width: CARD.width, height: CARD.media, borderRadius: radius.tile, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  fill: { width: '100%', height: '100%' },
  play: { width: CARD.play, height: CARD.play, borderRadius: CARD.play / 2, alignItems: 'center', justifyContent: 'center' },
  bars: { flexDirection: 'row', alignItems: 'center', gap: CARD.barGap },
});
