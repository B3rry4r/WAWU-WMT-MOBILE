import { usePathname } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { createButtonMetrics } from '@/components/CreateButton';
import { useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { pressScale } from '@/components/Button';
import { Toast, toastMetrics } from '@/components/Toast';
import { useIsCreator } from '@/features/create/CreateEntry';
import { layout, space, useWawu } from '@/theme';

import { clearThemeNotice, resumeThemeMusic, toggleThemeMusic, useThemeMusic } from './themeMusic';

/**
 * R-99: a round play and pause button for the WAWU theme.
 *
 * Size: the website's button is 44 across beside a 56 Create (about four fifths); the app's Create is 58, so this one is the
 * phone's own tap minimum, `layout.tapMin` (44), which is the same four fifths and the smallest a thumb can hit. Look: the
 * Create button's family (a circle, the accent kept for Create alone), so it is the chrome surface with the hairline edge and
 * the secondary ink, and the accent only on the icon while the song is on, as the website's is.
 */
export const musicMetrics = { size: layout.tapMin, glyph: 20, gap: space.md } as const;

/**
 * Where the song's button is not drawn: where a person reads or talks (the website's rule for its own button): a piece's page,
 * messages and a chat, a community's conversation, learning. Whole path segments, so `/contents` is not `/content`.
 */
const HIDDEN_ON = ['/content', '/inbox', '/chat', '/paid-thread', '/paid-questions', '/community', '/schools', '/library'] as const;

export function musicHiddenOn(pathname: string): boolean {
  return HIDDEN_ON.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/** The tab screens that draw Create: Home, Explore, Inbox and Me. The Wallet tab draws none. */
const NO_CREATE = ['/wallet'] as const;

/**
 * The button, standing over the tab screens (mounted once by the tabs layout, over the screen and the bar together). It stands
 * above the Create button on the same vertical line with a gap; for a person with no Create button, or on a tab that draws none, it
 * takes Create's place. Create is 58 across and this is 44, so the two are centred on one line. It also asks the player to play
 * again when the app opens, if the person left it on (nothing shows, nothing downloads).
 */
export function MusicLayer() {
  const pathname = usePathname();
  const creator = useIsCreator();
  const hidden = musicHiddenOn(pathname);

  useEffect(() => {
    if (!hidden) void resumeThemeMusic();
  }, [hidden]);

  if (hidden) return null;
  const stacked = creator && !NO_CREATE.some((path) => pathname === path);
  return <MusicButton stacked={stacked} />;
}

function MusicButton({ stacked }: { stacked: boolean }) {
  const { colors, shadows } = useWawu();
  const ring = useFocusRing();
  const music = useThemeMusic();
  const create = createButtonMetrics;

  // The scene ends where the tab bar begins, and Create sits `create.bottom` above that; this layer covers both.
  const slot = layout.tabbarH + create.bottom;
  const bottom = stacked ? slot + create.size + musicMetrics.gap : slot + (create.size - musicMetrics.size) / 2;
  const right = create.right + (create.size - musicMetrics.size) / 2;
  const label = music.on ? 'Pause music' : 'Play music';

  return (
    <>
      <Pressable
        testID="music-button"
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ busy: music.busy }}
        disabled={music.busy}
        onPress={() => void toggleThemeMusic()}
        {...ring.handlers}
        style={({ pressed }) => [
          styles.button,
          {
            right,
            bottom,
            backgroundColor: colors.surfaceChrome,
            borderColor: colors.borderHairline,
            boxShadow: shadows.float,
            transform: [{ scale: pressed ? pressScale : 1 }],
          },
          ring.style,
        ]}
      >
        {music.busy ? (
          <ActivityIndicator testID="music-working" size="small" color={colors.accentFg} />
        ) : (
          <Icon name={music.on ? 'Pause' : 'Play'} size={musicMetrics.glyph} color={music.on ? colors.accentFg : colors.textSecondary} />
        )}
      </Pressable>
      <Toast
        message={music.notice}
        tone="alert"
        placement="bottom"
        offset={layout.tabbarH + toastMetrics.bottom}
        lines={2}
        duration={6000}
        onHide={clearThemeNotice}
        testID="music-notice"
      />
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    width: musicMetrics.size,
    height: musicMetrics.size,
    borderRadius: musicMetrics.size / 2,
    borderWidth: StyleSheet.hairlineWidth * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
