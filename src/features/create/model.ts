import type { IconName } from '@/components/icon';

/** The six things a person can make, in the order M20 lists them. The ids are the Hub's `contentType` values. */
export const FORMAT_IDS = ['video', 'course', 'audio', 'pdf', 'image', 'template'] as const;
export type FormatId = (typeof FORMAT_IDS)[number];

/** One file type or size rule, as `GET /uploads/formats` serves it (the app never states one of its own). */
export type FileRule = { contentTypes: string[]; extensions: string[]; maxBytes: number };
export type PreviewRule = FileRule & { kind: 'clip' | 'lesson' | 'extract' | 'cover'; seconds: { min: number; max: number } | null };
export type FormatRule = { id: string; full: FileRule; preview: PreviewRule };

/**
 * R-118 (owner, 31 Oct 2026): nobody uploads a preview file for any kind. Step 3 is the cover step, and the preview of a PAID piece is made for
 * the creator (a FREE piece has none: the whole piece is open to everyone, R-8):
 *  - `cut`    audio and video: the Hub cuts the first 30 seconds of the full file; a course's, of its first lesson when that is a video;
 *  - `pages`  a PDF: the Hub makes the first pages of the full file;
 *  - `copy`   a picture: the phone makes a smaller copy of the creator's own picture and sends it;
 *  - `cover`  a template, and a course whose first lesson is not a video: the cover is the preview, so the cover is required.
 */
export type PreviewWay = 'cut' | 'pages' | 'copy' | 'cover';

/** What the full file is (a course's is its first lesson's), as far as the preview needs to know. */
export type FullKind = { contentType: string } | null;

export function previewWayOf(id: FormatId, full: FullKind): PreviewWay {
  switch (id) {
    case 'audio':
    case 'video':
      return 'cut';
    case 'pdf':
      return 'pages';
    case 'image':
      return 'copy';
    case 'course':
      return full?.contentType.startsWith('video/') ? 'cut' : 'cover';
    case 'template':
      return 'cover';
  }
}

/** What the Hub's cut takes, in seconds (its `PREVIEW_SECONDS`; a file under 45 seconds gets its first third). */
export const MADE_PREVIEW_SECONDS = 30;
/** The long edge of the smaller copy of a picture, and its JPEG quality (R-118). */
export const PICTURE_PREVIEW_SIDE = 640;
export const PICTURE_PREVIEW_QUALITY = 0.7;

/** The one muted line under "Add a cover": what the preview is, for a paid piece. A free piece has none (nothing is held back). */
export function previewLine(id: FormatId, way: PreviewWay): string {
  switch (way) {
    case 'cut':
      return id === 'course' ? `Your preview is the first ${MADE_PREVIEW_SECONDS} seconds of your first lesson, made for you.` : `Your preview is the first ${MADE_PREVIEW_SECONDS} seconds, made for you.`;
    case 'pages':
      return 'Your preview is the first pages, made for you.';
    case 'copy':
      return 'Your preview is a smaller copy of your first picture.';
    case 'cover':
      return id === 'course' ? 'Your first lesson is not a video, so your cover is the preview. A cover is needed.' : 'Your cover is the preview buyers see. A cover is needed.';
  }
}

/**
 * The muted line under "Add the lessons" (a course's step 2): what a buyer sees of the course before buying. It says the same words
 * as step 3 for the preview (R-118, the walk's F2), then what the Hub does with the lessons: with two or more, the first plays free
 * for anyone and the rest unlock when someone buys the course; a course of one has none free (`freeLessonCount` in the Hub's
 * `course-lessons.service.ts`). Until a first lesson's file is chosen it is taken to be a video, which is what a lesson is.
 */
export function lessonsLine(full: FullKind): string {
  const way: PreviewWay = full ? previewWayOf('course', full) : 'cut';
  const preview = way === 'cut' ? previewLine('course', 'cut') : 'Your first lesson is not a video, so your cover is the preview.';
  return `${preview} With two or more lessons, the first plays free and the rest unlock when someone buys the course.`;
}

/** The cover is the only preview a `cover` piece has, so a paid one cannot go on without it. */
export const coverRequired = (way: PreviewWay, free: boolean): boolean => way === 'cover' && !free;

/** The name and the picture of each format, as M20 draws them. The words after the dot on each row are `formatHint`. */
export const FORMATS: readonly { id: FormatId; label: string; icon: IconName }[] = [
  { id: 'video', label: 'Video', icon: 'Play' },
  { id: 'course', label: 'Course', icon: 'GraduationCap' },
  { id: 'audio', label: 'Audio', icon: 'AudioLines' },
  { id: 'pdf', label: 'PDF', icon: 'BookOpen' },
  { id: 'image', label: 'Image', icon: 'Image' },
  { id: 'template', label: 'Template', icon: 'LayoutTemplate' },
];

export const labelOf = (id: FormatId): string => FORMATS.find((f) => f.id === id)?.label ?? id;
export const iconOf = (id: FormatId): IconName => FORMATS.find((f) => f.id === id)?.icon ?? 'FileText';

/** `MP4 or MOV`, `PDF`, `PNG, JPG or WEBP`: the extensions the Hub lists, in words. */
export function typesLine(extensions: readonly string[]): string {
  const names = extensions.map((e) => e.toUpperCase());
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} or ${names[names.length - 1]}`;
}

/** `100 MB`, `1.5 GB`: a size read from the Hub's byte count. */
export function formatBytes(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  if (mb >= 1024) {
    const gb = mb / 1024;
    return `${Number.isInteger(gb) ? gb : gb.toFixed(1)} GB`;
  }
  if (mb >= 1) return `${Number.isInteger(mb) ? mb : mb.toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** `30–60`: the length the Hub asks of a clip. */
export const secondsLine = (s: { min: number; max: number }): string => (s.min === s.max ? `${s.min}` : `${s.min}–${s.max}`);

/**
 * The line under a format's name on M20. The file types come from the Hub's rule for the format (a figure the Hub does not send is
 * left out, not guessed). R-118: nobody uploads a preview, so no line asks for a clip or an extract; each says what buyers get.
 */
export function formatHint(id: FormatId, rule: FormatRule | undefined): string {
  switch (id) {
    case 'video':
      return rule ? `${typesLine(rule.full.extensions)} · buyers see a clip` : 'Buyers see a clip';
    case 'course':
      return 'Lessons · the first is the preview';
    case 'audio':
      return rule ? `${typesLine(rule.full.extensions)} · buyers hear a clip` : 'Buyers hear a clip';
    case 'pdf':
      return 'Guides, ebooks · buyers read the first pages';
    case 'image':
      return 'Art, photo sets, presets';
    case 'template':
      return 'Decks, patterns, files to reuse';
  }
}

/** M21's heading for each format ("Upload the full PDF"). */
export const uploadTitle = (id: FormatId): string =>
  ({ video: 'Upload the full video', course: 'Upload the course', audio: 'Upload the full audio', pdf: 'Upload the full PDF', image: 'Upload the full image', template: 'Upload the template' })[id];
