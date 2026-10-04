import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/client';
import { BrandMark } from '@/components/BrandMark';
import { GroupedList } from '@/components/Card';
import { useFocusRing } from '@/components/focusRing';
import { Icon, type IconName } from '@/components/icon';
import { IconTile } from '@/components/IconTile';
import { rowMetrics } from '@/components/ListRow';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { font, useWawu } from '@/theme';

import { aboutKey, fetchAbout, type About } from './api';
import { AboutFrame } from './AboutFrame';
import { appVersion, mailtoUrl, openLink, rateUrl } from './links';

/** design/_gen/settings.js line 19 (`about`): the mark 64 wide, 10 under it the version at 14, rows led by `txIcon` at 44; 20 above and below; 16 between the parts. */
const aboutMetrics = { between: 16, mark: 64, stack: 10, markPadV: 20, version: 14, tile: 44 } as const;

export const COULD_NOT_OPEN_MAIL = 'No email app opened. Write to the address shown.';
export const COULD_NOT_OPEN_STORE = 'The store could not be opened. Try again later.';
export const NOT_FILLED_IN = 'Not available yet';

export type AboutScreenProps = {
  onBack: () => void;
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
};

/**
 * Z9 · About. Every value comes from the app (its version, from the app config) or
 * the Hub (`GET /about`: the bank, the licence line and the support address, all
 * filled in by the owner, R-1). A line the owner has not filled in is left out or
 * says so; no wording is written here.
 */
export function AboutScreen({ onBack, onOpenTerms, onOpenPrivacy }: AboutScreenProps) {
  const about = useQuery({ queryKey: aboutKey, queryFn: fetchAbout });
  const offline = isApiError(about.error) && about.error.kind === 'network';
  return (
    <AboutFrame title="About Who Made This" onBack={onBack} gap={aboutMetrics.between} testID="about-screen">
      <Header />
      {about.data ? (
        <Rows about={about.data} onOpenTerms={onOpenTerms} onOpenPrivacy={onOpenPrivacy} />
      ) : about.isError ? (
        <ErrorState
          testID="about-error"
          icon={offline ? 'WifiOff' : 'CircleAlert'}
          title={offline ? 'No connection' : 'This could not be loaded'}
          message={isApiError(about.error) ? about.error.message : 'Something went wrong. Try again.'}
          onRetry={() => void about.refetch()}
        />
      ) : (
        <LoadingView label="Loading" testID="about-loading">
          <Skeleton height={rowMetrics.minHeight * 3} />
        </LoadingView>
      )}
    </AboutFrame>
  );
}

function Header() {
  const { colors } = useWawu();
  const version = appVersion();
  return (
    <View style={styles.header}>
      <BrandMark layout="submark" width={aboutMetrics.mark} decorative />
      {version ? (
        <Text variant="body" testID="about-version" style={{ fontSize: aboutMetrics.version, color: colors.textMuted }}>
          {`Version ${version}`}
        </Text>
      ) : null}
    </View>
  );
}

type RowsProps = { about: About; onOpenTerms: () => void; onOpenPrivacy: () => void };

function Rows({ about, onOpenTerms, onOpenPrivacy }: RowsProps) {
  const [problem, setProblem] = useState<string | null>(null);
  const mail = mailtoUrl(about.supportEmail);
  const rate = rateUrl();

  const open = async (url: string, failure: string) => {
    setProblem((await openLink(url)) ? null : failure);
  };

  return (
    <>
      <Text variant="muted" style={styles.description}>
        Who Made This helps African creators and professionals get paid for what they know.
      </Text>
      <GroupedList testID="about-rows">
        <WrapRow
          testID="about-bank"
          icon="Landmark"
          title={`Banking by ${about.bankName}`}
          line={about.licenceLine}
          lineTestID="about-licence"
        />
        <WrapRow
          testID="about-support"
          icon="Mail"
          title="Contact support"
          line={about.supportEmail ?? NOT_FILLED_IN}
          lineTestID="about-support-address"
          onPress={mail ? () => void open(mail, COULD_NOT_OPEN_MAIL) : undefined}
        />
        {rate ? (
          <WrapRow testID="about-rate" icon="Star" title="Rate the app" line={null} lineTestID="about-rate-line" onPress={() => void open(rate, COULD_NOT_OPEN_STORE)} />
        ) : null}
      </GroupedList>
      {problem ? (
        <Text variant="errorLine" accessibilityRole="alert" accessibilityLiveRegion="polite" testID="about-problem">
          {problem}
        </Text>
      ) : null}
      <GroupedList testID="about-legal">
        <WrapRow testID="about-terms" icon="FileText" title="Terms" line={null} lineTestID="about-terms-line" onPress={onOpenTerms} />
        <WrapRow testID="about-privacy" icon="Shield" title="Privacy policy" line={null} lineTestID="about-privacy-line" onPress={onOpenPrivacy} />
      </GroupedList>
    </>
  );
}

/**
 * Every row on this screen. Its words wrap whole and can be selected: the owner's licence line and a support
 * address are not cut to one line at a large font, because a cut address cannot be used.
 * `ListRow` keeps a title and subtitle to one line, so Banking and Contact support use this
 * until SHARED-CHANGES.md (SETTINGS-02 #2) adds a `subtitleLines` prop. With no `onPress`
 * it is read, not opened, and has no chevron.
 */
type WrapRowProps = { testID: string; icon: IconName; title: string; line: string | null; lineTestID: string; onPress?: () => void };

function WrapRow({ testID, icon, title, line, lineTestID, onPress }: WrapRowProps) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const body = (
    <>
      <IconTile icon={icon} size={aboutMetrics.tile} />
      <View style={styles.wrapWords}>
        <Text variant="body" style={[font(600), styles.wrapTitle]}>
          {title}
        </Text>
        {line ? (
          <Text variant="secondary" selectable testID={lineTestID} style={[styles.wrapLine, { color: colors.textMuted }]}>
            {line}
          </Text>
        ) : null}
      </View>
      {onPress ? <Icon name="ChevronRight" size={rowMetrics.chevron} color={colors.textMuted} /> : null}
    </>
  );
  const label = [title, line].filter(Boolean).join(', ');
  if (!onPress) {
    return (
      <View testID={testID} accessible accessibilityLabel={label} style={styles.wrapRow}>
        {body}
      </View>
    );
  }
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      {...ring.handlers}
      style={({ pressed }) => [styles.wrapRow, pressed && { backgroundColor: colors.surfaceSunken }, ring.style]}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', gap: aboutMetrics.stack, paddingVertical: aboutMetrics.markPadV },
  description: { textAlign: 'center' },
  wrapRow: { flexDirection: 'row', alignItems: 'center', gap: rowMetrics.between, minHeight: rowMetrics.minHeight, paddingVertical: rowMetrics.padV },
  wrapWords: { flex: 1, minWidth: 0 },
  wrapTitle: { fontSize: rowMetrics.title, letterSpacing: rowMetrics.titleTracking * rowMetrics.title },
  wrapLine: { fontSize: rowMetrics.subtitle, marginTop: rowMetrics.subtitleGap },
});
