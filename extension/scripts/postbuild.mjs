// Vite only bundles JS entries -- copy the files Chrome needs to actually
// load this as an extension (manifest, icons) into dist/ afterward.
import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = join(root, 'dist');

copyFileSync(join(root, 'manifest.json'), join(dist, 'manifest.json'));

const iconsDir = join(root, 'icons');
if (existsSync(iconsDir)) {
  const distIcons = join(dist, 'icons');
  mkdirSync(distIcons, { recursive: true });
  for (const file of readdirSync(iconsDir)) {
    copyFileSync(join(iconsDir, file), join(distIcons, file));
  }
}

console.log('postbuild: copied manifest.json' + (existsSync(iconsDir) ? ' + icons/' : ' (no icons/ yet)'));
