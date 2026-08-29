# LǐRénXīn API

REST API gratis berisi downloader, AI, anime, berita, games, info, search, stalker, dan tools. **400 endpoint** dalam 21 kategori, dokumentasi interaktif langsung di browser.

🔗 **[lirenxin-api.my.id](https://lirenxin-api.my.id)** · [Dokumentasi](https://lirenxin-api.my.id/docs)

---

## Kategori

| Kategori     | Jumlah | Isi                                                                     |
|--------------|--------|-------------------------------------------------------------------------|
| `ai`         | 64     | Gemini, Kimi, Meta AI, Llama 3.3, DeepSeek, Qwen, Blackbox, Felo, + text-to-image (Flux, MagicStudio, StabilityAI, SDXL) |
| `anime`      | 52     | Otakudesu, Samehadaku, Anichin, Oploverz, Auratail, Komikindo — search / detail / episode / download |
| `search`     | 49     | Brave, DuckDuckGo, Google Images, Pinterest (+ Lens), SoundCloud, Spotify, Apple Music, Wikipedia, KBBI, GSMArena, resep, dll |
| `tools`      | 38     | QR, TTS, translate, base64, binary, dewatermark, upscale, colorize, DNS, subdomain, kodepos, fake data, ssweb, shorturl |
| `download`   | 32     | AIO (semua platform), TikTok, Instagram, Facebook, YouTube (+MP3), Rednote, Twitter, CapCut, GDrive, SoundCloud, Spotify, Pinterest, GitHub |
| `games`      | 27     | Tebak-tebakan: bendera, kabupaten, JKT48, hero ML, dll                  |
| `random`     | 21     | Gambar random per negara, waifu, neko, kucing, Blue Archive, quotes anime |
| `berita`     | 20     | CNN, CNBC, Antara, Kompas, Liputan6, Merdeka, Sindo, Suara, Tribun, JKT48 |
| `primbon`    | 20     | Ramalan jodoh, arti nama, weton, nomor hoki, tafsir mimpi, zodiak       |
| `stalker`    | 16     | Instagram, TikTok, YouTube, Twitter, Threads, Pinterest, GitHub, Roblox |
| `cloudflare` | 12     | Workers AI: chat, translate, whisper, sentiment, embedding, image classification |
| `currency`   | 8      | Konversi fiat + crypto, daftar mata uang, kurs                          |
| `apk`        | 6      | Playstore, AN1, OpenAPK                                                 |
| `check`      | 6      | Cek resi, tagihan PLN, paket NPM                                        |
| `fun`        | 6      | Bahasa alay, fun fact, jagokata                                         |
| `iloveimg`   | 6      | Remove background, upscale, compress, blur face, konversi JPG/PNG       |
| `sticker`    | 6      | Sticker.ly (search + detail), Combot                                    |
| `info`       | 4      | Cuaca, gempa BMKG, hari libur nasional, jadwal TV                       |
| `maker`      | 3      | Brat generator, TextPro                                                 |
| `imgedit`    | 2      | Cartoon photo, face swap                                                |
| `get`        | 2      | Preset Alight Motion                                                    |

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
| Instagram           | delegasi ke `router/download/instagram.ts` | media utama                          |
| Facebook            | delegasi ke `router/download/facebook.ts`  | hd, sd                               |
| YouTube             | delegasi ke `router/download/youtube.ts`   | mp4 720p                             |
| YouTube (`format=mp3`) | delegasi ke `router/download/ytmp3.ts`  | mp3                                  |
| RedNote             | delegasi ke `router/download/rednote.ts`   | daftar media                         |

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

## Endpoint hasil port dari apisku

178 file router di `router/` diadaptasi dari koleksi endpoint **[siputzx/apisku](https://github.com/siputzx/apisku)** — kredit scraper sepenuhnya ke siputzx, dan tiap file yang diambil tetap membawa header kreditnya. Aslinya jalan di Bun + Elysia; di sini dipakai apa adanya lewat adapter descriptor di `src/autoload.ts`, jadi nggak ada scraper yang ditulis ulang.

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

Beberapa endpoint scraping bergantung pada website pihak ketiga. Kalau situs sumbernya berubah struktur atau memblokir IP server, endpoint itu bisa balas error meski kodenya benar.

Dari smoke test 156 endpoint `GET` yang punya contoh parameter, sekitar 90 balas sukses dan sisanya gagal di sisi sumber — bukan di kode: host mati (`luminai.my.id`), DNS diblokir dari jaringan lokal (`anichin.forum`, `kbbi.kemdikbud.go.id`), atau balas `403`/`429` ke IP yang dipakai waktu tes (Wikipedia, Spotify, DuckDuckGo, Instagram stalk). Hasilnya bisa beda dari IP server lain, jadi endpoint-nya tetap didaftarkan. Kalau ada yang mati permanen, hapus entry-nya di `src/config.json`.

---

Dibuat oleh **[Akito Hidata](https://github.com/akitohidata211228)** · didedikasikan untuk Zhao Lusi 💌
