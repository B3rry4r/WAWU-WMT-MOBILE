import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/client';
import { BrandMark } from '@/components/BrandMark';
import { GroupedList } from '@/components/Card';
import { IconTile } from '@/components/IconTile';
import { ListRow, rowMetrics } from '@/components/ListRow';
import { ScreenFrame } from '@/components/ScreenFrame';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { useWawu } from '@/theme';

import { aboutKey, fetchAbout, type About } from './api';
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
    <ScreenFrame idPrefix="about" title="About Who Made This" onBack={onBack} gap={aboutMetrics.between} testID="about-screen">
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
    </ScreenFrame>
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
        <ListRow
          testID="about-bank"
          lead={<IconTile icon="Landmark" size={aboutMetrics.tile} />}
          title={`Banking by ${about.bankName}`}
          titleLines={0}
          subtitle={about.licenceLine ?? undefined}
          subtitleLines={0}
          subtitleSelectable
          subtitleTestID="about-licence"
        />
        <ListRow
          testID="about-support"
          lead={<IconTile icon="Mail" size={aboutMetrics.tile} />}
          title="Contact support"
          titleLines={0}
          subtitle={about.supportEmail ?? NOT_FILLED_IN}
          subtitleLines={0}
          subtitleSelectable
          subtitleTestID="about-support-address"
          onPress={mail ? () => void open(mail, COULD_NOT_OPEN_MAIL) : undefined}
        />
        {rate ? (
          <ListRow testID="about-rate" lead={<IconTile icon="Star" size={aboutMetrics.tile} />} title="Rate the app" titleLines={0} onPress={() => void open(rate, COULD_NOT_OPEN_STORE)} />
        ) : null}
      </GroupedList>
      {problem ? (
        <Text variant="errorLine" accessibilityRole="alert" accessibilityLiveRegion="polite" testID="about-problem">
          {problem}
        </Text>
      ) : null}
      <GroupedList testID="about-legal">
        <ListRow testID="about-terms" lead={<IconTile icon="FileText" size={aboutMetrics.tile} />} title="Terms" titleLines={0} onPress={onOpenTerms} />
        <ListRow testID="about-privacy" lead={<IconTile icon="Shield" size={aboutMetrics.tile} />} title="Privacy policy" titleLines={0} onPress={onOpenPrivacy} />
      </GroupedList>
    </>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', gap: aboutMetrics.stack, paddingVertical: aboutMetrics.markPadV },
  description: { textAlign: 'center' },
});
