import contract from '../../../../contract/openapi.mobile.json';
import { roleLimits } from '../experience';
import { HANDLE_PATTERN, limits } from '../limits';

type Schema = { properties: Record<string, { maxLength?: number; pattern?: string; items?: { maxLength?: number } }> };
const schemas = contract.components.schemas as unknown as Record<string, Schema>;
const profile = schemas.UpdateUserProfileDto.properties;
const fields = schemas.UpdateProfileFieldsDto.properties;

describe('the limits M8 enforces are the Hub contract’s, not the canvas’s', () => {
  it('a user is held to the Hub’s own bio, handle, name, location and social lengths', () => {
    expect(limits.bio).toBe(profile.bio.maxLength);
    expect(limits.handle).toBe(profile.handle.maxLength);
    expect(limits.namePart).toBe(profile.firstName.maxLength);
    expect(limits.namePart).toBe(profile.lastName.maxLength);
    expect(limits.location).toBe(fields.location.maxLength);
    expect(limits.socialHandle).toBe(profile.instagramHandle.maxLength);
    expect(limits.socialHandle).toBe(profile.xHandle.maxLength);
    expect(limits.socialHandle).toBe(profile.tiktokHandle.maxLength);
    expect(limits.socialHandle).toBe(fields.threadsHandle.maxLength);
    expect(limits.socialUrl).toBe(profile.youtubeUrl.maxLength);
    expect(limits.socialUrl).toBe(profile.facebookUrl.maxLength);
    expect(limits.socialUrl).toBe(profile.linkedinUrl.maxLength);
  });

  it('a user is held to the Hub’s own skill and role lengths (FIX-113)', () => {
    const role = schemas.CreateProfileExperienceDto.properties;
    expect(limits.skill).toBe(fields.skills.items?.maxLength);
    expect(roleLimits.title).toBe(role.title.maxLength);
    expect(roleLimits.company).toBe(role.company.maxLength);
    expect(roleLimits.location).toBe(role.location.maxLength);
    expect(roleLimits.description).toBe(role.description.maxLength);
  });

  it('a handle is checked with the contract’s pattern', () => {
    expect(HANDLE_PATTERN.source).toBe(profile.handle.pattern);
  });

  it('the bio is not capped at the 160 the canvas draws', () => {
    expect(limits.bio).not.toBe(160);
  });
});
