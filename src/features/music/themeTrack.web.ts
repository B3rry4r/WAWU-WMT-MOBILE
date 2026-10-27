/** R-99: the website's own track. */
export const THEME_URL = 'https://wawuafrica.com/wawu-theme.mp3';

/** The browser build keeps no file of its own (the browser caches the address), so there is no saved song to start from at open. */
export function savedTrack(): string | null {
  return null;
}

/** The browser plays the address itself; the first tap is what asks for it. */
export async function fetchTrack(): Promise<string> {
  return THEME_URL;
}
