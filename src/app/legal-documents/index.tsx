import { useRouter } from 'expo-router';

import { LegalDocumentsScreen } from '@/features/about/LegalDocumentsScreen';

/** The Legal list (`/legal-documents`). Public: A3's "Read them" opens it before anyone has an account, and Settings' Legal row opens it signed in. */
export default function LegalDocumentsRoute() {
  const router = useRouter();
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));
  return <LegalDocumentsScreen onBack={leave} onOpen={(slug) => router.push({ pathname: '/legal-documents/[slug]', params: { slug } })} />;
}
