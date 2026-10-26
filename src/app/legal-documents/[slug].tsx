import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { isPolicySlug } from '@/features/about/api';
import { PolicyScreen } from '@/features/about/PolicyScreen';

/** One of the owner's nine documents in the policy reader (`/legal-documents/<slug>`). Public, like the list. A name that is not one of the nine goes back to the list. */
export default function LegalDocumentRoute() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/legal-documents'));
  if (!isPolicySlug(slug)) return <Redirect href="/legal-documents" />;
  return <PolicyScreen slug={slug} onBack={leave} />;
}
