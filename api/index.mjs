/*
  Handler serverless Vercel untuk seluruh LIRENXIN API (express monolith).

  - LIRENXIN_DIST=1        -> autoload.ts memilih baseDir dist/router (hasil transpile).
  - import dist/server.cjs -> express app siap pakai (259 endpoint + /config + /health).
  - Side-effect imports    -> memaksa tracing NFT memasukkan semua runtime deps
                              node_modules ke dalam lambda (includeFiles tidak men-trace deps).
*/
process.env.LIRENXIN_DIST = '1';

import 'axios';
import 'axios-cookiejar-support';
import 'buffer';
import 'cheerio';
import 'cookie';
import 'crypto-js';
import 'file-type';
import 'form-data';
import 'got';
import 'jimp';
import 'moment';
import 'needle';
import 'node-fetch';
import 'qrcode';
import 'qs';
import 'tough-cookie';
import 'uri-js';
import 'user-agents';
import '@faker-js/faker';
import 'express';

const mod = await import('../dist/server.cjs');

/*
  Interop ESM->CJS: karena esbuild emit `module.exports = __toCommonJS(...)`,
  cjs-module-lexer tak bisa bedah static -> ns.default = module.exports (object),
  dan app express ada di lapisan .default berikutnya.
*/
const candidates = [mod.default, mod.default?.default, mod];
const app = candidates.find(c => typeof c === 'function');

if (!app) {
  throw new Error(
    'Gagal menemukan express app di dist/server.cjs. Keys: ' +
      JSON.stringify(Object.keys(mod.default || mod))
  );
}

export default async function handler(req, res) {
  return app(req, res);
}
