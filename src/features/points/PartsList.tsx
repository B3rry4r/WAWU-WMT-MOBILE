import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Banner } from '@/components/Banner';
import { FilterChips } from '@/components/FilterChips';
import { useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { Text } from '@/components/Text';
import { AudioSource } from '@/features/feed/player';
import { canvasNormalLineHeight, font, layout, radius, space, useWawu } from '@/theme';

import { RESULT_WORDS } from './mediaToolModel';
import { usePieceMaker, type PieceMakerHandlers } from './ResultView';
import { type ResultFile, type VoiceJob } from './voiceoverApi';
import { MUSIC_WORDS } from './voiceToolsModel';

const PLAY = { size: 40, icon: 16 } as const;

/** Split a song's choice before Run: the numbers of parts the Hub lists (two or six), as chips. */
export function PartsRow({ parts, value, onChange }: { parts: readonly number[]; value: number; onChange: (n: number) => void }) {
  return (
    <View style={styles.list} testID="tool-parts">
      <Text variant="body" tone="textMuted" accessibilityRole="header" style={[font(700), styles.label]}>
        {MUSIC_WORDS.partsLabel}
      </Text>
      <FilterChips variant="option" label={MUSIC_WORDS.partsLabel} items={parts.map((n) => ({ value: String(n), label: MUSIC_WORDS.parts(n) }))} value={String(value)} onChange={(v) => onChange(Number(v))} testID="tool-part-chip" />
    </View>
  );
}

/**
 * Split a song's result (POINTS-17): the parts the Hub made, each a row with a play button, its name (the Hub's: Voice, Drums, Bass...) and, for a
 * creator, its own "Make it a piece" (`POST /ai-tools/jobs/{id}/piece` with that part's `outputIndex`, POINTS-13's path). Only one part plays at a time:
 * playing another stops the first. No board draws the list (R-29): it is the single-choice rows' frame with the player's play button.
 */
export function PartsList({ job, parts, creator, handlers }: { job: VoiceJob; parts: readonly ResultFile[]; creator: boolean; handlers: PieceMakerHandlers }) {
  const [playing, setPlaying] = useState<number | null>(null);
  const maker = usePieceMaker(job, handlers);
  return (
    <View testID="stems-parts" accessibilityLabel={MUSIC_WORDS.partsDone} style={styles.list}>
      <Text variant="body" tone="textMuted" accessibilityRole="header" style={[font(700), styles.label]}>
        {MUSIC_WORDS.partsDone}
      </Text>
      {parts.map((part) => (
        <PartRow
          key={part.index}
          part={part}
          on={playing === part.index}
          onToggle={() => setPlaying((was) => (was === part.index ? null : part.index))}
          onEnded={() => setPlaying((was) => (was === part.index ? null : was))}
          piece={creator && Boolean(part.output.pieceFormat) ? { busy: maker.busy === part.index, onPress: () => void maker.make(part) } : undefined}
          failure={maker.failure?.index === part.index ? maker.failure.words : null}
        />
      ))}
    </View>
  );
}

function PartRow({ part, on, onToggle, onEnded, piece, failure }: { part: ResultFile; on: boolean; onToggle: () => void; onEnded: () => void; piece?: { busy: boolean; onPress: () => void }; failure: string | null }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const name = part.output.name ?? `Part ${part.index + 1}`;
  const onTime = useCallback(() => undefined, []);
  return (
    <View testID={`stems-part-${part.index}`} style={[styles.row, { backgroundColor: colors.surfaceCard, boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 1, color: colors.borderHairline, inset: true }] }]}>
      <View style={styles.main}>
        <AudioSource uri={part.output.url} playing={on} seek={null} onTime={onTime} onEnded={onEnded} />
        <Pressable
          testID={`stems-play-${part.index}`}
          accessibilityRole="button"
          accessibilityLabel={on ? MUSIC_WORDS.pausePart(name) : MUSIC_WORDS.playPart(name)}
          accessibilityState={{ selected: on }}
          onPress={onToggle}
          {...ring.handlers}
          style={[styles.play, { backgroundColor: colors.accent }, ring.style]}
        >
          <Icon name={on ? 'Pause' : 'Play'} size={PLAY.icon} color={colors.textOnAccent} fill={colors.textOnAccent} strokeWidth={2.4} />
        </Pressable>
        <Text variant="body" numberOfLines={1} style={[font(600), styles.name]}>
          {name}
        </Text>
        {piece ? (
          <Pressable
            testID={`stems-piece-${part.index}`}
            accessibilityRole="button"
            accessibilityLabel={MUSIC_WORDS.partPiece(name)}
            accessibilityState={{ busy: piece.busy }}
            onPress={piece.onPress}
            hitSlop={space.sm}
            style={[styles.pieceButton, { backgroundColor: colors.accentTint }]}
          >
            <Icon name={piece.busy ? 'Loader' : 'Plus'} size={14} color={colors.accentFg} strokeWidth={2.4} />
            <Text variant="body" tone="accentFg" style={[font(700), styles.pieceText]}>
              {piece.busy ? RESULT_WORDS.pieceWorking : RESULT_WORDS.pieceTitle}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {failure ? <Banner tone="danger" icon="CircleX" title={RESULT_WORDS.pieceFailedTitle} body={failure} testID={`stems-piece-failure-${part.index}`} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: space.sm },
  label: { fontSize: 11, letterSpacing: 0.88, textTransform: 'uppercase' },
  row: { borderRadius: radius.chip, padding: space.md, gap: space.sm },
  main: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  play: { width: PLAY.size, height: PLAY.size, borderRadius: PLAY.size / 2, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  name: { flex: 1, minWidth: 0, fontSize: 15, lineHeight: canvasNormalLineHeight(15) },
  pieceButton: { flexDirection: 'row', alignItems: 'center', gap: space.xs, paddingVertical: space.sm, paddingHorizontal: space.md, borderRadius: radius.chip, minHeight: layout.tapMin - space.sm },
  pieceText: { fontSize: 13, lineHeight: canvasNormalLineHeight(13) },
});
