/*
  Danzz For You 💌

  Beberapa router hasil port manggil CloudflareAi() sebagai prefix URL gateway
  Cloudflare Workers AI, tapi di source-nya fungsinya cuma `declare const`
  (hilang saat compile) -> ReferenceError begitu endpoint dipanggil.

  Di sini dibikin implementasi aslinya: pool gateway dipilih random, dan bisa
  ditimpa lewat env kalau gateway-nya mati atau mau pakai worker sendiri.

    CLOUDFLARE_AI_URL=https://worker-punyaku.workers.dev
*/
/*
  Pool asli isi 7 gateway, tapi 29 Agustus 2026 cuma 2 yang masih hidup:
  3 balas 404 (worker-nya dihapus) dan 2 domainnya sudah NXDOMAIN. Yang mati
  dibuang, kalau nggak endpoint cloudflare/* + text-to-image gagal acak
  tergantung gateway mana yang kepilih.
*/
const POOL = [
    'https://sparkling-queen-1b32.apis1.workers.dev',
    'https://orange-boat-30e1.apis3.workers.dev'
];

export const CloudflareAi = (): string =>
    process.env.CLOUDFLARE_AI_URL || POOL[Math.floor(Math.random() * POOL.length)];

export default CloudflareAi;
