import { FAILED, originOf, PDFJS_WORKER, pdfPageHtml, READY } from '../reader/pdfPage';

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
