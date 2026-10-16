import { FAILED, originOf, PDF_MAX_PAGES, PDFJS_WORKER, pdfPageHtml, READY } from '../reader/pdfPage';

const colors = { ground: 'rgba(0, 0, 0, 1)', paper: 'rgb(255, 255, 255)' };

describe('H4 · the page Android draws a PDF with', () => {
  it('writes the file address into the script as data, so an address can not end the script or add markup', () => {
    const html = pdfPageHtml('https://x.example/a.pdf?"</script><script>alert(1)</script>', colors);
    expect(html).not.toContain('</script><script>alert(1)');
    expect(html).toContain('\\u003c/script\\u003e');
    // The one script that is ours, then pdf.js: exactly two closing tags.
    expect(html.match(/<\/script>/g)).toHaveLength(2);
  });

  it('tells the app when it is ready and when it failed, with the words the app listens for', () => {
    const html = pdfPageHtml('https://x.example/a.pdf', colors);
    expect(html).toContain(JSON.stringify(READY));
    expect(html).toContain(JSON.stringify(FAILED));
    expect(html).toContain(JSON.stringify(PDFJS_WORKER));
  });

  it('fails at once, without waiting, when pdf.js did not load', () => {
    expect(pdfPageHtml('https://x.example/a.pdf', colors)).toContain('if (!window.pdfjsLib) { window.__pdfFailed(); return; }');
  });

  it('is a script a browser can parse', () => {
    const html = pdfPageHtml('https://x.example/a.pdf', colors);
    const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
    expect(scripts).toHaveLength(1);
    expect(() => new Function(scripts[0])).not.toThrow();
  });

  it('reads the origin a file is served from', () => {
    expect(originOf('https://files.example/books/a.pdf?x=1#p')).toBe('https://files.example');
    expect(originOf('http://localhost:7270/a.pdf')).toBe('http://localhost:7270');
    expect(originOf('file:///cache/a.pdf')).toBeNull();
    expect(originOf('/relative.pdf')).toBeNull();
  });
});

/**
 * Runs the page's own script against a small stand-in for the browser and pdf.js: a document that says it has
 * `numPages` pages. Returns what the page told the app and how many page boxes it built.
 */
async function runPage(numPages: unknown) {
  const html = pdfPageHtml('https://x.example/a.pdf', colors);
  const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1])[0];
  const posted: string[] = [];
  let built = 0;
  const root = {
    clientWidth: 390,
    appendChild: () => {
      built += 1;
      // A page that claims endless pages would build for ever; stop the stand-in so a mistake fails here, not hangs.
      if (built > 2000000) throw new Error('built far more pages than any file has');
    },
  };
  const document = { getElementById: () => root, createElement: () => ({ dataset: {}, style: {} }) };
  class Watcher {
    observe() {}
  }
  const first = { getViewport: () => ({ width: 100, height: 141 }) };
  const pdfjsLib = {
    GlobalWorkerOptions: {},
    getDocument: () => ({ promise: Promise.resolve({ numPages, getPage: async () => first }) }),
  };
  const win = { pdfjsLib, ReactNativeWebView: { postMessage: (m: string) => posted.push(m) }, devicePixelRatio: 2 };
  new Function('window', 'document', 'pdfjsLib', 'IntersectionObserver', script)(win, document, pdfjsLib, Watcher);
  await new Promise((resolve) => setTimeout(resolve, 0));
  return { posted, built: () => built };
}

describe('H4 · a file that claims a huge or broken page count can not hang the page', () => {
  it('builds no more than the cap for a file that claims a million pages, and still says it is ready', async () => {
    const page = await runPage(1000000);
    expect(page.posted).toEqual([READY]);
    expect(page.built()).toBeLessThanOrEqual(PDF_MAX_PAGES);
    expect(page.built()).toBe(PDF_MAX_PAGES);
  });

  it('keeps the cap above a 300-page book, which is read whole', async () => {
    const page = await runPage(300);
    expect(page.posted).toEqual([READY]);
    expect(page.built()).toBe(300);
  });

  it.each([0, -3, NaN, Infinity, undefined, '12'])('fails, so the app opens the phone viewer, when the file claims %p pages', async (claimed) => {
    const page = await runPage(claimed);
    expect(page.posted).toEqual([FAILED]);
    expect(page.built()).toBe(0);
  });
});
