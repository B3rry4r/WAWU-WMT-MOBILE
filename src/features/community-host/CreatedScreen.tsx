import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Share, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { IconTile } from '@/components/IconTile';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { fetchRoom, roomKey } from '@/features/communities/api';
import { copyText } from '@/features/open-wallet/copy';
import { readableLink, sendableRoomLink } from '@/lib/appLinks';
import { font, layout, radius, space, useWawu } from '@/theme';

/** design/_gen/inbox.js line 88, `created`: the result mark, the title, the line, the link card (12 by 14 inside, 10 between) and a muted line; the foot has Share link and Open room side by side. */
const metrics = { mark: 88, top: 80, between: 20, copyPadH: 12, copyHeight: 40, copyFont: 14, link: 14, foot: 10 } as const;
const COPIED_MS = 2000;

export type CreatedScreenProps = {
  id: string;
  onOpenRoom: () => void;
};

/**
 * I33 · Created (INBOX-14). "<name> is live", what kind of room it is and that the person hosts it, the room's share link `wawu/c/<slug>`
 * as the Hub made it, Copy, Share link and Open room. The name, the kind and the link are the Hub's own, read from the room. The board's
 * "Members pay 1 credit a message" is left out: the figure is not served here (G-INBOX-14-1).
 */
export function CreatedScreen({ id, onOpenRoom }: CreatedScreenProps) {
  const { colors } = useWawu();
  const insets = useSafeAreaInsets();
  const room = useQuery({ queryKey: roomKey(id), queryFn: () => fetchRoom(id) }, queryClient);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const ring = useFocusRing();

  if (room.isError && !room.data) {
    return (
      <View style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: insets.top }]} testID="created-screen">
        <View style={styles.center}>
          <ErrorState
            testID="created-error"
            title="Couldn’t read your community"
            message={isApiError(room.error) ? room.error.message : 'Something went wrong. Try again.'}
            icon={isApiError(room.error) && room.error.kind === 'network' ? 'WifiOff' : 'TriangleAlert'}
            onRetry={() => void room.refetch()}
          />
        </View>
      </View>
    );
  }
  if (!room.data) {
    return (
      <View style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: insets.top }]} testID="created-screen">
        <LoadingView testID="created-loading" label="Opening your community">
          <View style={styles.loading}>
            <Skeleton width={metrics.mark} height={metrics.mark} radius={metrics.mark / 2} />
            <Skeleton width={layout.screenW / 2} height={space.xl} />
          </View>
        </LoadingView>
      </View>
    );
  }

  const data = room.data;
  // The Hub's link has no scheme (`wawu/c/<slug>`); what is copied and shared is the full address a person can send (SWEEP-FLOWS B12), shown without its scheme like the invite card's.
  const link = sendableRoomLink(data.link);
  const kindLine = `${data.kind === 'private' ? 'Private' : 'Open'} · you’re the host`;
  const copy = async () => {
    const ok = await copyText(link);
    setCopyFailed(!ok);
    setCopied(ok);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), COPIED_MS);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: insets.top }]} testID="created-screen">
      <View style={styles.body}>
        <View style={styles.result}>
          <IconTile icon="Check" tone="in" size={metrics.mark} />
          <Text variant="sheetTitle" style={styles.centred} testID="created-title">
            {`${data.name} is live`}
          </Text>
          <Text variant="muted" style={styles.centred} testID="created-kind">
            {kindLine}
          </Text>
        </View>
        <Card padded testID="created-link-card">
          <View style={styles.linkRow}>
            <Text variant="body" tone="textSecondary" numberOfLines={1} style={[styles.link, { fontSize: metrics.link }]} testID="created-link">
              {readableLink(link)}
            </Text>
            <Pressable
              testID="created-copy"
              accessibilityRole="button"
              accessibilityLabel={copied ? 'Link copied' : 'Copy the link'}
              onPress={() => void copy()}
              {...ring.handlers}
              style={[styles.copy, { backgroundColor: colors.surfaceSunken }, ring.style]}
            >
              <Icon name={copied ? 'Check' : 'Copy'} size={space.lg} color={colors.textPrimary} strokeWidth={2.2} />
              <Text variant="body" style={[font(700), { fontSize: metrics.copyFont }]}>
                {copied ? 'Copied' : 'Copy'}
              </Text>
            </Pressable>
          </View>
        </Card>
        {copyFailed ? (
          <Text variant="errorLine" tone="danger" accessibilityRole="alert" style={styles.centred} testID="created-copy-failed">
            We couldn’t copy the link. Try Share link.
          </Text>
        ) : null}
        <Text variant="muted" style={styles.centred}>
          Share the link or post your first message.
        </Text>
      </View>
      <View style={[styles.foot, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>
        <View style={styles.flex}>
          <Button label="Share link" variant="secondary" icon="Share" full onPress={() => void Share.share({ message: link }).catch(() => undefined)} testID="created-share" />
        </View>
        <View style={styles.flex}>
          <Button label="Open room" full onPress={onOpenRoom} testID="created-open" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', paddingHorizontal: layout.gutter },
  loading: { alignItems: 'center', gap: space.md, paddingTop: metrics.top },
  body: { flex: 1, paddingHorizontal: layout.gutter, paddingTop: metrics.top, gap: metrics.between },
  result: { alignItems: 'center', gap: space.sm },
  centred: { textAlign: 'center' },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  link: { flex: 1, minWidth: 0 },
  copy: { height: metrics.copyHeight, paddingHorizontal: metrics.copyPadH, borderRadius: radius.chip, flexDirection: 'row', alignItems: 'center', gap: space.xs },
  foot: { flexDirection: 'row', gap: metrics.foot, paddingHorizontal: layout.gutter, paddingTop: space.md },
  flex: { flex: 1 },
});
