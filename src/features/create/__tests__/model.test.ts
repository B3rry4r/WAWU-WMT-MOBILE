import { chosen as chosenFile } from '../__helpers__/harness';
import { refusalFor } from '../chosen';
import { getDraft, resetDraft, setFormat, setFull, setPreview } from '../draft';
import { contentTypeFor, extensionOfName } from '../fileTypes';
import { coverRequired, formatBytes, formatHint, previewHint, previewLine, previewWayOf, secondsLine, typesLine, type FormatRule } from '../model';
import { pdfPageCount } from '../pdfPages';

const MB = 1024 * 1024;
const rule = (id: string, ext: string[], seconds: { min: number; max: number } | null = null): FormatRule => ({
  id,
  full: { contentTypes: [], extensions: ext, maxBytes: 100 * MB },
  preview: { kind: 'clip', contentTypes: [], extensions: [], maxBytes: MB, seconds },
});

describe('the words on M20 come from the Hub rule', () => {
  it('names the file types in words', () => {
    expect(typesLine(['mp4', 'mov'])).toBe('MP4 or MOV');
    expect(typesLine(['pdf'])).toBe('PDF');
    expect(typesLine(['png', 'jpg', 'webp'])).toBe('PNG, JPG or WEBP');
  });

  it('a video row says the types the Hub lists, and follows the Hub when they change', () => {
    expect(formatHint('video', rule('video', ['mp4', 'mov']))).toBe('MP4 or MOV · buyers see a clip');
    expect(formatHint('video', rule('video', ['mp4']))).toBe('MP4 · buyers see a clip');
  });

  it('no row asks for a clip, a length or an extract: R-118 makes the preview for the creator', () => {
    // The Hub still lists a 30 to 60 second clip for audio (the web uploads one); the app no longer reads or states it.
    expect(formatHint('audio', rule('audio', ['mp3', 'wav'], { min: 30, max: 60 }))).toBe('MP3 or WAV · buyers hear a clip');
    expect(formatHint('audio', rule('audio', ['mp3', 'wav'], null))).toBe('MP3 or WAV · buyers hear a clip');
    expect(formatHint('pdf', undefined)).toBe('Guides, ebooks · buyers read the first pages');
    for (const id of ['video', 'course', 'audio', 'pdf', 'image', 'template'] as const) expect(formatHint(id, rule(id, ['x'], { min: 30, max: 60 }))).not.toMatch(/second|extract|upload/i);
  });

  it('sizes are read from bytes', () => {
    expect(formatBytes(100 * MB)).toBe('100 MB');
    expect(formatBytes(512 * MB)).toBe('512 MB');
    expect(formatBytes(1536 * MB)).toBe('1.5 GB');
    expect(secondsLine({ min: 30, max: 60 })).toBe('30–60');
  });

  it('the draft publish (VF12) still words its upload of a preview by the Hub rule', () => {
    const base = rule('pdf', ['pdf']).preview;
    expect(previewHint({ ...base, kind: 'extract' })).toBe('Buyers see this before paying. For a PDF, upload the extract you want to give away.');
    expect(previewHint({ ...base, kind: 'clip', seconds: { min: 30, max: 60 } })).toBe('Buyers see this before paying. Upload a 30–60 second clip.');
  });
});

describe('how each kind gets its preview (R-118): nobody uploads one', () => {
  const video = { contentType: 'video/mp4' };
  const doc = { contentType: 'application/pdf' };
  it('audio, video and a course with a video first lesson are cut, a PDF is made into pages, a picture is copied on the phone', () => {
    expect(previewWayOf('audio', null)).toBe('cut');
    expect(previewWayOf('video', video)).toBe('cut');
    expect(previewWayOf('course', video)).toBe('cut');
    expect(previewWayOf('pdf', doc)).toBe('pages');
    expect(previewWayOf('image', { contentType: 'image/png' })).toBe('copy');
  });
  it('a template, and a course whose first lesson is not a video, preview as their cover, which a paid one then needs', () => {
    expect(previewWayOf('template', { contentType: 'application/zip' })).toBe('cover');
    expect(previewWayOf('course', doc)).toBe('cover');
    expect(previewWayOf('course', null)).toBe('cover');
    expect(coverRequired('cover', false)).toBe(true);
    expect(coverRequired('cover', true)).toBe(false);
    expect(coverRequired('cut', false)).toBe(false);
    expect(coverRequired('pages', false)).toBe(false);
    expect(coverRequired('copy', false)).toBe(false);
  });
  it('the muted line says what the preview is, in one sentence each', () => {
    expect(previewLine('audio', 'cut')).toBe('Your preview is the first 30 seconds, made for you.');
    expect(previewLine('video', 'cut')).toBe('Your preview is the first 30 seconds, made for you.');
    expect(previewLine('course', 'cut')).toBe('Your preview is the first 30 seconds of your first lesson, made for you.');
    expect(previewLine('pdf', 'pages')).toBe('Your preview is the first pages, made for you.');
    expect(previewLine('image', 'copy')).toBe('Your preview is a smaller copy of your first picture.');
    expect(previewLine('template', 'cover')).toBe('Your cover is the preview buyers see. A cover is needed.');
    expect(previewLine('course', 'cover')).toBe('Your first lesson is not a video, so your cover is the preview. A cover is needed.');
  });
});

