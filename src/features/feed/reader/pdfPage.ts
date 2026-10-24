/**
 * The page an Android WebView reads a PDF through. Android's WebView has no PDF viewer of its own
 * (iOS's has), so the pages are drawn by pdf.js. The page is loaded with the file's own address as its
 * base, so the file is fetched from the same origin and needs no CORS answer from the storage host.
 * Pages are drawn as they come near the screen and let go when they are far, so a long book stays light.
 * At most `PDF_MAX_PAGES` page boxes are built, and the reader gives up after `PDF_LOAD_TIMEOUT_MS`, so a
 * file that claims a huge page count (or never answers) ends in the phone's own viewer, not a spinner.
 */

/** Pinned: the last classic (non-module) build, which the WebView's script tag can load. */
export const PDFJS_VERSION = '3.11.174';
const CDN = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}`;
export const PDFJS_SCRIPT = `${CDN}/pdf.min.js`;
export const PDFJS_WORKER = `${CDN}/pdf.worker.min.js`;

/**
 * The most pages the page builds. A 300-page book is read whole, with room above it; a file that claims more (or
 * a corrupt one that claims millions) shows its first pages and no more, instead of building them all before it is ready.
 */
export const PDF_MAX_PAGES = 400;
/** How long the reader waits for the page to say it is ready or has failed before it opens the phone's own viewer instead. */
export const PDF_LOAD_TIMEOUT_MS = 45000;

/** What the page tells the app, through `ReactNativeWebView.postMessage`. */
export const READY = 'pdf:ready';
export const FAILED = 'pdf:failed';

/** A string written into a script: JSON, with the characters that could end the script tag written as escapes. */
function inScript(value: string): string {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}

/** The origin a file is served from, or null when the address is not a web address. */
export function originOf(uri: string): string | null {
  const match = /^(https?:\/\/[^/?#]+)/i.exec(uri);
  return match ? match[1] : null;
}

export type PdfPageColors = { ground: string; paper: string };

export function pdfPageHtml(uri: string, colors: PdfPageColors): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  html, body { margin: 0; padding: 0; background: ${colors.ground}; }
  #pages { display: flex; flex-direction: column; gap: 10px; padding: 0 0 24px; }
  .page { position: relative; width: 100%; background: ${colors.paper}; overflow: hidden; }
  .page canvas { display: block; width: 100%; height: auto; }
</style>
</head>
<body>
<div id="pages"></div>
<script src="${PDFJS_SCRIPT}"></script>
<script>
(function () {
  var url = ${inScript(uri)};
  var failed = false;
  function tell(message) {
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(message);
  }
  window.__pdfFailed = function () {
    if (failed) return;
    failed = true;
    tell(${inScript(FAILED)});
  };
  if (!window.pdfjsLib) { window.__pdfFailed(); return; }
  pdfjsLib.GlobalWorkerOptions.workerSrc = ${inScript(PDFJS_WORKER)};
  var root = document.getElementById('pages');
  var ratio = 1.414;
  var density = Math.min(window.devicePixelRatio || 1, 2);

  function render(el, doc) {
    if (el.__busy || el.__drawn) return;
    el.__busy = true;
    doc.getPage(Number(el.dataset.n)).then(function (page) {
      var base = page.getViewport({ scale: 1 });
      var scale = (root.clientWidth / base.width) * density;
      var view = page.getViewport({ scale: scale });
      var canvas = document.createElement('canvas');
      canvas.width = Math.floor(view.width);
      canvas.height = Math.floor(view.height);
      return page.render({ canvasContext: canvas.getContext('2d'), viewport: view }).promise.then(function () {
        el.innerHTML = '';
        el.appendChild(canvas);
        el.style.height = 'auto';
        el.__drawn = true;
      });
    }).catch(function () {}).then(function () { el.__busy = false; });
  }

  function release(el) {
    if (!el.__drawn) return;
    el.style.height = el.offsetHeight + 'px';
    el.innerHTML = '';
    el.__drawn = false;
  }

  pdfjsLib.getDocument({ url: url }).promise.then(function (doc) {
    // A count that is not a whole number of pages is a broken file: the phone's own viewer takes it.
    if (!(Number.isFinite(doc.numPages) && doc.numPages >= 1)) { window.__pdfFailed(); return; }
    var total = Math.min(Math.floor(doc.numPages), ${PDF_MAX_PAGES});
    return doc.getPage(1).then(function (first) {
      var base = first.getViewport({ scale: 1 });
      ratio = base.height / base.width;
      var watcher = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) render(entry.target, doc);
          else release(entry.target);
        });
      }, { rootMargin: '150% 0px' });
      for (var n = 1; n <= total; n += 1) {
        var el = document.createElement('div');
        el.className = 'page';
        el.dataset.n = String(n);
        el.style.height = Math.round(root.clientWidth * ratio) + 'px';
        root.appendChild(el);
        watcher.observe(el);
      }
      tell(${inScript(READY)});
    });
  }).catch(function () { window.__pdfFailed(); });
})();
</script>
</body>
</html>`;
}
