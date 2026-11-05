import { build } from 'esbuild';
import { readdirSync, statSync, mkdirSync, copyFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Transpile seluruh router/*.ts proyek (gateway Danzz/Lirenxin, 169 file)
 * ke dist/router/**.js plus src/proxy.ts & src/cfai.ts ke dist/src/*.js —
 * supaya autoload (require runtime) jalan di produksi tanpa tsx.
 */
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

function collect(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) collect(full, out);
    else if (name.endsWith('.ts')) out.push(full);
  }
  return out;
}

const entryPoints = [
  ...collect(path.join(root, 'router')),
  path.join(root, 'src', 'proxy.ts'),
  path.join(root, 'src', 'cfai.ts'),
];

await build({
  entryPoints,
  outbase: root,
  outdir: path.join(root, 'dist'),
  bundle: false,
  platform: 'node',
  format: 'cjs',
  target: 'es2022',
  sourcemap: 'inline',
});

// Config untuk runtime prod (integrate.ts juga cek dist/danzz/config.json)
const distDanzzDir = path.join(root, 'dist', 'danzz');
mkdirSync(distDanzzDir, { recursive: true });
copyFileSync(path.join(here, 'danzz', 'config.json'), path.join(distDanzzDir, 'config.json'));

console.log(`[✓] bundleRouter: ${entryPoints.length} file router/menu util ter-transpile ke dist/`);
