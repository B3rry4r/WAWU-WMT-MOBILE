import { Icon } from '@/components/icon';
import { useWawu } from '@/theme';

import { SOCIAL, type SocialPlatform } from './social';

/**
 * A platform's logo. The icon set carries the Instagram and Facebook marks
 * only; the others (TikTok, YouTube, X, Threads, LinkedIn) draw the plain link
 * glyph until `@/components/icon` has their marks (SHARED-CHANGES.md, ME-06),
 * and `hasMark` tells a row to name the platform in words beside it.
 */
export function hasMark(platform: SocialPlatform): boolean {
  return SOCIAL[platform].mark !== null;
}

export function SocialLogo({ platform, size, muted = false }: { platform: SocialPlatform; size: number; muted?: boolean }) {
  const { colors } = useWawu();
  return <Icon name={SOCIAL[platform].mark ?? 'Link'} size={size} color={muted ? colors.textMuted : colors.textPrimary} />;
}
