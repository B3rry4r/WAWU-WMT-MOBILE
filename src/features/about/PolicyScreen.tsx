import { useQuery } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/client';
import { Button } from '@/components/Button';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { font, radius, useWawu } from '@/theme';

import { fetchPolicy, policyKey, type Policy, type PolicySlug } from './api';
import { AboutFrame } from './AboutFrame';
import { paragraphsOf, updatedLine } from './format';

/**
 * design/_gen/settings.js line 18 (`doc`): 18 between the date and each section, 6 between a
 * heading and its text; the date 12.5 (text-muted), a heading 16 at 700, the text 14 at line
 * height 1.55 (text-secondary).
 */
const docMetrics = { between: 18, headingSpace: 6, date: 12.5, heading: 16, body: 14, bodyLeading: 1.55 } as const;
/** The bars of the loading view stand in for the date, a heading and two lines of text. */
const skeleton = { date: 12.5, heading: 18, line: 14, dateW: '40%', headingW: '45%', lineW: '95%', lastW: '70%', block: 6 } as const;

const TITLES: Record<PolicySlug, string> = { terms: 'Terms', privacy: 'Privacy policy' };

export type PolicyScreenProps = {
  slug: PolicySlug;
  onBack: () => void;
  /** Z10 only: the way on to the Privacy policy (Z11). */
  onOpenOther?: () => void;
};

/**
 * Z10 · Terms and Z11 · Privacy policy. The words and their date are the owner's, served
 * by the Hub (`GET /policies/{slug}`, SETTINGS-02); the canvas's text is layout only. Until
 * the owner has put the document in, the screen says it is not available yet and shows no
 * wording of its own.
 */
export function PolicyScreen({ slug, onBack, onOpenOther }: PolicyScreenProps) {
  const policy = useQuery({ queryKey: policyKey(slug), queryFn: () => fetchPolicy(slug) });
  const title = TITLES[slug];
  const offline = isApiError(policy.error) && policy.error.kind === 'network';
  return (
    <AboutFrame title={title} onBack={onBack} gap={docMetrics.between} testID={`policy-${slug}`}>
      {policy.data && policy.data.available ? (
        <Document policy={policy.data} />
      ) : policy.data ? (
        <EmptyState
          testID={`policy-${slug}-unavailable`}
          icon="FileText"
          title="Not available yet"
          message="This document has not been published yet. Check back soon."
        />
      ) : policy.isError ? (
        <ErrorState
          testID={`policy-${slug}-error`}
          icon={offline ? 'WifiOff' : 'CircleAlert'}
          title={offline ? 'No connection' : 'This could not be loaded'}
          message={isApiError(policy.error) ? policy.error.message : 'Something went wrong. Try again.'}
          onRetry={() => void policy.refetch()}
        />
      ) : (
        <LoadingView label={`Loading the ${title.toLowerCase()}`} testID={`policy-${slug}-loading`}>
          <View style={styles.skeleton}>
            <Skeleton width={skeleton.dateW} height={skeleton.date} radius={radius.input} />
            {[0, 1, 2].map((i) => (
              <View key={i} style={styles.skeletonSection}>
                <Skeleton width={skeleton.headingW} height={skeleton.heading} radius={radius.input} />
                <Skeleton width={skeleton.lineW} height={skeleton.line} radius={radius.input} />
                <Skeleton width={skeleton.lastW} height={skeleton.line} radius={radius.input} />
              </View>
            ))}
          </View>
        </LoadingView>
      )}
      {onOpenOther ? (
        <Button label="Read the privacy policy" variant="secondary" size="md" onPress={onOpenOther} testID="policy-open-privacy" />
      ) : null}
    </AboutFrame>
  );
}

function Document({ policy }: { policy: Policy }) {
  const { colors } = useWawu();
  const updated = updatedLine(policy.effectiveDate);
  return (
    <>
      {updated ? (
        <Text variant="caption" testID="policy-updated" style={{ fontSize: docMetrics.date, color: colors.textMuted }}>
          {updated}
        </Text>
      ) : null}
      {policy.sections.map((section, i) => (
        <View key={`${i}-${section.heading}`} style={styles.section} testID={`policy-section-${i}`}>
          <Text variant="body" accessibilityRole="header" selectable style={[font(700), { fontSize: docMetrics.heading }]}>
            {section.heading}
          </Text>
          {paragraphsOf(section.body).map((paragraph, j) => (
            <Text
              key={j}
              variant="body"
              selectable
              style={{ fontSize: docMetrics.body, lineHeight: docMetrics.body * docMetrics.bodyLeading, color: colors.textSecondary }}
            >
              {paragraph}
            </Text>
          ))}
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  section: { gap: docMetrics.headingSpace },
  skeleton: { gap: docMetrics.between },
  skeletonSection: { gap: skeleton.block },
});
