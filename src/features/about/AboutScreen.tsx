import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/client';
import { useSession } from '@/api/session';
import { BrandMark } from '@/components/BrandMark';
import { GroupedList } from '@/components/Card';
import { IconTile } from '@/components/IconTile';
import { ListRow, rowMetrics } from '@/components/ListRow';
import { ScreenFrame } from '@/components/ScreenFrame';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { useOpenSupport } from '@/features/support/useOpenSupport';
import { useWawu } from '@/theme';

import { aboutKey, fetchAbout, type About } from './api';
import { appVersion, mailtoUrl, openLink, rateUrl } from './links';

/** design/_gen/settings.js line 19 (`about`): the mark 64 wide, 10 under it the version at 14, rows led by `txIcon` at 44; 20 above and below; 16 between the parts. */
const aboutMetrics = { between: 16, mark: 64, stack: 10, markPadV: 20, version: 14, tile: 44 } as const;

export const COULD_NOT_OPEN_MAIL = 'No email app opened. Write to the address shown.';
export const COULD_NOT_OPEN_STORE = 'The store could not be opened. Try again later.';

export type AboutScreenProps = {
  onBack: () => void;
};

/**
 * Z9 · About. Every value comes from the app (its version, from the app config) or
 * the Hub (`GET /about`: the bank, the licence line and the support address, all
 * filled in by the owner, R-1). A line the owner has not filled in is left out or
 * says so; no wording is written here. The board draws three rows (Banking by, Contact support, Rate the app) and no Terms or
 * Privacy policy rows: those are Settings' (Z2) and the sign-up consent's (RELEASE-02, CHECK-3 D-4). "Banking by" needs the bank
 * name set in admin settings and "Rate the app" needs the store link in the app's config; until the owner sets them the rows are not
 * drawn (R-47), and BACKEND_GAPS G-R2-AUTHME-3 lists both for the release.
 */
export function AboutScreen({ onBack }: AboutScreenProps) {
  const about = useQuery({ queryKey: aboutKey, queryFn: fetchAbout });
  const offline = isApiError(about.error) && about.error.kind === 'network';
  return (
    <ScreenFrame idPrefix="about" title="About Who Made This?" onBack={onBack} gap={aboutMetrics.between} testID="about-screen">
      <Header />
      {about.data ? (
        <Rows about={about.data} />
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

/** R-67: the licence line is the owner's setting; empty or blank means it is not drawn. */
function licenceOf(about: About): string | undefined {
  return about.licenceLine?.trim() || undefined;
}

function Rows({ about }: { about: About }) {
  const [problem, setProblem] = useState<string | null>(null);
  // Signed in, Contact support opens the support chat (R-30), as Wallet settings' "Help with a payment" does. About is also public: a visitor
  // has no chat to open, so for them the row is the support address when the owner has set one, and is not drawn when not (R-47).
  const { status } = useSession();
  const support = useOpenSupport();
  const chat = status === 'signedIn';
  const address = about.supportEmail?.trim() || undefined;
  const bank = about.bankName.trim();
  const mail = mailtoUrl(address ?? null);
  const rate = rateUrl();

  const open = async (url: string, failure: string) => {
    setProblem((await openLink(url)) ? null : failure);
  };

  return (
    <>
      <Text variant="muted" style={styles.description}>
        Who Made This? helps African creators and professionals get paid for what they know.
      </Text>
      <GroupedList testID="about-rows">
        {bank ? (
          <ListRow
            testID="about-bank"
            lead={<IconTile icon="Landmark" size={aboutMetrics.tile} />}
            title={`Banking by ${bank}`}
            titleLines={0}
            subtitle={licenceOf(about)}
            subtitleLines={0}
            subtitleSelectable
            subtitleTestID="about-licence"
          />
        ) : null}
        {chat || address ? (
          <ListRow
            testID="about-support"
            lead={<IconTile icon={chat ? 'MessageCircle' : 'Mail'} size={aboutMetrics.tile} />}
            title="Contact support"
            titleLines={0}
            subtitle={address}
            subtitleLines={0}
            subtitleSelectable
            subtitleTestID="about-support-address"
            onPress={chat ? () => void support.open() : mail ? () => void open(mail, COULD_NOT_OPEN_MAIL) : undefined}
          />
        ) : null}
        {rate ? (
          <ListRow testID="about-rate" lead={<IconTile icon="Star" size={aboutMetrics.tile} />} title="Rate the app" titleLines={0} onPress={() => void open(rate, COULD_NOT_OPEN_STORE)} />
        ) : null}
      </GroupedList>
      {problem || support.error ? (
        <Text variant="errorLine" accessibilityRole="alert" accessibilityLiveRegion="polite" testID="about-problem">
          {problem ?? support.error}
        </Text>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', gap: aboutMetrics.stack, paddingVertical: aboutMetrics.markPadV },
  description: { textAlign: 'center' },
});