describe('a chosen file is checked against the Hub rule before it goes up', () => {
  const pdfRule = { contentTypes: ['application/pdf'], extensions: ['pdf'], maxBytes: 100 };
  it('passes a file that fits', () => {
    expect(refusalFor(chosenFile('a.pdf', 'application/pdf', 50), pdfRule)).toBeNull();
  });
  it('names the types when the type is wrong', () => {
    expect(refusalFor(chosenFile('a.mp4', 'video/mp4', 50), pdfRule)).toBe('That file type is not accepted here. Choose PDF.');
  });
  it('names the limit when the file is too big, and refuses an empty one', () => {
    expect(refusalFor(chosenFile('a.pdf', 'application/pdf', 101), { ...pdfRule, maxBytes: 100 * MB })).toBeNull();
    expect(refusalFor(chosenFile('a.pdf', 'application/pdf', 200), pdfRule)).toBe('That file is over the 1 KB limit.');
    expect(refusalFor(chosenFile('a.pdf', 'application/pdf', 0), pdfRule)).toBe('That file is empty. Choose another.');
  });
});

describe('file types', () => {
  it('uses the name when a phone reports no type, and tidies the names a browser uses', () => {
    expect(contentTypeFor('mix.WAV', 'application/octet-stream')).toBe('audio/wav');
    expect(contentTypeFor('mix.wav', 'audio/x-wav')).toBe('audio/wav');
    expect(contentTypeFor('song.mp3', 'audio/mp3')).toBe('audio/mpeg');
    expect(contentTypeFor('a.pdf', '')).toBe('application/pdf');
    expect(extensionOfName('a.b.PDF')).toBe('pdf');
    expect(extensionOfName('noext')).toBe('');
  });
});

describe('the draft', () => {
  beforeEach(resetDraft);
  const file = { name: 'a.pdf', bytes: 5, contentType: 'application/pdf', key: 'k', fileUrl: 'u' };
  it('keeps the files while the format stays, and starts again when it changes', () => {
    setFormat('pdf');
    setFull(file);
    setPreview(file);
    setFormat('pdf');
    expect(getDraft().full).toEqual(file);
    setFormat('audio');
    expect(getDraft()).toEqual({ format: 'audio', full: null, preview: null });
  });
  it('drops the preview when the full file goes', () => {
    setFormat('pdf');
    setFull(file);
    setPreview(file);
    setFull(null);
    expect(getDraft().preview).toBeNull();
  });
});

describe('page count', () => {
  const pdf = (body: string) => new TextEncoder().encode(`%PDF-1.4\n${body}\n%%EOF`);
  it('reads the total from the page tree root', () => {
    const bytes = pdf('1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n2 0 obj << /Type /Pages /Kids [3 0 R] /Count 12 >> endobj\n3 0 obj << /Type /Page /Parent 2 0 R >> endobj');
    expect(pdfPageCount(bytes)).toBe(12);
  });
  it('takes the root when the tree has branches', () => {
    const bytes = pdf('2 0 obj << /Type /Pages /Kids [4 0 R 5 0 R] /Count 9 >> endobj\n4 0 obj << /Type /Pages /Parent 2 0 R /Count 4 >> endobj');
    expect(pdfPageCount(bytes)).toBe(9);
  });
  it('says nothing when the file does not say', () => {
    expect(pdfPageCount(pdf('1 0 obj << /Type /Catalog >> endobj'))).toBeNull();
  });
});
