/*
  Proxy pencarian — Cloudflare Worker.

  KENAPA INI ADA
  IP datacenter (Azure VPS 40.81.18.4 maupun Vercel) diblokir semua mesin
  pencari gratis. Diukur 13 Sep 2026: DuckDuckGo lite balas HTTP 200 + 10 hasil
  untuk query PERTAMA dari VPS, lalu HTTP 202 "anomaly" (flag `is506:1`) untuk
  semua query sesudahnya dan belum pulih setelah 4 menit. Mojeek balas
  <title>Captcha</title>, Brave 429, Google halaman consent.

  Yang lebih halus: instance SearXNG yang masih hidup ternyata semuanya
  Bing-backed, dan Bing MEMBERI HASIL PALSU ke IP datacenter — query
  "siapa akito hidata" dijawab "cheap flights" dan "YouTube Help". Jadi
  scraping dari IP datacenter bukan cuma diblokir, tapi bisa DIBOHONGI tanpa
  error sama sekali. Itu sebabnya proxy ini perlu.

  Dibuktikan: request DDG yang sama lewat proxy publik balas 10 hasil bersih,
  0 anomaly. Jadi yang diblokir memang IP-nya, bukan cara request-nya.

  CARA DEPLOY (gratis, tanpa kartu kredit)
  1. Buka https://dash.cloudflare.com → Workers & Pages → Create → Worker
  2. Beri nama, misal `cari-proxy`, klik Deploy
  3. Klik "Edit code", hapus kode contohnya, tempel SELURUH isi file ini
  4. Deploy. Catat URL-nya, bentuknya https://cari-proxy.<akun>.workers.dev
  5. Kirim URL itu — nanti diisi ke env PROXY_URL di Vercel.

  Batas gratis: 100.000 request/hari. Fitur .google di bot tidak akan
  mendekati itu.

  KEAMANAN — kenapa ada daftar-izin host
  Proxy yang mau meneruskan ke SEMUA alamat itu proxy terbuka: siapa pun yang
  tahu URL-nya bisa memakai akunmu untuk menembak alamat mana saja, termasuk
  menyerang situs lain atau menembus jaringan internal. Akun Cloudflare-mu yang
  kena akibatnya. Worker ini HANYA mau meneruskan ke host mesin pencari yang
  didaftar di bawah; selain itu dijawab 403.
*/

// Hanya host ini yang boleh diteruskan. Tambah kalau perlu mesin baru.
const HOST_DIIZINKAN = new Set([
  'lite.duckduckgo.com',
  'html.duckduckgo.com',
  'duckduckgo.com',
  'links.duckduckgo.com',
  'www.mojeek.com',
  'mojeek.com',
  'search.marginalia.nu',
  'old-search.marginalia.nu',
]);

/*
  Header yang diteruskan ke mesin pencari. Header khas Cloudflare
  (cf-connecting-ip, x-forwarded-for, cf-ray) sengaja TIDAK diteruskan: kalau
  ikut terkirim, mesin pencari tahu request ini lewat proxy dan bisa kembali
  menolaknya — sia-sia seluruh gunanya Worker ini.
*/
const HEADER_DITERUSKAN = ['user-agent', 'accept', 'accept-language', 'referer', 'content-type'];

const UA_BAWAAN =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

function jawab(pesan, status) {
  return new Response(JSON.stringify({ ok: false, error: pesan }), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

export default {
  async fetch(request) {
    const masuk = new URL(request.url);

    // Halaman bantuan kalau dibuka langsung di browser.
    if (masuk.pathname === '/' && !masuk.search) {
      return new Response(
        'Proxy pencarian aktif.\n\n' +
          'Pakai: ' + masuk.origin + '/https://lite.duckduckgo.com/lite/?q=kata+kunci\n' +
          'atau : ' + masuk.origin + '/?url=<alamat-ter-encode>\n\n' +
          'Host yang diizinkan:\n' +
          [...HOST_DIIZINKAN].map((h) => '  - ' + h).join('\n') + '\n',
        { headers: { 'content-type': 'text/plain; charset=utf-8' } },
      );
    }

    /*
      Dua bentuk pemanggilan didukung:
        /?url=<encoded>              → dipakai kalau alamat tujuan di-encode
        /https://lite.duckduckgo...  → prefix polos, INI yang dipakai proxy()
                                        di src/proxy.ts (proxy() + url)
      Bentuk prefix harus menjaga query string tujuan apa adanya. masuk.search
      milik Worker sudah memuat `?q=...` tujuan, jadi cukup disambung kembali.
    */
    let tujuan = masuk.searchParams.get('url');
    if (tujuan) {
      try {
        tujuan = decodeURIComponent(tujuan);
      } catch {
        return jawab('Parameter url bukan encoding yang sah.', 400);
      }
    } else {
      const mentah = masuk.pathname.slice(1) + masuk.search;
      if (!/^https?:\/\//i.test(mentah)) {
        return jawab('Alamat tujuan harus diawali http:// atau https://', 400);
      }
      tujuan = mentah;
    }

    let url;
    try {
      url = new URL(tujuan);
    } catch {
      return jawab('Alamat tujuan tidak sah.', 400);
    }

    if (!HOST_DIIZINKAN.has(url.hostname)) {
      // Sengaja menyebut host yang ditolak supaya salah-pasang cepat kelihatan.
      return jawab(`Host tidak diizinkan: ${url.hostname}`, 403);
    }

    const header = new Headers();
    for (const nama of HEADER_DITERUSKAN) {
      const nilai = request.headers.get(nama);
      if (nilai) header.set(nama, nilai);
    }
    if (!header.has('user-agent')) header.set('user-agent', UA_BAWAAN);
    if (!header.has('accept-language')) header.set('accept-language', 'id-ID,id;q=0.9,en;q=0.8');

    try {
      const hasil = await fetch(url.toString(), {
        method: request.method === 'POST' ? 'POST' : 'GET',
        headers: header,
        body: request.method === 'POST' ? await request.text() : undefined,
        redirect: 'follow',
      });

      const keluar = new Headers();
      keluar.set(
        'content-type',
        hasil.headers.get('content-type') || 'text/html; charset=utf-8',
      );
      keluar.set('access-control-allow-origin', '*');
      // Jangan biarkan Cloudflare/perantara menyimpan hasil pencarian.
      keluar.set('cache-control', 'no-store');

      return new Response(hasil.body, { status: hasil.status, headers: keluar });
    } catch (e) {
      return jawab(`Gagal menghubungi tujuan: ${e && e.message ? e.message : 'tidak diketahui'}`, 502);
    }
  },
};
