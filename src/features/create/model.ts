import type { IconName } from '@/components/icon';

/** The six things a person can make, in the order M20 lists them. The ids are the Hub's `contentType` values. */
export const FORMAT_IDS = ['video', 'course', 'audio', 'pdf', 'image', 'template'] as const;
export type FormatId = (typeof FORMAT_IDS)[number];

/** One file type or size rule, as `GET /uploads/formats` serves it (the app never states one of its own). */
export type FileRule = { contentTypes: string[]; extensions: string[]; maxBytes: number };
export type PreviewRule = FileRule & { kind: 'clip' | 'lesson' | 'extract' | 'cover'; seconds: { min: number; max: number } | null };
export type FormatRule = { id: string; full: FileRule; preview: PreviewRule };

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
 * The line under a format's name on M20. The file types and the clip length come from the Hub's rule for the format
 * (a figure the Hub does not send is left out, not guessed); the rest is the canvas's own wording.
 */
export function formatHint(id: FormatId, rule: FormatRule | undefined): string {
  switch (id) {
    case 'video':
      return rule ? `${typesLine(rule.full.extensions)} · buyers see a clip` : 'Buyers see a clip';
    case 'course':
      return 'Lessons · the first is the preview';
    case 'audio': {
      const clip = rule?.preview.seconds ? `${secondsLine(rule.preview.seconds)} second clip` : 'buyers hear a clip';
      return rule ? `${typesLine(rule.full.extensions)} · ${clip}` : `Buyers hear a clip`;
    }
    case 'pdf':
      return 'Guides, ebooks · give away an extract';
    case 'image':
      return 'Art, photo sets, presets';
    case 'template':
      return 'Decks, patterns, files to reuse';
  }
}

/** M21's heading for each format ("Upload the full PDF"). */
export const uploadTitle = (id: FormatId): string =>
  ({ video: 'Upload the full video', course: 'Upload the course', audio: 'Upload the full audio', pdf: 'Upload the full PDF', image: 'Upload the full image', template: 'Upload the template' })[id];

/** M22's sentence under "Add a preview": what to upload as the part buyers see before paying. */
export function previewHint(rule: PreviewRule | undefined): string {
  const lead = 'Buyers see this before paying.';
  switch (rule?.kind) {
    case 'extract':
      return `${lead} For a PDF, upload the extract you want to give away.`;
    case 'clip':
      return rule.seconds ? `${lead} Upload a ${secondsLine(rule.seconds)} second clip.` : `${lead} Upload the clip you want to give away.`;
    case 'lesson':
      return `${lead} Upload the first lesson as the preview.`;
    case 'cover':
      return `${lead} Upload the cover they should see.`;
    default:
      return lead;
  }
}
