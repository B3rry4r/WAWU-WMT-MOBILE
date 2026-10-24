/** The types the Hub stores, by the extension a file is named with. Only the Hub's list (`GET /uploads/formats`) decides what is accepted. */
const BY_EXTENSION: Record<string, string> = {
  pdf: 'application/pdf',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  zip: 'application/zip',
  csv: 'text/csv',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};

/** Other names the same kind of file arrives under (a phone or a browser says `audio/x-wav`, `audio/mp3`). */
const ALIASES: Record<string, string> = {
  'audio/x-wav': 'audio/wav',
  'audio/wave': 'audio/wav',
  'audio/vnd.wave': 'audio/wav',
  'audio/mp3': 'audio/mpeg',
  'audio/x-mpeg': 'audio/mpeg',
  'image/jpg': 'image/jpeg',
  'application/x-zip-compressed': 'application/zip',
};

/** The file's extension without the dot, lower case, or an empty string. */
export function extensionOfName(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot < 0 ? '' : name.slice(dot + 1).toLowerCase();
}

/** The type a chosen file goes up as: what its picker reported, tidied, else what its name says. */
export function contentTypeFor(name: string, reported?: string | null): string {
  const tidy = (reported ?? '').toLowerCase().split(';')[0].trim();
  const named = BY_EXTENSION[extensionOfName(name)];
  if (!tidy || tidy === 'application/octet-stream') return named ?? tidy;
  return ALIASES[tidy] ?? tidy;
}
