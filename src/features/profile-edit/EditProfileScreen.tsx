import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { BottomSheet } from '@/components/BottomSheet';
import { useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { fieldMetrics } from '@/components/TextField';
import { Toast } from '@/components/Toast';
import { AuthField } from '@/features/auth/AuthField';
import { Banner } from '@/components/Banner';
import { font, radius, space, useWawu } from '@/theme';

import { fetchFields, fetchMe, fieldsKey, meKey, patchFields, patchMe } from './api';
import { BioField } from './BioField';
import { clearDraft, ensureDraft, rebaseDraft, updateDraft, useDraft } from './draft';
import { ScreenFrame } from '@/components/ScreenFrame';
import { PICK_FAILED, readFailure, saveFailure, uploadFailure, type SaveFailure } from './failure';
import { addedOf, changesOf, formFrom, hasProblems, isDirty, problemsOf, rebased, type ProfileForm } from './form';
import { HANDLE_PATTERN, PROFILE_LINK_PREFIX, limits } from './limits';
import { canPickImage, pickImage, type PickedImage } from './pickImage';
import { PictureHeader } from './PictureHeader';
import { PLATFORMS, SOCIAL, bareHandle } from './social';
import { SocialLogo, hasMark } from './SocialLogo';
import { uploadPicture, type PictureFolder } from './upload';

/** How long M8's own "Profile saved" stays up before the screen hands back (when the person is not going back to the Me tab). */
export const TOAST_MS = 1200;
/** design/_gen/me.js line 36 (M8): the body stacks its parts 14 apart. */
const BODY_GAP = 14;
/** me.js line 35, `socField`: 52 high, 16 corner, 14 in from the sides, 10 between logo and words, 15 type; the logo is 18. */
const socialRowMetrics = { height: 52, padH: 14, between: 10, logo: 18, fontSize: 15 } as const;
/** The skeleton's label line, as high as the 13 px field label. */
const LABEL_SKELETON_H = 14;
const LABEL_SKELETON_W = '30%';
const COVER_SKELETON_H = 110;
const BIO_SKELETON_H = 76;

export type EditProfileScreenProps = {
  /** The round back button. */
  onBack: () => void;
  /** A social row: opens M9. */
  onOpenSocial: () => void;
  /** After a save. The route decides where to go. */
  onSaved: () => void;
  /**
   * "Profile saved" is shown exactly once after a save, wherever the person lands. `true` (the default): this
   * screen shows it for a moment, then calls `onSaved`; for a person going back anywhere but the Me tab.
   * `false`: `onSaved` is called as soon as the save lands and nothing is drawn here, because the Me tab
   * shows M10's own notice (SHARED-CHANGES ME-01 F1).
   */
  ownNotice?: boolean;
};

/**
 * M8 · Edit profile. Reads the person's profile and its details (`GET /users/me`,
 * `GET /users/me/profile-fields`): loading, error and the filled form each have
 * their own state. Save sends only what changed, to the two routes that hold it,
 * then "Profile saved" shows once: here (`ownNotice`) or on the Me tab (M10).
 */
export function EditProfileScreen(props: EditProfileScreenProps) {
  const me = useQuery({ queryKey: meKey, queryFn: fetchMe, staleTime: 0, gcTime: 0 });
  const fields = useQuery({ queryKey: fieldsKey, queryFn: fetchFields, staleTime: 0, gcTime: 0 });

  if (me.isError || fields.isError) {
    const error = me.error ?? fields.error;
    return (
      <ScreenFrame idPrefix="edit" keyboard titleLines={1} title="Edit profile" onBack={props.onBack} gap={BODY_GAP} testID="edit-problem">
        <ErrorState
          testID="edit-error"
          title="Your profile did not load"
          message={readFailure(error)}
          onRetry={() => {
            if (me.isError) void me.refetch();
            if (fields.isError) void fields.refetch();
          }}
        />
      </ScreenFrame>
    );
  }

  if (!me.data || !fields.data) {
    return (
      <ScreenFrame idPrefix="edit" keyboard titleLines={1} title="Edit profile" onBack={props.onBack} gap={BODY_GAP} testID="edit-loading">
        <LoadingView label="Loading your profile">
          <View style={styles.skeleton}>
            <Skeleton height={COVER_SKELETON_H} radius={radius.media} />
            {[0, 1].map((i) => (
              <View key={i} style={styles.skeletonField}>
                <Skeleton width={LABEL_SKELETON_W} height={LABEL_SKELETON_H} />
                <Skeleton height={fieldMetrics.height} radius={fieldMetrics.radius} />
              </View>
            ))}
            <Skeleton height={BIO_SKELETON_H} radius={fieldMetrics.radius} />
          </View>
        </LoadingView>
      </ScreenFrame>
    );
  }

  return <EditForm {...props} account={me.data.wawuUserId} initial={formFrom(me.data, fields.data)} />;
}

type FormProps = EditProfileScreenProps & { account: string; initial: ProfileForm };

function EditForm({ account, initial, onBack, onOpenSocial, onSaved, ownNotice = true }: FormProps) {
  const queryClient = useQueryClient();
  const scrollRef = useRef<ScrollView>(null);
  // Idempotent: it starts the draft once per account, and an effect cleanup that ran and re-ran (development) finds it again.
  const started = ensureDraft(account, initial);
  const draft = useDraft() ?? started;
  const { form, base } = draft;

  const [failure, setFailure] = useState<SaveFailure>({});
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<'avatar' | 'cover' | null>(null);
  const [previews, setPreviews] = useState<{ avatar?: string; cover?: string }>({});
  const [leaving, setLeaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // M9 sits above this screen and edits the same draft; it is dropped when this screen closes.
  useEffect(() => () => clearDraft(), []);
  useEffect(() => {
    if (!saved || !ownNotice) return undefined;
    const timer = setTimeout(onSaved, TOAST_MS);
    return () => clearTimeout(timer);
  }, [saved, ownNotice, onSaved]);

  const added = addedOf(form);
  const problems = problemsOf(form, base);
  const dirty = isDirty(form, base);

  const save = useMutation({
    mutationFn: async () => {
      const { profile, fields } = changesOf(form, base);
      if (profile) {
        await patchMe(profile);
        rebaseDraft((b, f) => rebased(b, f, 'profile'));
      }
      if (fields) {
        await patchFields(fields);
        rebaseDraft((b, f) => rebased(b, f, 'fields'));
      }
    },
    onMutate: () => setFailure({}),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['profile'] });
      setSaved(true);
      if (ownNotice) AccessibilityInfo.announceForAccessibility('Profile saved');
      else onSaved();
    },
    onError: (error) => setFailure(saveFailure(error)),
  });

  const edit = (change: (current: ProfileForm) => ProfileForm) => {
    updateDraft(change);
    if (failure.handle || failure.banner) setFailure({});
    if (save.isError) save.reset();
  };

  const choose = async (kind: 'avatar' | 'cover') => {
    let picked: PickedImage | null;
    try {
      picked = await pickImage();
    } catch {
      // The photo library failed, or the chosen photo could not be read: said plainly. A cancel stays silent.
      setUploadError(PICK_FAILED);
      return;
    }
    if (!picked) return;
    const folder: PictureFolder = kind === 'avatar' ? 'avatars' : 'profile/cover';
    setUploadError(null);
    setUploading(kind);
    try {
      const url = await uploadPicture(folder, picked);
      // On a phone the app's own copy is deleted once it is up (SHARED-04, F3), so the preview is the uploaded picture.
      const preview = picked.discard ? url : picked.previewUri;
      setPreviews((current) => ({ ...current, [kind]: preview }));
      edit((current) => ({ ...current, [kind === 'avatar' ? 'avatarUrl' : 'coverUrl']: url }));
    } catch (error) {
      setUploadError(uploadFailure(error));
    } finally {
      setUploading(null);
    }
  };

  // Fields lock only while the request is on its way; Save stays off once it has gone through.
  const busy = save.isPending;
  const canSave = dirty && !hasProblems(problems) && uploading === null && !busy && !saved;
  const handleError = failure.handle ?? problems.handle;
  const banner = failure.banner ?? uploadError;

  const back = () => (dirty && !saved ? setLeaving(true) : onBack());

  return (
    <>
      <ScreenFrame idPrefix="edit" keyboard titleLines={1}
        testID="edit-profile"
        title="Edit profile"
        onBack={back}
        scrollRef={scrollRef}
        gap={BODY_GAP}
        action={{ label: 'Save', onPress: () => save.mutate(), disabled: !canSave, loading: save.isPending, testID: 'edit-save' }}
      >
        {banner ? <Banner tone="danger" title="That did not work" body={banner} testID="edit-banner" /> : null}
        <PictureHeader
          name={form.name}
          avatarUri={previews.avatar ?? form.avatarUrl}
          coverUri={previews.cover ?? form.coverUrl}
          canPick={canPickImage}
          busy={uploading}
          onPickAvatar={() => void choose('avatar')}
          onPickCover={() => void choose('cover')}
        />
        <AuthField
          scrollRef={scrollRef}
          label="Name"
          testID="edit-name"
          value={form.name}
          onChangeText={(name) => edit((current) => ({ ...current, name }))}
          error={problems.name}
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          disabled={busy}
        />
        <AuthField
          scrollRef={scrollRef}
          label="Handle"
          testID="edit-handle"
          // The "@" is part of what is drawn, not of what is kept.
          value={`@${form.handle}`}
          onChangeText={(typed) => edit((current) => ({ ...current, handle: bareHandle(typed) }))}
          hint={form.handle !== '' && HANDLE_PATTERN.test(form.handle) ? `${PROFILE_LINK_PREFIX}${form.handle}` : undefined}
          error={handleError}
          autoCapitalize="none"
          autoCorrect={false}
          disabled={busy}
        />
        <BioField
          testID="edit-bio"
          value={form.bio}
          onChangeText={(bio) => edit((current) => ({ ...current, bio }))}
          max={limits.bio}
          error={problems.bio}
          placeholder="Tell people what you do."
          disabled={busy}
        />
        <AuthField
          scrollRef={scrollRef}
          label="Location"
          testID="edit-location"
          value={form.location}
          onChangeText={(location) => edit((current) => ({ ...current, location }))}
          error={problems.location}
          placeholder="City, country"
          autoComplete="off"
          disabled={busy}
        />
        <View style={styles.social}>
          <Text variant="secondary" tone="textSecondary" style={styles.socialLabel}>
            Social links
          </Text>
          {added.map((platform) => (
            <SocialRow key={platform} testID={`edit-social-${platform}`} platform={platform} handle={form.handles[platform]} onPress={onOpenSocial} disabled={busy} />
          ))}
          {added.length < PLATFORMS.length ? <AddHandleRow onPress={onOpenSocial} disabled={busy} /> : null}
        </View>
      </ScreenFrame>
      <Toast message={saved && ownNotice ? 'Profile saved' : null} testID="profile-saved" />
      <BottomSheet visible={leaving} onClose={() => setLeaving(false)} label="Discard your changes?" testID="edit-discard">
        <Text variant="sheetTitleSm">Discard your changes?</Text>
        <Text variant="muted">What you changed has not been saved.</Text>
        <Button label="Keep editing" full onPress={() => setLeaving(false)} testID="edit-keep" />
        <Button
          label="Discard changes"
          variant="secondary"
          full
          onPress={() => {
            setLeaving(false);
            onBack();
          }}
          testID="edit-discard-confirm"
        />
      </BottomSheet>
    </>
  );
}

