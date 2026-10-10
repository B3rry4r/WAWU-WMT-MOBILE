/**
 * What the Hub accepts on a featured work. The Hub (wawu-backend `src/user-profile/profile-works.ts`) is the
 * authority and still refuses what breaks these; they are written here once so M36 can say them in words before
 * Save, and stop a person at the edge instead of after a round trip. A change on the Hub is a change here.
 */
export const WORK_LIMITS = {
  /** Photos and videos on one work (`MAX_WORK_MEDIA`). */
  media: 8,
  /** Works on one profile (`MAX_WORKS`). */
  works: 50,
  /** Characters in each text field, counted after the trim (`WORK_*_MAX`). */
  title: 120,
  role: 80,
  client: 120,
  category: 40,
  link: 300,
} as const;

export type TextLimit = "title" | "role" | "client" | "category" | "link";
