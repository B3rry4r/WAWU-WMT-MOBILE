#!/usr/bin/env node
// WEBAPP-11 (R-131): writes the web app's manifest and home-screen icons into public/ (Expo copies public/ into dist/ on export).
// The icons are the app's own icon (app.json `icon`) resized; the colours are read from the theme tokens, never typed here.
// Run `npm run pwa` after the icon or the tokens change; src/__tests__/pwaManifest.test.ts fails when public/ is out of date.
const fs = require('fs');
const path = require('path');
const Jimp = require('jimp-compact');

const root = path.resolve(__dirname, '../..');
const app = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8')).expo;
const tokens = fs.readFileSync(path.join(root, 'src/theme/tokens.generated.ts'), 'utf8');

/** A colour token's value in one theme block of the generated tokens (`darkColors` or `lightColors`). */
function token(block, name) {
  const start = tokens.indexOf(`export const ${block}`);
  const m = new RegExp(`\\b${name}: "(#[0-9A-Fa-f]{6})"`).exec(tokens.slice(start));
  if (!m) throw new Error(`token ${block}.${name} not found`);
  return m[1];
}

const accent = token('lightColors', 'accent');
const background = token('darkColors', 'surfacePage');

async function main() {
  const out = path.join(root, 'public/pwa');
  fs.mkdirSync(out, { recursive: true });
  const src = await Jimp.read(path.join(root, app.icon));
  const write = async (img, name) => img.writeAsync(path.join(out, name));

  for (const size of [192, 512]) {
    await write(src.clone().resize(size, size), `icon-${size}.png`);
    // Maskable: the artwork inside the central 80% on the accent colour, so any mask shape keeps the whole mark.
    const inner = Math.round(size * 0.8);
    const base = new Jimp(size, size, Jimp.cssColorToHex(accent));
    base.composite(src.clone().resize(inner, inner), Math.round((size - inner) / 2), Math.round((size - inner) / 2));
    await write(base, `maskable-${size}.png`);
  }
  await write(src.clone().resize(180, 180), 'apple-touch-icon.png');

  const manifest = {
    name: app.name,
    short_name: 'Who Made This',
    description: 'A Nigerian creator marketplace with a wallet.',
    id: '/',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    theme_color: accent,
    background_color: background,
    icons: [
      { src: '/pwa/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/pwa/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/pwa/maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/pwa/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
  fs.writeFileSync(path.join(root, 'public/manifest.webmanifest'), `${JSON.stringify(manifest, null, 2)}\n`);

  const template = fs.readFileSync(path.join(root, 'node_modules/expo/node_modules/@expo/cli/static/template/index.html'), 'utf8');
  const head = `    <link rel="manifest" href="/manifest.webmanifest" />
    <meta name="theme-color" content="${accent}" />
    <link rel="apple-touch-icon" href="/pwa/apple-touch-icon.png" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-title" content="Who Made This" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
`;
  fs.writeFileSync(path.join(root, 'public/index.html'), template.replace('    <title>', `${head}    <title>`));
  console.log('public/ written:', accent, background);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
