/**
 * Where the app talks to, per environment. Both addresses are read from the
 * build's environment (see docs/BUILDS.md and docs/LOCAL.md in wawu-backend):
 *
 *   EXPO_PUBLIC_API_URL  the Hub API (staging for development and testers,
 *                        production for store builds)
 *   EXPO_PUBLIC_ID_URL   WAWU ID, the sign-in service
 *
 * The `.invalid` fallbacks never resolve, so a build with no address fails
 * loudly instead of calling the wrong server.
 */
export const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL ?? 'https://staging.invalid';
export const identityBaseUrl = process.env.EXPO_PUBLIC_ID_URL ?? 'https://id.staging.invalid';
