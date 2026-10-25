import { useRouter } from 'expo-router';

import { ProductsFullSheet } from './ProductsFullSheet';

/**
 * VF13 with the app's own way out of each of its buttons: Upgrade instead opens VF5 and Open library opens My content (M28), where
 * something can be taken down. The screens that can reach the limit (Create, the upload step, the format step) show it through this.
 */
export function ProductsFullHost({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  return (
    <ProductsFullSheet
      onClose={onClose}
      onUpgrade={() => {
        onClose();
        router.push('/tiers');
      }}
      onOpenLibrary={() => {
        onClose();
        router.push('/library');
      }}
    />
  );
}
