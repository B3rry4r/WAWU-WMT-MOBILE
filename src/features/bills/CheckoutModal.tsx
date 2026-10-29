import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { IconButton } from '@/components/Button';
import { Text } from '@/components/Text';
import { layout, space, useWawu } from '@/theme';

import type { CheckoutConfig } from './api';
import { allowsLoad, CHECKOUT_ORIGIN, checkoutHtml, parseCheckoutMessage, type CheckoutCustomer, type CheckoutEvent, type CheckoutLabels } from './checkoutPage';

export type CheckoutModalProps = {
  visible: boolean;
  config: CheckoutConfig | null;
  customer: CheckoutCustomer;
  labels: CheckoutLabels;
  /** What the window ended with. Called once per opening. */
  onEvent: (event: CheckoutEvent) => void;
};

/**
 * The payment window: Flutterwave's checkout in a web view over the review, with an X that closes it. Closing it, or Android's back,
 * is "nothing was charged" and goes back to the review. It tells the review only what it ended with (`CheckoutEvent`), once.
 */
export function CheckoutModal({ visible, config, customer, labels, onEvent }: CheckoutModalProps) {
  const { colors } = useWawu();
  const insets = useSafeAreaInsets();
  // The payment the window last finished loading for: a new payment starts with the spinner again.
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const loaded = config !== null && loadedFor === config.txRef;
  const told = useRef(false);
  const html = useMemo(() => (config ? checkoutHtml(config, customer, labels) : null), [config, customer, labels]);

  useEffect(() => {
    if (visible) told.current = false;
  }, [visible, config?.txRef]);

  const tell = (event: CheckoutEvent) => {
    if (told.current) return;
    told.current = true;
    onEvent(event);
  };

  const onMessage = (e: WebViewMessageEvent) => {
    const event = parseCheckoutMessage(e.nativeEvent.data);
    if (event) tell(event);
  };

  return (
    <Modal visible={visible && html !== null} animationType="slide" onRequestClose={() => tell({ kind: 'closed' })} transparent={false}>
      <View testID="checkout" style={[styles.page, { backgroundColor: colors.surfacePage, paddingTop: Math.max(insets.top, space.md) }]}>
        <View style={styles.head}>
          <Text variant="body" numberOfLines={1} style={styles.title}>
            {labels.title}
          </Text>
          <IconButton testID="checkout-close" icon="X" label="Close the payment window" onPress={() => tell({ kind: 'closed' })} />
        </View>
        {html ? (
          <View style={styles.web}>
            <WebView
              key={config?.txRef}
              testID="checkout-web"
              source={{ html, baseUrl: CHECKOUT_ORIGIN }}
              originWhitelist={['https://*', 'about:*']}
              javaScriptEnabled
              domStorageEnabled
              setSupportMultipleWindows={false}
              onShouldStartLoadWithRequest={(request) => allowsLoad(request.url)}
              onMessage={onMessage}
              onLoadEnd={() => setLoadedFor(config?.txRef ?? null)}
              onError={() => tell({ kind: 'unavailable' })}
              onHttpError={() => tell({ kind: 'unavailable' })}
              style={styles.web}
            />
            {loaded ? null : (
              <View pointerEvents="none" style={styles.spinner}>
                <ActivityIndicator color={colors.accent} />
              </View>
            )}
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md, paddingHorizontal: layout.gutter, paddingBottom: space.sm },
  title: { flex: 1 },
  web: { flex: 1 },
  spinner: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
});
