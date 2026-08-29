/*
  Danzz For You 💌

  Beberapa router hasil port manggil CloudflareAi() sebagai prefix URL gateway
  Cloudflare Workers AI, tapi di source-nya fungsinya cuma `declare const`
  (hilang saat compile) -> ReferenceError begitu endpoint dipanggil.

  Di sini dibikin implementasi aslinya: pool gateway dipilih random, dan bisa
  ditimpa lewat env kalau gateway-nya mati atau mau pakai worker sendiri.

    CLOUDFLARE_AI_URL=https://worker-punyaku.workers.dev
*/
const POOL = [
    'https://wandering-darkness-6422.apis6.workers.dev',
    'https://sparkling-queen-1b32.apis1.workers.dev',
    'https://crimson-tooth-0977.proxyserver2.workers.dev',
    'https://orange-boat-30e1.apis3.workers.dev',
    'https://round-tree-4e29.apis7.workers.dev',
    'https://long-recipe-176d.apis4.workers.dev',
    'https://elkon.proxyserver1.workers.dev'
];

export const CloudflareAi = (): string =>
    process.env.CLOUDFLARE_AI_URL || POOL[Math.floor(Math.random() * POOL.length)];

export default CloudflareAi;