type SocialRowProps = { platform: keyof typeof SOCIAL; handle: string; onPress: () => void; disabled?: boolean; testID: string };

/** One added link, as M8 draws it: the logo and "@handle". Opening it is how a handle is changed (M9). */
function SocialRow({ platform, handle, onPress, disabled, testID }: SocialRowProps) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`${SOCIAL[platform].label}, @${handle}`}
      accessibilityHint="Opens your social links"
      disabled={disabled}
      onPress={onPress}
      {...ring.handlers}
      style={[styles.socialRow, { backgroundColor: colors.surfaceInput, borderColor: colors.borderHairline }, ring.style]}
    >
      <SocialLogo platform={platform} size={socialRowMetrics.logo} />
      <Text variant="body" numberOfLines={1} style={styles.socialText}>
        {hasMark(platform) ? null : (
          <Text variant="body" tone="textMuted">
            {`${SOCIAL[platform].label}  `}
          </Text>
        )}
        {`@${handle}`}
      </Text>
    </Pressable>
  );
}

function AddHandleRow({ onPress, disabled }: { onPress: () => void; disabled?: boolean }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID="edit-social-add"
      accessibilityRole="button"
      accessibilityLabel="Add handle"
      accessibilityHint="Opens your social links"
      disabled={disabled}
      onPress={onPress}
      {...ring.handlers}
      style={[styles.socialRow, { backgroundColor: colors.surfaceInput, borderColor: colors.borderHairline }, ring.style]}
    >
      <Icon name="Plus" size={socialRowMetrics.logo} color={colors.textMuted} />
      <Text variant="body" tone="textMuted" style={styles.socialText}>
        Add handle
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  skeleton: { gap: BODY_GAP },
  skeletonField: { gap: space.sm },
  social: { gap: space.sm },
  socialLabel: { ...font(600), fontSize: fieldMetrics.label },
  socialRow: {
    height: socialRowMetrics.height,
    borderRadius: radius.input,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: socialRowMetrics.between,
    paddingHorizontal: socialRowMetrics.padH,
  },
  socialText: { flex: 1, fontSize: socialRowMetrics.fontSize },
});
