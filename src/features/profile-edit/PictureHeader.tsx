import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { IconButton } from '@/components/Button';
import { useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { radius, space, useWawu } from '@/theme';

/**
 * design/_gen/me.js line 36 (M8): a 110 high cover with a 20 corner; the 72
 * avatar 16 in from the left, hanging 34 below it, ringed 4 in the page colour;
 * a 28 camera badge on the avatar ringed 3; a 42 glass camera 10 in from the
 * cover's right and bottom edges; 26 of room before the first field.
 */
const headerMetrics = { cover: 110, avatar: 72, avatarRing: 4, avatarLeft: 16, avatarHang: 34, badge: 28, badgeRing: 3, badgeInset: -2, badgeIcon: 14, glassInset: 10, after: 26 } as const;

export type PictureHeaderProps = {
  name: string;
  avatarUri: string | null;
  coverUri: string | null;
  /** Without a way to choose a picture (the phone build until the photo picker is installed) the camera buttons are not drawn. */
  canPick: boolean;
  busy: 'avatar' | 'cover' | null;
  onPickAvatar: () => void;
  onPickCover: () => void;
};

/** M8's top: the cover picture, and the avatar over its bottom edge, each with a camera button to change it. */
export function PictureHeader({ name, avatarUri, coverUri, canPick, busy, onPickAvatar, onPickCover }: PictureHeaderProps) {
  const { colors } = useWawu();
  const badgeRing = useFocusRing();
  return (
    <View style={styles.root}>
      <View testID="edit-cover" style={[styles.cover, { backgroundColor: colors.surfaceSunken }]}>
        {coverUri ? <Image source={{ uri: coverUri }} contentFit="cover" style={StyleSheet.absoluteFill} accessibilityLabel="Your cover picture" /> : null}
        {canPick ? (
          <View style={styles.glass}>
            <IconButton icon="Camera" label={coverUri ? 'Change cover picture' : 'Add a cover picture'} tone="glass" onPress={onPickCover} disabled={busy !== null} testID="edit-cover-pick" />
          </View>
        ) : null}
      </View>
      <View style={[styles.avatarRing, { backgroundColor: colors.surfacePage }]}>
        <Avatar name={name || undefined} size={headerMetrics.avatar} source={avatarUri ?? undefined} testID="edit-avatar" />
        {canPick ? (
          <Pressable
            testID="edit-avatar-pick"
            accessibilityRole="button"
            accessibilityLabel={avatarUri ? 'Change profile picture' : 'Add a profile picture'}
            disabled={busy !== null}
            onPress={onPickAvatar}
            hitSlop={space.sm}
            {...badgeRing.handlers}
            style={[styles.badge, { backgroundColor: colors.accent, borderColor: colors.surfacePage }, badgeRing.style]}
          >
            <Icon name="Camera" size={headerMetrics.badgeIcon} color={colors.textOnAccent} strokeWidth={2.2} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export const pictureHeaderMetrics = headerMetrics;

const styles = StyleSheet.create({
  root: { marginBottom: headerMetrics.after },
  cover: { height: headerMetrics.cover, borderRadius: radius.media, overflow: 'hidden' },
  glass: { position: 'absolute', right: headerMetrics.glassInset, bottom: headerMetrics.glassInset },
  avatarRing: {
    position: 'absolute',
    left: headerMetrics.avatarLeft - headerMetrics.avatarRing,
    bottom: -(headerMetrics.avatarHang + headerMetrics.avatarRing),
    padding: headerMetrics.avatarRing,
    borderRadius: radius.chip,
  },
  badge: {
    position: 'absolute',
    right: headerMetrics.avatarRing + headerMetrics.badgeInset,
    bottom: headerMetrics.avatarRing + headerMetrics.badgeInset,
    width: headerMetrics.badge,
    height: headerMetrics.badge,
    borderRadius: radius.chip,
    borderWidth: headerMetrics.badgeRing,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
