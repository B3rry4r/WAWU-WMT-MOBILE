import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';

import { queryClient } from '@/api/query';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Icon } from '@/components/icon';
import { Skeleton } from '@/components/Skeleton';
import { Text } from '@/components/Text';
import { canvasNormalLineHeight, space, useWawu } from '@/theme';

import { enrolKeys, fetchApplyLink, recordApplyClick } from './enrolApi';

/** design/_gen/schools.js `leave` (SC9): the sheet's rows sit 14 apart, the title 20, the link card pads 12 by 14 with a 17 link mark 10 before the words (14). */
export const applyMetrics = { sheetGap: 14, title: 20, titleGap: 6, cardPadV: 12, cardPadH: 14, mark: 17, markGap: 10, link: 14 } as const;

export type ApplySheetProps = {
  visible: boolean;
  courseId: string;
  /** The school's name: the title reads "Apply on <school>'s site". */
  school: string;
  onClose: () => void;
  /** "Enroll on Who Made This? instead": SC4. Not drawn when the course has no class to join. */
  onEnroll?: () => void;
};

/** The link as the sheet prints it: the school's address and the code, without the scheme (the canvas's "greenfield.ng/apply?ref=wawu-7KQ2"). */
export const printed = (url: string): string => url.replace(/^https?:\/\//i, '');

/** Only a web address is opened (the Hub serves http(s) links only; this is the phone's own check before it hands one to the browser). */
const isWebAddress = (url: string): boolean => /^https?:\/\//i.test(url);

/**
 * SC9 · Apply on their site: "You finish signing up on their website. Your Who Made This? link tells them you came from here.",
 * the link itself, "Continue to their site" and "Enroll on Who Made This? instead". The link is the Hub's (`GET .../apply-link`:
 * the school's address with WAWU's code, nothing about the person); the tap on Continue records one click (`POST .../apply-click`)
 * and opens the link the Hub answers with in the phone's browser (R-33). The raw address on the course is never opened: it has no
 * code and records nothing.
 */
export function ApplySheet({ visible, courseId, school, onClose, onEnroll }: ApplySheetProps) {
  const { colors } = useWawu();
  const link = useQuery({ queryKey: enrolKeys.applyLink(courseId), queryFn: () => fetchApplyLink(courseId), enabled: visible, staleTime: 0 }, queryClient);
  const [going, setGoing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const go = async () => {
    if (going) return;
    setGoing(true);
    setNotice(null);
    try {
      const clicked = await recordApplyClick(courseId);
      if (!isWebAddress(clicked.url)) {
        setNotice('We could not open that link.');
        return;
      }
      await Linking.openURL(clicked.url);
      onClose();
    } catch {
      setNotice('We could not open their site. Check your connection and try again.');
    } finally {
      setGoing(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} label="Apply on their site" gap={applyMetrics.sheetGap} testID="apply-sheet" dismissible={!going}>
      <View style={styles.words}>
        <Text variant="sheetTitleSm" accessibilityRole="header" style={styles.title}>
          Apply on {school}&apos;s site
        </Text>
        <Text variant="muted">You finish signing up on their website. Your Who Made This? link tells them you came from here.</Text>
      </View>
      <Card testID="apply-link" style={styles.card}>
        <View style={styles.linkRow}>
          <Icon name="Link" size={applyMetrics.mark} color={colors.textMuted} />
          {link.data ? (
            <Text variant="body" tone="textSecondary" numberOfLines={1} testID="apply-url" style={styles.url}>
              {printed(link.data.url)}
            </Text>
          ) : link.isError ? (
            <Text variant="body" tone="textSecondary" testID="apply-link-error" style={styles.url} onPress={() => void link.refetch()}>
              We couldn’t get the link. Tap to try again.
            </Text>
          ) : (
            <Skeleton width="70%" height={applyMetrics.link} />
          )}
        </View>
      </Card>
      {notice ? (
        <Text variant="errorLine" testID="apply-notice" accessibilityRole="alert">
          {notice}
        </Text>
      ) : null}
      <Button testID="apply-continue" label="Continue to their site" iconRight="ArrowUpRight" full loading={going} disabled={!link.data} onPress={() => void go()} />
      {onEnroll ? <Button testID="apply-enroll" label="Enroll on Who Made This? instead" variant="secondary" full disabled={going} onPress={onEnroll} /> : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  words: { gap: applyMetrics.titleGap },
  title: { fontSize: applyMetrics.title, lineHeight: applyMetrics.title * 1.15 },
  card: { paddingVertical: applyMetrics.cardPadV, paddingHorizontal: applyMetrics.cardPadH },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: applyMetrics.markGap, minHeight: space.s2xl },
  url: { flex: 1, fontSize: applyMetrics.link, lineHeight: canvasNormalLineHeight(applyMetrics.link) },
});
