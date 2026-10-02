/**
 * Where the app talks to, per environment. Both addresses are read from the
 * build's environment (see docs/BUILDS.md and docs/LOCAL.md in wawu-backend):
 *
 *   EXPO_PUBLIC_API_URL  the Hub API: https://api.wawuafrica.com
 *   EXPO_PUBLIC_ID_URL   WAWU ID, the sign-in service: https://id.wawuafrica.com
 *
 * These are the live services the web calls (wawu-backend deploy/README.md).
 * There is no staging server. Local work points `.env` at the local backend
 * (scripts/local/up.sh in wawu-backend). The fallbacks are the live
 * addresses, so an `eas update` published without the variables still
 * reaches the right servers.
 */
export const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.wawuafrica.com';
export const identityBaseUrl = process.env.EXPO_PUBLIC_ID_URL ?? 'https://id.wawuafrica.com';
