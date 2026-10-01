// usage in run_script: const build = eval(await readFile('_gen/build.js')); await build('Wallet Flow.dc.html', '_gen/wallet.js', 'wallet');
(async function build(file, screensPath, key) {
  if (!globalThis.LUCIDE) { const m = { exports: {} }; (new Function('module', 'exports', await readFile('_gen/lucide.min.js')))(m, m.exports); globalThis.LUCIDE = m.exports.icons; }
  const K = eval(await readFile('_gen/kit.js'));
  const W = eval(await readFile(screensPath));
  const raw = W(K);
  const expand = (s) => s.replace(/<sc-for list="\{\{ themes \}\}" as="t" hint-placeholder-count="2">([\s\S]*?)<\/sc-for>/g, (_, x) => x.split('{{ t }}').join('dark') + x.split('{{ t }}').join('light'));
  const parts = raw.split('<sc-if value="{{ show.s');
  const head = parts[0].replace(/<sc-for list="\{\{ tabs \}\}"[\s\S]*$/, '');
  const secs = parts.slice(1).map((p) => expand(p.replace(/^\d+ \}\}" hint-placeholder-val="\{\{ \w+ \}\}">/, '').replace(/<\/sc-if>(<\/div>)?$/, '')));
  if (secs.some((s) => s.includes('{{'))) throw new Error('unresolved hole');
  await saveFile(file.replace('.dc.html', '.sections.json'), JSON.stringify(secs));
  const sw = '<sc-for list="{{ tabs }}" as="tb" hint-placeholder-count="' + K.names.length + '"><span onClick="{{ tb.go }}" style="height:40px;padding:0 18px;border-radius:999px;background:{{ tb.bg }};color:{{ tb.fg }};font-size:14.5px;font-weight:700;display:grid;place-items:center;cursor:pointer">{{ tb.label }}</span></sc-for></div>';
  const tpl = head + sw + '<div ref="{{ host }}" style="display:flex;flex-direction:column;gap:140px"></div></div>';
  const helmet = '<helmet><meta name="design_doc_mode" content="canvas"><script src="./ds-base.js"></script><style>html,body{margin:0;background:#E9E7EC !important;color:#111018;font-family:"Alan Sans",sans-serif;-webkit-font-smoothing:antialiased}*{box-sizing:border-box}a{color:#9411C9}a:hover{color:#810FAF}</style></helmet>';
  const js = `class Component extends DCLogic {
  static NAMES = ${JSON.stringify(K.names)};
  state = { sec: 1 };
  host = React.createRef();
  componentDidMount() { fetch('./' + \`${file.replace('.dc.html', '')}.sections.json\`.replace(/ /g, '%20')).then((r) => r.json()).then((s) => { Component.SECS = s; this.paint(); }); this.paint(); }
  componentDidUpdate() { this.paint(); }
  paint() { const el = this.host.current; if (!el || !Component.SECS || el.dataset.done) return; el.dataset.done = '1'; el.innerHTML = Component.SECS.map((_, i) => '<div data-slot="' + i + '" style="min-height:1400px"></div>').join(''); const fill = (d) => { if (d.dataset.filled) return; d.dataset.filled = '1'; d.innerHTML = Component.SECS[Number(d.dataset.slot)]; d.style.minHeight = ''; }; const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { fill(e.target); io.unobserve(e.target); } }), { rootMargin: '1200px' }); [...el.children].forEach((d, i) => { if (i === 0) fill(d); else io.observe(d); }); this.fill = fill; el.addEventListener('click', (e) => { const a = e.target.closest('a[href^="#"]'); if (!a) return; e.preventDefault(); [...el.children].forEach(fill); const t = document.getElementById(a.getAttribute('href').slice(1)); if (t) { const r = t.getBoundingClientRect(); window.scrollTo({ top: r.top + window.scrollY - 40, left: Math.max(0, r.left + window.scrollX - 90), behavior: 'auto' }); } }); }
  go(i) { const el = this.host.current; const s = el && el.children[i]; if (s && this.fill) { for (let j = 0; j <= i; j++) this.fill(el.children[j]); } if (s) { const y = s.getBoundingClientRect().top + window.scrollY - 40; window.scrollTo({ top: y, behavior: 'auto' }); } }
  renderVals() {
    const sec = this.state.sec;
    return { host: this.host, tabs: Component.NAMES.map((label, i) => ({ label, bg: '#FFFFFF', fg: '#111018', go: () => this.go(i) })) };
  }
}`;
  const out = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script src="./support.js"></script>
</head>
<body>
<x-dc>
${helmet}
${tpl}
</x-dc>
<script type="text/x-dc" data-dc-script>
${js}
</script>
</body>
</html>
`;
  await saveFile(file, out);
  return tpl.length;
})
