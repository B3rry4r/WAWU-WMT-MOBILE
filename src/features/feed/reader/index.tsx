import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Modal, Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import type { WebViewSource } from 'react-native-webview/lib/WebViewTypes';

import { IconButton } from '@/components/Button';
import { space } from '@/theme';

import { media, metrics, words } from '../look';

import { FAILED, originOf, pdfPageHtml, READY } from './pdfPage';
import type { ReaderProps } from './types';

export type { ReaderProps } from './types';

/**
 * H4's free pages, read in place, as the web build does: the PDF opens over the feed and closing it
 * puts the person back on the same post. iOS's web view shows a PDF itself; Android's does not, so
 * there the pages are drawn by a small page of our own (`pdfPage.ts`). If a file cannot be read in
 * place (a bad link, no connection to the page's reader), it opens in the phone's own PDF viewer
 * instead, and the feed stays where it was.
 */
export function PdfReader({ uri, title, visible, onClose, testID }: ReaderProps) {
  const insets = useSafeAreaInsets();
  const outside = useOutside(uri, onClose);

  const origin = originOf(uri);
  const source = useMemo(() => {
    if (Platform.OS !== 'android') return { uri };
    return origin ? { html: pdfPageHtml(uri, { ground: media.black, paper: media.page }), baseUrl: origin } : null;
  }, [uri, origin]);

  // A file that is not a web address goes straight to the phone's viewer, without opening the reader.
  const unreadable = source === null;
  useEffect(() => {
    if (visible && unreadable) outside();
  }, [visible, unreadable, outside]);

  return (
    <Modal visible={visible && !unreadable} animationType="slide" onRequestClose={onClose} transparent={false}>
      <View testID={testID} style={[styles.page, { paddingTop: Math.max(insets.top, metrics.tabsGap) }]}>
        <View style={styles.head}>
          <Text numberOfLines={1} style={[words.offerTitle, styles.title]}>
            {title}
          </Text>
          <IconButton icon="X" label="Close" tone="glass" onPress={onClose} testID={testID ? `${testID}-close` : undefined} />
        </View>
        {visible && source ? <Pages source={source} outside={outside} testID={testID} /> : null}
      </View>
    </Modal>
  );
}

/** Opens the file in the phone's own PDF viewer and closes the reader, which is what a file that cannot be read in place falls back to. */
function useOutside(uri: string, onClose: () => void) {
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });
  return useCallback(() => {
    Linking.openURL(uri)
      .catch(() => undefined)
      .finally(() => close.current());
  }, [uri]);
}

type PagesProps = { source: WebViewSource; outside: () => void; testID?: string };

/** The web view and its spinner. It exists only while the reader is open, so each opening starts again with the spinner. */
function Pages({ source, outside, testID }: PagesProps) {
  const [ready, setReady] = useState(false);
  // True once the first load is done: after it, a link inside the file does not take the reader anywhere else.
  const loaded = useRef(false);

  const onMessage = (event: WebViewMessageEvent) => {
    const message = event.nativeEvent.data;
    if (message === READY) setReady(true);
    else if (message === FAILED) outside();
  };

  return (
    <View style={styles.body}>
      <WebView
        testID={testID ? `${testID}-pages` : undefined}
        source={source}
        style={styles.web}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled={false}
        allowFileAccess={false}
        setSupportMultipleWindows={false}
        onMessage={onMessage}
        onLoadEnd={() => {
          loaded.current = true;
          if (Platform.OS !== 'android') setReady(true);
        }}
        onError={outside}
        onHttpError={outside}
        onShouldStartLoadWithRequest={() => !loaded.current}
      />
      {ready ? null : (
        <View style={styles.loading} pointerEvents="none" testID={testID ? `${testID}-loading` : undefined}>
          <ActivityIndicator color={media.ink} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: media.black },
  head: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: metrics.side, paddingVertical: space.sm },
  title: { flex: 1, color: media.ink },
  body: { flex: 1 },
  web: { flex: 1, backgroundColor: media.black },
  loading: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
});
