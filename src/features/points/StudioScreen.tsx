import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { Banner } from '@/components/Banner';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { radius } from '@/theme';

import { myPointsQuery } from './api';
import { PointsFrame } from './PointsFrame';
import { StudioGrid } from './StudioGrid';
import { StudioPrompt } from './StudioPrompt';
import { StudioRecent } from './StudioRecent';
import { aiToolsQuery, recentJobsQuery, type AiTool } from './studioApi';
import { dropHandoff } from './studioHandoff';
import { homeTools, recentResults } from './studioHomeModel';
import { STUDIO_WORDS } from './studioModel';
import { BalanceCard } from './parts';
import type { VoiceJob } from './voiceoverApi';

/** points.js line 87, `pt1`: the parts stand 14 apart. The home's own parts (the prompt, the tiles, Recent) stand 22 apart. */
const BODY_GAP = 14;
const HOME_GAP = 22;
/** The loading view's stand-ins: the balance card, the box and two lines of four tiles, in the sizes they are drawn at. */
const SKELETON = { balance: 92, box: 150, tile: 72, lines: 2, perLine: 4, between: 10 } as const;

export type StudioScreenProps = {
  onBack: () => void;
  /** The round button on the bar: Your points (PT5). */
  onHistory: () => void;
  /** Buy points (PT4), opened from Studio so it can lead back here. */
  onBuy: () => void;
  /** A tool's tile, chip or More row opens that tool. Left out until the tool's screen is built (R-47): the tile is then drawn as a plain card, not a button. */
  onOpenTool?: (tool: AiTool) => void;
  /** A Recent card opens that result's done view. */
  onOpenJob?: (job: VoiceJob) => void;
};

/**
 * Studio's home (PT1, PT1a; STUDIO-HOME, R-113). The points balance as it was, then "What would you like to make?" with one prompt box and the
 * chips of the prompt tools, a grid of the main tools with More, and Recent. The tools are the Hub's (`GET /ai-tools`): a chip, a tile and a More
 * row exist only for a tool the Hub lists and the app can run (R-47), and their costs, names and descriptions are the Hub's (R-65). The balance
 * is the Hub's (`GET /me/points`), a count of points, never naira. A person with no points sees the board's note and every tile dimmed, and the
 * accent Buy points. Nothing is charged here: Make opens the tool with the words and the file in, and the tool shows its quote.
 *
 * The history button opens Your points (PT5); Buy points opens PT4 (POINTS-06). A read that fails is the error view with Try again.
 */
export function StudioScreen({ onBack, onHistory, onBuy, onOpenTool, onOpenJob }: StudioScreenProps) {
  const owner = useSessionAccount(undefined);
  const tools = useQuery(aiToolsQuery(owner), queryClient);
  const points = useQuery(myPointsQuery(owner), queryClient);
  const recent = useQuery({ ...recentJobsQuery(owner), retry: false }, queryClient);
  const scroller = useRef<ScrollView>(null);
  const boxY = useRef(0);
  // Leaving Studio lets go of a file that was attached and never taken into a tool.
  useEffect(() => () => dropHandoff(), []);
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
  const { tiles, more } = homeTools(tools.data.tools);
  const empty = tiles.length === 0 && more.length === 0;
  const results = recent.data ? recentResults(recent.data, tools.data.tools) : null;
  return (
    <PointsFrame title={STUDIO_WORDS.title} onBack={onBack} action={action} gap={BODY_GAP} scrollRef={scroller} testID="studio-screen">
      <BalanceCard testID="studio-balance" points={balance} buy={{ label: STUDIO_WORDS.buyPoints, primary: none, onPress: onBuy, testID: 'studio-buy' }} />
      {none ? <Banner tone="info" icon="Sparkles" title={STUDIO_WORDS.noPointsTitle} body={STUDIO_WORDS.noPointsBody} testID="studio-no-points" /> : null}
      {empty ? (
        <EmptyState testID="studio-empty" icon="Sparkles" title={STUDIO_WORDS.noToolsTitle} message={STUDIO_WORDS.noToolsBody} />
      ) : (
        <View
          testID="studio-home"
          style={styles.home}
          onLayout={(e) => {
            boxY.current = e.nativeEvent.layout.y;
          }}
        >
          {onOpenTool ? (
            <View>
              <StudioPrompt
                tools={tools.data.tools}
                onOpenTool={onOpenTool}
                onFocusBox={() => scroller.current?.scrollTo({ y: Math.max(0, boxY.current - 8), animated: true })}
              />
            </View>
          ) : null}
          <StudioGrid tiles={tiles} more={more} none={none} onOpenTool={onOpenTool} />
          {onOpenJob ? <StudioRecent jobs={results} failed={recent.isError} tools={tools.data.tools} onOpen={onOpenJob} /> : null}
        </View>
      )}
    </PointsFrame>
  );
}

/** The page before the Hub has answered: the shape of the card, the box and the tiles, never a figure. */
function Loading() {
  return (
    <LoadingView label="Loading Studio" testID="studio-loading">
      <View style={styles.loading}>
        <Skeleton height={SKELETON.balance} radius={radius.card} />
        <Skeleton height={SKELETON.box} radius={radius.money} />
        {Array.from({ length: SKELETON.lines }, (_, i) => (
          <View key={i} style={styles.skeletonLine}>
            {Array.from({ length: SKELETON.perLine }, (_, j) => (
              <View key={j} style={styles.cell}>
                <Skeleton height={SKELETON.tile} radius={radius.tile} />
              </View>
            ))}
          </View>
        ))}
      </View>
    </LoadingView>
  );
}

const styles = StyleSheet.create({
  home: { gap: HOME_GAP },
  cell: { flex: 1, minWidth: 0 },
  loading: { gap: BODY_GAP },
  skeletonLine: { flexDirection: 'row', gap: SKELETON.between },
});
