/*
  Handler serverless Vercel untuk seluruh LIRENXIN API (express monolith).

  - LIRENXIN_DIST=1 & LIRENXIN_RUNTIME_DIR -> autoload.ts memilih router hasil
    transpile di runtime/router dan config di runtime/danzz.
  - import runtime/server.cjs -> express app siap pakai (259 endpoint + /config
    + /health + static runtime/static + SPA fallback).
  - Side-effect imports -> memaksa tracing NFT memasukkan semua runtime deps
    node_modules ke dalam lambda (includeFiles tidak men-trace deps).
*/
process.env.LIRENXIN_DIST = '1';
process.env.LIRENXIN_RUNTIME_DIR = 'runtime';

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

const mod = await import('../runtime/server.cjs');

/*
  Interop ESM->CJS: karena esbuild emit `module.exports = __toCommonJS(...)`,
  cjs-module-lexer tak bisa bedah static -> ns.default = module.exports (object),
  dan app express ada di lapisan .default berikutnya.
*/
const candidates = [mod.default, mod.default?.default, mod];
const app = candidates.find(c => typeof c === 'function');

if (!app) {
  throw new Error(
    'Gagal menemukan express app di runtime/server.cjs. Keys: ' +
      JSON.stringify(Object.keys(mod.default || mod))
  );
}

export default async function handler(req, res) {
  return app(req, res);
}
