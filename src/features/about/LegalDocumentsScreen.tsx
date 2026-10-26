import { useQuery } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/client';
import { GroupedList } from '@/components/Card';
import { IconTile } from '@/components/IconTile';
import { ListRow, rowMetrics } from '@/components/ListRow';
import { ScreenFrame } from '@/components/ScreenFrame';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { space } from '@/theme';

import { fetchPolicyList, policyListKey, type PolicySlug } from './api';
import { updatedLine } from './format';

/** The rows follow Settings' and About's: a 44 px tile, the title, the date under it, a chevron; 16 between the parts. */
const listMetrics = { between: 16, tile: 44, loadingRows: 5 } as const;

export type LegalDocumentsScreenProps = {
  onBack: () => void;
  /** Opens one document in the policy reader. */
  onOpen: (slug: PolicySlug) => void;
};

/**
 * The Legal list (LEGAL-DOCS, owner, 26 Oct 2026): the owner's published documents by title, in the owner's order, each opening the
 * policy reader by its slug. Public, so it is readable before sign-up (A3's "Read them") and from Settings. The titles and dates are
 * the owner's, served by the Hub (`GET /policies`); no wording of a document is written here. Until the owner has published one the
 * screen says so.
 */
export function LegalDocumentsScreen({ onBack, onOpen }: LegalDocumentsScreenProps) {
  const list = useQuery({ queryKey: policyListKey, queryFn: fetchPolicyList });
  const offline = isApiError(list.error) && list.error.kind === 'network';
  return (
    <ScreenFrame idPrefix="legal-documents" title="Legal" onBack={onBack} gap={listMetrics.between} testID="legal-documents">
      {list.data && list.data.length > 0 ? (
        <>
          <Text variant="muted" testID="legal-documents-intro">
            What you agree to when you sign up. Tap one to read it.
          </Text>
          <GroupedList testID="legal-documents-rows">
            {list.data.map((item) => (
              <ListRow
                key={item.slug}
                testID={`legal-document-${item.slug}`}
                lead={<IconTile icon="FileText" size={listMetrics.tile} />}
                title={item.title}
                titleLines={0}
                subtitle={updatedLine(item.effectiveDate) ?? undefined}
                onPress={() => onOpen(item.slug)}
              />
            ))}
          </GroupedList>
        </>
      ) : list.data ? (
        <EmptyState
          testID="legal-documents-empty"
          icon="FileText"
          title="Not available yet"
          message="These documents have not been published yet. Check back soon."
        />
      ) : list.isError ? (
        <ErrorState
          testID="legal-documents-error"
          icon={offline ? 'WifiOff' : 'CircleAlert'}
          title={offline ? 'No connection' : 'This could not be loaded'}
          message={isApiError(list.error) ? list.error.message : 'Something went wrong. Try again.'}
          onRetry={() => void list.refetch()}
        />
      ) : (
        <LoadingView label="Loading the documents" testID="legal-documents-loading">
          <View style={styles.skeleton}>
            {Array.from({ length: listMetrics.loadingRows }, (_, i) => (
              <Skeleton key={i} height={rowMetrics.minHeight} />
            ))}
          </View>
        </LoadingView>
      )}
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  skeleton: { gap: space.sm },
});
