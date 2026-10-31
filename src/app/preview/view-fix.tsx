import { router, useLocalSearchParams } from 'expo-router';
import { Component, createElement, useEffect, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Modal, Platform, StyleSheet, Text as NativeText, View, type LayoutChangeEvent } from 'react-native';

import { CommentsSheet } from '@/features/content-detail/CommentsSheet';
import { Media } from '@/features/content-detail/Media';
import type { Page } from '@/features/content-detail/usePage';
import type { FeedItem } from '@/features/feed/api';
import { PictureViewer } from '@/features/feed/PictureViewer';
import { LeaveDevRoute } from '@/features/shell/LeaveDevRoute';
import { RequestSheet } from '@/features/chat/RequestSheet';
import { queryClient } from '@/api/query';
import { NewCommunityScreen } from '@/features/community-host/NewCommunityScreen';
import { DetailsScreen } from '@/features/create/DetailsScreen';
import { TrailerScreen } from '@/features/movies/TrailerScreen';
import { detailKey } from '@/features/movies/api';
import { SearchScreen } from '@/features/search/SearchScreen';
import { BankSheet } from '@/features/wallet/BankSheet';
import { banksQuery } from '@/features/wallet/api/payoutAccount';
import { space, useWawu } from '@/theme';

/**
 * Development-only gallery for VIEW-FIX (R-117), for pictures beside H19 / H24 (the video piece page with its full-screen button), H3 (a
 * photo set opened full screen) and H21 (the comment box with the keyboard up): /preview/view-fix?state=video|viewer|comments|request.
 * The keyboard states run the app's real Android code path in the browser: `Platform.OS` reads android while this page is open, the page
 * catches the keyboard listeners the screens register, and `window.__keyboardUp()` says what Android says (`keyboardDidShow`, 336 high),
 * drawing a stand-in keyboard of that height. React Native for the web draws `KeyboardAvoidingView` as a plain view, so this page gives it
 * the phone's own `padding` rule (the overlap of its frame with the keyboard, from `keyboardDidShow`) while it is open; the phone's real
 * `KeyboardAvoidingView` is proven in jest (`viewFixKeyboard.test.tsx`). A release build redirects home.
 */
