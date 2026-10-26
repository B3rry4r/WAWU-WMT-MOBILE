import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { BottomSheet } from '@/components/BottomSheet';
import { CountryPicker, type PickerItem } from '@/components/CountryPicker';
import { useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { TextField, fieldMetrics } from '@/components/TextField';
import { Toast } from '@/components/Toast';
import { AuthField } from '@/features/auth/AuthField';
import { regionWord } from '@/features/geo/place';
import { useCountries, useRegions } from '@/features/geo/useGeo';
import { Banner } from '@/components/Banner';
import { profileLink, readableLink } from '@/lib/appLinks';
import { font, radius, space, useWawu } from '@/theme';

import { changeHandle, fetchFieldsWithPlace, fetchMe, fieldsKey, meKey, patchFields, patchMe } from './api';
import { clearDraft, ensureDraft, rebaseDraft, updateDraft, useDraft } from './draft';
import { ScreenFrame } from '@/components/ScreenFrame';
import { PICK_FAILED, handleFailure, readFailure, saveFailure, uploadFailure, type SaveFailure } from './failure';
import { addedOf, changesOf, formFrom, hasProblems, heldCountry, isDirty, problemsOf, rebased, type ProfileForm } from './form';
import { HANDLE_PATTERN, limits } from './limits';
import { canPickImage, pickImage, type PickedImage } from './pickImage';
import { ExperienceSection, SkillsSection, useSkillInput } from './AboutSections';
import { PictureHeader } from './PictureHeader';
import { splitPhotoLink, withPhotoPosition } from '@/lib/photoPosition';
import { roleLinesOf } from '@/features/me/model';
import { addSkill } from './skills';
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
  /** A role row, or "Add a role" (no id): opens the role screen (FIX-113). Experience is drawn only where there is a screen to open (R-47). */
  onOpenRole?: (roleId?: string) => void;
  /** After a save. The route decides where to go. */
  onSaved: () => void;
  /**
   * "Profile saved" is shown exactly once after a save, wherever the person lands. `true` (the default): this
   * screen shows it for a moment, then calls `onSaved`; for a person going back anywhere but the Me tab.
   * `false`: `onSaved` is called as soon as the save lands and nothing is drawn here, because the Me tab
   * shows M10's own notice (SHARED-CHANGES ME-01 F1).
   */
  ownNotice?: boolean;
  /**
   * Opens the position screen for the profile picture or the cover (R-96): after a new photo is chosen, and from "Reposition" on a
   * photo already there. Left out, a photo is just chosen and no "Reposition" is drawn: there is no screen to open (R-47).
   */
  onPositionPhoto?: (kind: 'avatar' | 'cover') => void;
};

/**
 * M8 · Edit profile. Reads the person's profile and its details (`GET /users/me`,
 * `GET /users/me/profile-fields`): loading, error and the filled form each have
 * their own state. Save sends only what changed, to the two routes that hold it,
 * then "Profile saved" shows once: here (`ownNotice`) or on the Me tab (M10).
 */
export function EditProfileScreen(props: EditProfileScreenProps) {
  const me = useQuery({ queryKey: meKey, queryFn: fetchMe, staleTime: 0, gcTime: 0 });
  const fields = useQuery({ queryKey: fieldsKey, queryFn: fetchFieldsWithPlace, staleTime: 0, gcTime: 0 });

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

  return <EditForm {...props} account={me.data.wawuUserId} initial={formFrom(me.data, fields.data)} roles={roleLinesOf(me.data.experience ?? [])} />;
}

/** What M8 draws for a picture: the photo just chosen (shown before it is up) wears the position the form's link holds, so Reposition shows at once. */
function shownLink(preview: string | undefined, link: string | null): string | null {
  if (!preview) return link;
  return withPhotoPosition(preview, link ? splitPhotoLink(link).position : null);
}

type FormProps = EditProfileScreenProps & { account: string; initial: ProfileForm; roles: ReturnType<typeof roleLinesOf> };

