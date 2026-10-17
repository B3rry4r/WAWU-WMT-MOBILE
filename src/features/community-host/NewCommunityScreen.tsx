import { useMutation } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { useFocusRing } from '@/components/focusRing';
import { Icon, type IconName } from '@/components/icon';
import { IconTile } from '@/components/IconTile';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { CreateFrame } from '@/features/create/CreateFrame';
import { myCommunitiesKey } from '@/features/communities/api';
import { canPickImage, pickImage, type PickedImage } from '@/features/profile-edit/pickImage';
import { PICK_FAILED } from '@/features/profile-edit/failure';
import { PickFailed } from '@/features/profile-edit/readPicked';
import { radius, space, useWawu } from '@/theme';

import { createRoom, uploadCover, type Room } from './api';
import { pictureError, priceError, roomInput, validName, validPurpose, type Kind } from './model';

/** design/_gen/inbox.js lines 86 to 87: the picture box is 120 high with a 22 corner and a 1.5 ring; the kind cards 12 by 14 inside, 12 between their parts. */
const metrics = { picture: 120, pictureIcon: 26, between: 16, card: { padV: 12, padH: 14, tile: 44 }, radio: 24, dot: 10, ringOn: 1.5, ringOff: 1, title: 15, sub: 12.5 } as const;

export type NewCommunityScreenProps = {
  onClose: () => void;
  /** The room was made: I33 opens for it. */
  onCreated: (room: Room) => void;
};

/**
 * I32 · New community (INBOX-14). A picture, a name, what it is for, and who can join: Open (anyone) or Private (members pay the host's
 * price for 30 days, R-63). A private room needs a picture and a price, which the host types here; the Hub checks both and the price's
 * bounds and says so in its own words. Creator accounts only: the route sends anyone else away. The board's line about the host's share is
 * not drawn, because no route serves a room's split (G-INBOX-14-1).
 */
export function NewCommunityScreen({ onClose, onCreated }: NewCommunityScreenProps) {
  const [picture, setPicture] = useState<PickedImage | null>(null);
  const [pictureNote, setPictureNote] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [kind, setKind] = useState<Kind>('open');
  const [price, setPrice] = useState('');
  const [tried, setTried] = useState(false);

  const make = useMutation(
    {
      mutationFn: async () => {
        // The picture goes up first; the room carries the address the Hub gives back. A retry after a failed save sends the same picture again.
        const imageUrl = picture ? await uploadCover(picture) : undefined;
        // A private room is never sent without its price (R-63): `roomInput` refuses to make one.
        const input = roomInput({ name, purpose, kind, price, imageUrl });
        if (!input) throw new Error('The community is not ready to be created.');
        return createRoom(input);
      },
      onSuccess: async (room) => {
        await queryClient.invalidateQueries({ queryKey: myCommunitiesKey });
        onCreated(room);
      },
    },
    queryClient,
  );

  const choose = async () => {
    setPictureNote(null);
    try {
      const picked = await pickImage();
      if (picked) setPicture(picked);
    } catch (error) {
      setPictureNote(error instanceof PickFailed ? PICK_FAILED : PICK_FAILED);
    }
  };

  const errors = {
    name: validName(name) ? undefined : 'A name is 3 to 80 characters.',
    purpose: validPurpose(purpose) ? undefined : 'Say what it is for, in up to 500 characters.',
    picture: pictureError(kind, picture !== null),
    price: kind === 'private' ? priceError(price) : undefined,
  };
  const ready = !errors.name && !errors.purpose && !errors.picture && !errors.price;
  const submit = () => {
    setTried(true);
    if (!ready || make.isPending) return;
    make.mutate();
  };
  const failure = make.isError ? (isApiError(make.error) ? make.error.message : 'The community was not created. Try again.') : null;

  return (
    <CreateFrame
      testID="new-community"
      title="New community"
      onLeave={onClose}
      gap={metrics.between}
      foot={<Button label="Create community" full loading={make.isPending} onPress={submit} testID="new-community-create" />}
    >
      {failure ? <Banner tone="danger" icon="TriangleAlert" title="The community was not created" body={failure} testID="new-community-error" /> : null}
      <PictureBox picture={picture} onPress={() => void choose()} invalid={tried && Boolean(errors.picture)} />
      {pictureNote ? (
        <Text variant="errorLine" tone="danger" accessibilityRole="alert" testID="new-community-picture-note">
          {pictureNote}
        </Text>
      ) : tried && errors.picture ? (
        <Text variant="errorLine" tone="danger" accessibilityRole="alert" testID="new-community-picture-error">
          {errors.picture}
        </Text>
      ) : null}
      <TextField label="Name" value={name} onChangeText={setName} placeholder="Aba tailors circle" maxLength={80} error={tried ? errors.name : undefined} testID="new-community-name" />
      <TextField
        label="What it’s for"
        value={purpose}
        onChangeText={setPurpose}
        placeholder="Tailors in Aba swapping patterns, suppliers and prices."
        multiline
        max={500}
        error={tried ? errors.purpose : undefined}
        testID="new-community-purpose"
      />
      <View style={styles.kinds} accessibilityRole="radiogroup">
        <Text variant="label" tone="textMuted">
          Who can join
        </Text>
        <KindCard testID="new-community-open" icon="Users" title="Open" sub="Anyone can join and read" on={kind === 'open'} onPress={() => setKind('open')} />
        <KindCard
          testID="new-community-private"
          icon="Lock"
          title="Private"
          sub="Members pay to join. You set the price. Needs a cover image."
          on={kind === 'private'}
          onPress={() => setKind('private')}
        />
      </View>
      {kind === 'private' ? (
        <TextField
          label="Price for 30 days (₦)"
          value={price}
          onChangeText={(value) => setPrice(value.replace(/[^0-9]/g, ''))}
          placeholder="2000"
          keyboardType="number-pad"
          hint="Members pay this each time they join or renew."
          error={tried ? errors.price : undefined}
          testID="new-community-price"
        />
      ) : null}
    </CreateFrame>
  );
}

