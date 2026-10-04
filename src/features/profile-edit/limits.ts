/**
 * The lengths the Hub enforces on the fields M8 and M9 edit. Each is the
 * contract's own `maxLength` (`contract/openapi.mobile.json`), never the
 * canvas's: M8 draws "86 / 160" for the bio, the Hub takes 500 (the design
 * decides the UI, never the facts). `__tests__/limits.test.ts` reads the
 * contract and fails if one of these drifts from it.
 */
export const limits = {
  /** UpdateUserProfileDto.firstName and lastName (and middleName). */
  namePart: 80,
  /** UpdateUserProfileDto.handle. */
  handle: 30,
  /** UpdateUserProfileDto.bio. */
  bio: 500,
  /** UpdateProfileFieldsDto.location (PROVISIONAL on the Hub, ME-05). */
  location: 120,
  /** UpdateUserProfileDto.instagramHandle, xHandle, tiktokHandle and UpdateProfileFieldsDto.threadsHandle. */
  socialHandle: 50,
  /** UpdateUserProfileDto.youtubeUrl, facebookUrl, linkedinUrl. */
  socialUrl: 200,
} as const;

/** UpdateUserProfileDto.handle `pattern`: letters, numbers, dots and underscores. */
export const HANDLE_PATTERN = /^[a-zA-Z0-9_.]+$/;

/** CLAUDE.md, "Code": links are written `wawu/...`. M8's preview under the handle. */
export const PROFILE_LINK_PREFIX = 'wawu/';
