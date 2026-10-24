import { useRouter } from 'expo-router';

import { addMoneyHref } from '@/features/addmoney/entry';
import { OPEN_WALLET_PIN_PATH } from '@/features/open-wallet/entry';

import { ProductsFullSheet } from './ProductsFullSheet';

/**
 * VF13 with the app's own way out of each of its buttons: Upgrade instead opens VF5, Forgot PIN? opens W37, no PIN yet opens A9 and
 * a short wallet opens Add money (W15). The screens that can reach the limit (Create, the upload step) show it through this.
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
      onForgotPin={() => router.push('/reset-pin')}
      onSetPin={() => router.push(OPEN_WALLET_PIN_PATH)}
      onAddMoney={(shortfall) => router.push(addMoneyHref(shortfall))}
    />
  );
}
