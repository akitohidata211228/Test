import { build } from 'esbuild';
import { readdirSync, statSync, mkdirSync, copyFileSync, cpSync, rmSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Transpile seluruh router/*.ts proyek (gateway Danzz/Lirenxin) ke
 * runtime/router/**.js, server/proxy.ts & server/cfai.ts ke runtime/server/*.js,
 * salin config ke runtime/danzz/config.json, dan salin hasil build vite (dist/)
 * ke runtime/static/ untuk fallback static di lingkungan serverless.
 *
 * Kenapa runtime/ bukan dist/: Vercel mengecualikan isi outputDirectory (dist)
 * dari bundel serverless function, jadi includeFiles "dist/**" tidak membawa
 * router/static. Folder runtime/ bukan outputDirectory -> aman di-include.
 */
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const runtimeDir = path.join(root, 'runtime');

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
  path.join(root, 'server', 'proxy.ts'),
  path.join(root, 'server', 'cfai.ts'),
];

// Bersihkan artefak runtime lama supaya tidak ada file basi.
rmSync(runtimeDir, { recursive: true, force: true });

await build({
  entryPoints,
  outbase: root,
  outdir: runtimeDir,
  bundle: false,
  platform: 'node',
  format: 'cjs',
  target: 'es2022',
  sourcemap: 'inline',
});

// Config untuk runtime prod (integrate.ts juga cek runtime/danzz/config.json)
const runtimeDanzzDir = path.join(runtimeDir, 'danzz');
mkdirSync(runtimeDanzzDir, { recursive: true });
copyFileSync(path.join(here, 'danzz', 'config.json'), path.join(runtimeDanzzDir, 'config.json'));

// Salin hasil build vite (dist/) ke runtime/static/ agar fungsi serverless
// bisa menyajikan halaman walau CDN statis tidak tersedia.
const distDir = path.join(root, 'dist');
const staticDir = path.join(runtimeDir, 'static');
if (existsSync(distDir)) {
  const skip = new Set(['server.cjs', 'server.cjs.map', 'router', 'src', 'danzz', 'server']);
  cpSync(distDir, staticDir, {
    recursive: true,
    filter: (src) => {
      const rel = path.relative(distDir, src);
      if (!rel) return true;
      return !skip.has(rel.split(path.sep)[0]);
    },
  });
}

console.log(
  `[✓] bundleRouter: ${entryPoints.length} file router/menu util ter-transpile ke runtime/` +
    (existsSync(staticDir) ? ' + static dist disalin ke runtime/static' : '')
);
