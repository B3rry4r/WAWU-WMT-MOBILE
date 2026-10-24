import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { Banner } from '@/components/Banner';
import { useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { IconTile } from '@/components/IconTile';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { canvasNormalLineHeight, font, radius, useWawu } from '@/theme';

import { myPointsQuery } from './api';
import { aiToolsQuery, type AiTool } from './studioApi';
import { costLine, isDrawnTool, STUDIO_WORDS, toolIcon } from './studioModel';
import { PointsFrame } from './PointsFrame';
import { BalanceCard } from './parts';

/** points.js line 87, `pt1`: the parts stand 14 apart, the tiles two to a line 10 apart. */
const BODY_GAP = 14;
/** points.js line 86, `tool`: a 20 corner card with a hairline, 14 padding, 10 between the mark and the words; a 40 mark, the name 15 semi-bold, the cost 12 muted with an 11 star 4 before it, 2 under the name. A dimmed tile is half strength. */
const TILE = { radius: 20, pad: 14, markToWords: 10, icon: 40, name: 15, cost: 12, star: 11, starGap: 4, costTop: 2, between: 10, dim: 0.5 } as const;
/** The loading view's stand-ins: the balance card and two lines of tiles, in the sizes they are drawn at. */
const SKELETON = { balance: 92, tile: 112, lines: 2 } as const;

export type StudioScreenProps = {
  onBack: () => void;
  /** The round button on the bar: Your points (PT5). */
  onHistory: () => void;
  /** Buy points (PT4), opened from Studio so it can lead back here. */
  onBuy: () => void;
  /** A tool's tile opens that tool. Left out until the tool's screen is built (R-47): the tile is then drawn as a plain card, not a button. */
  onOpenTool?: (tool: AiTool) => void;
};

/**
 * PT1 · Studio, with PT1a (no points). The tools are the Hub's (`GET /ai-tools`): each with the cost in points it lists for one unit, and
 * nothing the Hub does not list. A tool the Hub lists as not enabled is not drawn as usable: it is dimmed and says so. The balance is
 * the Hub's (`GET /me/points`), a count of points, never naira. A person with no points sees the board's note and every tile dimmed,
 * and the accent Buy points; costs, the daily limit and what a job takes are the Hub's settings (R-65), never the board's.
 *
 * A tile is drawn only for a tool the app has a screen for; a tool the Hub lists that the app does not know is left out (R-47).
 *
 * The line under the bar is the board's caption with the outside name taken out (R-68). The history button opens Your points (PT5);
 * Buy points opens PT4 (POINTS-06). A read that fails is the error view with Try again.
 */
export function StudioScreen({ onBack, onHistory, onBuy, onOpenTool }: StudioScreenProps) {
  const owner = useSessionAccount(undefined);
  const tools = useQuery(aiToolsQuery(owner), queryClient);
  const points = useQuery(myPointsQuery(owner), queryClient);
  const action = { icon: 'History', label: STUDIO_WORDS.history, onPress: onHistory, testID: 'studio-history' } as const;

  const failed = (tools.isError && tools.data === undefined) || (points.isError && points.data === undefined);
  if (failed) {
    const error = tools.data === undefined && tools.isError ? tools.error : points.error;
    return (
      <PointsFrame title={STUDIO_WORDS.title} onBack={onBack} action={action} gap={BODY_GAP} centered testID="studio-screen">
        <ErrorState
          testID="studio-error"
          icon={isApiError(error) && error.kind === 'network' ? 'WifiOff' : 'TriangleAlert'}
          title={STUDIO_WORDS.loadFailed}
          message={isApiError(error) && error.message ? error.message : STUDIO_WORDS.tryAgain}
          onRetry={() => {
            void tools.refetch();
            void points.refetch();
          }}
        />
      </PointsFrame>
    );
  }
  if (tools.data === undefined || points.data === undefined) {
    return (
      <PointsFrame title={STUDIO_WORDS.title} onBack={onBack} action={action} gap={BODY_GAP} testID="studio-screen">
        <Loading />
      </PointsFrame>
    );
  }

  const balance = points.data.balance;
  const none = balance === 0;
  // A tile is drawn for a tool the Hub lists AND the app can run (R-47).
  const list = tools.data.tools.filter(isDrawnTool);
  return (
    <PointsFrame title={STUDIO_WORDS.title} onBack={onBack} action={action} gap={BODY_GAP} testID="studio-screen">
      <Text variant="secondary" tone="textSecondary" testID="studio-line">
        {STUDIO_WORDS.line}
      </Text>
      <BalanceCard testID="studio-balance" points={balance} buy={{ label: STUDIO_WORDS.buyPoints, primary: none, onPress: onBuy, testID: 'studio-buy' }} />
      {none ? <Banner tone="info" icon="Sparkles" title={STUDIO_WORDS.noPointsTitle} body={STUDIO_WORDS.noPointsBody} testID="studio-no-points" /> : null}
      {list.length === 0 ? (
        <EmptyState testID="studio-empty" icon="Sparkles" title={STUDIO_WORDS.noToolsTitle} message={STUDIO_WORDS.noToolsBody} />
      ) : (
        <View testID="studio-tools" style={styles.grid}>
          {pairs(list).map((row) => (
            <View key={row[0].id} style={styles.pair}>
              {row.map((tool) => (
                <ToolTile key={tool.id} tool={tool} dim={none || !tool.enabled} onOpen={tool.enabled && onOpenTool ? () => onOpenTool(tool) : undefined} />
              ))}
              {row.length === 1 ? <View style={styles.cell} /> : null}
            </View>
          ))}
        </View>
      )}
    </PointsFrame>
  );
}

/** Two to a line; an odd last tile keeps the width of the others (an empty half beside it). */
function pairs(list: readonly AiTool[]): AiTool[][] {
  const rows: AiTool[][] = [];
  for (let i = 0; i < list.length; i += 2) rows.push(list.slice(i, i + 2));
  return rows;
}

/** One tool: its mark, its name and what it costs, in the Hub's words. A card, and a button only when the tool's screen is there to open. */
function ToolTile({ tool, dim, onOpen }: { tool: AiTool; dim: boolean; onOpen?: () => void }) {
  const { colors } = useWawu();
  const line = tool.enabled ? costLine(tool) : STUDIO_WORDS.unavailable;
  const card = (
    <View style={[styles.tile, { backgroundColor: colors.surfaceCard, boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 1, color: colors.borderHairline, inset: true }] }, dim ? { opacity: TILE.dim } : null]}>
      <IconTile icon={toolIcon(tool)} tone="accent" size={TILE.icon} />
      <View>
        <Text variant="body" numberOfLines={2} style={[font(600), { fontSize: TILE.name, lineHeight: canvasNormalLineHeight(TILE.name) }]}>
          {tool.name}
        </Text>
        <View style={styles.cost}>
          {tool.enabled ? <Icon name="Sparkles" size={TILE.star} color={colors.accentFg} strokeWidth={2.2} /> : null}
          <Text variant="body" tone="textMuted" numberOfLines={2} style={[{ fontSize: TILE.cost, lineHeight: canvasNormalLineHeight(TILE.cost), flexShrink: 1 }]}>
            {line}
          </Text>
        </View>
      </View>
    </View>
  );
  const label = `${tool.name}, ${line}`;
  return onOpen ? (
    <PressableTile testID={`studio-tool-${tool.id}`} label={label} onPress={onOpen}>
      {card}
    </PressableTile>
  ) : (
    <View testID={`studio-tool-${tool.id}`} accessible accessibilityLabel={label} style={styles.cell}>
      {card}
    </View>
  );
}

