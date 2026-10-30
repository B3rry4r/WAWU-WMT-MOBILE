import { usePathname } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { floatingMetrics, musicBottom, musicRight } from '@/components/floating';
import { useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { pressScale } from '@/components/Button';
import { toastMetrics } from '@/components/Toast';
import { useIsCreator } from '@/features/create/CreateEntry';
import { layout, useWawu } from '@/theme';

import { resumeThemeMusic, toggleThemeMusic, useThemeMusic } from './themeMusic';
import { ThemeNotice } from './ThemeNotice';

/**
 * R-99: a round play and pause button for the WAWU theme.
 *
 * Size: the website's button is 44 across beside a 56 Create (about four fifths); the app's Create is 58, so this one is the
 * phone's own tap minimum, `layout.tapMin` (44), which is the same four fifths and the smallest a thumb can hit.
 * Place (R-110 point 3, owner, 30 Oct 2026; it moves it from above Create to beside it): on Create's line, to its left, so the pair is one
 * row high and never stands in the middle of the content (`@/components/floating`). Look: the
 * Create button's family (a circle, the accent kept for Create alone), so it is the chrome surface with the hairline edge and
 * the secondary ink, and the accent only on the icon while the song is on, as the website's is.
 */
export const musicMetrics = { size: floatingMetrics.music, glyph: 20, gap: floatingMetrics.gap } as const;

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
 * to the left of the Create button on the same line with a gap; for a person with no Create button, or on a tab that draws none, it
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

  // The scene ends where the tab bar begins, and Create sits above that; this layer covers both, so the bar's height is added.
  const bottom = layout.tabbarH + musicBottom();
  const right = musicRight(stacked);
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
      <ThemeNotice offset={layout.tabbarH + toastMetrics.bottom} />
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
