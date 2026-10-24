import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/** Shared by the Create tests: a fake Hub on `fetch`, a fake `XMLHttpRequest` for the upload, and a 390 wide frame. */
export type Answer = { status: number; body: unknown } | 'offline' | 'hang';
export type Sent = { method: string; path: string; body: unknown };

export const hub: { answers: Record<string, Answer>; sent: Sent[] } = { answers: {}, sent: [] };

export function installFetch() {
  hub.answers = {};
  hub.sent = [];
  globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(String(input), init);
    const url = new URL(request.url);
    const text = request.method === 'GET' ? '' : await request.text();
    hub.sent.push({ method: request.method, path: url.pathname, body: text ? JSON.parse(text) : undefined });
    const answer = hub.answers[`${request.method} ${url.pathname}`];
    if (!answer) return new Response(JSON.stringify({ statusCode: 404, message: 'Not Found', data: null }), { status: 404 });
    if (answer === 'offline') throw new TypeError('Network request failed');
    if (answer === 'hang') return new Promise<Response>(() => undefined);
    return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;
}

export const ok = (data: unknown) => ({ status: 200, body: { statusCode: 200, message: 'OK', data } });
export const refusal = (statusCode: number, message: string) => ({ status: statusCode, body: { statusCode, message, data: null } });

const MB = 1024 * 1024;
const fileRule = (types: string[], extensions: string[], maxBytes: number) => ({ contentTypes: types, extensions, maxBytes });
const same = { maxBytes: 512 * MB };
export const FORMATS = {
  formats: [
    { id: 'video', full: fileRule(['video/mp4', 'video/quicktime'], ['mp4', 'mov'], 512 * MB), preview: { kind: 'clip', ...fileRule(['video/mp4'], ['mp4'], same.maxBytes), seconds: null } },
    { id: 'course', full: fileRule(['video/mp4', 'application/pdf'], ['mp4', 'pdf'], 512 * MB), preview: { kind: 'lesson', ...fileRule(['video/mp4'], ['mp4'], same.maxBytes), seconds: null } },
    { id: 'audio', full: fileRule(['audio/mpeg', 'audio/wav'], ['mp3', 'wav'], 512 * MB), preview: { kind: 'clip', ...fileRule(['audio/mpeg', 'audio/wav'], ['mp3', 'wav'], 512 * MB), seconds: { min: 30, max: 60 } } },
    { id: 'pdf', full: fileRule(['application/pdf'], ['pdf'], 100 * MB), preview: { kind: 'extract', ...fileRule(['application/pdf'], ['pdf'], 100 * MB), seconds: null } },
    { id: 'image', full: fileRule(['image/png', 'image/jpeg'], ['png', 'jpg'], 512 * MB), preview: { kind: 'cover', ...fileRule(['image/png', 'image/jpeg'], ['png', 'jpg'], 512 * MB), seconds: null } },
    { id: 'template', full: fileRule(['application/zip'], ['zip'], 512 * MB), preview: { kind: 'cover', ...fileRule(['image/png'], ['png'], 512 * MB), seconds: null } },
  ],
};

export const allowance = (used: number, allowed: number, tickHeld = false) => ({
  tickHeld,
  uploads: { used, allowed, remaining: Math.max(0, allowed - used) },
  storage: { usedBytes: 0, limitBytes: 1024 * MB, remainingBytes: 1024 * MB },
  free: { uploads: 5, storageBytes: 1024 * MB },
  withTick: { uploads: 25, storageBytes: 10 * 1024 * MB },
});

export class ScriptedXhr {
  static last: ScriptedXhr | null = null;
  upload: { onprogress?: (e: { lengthComputable: boolean; loaded: number; total: number }) => void } = {};
  onload?: () => void;
  onerror?: () => void;
  onabort?: () => void;
  status = 0;
  url = '';
  headers: Record<string, string> = {};
  body: unknown;
  open(_method: string, url: string) {
    this.url = url;
  }
  setRequestHeader(name: string, value: string) {
    this.headers[name] = value;
  }
  send(body: unknown) {
    this.body = body;
    ScriptedXhr.last = this;
  }
  abort() {
    this.onabort?.();
  }
  progress(loaded: number, total: number) {
    this.upload.onprogress?.({ lengthComputable: true, loaded, total });
  }
  finish(status: number) {
    this.status = status;
    this.onload?.();
  }
}

export function installXhr() {
  ScriptedXhr.last = null;
  (globalThis as unknown as { XMLHttpRequest: unknown }).XMLHttpRequest = ScriptedXhr;
}

export const presigned = (folder: string, name: string) =>
  ok({ uploadUrl: `https://storage.test/put/${name}?sig=1`, key: `${folder}/u1/${name}`, fileUrl: `https://storage.test/${folder}/u1/${name}?read=1` });

export async function renderFrame(children: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false }, mutations: { retry: false } } });
  return await render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </SafeAreaProvider>,
  );
}

export const chosen = (name: string, contentType: string, bytes = 5, extra: Partial<{ blob: Blob; previewUri: string }> = {}) => ({
  blob: extra.blob ?? new Blob([new Uint8Array(bytes)]),
  name,
  contentType,
  extension: name.split('.').pop() ?? '',
  previewUri: extra.previewUri,
});
