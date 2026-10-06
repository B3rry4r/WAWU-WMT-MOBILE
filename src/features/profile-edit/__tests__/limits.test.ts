import contract from '../../../../contract/openapi.mobile.json';
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

  it('a handle is checked with the contract’s pattern', () => {
    expect(HANDLE_PATTERN.source).toBe(profile.handle.pattern);
  });

  it('the bio is not capped at the 160 the canvas draws', () => {
    expect(limits.bio).not.toBe(160);
  });
});
