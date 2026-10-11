/**
 * The few claims of the signed-in access token the claim feature reads: who the account is (`sub`), when WAWU ID
 * issued the token (`iat`, seconds) and which contact WAWU ID had proven then (`emailVerified`, `phoneVerified`).
 * Read for timing only. The Hub reads the same token itself and decides; nothing here grants or refuses anything.
 */
export type TokenClaims = {
  sub: string | null;
  /** Issue time in seconds, WAWU ID's clock. */
  iat: number | null;
  emailVerified: boolean;
  phoneVerified: boolean;
};

/** The claims of a WAWU ID access token (a JWT), or null when the text is not one that can be read. */
export function readClaims(accessToken: string | null | undefined): TokenClaims | null {
  const payload = accessToken?.split('.')[1];
  if (!payload) return null;
  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const raw: unknown = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')));
    if (typeof raw !== 'object' || raw === null) return null;
    const claims = raw as Record<string, unknown>;
    return {
      sub: typeof claims.sub === 'string' && claims.sub ? claims.sub : null,
      iat: typeof claims.iat === 'number' && Number.isFinite(claims.iat) ? claims.iat : null,
      emailVerified: claims.emailVerified === true,
      phoneVerified: claims.phoneVerified === true,
    };
  } catch {
    return null;
  }
}