function PressableTile({ children, label, onPress, testID }: { children: ReactNode; label: string; onPress: () => void; testID: string }) {
  const ring = useFocusRing();
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} onPress={onPress} {...ring.handlers} style={[styles.cell, ring.style]}>
      {children}
    </Pressable>
  );
}

/** The page before the Hub has answered: the shape of the card and the tiles, never a figure. */
function Loading() {
  return (
    <LoadingView label="Loading Studio" testID="studio-loading">
      <View style={styles.loading}>
        <Skeleton height={SKELETON.balance} radius={radius.card} />
        {Array.from({ length: SKELETON.lines }, (_, i) => (
          <View key={i} style={styles.skeletonLine}>
            <View style={styles.cell}>
              <Skeleton height={SKELETON.tile} radius={TILE.radius} />
            </View>
            <View style={styles.cell}>
              <Skeleton height={SKELETON.tile} radius={TILE.radius} />
            </View>
          </View>
        ))}
      </View>
    </LoadingView>
  );
}

const styles = StyleSheet.create({
  grid: { gap: TILE.between },
  pair: { flexDirection: 'row', gap: TILE.between },
  // Two to a line with the gap between: each cell is half the line less half the gap.
  cell: { flex: 1, minWidth: 0 },
  tile: { borderRadius: TILE.radius, padding: TILE.pad, gap: TILE.markToWords },
  cost: { flexDirection: 'row', alignItems: 'center', gap: TILE.starGap, marginTop: TILE.costTop },
  loading: { gap: BODY_GAP },
  skeletonLine: { flexDirection: 'row', gap: TILE.between },
});