function EditForm({ account, initial, roles, onBack, onOpenSocial, onOpenRole, onSaved, ownNotice = true, onPositionPhoto }: FormProps) {
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
  const [picking, setPicking] = useState<'country' | 'region' | null>(null);

  // The Hub's lists (GEO-03, R-85): every country, and the chosen country's own regions in its own word.
  const countries = useCountries();
  const countryRecord = countries.data?.find((c) => c.code === form.countryCode) ?? null;
  const regions = useRegions(form.countryCode && countryRecord?.hasRegions !== false ? form.countryCode : null);
  const regionList = regions.data ?? [];
  const regionsListed = regionList.length > 0;
  const word = regionWord(regionList);
  const countryItems: PickerItem[] | undefined = countries.data?.map((c) => ({ code: c.code, name: c.name, flag: c.flag }));
  const regionItems: PickerItem[] | undefined = regions.data?.map((r) => ({ code: r.code, name: r.name }));

  // M9 sits above this screen and edits the same draft; it is dropped when this screen closes.
  useEffect(() => () => clearDraft(), []);
  // The Hub may learn the person's country (WAWU ID's, else the phone's) after this screen opened, or while they typed. Where they have
  // chosen none, the screen takes over what the Hub holds, so a Save never leaves "Choose your country" over an account that has one.
  const taken = heldCountry(form, base, initial);
  useEffect(() => {
    if (!taken) return;
    updateDraft((f) => ({ ...f, ...taken }));
    rebaseDraft((b) => ({ ...b, ...taken }));
  }, [taken?.countryCode, taken?.regionCode]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!saved || !ownNotice) return undefined;
    const timer = setTimeout(onSaved, TOAST_MS);
    return () => clearTimeout(timer);
  }, [saved, ownNotice, onSaved]);

  const added = addedOf(form);
  const problems = problemsOf(form, base);
  const dirty = isDirty(form, base);

  // What is typed in the skills box and not yet added (SWEEP-APP-8 L5): Save adds it, or says why it cannot be.
  const skillInput = useSkillInput();
  const typedSkill = skillInput.typed.trim() !== '';
  // A typed skill the screen has already said it cannot add leaves Save off until the words change.
  const skillToAdd = typedSkill && skillInput.problem === undefined;

  const save = useMutation({
    mutationFn: async (target: ProfileForm = form) => {
      const { handle, profile, fields } = changesOf(target, base);
      // The username first: it is the part another account can take, so a refusal leaves nothing else half saved.
      if (handle) {
        try {
          await changeHandle(handle);
        } catch (error) {
          throw handleFailure(error);
        }
        rebaseDraft((b, f) => rebased(b, f, 'handle'));
      }
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
      // A new photo starts centred: its link carries no position. The person then places it, or leaves it as it is.
      edit((current) => ({ ...current, [kind === 'avatar' ? 'avatarUrl' : 'coverUrl']: url }));
      onPositionPhoto?.(kind);
    } catch (error) {
      setUploadError(uploadFailure(error));
    } finally {
      setUploading(null);
    }
  };

  // Fields lock only while the request is on its way; Save stays off once it has gone through.
  const busy = save.isPending;
  const canSave = (dirty || skillToAdd) && !hasProblems(problems) && uploading === null && !busy && !saved;
  const handleError = failure.handle ?? problems.handle;
  const banner = failure.banner ?? uploadError;

  const back = () => ((dirty || typedSkill) && !saved ? setLeaving(true) : onBack());

  /** Save: a skill typed and not added is added first (a repeat, an over-long one or a full list is said in words and nothing is saved). */
  const submit = () => {
    if (!typedSkill) {
      save.mutate(form);
      return;
    }
    const next = addSkill(form.skills, skillInput.typed);
    skillInput.setProblem(next.problem);
    if (next.problem !== undefined) return;
    const target = { ...form, skills: next.list };
    skillInput.setTyped('');
    updateDraft(() => target);
    save.mutate(target);
  };

  return (
    <>
      <ScreenFrame idPrefix="edit" keyboard titleLines={1}
        testID="edit-profile"
        title="Edit profile"
        onBack={back}
        scrollRef={scrollRef}
        gap={BODY_GAP}
        action={{ label: 'Save', onPress: submit, disabled: !canSave, loading: save.isPending, testID: 'edit-save' }}
      >
        {banner ? <Banner tone="danger" title="That did not work" body={banner} testID="edit-banner" /> : null}
        <PictureHeader
          name={form.name}
          avatarUri={shownLink(previews.avatar, form.avatarUrl)}
          coverUri={shownLink(previews.cover, form.coverUrl)}
          canPick={canPickImage}
          busy={uploading}
          onPickAvatar={() => void choose('avatar')}
          onPickCover={() => void choose('cover')}
          onReposition={onPositionPhoto}
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
          hint={form.handle !== '' && HANDLE_PATTERN.test(form.handle) ? readableLink(profileLink(form.handle)) : undefined}
          error={handleError}
          autoCapitalize="none"
          autoCorrect={false}
          disabled={busy}
        />
        <TextField
          multiline
          label="Bio"
          testID="edit-bio"
          value={form.bio}
          onChangeText={(bio) => edit((current) => ({ ...current, bio }))}
          max={limits.bio}
          error={problems.bio}
          placeholder="Tell people what you do."
          disabled={busy}
        />
        <TextField
          label="Country"
          testID="edit-country"
          value={form.countryName ? `${countryRecord?.flag ?? ''}  ${form.countryName}`.trim() : ''}
          placeholder={countries.isError ? 'Could not load the countries' : 'Choose your country'}
          trailingIcon="ChevronDown"
          disabled={busy}
          onPress={() => setPicking('country')}
        />
        {!form.countryCode ? (
          <TextField label="Region" testID="edit-region" value="" placeholder="Choose a country first" trailingIcon="ChevronDown" disabled />
        ) : regionsListed || regions.isError ? (
          <TextField
            label={word}
            testID="edit-region"
            value={form.regionName}
            placeholder={regions.isError ? 'Could not load the list' : `Choose your ${word.toLowerCase()}`}
            trailingIcon="ChevronDown"
            disabled={busy}
            onPress={() => setPicking('region')}
          />
        ) : regions.isPending && regions.fetchStatus !== 'idle' ? (
          <TextField label="Region" testID="edit-region" value="" placeholder="Loading" trailingIcon="ChevronDown" disabled />
        ) : (
          <AuthField
            scrollRef={scrollRef}
            label="Region"
            testID="edit-region"
            value={form.regionName}
            onChangeText={(regionName) => edit((current) => ({ ...current, regionCode: null, regionName }))}
            autoComplete="off"
            disabled={busy}
          />
        )}
        <AuthField
          scrollRef={scrollRef}
          label="City"
          testID="edit-city"
          value={form.city}
          onChangeText={(city) => edit((current) => ({ ...current, city }))}
          error={problems.city}
          placeholder="City or town"
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
        {onOpenRole ? <ExperienceSection roles={roles} onOpen={onOpenRole} disabled={busy} /> : null}
        <SkillsSection skills={form.skills} onChange={(skills) => edit((current) => ({ ...current, skills }))} disabled={busy} input={skillInput} />
      </ScreenFrame>
      <CountryPicker
        visible={picking === 'country'}
        onClose={() => setPicking(null)}
        title="Where do you live?"
        searchLabel="Search countries"
        items={countryItems}
        selected={form.countryCode}
        failed={countries.isError}
        onRetry={() => void countries.refetch()}
        testID="edit-country-sheet"
        onPick={(code) => {
          setPicking(null);
          const chosen = countries.data?.find((c) => c.code === code);
          if (!chosen || code === form.countryCode) return;
          // The region belonged to the old country: it goes with it.
          edit((current) => ({ ...current, countryCode: chosen.code, countryName: chosen.name, regionCode: null, regionName: '' }));
        }}
      />
      <CountryPicker
        visible={picking === 'region'}
        onClose={() => setPicking(null)}
        title={`Choose your ${word.toLowerCase()}`}
        searchLabel="Search by name"
        items={regionItems}
        selected={form.regionCode}
        failed={regions.isError}
        onRetry={() => void regions.refetch()}
        testID="edit-region-sheet"
        onPick={(code) => {
          setPicking(null);
          const chosen = regions.data?.find((r) => r.code === code);
          if (chosen) edit((current) => ({ ...current, regionCode: chosen.code, regionName: chosen.name }));
        }}
      />
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
