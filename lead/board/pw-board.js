// FOLDERS: reads LEAD_SCRATCH (the lead's working folder; default: a `scratch/` folder next to the repo).
// usage: node pw-board.js <playwright module path> [chromium path]; reads and writes $LEAD_SCRATCH/board/.
const PW = process.argv[2];
const { chromium } = require(PW);
(async () => {
  const path = require('path');
  const S = path.join(process.env.LEAD_SCRATCH || path.join(__dirname, '..', '..', '..', 'scratch'), 'board') + '/';
  const b = await chromium.launch({ executablePath: process.argv[3] || undefined, args: ['--no-sandbox'] });
  for (const [w, h, name] of [[390, 844, 'board-390.png'], [1280, 900, 'board-1280.png']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: 'dark' });
    const p = await ctx.newPage();
    await p.goto('file://' + S + 'board.html');
    await p.waitForTimeout(500);
    const sw = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth, h: document.documentElement.scrollHeight }));
    console.log(name, JSON.stringify(sw));
    await p.screenshot({ path: S + name, fullPage: true });
    await ctx.close();
  }
  await b.close();
})();