const KEYBOARD = 336;
/** A picture drawn from two theme colours (no network): a gradient with a soft disc. */
const picture = (from: string, to: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="800" height="1000" fill="url(#g)"/><circle cx="400" cy="420" r="170" fill="${to}" fill-opacity="0.5"/></svg>`)}`;

const videoPiece = (cover: string) => ({
  id: 'preview-video',
  title: 'VFX for Beginners',
  contentType: 'video',
  accessType: 'paid',
  price: 8000,
  previewAssetUrl: 'https://files.invalid/preview.mp4',
  fullAssetUrl: null,
  fullAssetLocked: true,
  pageCount: null,
  coverUrl: cover,
}) as unknown as FeedItem;

const comment = (id: string, name: string, text: string, likes: number) => ({ id, createdAt: '2026-10-30T10:00:00.000Z', text, contentId: 'preview-video', likes, authorWawuId: id, replyToId: null, author: { wawuId: id, verification: { creator: { verified: false, expiresAt: null }, professional: { verified: false, expiresAt: null } }, name, handle: null, avatarUrl: null }, likedByMe: false });
const page = {
  comments: {
    isPending: false,
    isError: false,
    data: { pages: [{ items: [comment('c1', 'Kemi Okafor', 'The colour grade in the second half is beautiful.', 12), comment('c2', 'Tife Adeola', 'Which plugin did you use for the glow?', 3)], nextPage: null }] },
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: () => undefined,
    refetch: () => undefined,
  },
  post: { isPending: false, mutate: () => undefined },
  likeComment: { mutate: () => undefined },
} as unknown as Page;

type Say = (event: string) => void;
type Avoiding = Component<Record<string, unknown>, { bottom?: number }> & { frame?: { y: number; height: number } };
const caught: Record<string, ((e: unknown) => void)[]> = {};

/** The page reads android and catches the keyboard listeners until it closes; `restore` puts the previous values back. */
function installAndroidPhone() {
  const was = Platform.OS;
  const addListener = Keyboard.addListener;
  (Platform as { OS: string }).OS = 'android';
  (Keyboard as { addListener: unknown }).addListener = (event: string, fn: (e: unknown) => void) => {
    (caught[event] ??= []).push(fn);
    return { remove: () => void (caught[event] = (caught[event] ?? []).filter((l) => l !== fn)) };
  };
  // The phone's `padding` rule for a `KeyboardAvoidingView` (react-native's own, ported): its foot is padded by what the keyboard covers of it.
  const proto = (KeyboardAvoidingView as unknown as { prototype: Record<string, unknown> }).prototype;
  const stub = { mount: proto.componentDidMount, render: proto.render };
  proto.componentDidMount = function (this: Avoiding) {
    Keyboard.addListener('keyboardDidShow', (e: { endCoordinates: { screenY: number } }) => {
      const frame = this.frame;
      if (frame) this.setState({ bottom: Math.max(frame.y + frame.height - e.endCoordinates.screenY, 0) });
    });
  };
  proto.render = function (this: Avoiding) {
    const { behavior, contentContainerStyle, keyboardVerticalOffset, children, style, onLayout, ...rest } = this.props as Record<string, any>;
    void contentContainerStyle;
    void keyboardVerticalOffset;
    return createElement(
      View,
      {
        ...rest,
        style: [style, behavior === 'padding' ? { paddingBottom: this.state?.bottom ?? 0 } : null],
        onLayout: (event: LayoutChangeEvent) => {
          this.frame = event.nativeEvent.layout;
          onLayout?.(event);
        },
      },
      children,
    );
  };
  const say: Say = (event) => (caught[event] ?? []).forEach((l) => l({ endCoordinates: { screenY: window.innerHeight - KEYBOARD, height: KEYBOARD, screenX: 0, width: window.innerWidth }, duration: 0 }));
  (window as unknown as { __keyboardUp: () => void }).__keyboardUp = () => say('keyboardDidShow');
  return {
    restore: () => {
      (Platform as { OS: string }).OS = was;
      (Keyboard as { addListener: unknown }).addListener = addListener;
      proto.componentDidMount = stub.mount;
      proto.render = stub.render;
    },
  };
}

/** The reads the round 1 screens make, put in the app's cache so the page draws them with no Hub (the bank list, one movie with a trailer). */
const BANKS = [{ code: '044', name: 'Access Bank' }, { code: '058', name: 'Guaranty Trust Bank' }, { code: '011', name: 'First Bank of Nigeria' }, { code: '033', name: 'United Bank for Africa' }, { code: '057', name: 'Zenith Bank' }, { code: '090267', name: 'Kuda Microfinance Bank' }];
function seed() {
  queryClient.setQueryData(banksQuery.queryKey, BANKS);
  queryClient.setQueryData(detailKey('m1'), { id: 'm1', title: 'Night Market', premiering: false, premierDate: null, mustAgreeTerms: false, trailer: { kind: 'file', url: 'https://files.invalid/trailer.mp4' } });
}

export default function ViewFixPreview() {
  useState(seed);
  const { colors } = useWawu();
  const { state = 'video' } = useLocalSearchParams<{ state?: string }>();
  const [phone] = useState(installAndroidPhone);
  const [keyboard, setKeyboard] = useState(false);
  useEffect(() => {
    const say = (window as unknown as { __keyboardUp: () => void }).__keyboardUp;
    (window as unknown as { __keyboardUp: () => void }).__keyboardUp = () => {
      say();
      setKeyboard(true);
    };
    return phone.restore;
  }, [phone]);
  if (!__DEV__) return <LeaveDevRoute />;
  // Closing a sheet or the viewer leaves the gallery on an empty page.
  const close = () => router.setParams({ state: 'closed' });

  return (
    <View style={[styles.page, { backgroundColor: colors.surfacePage }]}>
      {state === 'video' ? (
        <View style={styles.piece}>
          <Media piece={videoPiece(picture(colors.accent, colors.surfaceScrim))} tag={{ icon: 'Play', text: 'Video · 4:12' }} by="Tife Adeola" />
        </View>
      ) : null}
      {state === 'viewer' ? (
        <PictureViewer
          pictures={[
            { key: '1', uri: picture(colors.accent, colors.surfaceScrim), label: 'Photo 1 of 2' },
            { key: '2', uri: picture(colors.accentFg, colors.surfaceScrim), label: 'Photo 2 of 2' },
          ]}
          index={0}
          visible
          onClose={close}
          testID="preview-viewer"
        />
      ) : null}
      {state === 'comments' ? <CommentsSheet visible onClose={close} count={2} page={page} /> : null}
      {state === 'request' ? <RequestSheet visible chatId="c" name="Bisi" onClose={close} onSent={close} onOpenWallet={close} /> : null}
      {state === 'community' ? <View style={styles.full}><NewCommunityScreen onClose={close} onCreated={close} /></View> : null}
      {state === 'details' ? <View style={styles.full}><DetailsScreen format="video" onBack={close} onContinue={close} /></View> : null}
      {state === 'search' ? <View style={styles.full}><SearchScreen onCancel={close} onOpenRoom={close} /></View> : null}
      {state === 'trailer' ? <View style={styles.full}><TrailerScreen movieId="m1" onClose={close} /></View> : null}
      {state === 'bank' ? <BankSheet visible onClose={close} onPick={close} selectedCode={null} /> : null}
      {keyboard ? (
        <Modal transparent visible animationType="none" statusBarTranslucent>
          <View pointerEvents="none" style={styles.keyboardHost}>
            <View testID="preview-keyboard" style={[styles.keyboard, { height: KEYBOARD, backgroundColor: colors.surfaceElevated }]}>
              <NativeText style={{ color: colors.textMuted }}>Keyboard, {KEYBOARD} high (simulated)</NativeText>
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: space.lg, justifyContent: 'center' },
  piece: { width: '100%' },
  full: { ...StyleSheet.absoluteFill },
  keyboardHost: { flex: 1, justifyContent: 'flex-end' },
  keyboard: { alignItems: 'center', justifyContent: 'center' },
});
