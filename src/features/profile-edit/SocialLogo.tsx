import { Icon } from '@/components/icon';
import { useWawu } from '@/theme';

import { SOCIAL, type SocialPlatform } from './social';

/**
 * A platform's logo, from `@/components/icon`. LinkedIn has none (Simple Icons removed
 * that mark; the owner decides what it shows), so it draws the plain link glyph, and
 * `hasMark` tells a row to name the platform in words beside it.
 */
export function hasMark(platform: SocialPlatform): boolean {
  return SOCIAL[platform].mark !== null;
}

export function SocialLogo({ platform, size, muted = false }: { platform: SocialPlatform; size: number; muted?: boolean }) {
  const { colors } = useWawu();
  return <Icon name={SOCIAL[platform].mark ?? 'Link'} size={size} color={muted ? colors.textMuted : colors.textPrimary} />;
}