function PictureBox({ picture, onPress, invalid }: { picture: PickedImage | null; onPress: () => void; invalid: boolean }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID="new-community-picture"
      accessibilityRole="button"
      accessibilityLabel={picture ? 'Change the picture' : 'Add a picture'}
      disabled={!canPickImage}
      onPress={onPress}
      {...ring.handlers}
      style={[
        styles.picture,
        {
          backgroundColor: colors.surfaceSunken,
          boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: metrics.ringOn, color: invalid ? colors.danger : colors.borderStrong, inset: true }],
        },
        ring.style,
      ]}
    >
      {picture ? (
        <Image testID="new-community-picture-image" source={{ uri: picture.previewUri }} contentFit="cover" style={StyleSheet.absoluteFill} accessibilityIgnoresInvertColors />
      ) : (
        <>
          <Icon name="ImagePlus" size={metrics.pictureIcon} color={colors.textSecondary} strokeWidth={2} />
          <Text variant="body" tone="textSecondary" style={styles.pictureLabel}>
            Add a picture
          </Text>
        </>
      )}
    </Pressable>
  );
}

function KindCard({ icon, title, sub, on, onPress, testID }: { icon: IconName; title: string; sub: string; on: boolean; onPress: () => void; testID: string }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="radio"
      accessibilityState={{ selected: on }}
      accessibilityLabel={`${title}. ${sub}`}
      onPress={onPress}
      {...ring.handlers}
      style={[
        styles.card,
        {
          backgroundColor: colors.surfaceCard,
          boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: on ? metrics.ringOn : metrics.ringOff, color: on ? colors.accent : colors.borderHairline, inset: true }],
        },
        ring.style,
      ]}
    >
      <IconTile icon={icon} tone={on ? 'accent' : 'neutral'} size={metrics.card.tile} />
      <View style={styles.cardWords}>
        <Text variant="cardTitle">{title}</Text>
        <Text variant="caption" tone="textMuted" style={{ fontSize: metrics.sub }}>
          {sub}
        </Text>
      </View>
      <View style={[styles.radio, { borderColor: on ? colors.accent : colors.borderStrong }]}>{on ? <View style={[styles.dot, { backgroundColor: colors.accent }]} /> : null}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  picture: { height: metrics.picture, borderRadius: radius.card, alignItems: 'center', justifyContent: 'center', gap: space.sm, overflow: 'hidden' },
  pictureLabel: { fontWeight: '600' },
  kinds: { gap: space.md },
  card: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: metrics.card.padV, paddingHorizontal: metrics.card.padH, borderRadius: radius.card },
  cardWords: { flex: 1, minWidth: 0, gap: space.xs },
  radio: { width: metrics.radio, height: metrics.radio, borderRadius: radius.chip, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  dot: { width: metrics.dot, height: metrics.dot, borderRadius: radius.chip },
});
