// usage: const part = eval(await readFile('_gen/buildAll.js')); await part('dark', 0, 4);
(async function part(theme, from, to) {
  const FLOWS = [['Wallet', 'wallet'], ['Home', 'home'], ['Inbox', 'inbox'], ['Explore', 'explore'], ['Me', 'me'], ['Services', 'services'], ['Professionals', 'pros'], ['Schools', 'schools'], ['Events', 'events'], ['Auth and KYC', 'auth'], ['Settings', 'settings'], ['Verify', 'verify'], ['Points', 'points'], ['Referral', 'referral']];
  if (!globalThis.LUCIDE) { const m = { exports: {} }; (new Function('module', 'exports', await readFile('_gen/lucide.min.js')))(m, m.exports); globalThis.LUCIDE = m.exports.icons; }
  const kitSrc = (await readFile('_gen/kit.js')).replace("${hot('light')}${hot('dark')}", '${hot(globalThis.__TH)}').replace('Each column is one screen: dark on top, light underneath. Arrows show what you tap to move on.', 'Each column is one screen. Arrows show what you tap to move on.').replace('contain-intrinsic-size:410px 1880px', 'contain-intrinsic-size:410px 1000px');
  globalThis.__TH = theme;
  const out = [];
  for (let f = from; f < Math.min(to, FLOWS.length); f++) {
    const [name, key] = FLOWS[f];
    const K = eval(kitSrc);
    const W = eval(await readFile('_gen/' + key + '.js'));
    const raw = W(K);
    const one = (s) => s.replace(/<sc-for list="\{\{ themes \}\}" as="t" hint-placeholder-count="2">([\s\S]*?)<\/sc-for>/g, (_, x) => x.split('{{ t }}').join(theme));
    const secs = raw.split('<sc-if value="{{ show.s').slice(1).map((p) => one(p.replace(/^\d+ \}\}" hint-placeholder-val="\{\{ \w+ \}\}">/, '').replace(/<\/sc-if>(<\/div>)?$/, '')));
    if (secs.some((s) => s.includes('{{'))) throw new Error('unresolved hole in ' + name);
    const head = `<section id="flow-${key}" style="display:flex;flex-direction:column;gap:10px;padding-top:40px;border-top:2px solid #111018"><div style="font-size:14px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#9411C9">Flow ${f + 1} of ${FLOWS.length}</div><h1 style="margin:0;font-size:72px;font-weight:700;letter-spacing:-0.045em;color:#111018;line-height:1">${name}</h1></section>`;
    out.push({ name, key, secs: [head + secs[0]].concat(secs.slice(1)) });
  }
  await saveFile(`_gen/all_${theme}_${from}.json`, JSON.stringify(out));
  return out.map((o) => o.name + ':' + o.secs.length).join(', ');
})
