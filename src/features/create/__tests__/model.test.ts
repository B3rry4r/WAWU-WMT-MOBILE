import { chosen as chosenFile } from '../__helpers__/harness';
import { refusalFor } from '../chosen';
import { getDraft, resetDraft, setFormat, setFull, setPreview } from '../draft';
import { contentTypeFor, extensionOfName } from '../fileTypes';
import { formatBytes, formatHint, previewHint, secondsLine, typesLine, type FormatRule } from '../model';
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

  it('an audio row says the clip length the Hub asks, and leaves the figure out when the Hub sends none', () => {
    expect(formatHint('audio', rule('audio', ['mp3', 'wav'], { min: 30, max: 60 }))).toBe('MP3 or WAV · 30–60 second clip');
    expect(formatHint('audio', rule('audio', ['mp3', 'wav'], { min: 20, max: 20 }))).toBe('MP3 or WAV · 20 second clip');
    expect(formatHint('audio', rule('audio', ['mp3', 'wav'], null))).toBe('MP3 or WAV · buyers hear a clip');
  });

  it('sizes are read from bytes', () => {
    expect(formatBytes(100 * MB)).toBe('100 MB');
    expect(formatBytes(512 * MB)).toBe('512 MB');
    expect(formatBytes(1536 * MB)).toBe('1.5 GB');
    expect(secondsLine({ min: 30, max: 60 })).toBe('30–60');
  });

  it('the preview line follows the kind of preview and the clip length', () => {
    const base = rule('pdf', ['pdf']).preview;
    expect(previewHint({ ...base, kind: 'extract' })).toBe('Buyers see this before paying. For a PDF, upload the extract you want to give away.');
    expect(previewHint({ ...base, kind: 'clip', seconds: { min: 30, max: 60 } })).toBe('Buyers see this before paying. Upload a 30–60 second clip.');
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
