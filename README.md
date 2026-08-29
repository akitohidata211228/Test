# LǐRénXīn API

REST API gratis berisi downloader, AI, anime, berita, games, info, search, stalker, dan tools. **285 endpoint** dalam 19 kategori, dokumentasi interaktif langsung di browser.

🔗 **[lirenxin-api.my.id](https://lirenxin-api.my.id)** · [Dokumentasi](https://lirenxin-api.my.id/docs)

---

## Kategori

| Kategori     | Jumlah | Isi                                                                     |
|--------------|--------|-------------------------------------------------------------------------|
| `search`     | 42     | Brave, Google Images, Pinterest (+ Lens), SoundCloud, Apple Music, Wikipedia, GSMArena, resep, dll |
| `tools`      | 37     | QR, TTS, translate, base64, binary, dewatermark, upscale, colorize, DNS, subdomain, kodepos, fake data, shorturl |
| `anime`      | 32     | Otakudesu, Samehadaku, Oploverz, Auratail, Anichin — search / detail / episode / download |
| `games`      | 24     | Tebak-tebakan: gambar, bendera, lagu, lirik, logo, kata, kimia, JKT48, Free Fire, family100, teka-teki |
| `primbon`    | 20     | Ramalan jodoh, arti nama, weton, nomor hoki, tafsir mimpi, zodiak       |
| `berita`     | 18     | CNN, CNBC, Antara, Kompas, Liputan6, Merdeka, Sindo, Suara, Tribun      |
| `download`   | 19     | AIO (TikTok/Douyin/YouTube/Bilibili), TikTok, YouTube (+MP3), Bilibili.tv, Twitter, GDrive, GitHub, SoundCloud, Lahelu |
| `ai`         | 15     | Gemini (+ lite), Bard, Flux text-to-image, PowerBrain, Muslim AI, Bible AI, Gita |
| `random`     | 14     | Gambar random per negara, Blue Archive, quotes anime, Lahelu, kucing    |
| `stalker`    | 14     | TikTok, YouTube, Twitter, Threads, Pinterest, GitHub, Roblox            |
| `cloudflare` | 10     | Workers AI: chat, translate, sentiment, embedding, image classification |
| `currency`   | 8      | Konversi fiat + crypto, daftar mata uang, kurs                          |
| `fun`        | 6      | Bahasa alay, fun fact, jagokata                                         |
| `iloveimg`   | 6      | Remove background, upscale, compress, blur face, konversi JPG/PNG       |
| `sticker`    | 6      | Sticker.ly (search + detail), Combot                                    |
| `apk`        | 4      | AN1, OpenAPK                                                            |
| `check`      | 4      | Cek resi, paket NPM                                                     |
| `maker`      | 3      | Brat generator, TextPro                                                 |
| `info`       | 3      | Cuaca, gempa BMKG, jadwal TV                                            |

Sebagian besar endpoint punya dua varian: `GET` (parameter di query) dan `POST` (parameter di body JSON). Keduanya jalan dari playground `/docs`.

Daftar lengkap ada di `src/config.json` atau langsung di halaman `/docs`.

---

## Menjalankan lokal

```bash
npm install
npm run dev          # ts-node, port 3000
```

Buka `http://localhost:3000`.

Script lain:

```bash
npm run typecheck    # tsc --noEmit, tanpa emit file
npm run build        # compile ke dist/ + copy asset
npm start            # jalankan hasil build
npm run dev:watch    # nodemon, restart otomatis
npm run pm2          # deploy pakai pm2 (VPS)
```

---

## AIO Downloader

`GET /api/download/aio?url=<link>` — satu endpoint, deteksi platform otomatis.

| Platform            | Engine                                     | Hasil                                |
|---------------------|--------------------------------------------|--------------------------------------|
| TikTok, Douyin      | `snaptik.fi` (video, slideshow foto, story)| no watermark, watermark, mp3, photos |
| YouTube             | delegasi ke `router/download/youtube.ts`   | mp4 720p                             |
| YouTube (`format=mp3`) | delegasi ke `router/download/ytmp3.ts`  | mp3                                  |
| Bilibili.tv / Bstation | delegasi ke `router/download/bilibili.ts` | DASH: video per kualitas (tanpa audio) + track audio |

Semua hasil dinormalisasi ke bentuk yang sama:

```json
{
  "status": true,
  "platform": "douyin",
  "type": "video",
  "title": "...",
  "author": "...",
  "duration": 13,
  "cover": "https://...",
  "medias": [
    { "type": "video", "label": "no watermark", "url": "https://..." },
    { "type": "audio", "label": "mp3", "url": "https://..." }
  ],
  "engine": "snaptik.fi (web)"
}
```

Link di luar daftar dibalas `400` beserta field `supported`. Platform yang didelegasikan mewarisi error dari handler aslinya apa adanya.

---

## Bilibili.tv Downloader

`GET|POST /api/download/bilibili?url=<link>` — bilibili.tv / Bstation.

Yang diterima: `/video/<aid>` (UGC), `/play/<season>/<ep>` (anime & film), short link (`b23.tv`, `bili.im`, `bili2233.cn`, …) yang di-resolve dulu, atau ID mentah.

| Param | Wajib | Isi |
|-------|-------|-----|
| `url` | ya | link, short link, atau ID |
| `quality` | tidak | saring satu kualitas: `144P` … `720P`, `1080P`, `1080P HD`, `1080P 60FPS`, `4K` |
| `cookie` | tidak | cookie akun premium; default dari env `BILIBILI_COOKIE` |
| `locale` | tidak | default `id_ID` |

Formatnya DASH, jadi **video dan audio terpisah** — tiap entri di `videos` belum ada suaranya:

```json
{
  "status": true,
  "data": {
    "platform": "bilibili.tv",
    "type": "ogv",
    "title": "Black Clover E1 - Asta dan Yuno",
    "duration": "23:56",
    "cookie_status": "none",
    "videos": { "480P": { "url": "https://...m4s", "size": "84.6 MB", "codec": "hevc" } },
    "locked_qualities": ["1080P HD", "1080P", "720P"],
    "audio": { "url": "https://...m4s", "size": "29.2 MB", "codec": "mp4a.40.2" },
    "headers": { "Referer": "https://www.bilibili.tv/" }
  }
}
```

Waktu mengunduh, header `Referer` itu **wajib** dikirim — CDN bilibili nolak request tanpa itu. Gabung dua file-nya sendiri, misal `ffmpeg -i video.m4s -i audio.m4s -c copy out.mp4`.

Kualitas 1080P ke atas hampir selalu masuk `locked_qualities` (butuh akun premium). Isi env `BILIBILI_COOKIE` atau kirim `?cookie=SESSDATA=...` untuk membukanya; field `cookie_status` menandai cookie-nya masih valid atau sudah kedaluwarsa. Kalau kontennya premium penuh, API balas `403` dengan pesan "Butuh login / premium", dan konten yang diblokir wilayah balas `451`.

---

## Endpoint hasil port dari apisku

124 file router di `router/` diadaptasi dari koleksi endpoint **[siputzx/apisku](https://github.com/siputzx/apisku)** — kredit scraper sepenuhnya ke siputzx, dan tiap file yang diambil tetap membawa header kreditnya. Aslinya jalan di Bun + Elysia; di sini dipakai apa adanya lewat adapter descriptor di `src/autoload.ts`.

Yang perlu ditambal supaya jalan di runtime Node/Express:

| Masalah di source | Penanganan di sini |
|-------------------|--------------------|
| `proxy()` cuma `declare const`, hilang saat compile → `ReferenceError` di 39 file | diimplementasikan di `src/proxy.ts` (default langsung ke sumber, bisa diarahkan lewat `PROXY_URL`) |
| `CloudflareAi()` sama persis, dipakai 9 file | diimplementasikan di `src/cfai.ts`, pool gateway bisa ditimpa lewat `CLOUDFLARE_AI_URL` |
| Handler balikin `Response` (Web API) untuk kirim gambar/audio | dibongkar jadi buffer + header di adapter `src/autoload.ts` |
| 34 error TypeScript yang lolos karena Bun cuma strip tipe tanpa cek | dibetulkan di 12 file, `npm run typecheck` bersih |

Yang **tidak** diambil, dan alasannya:

- endpoint yang butuh headless browser (solve Cloudflare Turnstile) — nggak jalan di Vercel: `musicapple`, `spotifyv2`, `skiplink`, `solver/turnstile`
- endpoint bertipe `multipart/form-data` (upload file) — server ini cuma pasang `express.json` + `urlencoded`, jadi 14 varian `POST` upload dilewati. Varian `GET`-nya yang pakai URL gambar tetap ada
- endpoint yang butuh `node-canvas` atau puppeteer/playwright (41 file) — dependency native/browser, terlalu berat untuk deploy serverless
- endpoint yang sudah ada di API ini (TikTok, Instagram, Facebook, games, info, cecan, brat, dll) — nggak diduplikasi

---

## Endpoint bawaan (non-API)

| Path      | Isi                                                                    |
|-----------|------------------------------------------------------------------------|
| `/`       | Landing page                                                           |
| `/docs`   | Dokumentasi + playground, bisa test endpoint dari browser              |
| `/donasi` | Halaman donasi QRIS                                                    |
| `/config` | Config publik + statistik (`endpoints`, `categories`, `uptimeSeconds`) |
| `/health` | Health check ringan untuk uptime monitor                               |

---

## Menambah endpoint

Route didaftarkan dari config, **bukan** dari scan folder. Dua langkah:

**1. Buat file handler** di `router/<kategori>/<nama>.ts`. Ada dua format, keduanya didukung:

```ts
// Format A — Express handler biasa
import { Request, Response } from "express";

export default async function handler(req: Request, res: Response) {
    res.json({ status: true, data: "hai" });
}
```

```ts
// Format B — descriptor, lebih deskriptif
export default [
    {
        metode: "GET",
        endpoint: "/api/tools/contoh",
        name: "Contoh",
        isPublic: true,
        isMaintenance: false,
        async run({ req }) {
            return { status: true, data: req.query.q };
        }
    }
];
```

Format B cukup `return` objeknya — `src/autoload.ts` yang mengurus status code, `isMaintenance` (503), dan `isPublic: false` (403). Kalau perlu balikin `Buffer` (gambar/audio), langsung `return` buffer-nya.

**2. Daftarkan di `src/config.json`** di dalam `tags`:

```json
"tools": [
    {
        "name": "Contoh",
        "endpoint": "/api/tools/contoh",
        "method": "GET",
        "filename": "contoh",
        "params": [
            { "name": "q", "required": true, "description": "Kata kunci" }
        ]
    }
]
```

`filename` menunjuk ke `router/<kategori>/<filename>.ts` tanpa ekstensi. `endpoint` **harus** sama dengan `endpoint` di descriptor kalau pakai Format B.

`params` cuma dipakai untuk generate form di `/docs` — validasi tetap tanggung jawab handler.

Config di-watch saat `dev`: ubah `config.json`, route langsung reload tanpa restart server.

---

## Struktur

```
index.ts              server, static, QRIS, /config, /health, 404
src/
  autoload.ts         registrasi route + hot reload + adapter descriptor
  config.json         daftar semua endpoint (sumber tunggal)
  qris.ts             generate QRIS dinamis dari QRIS statis
  proxy.ts            proxy opsional, dari env PROXY_URL
  cfai.ts             gateway Cloudflare Workers AI, dari env CLOUDFLARE_AI_URL
router/<kategori>/    file handler
public/
  landing.html        landing
  docs.html           dokumentasi + playground
  donasi.html         QRIS
  404.html            not found
  style.css           design token (warna, shadow, komponen) — satu sumber
  theme.js            light/dark, jalan sebelum paint pertama
  script.js           logic docs playground
```

---

## Environment

Semua opsional:

| Variable            | Fungsi                                            | Default |
|---------------------|---------------------------------------------------|---------|
| `PORT`              | Port server                                       | `3000`  |
| `PROXY_URL`         | Prefix proxy untuk endpoint yang butuh (BMKG, situs yang blokir IP server) | kosong  |
| `CLOUDFLARE_AI_URL` | Gateway Workers AI untuk kategori `cloudflare` + endpoint text-to-image | pool bawaan |
| `PINTEREST_TOKEN`   | Token API Pinterest untuk `/api/s/pinterest-lens` (opsional: `PINTEREST_COOKIE`) | kosong  |
| `BILIBILI_COOKIE`   | Cookie premium bilibili.tv untuk buka kualitas 1080P+ (`SESSDATA=...; bili_jct=...`) | kosong  |
| `YTMP3_MAX_POLL`    | Batas polling `/api/download/ytmp3` (×1.5 detik)  | `18`    |

QRIS diatur lewat `STATIC_QRIS` di `src/qris.ts`. Kalau belum diisi, `/api/create-payment` balas `503` dan halaman donasi tetap aman dibuka.

---

## Tema

`public/style.css` memegang semua token desain (`--brand`, `--surface`, `--shadow`, …). Dark mode aktif via `<html class="dark">`, yang di-set `theme.js` sebelum render supaya tidak ada kedipan putih. Ganti warna cukup di `:root` dan `html.dark` — semua halaman ikut, tidak perlu sentuh HTML.

`prefers-reduced-motion` dihormati; animasi dimatikan kalau OS minta.

---

## Deploy

**Vercel** — `vercel.json` sudah siap, semua request diarahkan ke `index.ts` lewat `@vercel/node`.

**VPS** — `npm run pm2`.

---

## Catatan

Endpoint scraping bergantung pada website pihak ketiga. Kalau situs sumbernya berubah struktur, mati, atau memblokir IP server, endpoint itu balas error meski kodenya benar.

### Audit 29 Agustus 2026

Semua endpoint `GET` ditembak dari dua tempat sekaligus (mesin lokal + produksi Vercel), yang gagal diuji ulang dengan parameter yang benar, lalu tiap host upstream-nya dicek DNS (lokal + Google DoH) dan status HTTP-nya. Hasilnya dipisah jadi empat sebab:

**Bug di sisi repo ini — diperbaiki, endpoint hidup lagi:**

| Endpoint | Sebab | Perbaikan |
|----------|-------|-----------|
| kategori `cloudflare` + `ai/flux` | 5 dari 7 gateway di pool `src/cfai.ts` mati (3 balas 404, 2 NXDOMAIN) → gagal acak tergantung gateway yang kepilih | pool dipangkas ke 2 gateway yang masih hidup |
| `/api/currency/list`, `/api/currency/rates`, `/api/currency/crypto/:symbol` | adapter descriptor cuma cocokkan `metode`, jadi 4 descriptor dalam satu file semuanya dilayani descriptor pertama | `src/autoload.ts` cocokkan `endpoint` dulu, baru `metode`; `crypto` juga baca path param |
| `/api/download/youtube` | engine lama (`iframe.y2meta-uk.com` + `cnv.cx`) balas 403 ke semua request | dipindah ke backend `ytmp3.mobi` yang sama dengan `/api/download/ytmp3` |
| `/api/download/tiktok` | `snaptik.app` nggak ngasih token lagi | dipindah ke engine `snaptik.fi` yang dipakai `/api/download/aio` |
| `/api/s/wikipedia` | tanpa User-Agent Wikimedia balas 403, dan selector `#mf-section-0` sudah nggak ada di markup baru | pakai MediaWiki API resmi (`action=query&prop=extracts`) |
| `/api/tools/dns` | `nslookup.io/api/v1/records` nggak nerima request dari luar situsnya | query langsung ke DNS-over-HTTPS Cloudflare/Google |
| `/api/r/cats` | `api.sefinek.net` rate-limit galak (403 sesudah request pertama) | pindah ke TheCatAPI |

**Upstream mati permanen — endpoint dihapus.** Host-nya NXDOMAIN global atau di-blackhole: `luminai.my.id`, `llm.siputzx.my.id`, `api.hika.fyi`, `api.waifu.pics`, `kbbi.kemdikbud.go.id` (penggantinya `kbbi.kemendikdasmen.go.id` sekarang pakai login wall), `tanggalan.com`, plus gateway Workers AI pihak ketiga yang dipakai belasan endpoint `ai/*`.

**Kontrak / markup upstream berubah — endpoint dihapus** karena butuh scraper baru, bukan tambalan: `apk/playstore`, `games/tebakkabupaten`, `games/tebakhewan`, `games/tebakheroml` (Cloudflare challenge), `imgedit/*` (`imgedit.ai` hidup tapi endpoint API-nya 404), `komikindo-*`, `anichin-*` (526), `samehadaku/release` + `search`, `download/facebook`, `download/instagram`, `download/rednote`, `d/capcut`, `d/spotify`, `d/snackvideo`, `d/pinterest`, `d/ytpost`, `s/duckduckgo`, `s/spotify`, `search/tiktok`, `r/neko`, `r/seegore`, `r/rumahmisteri`, `random/waifu`, `tools/ssweb`, `check/tagihanpln`, `berita/jkt48`, `get/ampreset`, `ai/cici`, `ai/metaai`, `ai/kimi`, `ai/felo`, `ai/gpt3`, `ai/teachanything`, dan sisanya — total **65 endpoint `GET` + 52 kembaran `POST`** dibuang dari `src/config.json`, 65 file router ikut dihapus. Kategori `get` dan `imgedit` jadi kosong dan dicabut.

Karena scraper `facebook`, `instagram`, dan `rednote` mati semua, `/api/download/aio` sekarang cuma menerima link TikTok, Douyin, dan YouTube — link lain dibalas `400` + daftar `supported`.

**Diblokir per-jaringan, bukan mati — tetap didaftarkan.** Sisa 169 endpoint `GET` diuji lagi: 163 sukses, 6 gagal cuma karena lingkungan tes. `ai/bard`, `ai/gemini`, dan `tools/ttsgoogle` gagal dari jaringan lokal (DNS Google dibajak ISP) tapi jalan di produksi; `stalk/tiktok` dan `tools/subdomains` sebaliknya; `s/pinterest-lens` butuh `PINTEREST_TOKEN` diisi di environment server. Endpoint semacam ini jangan dihapus cuma karena merah di satu tempat.

---

Dibuat oleh **[Akito Hidata](https://github.com/akitohidata211228)** · didedikasikan untuk Zhao Lusi 💌
