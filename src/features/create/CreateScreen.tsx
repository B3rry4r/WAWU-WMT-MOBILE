import { useQuery } from '@tanstack/react-query';
import { Pressable, StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/client';
import { useFocusRing } from '@/components/focusRing';
import { IconTile } from '@/components/IconTile';
import type { IconName } from '@/components/icon';
import { Skeleton } from '@/components/Skeleton';
import { Text } from '@/components/Text';
import { font, radius, space, useWawu } from '@/theme';

import { allowanceKey, fetchAllowance } from './api';
import { CreateFrame } from './CreateFrame';
import { UploadsMeter } from './UploadsMeter';

/** me.js `hubItem`: a 22 corner card, 16 padding, 12 between the picture and the words; a 48 accent tile, a 16 semi-bold name, a 13 muted line 3 under it. */
const tileMetrics = { corner: radius.card, pad: space.lg, gap: space.md, icon: 48, title: 16, sub: 13, subLeading: 1.35, subGap: 3, between: 10 } as const;

type Tile = { id: string; icon: IconName; title: string; sub: string; onPress: () => void };

export type CreateScreenProps = {
  onClose: () => void;
  /** Content opens M20. */
  onContent: () => void;
  /** Event opens E13, or E21 for an account without a tick (the host form decides). */
  onEvent: () => void;
  /** Service opens P5 (or P8 for a creator who is already listed). */
  onService: () => void;
};

/**
 * M19 · Create. Content, Event and Service, and the uploads meter from the Hub's own count. Community (opens I32, INBOX-14)
 * and the meter's "Get verified" (opens M11, ME-12) are added by the tasks that build where they lead (R-47).
 */
export function CreateScreen({ onClose, onContent, onEvent, onService }: CreateScreenProps) {
  const allowance = useQuery({ queryKey: allowanceKey, queryFn: fetchAllowance });
  const tiles: Tile[] = [
    { id: 'content', icon: 'Clapperboard', title: 'Content', sub: 'Video, course, audio, PDF, image or template', onPress: onContent },
    { id: 'event', icon: 'CalendarDays', title: 'Event', sub: 'Needs a verified tick', onPress: onEvent },
    { id: 'service', icon: 'BriefcaseBusiness', title: 'Service', sub: 'Get listed as a professional', onPress: onService },
  ];
  const rows: Tile[][] = [];
  for (let i = 0; i < tiles.length; i += 2) rows.push(tiles.slice(i, i + 2));

  return (
    <CreateFrame testID="create-screen" title="Create" leading="close" onLeave={onClose}>
      <View style={styles.grid}>
        {rows.map((row) => (
          <View key={row[0].id} style={styles.pair}>
            {row.map((tile) => (
              <HubTile key={tile.id} tile={tile} />
            ))}
            {row.length === 1 ? <View style={styles.spacer} /> : null}
          </View>
        ))}
      </View>
      {allowance.data ? (
        <UploadsMeter allowance={allowance.data} />
      ) : allowance.isError ? (
        <MeterFailed message={isApiError(allowance.error) ? allowance.error.message : 'Check your connection and try again.'} onRetry={() => void allowance.refetch()} />
      ) : (
        <Skeleton testID="create-meter-loading" height={96} radius={radius.card} />
      )}
    </CreateFrame>
  );
}

function HubTile({ tile }: { tile: Tile }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID={`create-tile-${tile.id}`}
      accessibilityRole="button"
      accessibilityLabel={`${tile.title}, ${tile.sub}`}
      onPress={tile.onPress}
      {...ring.handlers}
      style={({ pressed }) => [
        styles.tile,
        {
          backgroundColor: pressed ? colors.surfaceSunken : colors.surfaceCard,
          boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 1, color: colors.borderHairline, inset: true }],
        },
        ring.style,
      ]}
    >
      <IconTile icon={tile.icon} tone="accent" size={tileMetrics.icon} />
      <View>
        <Text variant="body" style={[font(600), styles.tileTitle]}>
          {tile.title}
        </Text>
        <Text variant="body" tone="textMuted" style={styles.tileSub}>
          {tile.sub}
        </Text>
      </View>
    </Pressable>
  );
}

/** The meter could not be read: the tiles above still work, and this says why the count is missing. */
function MeterFailed({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <View testID="create-meter-error" accessibilityRole="alert" style={[styles.failed, { backgroundColor: colors.surfaceCard, boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 1, color: colors.borderHairline, inset: true }] }]}>
      <Text variant="body" style={font(600)}>
        Your uploads did not load
      </Text>
      <Text variant="caption" tone="textMuted">
        {message}
      </Text>
      <Pressable accessibilityRole="button" onPress={onRetry} testID="create-meter-retry" {...ring.handlers} style={ring.style}>
        <Text variant="linkStrong">Try again</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { gap: tileMetrics.between },
  pair: { flexDirection: 'row', gap: tileMetrics.between },
  spacer: { flex: 1, minWidth: 0 },
  tile: { flex: 1, minWidth: 0, borderRadius: tileMetrics.corner, padding: tileMetrics.pad, gap: tileMetrics.gap },
  tileTitle: { fontSize: tileMetrics.title },
  tileSub: { fontSize: tileMetrics.sub, lineHeight: tileMetrics.sub * tileMetrics.subLeading, marginTop: tileMetrics.subGap },
  failed: { borderRadius: radius.card, padding: space.lg, gap: space.xs },
});
